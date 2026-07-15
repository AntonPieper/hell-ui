import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
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
const reportFileName = 'cross-entrypoint.api.md';

export function checkApiReportCrossEntrypoint() {
  rmSync(outputFolder, { recursive: true, force: true });
  mkdirSync(fixtureFolder, { recursive: true });
  writeFileSync(
    join(fixtureFolder, 'package.json'),
    `${JSON.stringify({ name: '@hell-ui/angular', version: '0.0.0' }, null, 2)}\n`,
  );
  writeFileSync(join(fixtureFolder, 'core.d.ts'), coreDeclarationFixture);
  writeFileSync(join(fixtureFolder, 'narrow.d.ts'), narrowDeclarationFixture);

  const entrypoints = [
    {
      specifier: '@hell-ui/angular/core',
      declarationFilePath: join(fixtureFolder, 'core.d.ts'),
    },
    {
      specifier: '@hell-ui/angular/narrow',
      declarationFilePath: join(fixtureFolder, 'narrow.d.ts'),
    },
  ];
  const mirroredDeclarations = createApiReportDeclarationMirror({
    mirrorFolder: join(outputFolder, 'declaration-mirror'),
    packageName: '@hell-ui/angular',
    packageJsonFullPath: join(fixtureFolder, 'package.json'),
    entrypoints,
  });

  const extractorConfig = ExtractorConfig.prepare({
    configObject: {
      projectFolder: root,
      mainEntryPointFilePath: join(fixtureFolder, 'narrow.d.ts'),
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
                currentSpecifier: '@hell-ui/angular/narrow',
                entrypoints,
                mirroredDeclarations,
              }),
              '*': ['packages/angular/node_modules/*'],
            },
          },
          files: [join(fixtureFolder, 'narrow.d.ts')],
        },
      },
      apiReport: {
        enabled: true,
        reportFolder: outputFolder,
        reportTempFolder: outputFolder,
        reportFileName,
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
    packageJsonFullPath: join(fixtureFolder, 'package.json'),
  });

  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: false,
    messageCallback(message) {
      if (fixtureConsoleMessages.has(message.messageId)) message.handled = true;
    },
  });
  assert.equal(result.succeeded, true, 'fixture extraction should succeed');

  const report = readFileSync(join(outputFolder, reportFileName), 'utf8');
  assert.match(
    report,
    /from '@hell-ui\/angular\/core'/,
    'the shared core contract should remain an external entrypoint import',
  );
  assert.doesNotMatch(
    report,
    /symbol "SharedCoreContract" needs to be exported/,
    'the shared core contract must not be reported as a forgotten export',
  );
  assert.doesNotMatch(
    report,
    /\bWritableSignal\b/,
    'Angular declarations referenced only by the shared core contract must not leak into the narrow report',
  );
  assert.match(
    report,
    /symbol "ModuleLocalLeak" needs to be exported/,
    'a genuine declaration local to the narrow entrypoint must remain visible',
  );

  console.log('[api-report] cross-entrypoint model fixture passed.');
}

const coreDeclarationFixture = `import { WritableSignal } from '@angular/core';

/** Shared contract exported by the core entrypoint. */
export interface SharedCoreContract {
  readonly state: WritableSignal<string>;
}
`;

const narrowDeclarationFixture = `import { Signal } from '@angular/core';
import { SharedCoreContract } from '@hell-ui/angular/core';

interface ModuleLocalLeak {
  readonly internal: true;
}

/** Public surface exported by a narrow entrypoint. */
declare class NarrowSurface {
  readonly directAngularReference: Signal<boolean>;
  readonly sharedCoreReference: SharedCoreContract;
  protected readonly moduleLocalLeak: ModuleLocalLeak;
}

export { NarrowSurface };
`;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkApiReportCrossEntrypoint();
}
