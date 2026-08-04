import { describe, expect, it } from 'vitest';

import {
  choosePublishedPackage,
  collectRuleLivenessErrors,
  decidePublishCommand,
  decideReleaseMode,
  normalizeRelease,
  npmrcAuthLine,
  packageRegistryUrl,
  packageWebUrl,
  planRelease,
  publishedPackageName,
  releaseTagVersion,
  rewritePackedManifest,
  verifyRelease,
} from './gitlab-release-projection.mjs';

/**
 * Synthetic captured metadata, so every publication decision the tag
 * pipeline makes is reachable without a tag, a registry, or a release. The
 * pipeline's jobs are thin CLI shells over these functions; what is proven
 * here is what the pipeline decides.
 */

const version = '0.3.0';
const commit = 'a'.repeat(40);
const notes = `## [${version}] - 2026-08-01\n\nRelease notes body.\n`;

const plan = () =>
  planRelease({ tagName: `v${version}`, commit, manifestVersion: version, notesBody: notes }).expected;

const assetUrl = 'https://example.invalid/project/-/packages/7';

const release = (overrides = {}) =>
  normalizeRelease({
    tag_name: `v${version}`,
    name: `v${version}`,
    description: notes,
    commit: { id: commit },
    assets: { links: [{ name: `${publishedPackageName}@${version}`, url: assetUrl, link_type: 'package' }] },
    ...overrides,
  });

describe('releaseTagVersion', () => {
  it('projects a v-prefixed SemVer tag onto its version', () => {
    expect(releaseTagVersion('v1.2.3')).toBe('1.2.3');
    expect(releaseTagVersion('v0.3.0-dryrun.1')).toBe('0.3.0-dryrun.1');
  });

  it.each([['1.2.3'], ['v1.2'], ['release-1'], [null]])('rejects %s', (tag) => {
    expect(releaseTagVersion(tag)).toBeNull();
  });
});

describe('decideReleaseMode', () => {
  it('publishes when the tag names the audited version exactly', () => {
    expect(decideReleaseMode({ tagName: `v${version}`, manifestVersion: version })).toEqual({
      failures: [],
      mode: 'publish',
      version,
    });
  });

  it('dry-runs when the tag carries the reserved suffix over the audited version', () => {
    expect(decideReleaseMode({ tagName: `v${version}-dryrun.2`, manifestVersion: version })).toEqual({
      failures: [],
      mode: 'dry-run',
      version,
    });
  });

  it('dry-runs a prerelease manifest version the same way', () => {
    const result = decideReleaseMode({
      tagName: 'v1.0.0-beta.1-dryrun.1',
      manifestVersion: '1.0.0-beta.1',
    });
    expect(result.mode).toBe('dry-run');
    expect(result.version).toBe('1.0.0-beta.1');
  });

  it.each([
    ['a tag naming another version', 'v0.9.9', version, /must match the audited package version/],
    ['a dry-run tag over another version', 'v0.9.9-dryrun.1', version, /Dry-run tag/],
    ['a tag that is not SemVer', 'v0.3', version, /not a v-prefixed SemVer release tag/],
    // `-dryrun.01` fails the reserved spelling, so it falls through to the
    // exact-version comparison and fails closed rather than dry-running.
    ['a malformed dry-run counter', `v${version}-dryrun.01`, version, /must match the audited package version/],
    ['a manifest version that is not SemVer', `v${version}`, 'next', /must be valid SemVer/],
    [
      'a manifest version carrying the reserved suffix',
      `v${version}-dryrun.1`,
      `${version}-dryrun.1`,
      /reserved -dryrun/,
    ],
  ])('fails %s', (_case, tagName, manifestVersion, expected) => {
    const result = decideReleaseMode({ tagName, manifestVersion });
    expect(result.mode).toBeNull();
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toMatch(expected);
  });
});

describe('planRelease', () => {
  it('derives the expected release from the tagged artifacts', () => {
    expect(plan()).toEqual({
      tagName: `v${version}`,
      title: `v${version}`,
      commit,
      body: notes,
      assetName: `${publishedPackageName}@${version}`,
    });
  });

  it.each([
    ['a tag disagreeing with the manifest', { tagName: 'v9.9.9' }, /must match the audited package version/],
    ['a short commit', { commit: 'abc123' }, /one full commit SHA/],
    ['missing notes', { notesBody: null }, /tagged Released Version Notes/],
    ['notes with a wrong header', { notesBody: '# Changelog\n' }, /must start with/],
  ])('fails %s', (_case, overrides, expected) => {
    const { failures, expected: planned } = planRelease({
      tagName: `v${version}`,
      commit,
      manifestVersion: version,
      notesBody: notes,
      ...overrides,
    });
    expect(planned).toBeNull();
    expect(failures.some((failure) => expected.test(failure))).toBe(true);
  });
});

describe('verifyRelease', () => {
  it('passes a release reproducing the plan exactly', () => {
    expect(verifyRelease({ expected: plan(), release: release(), assetUrl })).toEqual({ failures: [] });
  });

  it.each([
    ['a retitled release', { name: 'Release 0.3.0' }, /release title/],
    ['a moved tag', { commit: { id: 'b'.repeat(40) } }, /audited release commit/],
    ['an edited body', { description: `${notes}\nEdited.` }, /byte-for-byte.*first difference at line 5/],
    ['no asset link', { assets: { links: [] } }, /exactly one asset link/],
    [
      'a second asset link',
      {
        assets: {
          links: [
            { name: 'a', url: assetUrl, link_type: 'package' },
            { name: 'b', url: assetUrl, link_type: 'other' },
          ],
        },
      },
      /exactly one asset link/,
    ],
    [
      'a non-package link type',
      { assets: { links: [{ name: `${publishedPackageName}@${version}`, url: assetUrl, link_type: 'other' }] } },
      /link_type "package"/,
    ],
    [
      'a mis-named asset link',
      { assets: { links: [{ name: 'package.tgz', url: assetUrl, link_type: 'package' }] } },
      /asset link is named/,
    ],
    [
      'an asset link pointing elsewhere',
      {
        assets: {
          links: [
            { name: `${publishedPackageName}@${version}`, url: 'https://example.invalid/elsewhere', link_type: 'package' },
          ],
        },
      },
      /points at/,
    ],
  ])('fails %s', (_case, overrides, expected) => {
    const { failures } = verifyRelease({ expected: plan(), release: release(overrides), assetUrl });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(expected);
  });

  it('reports every field of a foreign release, not just the first', () => {
    const { failures } = verifyRelease({
      expected: plan(),
      release: normalizeRelease({ tag_name: 'v9.9.9', name: 'other', description: 'x', assets: { links: [] } }),
      assetUrl,
    });
    expect(failures.length).toBeGreaterThanOrEqual(4);
  });
});

describe('collectRuleLivenessErrors', () => {
  it('opens only on the affirmative protected-ref fact', () => {
    expect(collectRuleLivenessErrors({ refProtected: 'true' })).toEqual({ failures: [] });
  });

  it.each([['false'], [''], [undefined], ['TRUE']])('refuses %j and names the restoration command', (value) => {
    const { failures } = collectRuleLivenessErrors({ refProtected: value });
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(/v\* protected-tag rule/);
    expect(failures[0]).toMatch(/restore:main-policy/);
  });
});

describe('publication plumbing', () => {
  it('builds the registry endpoint and credential line from CI-provided values only', () => {
    const registry = packageRegistryUrl('https://example.invalid/api/v4', '32');
    expect(registry).toBe('https://example.invalid/api/v4/projects/32/packages/npm/');
    expect(npmrcAuthLine(registry, 'job-token')).toBe(
      '//example.invalid/api/v4/projects/32/packages/npm/:_authToken=job-token',
    );
  });

  it('rewrites only the published name and the publish target', () => {
    const packed = {
      name: 'hell-ui',
      version,
      publishConfig: { registry: 'https://registry.npmjs.org/', access: 'public', provenance: true },
      peerDependencies: { rxjs: '^7' },
    };
    const { failures, manifest } = rewritePackedManifest({
      manifest: packed,
      version,
      registryUrl: 'https://example.invalid/api/v4/projects/32/packages/npm/',
    });
    expect(failures).toEqual([]);
    expect(manifest.name).toBe(publishedPackageName);
    // The packed npmjs publishConfig must not survive: provenance and access
    // aim at the wrong registry.
    expect(manifest.publishConfig).toEqual({
      registry: 'https://example.invalid/api/v4/projects/32/packages/npm/',
    });
    expect(manifest.peerDependencies).toEqual({ rxjs: '^7' });
  });

  it.each([
    ['a foreign tarball', { name: 'other-package', version }, /Unexpected release tarball package/],
    ['a version mismatch', { name: 'hell-ui', version: '9.9.9' }, /this pipeline releases/],
  ])('refuses %s', (_case, manifest, expected) => {
    const { failures, manifest: rewritten } = rewritePackedManifest({
      manifest,
      version,
      registryUrl: 'https://example.invalid/',
    });
    expect(rewritten).toBeNull();
    expect(failures.some((failure) => expected.test(failure))).toBe(true);
  });

  it('publishes for real only outside a dry run', () => {
    expect(decidePublishCommand({ mode: 'publish', tarballPath: '/tmp/p.tgz' }).args).toEqual([
      'publish',
      '/tmp/p.tgz',
      '--no-git-checks',
    ]);
    expect(decidePublishCommand({ mode: 'dry-run', tarballPath: '/tmp/p.tgz' }).args).toEqual([
      'publish',
      '/tmp/p.tgz',
      '--no-git-checks',
      '--dry-run',
    ]);
  });
});

describe('choosePublishedPackage', () => {
  const entry = { id: 7, package_type: 'npm', name: publishedPackageName, version, status: 'default' };

  it('picks the one exact match among fuzzy API results', () => {
    const packages = [entry, { ...entry, id: 8, version: '0.2.0' }, { ...entry, id: 9, name: 'hell-ui' }];
    expect(choosePublishedPackage({ packages, name: publishedPackageName, version })).toEqual({
      failures: [],
      id: 7,
    });
  });

  it('reports absence as a decision, not an error', () => {
    expect(choosePublishedPackage({ packages: [], name: publishedPackageName, version })).toEqual({
      failures: [],
      id: null,
    });
  });

  it.each([
    ['a duplicated package', [entry, { ...entry, id: 8 }], /exactly one package/],
    ['an unprocessed package', [{ ...entry, status: 'processing' }], /status/],
    ['a non-array payload', null, /JSON array/],
  ])('fails %s', (_case, packages, expected) => {
    const { failures, id } = choosePublishedPackage({ packages, name: publishedPackageName, version });
    expect(id).toBeNull();
    expect(failures.some((failure) => expected.test(failure))).toBe(true);
  });

  it('links the package page under the project, never a raw registry path', () => {
    expect(packageWebUrl('https://example.invalid/group/project/', 7)).toBe(
      'https://example.invalid/group/project/-/packages/7',
    );
  });
});
