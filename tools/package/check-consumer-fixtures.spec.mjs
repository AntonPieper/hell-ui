import { describe, expect, it } from 'vitest';

import { parseFixtureArgs } from './check-consumer-fixtures.mjs';

/**
 * The consumer fixture runner's argv decision. Everything else in that file
 * packs the library and installs it into temp workspaces, so this is the part a
 * repository test can reach — and it is the part that decides whether the run
 * starts at all, which fixtures it covers, and whether it builds.
 *
 * Importing the module is safe because the run sits behind an entry-point guard:
 * nothing here packs, installs, or compiles.
 */

describe('parseFixtureArgs', () => {
  // pnpm forwards a `--` separator into argv instead of consuming it, so the
  // spelling a maintainer reaches for from the sibling `pnpm restore:release --
  // <tag>` has to arrive at the same decision as the bare one. Before the
  // separator was dropped, it counted as an unknown flag and the run refused.
  it('skips the build when --skip-build follows the separator pnpm forwards', () => {
    expect(parseFixtureArgs(['--', '--skip-build'])).toEqual({
      named: [],
      skipPackageBuild: true,
      batch: false,
      unknownFlags: [],
    });
  });

  it('skips the build on the bare invocation without a separator', () => {
    expect(parseFixtureArgs(['--skip-build'])).toEqual({
      named: [],
      skipPackageBuild: true,
      batch: false,
      unknownFlags: [],
    });
  });

  // Every fixture, built from source: the default run, with and without the
  // separator. A lone `--` refused before this fix.
  it('runs every fixture and builds when only the separator is given', () => {
    expect(parseFixtureArgs(['--'])).toEqual({
      named: [],
      skipPackageBuild: false,
      batch: false,
      unknownFlags: [],
    });
  });

  it('runs every fixture and builds when no arguments are given', () => {
    expect(parseFixtureArgs([])).toEqual({
      named: [],
      skipPackageBuild: false,
      batch: false,
      unknownFlags: [],
    });
  });

  // Dropping the separator must not also swallow a real mistake. A misspelled
  // flag has to keep refusing: ignored instead, a run asked to skip the build
  // did it anyway and only the wall time said so.
  it('keeps an unknown flag so a typo still refuses', () => {
    expect(parseFixtureArgs(['--skipbuild'])).toEqual({
      named: [],
      skipPackageBuild: false,
      batch: false,
      unknownFlags: ['--skipbuild'],
    });
  });

  it('keeps an unknown flag that follows the separator', () => {
    expect(parseFixtureArgs(['--', '--skipbuild', '--skip-build'])).toEqual({
      named: [],
      skipPackageBuild: true,
      batch: false,
      unknownFlags: ['--skipbuild'],
    });
  });

  // The separator must not be mistaken for a fixture name either: the named
  // fixtures are what the runner installs, so a stray `--` in that list would
  // fail the run on a fixture directory that cannot exist.
  it('keeps named fixtures and flags apart across the separator', () => {
    expect(parseFixtureArgs(['--', 'styles-aggregate', '--batch'])).toEqual({
      named: ['styles-aggregate'],
      skipPackageBuild: false,
      batch: true,
      unknownFlags: [],
    });
  });
});
