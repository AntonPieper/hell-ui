// Packed-tarball consumer fixture runner.
//
// Fixtures are consumer scenarios checked in under
// tools/consumer-fixtures/<name>/: a fixture.json manifest and the src/ the
// scenario needs. Everything a real Angular consumer project also needs but
// no scenario varies — the workspace scaffolding in _base/ and the
// package.json around it — is owned by this runner and synthesized per run,
// so a fixture directory holds only what makes it that scenario.
//
// The runner builds and packs the library once, then for every fixture:
// materializes the project into a temp workspace (base overlay first, the
// fixture's own files on top), pins every dependency to the repo's tested
// version, installs the packed tarball with strict peers (never workspace
// links), compiles the fixture, and optionally runs one runtime smoke.
//
// Adding a fixture requires no runner changes: create a directory with a
// fixture.json manifest next to its src/. See
// tools/consumer-fixtures/README.md for the full contract.
//
// Two entry shapes share this module. `tools/run-consumer-fixture-shard.mjs`
// imports it and runs one shard's fixtures as a batch; a direct
// `node tools/check-consumer-fixtures.mjs [fixture...]` runs the named
// fixtures (or all of them) fail-fast.

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  auditPackedPackage,
  formatList,
  peerGroupContracts,
  resolvePackedTarball,
  uniqueSorted,
} from './package-pack-audit.mjs';
import {
  evaluateStyleBundleBudget,
  formatBytes,
  loadStyleBundleBudget,
  measureCompiledCss,
} from './style-bundle-benchmark.mjs';
import {
  readLockCatalogVersions,
  readWorkspaceCatalog,
  readWorkspaceOverrides,
} from './workspace-versions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = join(root, 'tools', 'consumer-fixtures');
const distHell = join(root, 'dist', 'hell');

const prebuiltTarballSelection = (process.env.HELL_PACKAGE_CONSUMER_TARBALL ?? '').trim() || null;
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const smokeEnabled = process.env.HELL_CONSUMER_FIXTURE_SMOKE === '1';

// Directories under tools/consumer-fixtures/ whose name starts with "_" hold
// shared material, not fixtures. _base/project/ is overlaid onto every
// workspace; _base/tailwind/ only onto workspaces whose composed dependencies
// include the style peer, so the no-Tailwind fixture gets no PostCSS config.
const sharedDirectoryPrefix = '_';
const baseProjectRoot = join(fixturesRoot, '_base', 'project');
const baseTailwindRoot = join(fixturesRoot, '_base', 'tailwind');
const stylePeerName = 'tailwindcss';

// The consumer manifest every fixture would otherwise repeat. The library
// itself is appended from the packed tarball's own name, and the fixture's
// manifest adds the dependencies that make it its scenario.
const fixturePackageScaffold = Object.freeze({
  private: true,
  type: 'module',
  scripts: Object.freeze({ build: 'ng build consumer --configuration production' }),
});
const commonFixtureDependencies = Object.freeze([
  '@angular/cdk',
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/forms',
  '@angular/platform-browser',
  '@floating-ui/dom',
  'ng-primitives',
  'rxjs',
  'tslib',
]);
const commonFixtureDevDependencies = Object.freeze([
  '@angular/build',
  '@angular/cli',
  '@angular/compiler-cli',
  'typescript',
]);
// The Tailwind/PostCSS build toolchain rides along with the style peer rather
// than being declared per fixture: a fixture that imports Hell stylesheets
// needs exactly this pair, and one that does not must not install it.
const stylePipelineDevDependencies = Object.freeze(['@tailwindcss/postcss', 'postcss']);

const manifestKeys = new Set([
  'description',
  'peerGroup',
  'dependencies',
  'cssSentinels',
  'forbiddenCssSentinels',
  'styleBundleBudget',
  'smoke',
]);

const copyExcludedDirectories = new Set(['node_modules', 'dist', '.angular', 'out-tsc']);
// fixture.json is the runner's input, not part of the consumer project, and a
// lockfile would pin what the runner exists to resolve.
const copyExcludedFiles = new Set(['fixture.json', 'pnpm-lock.yaml']);
const packagePeerContracts = Object.values(peerGroupContracts);
const allPackagePeerNames = new Set(packagePeerContracts.flatMap((contract) => contract.peers));
// The closed pool of peer-group markers: every package some peer group
// installs that another does not. A fixture's forbidden set is this pool minus
// its own group's peers, so each boundary proves the peers it does not need
// stay out of the install. Deriving it beats a hand-written list per fixture,
// which drifted: the core fixture forbade the table, editor, and pdf.js markers
// but not the icon or style peers its siblings forbade.
//
// The check matches the whole installed tree — node_modules plus a prefix scan
// of the .pnpm store — so a pool member that arrives transitively fails the
// fixture even though nothing declared it. Two facts make the full pool safe to
// forbid today, and a future pool member needs the same question asked of it:
//
//   - @angular/router is a peer of ng-primitives only through this repo's
//     pnpm-workspace.yaml packageExtensions. A fixture workspace inherits the
//     repo's `overrides` and nothing else, so the extension does not apply
//     there and no non-router fixture pulls the router in.
//   - tailwindcss travels with @tailwindcss/postcss, which depends on it. That
//     is why the PostCSS devDependencies are coupled to the style peer
//     (usesStylePipeline): a fixture without the peer installs neither, so
//     forbidding tailwindcss for the core boundary holds.
const optionalPackagePeerNames = uniqueSorted([...allPackagePeerNames]).filter((name) =>
  packagePeerContracts.some((contract) => !contract.peers.includes(name)),
);

// Semantic Theme Tokens are the one CSS fragment every fixture that emits CSS
// must carry: a stylesheet export that resolved from the packed tarball always
// pulls the token layer with it. Fixtures list only their scenario's
// sentinels on top of this.
const defaultCssSentinels = Object.freeze(['--color-hell-surface-muted:']);

// The one accepted size baseline for the compiled Default Style Bundle. A
// fixture opts into the gate with `styleBundleBudget: true`; the path is the
// runner's, so no fixture can point the gate at another file (or outside the
// fixture root) and measure a bundle the baseline was never taken from.
const styleBundleBudgetPath = join(fixturesRoot, 'style-bundle-budget.json');

const workspaceCatalog = readWorkspaceCatalog();
const workspaceOverrides = readWorkspaceOverrides();
const hasWorkspaceOverrides = Object.keys(workspaceOverrides).length > 0;
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
// Later sources win. The workspace catalog holds ranges, so the lockfile's
// resolved catalog versions overlay it: a range written into a fixture
// manifest re-resolves at install time, and the fixture drifts onto a
// release this repository has never tested.
const knownVersions = {
  ...(rootPackage.dependencies ?? {}),
  ...(rootPackage.devDependencies ?? {}),
  ...workspaceCatalog,
  ...readLockCatalogVersions(),
};

// Set once the packed package is known; every fixture is checked against the
// one tarball this run produced or was handed.
let packedTarball;
let packageName;
let packageVersion;

// Every runner failure unwinds as this error rather than exiting in place.
// process.exit() skipped the finally blocks that discard the temp workspaces,
// so a red run left its mkdtemp trees — hundreds of megabytes of fixture
// installs — behind in the temp directory.
class ConsumerFixtureFailure extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConsumerFixtureFailure';
  }
}

function fail(message) {
  throw new ConsumerFixtureFailure(message);
}

if (invokedDirectly()) await runCommandLine();

// The `node tools/check-consumer-fixtures.mjs [fixture...] [--skip-build]`
// entry: the named fixtures, or every fixture when none is named, stopping at
// the first failure.
async function runCommandLine() {
  const args = process.argv.slice(2);
  const named = args.filter((arg) => !arg.startsWith('--'));
  try {
    // A misspelled flag used to be dropped silently, so a run that was asked to
    // skip the build did it anyway and only the wall time said so.
    const unknownFlags = args.filter((arg) => arg.startsWith('--') && arg !== '--skip-build');
    if (unknownFlags.length) {
      fail(`Unknown option(s): ${formatList(unknownFlags)}; only --skip-build is supported`);
    }

    const failures = await runConsumerFixtures({
      names: named.length ? named : discoverFixtureNames(),
      skipPackageBuild: args.includes('--skip-build'),
    });
    if (failures.length) process.exit(1);
  } catch (error) {
    // Reached only after the unwind ran every cleanup, so exiting here is safe.
    reportRunnerError(error);
    process.exit(1);
  }
}

// True when this file is the script node was told to run, false when another
// module imported it. import.meta.main would say the same thing, but it is
// newer than the Node version CI pins.
function invokedDirectly() {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath) === fileURLToPath(import.meta.url);
}

export function reportRunnerError(error) {
  if (error instanceof ConsumerFixtureFailure) {
    console.error(`[consumer-fixtures] ${error.message}`);
    return;
  }
  // A crash in the runner itself still carries the prefix a log scan looks
  // for, followed by the full stack.
  console.error('[consumer-fixtures] unexpected error');
  console.error(error);
}

// Every fixture name, validated and sorted. Callers that need the set before
// running it — the CI shard deals them across parallel jobs — read it from
// here rather than re-implementing discovery.
export function discoverFixtureNames() {
  return discoverFixtures().map((fixture) => fixture.name);
}

// Runs `names` against one packed tarball and returns the fixtures that
// failed. A problem with the run itself — an unusable manifest, a tarball that
// does not audit — throws instead; that is not a fixture's verdict.
//
// `batch` is the CI shard mode: each fixture runs inside its own collapsible
// log section, a failing fixture never stops the ones after it, and a prebuilt
// tarball is mandatory — in CI the audited artifact the build job published is
// the only thing consumers are meant to test. Without it the run stops at the
// first broken fixture, which is what a local run or a single-fixture CI job
// wants.
export async function runConsumerFixtures({ names, skipPackageBuild = false, batch = false } = {}) {
  const selectedFixtures = selectFixtures(discoverFixtures(), names ?? []);
  for (const fixture of selectedFixtures) assertFixturePeerContract(fixture);

  if (batch && !prebuiltTarballSelection) {
    fail(
      'HELL_PACKAGE_CONSUMER_TARBALL must point at a packed tarball or a directory holding one. ' +
        'Locally: pnpm run ci:build:lib && pnpm run ci:pack:lib, then set it to artifacts/package.',
    );
  }
  // Checked after the tarball requirement so a misconfigured shard still fails
  // loudly, and before the pack so an empty shard does no work.
  if (!selectedFixtures.length) {
    console.log('[consumer-fixtures] ok: no fixtures selected');
    return [];
  }

  const packedPackage = preparePackedTarball(skipPackageBuild);
  packedTarball = packedPackage.tarball;
  const failures = [];
  try {
    let auditedPackedPackage;
    try {
      auditedPackedPackage = auditPackedPackage({ tarball: packedTarball });
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }

    packageName = auditedPackedPackage.packageJson.name;
    packageVersion = auditedPackedPackage.packageJson.version;
    if (!packageName || !packageVersion) {
      fail('Packed package.json is missing name or version');
    }

    for (const [position, fixture] of selectedFixtures.entries()) {
      let failure;
      openLogSection(batch, fixture);
      try {
        await runFixture(fixture);
      } catch (error) {
        failure = error;
      } finally {
        closeLogSection(batch, fixture);
      }

      // Verdicts land after the section closes, never inside it: a collapsed
      // section hides its own contents, so a red job whose failures were
      // reported inside showed nothing at top level but the trailing summary.
      if (!failure) {
        if (batch) console.log(`[consumer-fixtures] ok: ${fixture.name}`);
        continue;
      }
      failures.push(fixture.name);
      reportRunnerError(failure);
      console.error(`[consumer-fixtures] FAILED: ${fixture.name}`);

      if (batch) continue;
      // The direct entry stops here, so it says what it did not run rather
      // than leaving the summary's "1/N failed" to imply N-1 passed.
      const notRun = selectedFixtures.slice(position + 1).map((remaining) => remaining.name);
      if (notRun.length) {
        console.error(
          `[consumer-fixtures] stopping after the first failure; ${notRun.length} fixture(s) not run: ${notRun.join(', ')}`,
        );
      }
      break;
    }
  } finally {
    discardPackedPackage(packedPackage);
  }

  if (failures.length) {
    console.error(
      `[consumer-fixtures] ${failures.length}/${selectedFixtures.length} fixture(s) failed: ${failures.join(', ')}`,
    );
    return failures;
  }
  console.log(
    `[consumer-fixtures] ok: ${selectedFixtures.map((fixture) => fixture.name).join(', ')}`,
  );
  return failures;
}

function discoverFixtures() {
  if (!existsSync(fixturesRoot)) fail(`Fixture root missing: ${fixturesRoot}`);

  const discovered = [];
  for (const entry of readdirSync(fixturesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(sharedDirectoryPrefix)) continue;

    const dir = join(fixturesRoot, entry.name);
    const manifestPath = join(dir, 'fixture.json');
    if (!existsSync(manifestPath)) {
      fail(`Fixture ${entry.name} is missing its fixture.json manifest: ${manifestPath}`);
    }
    // A fixture name labels a collapsible CI log section, so a name that
    // cannot be labeled fails on the run that added it rather than corrupting
    // a job log later.
    if (!/^[A-Za-z0-9_.-]+$/.test(entry.name)) {
      fail(`Fixture directory name ${JSON.stringify(entry.name)} cannot label a log section`);
    }

    const fixture = {
      name: entry.name,
      dir,
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
    };
    assertFixtureManifest(fixture);
    discovered.push(fixture);
  }

  if (!discovered.length) fail(`No consumer fixtures found under ${fixturesRoot}`);
  return discovered.sort((a, b) => (a.name < b.name ? -1 : 1));
}

// The manifest is the fixture's whole declaration, so an unusable one fails
// discovery instead of being read past. Unknown keys fail too: a field the
// runner does not read is a promise the fixture is not keeping — a mistyped
// sentinel list would otherwise assert nothing.
function assertFixtureManifest(fixture) {
  const manifest = fixture.manifest;
  const unknown = Object.keys(manifest).filter((key) => !manifestKeys.has(key));
  if (unknown.length) {
    fail(
      `Fixture ${fixture.name} fixture.json has unknown key(s) ${formatList(unknown)}; supported keys are ${formatList([...manifestKeys])}`,
    );
  }
  if (typeof manifest.description !== 'string' || !manifest.description.trim()) {
    fail(`Fixture ${fixture.name} fixture.json needs a non-empty description`);
  }
  if (!(manifest.peerGroup in peerGroupContracts)) {
    fail(
      `Fixture ${fixture.name} fixture.json needs a peerGroup from tools/package-pack-audit.mjs, got ${JSON.stringify(manifest.peerGroup)}`,
    );
  }
  if ('styleBundleBudget' in manifest && manifest.styleBundleBudget !== true) {
    fail(
      `Fixture ${fixture.name} fixture.json styleBundleBudget is an opt-in flag; set it to true or drop it (the runner owns the budget file path)`,
    );
  }
  // Every list field gets the same shape check. A bare string passes
  // `manifest.cssSentinels ?? []` and then spreads to single characters, which
  // are found in any stylesheet — the fixture would assert nothing and say ok.
  const extraDependencies = assertManifestStringArray(fixture, 'dependencies');
  assertManifestStringArray(fixture, 'cssSentinels');
  assertManifestStringArray(fixture, 'forbiddenCssSentinels');

  for (const name of extraDependencies) {
    // Both sections, because a name the runner already puts in devDependencies
    // would otherwise land in this fixture's dependencies as well and install
    // twice over.
    if (commonFixtureDependencies.includes(name) || commonFixtureDevDependencies.includes(name)) {
      fail(
        `Fixture ${fixture.name} declares ${name}, which the runner already gives every fixture`,
      );
    }
    if (stylePipelineDevDependencies.includes(name)) {
      fail(
        `Fixture ${fixture.name} declares ${name}, which the runner adds with the ${stylePeerName} peer`,
      );
    }
  }
}

function assertManifestStringArray(fixture, key) {
  const value = fixture.manifest[key];
  if (value === undefined) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== 'string' || !entry.trim())
  ) {
    fail(
      `Fixture ${fixture.name} fixture.json ${key} must be an array of non-empty strings, got ${JSON.stringify(value)}`,
    );
  }
  return value;
}

function selectFixtures(allFixtures, names) {
  const byName = new Map(allFixtures.map((fixture) => [fixture.name, fixture]));
  const missing = names.filter((name) => !byName.has(name));
  if (missing.length) fail(`Unknown consumer fixture(s): ${missing.join(', ')}`);
  return [...new Set(names)].map((name) => byName.get(name));
}

// A fixture's composed dependencies must be exactly its peer group's package
// peers, so peer-tier guarantees (for example: the root/core contract needs no
// styling, icon, table, or feature peers) hold per boundary. The manifest
// declares the group and the extra dependencies separately; this is what
// keeps the two honest about each other.
function assertFixturePeerContract(fixture) {
  const groupName = fixture.manifest.peerGroup;
  const declaredPeers = fixtureDependencyNames(fixture).filter((name) =>
    allPackagePeerNames.has(name),
  );
  assertSameSet(
    `fixture ${fixture.name} peer group ${groupName}`,
    peerGroupContracts[groupName].peers,
    declaredPeers,
  );
}

// Every dependency the fixture's consumer manifest will declare except the
// library itself, whose name comes from the packed tarball.
function fixtureDependencyNames(fixture) {
  return uniqueSorted([...commonFixtureDependencies, ...(fixture.manifest.dependencies ?? [])]);
}

// The one question the style peer answers, asked in one place: it decides the
// PostCSS overlay, the PostCSS devDependencies, and whether the runner's token
// sentinel applies. All three have to agree — a fixture with the peer but no
// PostCSS config would build no Hell CSS, and one whose CSS went unprobed would
// prove nothing — so they read the same predicate rather than three lookalikes.
function usesStylePipeline(fixture) {
  return fixtureDependencyNames(fixture).includes(stylePeerName);
}

async function runFixture(fixture) {
  const label = `consumer-fixtures:${fixture.name}`;
  console.log(`[${label}] ${fixture.manifest.description}`);

  const workspace = mkdtempSync(join(tmpdir(), `hell-consumer-fixture-${fixture.name}-`));
  try {
    materializeFixtureWorkspace(fixture, workspace, label);
    writeWorkspaceOverrides(workspace);

    runPnpm(['install', '--strict-peer-dependencies', '--ignore-scripts'], workspace, label);
    assertInstalledFromTarball(fixture, workspace, label);
    assertForbiddenDependenciesNotInstalled(fixture, workspace, label);

    runPnpm(['run', 'build'], workspace, label);
    assertFixtureCssSentinels(fixture, workspace, label);
    assertFixtureStyleBundleBudget(fixture, workspace, label);
    await runFixtureSmoke(fixture, workspace, label);

    console.log(`[${label}] ok`);
  } finally {
    if (keep) console.log(`[${label}] kept ${workspace}`);
    else discardTempDirectory(workspace);
  }
}

// Cleanup runs in a finally, so a throw here would replace the failure that
// triggered it — losing the verdict to a temp-directory problem. A removal
// that fails is a warning; the run still reports what actually went wrong.
function discardTempDirectory(path) {
  try {
    rmSync(path, { force: true, recursive: true });
  } catch (error) {
    console.warn(
      `[consumer-fixtures] warning: could not remove ${path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

// Assembles the real consumer project the fixture describes: the shared
// workspace scaffolding, then the Tailwind/PostCSS config when the fixture
// installs the style peer, then the fixture's own files — which win on
// collision, so a scenario that needs a different angular.json or index.html
// simply checks one in. The synthesized package.json completes it, which is
// why HELL_KEEP_PACKAGE_CONSUMER=1 hands back a project that opens and builds
// on its own.
function materializeFixtureWorkspace(fixture, workspace, label) {
  const overlays = [baseProjectRoot];
  if (usesStylePipeline(fixture)) overlays.push(baseTailwindRoot);

  for (const overlay of overlays) {
    if (!existsSync(overlay)) fail(`Fixture base overlay missing: ${overlay}`);
    copyProjectFiles(overlay, workspace);
  }
  copyProjectFiles(fixture.dir, workspace);
  writeFixturePackageJson(fixture, workspace);

  console.log(
    `[${label}] materialized from ${overlays.map((overlay) => relative(fixturesRoot, overlay)).join(' + ')} + ${fixture.name}`,
  );
}

function copyProjectFiles(source, workspace) {
  cpSync(source, workspace, {
    recursive: true,
    filter: (candidate) => {
      const relativePath = relative(source, candidate);
      if (!relativePath) return true;
      const segments = relativePath.split(sep);
      if (segments.some((segment) => copyExcludedDirectories.has(segment))) return false;
      return !copyExcludedFiles.has(basename(relativePath));
    },
  });
}

// Composes the fixture's consumer manifest: the scaffold and the dependency
// set every fixture shares, the fixture's own extra dependencies, and the
// Tailwind/PostCSS toolchain when the style peer is among them. Every
// dependency is pinned to the repo's tested version and the library itself
// resolves to the packed tarball, so a fixture can never drift onto an
// untested dependency version or a workspace link.
function writeFixturePackageJson(fixture, workspace) {
  const dependencies = uniqueSorted([...fixtureDependencyNames(fixture), packageName]);
  const devDependencies = uniqueSorted([
    ...commonFixtureDevDependencies,
    ...(usesStylePipeline(fixture) ? stylePipelineDevDependencies : []),
  ]);

  const composed = {
    name: `hell-consumer-fixture-${fixture.name}`,
    ...fixturePackageScaffold,
    dependencies: pinDependencyVersions(dependencies),
    devDependencies: pinDependencyVersions(devDependencies),
  };
  if (hasWorkspaceOverrides) composed.pnpm = { overrides: workspaceOverrides };
  writeJson(join(workspace, 'package.json'), composed);
}

function pinDependencyVersions(names) {
  const pinned = {};
  for (const name of names) {
    pinned[name] =
      name === packageName ? pathToFileURL(packedTarball).href : resolveDependencyVersion(name);
  }
  return pinned;
}

function resolveDependencyVersion(name) {
  const exact = exactInstalledVersion(name);
  if (exact) return exact;

  if (!(name in knownVersions)) {
    fail(`Fixture dependency ${name} is not in the workspace catalog or root package.json`);
  }
  const version = knownVersions[name];
  if (typeof version !== 'string' || !version.trim()) {
    fail(
      `Fixture dependency ${name} is recorded in the workspace catalog or root package.json with ` +
        `an empty version (${JSON.stringify(version)}); the runner has no tested version to pin`,
    );
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    fail(
      `Fixture dependency ${name} resolves to "${version}", which is not an exact version. ` +
        'A range re-resolves at install time, so the fixture could drift onto an untested ' +
        'release; record the tested version where the runner can read it (the lockfile ' +
        'catalogs snapshot, an installed root dependency, or an exact root manifest entry).',
    );
  }
  return version;
}

function writeWorkspaceOverrides(workspace) {
  if (!hasWorkspaceOverrides) return;

  // pnpm >= 10.14 reads overrides from pnpm-workspace.yaml, not from
  // package.json "pnpm.overrides"; emit both so every toolchain applies the
  // repo's patched transitive versions.
  const overrideLines = Object.entries(workspaceOverrides)
    .map(([name, version]) => `  ${JSON.stringify(name)}: ${JSON.stringify(version)}`)
    .join('\n');
  writeFileSync(join(workspace, 'pnpm-workspace.yaml'), `overrides:\n${overrideLines}\n`);
}

function assertInstalledFromTarball(fixture, workspace, label) {
  const installedRoot = join(workspace, 'node_modules', ...packageName.split('/'));
  if (!existsSync(installedRoot)) {
    fail(`Fixture ${fixture.name} did not install ${packageName}`);
  }

  const realPath = realpathSync(installedRoot);
  const repoRealPath = realpathSync(root);
  if (realPath === repoRealPath || realPath.startsWith(`${repoRealPath}${sep}`)) {
    fail(
      `Fixture ${fixture.name} resolved ${packageName} to the repo checkout (${realPath}); it must install from the packed tarball`,
    );
  }

  const installedVersion = JSON.parse(
    readFileSync(join(installedRoot, 'package.json'), 'utf8'),
  ).version;
  if (installedVersion !== packageVersion) {
    fail(
      `Fixture ${fixture.name} installed ${packageName}@${installedVersion}, expected packed ${packageVersion}`,
    );
  }
  console.log(`[${label}] ok: ${packageName}@${installedVersion} installed from the packed tarball`);
}

// Every peer-group marker outside the fixture's own group must be absent —
// from node_modules and from the pnpm store, so a transitive leak counts too.
function assertForbiddenDependenciesNotInstalled(fixture, workspace, label) {
  const storeRoot = join(workspace, 'node_modules', '.pnpm');
  const storeExists = existsSync(storeRoot);
  const storeEntries = storeExists ? readdirSync(storeRoot) : [];
  // Said on every line rather than left implied: with no store to scan, the
  // absence claim covers node_modules only, which is a weaker statement than
  // the one this check normally makes.
  const scanned = storeExists ? '' : ' (node_modules only; no pnpm store to scan)';
  const contract = peerGroupContracts[fixture.manifest.peerGroup];
  const forbidden = optionalPackagePeerNames.filter((name) => !contract.peers.includes(name));

  for (const dependency of forbidden) {
    const dependencyPath = join(workspace, 'node_modules', dependency);
    if (existsSync(dependencyPath)) {
      fail(
        `Fixture ${fixture.name} must not install forbidden dependency ${dependency}; found ${dependencyPath}`,
      );
    }

    const storePrefix = `${dependency.replaceAll('/', '+')}@`;
    if (storeEntries.some((entry) => entry.startsWith(storePrefix))) {
      fail(
        `Fixture ${fixture.name} must not install forbidden dependency ${dependency}; found it in ${storeRoot}`,
      );
    }
    console.log(`[${label}] ok: forbidden dependency ${dependency} is not installed${scanned}`);
  }
}

// CSS sentinels are one or two distinctive fragments per imported stylesheet
// export. They prove the stylesheet resolved from the packed tarball and
// shipped compiled output; exhaustive fragment lists belong to unit tests,
// not the packaging boundary. Forbidden CSS sentinels are the inverse:
// distinctive markers of heavy/optional stylesheets that must never reach the
// built CSS unless the fixture selected them explicitly.
//
// The token sentinel every stylesheet export carries is the runner's, applied to
// every fixture that installs the style peer — which is also what makes CSS
// mandatory for those fixtures. Keying on the peer rather than on whether the
// build happened to emit bytes settles both directions: the no-CSS core
// boundary is exempt by contract instead of by the minifier happening to strip
// its comment-only stylesheet, and a style-peer fixture whose CSS came out
// empty fails instead of passing on a sentinel nothing checked.
function assertFixtureCssSentinels(fixture, workspace, label) {
  const declaredSentinels = fixture.manifest.cssSentinels ?? [];
  const forbiddenSentinels = fixture.manifest.forbiddenCssSentinels ?? [];
  const stylePipeline = usesStylePipeline(fixture);
  if (!stylePipeline && !declaredSentinels.length && !forbiddenSentinels.length) {
    console.log(`[${label}] ok: no style peer and no CSS sentinel declared, so none applies`);
    return;
  }

  const distRoot = join(workspace, 'dist');
  const cssFiles = existingFiles(distRoot).filter((file) => file.endsWith('.css'));
  const builtCss = normalizeCssForSentinels(
    cssFiles.map((file) => readFileSync(file, 'utf8')).join('\n'),
  );
  if (!builtCss) fail(`Fixture ${fixture.name} build did not emit CSS under ${distRoot}`);

  const sentinels = [...(stylePipeline ? defaultCssSentinels : []), ...declaredSentinels];
  const missing = sentinels.filter(
    (sentinel) => !builtCss.includes(normalizeCssForSentinels(sentinel)),
  );
  if (missing.length) {
    fail(
      `Fixture ${fixture.name} built CSS is missing sentinel(s): ${missing.join(' | ')}`,
    );
  }

  const present = forbiddenSentinels.filter((sentinel) =>
    builtCss.includes(normalizeCssForSentinels(sentinel)),
  );
  if (present.length) {
    fail(
      `Fixture ${fixture.name} built CSS contains forbidden sentinel(s): ${present.join(' | ')}`,
    );
  }

  console.log(
    `[${label}] ok: ${sentinels.length} CSS sentinel(s) present, ${forbiddenSentinels.length} absent`,
  );
}

function normalizeCssForSentinels(css) {
  return css.replace(/\s+/g, '');
}

// The style bundle size benchmark: a fixture that sets
// `styleBundleBudget: true` has every CSS byte its production build emitted
// measured — compiled and minified through the supported Tailwind/PostCSS
// path, never source files or an unprocessed concatenation — and gated against
// the accepted release budget in the runner's budget file, which names the
// fixture its baseline was measured from. Nothing is filtered or excluded from
// the measurement; the fixture's forbidden CSS sentinels are what prove
// heavy/optional styles stay out of the bundle being measured.
function assertFixtureStyleBundleBudget(fixture, workspace, label) {
  if (!fixture.manifest.styleBundleBudget) return;

  if (!existsSync(styleBundleBudgetPath)) {
    fail(`Fixture ${fixture.name} style bundle budget file is missing: ${styleBundleBudgetPath}`);
  }

  let budget;
  try {
    budget = loadStyleBundleBudget(styleBundleBudgetPath, fixture.name);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const distRoot = join(workspace, 'dist');
  const cssFiles = existingFiles(distRoot).filter((file) => file.endsWith('.css'));
  if (!cssFiles.length) {
    fail(`Fixture ${fixture.name} style bundle benchmark found no CSS under ${distRoot}`);
  }

  const measurement = measureCompiledCss(
    cssFiles.map((file) => ({ name: relative(distRoot, file), bytes: readFileSync(file) })),
  );
  for (const file of measurement.files) {
    console.log(
      `[${label}] style bundle ${file.name}: ${formatBytes(file.rawBytes)} raw, ${formatBytes(file.gzipBytes)} gzip`,
    );
  }
  console.log(
    `[${label}] style bundle total: ${formatBytes(measurement.rawBytes)} raw, ${formatBytes(measurement.gzipBytes)} gzip`,
  );

  const overBudget = evaluateStyleBundleBudget({ measurement, budget: budget.budget });
  if (overBudget.length) {
    fail(
      `Fixture ${fixture.name} compiled style bundle exceeds the accepted budget in ${relative(root, styleBundleBudgetPath)}: ` +
        `${overBudget.join('; ')}. If this increase is intentional, follow docs/release/style-bundle-budget.md ` +
        `to review it and update the baseline and budget together.`,
    );
  }
  console.log(
    `[${label}] ok: style bundle within budget (${formatBytes(budget.budget.maxRawBytes)} raw, ` +
      `${formatBytes(budget.budget.maxGzipBytes)} gzip allowed)`,
  );
}

async function runFixtureSmoke(fixture, workspace, label) {
  const smoke = fixture.manifest.smoke;
  if (!smoke) return;
  if (!smokeEnabled) {
    console.log(`[${label}] smoke declared but not enabled (set HELL_CONSUMER_FIXTURE_SMOKE=1)`);
    return;
  }

  const steps = resolveSmokeSteps(fixture, smoke);
  if (!steps.length) fail(`Fixture ${fixture.name} smoke declares no steps`);

  let chromium;
  let expect;
  try {
    ({ chromium, expect } = await import('@playwright/test'));
  } catch (error) {
    fail(
      `Fixture ${fixture.name} smoke requires @playwright/test: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const browserRoot = fixtureBrowserBuildRoot(fixture, workspace);
  const server = await startStaticServer(browserRoot);
  // Buffered, not streamed: a green smoke stays quiet, and a red one says
  // what the app actually did instead of only "expected text, found ''".
  const pageEvidence = [];
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', (message) =>
      pageEvidence.push(`console.${message.type()}: ${message.text()}`),
    );
    page.on('pageerror', (error) => pageEvidence.push(`pageerror: ${error.message}`));
    page.on('requestfailed', (request) =>
      pageEvidence.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`),
    );
    await page.goto(server.url, { waitUntil: 'networkidle' });

    for (const step of steps) {
      await assertSmokeStep(fixture, page, step, expect);
      console.log(`[${label}] smoke ok: ${describeSmokeStep(step)}`);
    }
  } catch (error) {
    // Both step kinds compose their own failure, naming the fixture, the
    // selector, and what they found, so those pass through untouched. The
    // evidence is for failures no step could describe: a launch or navigation
    // error, or an element that never appeared to read.
    if (error instanceof ConsumerFixtureFailure) throw error;

    fail(
      `Fixture ${fixture.name} smoke failed: ${
        error instanceof Error ? error.message : String(error)
      }${describeSmokeEvidence(pageEvidence, server.errors)}`,
    );
  } finally {
    if (browser) await browser.close();
    await server.close();
  }

  // Reported after the browser and server are down: an error the static server
  // raised while serving the app is a packaging failure even when no step
  // happened to observe it.
  if (server.errors.length) {
    fail(
      `Fixture ${fixture.name} smoke static server failed after start: ${server.errors.join('; ')}`,
    );
  }
}

// Printed only on a red smoke: what the app actually did, plus anything the
// static server reported while serving it.
function describeSmokeEvidence(pageEvidence, serverErrors) {
  const serverBlock = serverErrors.length
    ? `\nStatic server error(s):\n  ${serverErrors.join('\n  ')}`
    : '';
  const pageBlock = pageEvidence.length
    ? `\nPage evidence (last ${Math.min(pageEvidence.length, 40)} events):\n  ${pageEvidence
        .slice(-40)
        .join('\n  ')}`
    : '\nPage evidence: no console output, page errors, or failed requests recorded.';
  return `${serverBlock}${pageBlock}`;
}

// Smoke steps come inline (smoke.steps) or from a shared JSON file
// (smoke.stepsFile, resolved against the fixture directory). A shared steps
// file lets two fixtures assert byte-identical expectations — the aggregate
// and granular style-mode fixtures use one file so their computed-style
// equivalence is single-sourced rather than hand-duplicated.
function resolveSmokeSteps(fixture, smoke) {
  if (smoke.steps && smoke.stepsFile) {
    fail(`Fixture ${fixture.name} smoke must declare steps or stepsFile, not both`);
  }
  if (smoke.stepsFile) {
    const stepsPath = resolve(fixture.dir, smoke.stepsFile);
    if (!stepsPath.startsWith(`${fixturesRoot}${sep}`)) {
      fail(`Fixture ${fixture.name} smoke stepsFile must stay inside ${fixturesRoot}`);
    }
    if (!existsSync(stepsPath)) {
      fail(`Fixture ${fixture.name} smoke stepsFile is missing: ${stepsPath}`);
    }
    const steps = JSON.parse(readFileSync(stepsPath, 'utf8'));
    if (!Array.isArray(steps)) {
      fail(`Fixture ${fixture.name} smoke stepsFile must contain a JSON array of steps`);
    }
    return steps;
  }
  return smoke.steps ?? [];
}

// A smoke step asserts either projected text ({ selector, textIncludes }) or a
// resolved computed style ({ selector, computedStyle: { property, equals } });
// the computed form proves semantic token overrides survive the packed build.
async function assertSmokeStep(fixture, page, step, expect) {
  if (step.selector && step.textIncludes) return assertSmokeTextStep(fixture, page, step, expect);
  if (step.selector && step.computedStyle?.property && step.computedStyle.equals !== undefined) {
    return assertSmokeComputedStyleStep(fixture, page, step);
  }

  fail(
    `Fixture ${fixture.name} smoke steps need selector plus textIncludes or computedStyle {property, equals}`,
  );
}

async function assertSmokeTextStep(fixture, page, step, expect) {
  const locator = page.locator(step.selector);
  try {
    // The web-first assertion owns the retry loop the runner used to hand-roll.
    await expect(locator).toContainText(step.textIncludes, { timeout: 15_000 });
  } catch (assertionError) {
    // Playwright's own message would name the fixture twice and drop the text
    // it found, so the assertion is reshaped into the message CI has always
    // seen. An element that never appeared has no text to report: that stays a
    // foreign failure, carrying the page evidence, exactly as before.
    let lastText;
    try {
      lastText = (await locator.textContent({ timeout: 1_000 })) ?? '';
    } catch {
      throw assertionError;
    }
    fail(
      `Fixture ${fixture.name} smoke expected ${step.selector} to contain ${JSON.stringify(
        step.textIncludes,
      )} but found ${JSON.stringify(lastText)}`,
    );
  }
}

async function assertSmokeComputedStyleStep(fixture, page, step) {
  const { property, equals } = step.computedStyle;
  const locator = page.locator(step.selector);
  await locator.waitFor({ state: 'visible' });
  const actual = await locator.evaluate(
    (element, styleProperty) => getComputedStyle(element).getPropertyValue(styleProperty).trim(),
    property,
  );
  if (actual !== equals) {
    fail(
      `Fixture ${fixture.name} smoke expected ${step.selector} computed ${property}=${equals}, got ${actual}`,
    );
  }
}

function describeSmokeStep(step) {
  if (step.textIncludes !== undefined) {
    return `${step.selector} contains ${JSON.stringify(step.textIncludes)}`;
  }
  return `${step.selector} computed ${step.computedStyle.property} is ${JSON.stringify(step.computedStyle.equals)}`;
}

function fixtureBrowserBuildRoot(fixture, workspace) {
  const distRoot = join(workspace, 'dist');
  const indexPath = existingFiles(distRoot).find((file) => basename(file) === 'index.html');
  if (!indexPath) fail(`Fixture ${fixture.name} build did not emit index.html under ${distRoot}`);
  return dirname(indexPath);
}

function startStaticServer(staticRoot) {
  const absoluteRoot = resolve(staticRoot);
  const errors = [];
  const server = createServer((request, response) => {
    // Node routes a request-handler throw to neither the server's 'error' event
    // nor any caller: it is an uncaughtException, which would crash the run
    // past every cleanup. A malformed percent-escape in the path
    // (decodeURIComponent) and a file deleted between the stat and the read
    // both reach here, so the whole handler answers 500 and fails the fixture.
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      const requestedPath = decodeURIComponent(url.pathname);
      const target =
        requestedPath === '/'
          ? join(absoluteRoot, 'index.html')
          : resolve(absoluteRoot, `.${requestedPath}`);
      const targetIsFile =
        target.startsWith(absoluteRoot) && existsSync(target) && statSync(target).isFile();

      // Only extensionless paths get the SPA fallback. A missing asset must
      // fail as a missing asset: falling back would serve index.html labeled
      // with the asset's content type and turn a packaging hole into an opaque
      // parse error inside the smoke.
      if (!targetIsFile && extname(requestedPath) !== '') {
        console.error(`[consumer-fixtures] static server 404: ${requestedPath}`);
        response.writeHead(404, { 'content-type': 'text/plain' });
        response.end('not found');
        return;
      }

      const filePath = targetIsFile ? target : join(absoluteRoot, 'index.html');
      response.writeHead(200, { 'content-type': staticContentType(filePath) });
      response.end(readFileSync(filePath));
    } catch (error) {
      errors.push(
        `request ${request.url}: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (response.writableEnded) return;
      if (!response.headersSent) response.writeHead(500, { 'content-type': 'text/plain' });
      response.end('static server failed');
    }
  });

  // A server 'error' with no listener is an uncaught exception, so the handler
  // stays attached for the server's whole life: an error raised after listen
  // fails the fixture through `errors` instead of crashing the run.
  return new Promise((resolveServer, reject) => {
    let listening = false;
    server.on('error', (error) => {
      if (!listening) {
        reject(error);
        return;
      }
      errors.push(error instanceof Error ? error.message : String(error));
    });
    server.listen(0, '127.0.0.1', () => {
      listening = true;
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Static server did not expose a TCP address.'));
        return;
      }
      resolveServer({
        url: `http://127.0.0.1:${address.port}/`,
        errors,
        close: () =>
          new Promise((resolveClose) => {
            server.close(() => resolveClose());
          }),
      });
    });
  });
}

function staticContentType(filePath) {
  switch (extname(filePath)) {
    case '.css':
      return 'text/css; charset=utf-8';
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function existingFiles(rootPath) {
  if (!existsSync(rootPath)) return [];

  return readdirSync(rootPath, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}

// Collapsible per-fixture log sections, so a batch run's log opens as one line
// per fixture. GitLab reads the marker protocol; anywhere else a plain header
// keeps the same shape readable.
function openLogSection(batch, fixture) {
  if (!batch) return;
  if (process.env.GITLAB_CI !== 'true') {
    console.log(`[consumer-fixtures] --- consumer fixture ${fixture.name} ---`);
    return;
  }
  console.log(
    `\x1b[0Ksection_start:${unixTime()}:fixture_${fixture.name}[collapsed=true]\r\x1b[0Kconsumer fixture ${fixture.name}`,
  );
}

function closeLogSection(batch, fixture) {
  if (!batch || process.env.GITLAB_CI !== 'true') return;
  console.log(`\x1b[0Ksection_end:${unixTime()}:fixture_${fixture.name}\r\x1b[0K`);
}

function unixTime() {
  return Math.floor(Date.now() / 1000);
}

function preparePackedTarball(skipPackageBuild) {
  if (prebuiltTarballSelection) {
    let tarball;
    try {
      tarball = resolvePackedTarball(prebuiltTarballSelection);
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
    console.log(
      `[consumer-fixtures] using prebuilt packed tarball ${tarball}; skipping build:lib and pack`,
    );
    return { root: null, tarball };
  }

  if (skipPackageBuild) {
    console.log('[consumer-fixtures] using prebuilt packages from dist; skipping build:lib');
  } else {
    runPnpm(['run', 'build:lib'], root, 'build-lib');
  }

  if (!existsSync(join(distHell, 'package.json'))) {
    fail(`Built package missing: ${distHell}`);
  }

  const packRoot = mkdtempSync(join(tmpdir(), 'hell-consumer-fixtures-pack-'));
  try {
    runPnpm(['pack', '--pack-destination', packRoot], distHell, 'pack');
    const tarballName = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
    if (!tarballName) fail(`Packed package missing in ${packRoot}`);
    return { root: packRoot, tarball: join(packRoot, tarballName) };
  } catch (error) {
    // The caller's finally only covers a packed package it was handed.
    discardPackedPackage({ root: packRoot });
    throw error;
  }
}

function discardPackedPackage(packedPackage) {
  // A prebuilt tarball belongs to the caller; leave it in place.
  if (!packedPackage.root) return;
  if (keep) {
    console.log(`[consumer-fixtures] kept packed package ${packedPackage.root}`);
    return;
  }
  discardTempDirectory(packedPackage.root);
}

function exactInstalledVersion(name) {
  const packageJsonPath = join(root, 'node_modules', name, 'package.json');
  if (!existsSync(packageJsonPath)) return null;

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version ? packageJson.version : null;
}

function assertSameSet(label, expected, actual) {
  const expectedList = uniqueSorted(expected);
  const actualList = uniqueSorted(actual);
  if (
    expectedList.length === actualList.length &&
    expectedList.every((value, index) => value === actualList[index])
  ) {
    return;
  }

  fail(`${label} expected ${formatList(expectedList)} but found ${formatList(actualList)}`);
}

function runPnpm(pnpmArgs, cwd, label) {
  console.log(`[${label}] pnpm ${pnpmArgs.join(' ')}`);
  console.log(`[${label}] cwd: ${cwd}`);
  const result = spawnSync('pnpm', pnpmArgs, {
    cwd,
    env: pnpmCommandEnvironment(),
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(`pnpm ${pnpmArgs.join(' ')} failed with status ${result.status} in ${cwd}`);
  }
}

function pnpmCommandEnvironment() {
  const env = { ...process.env, CI: 'true' };
  const deniedPnpmKeys = new Set([
    'pnpm_config_npm_globalconfig',
    'pnpm_config_verify_deps_before_run',
    'pnpm_config__jsr_registry',
  ]);

  for (const key of Object.keys(env)) {
    const normalized = key.toLowerCase();
    if (normalized.startsWith('npm_') || deniedPnpmKeys.has(normalized)) delete env[key];
  }

  // The scrub keeps the parent `pnpm run` context out of fixture installs,
  // but the store location is infrastructure, not context: without it CI's
  // cached store goes unused and every shard re-downloads the dependency
  // tree from the registry. Probed and rejected as the replacement: pnpm's
  // `--config.store-dir=` flag only works ahead of the subcommand, and
  // `pnpm run <script> --config.store-dir=…` forwards it into the script
  // instead, so the env var stays.
  if (process.env.npm_config_store_dir) {
    env.npm_config_store_dir = process.env.npm_config_store_dir;
  }

  return env;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
