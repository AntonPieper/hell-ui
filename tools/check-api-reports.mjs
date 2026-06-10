import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { apiReportPolicyEntries } from './entrypoint-manifest.mjs';

const require = createRequire(import.meta.url);
const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reportFolder = join(root, 'etc/api-reports');
const reportTempFolder = join(root, 'tmp/api-reports');
const tsconfigFilePath = join(root, 'tsconfig.json');
const localBuild = process.argv.includes('--local') || process.argv.includes('--update');

const apiReportEntrypoints = apiReportPolicyEntries()
  .filter((entrypoint) => entrypoint.apiReport.expectation === 'required')
  .map(apiReportEntrypoint);

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
    packageJsonFullPath: packageJsonPath(entrypoint),
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

console.log(`[api-report] ${localBuild ? 'updated' : 'current'}: ${apiReportEntrypoints.length} entrypoints.`);

function requiredBuildInputs() {
  return [
    ...new Set([
      ...apiReportEntrypoints.map(packageJsonPath),
      ...apiReportEntrypoints.map(mainEntryPointPath),
    ]),
  ];
}

function apiExtractorConfig(entrypoint) {
  return {
    $schema: 'https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json',
    projectFolder: root,
    mainEntryPointFilePath: mainEntryPointPath(entrypoint),
    compiler: {
      tsconfigFilePath,
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
        // HELL-026 will add formal stability tags. Until then, API reports track shape only.
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

function mainEntryPointPath(entrypoint) {
  return join(
    root,
    entrypoint.distRoot,
    'types',
    `${apiReportTypeFileBase(entrypoint.specifier)}.d.ts`,
  );
}

function packageJsonPath(entrypoint) {
  return join(root, entrypoint.distRoot, 'package.json');
}

function apiReportEntrypoint(entrypoint) {
  return {
    id: entrypoint.id,
    specifier: entrypoint.specifier,
    distRoot: packageDistRoot(entrypoint.ownerPackage),
    reportFileName: entrypoint.apiReport.reportFileName,
  };
}

function packageDistRoot(ownerPackage) {
  if (ownerPackage === '@hell-ui/angular') return 'dist/hell';
  if (ownerPackage === '@hell-ui/pdf-viewer') return 'dist/hell-pdf-viewer';
  throw new Error(`Unknown API report owner package ${ownerPackage}`);
}

function apiReportTypeFileBase(specifier) {
  return specifier.replace(/^@/, '').replaceAll('/', '-');
}

function relativeToRoot(path) {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}
