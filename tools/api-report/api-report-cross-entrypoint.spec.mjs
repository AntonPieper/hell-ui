import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  apiReportSiblingPaths,
  createApiReportDeclarationMirror,
} from './api-report-model.mjs';

/**
 * The cross-entrypoint externalization contract, driven end to end by the real
 * API Extractor over synthetic declarations.
 *
 * `createApiReportDeclarationMirror` and `apiReportSiblingPaths` exist so a
 * report describes one entrypoint's surface and models its guarded siblings as
 * external package contracts. Whether that actually holds is a fact about how
 * API Extractor and the TypeScript resolver behave together, not about our
 * inputs — so this extracts for real rather than asserting on the mapping we
 * hand them. Nothing here reads `dist`: every declaration below is written by
 * this file.
 */

const require = createRequire(import.meta.url);
const { ConsoleMessageId, Extractor, ExtractorConfig, ExtractorMessageCategory } = require(
  '@microsoft/api-extractor',
);
const fixtureConsoleMessages = new Set([
  ConsoleMessageId.Preamble,
  ConsoleMessageId.CompilerVersionNotice,
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputFolder = join(root, 'tmp/api-report-cross-entrypoint');
const fixtureFolder = join(outputFolder, 'fixture');
const packageJsonFullPath = join(fixtureFolder, 'package.json');

const coreDeclarationFixture = `import { WritableSignal } from '@angular/core';
import { InternalStableContract } from 'hell-ui/internal/core';

export { InternalStableContract } from 'hell-ui/internal/core';

/** Shared contract exported by the core entrypoint. */
export interface SharedCoreContract {
  readonly internalContract: InternalStableContract;
  readonly state: WritableSignal<string>;
}
`;

const narrowDeclarationFixture = `import { Signal } from '@angular/core';
import { SharedCoreContract } from 'hell-ui/core';
import { InternalStableContract } from 'hell-ui/internal/core';
import { ExcludedInternalContract } from 'hell-ui/internal/excluded';

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

describe('api report cross-entrypoint externalization', () => {
  /** @type {Map<string, string>} specifier -> generated report text. */
  const reports = new Map();
  /** @type {Map<string, string[]>} specifier -> TypeScript diagnostics raised while extracting. */
  const compilerMessages = new Map();
  /** @type {Map<string, string>} */
  let mirroredDeclarations;

  beforeAll(() => {
    rmSync(outputFolder, { recursive: true, force: true });
    mkdirSync(fixtureFolder, { recursive: true });
    writeFileSync(
      packageJsonFullPath,
      `${JSON.stringify({ name: 'hell-ui', version: '0.0.0' }, null, 2)}\n`,
    );
    writeFileSync(join(fixtureFolder, 'internal-core.d.ts'), internalCoreDeclarationFixture);
    writeFileSync(join(fixtureFolder, 'excluded-internal.d.ts'), excludedInternalDeclarationFixture);
    writeFileSync(join(fixtureFolder, 'core.d.ts'), coreDeclarationFixture);
    writeFileSync(join(fixtureFolder, 'narrow.d.ts'), narrowDeclarationFixture);

    const declarationEntrypoints = [
      {
        specifier: 'hell-ui/internal/core',
        declarationFilePath: join(fixtureFolder, 'internal-core.d.ts'),
        reportFileName: 'internal-core.api.md',
      },
      {
        specifier: 'hell-ui/internal/excluded',
        declarationFilePath: join(fixtureFolder, 'excluded-internal.d.ts'),
      },
      {
        specifier: 'hell-ui/core',
        declarationFilePath: join(fixtureFolder, 'core.d.ts'),
        reportFileName: 'core.api.md',
      },
      {
        specifier: 'hell-ui/narrow',
        declarationFilePath: join(fixtureFolder, 'narrow.d.ts'),
        reportFileName: 'cross-entrypoint.api.md',
      },
    ];
    const reportEntrypoints = declarationEntrypoints.filter(
      (entrypoint) => entrypoint.reportFileName,
    );

    mirroredDeclarations = createApiReportDeclarationMirror({
      mirrorFolder: join(outputFolder, 'declaration-mirror'),
      packageName: 'hell-ui',
      packageJsonFullPath,
      entrypoints: reportEntrypoints,
    });

    for (const entrypoint of reportEntrypoints) {
      const extraction = extractFixtureReport({
        entrypoint,
        reportEntrypoints,
        mirroredDeclarations,
        // The excluded internal sibling has no mirror, so the narrow
        // entrypoint resolves it locally — exactly how an unguarded internal
        // seam reaches a public report in the real gate.
        localSiblingPaths:
          entrypoint.specifier === 'hell-ui/narrow'
            ? {
                'hell-ui/internal/excluded': [
                  toTsconfigPath(join(fixtureFolder, 'excluded-internal.d.ts')),
                ],
              }
            : {},
      });
      reports.set(entrypoint.specifier, extraction.report);
      compilerMessages.set(entrypoint.specifier, extraction.compilerMessages);
    }
  });

  // Every assertion below about what a report does *not* contain is satisfied
  // for free by a sibling specifier that resolved to nothing at all: an
  // unresolved import has no shape to leak and no symbol to forget. So the
  // resolution itself is asserted first — without this, dropping the sibling
  // path mappings entirely leaves this whole suite green.
  it.each(['hell-ui/narrow', 'hell-ui/core', 'hell-ui/internal/core'])(
    'resolves every sibling specifier while extracting %s',
    (specifier) => {
      expect(compilerMessages.get(specifier)).toEqual([]);
    },
  );

  it('does not externalize an internal sibling that carries no report', () => {
    expect(mirroredDeclarations.has('hell-ui/internal/excluded')).toBe(false);
  });

  describe('the narrow entrypoint report', () => {
    it('keeps the shared core contract an external entrypoint import', () => {
      expect(reports.get('hell-ui/narrow')).toMatch(/from 'hell-ui\/core'/);
    });

    it('keeps the guarded internal contract an explicit entrypoint import', () => {
      expect(reports.get('hell-ui/narrow')).toMatch(/from 'hell-ui\/internal\/core'/);
    });

    it('does not report guarded sibling contracts as forgotten exports', () => {
      expect(reports.get('hell-ui/narrow')).not.toMatch(
        /symbol "(?:SharedCoreContract|InternalStableContract)" needs to be exported/,
      );
    });

    it('does not leak Angular declarations reached only through a sibling contract', () => {
      expect(reports.get('hell-ui/narrow')).not.toMatch(/\bWritableSignal\b/);
    });

    it('still reports a declaration local to this entrypoint', () => {
      expect(reports.get('hell-ui/narrow')).toMatch(
        /symbol "ModuleLocalLeak" needs to be exported/,
      );
    });

    it('still reports a contract reached through an unguarded internal sibling', () => {
      expect(reports.get('hell-ui/narrow')).toMatch(
        /symbol "ExcludedInternalContract" needs to be exported/,
      );
    });
  });

  describe("the guarded internal sibling's own baseline", () => {
    it('retains its stable shape', () => {
      expect(reports.get('hell-ui/internal/core')).toMatch(
        /export interface InternalStableContract/,
      );
    });

    it('still reports a declaration local to it', () => {
      expect(reports.get('hell-ui/internal/core')).toMatch(
        /symbol "InternalModuleLeak" needs to be exported/,
      );
    });
  });
});

function extractFixtureReport({
  entrypoint,
  reportEntrypoints,
  mirroredDeclarations,
  localSiblingPaths = {},
}) {
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

  const compilerMessages = [];
  const result = Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: false,
    messageCallback(message) {
      // TypeScript's own diagnostics, so an unresolved sibling specifier is
      // visible as the resolution failure it is rather than as a report that
      // happens to mention no leaked types.
      if (message.category === ExtractorMessageCategory.Compiler) {
        compilerMessages.push(message.text);
      }
      if (fixtureConsoleMessages.has(message.messageId)) message.handled = true;
    },
  });
  expect(result.succeeded, `extraction of ${entrypoint.specifier} should succeed`).toBe(true);

  return {
    report: readFileSync(join(outputFolder, entrypoint.reportFileName), 'utf8'),
    compilerMessages,
  };
}

function toTsconfigPath(path) {
  return relative(root, path).split(sep).join('/');
}
