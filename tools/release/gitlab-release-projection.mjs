#!/usr/bin/env node
// GitLab release machinery: the v* tag pipeline's policy seam.
//
// The GitLab twin of tools/release/release-projection.mjs, following the same
// twin convention as decide-pr-state/decide-mr-state: a self-contained module
// for the GitLab tag pipeline, sharing no code with the GitHub side, which is
// deleted whole at cutover. The ported ideas are the ones ADR 0003 made
// host-agnostic — a Release is a projection of the tagged Released Version
// Notes, drafted from captured metadata by pure fixture-tested policy
// functions, verified byte-for-byte, and never edited to make verification
// pass.
//
// What the GitLab shape changes, deliberately:
//
// - The projection is a GitLab Release: title `v<version>`, description =
//   exact tagged `.changes/<version>.md` bytes, and exactly one
//   `package`-type asset link naming the published registry package. There
//   is no prerelease flag to project — SemVer 0.x carries that signal.
// - The Required Registry barrier is the pipeline DAG: the one registry is
//   this project's npm registry, and the projection job `needs` the publish
//   job, so a failed publication blocks the release by construction.
// - Rule liveness replaces the immutable-releases policy gate: the standing
//   `v*` protected-tag rule is the immutability substitute, and its liveness
//   is read in-band from CI_COMMIT_REF_PROTECTED — a tag pipeline whose ref
//   is not protected means the rule is gone, and publication refuses. No
//   token of any kind is needed for the check.
// - A dry-run mode is part of the machinery: a tag `v<version>-dryrun.<n>`
//   runs every stage in order against the audited version's plan, publishes
//   with `--dry-run`, and verifies the projection synthetically without
//   creating a release. The `-dryrun.<n>` suffix is reserved: a manifest
//   version carrying it can never ship.
//
// Deliberately dependency-free (node stdlib only): the rule-liveness,
// approval, and projection jobs run this file on a bare checkout without
// installing node_modules. Authentication is CI_JOB_TOKEN everywhere — the
// no-long-lived-publish-token policy survives verbatim; the registry and API
// are addressed through CI-provided variables only, never a hostname in the
// tree.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Mirrors packageManifestPath in tools/release/release-changelog.mjs (not
// imported; see the dependency-free note above).
const packageManifestPath = 'packages/angular/package.json';

// The name the package publishes under in the project npm registry. The
// packed tarball still says `hell-ui` — the in-tree rename is deferred to the
// cutover batch — so publication rewrites the packed manifest at publish
// time, exactly the way the GitHub Packages mirror does. The scope is public
// knowledge by design: the npmjs placeholders under it are standing
// tripwires (docs/release/npm-publishing.md).
export const publishedPackageName = '@hell-ui/angular';

const semVerPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

// The reserved dry-run spelling. Only this exact suffix — a version merely
// containing the word is not a dry run and fails the mode decision like any
// other version mismatch.
const dryRunSuffixPattern = /-dryrun\.(0|[1-9]\d*)$/;

// The version a release tag projects, or null when the tag is not a
// v-prefixed SemVer release tag.
export function releaseTagVersion(tagName) {
  if (typeof tagName !== 'string' || !tagName.startsWith('v')) return null;
  const version = tagName.slice(1);
  return semVerPattern.test(version) ? version : null;
}

// Decides what one v* tag asks of the release machinery: `publish` when the
// tag names the audited package version exactly, `dry-run` when it names
// that version with the reserved `-dryrun.<n>` suffix. Anything else fails —
// a tag that names no auditable version must never reach the publish path.
export function decideReleaseMode({ tagName, manifestVersion }) {
  if (typeof manifestVersion !== 'string' || !semVerPattern.test(manifestVersion)) {
    return {
      failures: [`${packageManifestPath} version must be valid SemVer; found ${manifestVersion}.`],
      mode: null,
      version: null,
    };
  }
  if (dryRunSuffixPattern.test(manifestVersion)) {
    return {
      failures: [
        `${packageManifestPath} version ${manifestVersion} carries the reserved -dryrun.<n> ` +
          'suffix; dry runs are selected by tags, never by the audited manifest.',
      ],
      mode: null,
      version: null,
    };
  }
  const tagVersion = releaseTagVersion(tagName);
  if (tagVersion === null) {
    return {
      failures: [
        `Tag ${JSON.stringify(tagName ?? null)} is not a v-prefixed SemVer release tag; only ` +
          'v<version> tags run the release machinery.',
      ],
      mode: null,
      version: null,
    };
  }
  const dryRun = dryRunSuffixPattern.exec(tagVersion);
  if (dryRun) {
    const base = tagVersion.slice(0, dryRun.index);
    if (base !== manifestVersion) {
      return {
        failures: [
          `Dry-run tag ${tagName} must name the audited package version ${manifestVersion} ` +
            `(expected v${manifestVersion}-dryrun.<n>).`,
        ],
        mode: null,
        version: null,
      };
    }
    return { failures: [], mode: 'dry-run', version: manifestVersion };
  }
  if (tagVersion !== manifestVersion) {
    return {
      failures: [
        `Tag ${tagName} must match the audited package version ${manifestVersion} ` +
          `(expected v${manifestVersion}).`,
      ],
      mode: null,
      version: null,
    };
  }
  return { failures: [], mode: 'publish', version: manifestVersion };
}

// Derives the one expected Release from the tagged artifacts: the audited
// manifest version, the release tag it projects, the tagged commit, and the
// tagged Released Version Notes bytes. The notes are authoritative; the
// projection never authors independent prose. In a dry run `tagName` is the
// projected release tag (v<version>), not the dry-run tag that triggered the
// pipeline.
export function planRelease({ tagName, commit, manifestVersion, notesBody }) {
  const failures = [];
  if (typeof manifestVersion !== 'string' || !semVerPattern.test(manifestVersion)) {
    return {
      failures: [`${packageManifestPath} version must be valid SemVer; found ${manifestVersion}.`],
      expected: null,
    };
  }

  const expectedTag = `v${manifestVersion}`;
  if (tagName !== expectedTag) {
    failures.push(
      `Tag ${tagName} must match the audited package version ${manifestVersion} (expected ${expectedTag}).`,
    );
  }
  if (typeof commit !== 'string' || !/^[0-9a-f]{40}$/.test(commit)) {
    failures.push(`The release commit must be one full commit SHA; found ${JSON.stringify(commit)}.`);
  }
  if (typeof notesBody !== 'string' || notesBody.trim() === '') {
    failures.push(
      `.changes/${manifestVersion}.md must carry the tagged Released Version Notes; ` +
        'the projection body is never authored independently.',
    );
  } else if (!notesBody.startsWith(`## [${manifestVersion}] - `)) {
    failures.push(`.changes/${manifestVersion}.md must start with \`## [${manifestVersion}] - YYYY-MM-DD\`.`);
  }
  if (failures.length > 0) return { failures, expected: null };

  return {
    failures,
    expected: {
      tagName: expectedTag,
      title: expectedTag,
      commit,
      body: notesBody,
      assetName: `${publishedPackageName}@${manifestVersion}`,
    },
  };
}

// Maps one GitLab REST release object onto the policy metadata this module
// verifies, so fixtures and the projection job feed the same captured shape.
export function normalizeRelease(release) {
  return {
    tagName: release?.tag_name ?? null,
    title: release?.name ?? null,
    body: release?.description ?? null,
    commit: release?.commit?.id ?? null,
    links: Array.isArray(release?.assets?.links)
      ? release.assets.links.map((link) => ({
          name: link?.name ?? null,
          url: link?.url ?? null,
          linkType: link?.link_type ?? null,
        }))
      : [],
  };
}

// Verifies one captured release against the expected Release and the
// resolved package asset link. The exact tag, title, tagged commit,
// byte-for-byte body, and exactly one `package`-type asset link naming the
// published registry package; automation never edits a release to make
// verification pass.
export function verifyRelease({ expected, release, assetUrl }) {
  const failures = [];
  if (release.tagName !== expected.tagName) {
    failures.push(`The release tag is ${release.tagName}; expected ${expected.tagName}.`);
  }
  if (release.title !== expected.title) {
    failures.push(
      `The release title is ${JSON.stringify(release.title)}; expected ${JSON.stringify(expected.title)}.`,
    );
  }
  if (release.commit !== expected.commit) {
    failures.push(
      `The release names commit ${release.commit}, not the audited release commit ${expected.commit}.`,
    );
  }
  if (release.body !== expected.body) {
    failures.push(
      'The release description must reproduce the tagged Released Version Notes byte-for-byte ' +
        `(${describeFirstDifference(expected.body, release.body ?? '')}); ` +
        'automation never edits an existing release to make it pass.',
    );
  }
  if (release.links.length !== 1) {
    failures.push(
      `The release must carry exactly one asset link (the published registry package); found ` +
        `${release.links.length}${release.links.length === 0 ? '' : `: ${release.links.map((link) => link.name).join(', ')}`}.`,
    );
  } else {
    const link = release.links[0];
    if (link.linkType !== 'package') {
      failures.push(`The asset link must have link_type "package"; found ${JSON.stringify(link.linkType)}.`);
    }
    if (link.name !== expected.assetName) {
      failures.push(
        `The asset link is named ${JSON.stringify(link.name)}; expected ${JSON.stringify(expected.assetName)}.`,
      );
    }
    if (link.url !== assetUrl) {
      failures.push(`The asset link points at ${JSON.stringify(link.url)}; expected ${JSON.stringify(assetUrl)}.`);
    }
  }
  return { failures };
}

// The rule-liveness gate. CI_COMMIT_REF_PROTECTED is "true" exactly when the
// ref this pipeline runs for matches a live protected-ref rule, so on a v*
// tag pipeline it is an in-band, token-free proof that the standing v*
// protected-tag rule still exists. Only the affirmative value opens the
// gate; anything else — including an unset variable — refuses, so the
// publish path fails closed.
export function collectRuleLivenessErrors({ refProtected }) {
  if (refProtected === 'true') return { failures: [] };
  return {
    failures: [
      `CI_COMMIT_REF_PROTECTED is ${JSON.stringify(refProtected ?? null)}: this tag pipeline is ` +
        'not running on a protected ref, so the standing v* protected-tag rule is missing or no ' +
        'longer covers this tag. That rule is the release-immutability substitute; publication ' +
        'refuses without it. Restore the live settings from .gitlab/policy/protect-main.json ' +
        '(pnpm run restore:main-policy), then re-run this pipeline.',
    ],
  };
}

// The project npm registry endpoint, from CI-provided values only.
export function packageRegistryUrl(apiV4Url, projectId) {
  return `${String(apiV4Url).replace(/\/$/, '')}/projects/${projectId}/packages/npm/`;
}

// The .npmrc credential line for that endpoint: host-relative, so the
// protocol never appears, and CI_JOB_TOKEN as the auth token — the one
// credential the publish job holds, valid only while the job runs.
export function npmrcAuthLine(registryUrl, jobToken) {
  return `${String(registryUrl).replace(/^https?:/, '')}:_authToken=${jobToken}`;
}

// Rewrites the packed manifest for the project registry: the published name,
// and a publishConfig that names only the registry — the packed npmjs
// publishConfig (registry, access, provenance) must not survive, or the
// publish would aim at the wrong host. Every other packed byte ships
// unchanged.
export function rewritePackedManifest({ manifest, version, registryUrl }) {
  const failures = [];
  if (manifest?.name !== 'hell-ui') {
    failures.push(`Unexpected release tarball package: ${JSON.stringify(manifest?.name ?? null)}.`);
  }
  if (manifest?.version !== version) {
    failures.push(
      `The packed tarball is version ${JSON.stringify(manifest?.version ?? null)}; this pipeline ` +
        `releases ${version}.`,
    );
  }
  if (failures.length > 0) return { failures, manifest: null };
  return {
    failures,
    manifest: { ...manifest, name: publishedPackageName, publishConfig: { registry: registryUrl } },
  };
}

// The publish invocation for the mode. `--no-git-checks` because a tag
// pipeline checks out a detached HEAD; a dry run stops pnpm before the
// upload.
export function decidePublishCommand({ mode, tarballPath }) {
  return {
    command: 'pnpm',
    args: ['publish', tarballPath, '--no-git-checks', ...(mode === 'dry-run' ? ['--dry-run'] : [])],
  };
}

// Picks the one published registry package the release's asset link names.
// The packages API filters by fuzzy name, so the exact match happens here.
export function choosePublishedPackage({ packages, name, version }) {
  if (!Array.isArray(packages)) {
    return { failures: ['The packages API must answer with a JSON array.'], id: null };
  }
  const matches = packages.filter(
    (entry) => entry?.package_type === 'npm' && entry?.name === name && entry?.version === version,
  );
  if (matches.length === 0) {
    return { failures: [], id: null };
  }
  if (matches.length > 1) {
    return {
      failures: [
        `Found ${matches.length} npm packages ${name}@${version} in the project registry; one ` +
          'published version must map to exactly one package.',
      ],
      id: null,
    };
  }
  if (matches[0].status !== undefined && matches[0].status !== 'default') {
    return {
      failures: [
        `The registry package ${name}@${version} has status ${JSON.stringify(matches[0].status)}; ` +
          'only a fully processed package can be the release asset.',
      ],
      id: null,
    };
  }
  return { failures: [], id: matches[0].id ?? null };
}

// The package's own page in this project's registry — the URL the release's
// asset link carries.
export function packageWebUrl(projectUrl, packageId) {
  return `${String(projectUrl).replace(/\/$/, '')}/-/packages/${packageId}`;
}

// Mirrors describeFirstDifference in tools/release/release-changelog.mjs (not
// imported; see the dependency-free note above).
function describeFirstDifference(expected, actual) {
  const expectedLines = String(expected).split('\n');
  const actualLines = String(actual).split('\n');
  const length = Math.max(expectedLines.length, actualLines.length);
  for (let index = 0; index < length; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return (
        `first difference at line ${index + 1}: ` +
        `expected ${formatLine(expectedLines[index])}, found ${formatLine(actualLines[index])}`
      );
    }
  }
  return 'bodies differ only in trailing bytes';
}

function formatLine(line) {
  return line === undefined ? '(end of body)' : JSON.stringify(line);
}

// ---------------------------------------------------------------------------
// CLI — the thin tag-pipeline entry over the policy above. Subcommands read
// captured metadata from CI-provided environment variables, print explicit
// failures, and exit nonzero so the pipeline job blocks visibly.
// ---------------------------------------------------------------------------

async function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'gate':
      return runGate();
    case 'rule-liveness':
      return runRuleLiveness();
    case 'publish':
      return runPublish(rest);
    case 'project':
      return runProject();
    default:
      console.error(
        'Usage: node tools/release/gitlab-release-projection.mjs <gate|rule-liveness|publish|project> ...',
      );
      return 2;
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Resolves the tag's mode and the expected Release, or reports why not. Every
// stage re-derives this from the same captured facts, so a stage can never
// act on a plan an earlier stage did not prove.
function resolveGate() {
  let manifestVersion = null;
  try {
    manifestVersion = JSON.parse(readFileSync(join(root, packageManifestPath), 'utf8')).version;
  } catch (error) {
    console.error(`Could not read ${packageManifestPath}: ${error.message}`);
    return null;
  }

  const mode = decideReleaseMode({ tagName: process.env.CI_COMMIT_TAG, manifestVersion });
  if (report('Release mode', mode.failures)) return null;

  const notesPath = join(root, '.changes', `${mode.version}.md`);
  const notesBody = existsSync(notesPath) ? readFileSync(notesPath, 'utf8') : null;
  const plan = planRelease({
    tagName: `v${mode.version}`,
    commit: process.env.CI_COMMIT_SHA,
    manifestVersion,
    notesBody,
  });
  if (report('Release plan', plan.failures)) return null;

  return { mode: mode.mode, version: mode.version, expected: plan.expected };
}

function runGate() {
  const gate = resolveGate();
  if (gate === null) return 1;
  const { mode, expected } = gate;
  console.log(
    `Release gate ok (${mode}): tag ${process.env.CI_COMMIT_TAG} projects ${expected.tagName} ` +
      `titled ${expected.title} at ${expected.commit}, body of ` +
      `${Buffer.byteLength(expected.body, 'utf8')} bytes from .changes/${gate.version}.md, ` +
      `asset link ${expected.assetName}. ` +
      (mode === 'dry-run'
        ? 'Dry run: nothing is published and no release is created from this pipeline.'
        : 'Playing the approval gate authorizes this publication — it is the last abort point.'),
  );
  return 0;
}

function runRuleLiveness() {
  const { failures } = collectRuleLivenessErrors({
    refProtected: process.env.CI_COMMIT_REF_PROTECTED,
  });
  if (report('Protected-tag rule liveness', failures)) return 1;
  console.log(
    `Protected-tag rule liveness ok: ${process.env.CI_COMMIT_TAG} is a protected ref, so the ` +
      'standing v* protected-tag rule is alive.',
  );
  return 0;
}

async function runPublish(args) {
  const [tarballDir] = args;
  if (!tarballDir) {
    console.error('Usage: node tools/release/gitlab-release-projection.mjs publish <tarball-dir>');
    return 2;
  }
  const env = requireEnv(['CI_API_V4_URL', 'CI_PROJECT_ID', 'CI_JOB_TOKEN']);
  if (env === null) return 2;

  // Re-derived and re-checked here so the refusal is atomic with the publish
  // decision, not only a separate green job earlier in the DAG.
  const gate = resolveGate();
  if (gate === null) return 1;
  const liveness = collectRuleLivenessErrors({ refProtected: process.env.CI_COMMIT_REF_PROTECTED });
  if (report('Protected-tag rule liveness', liveness.failures)) return 1;

  const tarballs = readdirSync(join(root, tarballDir)).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) {
    console.error(
      `Expected exactly one packed tarball in ${tarballDir}; found ${tarballs.length === 0 ? 'none' : tarballs.join(', ')}.`,
    );
    return 1;
  }
  const tarballPath = join(root, tarballDir, tarballs[0]);

  const registryUrl = packageRegistryUrl(env.CI_API_V4_URL, env.CI_PROJECT_ID);
  let packedManifest;
  try {
    packedManifest = JSON.parse(
      execFileSync('tar', ['-xOf', tarballPath, 'package/package.json'], { encoding: 'utf8' }),
    );
  } catch (error) {
    console.error(`Could not read package/package.json from ${tarballPath}: ${error.message}`);
    return 1;
  }
  const rewrite = rewritePackedManifest({
    manifest: packedManifest,
    version: gate.version,
    registryUrl,
  });
  if (report('Tarball audit', rewrite.failures)) return 1;

  // Repack with the registry manifest, exactly the GitHub Packages mirror
  // move: one metadata rewrite, every other shipped byte from the audited
  // build artifact.
  const stage = mkdtempSync(join(tmpdir(), 'hell-release-publish-'));
  execFileSync('tar', ['-xzf', tarballPath, '-C', stage]);
  writeFileSync(join(stage, 'package', 'package.json'), `${JSON.stringify(rewrite.manifest, null, 2)}\n`);
  const publishTarball = join(stage, `hell-ui-angular-${gate.version}.tgz`);
  execFileSync('tar', ['-czf', publishTarball, '-C', stage, 'package']);

  // The job-token credential for the one registry, in the ephemeral
  // checkout's own .npmrc.
  appendFileSync(join(root, '.npmrc'), `${npmrcAuthLine(registryUrl, env.CI_JOB_TOKEN)}\n`);

  // An authenticated read before any write: proves the endpoint and the job
  // token, and makes a rerun idempotent — a version the registry already
  // holds is never published twice.
  const metadata = await registryMetadata(registryUrl, env.CI_JOB_TOKEN);
  if (metadata.failures.length > 0) return reportAndFail('Registry preflight', metadata.failures);
  const alreadyPublished = metadata.versions.includes(gate.version);

  if (gate.mode === 'publish' && alreadyPublished) {
    console.log(
      `${publishedPackageName}@${gate.version} is already in the project registry; this rerun ` +
        'leaves it untouched and hands over to the projection.',
    );
    return 0;
  }
  if (gate.mode === 'dry-run' && alreadyPublished) {
    console.log(
      `${publishedPackageName}@${gate.version} is already in the project registry; a publish-mode ` +
        'rerun would skip the upload.',
    );
  }

  const { command, args: publishArgs } = decidePublishCommand({
    mode: gate.mode,
    tarballPath: publishTarball,
  });
  console.log(`Running: ${command} ${publishArgs.join(' ')}`);
  try {
    execFileSync(command, publishArgs, { cwd: root, stdio: 'inherit' });
  } catch {
    console.error(`Release publication failed: ${command} exited nonzero.`);
    return 1;
  }

  if (gate.mode === 'dry-run') {
    console.log(
      `Dry run ok: the audited tarball repacked as ${publishedPackageName}@${gate.version}, pnpm ` +
        'accepted it up to the upload, and the registry answered the authenticated probe. ' +
        'Nothing was published.',
    );
    return 0;
  }

  const after = await registryMetadata(registryUrl, env.CI_JOB_TOKEN);
  if (after.failures.length > 0) return reportAndFail('Registry verification', after.failures);
  if (!after.versions.includes(gate.version)) {
    console.error(
      `The registry does not list ${publishedPackageName}@${gate.version} after publishing; ` +
        'the publication cannot be verified.',
    );
    return 1;
  }
  console.log(`Published ${publishedPackageName}@${gate.version} to the project npm registry.`);
  return 0;
}

async function runProject() {
  const env = requireEnv(['CI_API_V4_URL', 'CI_PROJECT_ID', 'CI_JOB_TOKEN', 'CI_PROJECT_URL']);
  if (env === null) return 2;
  const gate = resolveGate();
  if (gate === null) return 1;
  const { mode, version, expected } = gate;

  // The published package the asset link names.
  const lookup = await apiRequest(env, 'GET', `packages?package_type=npm&per_page=100`);
  if (lookup.status !== 200) {
    console.error(
      `Could not list the project's packages (HTTP ${lookup.status}); the release asset link ` +
        'cannot be resolved.',
    );
    return 1;
  }
  const chosen = choosePublishedPackage({
    packages: lookup.body,
    name: publishedPackageName,
    version,
  });
  if (report('Package lookup', chosen.failures)) return 1;

  // The release the tag already carries, if any. 404 is the create path;
  // anything else unreadable fails closed.
  const existing = await apiRequest(env, 'GET', `releases/${encodeURIComponent(expected.tagName)}`);
  if (existing.status !== 200 && existing.status !== 404) {
    console.error(`Could not read the release for ${expected.tagName} (HTTP ${existing.status}).`);
    return 1;
  }

  if (mode === 'dry-run') {
    // Prove the projection path without creating anything: the plan and the
    // verifier must agree on a release synthesized from the plan itself, so
    // a publish-mode run creates exactly what verification accepts.
    const assetUrl =
      chosen.id === null
        ? `${String(env.CI_PROJECT_URL).replace(/\/$/, '')}/-/packages/(published-package-id)`
        : packageWebUrl(env.CI_PROJECT_URL, chosen.id);
    const synthetic = normalizeRelease({
      tag_name: expected.tagName,
      name: expected.title,
      description: expected.body,
      commit: { id: expected.commit },
      assets: { links: [{ name: expected.assetName, url: assetUrl, link_type: 'package' }] },
    });
    const { failures } = verifyRelease({ expected, release: synthetic, assetUrl });
    if (report('Projection self-check', failures)) return 1;
    console.log(
      `Dry run ok: would ${existing.status === 404 ? 'create' : 'adopt and verify'} release ` +
        `${expected.tagName} titled ${expected.title} at ${expected.commit} with asset link ` +
        `${expected.assetName} -> ${assetUrl}` +
        `${chosen.id === null ? ' (no published package yet; the id resolves after a real publish)' : ''}. ` +
        'No release was created.',
    );
    return 0;
  }

  if (chosen.id === null) {
    console.error(
      `No npm package ${publishedPackageName}@${version} exists in the project registry; the ` +
        'publish job must succeed before the release is projected.',
    );
    return 1;
  }
  const assetUrl = packageWebUrl(env.CI_PROJECT_URL, chosen.id);

  let releaseObject = existing.body;
  if (existing.status === 404) {
    const created = await apiRequest(env, 'POST', 'releases', {
      tag_name: expected.tagName,
      name: expected.title,
      description: expected.body,
      assets: { links: [{ name: expected.assetName, url: assetUrl, link_type: 'package' }] },
    });
    if (created.status !== 201) {
      console.error(`Creating the release for ${expected.tagName} failed (HTTP ${created.status}).`);
      return 1;
    }
    // Verify what the API stored, not what was sent.
    const reread = await apiRequest(env, 'GET', `releases/${encodeURIComponent(expected.tagName)}`);
    if (reread.status !== 200) {
      console.error(`Could not re-read the created release for ${expected.tagName} (HTTP ${reread.status}).`);
      return 1;
    }
    releaseObject = reread.body;
    console.log(`Created release ${expected.tagName}; verifying the stored projection.`);
  } else {
    console.log(
      `A release already exists for ${expected.tagName}; this rerun verifies it exactly and ` +
        'never edits it.',
    );
  }

  const { failures } = verifyRelease({
    expected,
    release: normalizeRelease(releaseObject),
    assetUrl,
  });
  if (report('Release verification', failures)) return 1;
  console.log(
    `Release projection ok: ${expected.tagName} reproduces the tagged Released Version Notes ` +
      `byte-for-byte and links ${expected.assetName}.`,
  );
  return 0;
}

// --- Transport -------------------------------------------------------------

// One authenticated API call under the job token. The JOB-TOKEN header is
// the documented job-token authentication for the releases and packages
// endpoints; the base URL and project come from CI-provided variables only.
async function apiRequest(env, method, path, body = null) {
  const base = `${String(env.CI_API_V4_URL).replace(/\/$/, '')}/projects/${env.CI_PROJECT_ID}`;
  const headers = { 'JOB-TOKEN': env.CI_JOB_TOKEN };
  if (body !== null) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${base}/${path}`, {
    method,
    headers,
    body: body === null ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text.trim() === '' ? null : JSON.parse(text);
  } catch {
    // A non-JSON body accompanies error statuses the callers report anyway.
  }
  return { status: response.status, body: parsed };
}

// Reads the published npm metadata for the package: 200 lists versions, 404
// means nothing published yet — both prove the endpoint and the job token.
// A 401/403 is a refused credential and fails closed.
async function registryMetadata(registryUrl, jobToken) {
  const url = `${registryUrl}${publishedPackageName.replace('/', '%2F')}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${jobToken}` } });
  if (response.status === 404) return { failures: [], versions: [] };
  if (response.status !== 200) {
    return {
      failures: [
        `The project npm registry answered HTTP ${response.status} to an authenticated metadata ` +
          'read; the job token or the endpoint is wrong, so publication refuses.',
      ],
      versions: [],
    };
  }
  try {
    const metadata = await response.json();
    return { failures: [], versions: Object.keys(metadata?.versions ?? {}) };
  } catch (error) {
    return { failures: [`The registry metadata is not JSON: ${error.message}`], versions: [] };
  }
}

function requireEnv(names) {
  const missing = names.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing CI-provided environment: ${missing.join(', ')}.`);
    return null;
  }
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

function reportAndFail(label, failures) {
  report(label, failures);
  return 1;
}

function report(label, failures) {
  if (failures.length === 0) return false;
  console.error(`${label} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  return true;
}

// Resolved through symlinks on both sides: `import.meta.url` is always the real
// path, while `process.argv[1]` is whatever spelling invoked the script, so an
// absolute invocation through a symlinked path would compare two different
// strings and silently skip `main()` instead of failing.
if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(await main(process.argv.slice(2)));
}
