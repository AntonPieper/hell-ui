import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';
import ts from 'typescript';

/**
 * Sort the members of every union type before the report is generated.
 *
 * The compiler does not print an inferred union in source order. It prints it
 * in the order the constituent types happened to be created, which follows what
 * else the program had already checked — so `'line' | 'grip'` in source emits as
 * `"grip" | "line"` whenever some earlier declaration created `'grip'` first.
 * `HellResizableHandlePart` does exactly that 420 lines above the member, and
 * `hell-ui-resizable.api.md` has recorded the reversed order all along.
 *
 * That makes the order a fact about compilation, not about the API. Adding a
 * private, unexported alias elsewhere in a file reorders an exported member and
 * fails this gate with no public change at all; six exported members already
 * print reversed today, and 33 have two or more constituents whose order the
 * compiler chooses.
 *
 * Sorting loses nothing a consumer can observe. `A | B` and `B | A` are the same
 * type, and TypeScript re-normalises union order when it reads a declaration, so
 * the printed order never reaches consumer behaviour. Adding, removing or
 * changing a member still shows up, because that changes the set, not the order.
 *
 * The alternatives were measured and rejected. `stableTypeOrdering` in
 * TypeScript 6.0.3 does not affect this printing — with the flag on,
 * `appearance` still emits `"grip" | "line"` — and naming all 33 unions would
 * mint 33 public exports to work around a compiler artifact.
 */
function canonicaliseUnionOrder(declarationText) {
  const source = ts.createSourceFile(
    'staged.d.ts',
    declarationText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  /** Union nodes under `node` that no other union under `node` already contains. */
  function outermostUnions(node) {
    const found = [];
    node.forEachChild(function walk(child) {
      if (ts.isUnionTypeNode(child)) found.push(child);
      else child.forEachChild(walk);
    });
    return found;
  }

  // Rebuilt from the original text, so everything that is not a union — spacing,
  // comments, parentheses, generics — survives byte for byte.
  function render(node) {
    if (ts.isUnionTypeNode(node)) {
      return node.types
        .map(render)
        .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
        .join(' | ');
    }
    let text = '';
    let cursor = node.getStart(source);
    for (const union of outermostUnions(node)) {
      text += source.text.slice(cursor, union.getStart(source));
      text += render(union);
      cursor = union.getEnd();
    }
    return text + source.text.slice(cursor, node.getEnd());
  }

  let output = '';
  let cursor = 0;
  for (const union of outermostUnions(source)) {
    output += source.text.slice(cursor, union.getStart(source));
    output += render(union);
    cursor = union.getEnd();
  }
  return output + source.text.slice(cursor);
}

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
  return canonicaliseUnionOrder(normalized.join('\n'));
}

function checkUnionOrderFixture() {
  const sorted = canonicaliseUnionOrder(
    'export declare const a: "grip" | "line";\nexport declare const b: "line" | "grip";\n',
  );
  assert.match(sorted, /const a: "grip" \| "line";/, 'a union is emitted in sorted order');
  assert.match(
    sorted,
    /const b: "grip" \| "line";/,
    'and the reverse spelling of the same union becomes identical text',
  );

  // Nested unions sort independently, and the surrounding syntax is untouched.
  assert.equal(
    canonicaliseUnionOrder('type T = Map<"z" | "a", ("q" | "b")[]> | null;'),
    'type T = Map<"a" | "z", ("b" | "q")[]> | null;',
    'nested unions are sorted without disturbing the syntax around them',
  );

  // A pipe inside a string literal or a template must not be mistaken for a
  // union separator, which is why this parses rather than splitting text.
  const literal = 'export declare const c: "a|b" | "a";';
  assert.equal(
    canonicaliseUnionOrder(literal),
    'export declare const c: "a" | "a|b";',
    'a pipe inside a literal is not a separator',
  );

  // Function types carry their own parameter lists; sorting must not reach into
  // them or reorder anything that is not a union constituent.
  assert.equal(
    canonicaliseUnionOrder('type F = ((row: A, b: B) => void) | string | null;'),
    'type F = ((row: A, b: B) => void) | null | string;',
    'function-type constituents keep their internals and sort as a whole',
  );

  // The set still matters: adding a member is still a change.
  assert.notEqual(
    canonicaliseUnionOrder('type U = "a" | "b";'),
    canonicaliseUnionOrder('type U = "a" | "b" | "c";'),
    'sorting must not hide a member appearing or disappearing',
  );

  assert.equal(
    canonicaliseUnionOrder('export declare const d: string;\n'),
    'export declare const d: string;\n',
    'a declaration with no union is returned unchanged',
  );
}

/** Self-check with a synthetic declaration; runs before the real gate. */
export function checkApiReportInputPackageFixture() {
  checkUnionOrderFixture();
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
