import { describe, expect, it } from 'vitest';

import { STAMP_VERSION, describeForeignDocsBuild, workspaceId } from './docs-build-stamp.mjs';

/**
 * Synthetic stamps against a synthetic root, so every reason the served docs
 * build cannot stand in for this checkout is reachable without a second
 * worktree's dev server holding the port.
 */

const root = '/repo';
const currentDigest = 'digest-a';
const served = {
  version: STAMP_VERSION,
  workspaceId: workspaceId(root),
  sourcesDigest: currentDigest,
};

describe('describeForeignDocsBuild', () => {
  it('passes a stamp from this checkout at these sources', () => {
    expect(describeForeignDocsBuild({ root, currentDigest, stamp: served })).toEqual([]);
  });

  it('names a stale process holding the port as such', () => {
    // Fixed by killing it, not by rebuilding, so it must not be reported as an
    // unidentifiable build.
    expect(
      describeForeignDocsBuild({ root, currentDigest, stamp: null, serverAnswersPages: false })[0],
    ).toMatch(/stale or broken process holding the port/);
  });

  it.each([
    ['an unidentifiable server', null, /did not serve/],
    ['an old stamp format', { ...served, version: STAMP_VERSION + 1 }, /stamp format/],
    [
      // `served` carries the *matching* digest, so this row is also the case
      // where a foreign checkout's sources happen to agree: identity outranks
      // the digest, because the served pages still come from somewhere else.
      // And the other checkout is identified by digest, never named — this
      // stamp is published with the docs site, so its path must not be.
      'another checkout, identified without naming a path',
      { ...served, workspaceId: 'ffffffffffffffff' },
      /different checkout \(ffffffffffffffff/,
    ],
    ['an older build', { ...served, sourcesDigest: 'digest-b' }, /different sources/],
  ])('fails %s', (_case, stamp, expected) => {
    const failures = describeForeignDocsBuild({ root, currentDigest, stamp });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(expected);
  });
});
