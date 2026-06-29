import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  auditPackedPackage,
  heavyFeaturePeerGroup,
  packageConsumerPeerTiers,
  packagePeerGroups,
  peerGroupContracts,
  tableAdapterPeerGroup,
} from './package-pack-audit.mjs';
import { releaseCandidateConsumerScenarioNames } from './release-evidence-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');
const distPdfViewer = join(root, 'dist/hell-pdf-viewer');
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const packageConsumerArgs = process.argv.slice(2);
const catalogOnly = parseCatalogOnly(packageConsumerArgs);
const rawSelectedScenarioNames = parseScenarioSelection(packageConsumerArgs);
const selectedScenarioNames = rawSelectedScenarioNames.filter(
  (name) => !isPreflightScenarioName(name),
);
const preflightOnly = parsePreflightOnly(packageConsumerArgs, rawSelectedScenarioNames);
const minimalDependencyMode = parseMinimalDependencyMode(packageConsumerArgs);
const skipPackageBuild = parseSkipPackageBuild(packageConsumerArgs);
const pnpmTimeoutMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_TIMEOUT_MS, 600_000);
const pnpmHeartbeatMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_HEARTBEAT_MS, 30_000);
const runtimeStyleCheck = process.env.HELL_PACKAGE_CONSUMER_RUNTIME_STYLE_CHECK === '1';
const pnpmPreflightTimeoutMs = positiveNumber(
  process.env.HELL_PACKAGE_CONSUMER_PREFLIGHT_TIMEOUT_MS,
  30_000,
);

const tailwindPostcssDevDeps = ['@tailwindcss/postcss', 'postcss'];

const angularAppDeps = [
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/forms',
  '@angular/platform-browser',
  'rxjs',
  'tslib',
];
const behaviorUiWithoutFontAwesomeDeps = [
  ...angularAppDeps,
  '@angular/cdk',
  '@floating-ui/dom',
  'ng-primitives',
  '@ng-icons/core',
];
const styledUiWithoutFontAwesomeDeps = [...behaviorUiWithoutFontAwesomeDeps, 'tailwindcss'];
const styledUiDeps = [...styledUiWithoutFontAwesomeDeps, '@ng-icons/font-awesome'];
const coreDeps = behaviorUiWithoutFontAwesomeDeps;
const buttonStyledDeps = styledUiWithoutFontAwesomeDeps;
const codeEditorDeps = [
  ...styledUiWithoutFontAwesomeDeps,
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/highlight',
];
const testingDeps = coreDeps;
const pdfViewerDeps = [...styledUiDeps, 'pdfjs-dist'];
const audioPlayerDeps = styledUiDeps;
const tableTanStackDeps = [...styledUiWithoutFontAwesomeDeps, '@tanstack/angular-table'];
const tableTanStackVirtualDeps = [
  ...styledUiWithoutFontAwesomeDeps,
  '@tanstack/angular-table',
  '@tanstack/virtual-core',
];

const requiredScenarioCoverageAreas = new Set([
  'root-core',
  'testing',
  'no-css-primitives',
  'styled-primitives',
  'composites',
  'audio-transcript',
  'table-primitives',
  'tanstack-table',
  'tanstack-virtual',
  'code-editor',
  'split-pdf-viewer',
  'removed-legacy-aliases',
]);

const packageConsumerCiGroups = [
  { name: 'core', scenarios: ['root-core', 'core', 'testing'] },
  { name: 'primitive-foundations', scenarios: ['primitive-icons-css', 'button-ui'] },
  { name: 'button', scenarios: ['button'] },
  { name: 'composite-foundations', scenarios: ['composite-css', 'app-shell'] },
  { name: 'audio', scenarios: ['audio-player', 'audio-transcript'] },
  { name: 'features', scenarios: ['code-editor', 'pdf-viewer'] },
  { name: 'table-core', scenarios: ['table', 'no-legacy-alias'] },
  { name: 'table-tanstack-virtual', scenarios: ['table-tanstack', 'table-tanstack-virtual'] },
];

const packageConsumerScriptGroups = [
  { name: 'core', scenarios: ['root-core', 'core', 'testing'] },
  { name: 'primitives', scenarios: ['primitive-icons-css', 'button-ui', 'button'] },
  { name: 'composites', scenarios: ['composite-css', 'app-shell', 'audio-player', 'audio-transcript'] },
  { name: 'features', scenarios: ['code-editor', 'pdf-viewer'] },
  { name: 'tables', scenarios: ['table', 'table-tanstack', 'table-tanstack-virtual', 'no-legacy-alias'] },
  { name: 'code-editor', scenarios: ['code-editor'] },
  { name: 'pdf-viewer', scenarios: ['pdf-viewer'] },
  { name: 'table-core', scenarios: ['table', 'no-legacy-alias'] },
  { name: 'table-adapters', scenarios: ['table-tanstack', 'table-tanstack-virtual'] },
];

const packageConsumerReleaseScenarios = releaseCandidateConsumerScenarioNames;

const packageConsumerScenarioCatalog = [
  {
    name: 'root-core',
    aliases: ['root'],
    description: 'root entry core-only with package-wide light peers',
    coverage: ['root-core'],
    peerTier: 'core',
    peerGroup: 'core',
    dependencies: coreDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: rootConsumerMainTs,
    stylesCss: emptyConsumerStylesCss,
  },
  {
    name: 'core',
    description: 'core entry with package-wide light peers',
    coverage: ['root-core'],
    peerTier: 'core',
    peerGroup: 'core',
    dependencies: coreDeps,
    mainTs: coreConsumerMainTs,
    stylesCss: emptyConsumerStylesCss,
  },
  {
    name: 'primitive-icons-css',
    aliases: ['primitives'],
    description: 'narrow styled primitive entries with entrypoint CSS and Part Style Maps',
    coverage: ['styled-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive-icons',
    dependencies: styledUiDeps,
    mainTs: primitivesConsumerMainTs,
    stylesCss: primitivesConsumerStylesCss,
    cssIncludes: [
      'background-color:var(--color-hell-surface-muted)',
      'background-color:var(--color-hell-primary-soft)',
      'border-style:dashed',
      'animation:hell-shimmer 1.6s linear infinite',
    ],
  },
  {
    name: 'button-ui',
    description: 'narrow primitive button Part Style Map entry without CSS or Tailwind peer',
    coverage: ['no-css-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive-ui',
    dependencies: coreDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: buttonUiConsumerMainTs,
    stylesCss: emptyConsumerStylesCss,
  },
  {
    name: 'button',
    description:
      'narrow primitive button entry with primitive styles and without Font Awesome peer',
    coverage: ['styled-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive',
    dependencies: buttonStyledDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: buttonConsumerMainTs,
    stylesCss: buttonConsumerStylesCss,
    cssIncludes: [
      '--color-hell-primary:#3452ff',
      'background-color:var(--color-hell-surface-elevated)',
      'background-color:var(--color-hell-primary)',
      'background-color:var(--color-hell-primary-hover)',
      'border-radius:var(--radius-hell-md)',
      '--_hell-btn-shadow:var(--shadow-hell-xs)',
      'box-shadow:var(--_hell-btn-shadow)',
      'text-underline-offset:3px',
      'transition-property:background-color,border-color,color,box-shadow',
    ],
    runtimeStyleAssertions: [
      {
        label: 'semantic primary token override',
        selector: '[data-test-id="primary-link"]',
        property: 'color',
        expected: 'rgb(52, 82, 255)',
      },
    ],
  },
  {
    name: 'composite-css',
    aliases: ['composites'],
    description: 'narrow composite entries with entrypoint CSS and icon-backed peers',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite-icons',
    dependencies: styledUiDeps,
    mainTs: compositesConsumerMainTs,
    stylesCss: appShellConsumerStylesCss,
  },
  {
    name: 'app-shell',
    description: 'narrow app-shell composite entry without Font Awesome or feature peers',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: appShellConsumerMainTs,
    stylesCss: audioPlayerConsumerStylesCss,
  },
  {
    name: 'audio-player',
    description: 'narrow audio-player composite without transcript feature provider',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite-icons',
    dependencies: audioPlayerDeps,
    mainTs: audioPlayerConsumerMainTs,
    stylesCss: audioPlayerConsumerStylesCss,
  },
  {
    name: 'audio-transcript',
    description: 'audio transcript feature provider opt-in without CodeMirror or pdf.js peers',
    coverage: ['audio-transcript'],
    peerTier: 'audio-transcript',
    peerGroup: 'audio-transcript',
    dependencies: audioPlayerDeps,
    mainTs: audioTranscriptConsumerMainTs,
    stylesCss: audioPlayerConsumerStylesCss,
  },
  {
    name: 'testing',
    description: 'testing entry with package-wide light peers',
    coverage: ['testing'],
    peerTier: 'core',
    peerGroup: 'core',
    dependencies: testingDeps,
    mainTs: testingConsumerMainTs,
    stylesCss: emptyConsumerStylesCss,
  },
  {
    name: 'code-editor',
    description: 'code-editor feature with styled peers and CodeMirror peers',
    coverage: ['code-editor'],
    peerTier: 'code-editor',
    peerGroup: 'code-editor',
    dependencies: codeEditorDeps,
    mainTs: codeEditorConsumerMainTs,
    stylesCss: codeEditorConsumerStylesCss,
  },
  {
    name: 'table',
    description: 'table primitives without Font Awesome peer',
    coverage: ['table-primitives'],
    peerTier: 'table',
    peerGroup: 'table',
    dependencies: styledUiWithoutFontAwesomeDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: tableConsumerMainTs,
    stylesCss: tableConsumerStylesCss,
  },
  {
    name: 'table-tanstack',
    description: 'Hell-styled TanStack Table shell with strict optional table peer',
    coverage: ['tanstack-table'],
    peerTier: 'table-tanstack',
    peerGroup: 'table-tanstack',
    dependencies: tableTanStackDeps,
    forbiddenDependencies: packagePeerGroups.tanStackVirtual,
    mainTs: tableTanStackConsumerMainTs,
    stylesCss: tableTanStackConsumerStylesCss,
  },
  {
    name: 'table-tanstack-virtual',
    description: 'Hell-styled TanStack Table shell with optional TanStack Virtual body strategy',
    coverage: ['tanstack-virtual'],
    peerTier: 'table-tanstack',
    peerGroup: 'table-tanstack-virtual',
    dependencies: tableTanStackVirtualDeps,
    mainTs: tableTanStackVirtualConsumerMainTs,
    stylesCss: tableTanStackConsumerStylesCss,
  },
  {
    name: 'no-legacy-alias',
    description: 'negative check that removed legacy aliases cannot compile',
    coverage: ['removed-legacy-aliases'],
    peerTier: 'table',
    peerGroup: 'table',
    dependencies: styledUiWithoutFontAwesomeDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: noLegacyTableAliasConsumerMainTs,
    stylesCss: noLegacyTableAliasConsumerStylesCss,
    expectBuildFailure: true,
    expectedFailureIncludes: [
      '@hell-ui/angular/data-table',
      '@hell-ui/angular/features/data-table',
      '@hell-ui/angular/features/table-utilities',
      '@hell-ui/angular/table-cdk',
      '@hell-ui/angular/table-virtual',
      '@hell-ui/angular/primitives',
      '@hell-ui/angular/composites',
      './styles/kitchen-sink',
    ],
  },
  {
    name: 'pdf-viewer',
    description: 'split pdf-viewer package with pdfjs and light UI peers',
    coverage: ['split-pdf-viewer'],
    peerTier: 'pdf-viewer',
    peerGroup: 'pdf-viewer',
    installPdfPackage: true,
    dependencies: pdfViewerDeps,
    mainTs: pdfViewerConsumerMainTs,
    stylesCss: pdfViewerConsumerStylesCss,
  },
];

if (catalogOnly) {
  process.stdout.write(`${JSON.stringify(packageConsumerCatalogContract(), null, 2)}\n`);
  process.exit(0);
}

runPnpmPreflight(root);
if (preflightOnly) {
  console.log(
    `${packageConsumerLabel('preflight')} preflight passed; skipping package build and consumer scenarios`,
  );
  process.exit(0);
}

if (skipPackageBuild) {
  console.log('[package-consumer] using prebuilt packages from dist; skipping build:lib');
} else {
  runRootPnpm(['run', 'build:lib'], root);
}

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}`);
}
if (!existsSync(join(distPdfViewer, 'package.json'))) {
  fail(`Built package missing: ${distPdfViewer}`);
}

const distPackageJson = JSON.parse(readFileSync(join(distHell, 'package.json'), 'utf8'));
const packageName = distPackageJson.name;
if (!packageName) {
  fail('Built package.json is missing name');
}
const distPdfPackageJson = JSON.parse(readFileSync(join(distPdfViewer, 'package.json'), 'utf8'));
const pdfPackageName = distPdfPackageJson.name;
if (!pdfPackageName) {
  fail('Built PDF package.json is missing name');
}

assertDocsAvoidLegacyTableEntrypoints();

const packedHell = await packBuiltPackage(distHell, 'pack-core');
const packedPdfViewer = await packBuiltPackage(distPdfViewer, 'pack-pdf-viewer');
try {
  auditPackedPackage({ tarball: packedHell.tarball });
  auditPackedPackage({ tarball: packedPdfViewer.tarball });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const workspaceCatalog = readWorkspaceCatalog();
const deps = { ...(rootPackage.dependencies ?? {}), ...workspaceCatalog };
const devDeps = { ...(rootPackage.devDependencies ?? {}), ...workspaceCatalog };
const scenarios = materializeScenarios(packageConsumerScenarioCatalog);

assertPeerTierContracts(scenarios);

const enabledScenarios = selectScenarios(scenarios, selectedScenarioNames);

try {
  for (const group of scenarioDependencyGroups(enabledScenarios, minimalDependencyMode)) {
    await runConsumerScenarioGroup(group);
  }
} finally {
  if (keep) {
    console.log(`[package-consumer] kept packed hell package ${packedHell.root}`);
    console.log(`[package-consumer] kept packed pdf-viewer package ${packedPdfViewer.root}`);
  } else {
    rmSync(packedHell.root, { force: true, recursive: true });
    rmSync(packedPdfViewer.root, { force: true, recursive: true });
  }
}

function parseScenarioSelection(args) {
  const argSelection = parseScenarioTokens(args, false);
  if (argSelection.length) return argSelection;

  const envSelection = parseScenarioTokens(
    [process.env.HELL_PACKAGE_CONSUMER_SCENARIOS ?? ''],
    true,
  );
  return envSelection;
}

function parseMinimalDependencyMode(args) {
  const envMode = process.env.HELL_PACKAGE_CONSUMER_MINIMAL_DEPS;
  if (envMode === '1' || envMode === 'true') return true;

  return args.some((arg) => arg === '--minimal-deps' || arg === '--group-by-deps');
}

function parseCatalogOnly(args) {
  return args.some((arg) => arg === '--catalog-json' || arg === '--print-catalog-json');
}

function parseSkipPackageBuild(args) {
  const envMode = process.env.HELL_PACKAGE_CONSUMER_SKIP_BUILD;
  if (envMode === '1' || envMode === 'true') return true;

  return args.some((arg) => arg === '--skip-build' || arg === '--prebuilt');
}

function parsePreflightOnly(args, selectedNames) {
  if (args.some((arg) => arg === '--preflight' || arg === '--preflight-only')) return true;

  return selectedNames.length > 0 && selectedNames.every(isPreflightScenarioName);
}

function isPreflightScenarioName(name) {
  return name === 'preflight' || name === 'pnpm-preflight';
}

function parseScenarioTokens(values, envOnly) {
  const raw = [];

  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (!value) continue;

    if (!envOnly && (value === '--scenario' || value === '--scenarios')) {
      const next = values[i + 1];
      if (next && !next.startsWith('--')) {
        raw.push(next);
        i += 1;
      }
      continue;
    }

    if (!envOnly && value.startsWith('--scenario=')) {
      raw.push(value.slice('--scenario='.length));
      continue;
    }

    if (!envOnly && value.startsWith('--scenarios=')) {
      raw.push(value.slice('--scenarios='.length));
      continue;
    }

    if (envOnly || !value.startsWith('-')) raw.push(value);
  }

  return [
    ...new Set(raw.flatMap((value) => value.split(',').map(normalizeScenarioName)).filter(Boolean)),
  ];
}

function normalizeScenarioName(value) {
  return value.trim().toLowerCase();
}

function packageConsumerCatalogContract() {
  const scenarioContracts = packageConsumerScenarioCatalog.map(scenarioCatalogRecord);
  return {
    scenarios: scenarioContracts,
    peerTiers: [...packageConsumerPeerTiers],
    peerGroups: Object.fromEntries(
      Object.entries(peerGroupContracts).map(([name, contract]) => [
        name,
        { tier: contract.tier, peers: [...contract.peers] },
      ]),
    ),
    coverageAreas: [...requiredScenarioCoverageAreas],
    ciGroups: packageConsumerCiGroups.map(scenarioGroupRecord),
    scriptGroups: packageConsumerScriptGroups.map(scenarioGroupRecord),
    releaseScenarios: [...packageConsumerReleaseScenarios],
    strictPeerGroups: packageConsumerStrictPeerGroups(scenarioContracts),
  };
}

function scenarioCatalogRecord(scenario) {
  return {
    name: scenario.name,
    aliases: [...(scenario.aliases ?? [])],
    description: scenario.description,
    coverage: [...(scenario.coverage ?? [])],
    peerTier: scenario.peerTier,
    peerGroup: scenario.peerGroup,
    dependencies: [...scenario.dependencies],
    forbiddenDependencies: [...(scenario.forbiddenDependencies ?? [])],
    expectedFailureIncludes: [...(scenario.expectedFailureIncludes ?? [])],
    expectBuildFailure: scenario.expectBuildFailure === true,
    installPdfPackage: scenario.installPdfPackage === true,
  };
}

function scenarioGroupRecord(group) {
  return {
    name: group.name,
    scenarios: [...group.scenarios],
  };
}

function packageConsumerStrictPeerGroups(scenarioContracts) {
  const groups = new Map();
  for (const scenario of scenarioContracts) {
    const key = uniqueSorted(scenario.dependencies).join('\0');
    const group = groups.get(key) ?? {
      dependencies: uniqueSorted(scenario.dependencies),
      scenarios: [],
      peerGroups: [],
    };
    group.scenarios.push(scenario.name);
    group.peerGroups.push(scenario.peerGroup);
    groups.set(key, group);
  }

  return [...groups.values()].map((group, index) => ({
    name: `strict-peer-${index + 1}`,
    scenarios: group.scenarios,
    peerGroups: uniqueSorted(group.peerGroups),
    dependencies: group.dependencies,
  }));
}

function materializeScenarios(catalog) {
  return catalog.map((scenario) => ({
    ...scenario,
    aliases: [...(scenario.aliases ?? [])],
    coverage: [...(scenario.coverage ?? [])],
    dependencies: [...scenario.dependencies],
    forbiddenDependencies: [...(scenario.forbiddenDependencies ?? [])],
    cssIncludes: scenario.cssIncludes ? [...scenario.cssIncludes] : undefined,
    expectedFailureIncludes: scenario.expectedFailureIncludes
      ? [...scenario.expectedFailureIncludes]
      : undefined,
    runtimeStyleAssertions: scenario.runtimeStyleAssertions
      ? scenario.runtimeStyleAssertions.map((assertion) => ({ ...assertion }))
      : undefined,
    mainTs: scenario.mainTs(),
    stylesCss: scenario.stylesCss(),
  }));
}

function selectScenarios(allScenarios, selectedNames) {
  if (!selectedNames.length) return allScenarios;

  const byName = scenarioLookup(allScenarios);
  const missing = selectedNames.filter((name) => !byName.has(name));
  if (missing.length) fail(`Unknown package-consumer scenario(s): ${missing.join(', ')}`);

  const selected = [];
  const seen = new Set();
  for (const name of selectedNames) {
    const scenario = byName.get(name);
    if (seen.has(scenario.name)) continue;
    selected.push(scenario);
    seen.add(scenario.name);
  }

  console.log(
    `[package-consumer] selected scenarios: ${selected.map((scenario) => scenario.name).join(', ')}`,
  );
  return selected;
}

function scenarioLookup(allScenarios) {
  const byName = new Map();
  for (const scenario of allScenarios) {
    for (const name of [scenario.name, ...(scenario.aliases ?? [])]) {
      const key = normalizeScenarioName(name);
      if (byName.has(key)) fail(`Duplicate package-consumer scenario name or alias: ${name}`);
      byName.set(key, scenario);
    }
  }
  return byName;
}

function assertPeerTierContracts(allScenarios) {
  const allPackagePeerNames = new Set(
    Object.values(peerGroupContracts).flatMap((contract) => contract.peers),
  );

  const coveredTiers = new Set(allScenarios.map((scenario) => scenario.peerTier));
  for (const tier of packageConsumerPeerTiers) {
    if (!coveredTiers.has(tier))
      fail(`Missing package-consumer scenario coverage for peer tier ${tier}`);
  }

  assertScenarioCatalogCoverage(allScenarios);
  for (const scenario of allScenarios) assertScenarioPeerGroup(scenario, allPackagePeerNames);
  assertHeavyPeersAreIsolated(allScenarios);
  assertCodeMirrorPeersAreIsolated(allScenarios);
  assertTableAdapterPeersAreIsolated(allScenarios);
}

function assertScenarioPeerGroup(scenario, packagePeerNames) {
  if (!packageConsumerPeerTiers.has(scenario.peerTier)) {
    fail(`Scenario ${scenario.name} uses unknown peer tier ${scenario.peerTier}`);
  }

  const contract = resolvePeerGroup(scenario);
  if (contract.tier !== scenario.peerTier) {
    fail(
      `Scenario ${scenario.name} peer group ${scenario.peerGroup} belongs to tier ${contract.tier}, not ${scenario.peerTier}`,
    );
  }

  const actualPeers = scenario.dependencies.filter((dependency) =>
    packagePeerNames.has(dependency),
  );
  assertSameSet(
    `scenario ${scenario.name} peer group ${scenario.peerGroup ?? scenario.peerTier}`,
    contract.peers,
    actualPeers,
  );
}

function assertScenarioCatalogCoverage(allScenarios) {
  scenarioLookup(allScenarios);

  const scenarioNames = new Set(allScenarios.map((scenario) => scenario.name));
  const coveredAreas = new Set();
  const coveredPeerGroups = new Set();

  for (const scenario of allScenarios) {
    for (const area of scenario.coverage ?? []) {
      if (!requiredScenarioCoverageAreas.has(area)) {
        fail(`Scenario ${scenario.name} references unknown coverage area ${area}`);
      }
      coveredAreas.add(area);
    }
    coveredPeerGroups.add(scenario.peerGroup ?? scenario.peerTier);
  }

  for (const area of requiredScenarioCoverageAreas) {
    if (!coveredAreas.has(area)) fail(`Missing package-consumer coverage area ${area}`);
  }

  for (const groupName of Object.keys(peerGroupContracts)) {
    if (!coveredPeerGroups.has(groupName)) {
      fail(`Missing package-consumer scenario coverage for peer group ${groupName}`);
    }
  }

  assertScenarioGroupsReferenceKnownScenarios('CI package-consumer group', packageConsumerCiGroups, scenarioNames);
  assertScenarioGroupsReferenceKnownScenarios(
    'package.json package-consumer script group',
    packageConsumerScriptGroups,
    scenarioNames,
  );
  assertScenarioNamesReferenceKnownScenarios(
    'release package-consumer scenario',
    packageConsumerReleaseScenarios,
    scenarioNames,
  );
  assertScenarioGroupsCoverAllOnce('CI package-consumer group', packageConsumerCiGroups, scenarioNames);
}

function assertScenarioGroupsReferenceKnownScenarios(label, groups, scenarioNames) {
  const groupNames = new Set();
  for (const group of groups) {
    if (groupNames.has(group.name)) fail(`Duplicate ${label} name ${group.name}`);
    groupNames.add(group.name);
    assertScenarioNamesReferenceKnownScenarios(
      `${label} ${group.name}`,
      group.scenarios,
      scenarioNames,
    );
  }
}

function assertScenarioNamesReferenceKnownScenarios(label, names, scenarioNames) {
  for (const name of names) {
    if (!scenarioNames.has(name)) fail(`${label} references unknown scenario ${name}`);
  }
}

function assertScenarioGroupsCoverAllOnce(label, groups, scenarioNames) {
  const seen = new Map();
  for (const group of groups) {
    for (const scenario of group.scenarios) {
      const previous = seen.get(scenario);
      if (previous) fail(`${label} ${scenario} appears in both ${previous} and ${group.name}`);
      seen.set(scenario, group.name);
    }
  }

  for (const scenario of scenarioNames) {
    if (!seen.has(scenario)) fail(`${label} coverage is missing scenario ${scenario}`);
  }
}

function assertHeavyPeersAreIsolated(allScenarios) {
  const lightScenarioNames = new Set([
    'root-core',
    'core',
    'button-ui',
    'button',
    'table',
    'no-legacy-alias',
    'audio-player',
    'audio-transcript',
  ]);
  for (const scenario of allScenarios) {
    if (!lightScenarioNames.has(scenario.name)) continue;

    const unexpected = scenario.dependencies.filter((dependency) =>
      heavyFeaturePeerGroup.includes(dependency),
    );
    if (unexpected.length) {
      fail(
        `Scenario ${scenario.name} must not require heavy feature peer(s): ${unexpected.join(', ')}`,
      );
    }
  }
}

function assertTableAdapterPeersAreIsolated(allScenarios) {
  const tanStackScenario = allScenarios.find((scenario) => scenario.name === 'table-tanstack');
  if (!tanStackScenario) fail('Missing package-consumer table-tanstack scenario');

  const virtualScenario = allScenarios.find(
    (scenario) => scenario.name === 'table-tanstack-virtual',
  );
  if (!virtualScenario) fail('Missing package-consumer table-tanstack-virtual scenario');

  const tanStackPeers = tanStackScenario.dependencies.filter((dependency) =>
    packagePeerGroups.tanStackTable.includes(dependency),
  );
  assertSameSet(
    'scenario table-tanstack TanStack Table peer group',
    packagePeerGroups.tanStackTable,
    tanStackPeers,
  );

  const virtualPeers = virtualScenario.dependencies.filter((dependency) =>
    packagePeerGroups.tanStackVirtual.includes(dependency),
  );
  assertSameSet(
    'scenario table-tanstack-virtual TanStack Virtual peer group',
    packagePeerGroups.tanStackVirtual,
    virtualPeers,
  );

  for (const scenario of allScenarios) {
    if (scenario.name !== 'table-tanstack' && scenario.name !== 'table-tanstack-virtual') {
      const unexpectedTablePeers = scenario.dependencies.filter((dependency) =>
        packagePeerGroups.tanStackTable.includes(dependency),
      );
      if (unexpectedTablePeers.length) {
        fail(
          `Scenario ${scenario.name} must not require TanStack Table peer(s): ${unexpectedTablePeers.join(', ')}`,
        );
      }
    }

    if (scenario.name !== 'table-tanstack-virtual') {
      const unexpectedVirtualPeers = scenario.dependencies.filter((dependency) =>
        packagePeerGroups.tanStackVirtual.includes(dependency),
      );
      if (unexpectedVirtualPeers.length) {
        fail(
          `Scenario ${scenario.name} must not require TanStack Virtual peer(s): ${unexpectedVirtualPeers.join(', ')}`,
        );
      }
    }
  }
}

function assertCodeMirrorPeersAreIsolated(allScenarios) {
  const codeEditorScenario = allScenarios.find((scenario) => scenario.name === 'code-editor');
  if (!codeEditorScenario) fail('Missing package-consumer code-editor scenario');

  const codeEditorPeers = codeEditorScenario.dependencies.filter((dependency) =>
    packagePeerGroups.codeEditor.includes(dependency),
  );
  assertSameSet('scenario code-editor CodeMirror peer group', packagePeerGroups.codeEditor, codeEditorPeers);

  for (const scenario of allScenarios) {
    if (scenario.name === 'code-editor') continue;

    const unexpected = scenario.dependencies.filter((dependency) =>
      packagePeerGroups.codeEditor.includes(dependency),
    );
    if (unexpected.length) {
      fail(
        `Scenario ${scenario.name} must not require CodeMirror peer(s): ${unexpected.join(', ')}`,
      );
    }
  }
}

function assertDocsAvoidLegacyTableEntrypoints() {
  const docsRoot = join(root, 'apps/docs/src/app');
  const offenders = walkFiles(docsRoot)
    .filter((file) => /\.(?:ts|html|md)$/.test(file))
    .filter((file) =>
      /@hell-ui\/angular\/(?:data-table|table-virtual|table-cdk|features\/(?:data-table|table-utilities))\b|HellDataTable|HellTableModel|hellTanStackTableModel/.test(
        readFileSync(file, 'utf8'),
      ),
    )
    .map((file) => file.slice(root.length + 1));

  if (offenders.length) {
    fail(`Docs must not reference removed table APIs: ${offenders.join(', ')}`);
  }
}

function resolvePeerGroup(scenario) {
  const groupName = scenario.peerGroup ?? scenario.peerTier;
  const contract = peerGroupContracts[groupName];
  if (!contract) fail(`Scenario ${scenario.name} references unknown peer group ${groupName}`);
  return contract;
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

function scenarioDependencyGroups(scenarios, minimalDependencies) {
  if (!minimalDependencies) {
    console.log('[package-consumer] dependency mode: fast union install');
    return [
      {
        dependencies: unionDependencies(scenarios),
        scenarios,
      },
    ];
  }

  console.log('[package-consumer] dependency mode: minimal grouped installs');
  const groups = new Map();
  for (const scenario of scenarios) {
    const key = [...new Set(scenario.dependencies)].sort().join('\0');
    const group = groups.get(key) ?? { dependencies: scenario.dependencies, scenarios: [] };
    group.scenarios.push(scenario);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function unionDependencies(scenarios) {
  return [...new Set(scenarios.flatMap((scenario) => scenario.dependencies))];
}

function printScenarioContract(scenario, phase) {
  const label = packageConsumerLabel(scenario.name);
  console.log(`${label} before ${phase} scenario contract:`);
  console.log(`${label} import path: ${formatList(packageImportPaths(scenario.mainTs))}`);
  console.log(`${label} style imports: ${formatList(styleImportPaths(scenario.stylesCss))}`);
  console.log(`${label} peer tier: ${scenario.peerTier}`);
  console.log(`${label} expected peer group: ${formatList(resolvePeerGroup(scenario).peers)}`);
}

function packageImportPaths(mainTs) {
  return uniqueMatches(mainTs, /from\s+['"]([^'"]+)['"]/g).filter(
    (specifier) =>
      specifier === packageName ||
      specifier.startsWith(`${packageName}/`) ||
      specifier === pdfPackageName ||
      specifier.startsWith(`${pdfPackageName}/`),
  );
}

function styleImportPaths(stylesCss) {
  return uniqueMatches(stylesCss, /@import\s+['"]([^'"]+)['"]/g);
}

function uniqueMatches(value, pattern) {
  return [...new Set([...value.matchAll(pattern)].map((match) => match[1]))];
}

function formatList(values) {
  return values.length ? values.join(', ') : '(none)';
}

async function runConsumerScenarioGroup(group) {
  const groupName = group.scenarios.map((scenario) => scenario.name).join('-');
  const tempRoot = mkdtempSync(join(tmpdir(), `hell-package-consumer-${groupName}-`));

  try {
    for (const scenario of group.scenarios) printScenarioContract(scenario, 'install');
    writeConsumerWorkspace(tempRoot, group.scenarios, group.dependencies);
    await runPnpm(['install', '--strict-peer-dependencies', '--ignore-scripts'], tempRoot, {
      scenarioName: groupName,
      printInstallDiagnostics: true,
    });
    assertForbiddenDependenciesNotInstalled(tempRoot, group);

    for (const scenario of group.scenarios) {
      await runConsumerScenarioBuild(tempRoot, scenario);
    }
  } finally {
    if (keep) console.log(`[package-consumer:${groupName}] kept ${tempRoot}`);
    else rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function runConsumerScenarioBuild(tempRoot, scenario) {
  printScenarioContract(scenario, 'build');
  writeConsumerScenarioFiles(tempRoot, scenario);

  const buildCommand = ['exec', '--', 'ng', 'build', 'consumer', '--configuration', 'production'];
  if (scenario.expectBuildFailure) {
    await runPnpmExpectingFailure(buildCommand, tempRoot, {
      expectedOutputIncludes: scenario.expectedFailureIncludes ?? [],
      scenarioName: scenario.name,
    });
    console.log(`[package-consumer:${scenario.name}] rejected ${scenario.description}`);
    return;
  }

  await runPnpm(buildCommand, tempRoot, { scenarioName: scenario.name });
  assertConsumerBuildCss(tempRoot, scenario);
  await assertConsumerRuntimeStyles(tempRoot, scenario);
  console.log(`[package-consumer:${scenario.name}] built ${scenario.description}`);
}

function assertConsumerBuildCss(workspace, scenario) {
  if (!scenario.cssIncludes?.length) return;

  const css = readConsumerBuildCss(workspace);
  const normalizedCss = normalizeCssForAssertion(css);
  for (const needle of scenario.cssIncludes) {
    if (!normalizedCss.includes(normalizeCssForAssertion(needle))) {
      fail(`Scenario ${scenario.name} built CSS is missing expected fragment: ${needle}`);
    }
  }

  console.log(
    `${packageConsumerLabel(scenario.name)} ok: built CSS contains Part Style Map recipe utilities and semantic token overrides`,
  );
}

async function assertConsumerRuntimeStyles(workspace, scenario) {
  if (!runtimeStyleCheck || !scenario.runtimeStyleAssertions?.length) return;

  let chromium;
  try {
    ({ chromium } = await import('@playwright/test'));
  } catch (error) {
    fail(
      `Scenario ${scenario.name} runtime style check requires @playwright/test: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const browserRoot = consumerBrowserBuildRoot(workspace);
  const server = await startStaticServer(browserRoot);
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(server.url, { waitUntil: 'networkidle' });

    for (const assertion of scenario.runtimeStyleAssertions) {
      const locator = page.locator(assertion.selector);
      await locator.waitFor({ state: 'visible' });
      const actual = await locator.evaluate(
        (element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
        assertion.property,
      );
      if (actual !== assertion.expected) {
        fail(
          `Scenario ${scenario.name} runtime ${assertion.label} expected ${assertion.property}=${assertion.expected}, got ${actual}`,
        );
      }
    }
  } catch (error) {
    fail(
      `Scenario ${scenario.name} runtime style check failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  } finally {
    if (browser) await browser.close();
    await server.close();
  }

  console.log(
    `${packageConsumerLabel(scenario.name)} ok: runtime computed styles resolve semantic token overrides`,
  );
}

function readConsumerBuildCss(workspace) {
  const distRoot = join(workspace, 'dist', 'consumer');
  const files = existingFiles(distRoot).filter((file) => file.endsWith('.css'));
  if (!files.length) fail(`Consumer build did not emit CSS under ${distRoot}`);
  return files.map((file) => readFileSync(file, 'utf8')).join('\n');
}

function normalizeCssForAssertion(css) {
  return css.replace(/\s+/g, '');
}

function consumerBrowserBuildRoot(workspace) {
  const distRoot = join(workspace, 'dist', 'consumer');
  const indexPath = existingFiles(distRoot).find((file) => basename(file) === 'index.html');
  if (!indexPath) fail(`Consumer build did not emit index.html under ${distRoot}`);
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

function assertForbiddenDependenciesNotInstalled(workspace, group) {
  for (const scenario of group.scenarios) {
    for (const dependency of scenario.forbiddenDependencies ?? []) {
      if (group.dependencies.includes(dependency)) continue;
      const dependencyPath = join(workspace, 'node_modules', dependency);
      if (existsSync(dependencyPath)) {
        fail(
          `Scenario ${scenario.name} must not install forbidden optional dependency ${dependency}; found ${dependencyPath}`,
        );
      }
      console.log(
        `${packageConsumerLabel(scenario.name)} ok: forbidden optional dependency ${dependency} is not installed`,
      );
    }
  }
}

async function packBuiltPackage(distRoot, scenarioName) {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-consumer-pack-'));
  await runPnpm(['pack', '--pack-destination', packRoot], distRoot, { scenarioName });
  const tarball = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
  if (!tarball) fail(`Packed package missing in ${packRoot}`);
  return { root: packRoot, tarball: join(packRoot, tarball) };
}

function writeConsumerWorkspace(workspace, scenarios, dependencies = unionDependencies(scenarios)) {
  const scenario = scenarios[0];
  const usesTailwindCss = dependencies.includes('tailwindcss');
  const packageJson = {
    name: `hell-package-consumer-${scenario.name}`,
    private: true,
    type: 'module',
    scripts: {
      build: 'ng build consumer --configuration production',
    },
    dependencies: pickDeps(deps, dependencies),
    devDependencies: pickDeps(devDeps, [
      '@angular/build',
      '@angular/cli',
      '@angular/compiler-cli',
      '@emnapi/core',
      '@emnapi/runtime',
      ...(usesTailwindCss ? tailwindPostcssDevDeps : []),
      'typescript',
    ]),
  };
  packageJson.dependencies[packageName] = pathToFileURL(packedHell.tarball).href;
  if (scenarios.some((candidate) => candidate.installPdfPackage)) {
    packageJson.dependencies[pdfPackageName] = pathToFileURL(packedPdfViewer.tarball).href;
  }

  writeJson(join(workspace, 'package.json'), packageJson);
  writeFileSync(
    join(workspace, '.npmrc'),
    'strict-peer-dependencies=true\nauto-install-peers=false\n',
  );
  if (usesTailwindCss) {
    writeJson(join(workspace, '.postcssrc.json'), {
      plugins: {
        '@tailwindcss/postcss': {},
      },
    });
  }
  writeJson(join(workspace, 'angular.json'), {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    cli: { analytics: false },
    projects: {
      consumer: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular/build:application',
            options: {
              browser: 'src/main.ts',
              index: 'src/index.html',
              tsConfig: 'tsconfig.app.json',
              styles: ['src/styles.css'],
            },
            configurations: {
              production: {
                budgets: [],
              },
            },
            defaultConfiguration: 'production',
          },
        },
      },
    },
  });
  writeJson(join(workspace, 'tsconfig.json'), {
    compileOnSave: false,
    compilerOptions: {
      strict: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      skipLibCheck: true,
      isolatedModules: true,
      experimentalDecorators: true,
      importHelpers: true,
      target: 'ES2022',
      module: 'preserve',
      moduleResolution: 'bundler',
      useDefineForClassFields: false,
      lib: ['ES2022', 'dom'],
    },
    angularCompilerOptions: {
      strictTemplates: true,
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
    },
  });
  writeJson(join(workspace, 'tsconfig.app.json'), {
    extends: './tsconfig.json',
    compilerOptions: {
      outDir: './out-tsc/app',
      types: [],
    },
    files: ['src/main.ts'],
  });

  mkdirSync(join(workspace, 'src'), { recursive: true });
  writeFileSync(
    join(workspace, 'src/index.html'),
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Consumer</title><base href="/"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><app-root></app-root></body></html>\n',
  );
  writeConsumerScenarioFiles(workspace, scenario);
}

function writeConsumerScenarioFiles(workspace, scenario) {
  writeFileSync(join(workspace, 'src/main.ts'), scenario.mainTs);
  writeFileSync(join(workspace, 'src/styles.css'), scenario.stylesCss);
}

function pickDeps(source, names) {
  const picked = {};
  for (const name of names) {
    const version = source[name] ?? deps[name] ?? devDeps[name];
    if (!version) fail(`Workspace catalog missing dependency ${name}`);
    picked[name] = exactInstalledVersion(name) ?? version;
  }
  return picked;
}

function readWorkspaceCatalog() {
  const workspacePath = join(root, 'pnpm-workspace.yaml');
  const source = readFileSync(workspacePath, 'utf8');
  const catalog = {};
  let inCatalog = false;

  for (const line of source.split(/\r?\n/)) {
    if (/^\S/.test(line)) inCatalog = line === 'catalog:';
    if (!inCatalog || !line.startsWith('  ')) continue;

    const match = line.match(/^\s+(['"]?)([^'":]+)\1:\s+(['"]?)([^'"]+)\3\s*$/);
    if (match) catalog[match[2]] = match[4];
  }

  return catalog;
}

function exactInstalledVersion(name) {
  const packageJsonPath = join(root, 'node_modules', name, 'package.json');
  if (!existsSync(packageJsonPath)) return null;

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version ? packageJson.version : null;
}

function rootConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellPartStyleable, HellStyleable, hellTwMerge, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '${packageName}';

const size: HellSize = 'md';
const recipe: HellRecipe<'root'> = { root: 'block' };
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const merged = hellTwMerge('px-hell-4', 'px-hell-7');
void size;
void recipe;
void ui;
void uiInput;
void merged;
void HellPartStyleable;
void HellStyleable;

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<p>Root core contract</p>\`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function coreConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellPartStyleable, HellStyleable, hellTwMerge, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '${packageName}/core';

const size: HellSize = 'md';
const recipe: HellRecipe<'root'> = { root: 'block' };
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const merged = hellTwMerge('px-hell-4', 'px-hell-7');
void size;
void recipe;
void ui;
void uiInput;
void merged;
void HellPartStyleable;
void HellStyleable;

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<p>Core contract</p>\`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function buttonConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton, type HellButtonUi } from '${packageName}/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton],
  template: \`
    <button hellButton type="button" ui="bg-hell-danger border-hell-danger">Save</button>
    <a hellButton href="#details" variant="link" data-test-id="primary-link" [disabled]="disabled" [ui]="linkUi">Details</a>
  \`,
})
class App {
  protected readonly disabled = true;
  protected readonly linkUi = { root: 'text-hell-primary underline-offset-[3px]' } satisfies HellButtonUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function buttonUiConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton, type HellButtonUi } from '${packageName}/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton],
  template: \`
    <button hellButton type="button" ui="rounded-hell-pill">Save</button>
    <a hellButton href="#details" [disabled]="disabled" [ui]="linkUi">Details</a>
  \`,
})
class App {
  protected readonly disabled = true;
  protected readonly linkUi = { root: 'underline-offset-[5px]' } satisfies HellButtonUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function primitivesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellAvatar, type HellAvatarPart, type HellAvatarUi } from '${packageName}/avatar';
import {
  HELL_BREADCRUMBS_DIRECTIVES,
  type HellBreadcrumbEllipsisUi,
  type HellBreadcrumbItemUi,
  type HellBreadcrumbLinkUi,
  type HellBreadcrumbListUi,
  type HellBreadcrumbPageUi,
  type HellBreadcrumbSeparatorUi,
  type HellBreadcrumbsUi,
} from '${packageName}/breadcrumbs';
import { HellButton, type HellButtonUi } from '${packageName}/button';
import { HellDropZone, type HellDropZonePart, type HellDropZoneUi } from '${packageName}/drop-zone';
import { HellIcon, type HellIconPart, type HellIconUi } from '${packageName}/icon';
import { HellInput, type HellInputUi } from '${packageName}/input';
import { HellProgress, HellProgressBar, type HellProgressBarUi, type HellProgressUi } from '${packageName}/progress';
import { HellSearch, HellSearchClear, type HellSearchClearUi, type HellSearchUi } from '${packageName}/search';
import { HellSeparator, type HellSeparatorUi } from '${packageName}/separator';
import {
  HellSkeleton,
  HellSpinner,
  type HellSkeletonUi,
  type HellSpinnerUi,
} from '${packageName}/skeleton';
import {
  HellBadge,
  type HellBadgeUi,
  HellKbd,
  type HellKbdUi,
  HellTag,
  type HellTagUi,
} from '${packageName}/tag';

type PrimitiveRootPart = HellAvatarPart | HellDropZonePart | HellIconPart;

const primitiveRootPart: PrimitiveRootPart = 'root';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HellAvatar,
    ...HELL_BREADCRUMBS_DIRECTIVES,
    HellButton,
    HellDropZone,
    HellIcon,
    HellInput,
    HellProgress,
    HellProgressBar,
    HellSearch,
    HellSearchClear,
    HellSeparator,
    HellSkeleton,
    HellSpinner,
    HellBadge,
    HellKbd,
    HellTag,
  ],
  template: \`
    <button hellButton type="button" [ui]="buttonUi">Save</button>
    <hell-icon name="faSolidCheck" aria-hidden="true" [ui]="iconUi" />
    <input hellInput aria-label="Name" [ui]="inputUi" />

    <span hellTag [ui]="tagUi">Ready</span>
    <span hellBadge [ui]="badgeUi">3</span>
    <kbd hellKbd [ui]="kbdUi">K</kbd>

    <div hellSeparator [ui]="separatorUi"></div>
    <div hellProgress [ui]="progressUi">
      <div hellProgressBar [ui]="progressBarUi"></div>
    </div>

    <div hellSkeleton [ui]="skeletonUi"></div>
    <span hellSpinner [ui]="spinnerUi"></span>
    <hell-avatar fallback="AP" [ui]="avatarUi" />

    <nav hellBreadcrumbs [ui]="breadcrumbsUi">
      <ol hellBreadcrumbList [ui]="breadcrumbListUi">
        <li hellBreadcrumbItem [ui]="breadcrumbItemUi">
          <a hellBreadcrumbLink href="#" [ui]="breadcrumbLinkUi">Home</a>
        </li>
        <li hellBreadcrumbSeparator [ui]="breadcrumbSeparatorUi"></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage [ui]="breadcrumbPageUi">Current</span>
        </li>
        <li>
          <button hellBreadcrumbEllipsis [ui]="breadcrumbEllipsisUi"></button>
        </li>
      </ol>
    </nav>

    <div hellSearch [ui]="searchUi">
      <input hellInput type="search" aria-label="Search" />
      <button hellSearchClear [ui]="searchClearUi">Clear</button>
    </div>

    <div hellDropzone [ui]="dropZoneUi">Drop files</div>
  \`,
})
class App {
  protected readonly primitiveRootPart = primitiveRootPart;
  protected readonly avatarUi = { root: 'bg-hell-info-soft' } satisfies HellAvatarUi;
  protected readonly badgeUi = { root: 'bg-hell-info' } satisfies HellBadgeUi;
  protected readonly breadcrumbEllipsisUi = { root: 'text-hell-info' } satisfies HellBreadcrumbEllipsisUi;
  protected readonly breadcrumbItemUi = { root: 'gap-hell-2' } satisfies HellBreadcrumbItemUi;
  protected readonly breadcrumbLinkUi = { root: 'text-hell-info' } satisfies HellBreadcrumbLinkUi;
  protected readonly breadcrumbListUi = { root: 'gap-hell-2' } satisfies HellBreadcrumbListUi;
  protected readonly breadcrumbPageUi = { root: 'text-hell-info-strong' } satisfies HellBreadcrumbPageUi;
  protected readonly breadcrumbSeparatorUi = { root: 'text-hell-info' } satisfies HellBreadcrumbSeparatorUi;
  protected readonly breadcrumbsUi = { root: 'text-hell-info' } satisfies HellBreadcrumbsUi;
  protected readonly buttonUi = { root: 'bg-hell-info' } satisfies HellButtonUi;
  protected readonly dropZoneUi = { root: 'border-hell-info' } satisfies HellDropZoneUi;
  protected readonly iconUi = { root: 'text-hell-info' } satisfies HellIconUi;
  protected readonly inputUi = { root: 'border-hell-info' } satisfies HellInputUi;
  protected readonly kbdUi = { root: 'border-hell-info' } satisfies HellKbdUi;
  protected readonly progressBarUi = { root: 'bg-hell-info' } satisfies HellProgressBarUi;
  protected readonly progressUi = { root: 'bg-hell-info-soft' } satisfies HellProgressUi;
  protected readonly searchClearUi = { root: 'text-hell-info' } satisfies HellSearchClearUi;
  protected readonly searchUi = { root: 'grid gap-hell-2' } satisfies HellSearchUi;
  protected readonly separatorUi = { root: 'bg-hell-info' } satisfies HellSeparatorUi;
  protected readonly skeletonUi = { root: 'bg-hell-info-soft' } satisfies HellSkeletonUi;
  protected readonly spinnerUi = { root: 'text-hell-info' } satisfies HellSpinnerUi;
  protected readonly tagUi = { root: 'bg-hell-info-soft' } satisfies HellTagUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function compositesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_APP_SHELL_DIRECTIVES } from '${packageName}/app-shell';
import { HellDateInput } from '${packageName}/date-input';
import { HellDatePicker, HellDateRangePicker } from '${packageName}/date-picker';
import { HellDialpad, type HellDialpadUi } from '${packageName}/dialpad';
import { HellTimeInput, type HellTimeValue } from '${packageName}/time-input';

const dialpadUi = {
  root: 'max-w-[320px]',
  keyButton: 'rounded-full',
} satisfies HellDialpadUi;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ...HELL_APP_SHELL_DIRECTIVES,
    HellDateInput,
    HellDatePicker,
    HellDateRangePicker,
    HellDialpad,
    HellTimeInput,
  ],
  template: \`
    <div hellAppShell>
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
      </header>
      <nav hellAppSidenav>Navigation</nav>
      <main hellAppContent>
        <hell-date-input aria-label="Ship date" [date]="date" />
        <hell-time-input aria-label="Ship time" [value]="time" />
        <hell-date-picker [date]="date" />
        <hell-date-range-picker [startDate]="rangeStart" [endDate]="rangeEnd" />
        <hell-dialpad [ui]="dialpadUi" />
      </main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button">Details</button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  \`,
})
class App {
  protected readonly date = new Date(2026, 3, 22);
  protected readonly rangeStart = new Date(2026, 3, 5);
  protected readonly rangeEnd = new Date(2026, 3, 12);
  protected readonly time: HellTimeValue = { hour: 9, minute: 30, second: 0 };
  protected readonly dialpadUi = dialpadUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function appShellConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_APP_SHELL_DIRECTIVES } from '${packageName}/app-shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: \`
    <div hellAppShell>
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
      </header>
      <nav hellAppSidenav>Navigation</nav>
      <main hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button">Details</button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  \`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function audioPlayerConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellAudioPlayer } from '${packageName}/audio-player';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellAudioPlayer],
  template: \`<hell-audio-player src="/sample.ogg" title="Status recording" />\`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function audioTranscriptConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellAudioPlayer } from '${packageName}/audio-player';
import { provideHellAudioTranscript } from '${packageName}/features/audio-transcript';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellAudioPlayer],
  template: \`<hell-audio-player src="/sample.ogg" title="Transcript recording" allowSpeechTranscript />\`,
})
class App {}

bootstrapApplication(App, {
  providers: [...provideHellAudioTranscript()],
}).catch((error: unknown) => console.error(error));
`;
}

function testingConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HellButtonHarness,
  HellComboboxHarness,
  HellDialogHarness,
  HellDialogOverlayHarness,
  HellMenuTriggerHarness,
  HellSelectHarness,
  HellTableHarness,
} from '${packageName}/testing';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<p>Harness compile check</p>',
})
class App {
  protected readonly harnessTypes = [
    HellButtonHarness,
    HellComboboxHarness,
    HellDialogHarness,
    HellDialogOverlayHarness,
    HellMenuTriggerHarness,
    HellSelectHarness,
    HellTableHarness,
  ];
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function codeEditorConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellCodeEditor } from '${packageName}/features/code-editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellCodeEditor],
  template: \`<hell-code-editor [value]="code" readOnly />\`,
})
class App {
  protected readonly code = 'console.log("hell")';
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function tableConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_TABLE_UTILITIES_DIRECTIVES, HellTableRowIgnore } from '${packageName}/table';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES, HellTableRowIgnore],
  template: \`
    <div hellTableContainer>
      <table hellTableRoot>
        <thead hellTableHeader>
          <tr hellTableRow>
            <th hellTableHeaderCell hellTableSelectionCell>
              <input hellTableRowCheckbox type="checkbox" aria-label="Select all" />
            </th>
            <th hellTableHeaderCell columnId="name">Name</th>
            <th hellTableHeaderCell columnId="role">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr hellTableRow active selected>
            <td hellTableCell hellTableSelectionCell>
              <input hellTableRowRadio type="radio" name="primary" aria-label="Primary row" checked />
            </td>
            <td hellTableCell>
              <span hellTableRowIgnore>ignore</span>
              <button hellTableRowAction type="button">Open</button>
            </td>
            <td hellTableCell>Admin</td>
          </tr>
        </tbody>
      </table>
    </div>
  \`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function tableTanStackConsumerMainTs() {
  return `import { Component, signal, type WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';
import {
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellFooter,
  HellTableShellToolbar,
  HellTableStatus,
  HellTanStackGlobalFilter,
  HellTanStackPagination,
  HellTanStackTable,
} from '${packageName}/table-tanstack';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HellTanStackTable,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellFooter,
    HellTableShellToolbar,
    HellTanStackGlobalFilter,
    HellTanStackPagination,
  ],
  template: \`
    <hell-tanstack-table [table]="table" [status]="HellTableStatus.READY" stickyHeader>
      <hell-tanstack-global-filter hellTableShellToolbar [table]="table" />

      <ng-template hellTableShellCell="actions" let-row="row">
        <button type="button">Edit {{ row.original.name }}</button>
      </ng-template>

      <ng-template hellTableShellEmpty>No people.</ng-template>

      <span hellTableShellFooter>{{ table.getRowModel().rows.length }} visible</span>
      <hell-tanstack-pagination hellTableShellFooter [table]="table" [pageSizeOptions]="[1, 2]" />
    </hell-tanstack-table>
  \`,
})
class App {
  protected readonly HellTableStatus = HellTableStatus;
  protected readonly rows = signal<Person[]>([
    { id: 'ada', name: 'Ada Lovelace', active: true },
    { id: 'grace', name: 'Grace Hopper', active: false },
  ]);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly rowSelection = signal<RowSelectionState>({});
  protected readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 1 });
  protected readonly globalFilter = signal('');
  protected readonly columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (context) => \`Person \${context.getValue<string>()}\`,
      enableSorting: true,
      meta: { hell: { headerClass: 'w-56', cellClass: 'font-medium' } },
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: (context) => (context.getValue<boolean>() ? 'Active' : 'Inactive'),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Actions',
    },
  ];
  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: {
      sorting: this.sorting(),
      rowSelection: this.rowSelection(),
      pagination: this.pagination(),
      globalFilter: this.globalFilter(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onRowSelectionChange: (updater) => applyUpdater(this.rowSelection, updater),
    onPaginationChange: (updater) => applyUpdater(this.pagination, updater),
    onGlobalFilterChange: (updater) => applyUpdater(this.globalFilter, updater),
  }));
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function tableTanStackVirtualConsumerMainTs() {
  return `import { Component, signal, type WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  createAngularTable,
  getCoreRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type ExpandedState,
  type Updater,
} from '@tanstack/angular-table';
import {
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTanStackTable,
} from '${packageName}/table-tanstack';
import { HellTanStackVirtualRows } from '${packageName}/table-tanstack/virtual';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellTanStackTable, HellTanStackVirtualRows, HellTableShellEmpty, HellTableShellExpandedRow],
  template: \`
    <hell-tanstack-table
      [table]="table"
      hellTanStackVirtualRows
      [virtualEstimateRowSize]="44"
      [virtualOverscan]="2"
    >
      <ng-template hellTableShellEmpty>No people.</ng-template>
      <ng-template hellTableShellExpandedRow let-row="row">
        <p>{{ row.original.name }} details</p>
      </ng-template>
    </hell-tanstack-table>
  \`,
})
class App {
  protected readonly rows = signal<Person[]>([
    { id: 'ada', name: 'Ada Lovelace', active: true },
    { id: 'grace', name: 'Grace Hopper', active: false },
  ]);
  protected readonly expanded = signal<ExpandedState>({ ada: true });
  protected readonly columns: ColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'active', header: 'Active', cell: (context) => String(context.getValue<boolean>()) },
  ];
  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
    state: { expanded: this.expanded() },
    onExpandedChange: (updater) => applyUpdater(this.expanded, updater),
  }));
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function noLegacyTableAliasConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { REMOVED_DATA_TABLE } from '${packageName}/data-table';
import { HELL_TABLE_DIRECTIVES } from '${packageName}/features/data-table';
import { HELL_TABLE_UTILITY_DIRECTIVES } from '${packageName}/features/table-utilities';
import { REMOVED_TABLE_CDK } from '${packageName}/table-cdk';
import { REMOVED_TABLE_VIRTUAL } from '${packageName}/table-virtual';
import { REMOVED_PRIMITIVES } from '${packageName}/primitives';
import { REMOVED_COMPOSITES } from '${packageName}/composites';

const removedTableAliases = [
  HELL_TABLE_DIRECTIVES,
  HELL_TABLE_UTILITY_DIRECTIVES,
  REMOVED_DATA_TABLE,
  REMOVED_TABLE_CDK,
  REMOVED_TABLE_VIRTUAL,
  REMOVED_PRIMITIVES,
  REMOVED_COMPOSITES,
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...removedTableAliases],
  template: \`<p>Legacy table aliases must not compile.</p>\`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function pdfViewerConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellPdfViewer, type HellPdfWorkerSource } from '${pdfPackageName}';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellPdfViewer],
  template: \`<hell-pdf-viewer [src]="pdfSrc" [worker]="pdfWorker" />\`,
})
class App {
  protected readonly pdfSrc = '/sample.pdf';
  protected readonly pdfWorker: HellPdfWorkerSource = '/assets/pdf.worker.mjs';
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function emptyConsumerStylesCss() {
  return '';
}

function primitivesConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/input/styles.css";
@import "${packageName}/avatar/styles.css";
@import "${packageName}/breadcrumbs/styles.css";
@import "${packageName}/drop-zone/styles.css";
@import "${packageName}/progress/styles.css";
@import "${packageName}/separator/styles.css";
@import "${packageName}/skeleton/styles.css";
@import "${packageName}/tag/styles.css";
`;
}

function buttonConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
:root { --color-hell-primary:#3452ff; }
`;
}

function appShellConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/app-shell/styles.css";
@import "${packageName}/date-input/styles.css";
@import "${packageName}/date-picker/styles.css";
@import "${packageName}/time-input/styles.css";
`;
}

function audioPlayerConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/flyout/styles.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/slider/styles.css";
@import "${packageName}/audio-player/styles.css";
`;
}

function codeEditorConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/features/code-editor/styles.css";
`;
}

function tableConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/checkbox/styles.css";
@import "${packageName}/radio/styles.css";
@import "${packageName}/table/styles.css";
`;
}

function tableTanStackConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/checkbox/styles.css";
@import "${packageName}/input/styles.css";
@import "${packageName}/radio/styles.css";
@import "${packageName}/table-tanstack/styles.css";
`;
}

function pdfViewerConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${pdfPackageName}/styles";
`;
}

function noLegacyTableAliasConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/kitchen-sink";
@import "${packageName}/styles/components/button";
@import "${packageName}/styles/components/data-table";
@import "${packageName}/styles/features/data-table";
@import "${packageName}/styles/features/table-utilities";
@import "${packageName}/styles/components/table-renderer";
@import "${packageName}/styles/primitives";
@import "${packageName}/styles/composites";
@import "${packageName}/styles/table";
@import "${packageName}/styles/tokens";
`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runPnpmPreflight(cwd) {
  const label = packageConsumerLabel('preflight');
  const env = pnpmCommandEnvironment();

  console.log(`${label} running pnpm preflight before package build`);

  const version = requirePnpmPreflightValue(['--version'], cwd, env, 'pnpm version');
  if (!/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)) {
    failPnpmPreflight('pnpm version is not a semver value', [`version: ${version}`]);
  }

  const registry = requirePnpmPreflightValue(
    ['config', 'get', 'registry'],
    cwd,
    env,
    'registry config',
  );
  assertPnpmRegistry(registry);

  const store = requirePnpmPreflightValue(['store', 'path'], cwd, env, 'store path');
  const storeDirectory = assertWritablePnpmStore(store, cwd);

  const strictPeerDependencies = requirePnpmPreflightValue(
    ['config', 'get', 'strict-peer-dependencies'],
    cwd,
    env,
    'strict-peer-dependencies config',
  );
  const autoInstallPeers = requirePnpmPreflightValue(
    ['config', 'get', 'auto-install-peers'],
    cwd,
    env,
    'auto-install-peers config',
  );
  assertStrictPeerMode(strictPeerDependencies, autoInstallPeers);

  requirePnpmPreflightCommand(['ping', '--registry', registry], cwd, env, 'registry reachability');

  console.log(
    `${label} ok: pnpm ${version}; registry ${registry}; store ${storeDirectory}; ` +
      `strict-peer-dependencies=${strictPeerDependencies}; auto-install-peers=${autoInstallPeers}`,
  );
}

function requirePnpmPreflightValue(args, cwd, env, description) {
  const result = requirePnpmPreflightCommand(args, cwd, env, description);
  const value = result.stdout.trim();
  if (!value) failPnpmPreflight(`${description} returned no value`, [`command: ${result.command}`]);
  return value;
}

function requirePnpmPreflightCommand(args, cwd, env, description) {
  const commandArgs = args[0] === 'config' ? pnpmConfigCommandArgs(args) : pnpmCommandArgs(args);
  const command = formatCommand('pnpm', commandArgs);
  const result = spawnSync('pnpm', commandArgs, {
    cwd,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
    timeout: pnpmPreflightTimeoutMs,
  });

  if (result.error) {
    failPnpmPreflight(`${description} failed`, [
      `command: ${command}`,
      `error: ${result.error.message}`,
      pnpmPreflightOutputSummary(result),
    ]);
  }

  if (result.status !== 0) {
    failPnpmPreflight(`${description} failed`, [
      `command: ${command}`,
      `status: ${result.status}`,
      pnpmPreflightOutputSummary(result),
    ]);
  }

  return { command, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function assertPnpmRegistry(registry) {
  try {
    const parsed = new URL(registry);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      failPnpmPreflight('registry config must use http or https', [`registry: ${registry}`]);
    }
  } catch (error) {
    failPnpmPreflight('registry config is not a valid URL', [
      `registry: ${registry}`,
      error instanceof Error ? error.message : String(error),
    ]);
  }
}

function assertWritablePnpmStore(store, cwd) {
  const storeDirectory = normalizePnpmPath(store, cwd);
  if (!storeDirectory) failPnpmPreflight('pnpm store path is empty');

  const probe = join(
    storeDirectory,
    `.hell-package-consumer-preflight-${process.pid}-${Date.now()}`,
  );
  try {
    mkdirSync(storeDirectory, { recursive: true });
    writeFileSync(probe, 'ok\n');
    rmSync(probe, { force: true });
  } catch (error) {
    failPnpmPreflight('pnpm store directory is not writable', [
      `store: ${storeDirectory}`,
      error instanceof Error ? error.message : String(error),
    ]);
  }

  return storeDirectory;
}

function assertStrictPeerMode(strictPeerDependencies, autoInstallPeers) {
  if (!packageManagerConfigBoolean(strictPeerDependencies)) {
    failPnpmPreflight('strict-peer-dependencies must be true', [
      `strict-peer-dependencies=${strictPeerDependencies}`,
    ]);
  }
  if (packageManagerConfigBoolean(autoInstallPeers)) {
    failPnpmPreflight('auto-install-peers must be false', [
      `auto-install-peers=${autoInstallPeers}`,
    ]);
  }
}

function packageManagerConfigBoolean(value) {
  return value.trim().toLowerCase() === 'true' || value.trim() === '1';
}

function failPnpmPreflight(message, details = []) {
  fail([`pnpm preflight failed: ${message}`, ...details.filter(Boolean)].join('\n'));
}

function pnpmPreflightOutputSummary(result) {
  const output = [result.stderr, result.stdout]
    .filter(Boolean)
    .join('\n')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join(' | ');

  if (!output) return 'output: (none)';
  return `output: ${truncate(output, 500)}`;
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function runRootPnpm(args, cwd) {
  const commandArgs = pnpmCommandArgs(args);
  console.log(`[package-consumer] ${formatCommand('pnpm', commandArgs)}`);
  const result = spawnSync('pnpm', commandArgs, {
    cwd,
    env: pnpmCommandEnvironment(),
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0)
    fail(`${formatCommand('pnpm', commandArgs)} failed with ${result.status}`);
}

async function runPnpm(args, cwd, options = {}) {
  const { command, diagnostics, result } = await runPnpmCommand(args, cwd, options);
  if (result.timedOut) fail(pnpmTimeoutMessage(command, cwd, diagnostics));
  if (result.error) fail(`Unable to start command: ${command}\n${result.error.message}`);
  if (result.signal) fail(`Command failed with signal ${result.signal}: ${command}`);
  if (result.status !== 0) fail(`Command failed with status ${result.status}: ${command}`);
}

async function runPnpmExpectingFailure(args, cwd, options = {}) {
  const { command, diagnostics, label, result } = await runPnpmCommand(args, cwd, {
    ...options,
    captureOutput: true,
  });
  if (result.timedOut) fail(pnpmTimeoutMessage(command, cwd, diagnostics));
  if (result.error) fail(`Unable to start command: ${command}\n${result.error.message}`);
  if (result.signal) fail(`Command failed with signal ${result.signal}: ${command}`);
  if (result.status === 0)
    fail(`Expected command to fail for negative scenario ${label}: ${command}`);
  assertExpectedFailureOutput(label, result, options.expectedOutputIncludes ?? []);
  console.log(`${label} ok: command failed as expected with status ${result.status}: ${command}`);
}

async function runPnpmCommand(args, cwd, options = {}) {
  const env = pnpmCommandEnvironment();
  const scenarioName = options.scenarioName ?? 'unknown';
  const label = packageConsumerLabel(scenarioName);
  const commandArgs = pnpmCommandArgs(args);
  const command = formatCommand('pnpm', commandArgs);

  console.log(`${label} running command: ${command}`);
  console.log(`${label} cwd: ${cwd}`);
  const diagnostics = collectPnpmDiagnostics(cwd, env);
  if (options.printInstallDiagnostics) {
    printPnpmInstallDiagnostics(label, scenarioName, cwd, diagnostics);
  }

  const result = await spawnPnpm(commandArgs, cwd, env, label, command, {
    captureOutput: options.captureOutput === true,
  });
  return { command, diagnostics, label, result };
}

function assertExpectedFailureOutput(label, result, expectedOutputIncludes) {
  if (!expectedOutputIncludes.length) return;

  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const missing = expectedOutputIncludes.filter((needle) => !output.includes(needle));
  if (missing.length) {
    fail(`${label} failure output is missing expected fragment(s): ${missing.join(', ')}`);
  }

  console.log(`${label} ok: failure output mentions ${expectedOutputIncludes.join(', ')}`);
}

function spawnPnpm(args, cwd, env, label, command, options = {}) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn('pnpm', args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    let error = null;
    let timedOut = false;
    let killTimer = null;
    let stdout = '';
    let stderr = '';

    const heartbeat = setInterval(() => {
      console.log(
        `${label} heartbeat: ${command} still running after ${formatDuration(Date.now() - startedAt)} ` +
          `(timeout ${formatDuration(pnpmTimeoutMs)})`,
      );
    }, pnpmHeartbeatMs);
    heartbeat.unref();

    const timeout = setTimeout(() => {
      timedOut = true;
      clearInterval(heartbeat);
      console.error(
        `${label} timeout: terminating ${command} after ${formatDuration(Date.now() - startedAt)}`,
      );
      child.kill('SIGTERM');
      killTimer = setTimeout(() => child.kill('SIGKILL'), 5_000);
      killTimer.unref();
    }, pnpmTimeoutMs);
    timeout.unref();

    child.stdout?.on('data', (chunk) => {
      const value = chunk.toString();
      if (options.captureOutput) stdout += value;
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      const value = chunk.toString();
      if (options.captureOutput) stderr += value;
      process.stderr.write(chunk);
    });
    child.on('error', (caught) => {
      error = caught;
    });
    child.on('close', (status, signal) => {
      clearInterval(heartbeat);
      clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      const verb = timedOut ? 'stopped' : 'finished';
      console.log(
        `${label} ${verb} command after ${formatDuration(Date.now() - startedAt)}: ${command}`,
      );
      resolve({ status, signal, error, timedOut, stdout, stderr });
    });
  });
}

function printPnpmInstallDiagnostics(label, scenarioName, tempRoot, diagnostics) {
  console.log(`${label} pnpm install diagnostics:`);
  console.log(`${label} scenario name: ${scenarioName}`);
  console.log(`${label} temp directory: ${tempRoot}`);
  console.log(`${label} pnpm store: ${diagnostics.store}`);
  console.log(`${label} registry: ${diagnostics.registry}`);
  console.log(`${label} package manager version: pnpm ${diagnostics.version}`);
  console.log(`${label} strict-peer-dependencies: ${diagnostics.strictPeerDependencies}`);
  console.log(`${label} auto-install-peers: ${diagnostics.autoInstallPeers}`);
}

function collectPnpmDiagnostics(cwd, env) {
  const store = normalizePnpmPath(readPnpmValue(['store', 'path'], cwd, env), cwd) ?? 'unknown';
  const registry = readPnpmValue(['config', 'get', 'registry'], cwd, env) ?? 'unknown';
  const version = readPnpmValue(['--version'], cwd, env) ?? 'unknown';
  const strictPeerDependencies =
    readPnpmValue(['config', 'get', 'strict-peer-dependencies'], cwd, env) ?? 'unknown';
  const autoInstallPeers =
    readPnpmValue(['config', 'get', 'auto-install-peers'], cwd, env) ?? 'unknown';

  return { store, registry, version, strictPeerDependencies, autoInstallPeers };
}

function readPnpmValue(args, cwd, env) {
  const commandArgs = args[0] === 'config' ? pnpmConfigCommandArgs(args) : pnpmCommandArgs(args);
  const result = spawnSync('pnpm', commandArgs, {
    cwd,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
    timeout: 15_000,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function normalizePnpmPath(value, cwd) {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return isAbsolute(normalized) ? normalized : join(cwd, normalized);
}

function pnpmTimeoutMessage(command, cwd, diagnostics) {
  return [
    `Command timed out after ${formatDuration(pnpmTimeoutMs)}: ${command}`,
    `exact command: ${command}`,
    `cwd: ${cwd}`,
    `pnpm store: ${diagnostics?.store ?? 'unknown'}`,
  ].join('\n');
}

function packageConsumerLabel(scenarioName) {
  return scenarioName ? `[package-consumer:${scenarioName}]` : '[package-consumer]';
}

function formatDuration(ms) {
  if (ms < 1_000) return `${ms}ms`;
  return `${Math.round(ms / 1_000)}s`;
}

function pnpmCommandArgs(args) {
  return args;
}

function pnpmConfigCommandArgs(args) {
  return ['--config.strict-peer-dependencies=true', '--config.auto-install-peers=false', ...args];
}

function formatCommand(command, args) {
  return [command, ...args].map(shellQuote).join(' ');
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\\''")}'`;
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

function positiveNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function walkFiles(path) {
  const out = [];
  for (const name of readdirSync(path)) {
    const fullPath = join(path, name);
    if (statSync(fullPath).isDirectory()) out.push(...walkFiles(fullPath));
    else out.push(fullPath);
  }
  return out;
}

function fail(message) {
  console.error(`[package-consumer] ${message}`);
  process.exit(1);
}
