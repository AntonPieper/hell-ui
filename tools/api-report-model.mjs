import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

/**
 * Stage the built declarations as a self-contained package for API Extractor.
 *
 * Extraction reads this staging folder instead of `dist/hell` for two reasons.
 * The report must describe the shipped declarations and nothing else: a `dist`
 * carrying declaration maps (any non-production configuration) makes API
 * Extractor resolve every message location back through `.d.ts.map` to an
 * absolute path on the machine that built it, which rewrites the whole report.
 * And the extractor's input must not be the extractor's output: annotating
 * compiler-generated statics in place edited `dist`, so a packed tarball
 * differed depending on whether the report gate had run first.
 *
 * The staged folder mirrors the package layout (`package.json` beside
 * `types/`), so API Extractor reports the same package-relative locations it
 * reported from `dist`.
 */
export function createApiReportInputPackage({
  stageFolder,
  packageJsonFullPath,
  declarationFilePaths,
}) {
  rmSync(stageFolder, { recursive: true, force: true });
  const typesFolder = join(stageFolder, 'types');
  mkdirSync(typesFolder, { recursive: true });

  const stagedPackageJsonFullPath = join(stageFolder, 'package.json');
  copyFileSync(packageJsonFullPath, stagedPackageJsonFullPath);

  const stagedDeclarations = new Map();
  for (const declarationFilePath of declarationFilePaths) {
    const stagedPath = join(typesFolder, basename(declarationFilePath));
    writeFileSync(
      stagedPath,
      normalizeApiReportDeclarations(readFileSync(declarationFilePath, 'utf8')),
    );
    stagedDeclarations.set(declarationFilePath, stagedPath);
  }

  return { packageJsonFullPath: stagedPackageJsonFullPath, stagedDeclarations };
}

// The Angular compiler emits ɵfac/ɵdir/ɵcmp/... and ngAcceptInputType_...
// static declarations into the built d.ts with no way to attach TSDoc in
// source, so API Extractor flags every one as ae-undocumented. Annotate them
// (idempotent) so reports only flag documentation gaps authors can fix.
const COMPILER_GENERATED_STATIC =
  /^([ \t]*)(static (?:ɵ(?:fac|dir|cmp|prov|mod|inj|pipe)|ngAcceptInputType_\w+):)/;

function normalizeApiReportDeclarations(declarationText) {
  const normalized = [];
  for (const line of declarationText.split('\n')) {
    // A declaration map would redirect every reported location to the absolute
    // source path of the machine that produced the build.
    if (line.startsWith('//# sourceMappingURL=')) continue;
    const previous = normalized[normalized.length - 1];
    if (COMPILER_GENERATED_STATIC.test(line) && !previous?.trimEnd().endsWith('*/')) {
      normalized.push(
        `${COMPILER_GENERATED_STATIC.exec(line)[1]}/** Angular compiler-generated declaration. */`,
      );
    }
    normalized.push(line);
  }
  return normalized.join('\n');
}

/** Self-check with a synthetic declaration; runs before the real gate. */
export function checkApiReportInputPackageFixture() {
  const declarations = [
    'export declare class Fixture {',
    '    static ɵfac: i0.ɵɵFactoryDeclaration<Fixture, never>;',
    '    /** Documented already. */',
    '    static ɵcmp: i0.ɵɵComponentDeclaration<Fixture, "fixture", never, {}, {}, never>;',
    '}',
    '//# sourceMappingURL=fixture.d.ts.map',
    '',
  ].join('\n');

  const normalized = normalizeApiReportDeclarations(declarations);
  assert.doesNotMatch(
    normalized,
    /sourceMappingURL/,
    'a declaration map reference must never survive into the extractor input',
  );
  assert.equal(
    normalized.split('\n').filter((line) => line.includes('compiler-generated')).length,
    1,
    'only the undocumented compiler-generated static gets an annotation',
  );
  assert.equal(
    normalizeApiReportDeclarations(normalized),
    normalized,
    'normalization must be idempotent, so a re-staged declaration reports the same surface',
  );
}

/**
 * Copy report-guarded declarations beneath a synthetic node_modules package.
 * API Extractor then models guarded sibling entrypoints as external package
 * contracts instead of following them as part of the current working package.
 * Callers must not mirror an entrypoint without a corresponding API baseline.
 */
export function createApiReportDeclarationMirror({
  mirrorFolder,
  packageName,
  packageJsonFullPath,
  entrypoints,
}) {
  rmSync(mirrorFolder, { recursive: true, force: true });

  const packageFolder = join(mirrorFolder, 'node_modules', ...packageName.split('/'));
  const typesFolder = join(packageFolder, 'types');
  mkdirSync(typesFolder, { recursive: true });
  copyFileSync(packageJsonFullPath, join(packageFolder, 'package.json'));

  return new Map(
    entrypoints.map((entrypoint) => {
      const mirroredDeclarationPath = join(typesFolder, basename(entrypoint.declarationFilePath));
      copyFileSync(entrypoint.declarationFilePath, mirroredDeclarationPath);
      return [entrypoint.specifier, mirroredDeclarationPath];
    }),
  );
}

/** Exact mappings prevent package self-resolution from pulling sibling declarations local. */
export function apiReportSiblingPaths({
  baseUrl,
  currentSpecifier,
  entrypoints,
  mirroredDeclarations,
}) {
  return Object.fromEntries(
    entrypoints
      .filter((entrypoint) => entrypoint.specifier !== currentSpecifier)
      .map((entrypoint) => [
        entrypoint.specifier,
        [toPosixPath(relative(baseUrl, mirroredDeclarations.get(entrypoint.specifier)))],
      ]),
  );
}

function toPosixPath(path) {
  return path.split(sep).join('/');
}
