import { describe, expect, it } from 'vitest';

import { parseJsonc } from './check-architecture.mjs';

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
