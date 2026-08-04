import { describe, expect, it } from 'vitest';

import { canonicaliseUnionOrder, normalizeApiReportDeclarations } from './api-report-model.mjs';

describe('canonicaliseUnionOrder', () => {
  it('emits both spellings of one union as identical text', () => {
    const sorted = canonicaliseUnionOrder(
      'export declare const a: "grip" | "line";\nexport declare const b: "line" | "grip";\n',
    );

    expect(sorted).toMatch(/const a: "grip" \| "line";/);
    expect(sorted).toMatch(/const b: "grip" \| "line";/);
  });

  it('sorts nested unions without disturbing the syntax around them', () => {
    expect(canonicaliseUnionOrder('type T = Map<"z" | "a", ("q" | "b")[]> | null;')).toBe(
      'type T = Map<"a" | "z", ("b" | "q")[]> | null;',
    );
  });

  it('does not mistake a pipe inside a literal for a separator', () => {
    // Which is why this parses rather than splitting text.
    expect(canonicaliseUnionOrder('export declare const c: "a|b" | "a";')).toBe(
      'export declare const c: "a" | "a|b";',
    );
  });

  it('sorts a function-type constituent as a whole, keeping its internals', () => {
    // Function types carry their own parameter lists; sorting must not reach
    // into them or reorder anything that is not a union constituent.
    expect(canonicaliseUnionOrder('type F = ((row: A, b: B) => void) | string | null;')).toBe(
      'type F = ((row: A, b: B) => void) | null | string;',
    );
  });

  it('still distinguishes a union whose member set changed', () => {
    // The set is what the report is for: sorting must not hide a member
    // appearing or disappearing.
    expect(canonicaliseUnionOrder('type U = "a" | "b";')).not.toBe(
      canonicaliseUnionOrder('type U = "a" | "b" | "c";'),
    );
  });

  it('returns a declaration with no union unchanged', () => {
    expect(canonicaliseUnionOrder('export declare const d: string;\n')).toBe(
      'export declare const d: string;\n',
    );
  });

  it('leaves a constrained infer in place, and keeps the two spellings apart', () => {
    // `infer U extends X` takes its constraint to the end of the union, so
    // moving it changes the parse: `zed | infer U extends string` and
    // `infer U extends string | zed` are different types. Sorting would render
    // both identically and hide a change between them.
    const inferLast = 'export type T<X> = X extends zed | infer U extends string ? U : never;\n';
    const inferFirst = 'export type T<X> = X extends infer U extends string | zed ? U : never;\n';

    expect(canonicaliseUnionOrder(inferLast)).toBe(inferLast);
    expect(canonicaliseUnionOrder(inferLast)).not.toBe(canonicaliseUnionOrder(inferFirst));
  });

  it('still sorts an unconstrained infer, which has nothing greedy to absorb', () => {
    expect(canonicaliseUnionOrder('export type Q<X> = X extends zed | infer U ? U : never;\n')).toBe(
      'export type Q<X> = X extends infer U | zed ? U : never;\n',
    );
  });
});

describe('normalizeApiReportDeclarations', () => {
  const declarations = [
    'export declare class Fixture {',
    '    static ɵfac: i0.ɵɵFactoryDeclaration<Fixture, never>;',
    '    /** Documented already. */',
    '    static ɵcmp: i0.ɵɵComponentDeclaration<Fixture, "fixture", never, {}, {}, never>;',
    '}',
    '//# sourceMappingURL=fixture.d.ts.map',
    '',
  ].join('\n');

  it('strips the declaration map reference', () => {
    // It would redirect every reported location to an absolute source path on
    // the machine that produced the build.
    expect(normalizeApiReportDeclarations(declarations)).not.toMatch(/sourceMappingURL/);
  });

  it('annotates only the undocumented compiler-generated static', () => {
    const normalized = normalizeApiReportDeclarations(declarations);

    expect(
      normalized.split('\n').filter((line) => line.includes('compiler-generated')),
    ).toHaveLength(1);
  });

  it('is idempotent, so a re-staged declaration reports the same surface', () => {
    const normalized = normalizeApiReportDeclarations(declarations);

    expect(normalizeApiReportDeclarations(normalized)).toBe(normalized);
  });
});
