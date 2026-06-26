import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reportFolder = join(root, 'etc/api-reports');
const reportTempFolder = join(root, 'tmp/api-reports');
const packageJsonFullPath = join(root, 'dist/hell/package.json');
const localBuild = process.argv.includes('--local') || process.argv.includes('--update');

const apiReportEntrypoints = [
  {
    id: 'root',
    specifier: '@hell-ui/angular',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular.d.ts',
    reportFileName: 'hell-ui-angular.api.md',
  },
  {
    id: 'core',
    specifier: '@hell-ui/angular/core',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-core.d.ts',
    reportFileName: 'hell-ui-angular-core.api.md',
  },
  {
    id: 'internal-hotkeys',
    specifier: '@hell-ui/angular/internal/hotkeys',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-internal-hotkeys.d.ts',
    reportFileName: 'hell-ui-angular-internal-hotkeys.api.md',
  },
  {
    id: 'input',
    specifier: '@hell-ui/angular/input',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-input.d.ts',
    reportFileName: 'hell-ui-angular-input.api.md',
  },
  {
    id: 'dialpad',
    specifier: '@hell-ui/angular/dialpad',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-dialpad.d.ts',
    reportFileName: 'hell-ui-angular-dialpad.api.md',
  },
  {
    id: 'testing',
    specifier: '@hell-ui/angular/testing',
    mainEntryPointFilePath: 'dist/hell/types/hell-ui-angular-testing.d.ts',
    reportFileName: 'hell-ui-angular-testing.api.md',
  },
];

const missingInputs = requiredBuildInputs().filter((path) => !existsSync(path));
if (missingInputs.length) {
  console.error('API report check requires a built library. Run `pnpm run build:lib` first.');
  for (const path of missingInputs) console.error(`- missing ${relativeToRoot(path)}`);
  process.exit(1);
}

mkdirSync(reportFolder, { recursive: true });
mkdirSync(reportTempFolder, { recursive: true });

let failed = false;

for (const entrypoint of apiReportEntrypoints) {
  console.log(`[api-report] ${localBuild ? 'updating' : 'checking'} ${entrypoint.specifier}`);
  const extractorConfig = ExtractorConfig.prepare({
    configObject: apiExtractorConfig(entrypoint),
    configObjectFullPath: undefined,
    packageJsonFullPath,
  });

  const result = Extractor.invoke(extractorConfig, {
    localBuild,
    showVerboseMessages: false,
  });

  if (!result.succeeded) {
    console.error(
      `[api-report] ${entrypoint.specifier} failed with ${result.errorCount} errors and ${result.warningCount} warnings.`,
    );
    failed = true;
  }
}

if (failed) {
  console.error(
    localBuild
      ? '[api-report] update failed.'
      : '[api-report] report drift detected. Run `pnpm run build:lib && pnpm run api-report:update`, review the API report changes, and commit approved updates.',
  );
  process.exit(1);
}

console.log(
  `[api-report] ${localBuild ? 'updated' : 'current'}: ${apiReportEntrypoints.length} entrypoints.`,
);

function requiredBuildInputs() {
  return [
    packageJsonFullPath,
    ...apiReportEntrypoints.map((entrypoint) => mainEntryPointPath(entrypoint)),
  ];
}

function apiExtractorConfig(entrypoint) {
  return {
    $schema:
      'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
    projectFolder: root,
    mainEntryPointFilePath: mainEntryPointPath(entrypoint),
    compiler: {
      overrideTsconfig: apiExtractorTsconfig(entrypoint),
    },
    apiReport: {
      enabled: true,
      reportFolder,
      reportTempFolder,
      reportFileName: entrypoint.reportFileName,
    },
    docModel: {
      enabled: false,
    },
    dtsRollup: {
      enabled: false,
    },
    tsdocMetadata: {
      enabled: false,
    },
    newlineKind: 'lf',
    messages: {
      compilerMessageReporting: {
        default: {
          logLevel: 'warning',
        },
      },
      extractorMessageReporting: {
        default: {
          logLevel: 'warning',
          addToApiReportFile: true,
        },
        // Formal stability tags are checked separately; API reports track shape here.
        'ae-missing-release-tag': {
          logLevel: 'none',
        },
        'ae-internal-missing-underscore': {
          logLevel: 'none',
        },
      },
      tsdocMessageReporting: {
        default: {
          logLevel: 'none',
        },
      },
    },
  };
}

function apiExtractorTsconfig(entrypoint) {
  return {
    compilerOptions: {
      strict: true,
      rootDir: '.',
      moduleResolution: 'bundler',
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
      baseUrl: root,
      paths: {
        '*': ['packages/angular/node_modules/*', 'packages/pdf-viewer/node_modules/*'],
      },
    },
    files: [mainEntryPointPath(entrypoint)],
  };
}

function mainEntryPointPath(entrypoint) {
  return join(root, entrypoint.mainEntryPointFilePath);
}

function relativeToRoot(path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}
