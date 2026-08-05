import { describe, expect, it } from 'vitest';

import { parsePrepareArgs } from './release-prepare.mjs';

/**
 * The Release Preparation command's argv decision. Everything else in that file
 * generates release artifacts in the working tree, so this is the only part a
 * repository test can reach — and it is the part that decides whether the
 * command runs at all, and whether it runs on an explicit version or selects one
 * from the pending Change Fragments.
 *
 * Importing the module is safe because the command body sits behind an
 * entry-point guard: nothing here resolves changie or writes an artifact.
 */

describe('parsePrepareArgs', () => {
  // pnpm forwards a `--` separator into argv instead of consuming it, and this
  // command takes a positional, so the separator is the spelling a maintainer
  // reaches for — it is what the sibling `pnpm restore:release -- <tag>` needs.
  // Before the separator was dropped, the version counted as a second argument
  // and this invocation printed usage and exited 2.
  it('takes the version that follows the separator pnpm forwards', () => {
    expect(parsePrepareArgs(['--', '1.2.3'])).toEqual({
      explicitVersion: '1.2.3',
      unknownArgs: [],
    });
  });

  it('takes the version on the bare invocation without a separator', () => {
    expect(parsePrepareArgs(['1.2.3'])).toEqual({ explicitVersion: '1.2.3', unknownArgs: [] });
  });

  // The automatic-selection spelling, with and without the separator. A lone
  // `--` refused before this fix, because it starts with a dash.
  it('selects the version automatically when only the separator is given', () => {
    expect(parsePrepareArgs(['--'])).toEqual({ explicitVersion: null, unknownArgs: [] });
  });

  it('selects the version automatically when no arguments are given', () => {
    expect(parsePrepareArgs([])).toEqual({ explicitVersion: null, unknownArgs: [] });
  });

  // Dropping the separator must not also swallow a real mistake. This command
  // takes no flags, so anything else starting with a dash has to reach the usage
  // check: read as automatic selection instead, a typo would prepare a release
  // the maintainer never asked for.
  it('keeps a flag-shaped argument so a typo still refuses', () => {
    expect(parsePrepareArgs(['--1.2.3'])).toEqual({
      explicitVersion: null,
      unknownArgs: ['--1.2.3'],
    });
  });

  it('keeps a flag-shaped argument that follows the separator', () => {
    expect(parsePrepareArgs(['--', '-1.2.3'])).toEqual({
      explicitVersion: null,
      unknownArgs: ['-1.2.3'],
    });
  });

  // One version or none: a second positional is ambiguous about which release is
  // being prepared, so it refuses rather than silently taking the first.
  it('refuses a second version rather than taking the first', () => {
    expect(parsePrepareArgs(['--', '1.2.3', '4.5.6'])).toEqual({
      explicitVersion: null,
      unknownArgs: ['4.5.6'],
    });
  });
});
