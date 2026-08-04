import { describe, expect, it } from 'vitest';

import { STAMP_VERSION, classifyLibraryBuildStamp } from './library-build-stamp.mjs';

/**
 * Synthetic stamps, so every reason a prepared `dist/hell` cannot stand in for
 * the working tree is reachable without arranging the build that produces it —
 * an interrupted build, a `pnpm run watch` session, a branch switch.
 */
const current = {
  expectedConfiguration: 'production',
  currentDigest: 'digest-a',
  currentOutputDigest: 'output-a',
};

const fresh = {
  version: STAMP_VERSION,
  configuration: 'production',
  declarationInputsDigest: 'digest-a',
  outputDigest: 'output-a',
};

describe('classifyLibraryBuildStamp', () => {
  it('passes a stamp matching the configuration and the working tree', () => {
    expect(classifyLibraryBuildStamp({ ...current, stamp: fresh })).toEqual([]);
  });

  it.each([
    ['an unstamped dist', null, /no build stamp/],
    ['an unknown stamp format', { ...fresh, version: STAMP_VERSION + 1 }, /stamp format/],
    ['another configuration', { ...fresh, configuration: 'development' }, /'development'/],
    [
      'other sources',
      { ...fresh, declarationInputsDigest: 'digest-b' },
      /different library sources/,
    ],
    // Matching sources with different output is the watch-overwrite case: the
    // build started from this tree, then something else rewrote dist.
    [
      'a rewritten dist, even when its sources match',
      { ...fresh, outputDigest: 'output-b' },
      /has changed since the build that stamped it/,
    ],
  ])('fails %s', (_case, stamp, expected) => {
    const failures = classifyLibraryBuildStamp({ ...current, stamp });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(expected);
    // Every failure must name the fix, or it sends the reader looking for an
    // API change that no source change caused.
    expect(failures[0]).toMatch(/pnpm run build:lib/);
  });

  it('ignores the build timestamp, so two builds of one tree agree', () => {
    // The digest must describe content, not the moment of the build.
    expect(
      classifyLibraryBuildStamp({ ...current, stamp: { ...fresh, builtAt: 'much later' } }),
    ).toEqual([]);
  });
});
