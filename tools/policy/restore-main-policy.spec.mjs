import { describe, expect, it } from 'vitest';

import { parseRestoreArgs } from './restore-main-policy.mjs';

/**
 * The restoration command's argv decision. Everything else in that file writes
 * to a live project, so this is the only part a repository test can reach — and
 * it is the part that decides whether the command runs at all.
 *
 * Importing the module is safe because the command body sits behind an
 * entry-point guard: nothing here resolves a project, reads a token, or talks
 * to a server.
 */

describe('parseRestoreArgs', () => {
  // pnpm forwards a `--` separator into argv instead of consuming it, so the
  // spelling a maintainer reaches for from the sibling `pnpm restore:release --
  // <tag>` has to arrive at the same decision as the bare one. Before the
  // separator was dropped, this invocation failed the usage check.
  it('applies when --apply follows the separator pnpm forwards', () => {
    expect(parseRestoreArgs(['--', '--apply'])).toEqual({ apply: true, unknownArgs: [] });
  });

  it('applies on the bare invocation without a separator', () => {
    expect(parseRestoreArgs(['--apply'])).toEqual({ apply: true, unknownArgs: [] });
  });

  // The documented plan-only spelling, with and without the separator: a
  // maintainer who types `--` and nothing else must still get a plan, not a
  // usage error, and must not get a write.
  it('plans without writing when only the separator is given', () => {
    expect(parseRestoreArgs(['--'])).toEqual({ apply: false, unknownArgs: [] });
  });

  it('plans without writing when no arguments are given', () => {
    expect(parseRestoreArgs([])).toEqual({ apply: false, unknownArgs: [] });
  });

  // Dropping the separator must not also swallow a real mistake. A misspelled
  // flag has to reach the usage check rather than being read as a plan-only
  // run, whether or not a separator precedes it.
  it('keeps an unknown argument so a typo still refuses', () => {
    expect(parseRestoreArgs(['--aply'])).toEqual({ apply: false, unknownArgs: ['--aply'] });
  });

  it('keeps an unknown argument that follows the separator', () => {
    expect(parseRestoreArgs(['--', '--dry-run', '--apply'])).toEqual({
      apply: true,
      unknownArgs: ['--dry-run'],
    });
  });
});
