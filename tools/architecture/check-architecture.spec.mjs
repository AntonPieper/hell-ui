import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { ngpAttrOwnershipSeamFailures, parseJsonc } from './check-architecture.mjs';

/**
 * The checker's one JSONC surface is the repository's tsconfig files, and its
 * parser is a hand-written scanner rather than a library. Its whole risk is
 * state confusion: text that looks like a comment but is inside a string, and a
 * quote that looks like a terminator but is escaped. A scanner that gets either
 * wrong does not fail loudly — it strips part of a real config and the checks
 * then pass over a tsconfig nobody wrote.
 */
describe('parseJsonc', () => {
  it('parses plain JSON unchanged', () => {
    expect(parseJsonc('{"compilerOptions":{"strict":true},"files":[]}')).toEqual({
      compilerOptions: { strict: true },
      files: [],
    });
  });

  it('strips a line comment, keeping the newline that ends it', () => {
    expect(
      parseJsonc(['{', '  // why this is set', '  "strict": true', '}'].join('\n')),
    ).toEqual({ strict: true });
  });

  it('strips a line comment on the same line as a value', () => {
    expect(parseJsonc('{"strict": true // trailing rationale\n}')).toEqual({ strict: true });
  });

  it('strips a block comment, including a multi-line one', () => {
    expect(parseJsonc('{/* first */ "a": 1, /*\n second\n*/ "b": 2}')).toEqual({ a: 1, b: 2 });
  });

  it('strips a block comment that contains comment openers of its own', () => {
    expect(parseJsonc('{/* // not a line comment /* not nested */ "a": 1}')).toEqual({ a: 1 });
  });

  it('keeps a comment opener that is inside a string value', () => {
    // The real case: tsconfig path globs like "./features/*/styles.css", and
    // any string containing `//` — a URL, a comment example.
    expect(
      parseJsonc('{"include": ["./features/*/styles.css", "https://example.test/schema"]}'),
    ).toEqual({ include: ['./features/*/styles.css', 'https://example.test/schema'] });
  });

  it('keeps a block-comment opener that is inside a string value', () => {
    expect(parseJsonc('{"a": "/* not a comment */"}')).toEqual({ a: '/* not a comment */' });
  });

  it('keeps an escaped quote inside a string rather than ending the string there', () => {
    // The comment opener sits *between* the escaped quotes deliberately. A
    // scanner that treated `\"` as a terminator would be back outside the
    // string exactly there, strip the rest of the line as a comment, and throw
    // on the truncated remainder. With the opener after both escaped quotes the
    // parity error cancels out and the mistake is invisible.
    expect(parseJsonc('{"a": "say \\"hi // there\\" twice"}')).toEqual({
      a: 'say "hi // there" twice',
    });
  });

  it('keeps a comment opener that follows a single escaped quote', () => {
    // One escaped quote is the smallest input where losing the escape state
    // flips the scanner from inside the string to outside it.
    expect(parseJsonc('{"a": "\\"// inside"}')).toEqual({ a: '"// inside' });
  });

  it('treats an escaped backslash as ending the escape, not starting one', () => {
    // `"\\"` is a one-character string, so the closing quote really does close
    // it. A scanner that swallowed the quote as escaped would run on into the
    // rest of the file.
    expect(parseJsonc('{"a": "\\\\", "b": 1}')).toEqual({ a: '\\', b: 1 });
  });

  it('keeps a comment opener that follows an escape inside a string', () => {
    expect(parseJsonc('{"a": "\\\\// still in the string"}')).toEqual({
      a: '\\// still in the string',
    });
  });

  it('throws on content that is not JSON once the comments are gone', () => {
    // The parser strips comments and hands the rest to JSON.parse, so a
    // malformed config fails loudly instead of being half-read.
    expect(() => parseJsonc('{"a": 1,}')).toThrow(SyntaxError);
  });
});

/**
 * The attr-ownership seam's correctness rests on invariants no behavior test
 * exercises on the happy path: the version pin, the mirrored controlStatus
 * trigger, and — above all — the status() read INSIDE the ownership callback,
 * which is what keeps Hell's writer waking on upstream-only status flushes.
 * Each test below mutates exactly one of those away from the real seam source
 * and expects the checker half to name it, so the guard is proven against the
 * file it actually protects rather than a synthetic fixture.
 */
describe('ngpAttrOwnershipSeamFailures', () => {
  const seamRelPath = 'packages/angular/internal/ng-primitives/ngp-attr-ownership.ts';
  const seamPath = new URL(
    '../../packages/angular/internal/ng-primitives/ngp-attr-ownership.ts',
    import.meta.url,
  );
  const seamSource = readFileSync(seamPath, 'utf8');
  const installedVersion = `ng-primitives@${
    JSON.parse(
      readFileSync(
        new URL('../../packages/angular/node_modules/ng-primitives/package.json', import.meta.url),
        'utf8',
      ),
    ).version
  }`;

  const check = (source) => ngpAttrOwnershipSeamFailures(source, installedVersion, seamRelPath);

  const mutate = (pattern, replacement = '') => {
    expect(seamSource).toMatch(pattern);
    return seamSource.replace(pattern, replacement);
  };

  it('accepts the real seam source', () => {
    expect(check(seamSource)).toEqual([]);
  });

  it('fails when the version constant drifts from the installed package', () => {
    const failures = check(
      seamSource.replace(/HELL_NGP_ATTR_OWNERSHIP_VERSION = '[^']+'/, (m) =>
        m.replace(/@.*'$/, "@0.0.0'"),
      ),
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('seam version must match installed');
  });

  it('fails when the controlStatus import is dropped', () => {
    const failures = check(
      mutate(/import \{ controlStatus \} from 'ng-primitives\/utils';\n/),
    );
    expect(failures.some((f) => f.includes('controlStatus from ng-primitives/utils'))).toBe(true);
  });

  it('fails when the mirrored trigger binding is removed', () => {
    const failures = check(mutate(/const status = controlStatus\(\);\n/));
    expect(failures.some((f) => f.includes('const status = controlStatus()'))).toBe(true);
  });

  it('fails when the status() read is mutated out of the ownership callback', () => {
    // The exact mutation the guard exists for: the import and binding survive,
    // the callback compiles and passes every happy-path behavior test, but the
    // effect is no longer dirtied by upstream-only status flushes.
    const failures = check(mutate(/^\s*status\(\);\n/m));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('must read status()');
  });

  it('fails when the write is no longer registered through hellOwnsNgpAttribute', () => {
    const failures = check(
      seamSource.replace(/hellOwnsNgpAttribute\(\(\) => \{/, 'queueMicrotask(() => {'),
    );
    expect(
      failures.some((f) => f.includes('hellOwnsNgpAttribute(() => { ... }) callback')),
    ).toBe(true);
  });

  it('fails when the helper itself is deleted without retiring the check', () => {
    const failures = check(
      seamSource.slice(0, seamSource.indexOf('export function hellOwnsControlAriaInvalid')),
    );
    expect(failures.some((f) => f.includes('must define hellOwnsControlAriaInvalid'))).toBe(true);
  });
});
