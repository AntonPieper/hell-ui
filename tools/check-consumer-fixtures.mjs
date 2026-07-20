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
  peerGroupContracts,
  resolvePackedTarball,
} from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixturesRoot = join(root, 'tools', 'consumer-fixtures');
const distHell = join(root, 'dist', 'hell');

const { prebuiltTarballSelection, remainingArgs } = extractPrebuiltTarballSelection(
  process.argv.slice(2),
);
const args = remainingArgs;
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const skipPackageBuild = parseSkipPackageBuild(args);
const smokeEnabled = process.env.HELL_CONSUMER_FIXTURE_SMOKE === '1' || args.includes('--smoke');
const selectedNames = args.filter((arg) => !arg.startsWith('--'));

const copyExcludedDirectories = new Set(['node_modules', 'dist', '.angular', 'out-tsc']);
const allPackagePeerNames = new Set(
  Object.values(peerGroupContracts).flatMap((contract) => contract.peers),
);

const workspaceCatalog = readWorkspaceScalarMap('catalog');
const workspaceOverrides = readWorkspaceScalarMap('overrides');
const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const knownVersions = {
  ...(rootPackage.dependencies ?? {}),
  ...(rootPackage.devDependencies ?? {}),
  ...workspaceCatalog,
};

const fixtures = discoverFixtures();
const selectedFixtures = selectFixtures(fixtures, selectedNames);
for (const fixture of selectedFixtures) assertFixturePeerContract(fixture);

const packedPackage = preparePackedTarball();
const packedTarball = packedPackage.tarball;

let auditedPackedPackage;
try {
  auditedPackedPackage = auditPackedPackage({ tarball: packedTarball });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const packageName = auditedPackedPackage.packageJson.name;
const packageVersion = auditedPackedPackage.packageJson.version;
if (!packageName || !packageVersion) {
  fail('Packed package.json is missing name or version');
}

try {
  for (const fixture of selectedFixtures) {
    await runFixture(fixture);
  }
} finally {
  if (!packedPackage.root) {
    // The prebuilt tarball belongs to the caller; leave it in place.
  } else if (keep) console.log(`[consumer-fixtures] kept packed package ${packedPackage.root}`);
  else rmSync(packedPackage.root, { force: true, recursive: true });
}

console.log(
  `[consumer-fixtures] ok: ${selectedFixtures.map((fixture) => fixture.name).join(', ')}`,
);

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

  const version = knownVersions[name];
  if (!version) fail(`Fixture dependency ${name} is not in the workspace catalog or root package.json`);
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
// not the packaging boundary.
function assertFixtureCssSentinels(fixture, workspace, label) {
  const sentinels = fixture.manifest.cssSentinels ?? [];
  if (!sentinels.length) return;

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

  console.log(`[${label}] ok: ${sentinels.length} CSS sentinel(s) found in built CSS`);
}

function normalizeCssForSentinels(css) {
  return css.replace(/\s+/g, '');
}

async function runFixtureSmoke(fixture, workspace, label) {
  const smoke = fixture.manifest.smoke;
  if (!smoke) return;
  if (!smokeEnabled) {
    console.log(`[${label}] smoke declared but not enabled (set HELL_CONSUMER_FIXTURE_SMOKE=1)`);
    return;
  }

  const steps = smoke.steps ?? [];
  if (!steps.length) fail(`Fixture ${fixture.name} smoke declares no steps`);

  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    fail(
      `Fixture ${fixture.name} smoke requires @playwright/test: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const browserRoot = fixtureBrowserBuildRoot(fixture, workspace);
  const server = await startStaticServer(browserRoot);
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(server.url, { waitUntil: 'networkidle' });

    for (const step of steps) {
      await assertSmokeStep(fixture, page, step);
      console.log(`[${label}] smoke ok: ${describeSmokeStep(step)}`);
    }
  } catch (error) {
    fail(
      `Fixture ${fixture.name} smoke failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

// A smoke step asserts either projected text ({ selector, textIncludes }) or a
// resolved computed style ({ selector, computedStyle: { property, equals } });
// the computed form proves semantic token overrides survive the packed build.
async function assertSmokeStep(fixture, page, step) {
  if (step.selector && step.textIncludes) return assertSmokeTextStep(fixture, page, step);
  if (step.selector && step.computedStyle?.property && step.computedStyle.equals !== undefined) {
    return assertSmokeComputedStyleStep(fixture, page, step);
  }

  fail(
    `Fixture ${fixture.name} smoke steps need selector plus textIncludes or computedStyle {property, equals}`,
  );
}

async function assertSmokeTextStep(fixture, page, step) {
  const locator = page.locator(step.selector);
  const deadline = Date.now() + 15_000;
  let lastText = '';
  for (;;) {
    lastText = (await locator.textContent()) ?? '';
    if (lastText.includes(step.textIncludes)) return;
    if (Date.now() > deadline) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
  }
  fail(
    `Fixture ${fixture.name} smoke expected ${step.selector} to contain ${JSON.stringify(
      step.textIncludes,
    )} but found ${JSON.stringify(lastText)}`,
  );
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
    const filePath =
      target.startsWith(absoluteRoot) && existsSync(target) && statSync(target).isFile()
        ? target
        : join(absoluteRoot, 'index.html');

    response.writeHead(200, { 'content-type': staticContentType(filePath) });
    response.end(readFileSync(filePath));
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Static server did not expose a TCP address.'));
        return;
      }
      resolveServer({
        url: `http://127.0.0.1:${address.port}/`,
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

  const results = [];
  for (const entry of readdirSync(rootPath)) {
    const fullPath = join(rootPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) results.push(...existingFiles(fullPath));
    else if (stat.isFile()) results.push(fullPath);
  }
  return results;
}

function parseSkipPackageBuild(rawArgs) {
  const envMode = process.env.HELL_PACKAGE_CONSUMER_SKIP_BUILD;
  if (envMode === '1' || envMode === 'true') return true;

  return rawArgs.some((arg) => arg === '--skip-build' || arg === '--prebuilt');
}

function extractPrebuiltTarballSelection(rawArgs) {
  const remaining = [];
  let selection = (process.env.HELL_PACKAGE_CONSUMER_TARBALL ?? '').trim() || null;

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === '--tarball') {
      const next = rawArgs[i + 1];
      if (!next || next.startsWith('--')) fail('--tarball requires a tarball or directory path');
      selection = next;
      i += 1;
      continue;
    }
    if (arg.startsWith('--tarball=')) {
      selection = arg.slice('--tarball='.length);
      if (!selection) fail('--tarball requires a tarball or directory path');
      continue;
    }
    remaining.push(arg);
  }

  return { prebuiltTarballSelection: selection, remainingArgs: remaining };
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
  runPnpm(['pack', '--pack-destination', packRoot], distHell, 'pack');
  const tarballName = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
  if (!tarballName) fail(`Packed package missing in ${packRoot}`);
  return { root: packRoot, tarball: join(packRoot, tarballName) };
}

function readWorkspaceScalarMap(sectionName) {
  const workspacePath = join(root, 'pnpm-workspace.yaml');
  const source = readFileSync(workspacePath, 'utf8');
  const map = {};
  let inSection = false;

  for (const line of source.split(/\r?\n/)) {
    if (/^\S/.test(line)) inSection = line === `${sectionName}:`;
    if (!inSection || !line.startsWith('  ')) continue;
    if (/^\s*#/.test(line)) continue;

    const match = line.match(/^\s+(['"]?)([^'":]+)\1:\s+(['"]?)([^'"]+)\3\s*$/);
    if (match) map[match[2]] = match[4];
  }

  return map;
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

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function formatList(values) {
  return values.length ? values.join(', ') : '(none)';
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

  return env;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fail(message) {
  console.error(`[consumer-fixtures] ${message}`);
  process.exit(1);
}
