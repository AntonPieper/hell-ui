import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  apiReportSiblingPaths,
  createApiReportDeclarationMirror,
} from './api-report-model.mjs';
import { checkApiReportCrossEntrypoint } from './check-api-report-cross-entrypoint.mjs';
import {
  checkApiReportWarningGateFixture,
  scanApiReportWarnings,
  scanInternalContractImports,
  validateWarningGateConfiguration,
} from './check-api-report-warnings.mjs';
import { entrypointPublicApiFiles, packageName } from './entrypoint-manifest.mjs';

const require = createRequire(import.meta.url);
const { ConsoleMessageId, Extractor, ExtractorConfig } = require('@microsoft/api-extractor');
const oncePerRunConsoleMessages = new Set([
  ConsoleMessageId.Preamble,
  ConsoleMessageId.CompilerVersionNotice,
]);
const seenConsoleMessages = new Set();

/**
 * Entry points without an API report, with the reason they are excluded.
 * Everything else discovered through the entrypoint manifest is guarded.
 *
 * If api-extractor crashes with "Unable to follow symbol" on a new entry
 * point, the flattened d.ts is shipping an unbound identifier (ng-packagr
 * drops imports for types inferred through internal entry points). Fix it at
 * the source member with an explicit type annotation — see the annotated
 * `Signal` members in select, combobox, date-input, and audio-player.
 */
const apiReportExclusions = new Map([
  ['features/audio-transcript', 'experimental feature surface, not yet under report'],
  ['features/code-editor', 'feature surface, not yet under report'],
  ['features/dialpad', 'feature surface, not yet under report'],
  ['features/pdf-viewer', 'feature surface, not yet under report'],
  ['internal/audio-transcript', 'internal seam, not part of the public surface'],
  ['internal/chip', 'internal seam, not part of the public surface'],
  ['internal/ng-primitives', 'internal seam, not part of the public surface'],
]);

const declarationEntrypoints = entrypointPublicApiFiles().map((entrypoint) => {
  const flattened =
    entrypoint.id === 'root'
      ? 'hell-ui-angular'
      : `hell-ui-angular-${entrypoint.id.replaceAll('/', '-')}`;
  return {
    id: entrypoint.id,
    specifier: entrypoint.id === 'root' ? packageName : `${packageName}/${entrypoint.id}`,
    mainEntryPointFilePath: `dist/hell/types/${flattened}.d.ts`,
    reportFileName: `${flattened}.api.md`,
  };
});
const apiReportEntrypoints = declarationEntrypoints.filter(
  (entrypoint) => !apiReportExclusions.has(entrypoint.id),
);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reportFolder = join(root, 'etc/api-reports');
const reportTempFolder = join(root, 'tmp/api-reports');
const declarationMirrorFolder = join(root, 'tmp/api-report-declaration-mirror');
const packageJsonFullPath = join(root, 'dist/hell/package.json');
const localBuild = process.argv.includes('--local') || process.argv.includes('--update');

const missingInputs = requiredBuildInputs().filter((path) => !existsSync(path));
if (missingInputs.length) {
  console.error('API report check requires a built library. Run `pnpm run build:lib` first.');
  for (const path of missingInputs) console.error(`- missing ${relativeToRoot(path)}`);
  process.exit(1);
}

mkdirSync(reportFolder, { recursive: true });
mkdirSync(reportTempFolder, { recursive: true });

annotateCompilerGeneratedStatics();
const mirroredDeclarations = createApiReportDeclarationMirror({
  mirrorFolder: declarationMirrorFolder,
  packageName,
  packageJsonFullPath,
  entrypoints: apiReportEntrypoints.map((entrypoint) => ({
    specifier: entrypoint.specifier,
    declarationFilePath: mainEntryPointPath(entrypoint),
  })),
});
checkApiReportCrossEntrypoint();
checkApiReportWarningGateFixture();

let failed = false;
const warningGateFailures = validateWarningGateConfiguration(
  apiReportEntrypoints.map((entrypoint) => entrypoint.specifier),
);

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
    messageCallback(message) {
      if (!oncePerRunConsoleMessages.has(message.messageId)) return;
      if (seenConsoleMessages.has(message.messageId)) message.handled = true;
      else seenConsoleMessages.add(message.messageId);
    },
  });

  if (!result.succeeded) {
    console.error(
      `[api-report] ${entrypoint.specifier} failed with ${result.errorCount} errors and ${result.warningCount} warnings.`,
    );
    failed = true;
  }

  // The fresh report is always written to the temp folder, in check and
  // update mode alike, so the warning gate sees new findings before they
  // reach a committed baseline.
  const generatedReport = readFileSync(join(reportTempFolder, entrypoint.reportFileName), 'utf8');
  warningGateFailures.push(
    ...scanApiReportWarnings({ specifier: entrypoint.specifier, reportText: generatedReport }),
    ...scanInternalContractImports({
      specifier: entrypoint.specifier,
      reportText: generatedReport,
    }),
  );
}

if (failed) {
  console.error(
    localBuild
      ? '[api-report] update failed.'
      : '[api-report] report drift detected. Run `pnpm run build:lib && pnpm run api-report:update`, review the API report changes, and commit approved updates.',
  );
}

if (warningGateFailures.length) {
  console.error('[api-report] release-blocking report findings:');
  for (const failure of warningGateFailures) console.error(`- ${failure}`);
  failed = true;
}

if (failed) process.exit(1);

console.log(
  `[api-report] ${localBuild ? 'updated' : 'current'}: ${apiReportEntrypoints.length} entrypoints.`,
);

// The Angular compiler emits ɵfac/ɵdir/ɵcmp/... and ngAcceptInputType_...
// static declarations into the built d.ts with no way to attach TSDoc in
// source, so API Extractor flags every one as ae-undocumented. Annotate them
// in the built types (idempotent) before extraction so reports only flag
// documentation gaps authors can fix.
function annotateCompilerGeneratedStatics() {
  const typesFolder = join(root, 'dist/hell/types');
  const staticPattern = /^([ \t]*)(static (?:ɵ(?:fac|dir|cmp|prov|mod|inj|pipe)|ngAcceptInputType_\w+):)/;
  for (const name of readdirSync(typesFolder)) {
    if (!name.endsWith('.d.ts')) continue;
    const filePath = join(typesFolder, name);
    const lines = readFileSync(filePath, 'utf8').split('\n');
    const annotated = [];
    let changed = false;
    for (const line of lines) {
      const match = staticPattern.exec(line);
      const previous = annotated[annotated.length - 1];
      if (match && !previous?.trimEnd().endsWith('*/')) {
        annotated.push(`${match[1]}/** Angular compiler-generated declaration. */`);
        changed = true;
      }
      annotated.push(line);
    }
    if (changed) writeFileSync(filePath, annotated.join('\n'));
  }
}

function requiredBuildInputs() {
  return [
    packageJsonFullPath,
    ...declarationEntrypoints.map((entrypoint) => mainEntryPointPath(entrypoint)),
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
        ...apiReportSiblingPaths({
          baseUrl: root,
          currentSpecifier: entrypoint.specifier,
          entrypoints: apiReportEntrypoints,
          mirroredDeclarations,
        }),
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
