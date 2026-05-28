import { spawn, spawnSync } from 'node:child_process';
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
import { dirname, isAbsolute, join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPackageManager } from './package-manager.mjs';
import { auditPackedPackage } from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const packageConsumerArgs = process.argv.slice(2);
const rawSelectedScenarioNames = parseScenarioSelection(packageConsumerArgs);
const selectedScenarioNames = rawSelectedScenarioNames.filter((name) => !isPreflightScenarioName(name));
const preflightOnly = parsePreflightOnly(packageConsumerArgs, rawSelectedScenarioNames);
const minimalDependencyMode = parseMinimalDependencyMode(packageConsumerArgs);
const npmTimeoutMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_TIMEOUT_MS, 240_000);
const npmHeartbeatMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_HEARTBEAT_MS, 30_000);
const npmDebugLogTailLines = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_LOG_TAIL_LINES, 80);
const npmPreflightTimeoutMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_PREFLIGHT_TIMEOUT_MS, 30_000);

runNpmPreflight(root);
if (preflightOnly) {
  console.log(`${packageConsumerLabel('preflight')} preflight passed; skipping package build and consumer scenarios`);
  process.exit(0);
}

runRootPackageManager(['run', 'build:lib'], root);

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}`);
}

const distPackageJson = JSON.parse(readFileSync(join(distHell, 'package.json'), 'utf8'));
const packageName = distPackageJson.name;
if (!packageName) {
  fail('Built package.json is missing name');
}

const packedHell = await packBuiltPackage();
try {
  auditPackedPackage({ distRoot: distHell, tarball: packedHell.tarball });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = rootPackage.dependencies ?? {};
const devDeps = rootPackage.devDependencies ?? {};

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
const styledUiWithoutFontAwesomeDeps = [
  ...behaviorUiWithoutFontAwesomeDeps,
  'tailwindcss',
];
const styledUiDeps = [
  ...styledUiWithoutFontAwesomeDeps,
  '@ng-icons/font-awesome',
];
// The aggregate /primitives FESM includes dialog, and ng-primitives/dialog
// currently imports @angular/router even though Hell no longer declares router
// as a package peer. Narrow primitive entrypoints (for example /button) prove
// router-free consumption for consumers that avoid the aggregate barrel.
const primitivesDeps = [
  ...styledUiDeps,
  '@angular/router',
];
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
const pdfViewerDeps = [
  ...styledUiDeps,
  'pdfjs-dist',
];


const scenarios = [
  {
    name: 'root-core',
    aliases: ['root'],
    description: 'root entry core-only with package-wide light peers',
    peerTier: 'core',
    dependencies: coreDeps,
    mainTs: rootConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'core',
    description: 'core entry with package-wide light peers',
    peerTier: 'core',
    dependencies: coreDeps,
    mainTs: coreConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'primitives-css',
    aliases: ['primitives'],
    description: 'primitives entry with primitive CSS and without feature peers',
    peerTier: 'primitive-css',
    dependencies: primitivesDeps,
    mainTs: primitivesConsumerMainTs(),
    stylesCss: primitivesConsumerStylesCss(),
  },
  {
    name: 'button-unstyled',
    description: 'narrow primitive button entry without CSS or Tailwind peer',
    peerTier: 'primitive-unstyled',
    dependencies: coreDeps,
    mainTs: buttonUnstyledConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'button',
    description: 'narrow primitive button entry with primitive styles and without Font Awesome peer',
    peerTier: 'primitive-css',
    dependencies: buttonStyledDeps,
    mainTs: buttonConsumerMainTs(),
    stylesCss: primitivesConsumerStylesCss(),
  },
  {
    name: 'composites-css',
    aliases: ['composites'],
    description: 'composites entry with composite CSS and without feature peers',
    peerTier: 'composite-css',
    dependencies: styledUiDeps,
    mainTs: compositesConsumerMainTs(),
    stylesCss: compositesConsumerStylesCss(),
  },
  {
    name: 'app-shell',
    description: 'narrow app-shell composite entry without Font Awesome or feature peers',
    peerTier: 'composite-css',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: appShellConsumerMainTs(),
    stylesCss: compositesConsumerStylesCss(),
  },
  {
    name: 'testing',
    description: 'testing entry with package-wide light peers',
    peerTier: 'testing',
    dependencies: testingDeps,
    mainTs: testingConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'code-editor',
    description: 'code-editor feature with styled peers and CodeMirror peers',
    peerTier: 'code-editor',
    dependencies: codeEditorDeps,
    mainTs: codeEditorConsumerMainTs(),
    stylesCss: codeEditorConsumerStylesCss(),
  },
  {
    name: 'table-utilities',
    description: 'preferred table utilities feature without Font Awesome peer',
    peerTier: 'table-utilities',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: tableUtilitiesConsumerMainTs(),
    stylesCss: tableUtilitiesConsumerStylesCss(),
  },
  {
    name: 'data-table',
    description: 'legacy data-table alias without Font Awesome peer',
    peerTier: 'data-table',
    dependencies: styledUiWithoutFontAwesomeDeps,
    mainTs: dataTableConsumerMainTs(),
    stylesCss: dataTableConsumerStylesCss(),
  },
  {
    name: 'pdf-viewer',
    description: 'pdf-viewer feature with pdfjs and light UI peers',
    peerTier: 'pdf-viewer',
    dependencies: pdfViewerDeps,
    mainTs: pdfViewerConsumerMainTs(),
    stylesCss: pdfViewerConsumerStylesCss(),
  },
];

const enabledScenarios = selectScenarios(scenarios, selectedScenarioNames);

try {
  for (const group of scenarioDependencyGroups(enabledScenarios, minimalDependencyMode)) {
    await runConsumerScenarioGroup(group);
  }
} finally {
  if (keep) console.log(`[package-consumer] kept packed hell package ${packedHell.root}`);
  else rmSync(packedHell.root, { force: true, recursive: true });
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

function parsePreflightOnly(args, selectedNames) {
  if (args.some((arg) => arg === '--preflight' || arg === '--preflight-only')) return true;

  return selectedNames.length > 0 && selectedNames.every(isPreflightScenarioName);
}

function isPreflightScenarioName(name) {
  return name === 'preflight' || name === 'npm-preflight';
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
    ...new Set(
      raw
        .flatMap((value) => value.split(',').map(normalizeScenarioName))
        .filter(Boolean),
    ),
  ];
}

function normalizeScenarioName(value) {
  return value.trim().toLowerCase();
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
}

function packageImportPaths(mainTs) {
  return uniqueMatches(mainTs, /from\s+['"]([^'"]+)['"]/g)
    .filter((specifier) => specifier === packageName || specifier.startsWith(`${packageName}/`));
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
    writeConsumerWorkspace(tempRoot, group.scenarios[0], group.dependencies);
    await runNpm([
      'install',
      '--strict-peer-deps',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ], tempRoot, { scenarioName: groupName, printInstallDiagnostics: true });

    for (const scenario of group.scenarios) {
      printScenarioContract(scenario, 'build');
      writeConsumerScenarioFiles(tempRoot, scenario);
      await runNpm(
        ['exec', '--', 'ng', 'build', 'consumer', '--configuration', 'production'],
        tempRoot,
        { scenarioName: scenario.name },
      );
      console.log(`[package-consumer:${scenario.name}] built ${scenario.description}`);
    }
  } finally {
    if (keep) console.log(`[package-consumer:${groupName}] kept ${tempRoot}`);
    else rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function packBuiltPackage() {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-consumer-pack-'));
  await runNpm(['pack', '--pack-destination', packRoot], distHell, { scenarioName: 'pack' });
  const tarball = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
  if (!tarball) fail(`Packed package missing in ${packRoot}`);
  return { root: packRoot, tarball: join(packRoot, tarball) };
}

function writeConsumerWorkspace(workspace, scenario, dependencies = scenario.dependencies) {
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
      'typescript',
    ]),
  };
  packageJson.dependencies[packageName] = pathToFileURL(packedHell.tarball).href;

  writeJson(join(workspace, 'package.json'), packageJson);
  writeFileSync(join(workspace, '.npmrc'), 'strict-peer-deps=true\nlegacy-peer-deps=false\n');
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
    if (!version) fail(`Root package.json missing dependency ${name}`);
    picked[name] = exactInstalledVersion(name) ?? version;
  }
  return picked;
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
import { HellStyleable, type HellSize } from '${packageName}';

const size: HellSize = 'md';
void size;
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
import { HellStyleable, type HellSize } from '${packageName}/core';

const size: HellSize = 'md';
void size;
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
import { HellButton } from '${packageName}/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton],
  template: \`
    <button hellButton type="button">Save</button>
    <a hellButton href="#details" [disabled]="disabled">Details</a>
  \`,
})
class App {
  protected readonly disabled = true;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function buttonUnstyledConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton } from '${packageName}/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton],
  template: \`
    <button hellButton unstyled type="button">Save</button>
    <a hellButton unstyled href="#details" [disabled]="disabled">Details</a>
  \`,
})
class App {
  protected readonly disabled = true;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function primitivesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton, HellInput } from '${packageName}/primitives';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton, HellInput],
  template: \`
    <button hellButton type="button">Save</button>
    <input hellInput aria-label="Name" />
  \`,
})
class App {}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function compositesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_APP_SHELL_DIRECTIVES } from '${packageName}/composites';

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

function tableUtilitiesConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_TABLE_UTILITIES_DIRECTIVES, HellTableRowIgnore } from '${packageName}/features/table-utilities';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES, HellTableRowIgnore],
  template: \`
    <div hellTableContainer>
      <table hellTable>
        <thead hellTableHead>
          <tr hellTableRow>
            <th hellTableHeaderCell columnId="name">Name</th>
            <th hellTableHeaderCell columnId="role">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr hellTableRow selected>
            <td hellTableCell>
              <span hellTableRowIgnore>ignore</span>
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

function dataTableConsumerMainTs() {
  return tableConsumerMainTs(`${packageName}/features/data-table`, 'HELL_TABLE_DIRECTIVES');
}

function tableConsumerMainTs(entryPoint, directiveSymbol) {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ${directiveSymbol} } from '${entryPoint}';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...${directiveSymbol}],
  template: \`
    <div hellTableContainer>
      <table hellTable>
        <thead hellTableHead>
          <tr hellTableRow>
            <th hellTableHeaderCell columnId="name">Name</th>
            <th hellTableHeaderCell columnId="role">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr hellTableRow selected>
            <td hellTableCell>Atlas</td>
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

function rootConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles";
`;
}

function primitivesConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/primitives";
`;
}

function compositesConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/composites";
`;
}

function codeEditorConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/tokens";
@import "${packageName}/styles/features/code-editor";
`;
}

function tableUtilitiesConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/tokens";
@import "${packageName}/styles/features/table-utilities";
`;
}

function dataTableConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/tokens";
@import "${packageName}/styles/features/data-table";
`;
}

function pdfViewerConsumerStylesCss() {
  return `@import "tailwindcss";
@import "${packageName}/styles/tokens";
@import "${packageName}/styles/features/pdf-viewer";
`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function runNpmPreflight(cwd) {
  const label = packageConsumerLabel('preflight');
  const env = npmCommandEnvironment();

  console.log(`${label} running npm preflight before package build`);

  const version = requireNpmPreflightValue(['--version'], cwd, env, 'npm version');
  if (!/^\d+\.\d+\.\d+(?:[-+].*)?$/.test(version)) {
    failNpmPreflight('npm version is not a semver value', [`version: ${version}`]);
  }

  const registry = requireNpmPreflightValue(['config', 'get', 'registry'], cwd, env, 'registry config');
  assertNpmRegistry(registry);

  const cache = requireNpmPreflightValue(['config', 'get', 'cache'], cwd, env, 'cache config');
  const cacheDirectory = assertWritableNpmCache(cache, cwd);

  const strictPeerDeps = requireNpmPreflightValue(
    ['config', 'get', 'strict-peer-deps'],
    cwd,
    env,
    'strict-peer-deps config',
  );
  const legacyPeerDeps = requireNpmPreflightValue(
    ['config', 'get', 'legacy-peer-deps'],
    cwd,
    env,
    'legacy-peer-deps config',
  );
  assertStrictPeerMode(strictPeerDeps, legacyPeerDeps);

  requireNpmPreflightCommand(['ping', '--registry', registry], cwd, env, 'registry reachability');

  console.log(
    `${label} ok: npm ${version}; registry ${registry}; cache ${cacheDirectory}; ` +
      `strict-peer-deps=${strictPeerDeps}; legacy-peer-deps=${legacyPeerDeps}`,
  );
}

function requireNpmPreflightValue(args, cwd, env, description) {
  const result = requireNpmPreflightCommand(args, cwd, env, description);
  const value = result.stdout.trim();
  if (!value) failNpmPreflight(`${description} returned no value`, [`command: ${result.command}`]);
  return value;
}

function requireNpmPreflightCommand(args, cwd, env, description) {
  const command = formatCommand('npm', args);
  const result = spawnSync('npm', args, {
    cwd,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
    timeout: npmPreflightTimeoutMs,
  });

  if (result.error) {
    failNpmPreflight(`${description} failed`, [
      `command: ${command}`,
      `error: ${result.error.message}`,
      npmPreflightOutputSummary(result),
    ]);
  }

  if (result.status !== 0) {
    failNpmPreflight(`${description} failed`, [
      `command: ${command}`,
      `status: ${result.status}`,
      npmPreflightOutputSummary(result),
    ]);
  }

  return { command, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function assertNpmRegistry(registry) {
  try {
    const parsed = new URL(registry);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      failNpmPreflight('registry config must use http or https', [`registry: ${registry}`]);
    }
  } catch (error) {
    failNpmPreflight('registry config is not a valid URL', [
      `registry: ${registry}`,
      error instanceof Error ? error.message : String(error),
    ]);
  }
}

function assertWritableNpmCache(cache, cwd) {
  const cacheDirectory = normalizeNpmPath(cache, cwd);
  if (!cacheDirectory) failNpmPreflight('npm cache config is empty');

  const probe = join(cacheDirectory, `.hell-package-consumer-preflight-${process.pid}-${Date.now()}`);
  try {
    mkdirSync(cacheDirectory, { recursive: true });
    writeFileSync(probe, 'ok\n');
    rmSync(probe, { force: true });
  } catch (error) {
    failNpmPreflight('npm cache directory is not writable', [
      `cache: ${cacheDirectory}`,
      error instanceof Error ? error.message : String(error),
    ]);
  }

  return cacheDirectory;
}

function assertStrictPeerMode(strictPeerDeps, legacyPeerDeps) {
  if (!npmConfigBoolean(strictPeerDeps)) {
    failNpmPreflight('strict-peer-deps must be true', [`strict-peer-deps=${strictPeerDeps}`]);
  }
  if (npmConfigBoolean(legacyPeerDeps)) {
    failNpmPreflight('legacy-peer-deps must be false', [`legacy-peer-deps=${legacyPeerDeps}`]);
  }
}

function npmConfigBoolean(value) {
  return value.trim().toLowerCase() === 'true' || value.trim() === '1';
}

function failNpmPreflight(message, details = []) {
  fail([`npm preflight failed: ${message}`, ...details.filter(Boolean)].join('\n'));
}

function npmPreflightOutputSummary(result) {
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

function runRootPackageManager(args, cwd) {
  console.log(`[package-consumer] package-manager ${args.join(' ')}`);
  const result = runPackageManager(args, {
    cwd,
    env: { ...process.env, CI: 'true' },
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`package-manager ${args.join(' ')} failed with ${result.status}`);
}

async function runNpm(args, cwd, options = {}) {
  const env = npmCommandEnvironment();
  const scenarioName = options.scenarioName ?? 'unknown';
  const label = packageConsumerLabel(scenarioName);
  const command = formatCommand('npm', args);

  console.log(`${label} running command: ${command}`);
  console.log(`${label} cwd: ${cwd}`);
  const diagnostics = collectNpmDiagnostics(cwd, env);
  if (options.printInstallDiagnostics) {
    printNpmInstallDiagnostics(label, scenarioName, cwd, diagnostics);
  }

  const result = await spawnNpm(args, cwd, env, label, command);
  if (result.timedOut) fail(npmTimeoutMessage(command, cwd, diagnostics, result.startedAt));
  if (result.error) fail(`Unable to start command: ${command}\n${result.error.message}`);
  if (result.signal) fail(`Command failed with signal ${result.signal}: ${command}`);
  if (result.status !== 0) fail(`Command failed with status ${result.status}: ${command}`);
}

function spawnNpm(args, cwd, env, label, command) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn('npm', args, {
      cwd,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });
    let error = null;
    let timedOut = false;
    let killTimer = null;

    const heartbeat = setInterval(() => {
      console.log(
        `${label} heartbeat: ${command} still running after ${formatDuration(Date.now() - startedAt)} ` +
          `(timeout ${formatDuration(npmTimeoutMs)})`,
      );
    }, npmHeartbeatMs);
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
    }, npmTimeoutMs);
    timeout.unref();

    child.stdout?.on('data', (chunk) => process.stdout.write(chunk));
    child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
    child.on('error', (caught) => {
      error = caught;
    });
    child.on('close', (status, signal) => {
      clearInterval(heartbeat);
      clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      const verb = timedOut ? 'stopped' : 'finished';
      console.log(`${label} ${verb} command after ${formatDuration(Date.now() - startedAt)}: ${command}`);
      resolve({ status, signal, error, timedOut, startedAt });
    });
  });
}

function printNpmInstallDiagnostics(label, scenarioName, tempRoot, diagnostics) {
  console.log(`${label} npm install diagnostics:`);
  console.log(`${label} scenario name: ${scenarioName}`);
  console.log(`${label} temp directory: ${tempRoot}`);
  console.log(`${label} npm cache: ${diagnostics.cache}`);
  console.log(`${label} registry: ${diagnostics.registry}`);
  console.log(`${label} package manager version: npm ${diagnostics.version}`);
  console.log(`${label} strict-peer-deps: ${diagnostics.strictPeerDeps}`);
  console.log(`${label} legacy-peer-deps: ${diagnostics.legacyPeerDeps}`);
  console.log(`${label} npm log directory: ${diagnostics.logDirectory}`);
}

function collectNpmDiagnostics(cwd, env) {
  const configuredCache = readNpmValue(['config', 'get', 'cache'], cwd, env);
  const cache = normalizeNpmPath(configuredCache, cwd) ?? join(homedir(), '.npm');
  const registry = readNpmValue(['config', 'get', 'registry'], cwd, env) ?? 'unknown';
  const version = readNpmValue(['--version'], cwd, env) ?? 'unknown';
  const strictPeerDeps = readNpmValue(['config', 'get', 'strict-peer-deps'], cwd, env) ?? 'unknown';
  const legacyPeerDeps = readNpmValue(['config', 'get', 'legacy-peer-deps'], cwd, env) ?? 'unknown';
  const configuredLogDirectory = readNpmValue(['config', 'get', 'logs-dir'], cwd, env);
  const logDirectory = normalizeNpmPath(configuredLogDirectory, cwd) ?? join(cache, '_logs');

  return { cache, registry, version, strictPeerDeps, legacyPeerDeps, logDirectory };
}

function readNpmValue(args, cwd, env) {
  const result = spawnSync('npm', args, {
    cwd,
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env,
    timeout: 15_000,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function normalizeNpmPath(value, cwd) {
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined') return null;
  return isAbsolute(normalized) ? normalized : join(cwd, normalized);
}

function npmTimeoutMessage(command, cwd, diagnostics, commandStartedAt) {
  return [
    `Command timed out after ${formatDuration(npmTimeoutMs)}: ${command}`,
    `exact command: ${command}`,
    `cwd: ${cwd}`,
    `npm log directory: ${diagnostics?.logDirectory ?? 'unknown'}`,
    npmDebugLogTail(diagnostics?.logDirectory, commandStartedAt),
  ].join('\n');
}

function npmDebugLogTail(logDirectory, commandStartedAt) {
  if (!logDirectory) return 'npm debug log tail: unavailable; npm log directory unknown';
  if (!existsSync(logDirectory)) {
    return `npm debug log tail: unavailable; npm log directory does not exist: ${logDirectory}`;
  }

  const candidates = readdirSync(logDirectory)
    .filter((name) => name.endsWith('.log') && name.includes('debug'))
    .map((name) => {
      const path = join(logDirectory, name);
      return { path, modifiedAt: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt);

  if (!candidates.length) return `npm debug log tail: no debug logs found in ${logDirectory}`;

  const commandCandidates = candidates.filter(
    (candidate) => candidate.modifiedAt >= commandStartedAt - 1_000,
  );
  const latest = commandCandidates[0] ?? candidates[0];
  const staleNote = commandCandidates.length
    ? null
    : 'npm debug log tail note: no command-local debug log found; showing newest existing log';
  const tail = readFileSync(latest.path, 'utf8')
    .split(/\r?\n/)
    .slice(-npmDebugLogTailLines)
    .join('\n')
    .trimEnd();

  return [
    `last npm debug log: ${latest.path}`,
    staleNote,
    `--- npm debug log tail (last ${npmDebugLogTailLines} lines) ---`,
    tail || '(empty debug log)',
    '--- end npm debug log tail ---',
  ]
    .filter(Boolean)
    .join('\n');
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

function npmCommandEnvironment() {
  const env = { ...process.env, CI: 'true' };
  const deniedKeys = new Set([
    'npm_execpath',
    'npm_command',
    'npm_config_argv',
    'npm_config_node_gyp',
    'npm_config_npm_globalconfig',
    'npm_config_verify_deps_before_run',
    'npm_config__jsr_registry',
    'npm_lifecycle_event',
    'npm_lifecycle_script',
    'pnpm_config_npm_globalconfig',
    'pnpm_config_verify_deps_before_run',
    'pnpm_config__jsr_registry',
  ]);

  for (const key of Object.keys(env)) {
    if (deniedKeys.has(key.toLowerCase())) delete env[key];
  }

  env.npm_config_audit = 'false';
  env.npm_config_fund = 'false';
  env.npm_config_strict_peer_deps = 'true';
  env.npm_config_legacy_peer_deps = 'false';
  env.npm_config_update_notifier = 'false';

  return env;
}

function positiveNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function fail(message) {
  console.error(`[package-consumer] ${message}`);
  process.exit(1);
}
