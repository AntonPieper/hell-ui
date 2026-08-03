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
      // Identified by digest, never named: this stamp is published with the
      // docs site, so the other checkout's path must not be.
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

  it('reports a foreign checkout even when its sources happen to match', () => {
    // The served pages still come from somewhere else, so checkout identity
    // outranks a matching digest.
    expect(
      describeForeignDocsBuild({
        root,
        currentDigest,
        stamp: { ...served, workspaceId: 'ffffffffffffffff' },
      })[0],
    ).toMatch(/different checkout/);
  });
});
