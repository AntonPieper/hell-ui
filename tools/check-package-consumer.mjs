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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');
const keep = process.env.HELL_KEEP_PACKAGE_CONSUMER === '1';

run('pnpm', ['build:lib'], root);

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}`);
}

const distPackageJson = JSON.parse(readFileSync(join(distHell, 'package.json'), 'utf8'));
const packageName = distPackageJson.name;
if (!packageName) {
  fail('Built package.json is missing name');
}

const packedHell = packBuiltPackage();

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = rootPackage.dependencies ?? {};
const devDeps = rootPackage.devDependencies ?? {};

const angularAppDeps = [
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/platform-browser',
  'tslib',
];
const lightUiDeps = [
  ...angularAppDeps,
  '@angular/router',
  '@ng-icons/core',
  '@ng-icons/font-awesome',
  'ng-primitives',
  'rxjs',
  'tailwindcss',
];
const coreDeps = [...angularAppDeps, 'rxjs'];
const codeEditorDeps = [
  ...angularAppDeps,
  'tailwindcss',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/highlight',
];
const dataTableDeps = [...angularAppDeps, 'tailwindcss'];
const pdfViewerDeps = [
  ...angularAppDeps,
  'tailwindcss',
  'ng-primitives',
  '@ng-icons/core',
  '@ng-icons/font-awesome',
  'pdfjs-dist',
];

const scenarios = [
  {
    name: 'root',
    description: 'root entry without feature peers',
    dependencies: lightUiDeps,
    mainTs: rootConsumerMainTs(),
    stylesCss: rootConsumerStylesCss(),
  },
  {
    name: 'core',
    description: 'core entry without primitive/composite/feature peers',
    dependencies: coreDeps,
    mainTs: coreConsumerMainTs(),
    stylesCss: '',
  },
  {
    name: 'primitives',
    description: 'primitives entry without feature peers',
    dependencies: lightUiDeps,
    mainTs: primitivesConsumerMainTs(),
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
    name: 'code-editor',
    description: 'code-editor feature with only CodeMirror peers',
    dependencies: codeEditorDeps,
    mainTs: codeEditorConsumerMainTs(),
    stylesCss: codeEditorConsumerStylesCss(),
  },
  {
    name: 'table-utilities',
    description: 'preferred table utilities feature without light UI or CodeMirror/pdf peers',
    dependencies: dataTableDeps,
    mainTs: tableUtilitiesConsumerMainTs(),
    stylesCss: tableUtilitiesConsumerStylesCss(),
  },
  {
    name: 'data-table',
    description: 'legacy data-table alias without light UI or CodeMirror/pdf peers',
    dependencies: dataTableDeps,
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

try {
  for (const scenario of scenarios) {
    runConsumerScenario(scenario);
  }
} finally {
  if (keep) console.log(`[package-consumer] kept packed hell package ${packedHell.root}`);
  else rmSync(packedHell.root, { force: true, recursive: true });
}

function runConsumerScenario(scenario) {
  const tempRoot = mkdtempSync(join(tmpdir(), `hell-package-consumer-${scenario.name}-`));

  try {
    writeConsumerWorkspace(tempRoot, scenario);
    run('pnpm', ['install', '--strict-peer-dependencies', '--ignore-scripts'], tempRoot);
    run('pnpm', ['exec', 'ng', 'build', 'consumer', '--configuration', 'production'], tempRoot);
    console.log(`[package-consumer:${scenario.name}] built ${scenario.description}`);
  } finally {
    if (keep) console.log(`[package-consumer:${scenario.name}] kept ${tempRoot}`);
    else rmSync(tempRoot, { force: true, recursive: true });
  }
}

function packBuiltPackage() {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-consumer-pack-'));
  run('pnpm', ['pack', '--pack-destination', packRoot], distHell);
  const tarball = readdirSync(packRoot).find((name) => name.endsWith('.tgz'));
  if (!tarball) fail(`Packed package missing in ${packRoot}`);
  return { root: packRoot, tarball: join(packRoot, tarball) };
}

function writeConsumerWorkspace(workspace, scenario) {
  const packageJson = {
    name: `hell-package-consumer-${scenario.name}`,
    private: true,
    type: 'module',
    scripts: {
      build: 'ng build consumer --configuration production',
    },
    dependencies: pickDeps(deps, scenario.dependencies),
    devDependencies: pickDeps(devDeps, [
      '@angular/build',
      '@angular/cli',
      '@angular/compiler-cli',
      'typescript',
    ]),
  };
  packageJson.dependencies[packageName] = pathToFileURL(packedHell.tarball).href;

  writeJson(join(workspace, 'package.json'), packageJson);
  writeJson(join(workspace, 'angular.json'), {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    cli: { packageManager: 'pnpm', analytics: false },
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
  writeFileSync(join(workspace, 'src/main.ts'), scenario.mainTs);
  writeFileSync(join(workspace, 'src/styles.css'), scenario.stylesCss);
}

function pickDeps(source, names) {
  const picked = {};
  for (const name of names) {
    const version = source[name] ?? deps[name] ?? devDeps[name];
    if (!version) fail(`Root package.json missing dependency ${name}`);
    picked[name] = version;
  }
  return picked;
}

function rootConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton } from '${packageName}';

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
import { HELL_TABLE_UTILITY_DIRECTIVES, HellTableRowIgnore } from '${packageName}/features/table-utilities';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_TABLE_UTILITY_DIRECTIVES, HellTableRowIgnore],
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
import { HellPdfViewer } from '${packageName}/features/pdf-viewer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellPdfViewer],
  template: \`<hell-pdf-viewer [src]="pdfSrc" />\`,
})
class App {
  protected readonly pdfSrc = '/sample.pdf';
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

function run(command, args, cwd) {
  console.log(`[package-consumer] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: { ...process.env, CI: 'true' },
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`${command} ${args.join(' ')} failed with ${result.status}`);
}

function fail(message) {
  console.error(`[package-consumer] ${message}`);
  process.exit(1);
}
