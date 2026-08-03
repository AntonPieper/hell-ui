// Packed-tarball consumer fixture runner.
//
// Fixtures are real consumer projects checked in under
// tools/consumer-fixtures/<name>/. The runner builds and packs the library
// once, then for every fixture: copies the project to a temp workspace,
// pins the fixture's declared dependencies to the repo's tested versions,
// installs the packed tarball with strict peers (never workspace links),
// compiles the fixture, and optionally runs one runtime smoke.
//
// Adding a fixture requires no runner changes: create a directory with a
// fixture.json manifest next to the project files. See
// tools/consumer-fixtures/README.md for the full contract.

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

const args = process.argv.slice(2);
const prebuiltTarballSelection = (process.env.HELL_PACKAGE_CONSUMER_TARBALL ?? '').trim() || null;
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const skipPackageBuild = args.includes('--skip-build');
const smokeEnabled = process.env.HELL_CONSUMER_FIXTURE_SMOKE === '1';
const selectedNames = args.filter((arg) => !arg.startsWith('--'));

const copyExcludedDirectories = new Set(['node_modules', 'dist', '.angular', 'out-tsc']);
const allPackagePeerNames = new Set(
  Object.values(peerGroupContracts).flatMap((contract) => contract.peers),
);

const workspaceCatalog = readWorkspaceCatalog();
const workspaceOverrides = readWorkspaceOverrides();
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

try {
  await main();
} catch (error) {
  // Reached only after the unwind ran every cleanup, so exiting here is safe.
  if (error instanceof ConsumerFixtureFailure) {
    console.error(`[consumer-fixtures] ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
}

async function main() {
  const fixtures = discoverFixtures();
  const selectedFixtures = selectFixtures(fixtures, selectedNames);
  for (const fixture of selectedFixtures) assertFixturePeerContract(fixture);

  const packedPackage = preparePackedTarball();
  packedTarball = packedPackage.tarball;
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

    for (const fixture of selectedFixtures) {
      await runFixture(fixture);
    }
  } finally {
    discardPackedPackage(packedPackage);
  }

  console.log(
    `[consumer-fixtures] ok: ${selectedFixtures.map((fixture) => fixture.name).join(', ')}`,
  );
}

function discoverFixtures() {
  if (!existsSync(fixturesRoot)) fail(`Fixture root missing: ${fixturesRoot}`);

  const discovered = [];
  for (const entry of readdirSync(fixturesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const dir = join(fixturesRoot, entry.name);
    const manifestPath = join(dir, 'fixture.json');
    if (!existsSync(manifestPath)) {
      fail(`Fixture ${entry.name} is missing its fixture.json manifest: ${manifestPath}`);
    }
    // The same rule the sharded CI entry enforces
    // (tools/run-consumer-fixture-shard.mjs): a fixture whose name cannot label
    // a GitLab log section must fail here too, so it fails locally on the run
    // that added it rather than in CI.
    if (!/^[A-Za-z0-9_.-]+$/.test(entry.name)) {
      fail(`Fixture directory name ${JSON.stringify(entry.name)} cannot label a log section`);
    }
    const packageJsonPath = join(dir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      fail(`Fixture ${entry.name} is missing its package.json: ${packageJsonPath}`);
    }

    discovered.push({
      name: entry.name,
      dir,
      manifest: JSON.parse(readFileSync(manifestPath, 'utf8')),
      packageJson: JSON.parse(readFileSync(packageJsonPath, 'utf8')),
    });
  }

  if (!discovered.length) fail(`No consumer fixtures found under ${fixturesRoot}`);
  return discovered;
}

function selectFixtures(allFixtures, names) {
  if (!names.length) return allFixtures;

  const byName = new Map(allFixtures.map((fixture) => [fixture.name, fixture]));
  const missing = names.filter((name) => !byName.has(name));
  if (missing.length) fail(`Unknown consumer fixture(s): ${missing.join(', ')}`);
  return [...new Set(names)].map((name) => byName.get(name));
}

// A fixture that names a peer group must declare exactly that group's package
// peers, so peer-tier guarantees (for example: the root/core contract needs no
// styling, icon, table, or feature peers) survive the move out of the legacy
// embedded scenarios.
function assertFixturePeerContract(fixture) {
  const groupName = fixture.manifest.peerGroup;
  if (!groupName) return;

  const contract = peerGroupContracts[groupName];
  if (!contract) fail(`Fixture ${fixture.name} references unknown peer group ${groupName}`);

  const declared = Object.keys(fixture.packageJson.dependencies ?? {});
  const declaredPeers = declared.filter((name) => allPackagePeerNames.has(name));
  assertSameSet(`fixture ${fixture.name} peer group ${groupName}`, contract.peers, declaredPeers);
}

async function runFixture(fixture) {
  const label = `consumer-fixtures:${fixture.name}`;
  console.log(`[${label}] ${fixture.manifest.description ?? fixture.name}`);

  const workspace = mkdtempSync(join(tmpdir(), `hell-consumer-fixture-${fixture.name}-`));
  try {
    copyFixtureProject(fixture, workspace);
    materializeFixturePackageJson(fixture, workspace);
    writeWorkspaceOverrides(workspace);

    runPnpm(['install', '--strict-peer-dependencies', '--ignore-scripts'], workspace, label);
    assertInstalledFromTarball(fixture, workspace);
    assertForbiddenDependenciesNotInstalled(fixture, workspace);

    runPnpm(['run', 'build'], workspace, label);
    assertFixtureCssSentinels(fixture, workspace, label);
    assertFixtureStyleBundleBudget(fixture, workspace, label);
    await runFixtureSmoke(fixture, workspace, label);

    console.log(`[${label}] ok`);
  } finally {
    if (keep) console.log(`[${label}] kept ${workspace}`);
    else rmSync(workspace, { force: true, recursive: true });
  }
}

function copyFixtureProject(fixture, workspace) {
  cpSync(fixture.dir, workspace, {
    recursive: true,
    filter: (source) => {
      const relativePath = relative(fixture.dir, source);
      if (!relativePath) return true;
      const segments = relativePath.split(sep);
      if (segments.some((segment) => copyExcludedDirectories.has(segment))) return false;
      return basename(relativePath) !== 'pnpm-lock.yaml';
    },
  });
}

// The checked-in fixture declares dependency names with "*" versions; the
// runner pins every dependency to the repo's tested version and swaps the
// library itself for the packed tarball. Fixtures can never drift onto
// untested dependency versions or workspace links.
function materializeFixturePackageJson(fixture, workspace) {
  const source = fixture.packageJson;
  if (!(packageName in (source.dependencies ?? {}))) {
    fail(`Fixture ${fixture.name} package.json must declare ${packageName} as a dependency`);
  }

  const materialized = { ...source };
  materialized.dependencies = pinDependencyVersions(fixture, source.dependencies);
  if (source.devDependencies) {
    materialized.devDependencies = pinDependencyVersions(fixture, source.devDependencies);
  }
  if (Object.keys(workspaceOverrides).length) {
    materialized.pnpm = { ...(source.pnpm ?? {}), overrides: workspaceOverrides };
  }
  writeJson(join(workspace, 'package.json'), materialized);
}

function pinDependencyVersions(fixture, section) {
  const pinned = {};
  for (const [name, declared] of Object.entries(section ?? {})) {
    if (declared !== '*') {
      fail(
        `Fixture ${fixture.name} must declare ${name} as "*"; the runner pins the repo's tested version`,
      );
    }
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
  if (!Object.keys(workspaceOverrides).length) return;

  // pnpm >= 10.14 reads overrides from pnpm-workspace.yaml, not from
  // package.json "pnpm.overrides"; emit both so every toolchain applies the
  // repo's patched transitive versions.
  const overrideLines = Object.entries(workspaceOverrides)
    .map(([name, version]) => `  ${JSON.stringify(name)}: ${JSON.stringify(version)}`)
    .join('\n');
  writeFileSync(join(workspace, 'pnpm-workspace.yaml'), `overrides:\n${overrideLines}\n`);
}

function assertInstalledFromTarball(fixture, workspace) {
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
  console.log(
    `[consumer-fixtures:${fixture.name}] ok: ${packageName}@${installedVersion} installed from the packed tarball`,
  );
}

function assertForbiddenDependenciesNotInstalled(fixture, workspace) {
  const storeRoot = join(workspace, 'node_modules', '.pnpm');
  const storeEntries = existsSync(storeRoot) ? readdirSync(storeRoot) : [];

  for (const dependency of fixture.manifest.forbiddenDependencies ?? []) {
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
    console.log(
      `[consumer-fixtures:${fixture.name}] ok: forbidden dependency ${dependency} is not installed`,
    );
  }
}

// CSS sentinels are one or two distinctive fragments per imported stylesheet
// export. They prove the stylesheet resolved from the packed tarball and
// shipped compiled output; exhaustive fragment lists belong to unit tests,
// not the packaging boundary. Forbidden CSS sentinels are the inverse:
// distinctive markers of heavy/optional stylesheets that must never reach the
// built CSS unless the fixture selected them explicitly.
function assertFixtureCssSentinels(fixture, workspace, label) {
  const sentinels = fixture.manifest.cssSentinels ?? [];
  const forbiddenSentinels = fixture.manifest.forbiddenCssSentinels ?? [];
  if (!sentinels.length && !forbiddenSentinels.length) return;

  const distRoot = join(workspace, 'dist');
  const cssFiles = existingFiles(distRoot).filter((file) => file.endsWith('.css'));
  if (!cssFiles.length) fail(`Fixture ${fixture.name} build did not emit CSS under ${distRoot}`);

  const builtCss = normalizeCssForSentinels(
    cssFiles.map((file) => readFileSync(file, 'utf8')).join('\n'),
  );
  const missing = sentinels.filter(
    (sentinel) => !builtCss.includes(normalizeCssForSentinels(sentinel)),
  );
  if (missing.length) {
    fail(
      `Fixture ${fixture.name} built CSS is missing sentinel(s): ${missing.join(' | ')}`,
    );
  }
  if (sentinels.length) {
    console.log(`[${label}] ok: ${sentinels.length} CSS sentinel(s) found in built CSS`);
  }

  const present = forbiddenSentinels.filter((sentinel) =>
    builtCss.includes(normalizeCssForSentinels(sentinel)),
  );
  if (present.length) {
    fail(
      `Fixture ${fixture.name} built CSS contains forbidden sentinel(s): ${present.join(' | ')}`,
    );
  }
  if (forbiddenSentinels.length) {
    console.log(
      `[${label}] ok: ${forbiddenSentinels.length} forbidden CSS sentinel(s) absent from built CSS`,
    );
  }
}

function normalizeCssForSentinels(css) {
  return css.replace(/\s+/g, '');
}

// The style bundle size benchmark: a fixture that declares
// `styleBundleBudget` (a budget file path resolved against the fixture
// directory, staying inside tools/consumer-fixtures/) has every CSS byte its
// production build emitted measured — compiled and minified through the
// supported Tailwind/PostCSS path, never source files or an unprocessed
// concatenation — and gated against the accepted release budget recorded in
// that file. Nothing is filtered or excluded from the measurement; the
// fixture's forbidden CSS sentinels are what prove heavy/optional styles
// stay out of the bundle being measured.
function assertFixtureStyleBundleBudget(fixture, workspace, label) {
  const budgetFile = fixture.manifest.styleBundleBudget;
  if (!budgetFile) return;

  const budgetPath = resolve(fixture.dir, budgetFile);
  if (!budgetPath.startsWith(`${fixturesRoot}${sep}`)) {
    fail(`Fixture ${fixture.name} styleBundleBudget must stay inside ${fixturesRoot}`);
  }
  if (!existsSync(budgetPath)) {
    fail(`Fixture ${fixture.name} styleBundleBudget file is missing: ${budgetPath}`);
  }

  let budget;
  try {
    budget = loadStyleBundleBudget(budgetPath);
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
      `Fixture ${fixture.name} compiled style bundle exceeds the accepted budget in ${relative(root, budgetPath)}: ` +
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
    // A message this runner composed already names the fixture and the
    // expectation; only foreign failures (a Playwright timeout, a navigation
    // error) need the buffered evidence to be readable.
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
  // The web-first assertion retries the read for us and reports the text it
  // last saw; the message keeps the fixture and the expectation in the failure.
  await expect(
    page.locator(step.selector),
    `Fixture ${fixture.name} smoke expected ${step.selector} to contain ${JSON.stringify(
      step.textIncludes,
    )}`,
  ).toContainText(step.textIncludes, { timeout: 15_000 });
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
  const server = createServer((request, response) => {
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
  });

  // A server 'error' with no listener is an uncaught exception, so the handler
  // stays attached for the server's whole life: an error raised after listen
  // fails the fixture through `errors` instead of crashing the run.
  const errors = [];
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

function preparePackedTarball() {
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
  rmSync(packedPackage.root, { force: true, recursive: true });
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
  // tree from the registry.
  if (process.env.npm_config_store_dir) {
    env.npm_config_store_dir = process.env.npm_config_store_dir;
  }

  return env;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}
