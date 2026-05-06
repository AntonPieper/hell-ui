import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
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

const rootPackage = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const deps = rootPackage.dependencies ?? {};
const devDeps = rootPackage.devDependencies ?? {};

const baseDeps = [
  '@angular/common',
  '@angular/compiler',
  '@angular/core',
  '@angular/platform-browser',
  '@angular/router',
  '@ng-icons/core',
  '@ng-icons/font-awesome',
  'ng-primitives',
  'rxjs',
  'tailwindcss',
  'tslib',
];
const codeEditorDeps = [
  ...baseDeps,
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/highlight',
];
const pdfViewerDeps = [...baseDeps, 'pdfjs-dist'];

const scenarios = [
  {
    name: 'light',
    description: 'root/primitives/composites without feature peers',
    dependencies: baseDeps,
    mainTs: lightConsumerMainTs(),
    stylesCss: lightConsumerStylesCss(),
  },
  {
    name: 'code-editor',
    description: 'code-editor feature with only CodeMirror peers',
    dependencies: codeEditorDeps,
    mainTs: codeEditorConsumerMainTs(),
    stylesCss: codeEditorConsumerStylesCss(),
  },
  {
    name: 'data-table',
    description: 'data-table feature without CodeMirror/pdf peers',
    dependencies: baseDeps,
    mainTs: dataTableConsumerMainTs(),
    stylesCss: dataTableConsumerStylesCss(),
  },
  {
    name: 'pdf-viewer',
    description: 'pdf-viewer feature with only pdfjs peer',
    dependencies: pdfViewerDeps,
    mainTs: pdfViewerConsumerMainTs(),
    stylesCss: pdfViewerConsumerStylesCss(),
  },
];

for (const scenario of scenarios) {
  runConsumerScenario(scenario);
}

function runConsumerScenario(scenario) {
  const tempRoot = mkdtempSync(join(tmpdir(), `hell-package-consumer-${scenario.name}-`));

  try {
    writeConsumerWorkspace(tempRoot, scenario);
    run('pnpm', ['install', '--prefer-offline', '--ignore-scripts'], tempRoot);
    run('pnpm', ['exec', 'ng', 'build', 'consumer', '--configuration', 'production'], tempRoot);
    console.log(`[package-consumer:${scenario.name}] built ${scenario.description}`);
  } finally {
    if (keep) console.log(`[package-consumer:${scenario.name}] kept ${tempRoot}`);
    else rmSync(tempRoot, { force: true, recursive: true });
  }
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
  packageJson.dependencies.hell = pathToFileURL(distHell).href;

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

function lightConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellButton } from 'hell';
import { HellStyleable, type HellSize } from 'hell/core';
import { HellInput } from 'hell/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell/composites';

const size: HellSize = 'md';
void size;
void HellStyleable;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HellButton, HellInput, ...HELL_APP_SHELL_DIRECTIVES],
  template: \`
    <div hellAppShell>
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
      </header>
      <nav hellAppSidenav>Navigation</nav>
      <main hellAppContent>
        <button hellButton type="button">Save</button>
        <a hellButton href="#details" [disabled]="disabled">Details</a>
        <input hellInput aria-label="Name" />
      </main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button">Details</button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  \`,
})
class App {
  protected readonly disabled = true;
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
`;
}

function codeEditorConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellCodeEditor } from 'hell/features/code-editor';

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

function dataTableConsumerMainTs() {
  return `import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HELL_TABLE_DIRECTIVES } from 'hell/features/data-table';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...HELL_TABLE_DIRECTIVES],
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
import { HellPdfViewer } from 'hell/features/pdf-viewer';

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

function lightConsumerStylesCss() {
  return `@import "tailwindcss";
@import "hell/styles/tokens";
@import "hell/styles/primitives";
@import "hell/styles/composites";
`;
}

function codeEditorConsumerStylesCss() {
  return `@import "tailwindcss";
@import "hell/styles/tokens";
@import "hell/styles/features/code-editor";
`;
}

function dataTableConsumerStylesCss() {
  return `@import "tailwindcss";
@import "hell/styles/tokens";
@import "hell/styles/features/data-table";
`;
}

function pdfViewerConsumerStylesCss() {
  return `@import "tailwindcss";
@import "hell/styles/tokens";
@import "hell/styles/features/pdf-viewer";
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
