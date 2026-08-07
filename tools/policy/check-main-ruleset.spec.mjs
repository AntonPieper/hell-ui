import { describe, expect, it } from 'vitest';

import { parseRulesetArgs } from './check-main-ruleset.mjs';

/**
 * The ruleset check's argv decision. Everything else in that file reads
 * committed workflows or the GitHub API, so this is the part a repository test
 * can reach — and it is the part that decides whether the command runs at all,
 * and whether it runs the remote half.
 *
 * Importing the module is safe because the command body sits behind an
 * entry-point guard: nothing here reads a workflow or invokes `gh`.
 */

describe('parseRulesetArgs', () => {
  // pnpm forwards a `--` separator into argv instead of consuming it, so the
  // spelling a maintainer reaches for from the sibling `pnpm restore:release --
  // <tag>` has to arrive at the same decision as the bare one. Before the
  // separator was dropped, this invocation printed usage and exited 2.
  it('skips the API evidence when --local follows the separator pnpm forwards', () => {
    expect(parseRulesetArgs(['--', '--local'])).toEqual({ localOnly: true, unknownArgs: [] });
  });

  it('skips the API evidence on the bare invocation without a separator', () => {
    expect(parseRulesetArgs(['--local'])).toEqual({ localOnly: true, unknownArgs: [] });
  });

  // The documented full spelling, with and without the separator: a maintainer
  // who types `--` and nothing else must get the run that gathers API evidence,
  // not a usage error.
  it('gathers API evidence when only the separator is given', () => {
    expect(parseRulesetArgs(['--'])).toEqual({ localOnly: false, unknownArgs: [] });
  });

  it('gathers API evidence when no arguments are given', () => {
    expect(parseRulesetArgs([])).toEqual({ localOnly: false, unknownArgs: [] });
  });

  // Dropping the separator must not also swallow a real mistake. A misspelled
  // flag has to reach the usage check rather than being read as a full remote
  // run, whether or not a separator precedes it.
  it('keeps an unknown argument so a typo still refuses', () => {
    expect(parseRulesetArgs(['--lokal'])).toEqual({ localOnly: false, unknownArgs: ['--lokal'] });
  });

  it('keeps an unknown argument that follows the separator', () => {
    expect(parseRulesetArgs(['--', '--lokal', '--local'])).toEqual({
      localOnly: true,
      unknownArgs: ['--lokal'],
    });
  });
});
