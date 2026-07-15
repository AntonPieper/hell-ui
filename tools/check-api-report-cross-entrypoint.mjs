import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  apiReportSiblingPaths,
  createApiReportDeclarationMirror,
} from './api-report-model.mjs';

const require = createRequire(import.meta.url);
const { ConsoleMessageId, Extractor, ExtractorConfig } = require('@microsoft/api-extractor');
const fixtureConsoleMessages = new Set([
  ConsoleMessageId.Preamble,
  ConsoleMessageId.CompilerVersionNotice,
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outputFolder = join(root, 'tmp/api-report-cross-entrypoint');
const fixtureFolder = join(outputFolder, 'fixture');
const packageJsonFullPath = join(fixtureFolder, 'package.json');
const narrowReportFileName = 'cross-entrypoint.api.md';
const coreReportFileName = 'core.api.md';
const internalCoreReportFileName = 'internal-core.api.md';

export function checkApiReportCrossEntrypoint() {
  rmSync(outputFolder, { recursive: true, force: true });
  mkdirSync(fixtureFolder, { recursive: true });
  writeFileSync(
    packageJsonFullPath,
    `${JSON.stringify({ name: '@hell-ui/angular', version: '0.0.0' }, null, 2)}\n`,
  );
  writeFileSync(join(fixtureFolder, 'internal-core.d.ts'), internalCoreDeclarationFixture);
  writeFileSync(
    join(fixtureFolder, 'excluded-internal.d.ts'),
    excludedInternalDeclarationFixture,
  );
  writeFileSync(join(fixtureFolder, 'core.d.ts'), coreDeclarationFixture);
  writeFileSync(join(fixtureFolder, 'narrow.d.ts'), narrowDeclarationFixture);

  const declarationEntrypoints = [
    {
      specifier: '@hell-ui/angular/internal/core',
      declarationFilePath: join(fixtureFolder, 'internal-core.d.ts'),
      reportFileName: internalCoreReportFileName,
    },
    {
      specifier: '@hell-ui/angular/internal/excluded',
      declarationFilePath: join(fixtureFolder, 'excluded-internal.d.ts'),
    },
    {
      specifier: '@hell-ui/angular/core',
      declarationFilePath: join(fixtureFolder, 'core.d.ts'),
      reportFileName: coreReportFileName,
    },
    {
      specifier: '@hell-ui/angular/narrow',
      declarationFilePath: join(fixtureFolder, 'narrow.d.ts'),
      reportFileName: narrowReportFileName,
    },
  ];
  const reportEntrypoints = declarationEntrypoints.filter(
    (entrypoint) => entrypoint.reportFileName,
  );
  const mirroredDeclarations = createApiReportDeclarationMirror({
    mirrorFolder: join(outputFolder, 'declaration-mirror'),
    packageName: '@hell-ui/angular',
    packageJsonFullPath,
    entrypoints: reportEntrypoints,
  });
  assert.equal(
    mirroredDeclarations.has('@hell-ui/angular/internal/excluded'),
    false,
    'an excluded internal sibling must not be externalized without a report',
  );

  const reports = new Map(
    reportEntrypoints.map((entrypoint) => [
      entrypoint.specifier,
      extractFixtureReport({
        entrypoint,
        reportEntrypoints,
        mirroredDeclarations,
        localSiblingPaths:
          entrypoint.specifier === '@hell-ui/angular/narrow'
            ? {
                '@hell-ui/angular/internal/excluded': [
                  toTsconfigPath(join(fixtureFolder, 'excluded-internal.d.ts')),
                ],
              }
            : {},
      }),
    ]),
  );
  const narrowReport = reports.get('@hell-ui/angular/narrow');
  const internalCoreReport = reports.get('@hell-ui/angular/internal/core');
  assert.ok(narrowReport, 'the narrow fixture report should exist');
  assert.ok(internalCoreReport, 'the internal core fixture report should exist');

  assert.match(
    narrowReport,
    /from '@hell-ui\/angular\/core'/,
    'the shared core contract should remain an external entrypoint import',
  );
  assert.match(
    narrowReport,
    /from '@hell-ui\/angular\/internal\/core'/,
    'the guarded internal contract should remain an explicit entrypoint import',
  );
  assert.doesNotMatch(
    narrowReport,
    /symbol "(?:SharedCoreContract|InternalStableContract)" needs to be exported/,
    'guarded sibling contracts must not be reported as forgotten exports',
  );
  assert.doesNotMatch(
    narrowReport,
    /\bWritableSignal\b/,
    'Angular declarations referenced only by the shared core contract must not leak into the narrow report',
  );
  assert.match(
    narrowReport,
    /symbol "ModuleLocalLeak" needs to be exported/,
    'a genuine declaration local to the narrow entrypoint must remain visible',
  );
  assert.match(
    narrowReport,
    /symbol "ExcludedInternalContract" needs to be exported/,
    'a contract from an unguarded internal sibling must remain a visible leak',
  );
  assert.match(
    internalCoreReport,
    /export interface InternalStableContract/,
    'a guarded internal sibling must retain its stable shape in its own baseline',
  );
  assert.match(
    internalCoreReport,
    /symbol "InternalModuleLeak" needs to be exported/,
    'a declaration local to a guarded internal sibling must remain visible',
  );

  console.log('[api-report] cross-entrypoint model fixture passed.');
}

function extractFixtureReport({
  entrypoint,
  reportEntrypoints,
  mirroredDeclarations,
  localSiblingPaths = {},
}) {
  assert.ok(entrypoint, 'fixture report entrypoint should exist');
  const extractorConfig = ExtractorConfig.prepare({
    configObject: {
      projectFolder: root,
      mainEntryPointFilePath: entrypoint.declarationFilePath,
      compiler: {
        overrideTsconfig: {
          compilerOptions: {
            strict: true,
            moduleResolution: 'bundler',
            target: 'ES2022',
            module: 'preserve',
            baseUrl: root,
            paths: {
              ...apiReportSiblingPaths({
                baseUrl: root,
                currentSpecifier: entrypoint.specifier,
                entrypoints: reportEntrypoints,
                mirroredDeclarations,
              }),
              ...localSiblingPaths,
              '*': ['packages/angular/node_modules/*'],
            },
          },
          files: [entrypoint.declarationFilePath],
        },
      },
      apiReport: {
        enabled: true,
        reportFolder: outputFolder,
        reportTempFolder: outputFolder,
        reportFileName: entrypoint.reportFileName,
      },
      docModel: { enabled: false },
      dtsRollup: { enabled: false },
      tsdocMetadata: { enabled: false },
      newlineKind: 'lf',
      messages: {
        compilerMessageReporting: { default: { logLevel: 'warning' } },
        extractorMessageReporting: {
          default: { logLevel: 'warning', addToApiReportFile: true },
          'ae-missing-release-tag': { logLevel: 'none' },
        },
        tsdocMessageReporting: { default: { logLevel: 'none' } },
      },
    },
    configObjectFullPath: undefined,
    packageJsonFullPath,
  });

  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: false,
    messageCallback(message) {
      if (fixtureConsoleMessages.has(message.messageId)) message.handled = true;
    },
  });
  assert.equal(result.succeeded, true, 'fixture extraction should succeed');

  return readFileSync(join(outputFolder, entrypoint.reportFileName), 'utf8');
}

const coreDeclarationFixture = `import { WritableSignal } from '@angular/core';
import { InternalStableContract } from '@hell-ui/angular/internal/core';

export { InternalStableContract } from '@hell-ui/angular/internal/core';

/** Shared contract exported by the core entrypoint. */
export interface SharedCoreContract {
  readonly internalContract: InternalStableContract;
  readonly state: WritableSignal<string>;
}
`;

const narrowDeclarationFixture = `import { Signal } from '@angular/core';
import { SharedCoreContract } from '@hell-ui/angular/core';
import { InternalStableContract } from '@hell-ui/angular/internal/core';
import { ExcludedInternalContract } from '@hell-ui/angular/internal/excluded';

interface ModuleLocalLeak {
  readonly internal: true;
}

/** Public surface exported by a narrow entrypoint. */
declare class NarrowSurface {
  readonly directAngularReference: Signal<boolean>;
  readonly sharedCoreReference: SharedCoreContract;
  readonly internalReference: InternalStableContract;
  protected readonly moduleLocalLeak: ModuleLocalLeak;
  protected readonly excludedInternalLeak: ExcludedInternalContract;
}

export { NarrowSurface };
`;

const internalCoreDeclarationFixture = `import { Signal } from '@angular/core';

interface InternalModuleLeak {
  readonly hidden: true;
}

/** Stable shape used through a guarded internal entrypoint. */
export interface InternalStableContract {
  readonly stableState: Signal<string>;
}

/** Guarded internal runtime surface. */
declare class InternalRuntimeSurface {
  protected readonly moduleLocalLeak: InternalModuleLeak;
}

export { InternalRuntimeSurface };
`;

const excludedInternalDeclarationFixture = `/** Unguarded implementation contract. */
export interface ExcludedInternalContract {
  readonly runtimeState: { readonly active: boolean };
}
`;

function toTsconfigPath(path) {
  return relative(root, path).split(sep).join('/');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkApiReportCrossEntrypoint();
}
