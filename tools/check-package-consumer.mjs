import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
import { basename, dirname, extname, join, resolve } from 'node:path';
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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const packageConsumerArgs = process.argv.slice(2);

// CI shards scenarios by these groups (ci.yml passes HELL_PACKAGE_CONSUMER_GROUP).
// assertScenarioGroupsCoverAllOnce keeps every scenario in exactly one group.
const packageConsumerCiGroups = [
  { name: 'core', scenarios: ['root-core', 'core', 'testing'] },
  {
    name: 'primitive-foundations',
    scenarios: [
      'primitive-icons-css',
      'button-ui',
      'chip-input',
      'control-group',
      'pagination',
      'combobox-chips',
    ],
  },
  { name: 'button', scenarios: ['button'] },
  {
    name: 'composite-foundations',
    scenarios: ['composite-css', 'app-shell', 'filter-bar', 'page-header', 'resizable', 'split-view'],
  },
  { name: 'audio', scenarios: ['audio-player', 'audio-transcript'] },
  { name: 'features', scenarios: ['code-editor', 'pdf-viewer'] },
  { name: 'table-core', scenarios: ['table'] },
  { name: 'table-tanstack-virtual', scenarios: ['table-tanstack', 'table-tanstack-virtual'] },
];

const selectedScenarioNames = parseScenarioSelection(packageConsumerArgs);
const minimalDependencyMode = parseMinimalDependencyMode(packageConsumerArgs);
const skipPackageBuild = parseSkipPackageBuild(packageConsumerArgs);
const pnpmTimeoutMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_TIMEOUT_MS, 600_000);
const pnpmHeartbeatMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_HEARTBEAT_MS, 30_000);
const runtimeStyleCheck = process.env.HELL_PACKAGE_CONSUMER_RUNTIME_STYLE_CHECK === '1';

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
];
const styledUiWithoutFontAwesomeDeps = [...behaviorUiWithoutFontAwesomeDeps, 'tailwindcss'];
const styledUiDeps = [...styledUiWithoutFontAwesomeDeps, '@ng-icons/core', '@ng-icons/font-awesome'];
const styledUiRouterDeps = [...styledUiDeps, '@angular/router'];
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
  'pdf-viewer-feature',
]);

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
      'border-radius:var(--radius-hell-lg)',
      'flex-basis:100%',
      'min-width:200px',
      'max-height:min(320px,var(--ngp-select-available-height,320px))',
      'max-height:min(320px,var(--ngp-combobox-available-height,320px))',
      'max-width:320px',
      'pointer-events:none',
      'position:fixed',
      'transition-property:height',
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
    name: 'chip-input',
    description:
      'narrow Chip entry exposes the Chip Input keyboard bridge with consumer-owned values',
    coverage: ['no-css-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive-ui',
    dependencies: coreDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: chipInputConsumerMainTs,
    stylesCss: emptyConsumerStylesCss,
  },
  {
    name: 'control-group',
    description: 'narrow Control Group entry with local Part Style Maps and entrypoint CSS',
    coverage: ['styled-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive',
    dependencies: styledUiWithoutFontAwesomeDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: controlGroupConsumerMainTs,
    stylesCss: controlGroupConsumerStylesCss,
    cssIncludes: [
      'min-height:var(--spacing-hell-control-md)',
      'transition-property:background-color,border-color,box-shadow',
      '[data-focus-within=true]{border-color:var(--color-hell-border-focus)',
      'border-inline-start-width:1px',
    ],
  },
  {
    name: 'pagination',
    description: 'narrow pagination primitive entry with Part Style Map controls',
    coverage: ['styled-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive',
    dependencies: buttonStyledDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: paginationConsumerMainTs,
    stylesCss: paginationConsumerStylesCss,
    cssIncludes: [
      'transition-property:background-color,border-color,color,box-shadow',
      'background-color:var(--color-hell-primary)',
    ],
  },
  {
    name: 'combobox-chips',
    description:
      'combobox-only entrypoint CSS carries its composed chip recipe and built-in remove glyph',
    coverage: ['styled-primitives'],
    peerTier: 'primitive',
    peerGroup: 'primitive',
    dependencies: styledUiWithoutFontAwesomeDeps,
    forbiddenDependencies: tableAdapterPeerGroup,
    mainTs: comboboxChipsConsumerMainTs,
    stylesCss: comboboxChipsConsumerStylesCss,
    cssIncludes: [
      'border-radius:var(--radius-hell-pill)',
      '--_hell-chip-bg:var(--color-hell-surface-muted)',
      'mask:var(--hell-icon-close) center/contain no-repeat',
    ],
    runtimeStyleAssertions: [
      {
        label: 'composed chip recipe from combobox-only styles',
        selector: '[data-test-id="combobox-chips"] [hellChip][tabindex="0"]',
        property: 'border-radius',
        expected: '999px',
      },
    ],
  },
  {
    name: 'composite-css',
    aliases: ['composites'],
    description: 'narrow composite entries with entrypoint CSS and icon-backed peers',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite-icons-router',
    dependencies: styledUiRouterDeps,
    mainTs: compositesConsumerMainTs,
    stylesCss: compositesConsumerStylesCss,
    cssIncludes: [
      '.max-w-\\[480px\\]{max-width:480px}',
      '.backdrop-blur-\\[2px\\]{--tw-backdrop-blur: blur(2px)',
      'z-index:var(--hell-z-dialog-scoped)',
      '.me-\\[-4px\\]{margin-inline-end:-4px}',
      '.scale-\\[0\\.98\\]{scale:.98}',
      '.text-\\[10px\\]{font-size:10px}',
      'animation:hell-shimmer',
      'mask:var(--hell-icon-refresh) center/contain no-repeat',
    ],
  },
  {
    name: 'app-shell',
    description: 'narrow app-shell composite entry without Font Awesome or feature peers',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: appShellConsumerMainTs,
    stylesCss: appShellConsumerStylesCss,
    cssIncludes: [
      'grid-template-columns:var(--hell-app-sidenav-width) 1fr var(--hell-app-secondary-width)',
      'grid-template-rows:var(--hell-app-topbar-height) 1fr',
      'background-color:var(--color-hell-surface)',
      'width:min(var(--hell-app-secondary-width),calc(100vw - var(--spacing-hell-8)))',
    ],
  },
  {
    name: 'resizable',
    description: 'narrow resizable composite entry with Part Style Map roots',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: resizableConsumerMainTs,
    stylesCss: resizableConsumerStylesCss,
    cssIncludes: [
      'flex:var(--_hell-resizable-pane-flex,var(--hell-pane-flex,1) 1 0)',
      'overflow:auto',
      'cursor:col-resize',
      'background-color:transparent',
    ],
  },
  {
    name: 'split-view',
    description: 'narrow split-view composite entry with owned Part Style Map anatomy',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite-icons',
    dependencies: styledUiDeps,
    mainTs: splitViewConsumerMainTs,
    stylesCss: splitViewConsumerStylesCss,
    cssIncludes: [
      'height:var(--hell-split-view-height,100%)',
      'overflow:hidden',
      'border-radius:var(--radius-hell-md)',
      'transform:rotate(180deg)',
    ],
  },
  {
    name: 'filter-bar',
    description: 'narrow controlled Filter Bar composite with composed entrypoint styles',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite-icons',
    dependencies: styledUiDeps,
    mainTs: filterBarConsumerMainTs,
    stylesCss: filterBarConsumerStylesCss,
    cssIncludes: [
      'min-width:180px',
      'max-width:calc(var(--spacing) * 56)',
      'pointer-events:none',
      'z-index:var(--hell-z-popover,60)',
    ],
  },
  {
    name: 'page-header',
    description: 'narrow page-header composite with built-in back-button styles',
    coverage: ['composites'],
    peerTier: 'composite',
    peerGroup: 'composite',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: pageHeaderConsumerMainTs,
    stylesCss: pageHeaderConsumerStylesCss,
    cssIncludes: [
      'max-width:65ch',
      'font-size:var(--text-xl)',
      'transition-property:background-color,border-color,color,box-shadow',
    ],
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
    cssIncludes: [
      '.max-w-\\[var\\(--hell-audio-max-width\\,none\\)\\]{max-width:var(--hell-audio-max-width,none)}',
      '.flex-\\[0_0_7\\.5rem\\]{flex:0 0 7.5rem}',
      '.tracking-\\[0\\.04em\\]{--tw-tracking: .04em;letter-spacing:.04em}',
      '.animate-\\[hell-audio-captions-in_200ms_var\\(--ease-hell-out\\,ease\\)\\]{animation:hell-audio-captions-in .2s var(--ease-hell-out,ease)}',
    ],
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
    cssIncludes: [
      'background-image:linear-gradient(180deg,color-mix(in oklab,var(--color-hell-surface-subtle) 94%,white),var(--color-hell-surface-subtle))',
      '.min-h-\\[inherit\\]{min-height:inherit}',
      '.data-\\[readonly\\=true\\]\\:bg-hell-surface-subtle[data-readonly=true]',
    ],
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
    cssIncludes: [
      'table-layout:fixed',
      'border-spacing:var(--tw-border-spacing-x)var(--tw-border-spacing-y)',
      'background-color:var(--color-hell-surface-elevated)',
      'text-overflow:ellipsis',
      'cursor:col-resize',
      'width:44px',
    ],
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
    name: 'pdf-viewer',
    description: 'pdf.js feature entrypoint with pdfjs and light UI peers',
    coverage: ['pdf-viewer-feature'],
    peerTier: 'pdf-viewer',
    peerGroup: 'pdf-viewer',
    dependencies: pdfViewerDeps,
    mainTs: pdfViewerConsumerMainTs,
    stylesCss: pdfViewerConsumerStylesCss,
  },
];

if (skipPackageBuild) {
  console.log('[package-consumer] using prebuilt packages from dist; skipping build:lib');
} else {
  runRootPnpm(['run', 'build:lib'], root);
}

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}`);
}

const distPackageJson = JSON.parse(readFileSync(join(distHell, 'package.json'), 'utf8'));
const packageName = distPackageJson.name;
if (!packageName) {
  fail('Built package.json is missing name');
}

const packedHell = await packBuiltPackage(distHell, 'pack-core');
try {
  auditPackedPackage({ tarball: packedHell.tarball });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const workspaceCatalog = readWorkspaceCatalog();
const workspaceOverrides = readWorkspaceOverrides();
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
  } else {
    rmSync(packedHell.root, { force: true, recursive: true });
  }
}

function parseScenarioSelection(args) {
  const argSelection = parseScenarioTokens(args, false);
  if (argSelection.length) return argSelection;

  const groupName = (process.env.HELL_PACKAGE_CONSUMER_GROUP ?? '').trim();
  if (groupName) {
    const group = packageConsumerCiGroups.find((candidate) => candidate.name === groupName);
    if (!group) {
      fail(
        `Unknown package-consumer CI group ${groupName}; known groups: ${packageConsumerCiGroups
          .map((candidate) => candidate.name)
          .join(', ')}`,
      );
    }
    return [...group.scenarios];
  }

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

function parseSkipPackageBuild(args) {
  const envMode = process.env.HELL_PACKAGE_CONSUMER_SKIP_BUILD;
  if (envMode === '1' || envMode === 'true') return true;

  return args.some((arg) => arg === '--skip-build' || arg === '--prebuilt');
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

function materializeScenarios(catalog) {
  return catalog.map((scenario) => ({
    ...scenario,
    aliases: [...(scenario.aliases ?? [])],
    coverage: [...(scenario.coverage ?? [])],
    dependencies: [...scenario.dependencies],
    forbiddenDependencies: [...(scenario.forbiddenDependencies ?? [])],
    cssIncludes: scenario.cssIncludes ? [...scenario.cssIncludes] : undefined,
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
    (specifier) => specifier === packageName || specifier.startsWith(`${packageName}/`),
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
  const tempRoot = mkdtempSync(join(tmpdir(), packageConsumerTempPrefix(groupName, group)));

  try {
    for (const scenario of group.scenarios) printScenarioContract(scenario, 'install');
    writeConsumerWorkspace(tempRoot, group.scenarios, group.dependencies);
    await runPnpm(['install', '--strict-peer-dependencies', '--ignore-scripts'], tempRoot, {
      scenarioName: groupName,
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

function packageConsumerTempPrefix(groupName, group) {
  const hash = createHash('sha256').update(groupName).digest('hex').slice(0, 10);
  const label =
    group.scenarios.length === 1 ? group.scenarios[0].name : `group-${group.scenarios.length}`;
  return `hell-package-consumer-${label}-${hash}-`;
}

async function runConsumerScenarioBuild(tempRoot, scenario) {
  printScenarioContract(scenario, 'build');
  writeConsumerScenarioFiles(tempRoot, scenario);

  const buildCommand = ['exec', '--', 'ng', 'build', 'consumer', '--configuration', 'production'];
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
    `${packageConsumerLabel(scenario.name)} ok: built CSS contains Part Style Map compiled-CSS proof and semantic token output`,
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
  await runPnpm(['pack', '--pack-destination', packRoot, '--json'], distRoot, {
    scenarioName,
    quiet: true,
  });
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
      ...(usesTailwindCss ? tailwindPostcssDevDeps : []),
      'typescript',
    ]),
    ...(Object.keys(workspaceOverrides).length
      ? {
          pnpm: {
            overrides: workspaceOverrides,
          },
        }
      : {}),
  };
  packageJson.dependencies[packageName] = pathToFileURL(packedHell.tarball).href;

  writeJson(join(workspace, 'package.json'), packageJson);
  if (Object.keys(workspaceOverrides).length) {
    // pnpm >= 10.14 reads overrides from pnpm-workspace.yaml, not from
    // package.json "pnpm.overrides"; emit both so every toolchain applies
    // the repo's patched transitive versions.
    const overrideLines = Object.entries(workspaceOverrides)
      .map(([name, version]) => `  ${JSON.stringify(name)}: ${JSON.stringify(version)}`)
      .join('\n');
    writeFileSync(join(workspace, 'pnpm-workspace.yaml'), `overrides:\n${overrideLines}\n`);
  }
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
  return readWorkspaceScalarMap('catalog');
}

function readWorkspaceOverrides() {
  return readWorkspaceScalarMap('overrides');
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

function rootConsumerMainTs() {
  return `import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { hellPartStyler, hellSearchResource, hellTwMerge, type HellPartStyler, type HellRecipe, type HellSearchResource, type HellSize, type HellUi, type HellUiInput } from '${packageName}';

interface SearchItem {
  readonly label: string;
}

const size: HellSize = 'md';
const recipe: HellRecipe<'root'> = { root: 'block' };
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const merged = hellTwMerge('px-hell-4', 'px-hell-7');
const styler: HellPartStyler<'root'> = hellPartStyler(() => uiInput, {
  defaultPart: 'root',
  recipe: () => recipe,
});
const styledRoot = styler('root');
void size;
void ui;
void merged;
void styledRoot;

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<p>Root core contract: {{ search.items().length }} result</p>\`,
})
class App {
  protected readonly query = signal('core');
  protected readonly search: HellSearchResource<SearchItem> = hellSearchResource({
    query: this.query,
    items: [{ label: 'Core contracts' }, { label: 'Visual primitive' }],
  });
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function coreConsumerMainTs() {
  return `import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { hellPartStyler, hellSearchResource, hellTwMerge, type HellPartStyler, type HellRecipe, type HellSearchResource, type HellSize, type HellUi, type HellUiInput } from '${packageName}/core';

interface SearchItem {
  readonly label: string;
}

const size: HellSize = 'md';
const recipe: HellRecipe<'root'> = { root: 'block' };
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const merged = hellTwMerge('px-hell-4', 'px-hell-7');
const styler: HellPartStyler<'root'> = hellPartStyler(() => uiInput, {
  defaultPart: 'root',
  recipe: () => recipe,
});
const styledRoot = styler('root');
void size;
void ui;
void merged;
void styledRoot;

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`<p>Core contract: {{ search.status() }}</p>\`,
})
class App {
  protected readonly query = signal('remote');
  protected readonly search: HellSearchResource<SearchItem> = hellSearchResource<
    SearchItem,
    { readonly tenant: string }
  >({
    query: this.query,
    params: { tenant: 'package-consumer' },
    source: ({ query, signal: abortSignal }) => {
      abortSignal.throwIfAborted();
      return [{ label: \`\${query} result\` }];
    },
  });
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function buttonConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton } from '${packageName}/button';

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
  protected readonly linkUi = { root: 'text-hell-primary underline-offset-[3px]' };
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function buttonUiConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton } from '${packageName}/button';

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
  protected readonly linkUi = { root: 'underline-offset-[5px]' };
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function chipInputConsumerMainTs() {
  return `import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HELL_CHIP_DIRECTIVES,
  HellChip,
  HellChipInput,
  HellChipRemove,
  HellChipSet,
} from '${packageName}/chip';

const chipDirectives: readonly [
  typeof HellChipSet,
  typeof HellChipInput,
  typeof HellChip,
  typeof HellChipRemove,
] = HELL_CHIP_DIRECTIVES;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...chipDirectives],
  template: \`
    <div hellChipSet aria-label="Assignees">
      @for (person of people(); track person) {
        <span hellChip (remove)="remove(person)">
          {{ person }}
          <button hellChipRemove></button>
        </span>
      }
      <input
        hellChipInput
        aria-label="Add assignee"
        [value]="draft()"
        (input)="updateDraft($event)"
      />
    </div>
  \`,
})
class App {
  protected readonly people = signal(['Anna', 'Ben']);
  protected readonly draft = signal('');

  protected remove(person: string): void {
    this.people.update((people) => people.filter((candidate) => candidate !== person));
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function controlGroupConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_CONTROL_GROUP_DIRECTIVES } from '${packageName}/control-group';
import { HellInput } from '${packageName}/input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellInput, ...HELL_CONTROL_GROUP_DIRECTIVES],
  template: \`
    <div
      hellControlGroup
      size="lg"
      invalid
      aria-label="Release tag"
      ui="max-w-lg rounded-hell-pill border-hell-primary"
    >
      <span hellControlGroupPrefix ui="font-semibold">release/</span>
      <input
        hellInput
        size="lg"
        invalid
        aria-label="Release tag name"
        ui="h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none"
        value="control-group"
      />
      <span hellControlGroupSuffix ui="font-mono">v2</span>
      <button hellControlGroupAction ui="text-hell-primary">Apply</button>
    </div>
  \`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function paginationConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_PAGINATION_DIRECTIVES, type HellPaginationStripUi } from '${packageName}/pagination';

const stripUi = {
  root: 'gap-hell-4',
  control: 'rounded-hell-pill',
} satisfies HellPaginationStripUi;

const pageButtonUi = {
  root: 'rounded-hell-pill bg-hell-primary',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_PAGINATION_DIRECTIVES],
  template: \`
    <hell-pagination [page]="2" [pageCount]="6" [ui]="stripUi" />
    <nav hellPagination [page]="1" [pageCount]="3" ui="gap-hell-4">
      <button hellPageLink="previous" type="button">Previous</button>
      <button type="button" [hellPageLink]="2" [ui]="pageButtonUi">2</button>
      <button hellPageLink="next" type="button" ui="text-hell-danger">Next</button>
    </nav>
  \`,
})
class App {
  protected readonly stripUi = stripUi;
  protected readonly pageButtonUi = pageButtonUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function comboboxChipsConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_COMBOBOX_DIRECTIVES } from '${packageName}/combobox';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: \`
    <div hellCombobox multiple [value]="selected">
      <div hellComboboxChips data-test-id="combobox-chips"></div>
      <input hellComboboxInput aria-label="Assign groups" />
      <button hellComboboxButton type="button" aria-label="Toggle groups"></button>
    </div>
  \`,
})
class App {
  protected readonly selected = ['Dispatch', 'On-call'];
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function primitivesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_ACCORDION_DIRECTIVES } from '${packageName}/accordion';
import { HellAvatar, type HellAvatarPart, type HellAvatarUi } from '${packageName}/avatar';
import { HELL_BREADCRUMBS_DIRECTIVES } from '${packageName}/breadcrumbs';
import { HellButton } from '${packageName}/button';
import { HELL_CARD_DIRECTIVES } from '${packageName}/card';
import { HellCheckbox, HellNativeCheckbox, type HellCheckboxUi } from '${packageName}/checkbox';
import { HellDropZone } from '${packageName}/drop-zone';
import { HELL_FIELD_DIRECTIVES } from '${packageName}/field';
import { HellIcon } from '${packageName}/icon';
import { HellInput } from '${packageName}/input';
import { HELL_LISTBOX_DIRECTIVES } from '${packageName}/listbox';
import { HELL_MENU_DIRECTIVES } from '${packageName}/menu';
import { HellPopover, HellPopoverTrigger } from '${packageName}/popover';
import { HellProgress, HellProgressBar } from '${packageName}/progress';
import { HellNativeRadio, HellNativeRadioGroup, HellRadio, HellRadioGroup } from '${packageName}/radio';
import type { HellOption } from '${packageName}';
import { HellSearch, HellSearchClear } from '${packageName}/input';
import { HELL_SELECT_DIRECTIVES } from '${packageName}/select';
import { HellSeparator } from '${packageName}/separator';
import { HellSlider, type HellSliderUi } from '${packageName}/slider';
import { HellSkeleton } from '${packageName}/skeleton';
import { HellSpinner } from '${packageName}/spinner';
import { HellSwitch, HellNativeSwitch, type HellSwitchUi } from '${packageName}/switch';
import { HellBadge, HellChip, HellKbd } from '${packageName}/chip';
import { HELL_TABS_DIRECTIVES } from '${packageName}/tabs';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from '${packageName}/toggle';
import { HellTooltip, HellTooltipTrigger } from '${packageName}/tooltip';
import { HELL_COMBOBOX_DIRECTIVES, HellCombobox, type HellComboboxUi } from '${packageName}/combobox';

const primitiveRootPart: HellAvatarPart = 'root';

interface SelectPriority {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ...HELL_ACCORDION_DIRECTIVES,
    HellAvatar,
    ...HELL_BREADCRUMBS_DIRECTIVES,
    HellButton,
    ...HELL_CARD_DIRECTIVES,
    HellCheckbox,
    HellNativeCheckbox,
    HellDropZone,
    ...HELL_FIELD_DIRECTIVES,
    HellIcon,
    HellInput,
    ...HELL_LISTBOX_DIRECTIVES,
    ...HELL_MENU_DIRECTIVES,
    HellPopover,
    HellPopoverTrigger,
    HellProgress,
    HellProgressBar,
    HellRadioGroup,
    HellRadio,
    HellNativeRadioGroup,
    HellNativeRadio,
    HellSearch,
    HellSearchClear,
    ...HELL_SELECT_DIRECTIVES,
    HellSeparator,
    HellSlider,
    HellSkeleton,
    HellSpinner,
    HellSwitch,
    HellNativeSwitch,
    HellBadge,
    HellKbd,
    HellChip,
    ...HELL_TABS_DIRECTIVES,
    HellToggle,
    HellToggleGroup,
    HellToggleGroupItem,
    HellTooltip,
    HellTooltipTrigger,
    ...HELL_COMBOBOX_DIRECTIVES,
    HellCombobox,
  ],
  template: \`
    <button hellButton type="button" [ui]="buttonUi">Save</button>
    <hell-icon name="faSolidCheck" aria-hidden="true" [ui]="iconUi" />
    <input hellInput aria-label="Name" [ui]="inputUi" />
    <button hellCheckbox aria-label="Accepted" [checked]="true" [ui]="checkboxUi"></button>
    <input type="checkbox" hellNativeCheckbox aria-label="Native accepted" [ui]="nativeCheckboxUi" checked />

    <div hellRadioGroup value="email" [ui]="radioGroupUi">
      <button hellRadio value="email" type="button" [ui]="radioUi">Email</button>
      <button hellRadio value="sms" type="button">SMS</button>
    </div>
    <div hellNativeRadioGroup [ui]="nativeRadioGroupUi">
      <input type="radio" hellNativeRadio name="native-contact" aria-label="Native email" value="email" [ui]="nativeRadioUi" checked />
    </div>
    <button hellSwitch aria-label="Notifications" [checked]="true" [ui]="switchUi"></button>
    <input type="checkbox" hellNativeSwitch aria-label="Native switch" [ui]="nativeSwitchUi" checked />
    <hell-slider aria-label="Volume" [value]="42" [ui]="sliderUi" />
    <button hellToggle type="button" [selected]="true" [ui]="toggleUi">Bold</button>
    <div hellToggleGroup type="single" [value]="['left']" [ui]="toggleGroupUi">
      <button hellToggleGroupItem value="left" type="button" [ui]="toggleGroupItemUi">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>

    <span hellChip [ui]="tagUi">Ready</span>
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

    <button type="button" [hellMenuTrigger]="menu">Actions</button>
    <ng-template #menu>
      <div hellMenu [ui]="menuUi">
        <button hellMenuItem type="button" [ui]="menuItemUi">Rename</button>
      </div>
    </ng-template>

    <div hellListbox [value]="listboxValue" [ui]="listboxUi">
      <button hellListboxOption type="button" value="ada" [ui]="listboxOptionUi">Ada</button>
    </div>

    <button type="button" [hellPopoverTrigger]="popover">Profile</button>
    <ng-template #popover>
      <div hellPopover [ui]="popoverUi">Summary</div>
    </ng-template>

    <button type="button" [hellTooltipTrigger]="tooltip">Hint</button>
    <ng-template #tooltip>
      <span hellTooltip [ui]="tooltipUi">Helpful hint</span>
    </ng-template>

    <button
      hellSelect
      type="button"
      aria-label="Priority"
      [value]="selectValue"
      (valueChange)="selectValue = $any($event)"
      [compareWith]="compareSelectPriorities"
      [ui]="selectUi"
    >
      @if (selectValue; as priority) {
        <span hellSelectValue>{{ priority.label }}</span>
      } @else {
        <span hellSelectPlaceholder>Pick priority</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown [ui]="selectDropdownUi">
          @for (option of selectOptions; track option.id) {
            <div
              hellSelectOption
              [value]="option"
              [disabled]="option.disabled ?? false"
              [ui]="selectOptionUi"
            >
              {{ option.label }}
            </div>
          }
        </div>
      </ng-template>
    </button>
    <div
      hellCombobox
      [value]="comboboxValue"
      (valueChange)="comboboxValue = $any($event)"
      [options]="comboboxOptions"
      [ui]="comboboxUi"
    >
      <input hellComboboxInput placeholder="Search fruit…" [ui]="comboboxInputUi" />
      <button
        hellComboboxButton
        type="button"
        aria-label="Toggle combobox options"
        [ui]="comboboxButtonUi"
      ></button>
      <div *hellComboboxPortal hellComboboxDropdown [ui]="comboboxDropdownUi">
        @for (option of comboboxOptions; track option) {
          <div
            hellComboboxOption
            [value]="option"
            [disabled]="option === disabledComboboxOption"
            [ui]="comboboxOptionUi"
          >
            {{ option }}
          </div>
        } @empty {
          <div hellComboboxEmpty [ui]="comboboxEmptyUi">No matches</div>
        }
      </div>
    </div>
    <hell-combobox [options]="presetOptions" [ui]="comboboxBasicUi" />

    <section hellCard ui="shadow-none">
      <header hellCardHeader [ui]="cardHeaderUi">Account</header>
      <div hellCardBody>
        <div hellField orientation="horizontal">
          <label hellFieldLabel>Name</label>
          <input hellInput aria-label="Card name" />
          <p hellFieldDescription>Shown to collaborators.</p>
        </div>
        <div hellTabset value="overview">
          <div hellTabList>
            <button hellTab value="overview" [ui]="activeTabUi">Overview</button>
            <button hellTab value="settings">Settings</button>
          </div>
          <div hellTabPanel value="overview">Overview content</div>
          <div hellTabPanel value="settings">Settings content</div>
        </div>
        <div hellAccordion type="single" value="details">
          <div hellAccordionItem value="details">
            <button hellAccordionTrigger [ui]="accordionTriggerUi">Details</button>
            <div hellAccordionContent>Details content</div>
          </div>
        </div>
      </div>
      <footer hellCardFooter>Ready</footer>
    </section>
  \`,
})
class App {
  protected readonly accordionTriggerUi = {
    root: 'bg-hell-surface-subtle',
  };
  protected readonly activeTabUi = { root: 'text-hell-primary' };
  protected readonly primitiveRootPart = primitiveRootPart;
  protected readonly avatarUi = { root: 'bg-hell-info-soft' } satisfies HellAvatarUi;
  protected readonly badgeUi = { root: 'bg-hell-info' };
  protected readonly breadcrumbEllipsisUi = { root: 'text-hell-info' };
  protected readonly breadcrumbItemUi = { root: 'gap-hell-2' };
  protected readonly breadcrumbLinkUi = { root: 'text-hell-info' };
  protected readonly breadcrumbListUi = { root: 'gap-hell-2' };
  protected readonly breadcrumbPageUi = { root: 'text-hell-info-strong' };
  protected readonly breadcrumbSeparatorUi = { root: 'text-hell-info' };
  protected readonly breadcrumbsUi = { root: 'text-hell-info' };
  protected readonly buttonUi = { root: 'bg-hell-info' };
  protected readonly cardHeaderUi = { root: 'items-start' };
  protected readonly checkboxUi = { root: 'border-hell-info' } satisfies HellCheckboxUi;
  protected readonly dropZoneUi = { root: 'border-hell-info' };
  protected readonly iconUi = { root: 'text-hell-info' };
  protected readonly inputUi = { root: 'border-hell-info' };
  protected readonly kbdUi = { root: 'border-hell-info' };
  protected readonly nativeCheckboxUi = { root: 'border-hell-info' };
  protected readonly nativeRadioGroupUi = { root: 'gap-hell-2' };
  protected readonly nativeRadioUi = { root: 'border-hell-info' };
  protected readonly nativeSwitchUi = { root: 'bg-hell-info-soft' };
  protected readonly listboxValue = ['ada'];
  protected readonly listboxOptionUi = { root: 'bg-hell-primary-soft' };
  protected readonly listboxUi = { root: 'gap-hell-4' };
  protected readonly menuItemUi = { root: 'bg-hell-primary-soft' };
  protected readonly menuUi = { root: 'rounded-hell-pill' };
  protected readonly popoverUi = { root: 'rounded-hell-pill' };
  protected readonly progressBarUi = { root: 'bg-hell-info' };
  protected readonly progressUi = { root: 'bg-hell-info-soft' };
  protected readonly radioGroupUi = { root: 'gap-hell-2' };
  protected readonly radioUi = { root: 'text-hell-info' };
  protected readonly searchClearUi = { root: 'text-hell-info' };
  protected readonly searchUi = { root: 'grid gap-hell-2' };
  protected readonly selectDropdownUi = { root: 'rounded-hell-pill' };
  protected readonly selectOptionUi = { root: 'bg-hell-primary-soft' };
  protected readonly selectOptions: readonly SelectPriority[] = [
    { id: 'low', label: 'Low' },
    { id: 'high', label: 'High' },
    { id: 'urgent', label: 'Urgent', disabled: true },
  ];
  protected selectValue: SelectPriority | null = this.selectOptions[0] ?? null;
  protected readonly compareSelectPriorities = (a: SelectPriority, b: SelectPriority): boolean =>
    a.id === b.id;
  protected readonly presetOptions: readonly HellOption<string>[] = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ];
  protected readonly selectUi = { root: 'rounded-hell-pill' };
  protected readonly separatorUi = { root: 'bg-hell-info' };
  protected readonly sliderUi = { range: 'bg-hell-info', thumb: 'border-hell-info' } satisfies HellSliderUi;
  protected readonly skeletonUi = { root: 'bg-hell-info-soft' };
  protected readonly spinnerUi = { root: 'text-hell-info' };
  protected readonly switchUi = { root: 'bg-hell-info-soft', thumb: 'shadow-none' } satisfies HellSwitchUi;
  protected readonly tagUi = { root: 'bg-hell-info-soft' };
  protected readonly toggleGroupItemUi = { root: 'text-hell-info' };
  protected readonly toggleGroupUi = { root: 'gap-hell-2' };
  protected readonly toggleUi = { root: 'text-hell-info' };
  protected readonly tooltipUi = { root: 'rounded-hell-pill' };
  protected comboboxValue: string | null = null;
  protected readonly comboboxOptions = ['apple', 'apricot', 'blackberry'];
  protected readonly disabledComboboxOption = 'blackberry';
  protected readonly comboboxUi = { root: 'rounded-hell-pill' };
  protected readonly comboboxButtonUi = { root: 'text-hell-info' };
  protected readonly comboboxDropdownUi = {
    root: 'rounded-hell-pill',
  };
  protected readonly comboboxEmptyUi = { root: 'text-hell-info' };
  protected readonly comboboxInputUi = { root: 'text-hell-info' };
  protected readonly comboboxOptionUi = {
    root: 'bg-hell-primary-soft',
  };
  protected readonly comboboxBasicUi = {
    control: 'rounded-hell-pill',
    button: 'text-hell-info',
    dropdown: 'rounded-hell-pill',
    option: 'bg-hell-primary-soft',
  } satisfies HellComboboxUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function compositesConsumerMainTs() {
  return `import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_APP_SHELL_DIRECTIVES } from '${packageName}/app-shell';
import { HellDateInput } from '${packageName}/date-input';
import { HellDatePicker, HellDateRangePicker } from '${packageName}/date-picker';
import { HELL_DIALOG_DIRECTIVES } from '${packageName}/dialog';
import { HellDialpad, type HellDialpadUi } from '${packageName}/features/dialpad';
import { HellFileUpload, type HellFileUploadItem, type HellFileUploadUi } from '${packageName}/file-upload';
import { HELL_OMNIBAR_DIRECTIVES, type HellOmnibarUi } from '${packageName}/omnibar';
import { HellTimeInput, type HellTimeValue } from '${packageName}/time-input';
import { HellToaster, HellToastService, type HellToasterUi } from '${packageName}/toast';
import { type HellSearchField } from '${packageName}/core';

const dialpadUi = {
  root: 'max-w-[320px]',
  keyButton: 'rounded-full',
} satisfies HellDialpadUi;

interface SearchItem {
  readonly label: string;
  readonly section: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ...HELL_APP_SHELL_DIRECTIVES,
    ...HELL_DIALOG_DIRECTIVES,
    ...HELL_OMNIBAR_DIRECTIVES,
    HellDateInput,
    HellDatePicker,
    HellDateRangePicker,
    HellDialpad,
    HellFileUpload,
    HellTimeInput,
    HellToaster,
  ],
  template: \`
    <div hellAppShell ui="bg-hell-surface-muted">
      <header hellAppTopbar>
        <button hellSidenavToggle appearance="shell" type="button" ui="text-hell-primary"></button>
      </header>
      <nav hellAppSidenav>Navigation</nav>
      <main hellAppContent>
        <button type="button" [hellDialogTrigger]="dialog">Open dialog</button>
        <ng-template #dialog>
          <div hellDialogOverlay scoped [ui]="dialogOverlayUi">
            <section hellDialog [ui]="dialogUi">
              <h2 hellDialogTitle>Package consumer dialog</h2>
              <p hellDialogDescription>Dialog recipe classes compile in consumers.</p>
            </section>
          </div>
        </ng-template>

        <hell-omnibar
          ariaLabel="Search package consumer"
          placeholder="Search"
          [searchItems]="searchItems"
          [searchFields]="searchFields"
          [ui]="omnibarUi"
        >
          <div hellOmnibarGroup label="Docs">
            @for (result of searchResults(); track result.item.label) {
              <button hellOmnibarItem type="button" [value]="result.item">
                <span hellOmnibarItemText>
                  {{ result.item.label }}
                  <span hellOmnibarItemSubtext>{{ result.item.section }}</span>
                </span>
                <span hellOmnibarItemTrailing>docs</span>
              </button>
            }
          </div>
        </hell-omnibar>

        <button type="button" (click)="showToast()">Show toast</button>
        <hell-toaster [ui]="toasterUi" />

        <hell-date-input aria-label="Ship date" [date]="date" />
        <hell-time-input aria-label="Ship time" [value]="time" />
        <hell-date-picker [date]="date" />
        <hell-date-range-picker [startDate]="rangeStart" [endDate]="rangeEnd" />
        <hell-dialpad [ui]="dialpadUi" />
        <hell-file-upload [items]="uploadItems" [ui]="fileUploadUi" />
      </main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button">Details</button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  \`,
})
class App {
  private readonly toast = inject(HellToastService);
  protected readonly date = new Date(2026, 3, 22);
  protected readonly rangeStart = new Date(2026, 3, 5);
  protected readonly rangeEnd = new Date(2026, 3, 12);
  protected readonly time: HellTimeValue = { hour: 9, minute: 30, second: 0 };
  protected readonly dialpadUi = dialpadUi;
  protected readonly fileUploadUi = { item: 'p-hell-2' } satisfies HellFileUploadUi;
  protected readonly uploadItems: readonly HellFileUploadItem[] = [
    {
      id: 'package-consumer-upload',
      name: 'package-consumer.pdf',
      size: 2048,
      status: 'uploading',
      progress: 0.5,
    },
  ];
  protected readonly dialogOverlayUi = { root: 'p-hell-4' };
  protected readonly dialogUi = { root: 'max-w-[520px]' };
  protected readonly omnibarUi = { root: 'max-w-[360px]' } satisfies HellOmnibarUi;
  protected readonly toasterUi = { toast: 'ring-1 ring-hell-border' } satisfies HellToasterUi;
  protected readonly searchItems: readonly SearchItem[] = [
    { label: 'Dialog', section: 'Feedback' },
    { label: 'Toast', section: 'Feedback' },
    { label: 'Omnibar', section: 'Search' },
  ];
  protected readonly searchFields: readonly HellSearchField<SearchItem>[] = [
    { name: 'label', weight: 4, get: (item) => item.label },
    { name: 'section', weight: 1, get: (item) => item.section },
  ];

  protected searchResults() {
    return this.searchItems.map((item) => ({ item, score: 1 }));
  }

  protected showToast(): void {
    this.toast.success('Package consumer toast');
  }
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function pageHeaderConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_PAGE_HEADER_DIRECTIVES, type HellPageHeaderUi } from '${packageName}/page-header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_PAGE_HEADER_DIRECTIVES],
  template: \`
    <hell-page-header [level]="2" [ui]="pageHeaderUi">
      <hell-page-header-back (back)="backCount += 1" />
      <span hellPageHeaderTitle>Package consumer</span>
      <span hellPageHeaderMeta>Beta</span>
      <p hellPageHeaderDescription>Page-header recipes compile from the packed entrypoint.</p>
      <div hellPageHeaderToolbar>Actions</div>
    </hell-page-header>
  \`,
})
class App {
  protected backCount = 0;
  protected readonly pageHeaderUi = {
    root: 'border border-hell-border p-hell-4',
    title: 'text-2xl',
  } satisfies HellPageHeaderUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function filterBarConsumerMainTs() {
  return `import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HellFilterBar,
  type HellFilterBarUi,
  type HellFilterField,
  type HellFilterToken,
} from '${packageName}/filter-bar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellFilterBar],
  template: \`
    <hell-filter-bar
      aria-label="Package filters"
      [fields]="fields"
      [value]="value()"
      [ui]="filterUi"
      (valueChange)="value.set($event)"
    />
  \`,
})
class App {
  protected readonly fields: readonly HellFilterField[] = [
    { key: 'name', label: 'Name', kind: 'text' },
    {
      key: 'status',
      label: 'Status',
      kind: 'options',
      options: [{ value: 'active', label: 'Active' }],
    },
    {
      key: 'owner',
      label: 'Owner',
      kind: 'entity',
      search: async ({ query }) => [
        { id: 'grace', label: query ? 'Grace Hopper' : 'Suggested owner' },
      ],
    },
    {
      key: 'created',
      label: 'Created',
      kind: 'dateRange',
      min: '2026-01-01',
      max: '2026-12-31',
    },
  ];
  protected readonly value = signal<readonly HellFilterToken[]>([
    {
      key: 'owner',
      operator: 'eq',
      value: { kind: 'entity', id: 'grace', label: 'Grace Hopper' },
    },
    {
      key: 'created',
      operator: 'eq',
      value: { kind: 'dateRange', from: '2026-01-01', to: null },
    },
  ]);
  protected readonly filterUi = { root: 'max-w-[640px]' } satisfies HellFilterBarUi;
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
    <div hellAppShell ui="bg-hell-surface-muted">
      <header hellAppTopbar>
        <button hellSidenavToggle appearance="shell" type="button" ui="text-hell-primary"></button>
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

function resizableConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_RESIZABLE_DIRECTIVES, type HellResizableHandleUi } from '${packageName}/resizable';

const paneUi = {
  root: 'hd-surface-elevated p-4 overflow-hidden',
};

const handleUi = {
  root: 'bg-hell-surface-muted',
  grip: 'bg-hell-primary',
} satisfies HellResizableHandleUi;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: \`
    <div hellResizable orientation="horizontal" ui="h-[240px]">
      <section hellResizablePane [initialFlex]="2" [ui]="paneUi">Left</section>
      <div hellResizableHandle appearance="grip" [ui]="handleUi"></div>
      <section hellResizablePane [initialFlex]="3" ui="hd-surface-subtle p-4">Right</section>
    </div>
  \`,
})
class App {
  protected readonly paneUi = paneUi;
  protected readonly handleUi = handleUi;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function splitViewConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_SPLIT_VIEW_DIRECTIVES, type HellSplitViewUi } from '${packageName}/split-view';

const splitViewUi = {
  root: 'h-[320px]',
  pane: 'overflow-auto',
  itemNavigation: 'gap-hell-3',
} satisfies HellSplitViewUi;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: \`
    <hell-split-view [compactBelow]="0" itemNavigation [ui]="splitViewUi">
      <ng-template hellSplitPrimary>
        <section>Primary</section>
      </ng-template>
      <ng-template hellSplitDetail>
        <section>Detail</section>
      </ng-template>
    </hell-split-view>
  \`,
})
class App {
  protected readonly splitViewUi = splitViewUi;
}

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
import {
  HELL_TABLE_UTILITIES_DIRECTIVES,
  HellTableRowIgnore,
  type HellTableResizeHandleUi,
} from '${packageName}/table';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES, HellTableRowIgnore],
  template: \`
    <div hellTableContainer ui="bg-hell-surface-muted">
      <table hellTableRoot ui="text-sm">
        <thead hellTableHeader>
          <tr hellTableRow>
            <th hellTableHeaderCell hellTableSelectionCell>
              <input hellTableRowCheckbox type="checkbox" aria-label="Select all" />
            </th>
            <th hellTableHeaderCell columnId="name">
              Name
              <button hellTableResizeHandle [ui]="resizeHandleUi"></button>
            </th>
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
class App {
  protected readonly resizeHandleUi = {
    root: 'w-hell-6',
    grip: 'bg-hell-danger',
  } satisfies HellTableResizeHandleUi;
}

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

function pdfViewerConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellPdfViewer, type HellPdfWorkerSource } from '${packageName}/features/pdf-viewer';

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
@import "${packageName}/accordion/styles.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/card/styles.css";
@import "${packageName}/field/styles.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/input/styles.css";
@import "${packageName}/avatar/styles.css";
@import "${packageName}/breadcrumbs/styles.css";
@import "${packageName}/checkbox/styles.css";
@import "${packageName}/combobox/styles.css";
@import "${packageName}/drop-zone/styles.css";
@import "${packageName}/listbox/styles.css";
@import "${packageName}/menu/styles.css";
@import "${packageName}/popover/styles.css";
@import "${packageName}/progress/styles.css";
@import "${packageName}/radio/styles.css";
@import "${packageName}/select/styles.css";
@import "${packageName}/separator/styles.css";
@import "${packageName}/slider/styles.css";
@import "${packageName}/skeleton/styles.css";
@import "${packageName}/spinner/styles.css";
@import "${packageName}/switch/styles.css";
@import "${packageName}/chip/styles.css";
@import "${packageName}/tabs/styles.css";
@import "${packageName}/toggle/styles.css";
@import "${packageName}/tooltip/styles.css";
`;
}

function buttonConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
:root { --color-hell-primary:#3452ff; }
`;
}

function controlGroupConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/control-group/styles.css";
@import "${packageName}/input/styles.css";
`;
}

function paginationConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/pagination/styles.css";
`;
}

function comboboxChipsConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/combobox/styles.css";
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

function compositesConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/app-shell/styles.css";
@import "${packageName}/date-input/styles.css";
@import "${packageName}/date-picker/styles.css";
@import "${packageName}/dialog/styles.css";
@import "${packageName}/file-upload/styles.css";
@import "${packageName}/omnibar/styles.css";
@import "${packageName}/time-input/styles.css";
@import "${packageName}/toast/styles.css";
`;
}

function pageHeaderConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/page-header/styles.css";
`;
}

function filterBarConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/filter-bar/styles.css";
`;
}

function resizableConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/resizable/styles.css";
`;
}

function splitViewConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
@import "${packageName}/icon/styles.css";
@import "${packageName}/pagination/styles.css";
@import "${packageName}/resizable/styles.css";
@import "${packageName}/split-view/styles.css";
`;
}

function audioPlayerConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/tokens.css";
@import "${packageName}/button/styles.css";
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
@import "${packageName}/features/pdf-viewer/styles.css";
`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runRootPnpm(args, cwd) {
  console.log(`[package-consumer] ${formatCommand('pnpm', args)}`);
  const result = spawnSync('pnpm', args, {
    cwd,
    env: pnpmCommandEnvironment(),
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0)
    fail(`${formatCommand('pnpm', args)} failed with ${result.status}`);
}

async function runPnpm(args, cwd, options = {}) {
  const { command, result } = await runPnpmCommand(args, cwd, options);
  if (result.timedOut) fail(pnpmTimeoutMessage(command, cwd));
  if (result.error) fail(`Unable to start command: ${command}\n${result.error.message}`);
  if (result.signal) fail(`Command failed with signal ${result.signal}: ${command}`);
  if (result.status !== 0) {
    const output = [result.stderr, result.stdout].filter(Boolean).join('\n').trim();
    fail(
      `Command failed with status ${result.status}: ${command}${output ? `\n${output}` : ''}`,
    );
  }
}

async function runPnpmCommand(args, cwd, options = {}) {
  const env = pnpmCommandEnvironment();
  const scenarioName = options.scenarioName ?? 'unknown';
  const label = packageConsumerLabel(scenarioName);
  const command = formatCommand('pnpm', args);

  console.log(`${label} running command: ${command}`);
  console.log(`${label} cwd: ${cwd}`);
  const result = await spawnPnpm(args, cwd, env, label, command, {
    captureOutput: options.captureOutput === true || options.quiet === true,
    forwardOutput: options.quiet !== true,
  });
  return { command, label, result };
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
      if (options.forwardOutput !== false) process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk) => {
      const value = chunk.toString();
      if (options.captureOutput) stderr += value;
      if (options.forwardOutput !== false) process.stderr.write(chunk);
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

function pnpmTimeoutMessage(command, cwd) {
  return [
    `Command timed out after ${formatDuration(pnpmTimeoutMs)}: ${command}`,
    `exact command: ${command}`,
    `cwd: ${cwd}`,
  ].join('\n');
}

function packageConsumerLabel(scenarioName) {
  return scenarioName ? `[package-consumer:${scenarioName}]` : '[package-consumer]';
}

function formatDuration(ms) {
  if (ms < 1_000) return `${ms}ms`;
  return `${Math.round(ms / 1_000)}s`;
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
