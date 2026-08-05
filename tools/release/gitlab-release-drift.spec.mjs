import { describe, expect, it } from 'vitest';

import {
  auditRelease,
  parseRestoreArgs,
  planRestoration,
  unreleasedReleaseTags,
} from './gitlab-release-drift.mjs';
import { planRelease, publishedPackageName } from './gitlab-release-projection.mjs';

/**
 * Synthetic captured API objects, so every drift decision the daily sweep
 * makes is reachable without a schedule, a token, or a live release. The
 * sweep's audit and the maintainer's restoration command are thin CLI shells
 * over these functions; what is proven here is what they decide.
 */

const version = '0.3.0';
const commit = 'a'.repeat(40);
const notes = `## [${version}] - 2026-08-01\n\nRelease notes body.\n`;
const projectUrl = 'https://example.invalid/group/project';
const packageId = 7;
const assetUrl = `${projectUrl}/-/packages/${packageId}`;

const packages = [
  { id: packageId, package_type: 'npm', name: publishedPackageName, version, status: 'default' },
];

const tag = (overrides = {}) => ({ name: `v${version}`, commit: { id: commit }, ...overrides });

const release = (overrides = {}) => ({
  tag_name: `v${version}`,
  name: `v${version}`,
  description: notes,
  commit: { id: commit },
  assets: {
    links: [
      {
        id: 41,
        name: `${publishedPackageName}@${version}`,
        url: assetUrl,
        link_type: 'package',
      },
    ],
  },
  ...overrides,
});

const audit = (overrides = {}) =>
  auditRelease({
    release: release(),
    tag: tag(),
    record: notes,
    packages,
    projectUrl,
    ...overrides,
  });

describe('auditRelease', () => {
  it('passes a release that exactly projects its tagged record', () => {
    expect(audit()).toEqual({ failures: [] });
  });

  it.each([
    [
      'a release on a tag that is not a release tag',
      { release: release({ tag_name: 'release-1' }), tag: tag({ name: 'release-1' }) },
      /not a v-prefixed SemVer release tag/,
    ],
    [
      'a release on a reserved dry-run tag',
      {
        release: release({ tag_name: `v${version}-dryrun.1` }),
        tag: tag({ name: `v${version}-dryrun.1` }),
      },
      /dry run never creates a release/,
    ],
    ['a release whose tag is gone', { tag: null }, /no longer exists/],
    ['a release whose tagged record is gone', { record: null }, /\.changes\/0\.3\.0\.md/],
    [
      'a release left behind by a moved tag',
      { release: release({ commit: { id: 'b'.repeat(40) } }) },
      /not the audited release commit/,
    ],
    [
      'a perturbed description',
      { release: release({ description: `${notes}\nEdited in the UI.` }) },
      /byte-for-byte/,
    ],
    ['a retitled release', { release: release({ name: 'Release 0.3.0' }) }, /release title/],
    [
      'a release whose published package is gone',
      { packages: [] },
      /no longer holds an npm package/,
    ],
    [
      'an asset link pointing elsewhere',
      {
        release: release({
          assets: {
            links: [
              {
                id: 41,
                name: `${publishedPackageName}@${version}`,
                url: `${projectUrl}/-/packages/999`,
                link_type: 'package',
              },
            ],
          },
        }),
      },
      /points at/,
    ],
  ])('fails %s', (_case, overrides, expected) => {
    const { failures } = audit(overrides);
    expect(failures.length).toBeGreaterThanOrEqual(1);
    expect(failures.some((failure) => expected.test(failure))).toBe(true);
  });

  it('reports every drifted field of one release, not just the first', () => {
    const { failures } = audit({
      release: release({ name: 'other', description: 'x', assets: { links: [] } }),
    });
    expect(failures.length).toBeGreaterThanOrEqual(3);
  });
});

describe('planRestoration', () => {
  const expected = () =>
    planRelease({ tagName: `v${version}`, commit, manifestVersion: version, notesBody: notes })
      .expected;

  it('plans nothing for an exact release', () => {
    expect(planRestoration({ expected: expected(), release: release(), assetUrl })).toEqual({
      failures: [],
      plan: { update: null, deleteLinkIds: [], createLink: null },
    });
  });

  it('restores a perturbed title and description to the exact tagged bytes', () => {
    const { failures, plan } = planRestoration({
      expected: expected(),
      release: release({ name: 'Release 0.3.0', description: `${notes}\nEdited.` }),
      assetUrl,
    });
    expect(failures).toEqual([]);
    expect(plan.update).toEqual({ name: `v${version}`, description: notes });
    expect(plan.deleteLinkIds).toEqual([]);
    expect(plan.createLink).toBeNull();
  });

  it('replaces every wrong asset link with the one package link', () => {
    const { plan } = planRestoration({
      expected: expected(),
      release: release({
        assets: {
          links: [
            { id: 41, name: 'stray.tgz', url: 'https://example.invalid/stray', link_type: 'other' },
            { id: 42, name: 'second', url: 'https://example.invalid/second', link_type: 'package' },
          ],
        },
      }),
      assetUrl,
    });
    expect(plan.update).toBeNull();
    expect(plan.deleteLinkIds).toEqual([41, 42]);
    expect(plan.createLink).toEqual({
      name: `${publishedPackageName}@${version}`,
      url: assetUrl,
      link_type: 'package',
    });
  });

  it('keeps the one exact link while restoring the rest', () => {
    const { plan } = planRestoration({
      expected: expected(),
      release: release({
        description: 'drifted',
        assets: {
          links: [
            {
              id: 41,
              name: `${publishedPackageName}@${version}`,
              url: assetUrl,
              link_type: 'package',
            },
            { id: 42, name: 'stray', url: 'https://example.invalid/stray', link_type: 'other' },
          ],
        },
      }),
      assetUrl,
    });
    expect(plan.update).toEqual({ name: `v${version}`, description: notes });
    expect(plan.deleteLinkIds).toEqual([42]);
    expect(plan.createLink).toBeNull();
  });

  it('refuses a moved tag: commit drift is tag surgery, not a release edit', () => {
    const { failures, plan } = planRestoration({
      expected: expected(),
      release: release({ commit: { id: 'b'.repeat(40) } }),
      assetUrl,
    });
    expect(plan).toBeNull();
    expect(failures.some((failure) => /moved|commit/.test(failure))).toBe(true);
  });

  it('round-trips the sweep red path: perturb, plan, apply, audit green', () => {
    const perturbed = release({ description: `${notes}\nEdited in the UI.` });
    expect(audit({ release: perturbed }).failures).not.toEqual([]);

    const { plan } = planRestoration({ expected: expected(), release: perturbed, assetUrl });
    const restored = {
      ...perturbed,
      name: plan.update.name,
      description: plan.update.description,
    };
    expect(audit({ release: restored })).toEqual({ failures: [] });
  });
});

describe('unreleasedReleaseTags', () => {
  it('names v* release tags that carry no release, skipping dry-run and foreign tags', () => {
    const tags = [
      { name: 'v0.2.0' },
      { name: `v${version}` },
      { name: 'v0.4.0-dryrun.1' },
      { name: 'wip-anchor' },
    ];
    expect(unreleasedReleaseTags({ tags, releases: [release()] })).toEqual(['v0.2.0']);
  });

  it('is empty when every release tag has its release', () => {
    expect(unreleasedReleaseTags({ tags: [tag()], releases: [release()] })).toEqual([]);
  });
});

describe('parseRestoreArgs', () => {
  // The documented invocation is `pnpm restore:release -- <tag>`, and pnpm
  // forwards that separator into argv instead of consuming it. Every spelling
  // the docs and this tool's own error messages tell a maintainer to type has
  // to reach the same decision.
  it('accepts the documented invocation, whose -- separator pnpm forwards', () => {
    expect(parseRestoreArgs(['--', `v${version}`])).toEqual({
      apply: false,
      positional: [`v${version}`],
    });
  });

  it('accepts --apply after the forwarded separator', () => {
    expect(parseRestoreArgs(['--', `v${version}`, '--apply'])).toEqual({
      apply: true,
      positional: [`v${version}`],
    });
  });

  it('accepts the bare invocation without a separator', () => {
    expect(parseRestoreArgs([`v${version}`, '--apply'])).toEqual({
      apply: true,
      positional: [`v${version}`],
    });
  });

  // Dropping the separator must not also swallow a real mistake: two tags is
  // still ambiguous, and no tag is still a usage error.
  it('keeps a second positional so an ambiguous invocation still refuses', () => {
    expect(parseRestoreArgs(['--', `v${version}`, 'v0.4.0']).positional).toEqual([
      `v${version}`,
      'v0.4.0',
    ]);
  });

  it('leaves no positional when only the separator is given', () => {
    expect(parseRestoreArgs(['--']).positional).toEqual([]);
  });
});
