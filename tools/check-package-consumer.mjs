import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPackageManager } from './package-manager.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';
const packageConsumerArgs = process.argv.slice(2);
const selectedScenarioNames = parseScenarioSelection(packageConsumerArgs);
const minimalDependencyMode = parseMinimalDependencyMode(packageConsumerArgs);
const npmTimeoutMs = positiveNumber(process.env.HELL_PACKAGE_CONSUMER_TIMEOUT_MS, 240_000);

runRootPackageManager(['run', 'build:lib'], root);

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}`);
}

const distPackageJson = JSON.parse(readFileSync(join(distHell, 'package.json'), 'utf8'));
const packageName = distPackageJson.name;
if (!packageName) {
  fail('Built package.json is missing name');
}

const packedHell = packBuiltPackage();
assertPackedPackageDoesNotBundlePdfWorker(packedHell.tarball);

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
const lightUiWithoutFontAwesomeDeps = [
  ...angularAppDeps,
  '@angular/cdk',
  '@floating-ui/dom',
  'ng-primitives',
  '@ng-icons/core',
  'tailwindcss',
];
const lightUiDeps = [
  ...lightUiWithoutFontAwesomeDeps,
  '@ng-icons/font-awesome',
];
// The aggregate /primitives FESM includes dialog, and ng-primitives/dialog
// currently imports @angular/router even though Hell no longer declares router
// as a package peer. Narrow primitive entrypoints (for example /button) prove
// router-free consumption for consumers that avoid the aggregate barrel.
const primitivesDeps = [
  ...lightUiDeps,
  '@angular/router',
];
const coreDeps = lightUiWithoutFontAwesomeDeps;
const codeEditorDeps = [
  ...lightUiDeps,
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/highlight',
];
const testingDeps = coreDeps;
const pdfViewerDeps = [
  ...lightUiDeps,
  'pdfjs-dist',
];


const scenarios = [
  {
    name: 'root',
    description: 'root entry core-only with package-wide light peers',
    dependencies: coreDeps,
    mainTs: rootConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'core',
    description: 'core entry with package-wide light peers',
    dependencies: coreDeps,
    mainTs: coreConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'primitives',
    description: 'primitives entry without feature peers',
    dependencies: primitivesDeps,
    mainTs: primitivesConsumerMainTs(),
    stylesCss: primitivesConsumerStylesCss(),
  },
  {
    name: 'button',
    description: 'narrow primitive button entry without Font Awesome peer',
    dependencies: coreDeps,
    mainTs: buttonConsumerMainTs(),
    stylesCss: primitivesConsumerStylesCss(),
  },
  {
    name: 'composites',
    description: 'composites entry without feature peers',
    dependencies: lightUiDeps,
    mainTs: compositesConsumerMainTs(),
    stylesCss: compositesConsumerStylesCss(),
  },
  {
    name: 'app-shell',
    description: 'narrow app-shell composite entry without feature peers',
    dependencies: lightUiDeps,
    mainTs: appShellConsumerMainTs(),
    stylesCss: compositesConsumerStylesCss(),
  },
  {
    name: 'testing',
    description: 'testing entry with package-wide light peers',
    dependencies: testingDeps,
    mainTs: testingConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'code-editor',
    description: 'code-editor feature with package-wide light peers and CodeMirror peers',
    dependencies: codeEditorDeps,
    mainTs: codeEditorConsumerMainTs(),
    stylesCss: codeEditorConsumerStylesCss(),
  },
  {
    name: 'table-utilities',
    description: 'preferred table utilities feature with package-wide light peers',
    dependencies: lightUiDeps,
    mainTs: tableUtilitiesConsumerMainTs(),
    stylesCss: tableUtilitiesConsumerStylesCss(),
  },
  {
    name: 'data-table',
    description: 'legacy data-table alias with package-wide light peers',
    dependencies: lightUiDeps,
    mainTs: dataTableConsumerMainTs(),
    stylesCss: dataTableConsumerStylesCss(),
  },
  {
    name: 'pdf-viewer',
    description: 'pdf-viewer feature with pdfjs and light UI peers',
    dependencies: pdfViewerDeps,
    mainTs: pdfViewerConsumerMainTs(),
    stylesCss: pdfViewerConsumerStylesCss(),
  },
];

const enabledScenarios = selectScenarios(scenarios, selectedScenarioNames);

try {
  for (const group of scenarioDependencyGroups(enabledScenarios, minimalDependencyMode)) {
    runConsumerScenarioGroup(group);
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

  const byName = new Map(allScenarios.map((scenario) => [scenario.name.toLowerCase(), scenario]));
  const selected = selectedNames.map((name) => byName.get(name)).filter(Boolean);
  if (selected.length !== selectedNames.length) {
    const missing = selectedNames.filter((name) => !byName.has(name));
    fail(`Unknown package-consumer scenario(s): ${missing.join(', ')}`);
  }

  console.log(
    `[package-consumer] selected scenarios: ${selected.map((scenario) => scenario.name).join(', ')}`,
  );
  return selected;
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

function runConsumerScenarioGroup(group) {
  const groupName = group.scenarios.map((scenario) => scenario.name).join('-');
  const tempRoot = mkdtempSync(join(tmpdir(), `hell-package-consumer-${groupName}-`));

  try {
    writeConsumerWorkspace(tempRoot, group.scenarios[0], group.dependencies);
    runNpm([
      'install',
      '--strict-peer-deps',
      '--ignore-scripts',
      '--prefer-offline',
      '--no-audit',
      '--no-fund',
    ], tempRoot);

    for (const scenario of group.scenarios) {
      writeConsumerScenarioFiles(tempRoot, scenario);
      runNpm(['exec', '--', 'ng', 'build', 'consumer', '--configuration', 'production'], tempRoot);
      console.log(`[package-consumer:${scenario.name}] built ${scenario.description}`);
    }
  } finally {
    if (keep) console.log(`[package-consumer:${groupName}] kept ${tempRoot}`);
    else rmSync(tempRoot, { force: true, recursive: true });
  }
}

function packBuiltPackage() {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-consumer-pack-'));
  runNpm(['pack', '--pack-destination', packRoot], distHell);
  const tarball = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
  if (!tarball) fail(`Packed package missing in ${packRoot}`);
  return { root: packRoot, tarball: join(packRoot, tarball) };
}

function assertPackedPackageDoesNotBundlePdfWorker(tarball) {
  const result = spawnSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
  if (result.error) fail(`Unable to inspect packed package ${tarball}: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`Unable to inspect packed package ${tarball}: ${result.stderr || result.stdout}`);
  }

  const bundledWorkers = result.stdout
    .split('\n')
    .filter((entry) => /pdf\.worker\.(?:mjs|js)$/.test(entry));
  if (bundledWorkers.length) {
    fail(
      `Packed package must not bundle pdf.js workers; apps provide the worker source. Found: ${bundledWorkers.join(', ')}`,
    );
  }
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

function runRootPackageManager(args, cwd) {
  console.log(`[package-consumer] package-manager ${args.join(' ')}`);
  const result = runPackageManager(args, {
    cwd,
    env: { ...process.env, CI: 'true' },
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`package-manager ${args.join(' ')} failed with ${result.status}`);
}

function runNpm(args, cwd) {
  console.log(`[package-consumer] npm ${args.join(' ')}`);
  const result = spawnSync('npm', args, {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: npmCommandEnvironment(),
    timeout: npmTimeoutMs,
  });
  if (result.error) fail(npmErrorMessage(args, result.error));
  if (result.status !== 0) fail(`npm ${args.join(' ')} failed with ${result.status}`);
}

function npmErrorMessage(args, error) {
  if (error?.code === 'ETIMEDOUT') {
    return `npm ${args.join(' ')} timed out after ${npmTimeoutMs}ms`;
  }
  return error?.message ?? String(error);
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
