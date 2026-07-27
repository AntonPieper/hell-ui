#!/usr/bin/env node
// Release Projection publication policy (ADR 0003).
//
// The GitHub Release for a tagged version is a Release Projection: an exact
// byte-for-byte publication of the tagged Released Version Notes, drafted
// only after every Required Registry succeeded and published only after the
// draft verified. This module owns those decisions as pure functions over
// captured metadata — registry results, tagged artifacts, and GitHub release
// objects — so `pnpm test:changelog` proves every outcome from fixtures
// without live publication, and the release workflow's thin jobs consume the
// same policy through the CLI at the bottom of this file.
//
// Deliberately dependency-free: the release workflow's projection jobs run
// `node tools/release-projection.mjs` on a bare checkout without installing
// node_modules, so this module must not import tools that pull in the yaml
// parser (tools/release-changelog.mjs → tools/change-fragments.mjs → yaml).
// The small SemVer helpers are therefore local copies of the
// release-changelog.mjs contract.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Mirrors packageManifestPath in tools/release-changelog.mjs (not imported;
// see the dependency-free note above).
const packageManifestPath = 'packages/angular/package.json';

const semVerPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

// Every 0.x.y version and every SemVer prerelease suffix is a GitHub
// prerelease. Stable classification is only reachable through an explicit
// Release Stage Promotion to a suffix-free version at major >= 1.
export function classifyPrereleaseVersion(version) {
  const match = semVerPattern.exec(String(version));
  if (!match) throw new Error(`Not a SemVer version: ${version}`);
  return match[1] === '0' || match[4] !== undefined;
}

// One Required Registry barrier for every configured destination. An entry is
// `{ name, required, result }` where `result` is the GitHub Actions job
// result (`success`, `failure`, `cancelled`, or `skipped`). A disabled
// optional registry never blocks; a Required Registry blocks on anything but
// `success`. GitHub Packages must always be configured as required, and
// future private registries join the same barrier by being listed as
// required.
export function evaluateRegistryBarrier(registries) {
  const failures = [];
  if (!Array.isArray(registries) || registries.length === 0) {
    return {
      failures: ['Registry results must be a nonempty JSON array of { name, required, result } entries.'],
    };
  }
  for (const entry of registries) {
    if (
      entry === null ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      entry.name.trim() === '' ||
      typeof entry.required !== 'boolean' ||
      typeof entry.result !== 'string'
    ) {
      failures.push(`Malformed registry result entry: ${JSON.stringify(entry)}.`);
    }
  }
  if (failures.length > 0) return { failures };

  if (!registries.some((entry) => entry.name === 'GitHub Packages' && entry.required)) {
    failures.push(
      'GitHub Packages must always be listed as a Required Registry ahead of the Release Projection.',
    );
  }
  for (const entry of registries) {
    if (!entry.required) continue;
    if (entry.result !== 'success') {
      failures.push(
        `Required Registry ${entry.name} was ${entry.result}; a skipped, cancelled, or failed ` +
          'required publication blocks the GitHub Release.',
      );
    }
  }
  return { failures };
}

// Derives the one expected Release Projection from the tagged artifacts: the
// audited package manifest version, the tag that triggered the release, the
// tagged commit, and the tagged Released Version Notes bytes. The notes are
// authoritative; the projection never authors independent prose.
export function planReleaseProjection({ tagName, commit, manifestVersion, notesBody }) {
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
      prerelease: classifyPrereleaseVersion(manifestVersion),
    },
  };
}

// Maps one GitHub REST release object onto the policy metadata this module
// verifies, so fixtures and the workflow feed the same captured shape.
export function normalizeGithubRelease(release) {
  return {
    id: release?.id ?? null,
    tagName: release?.tag_name ?? null,
    title: release?.name ?? null,
    body: release?.body ?? null,
    draft: release?.draft === true,
    prerelease: release?.prerelease === true,
    immutable: release?.immutable === true,
    assetNames: Array.isArray(release?.assets)
      ? release.assets.map((asset) => asset?.name ?? '(unnamed asset)')
      : [],
  };
}

// Decides whether a run creates the draft or adopts an existing release for
// the tag. Reruns never create a second release and never edit the existing
// one: an adopted release must verify exactly or the run fails.
export function chooseProjectionAction(existingReleases) {
  if (!Array.isArray(existingReleases)) {
    return { failures: ['Existing releases must be a JSON array.'], action: null, release: null };
  }
  if (existingReleases.length === 0) return { failures: [], action: 'create', release: null };
  if (existingReleases.length > 1) {
    return {
      failures: [
        `Found ${existingReleases.length} GitHub releases for the tag; ` +
          'one release tag must map to exactly one release.',
      ],
      action: null,
      release: null,
    };
  }
  return { failures: [], action: 'adopt', release: normalizeGithubRelease(existingReleases[0]) };
}

// Verifies one captured release against the expected Release Projection.
//
// Phase `projection` is draft verification: the release may be the fresh
// draft or an exact already-published release from an earlier run, and the
// repository's native immutable-releases policy must be proven enabled.
// Phase `published` is the final check: the release must be published and
// immutable. Both phases require the exact tag, title, tagged commit,
// byte-for-byte body, prerelease classification, and absence of custom
// assets; automation never edits a release to make verification pass.
export function verifyReleaseProjection({ expected, release, tagCommit, phase, immutableReleasesPolicy }) {
  if (phase !== 'projection' && phase !== 'published') {
    return { failures: [`Unknown verification phase ${JSON.stringify(phase)}.`] };
  }

  const failures = [];
  if (release.tagName !== expected.tagName) {
    failures.push(`The release tag is ${release.tagName}; expected ${expected.tagName}.`);
  }
  if (release.title !== expected.title) {
    failures.push(`The release title is ${JSON.stringify(release.title)}; expected ${JSON.stringify(expected.title)}.`);
  }
  if (tagCommit !== expected.commit) {
    failures.push(
      `Tag ${expected.tagName} points at ${tagCommit}, not the audited release commit ${expected.commit}.`,
    );
  }
  if (release.body !== expected.body) {
    failures.push(
      'The release body must reproduce the tagged Released Version Notes byte-for-byte ' +
        `(${describeFirstDifference(expected.body, release.body ?? '')}); ` +
        'automation never edits an existing release to make it pass.',
    );
  }
  if (release.prerelease !== expected.prerelease) {
    failures.push(
      `The release prerelease flag is ${release.prerelease}; ${expected.tagName} must be ` +
        `${expected.prerelease ? 'a GitHub prerelease until an explicit stable Release Stage Promotion' : 'a stable release'}.`,
    );
  }
  if (release.assetNames.length > 0) {
    failures.push(
      `The release must carry no custom assets; found ${release.assetNames.join(', ')}. ` +
        'Registries remain the package-distribution surface.',
    );
  }

  if (phase === 'published') {
    if (release.draft) {
      failures.push('The release is still a draft; the Release Projection must end published.');
    }
    if (!release.immutable) {
      failures.push(
        'The published release is not immutable; the repository must enforce its native ' +
          'immutable-releases policy for Release Projections.',
      );
    }
  } else if (immutableReleasesPolicy?.enabled !== true) {
    failures.push(
      immutableReleasesPolicy?.enabled === false
        ? "The repository's native immutable-releases policy is disabled; enable it in the " +
            'repository settings before publishing Release Projections.'
        : "Could not read the repository's native immutable-releases policy; draft verification " +
            'requires proof that the policy is enabled.',
    );
  }

  return { failures };
}

// Mirrors describeFirstDifference in tools/release-changelog.mjs (not
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
// CLI — the thin release-workflow entry over the policy above. Subcommands
// read captured metadata from environment variables and JSON files, print
// explicit failures, and exit nonzero so the workflow job blocks visibly.
// ---------------------------------------------------------------------------

function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'barrier':
      return runBarrier();
    case 'plan':
      return runPlan(rest);
    case 'decide':
      return runDecide(rest);
    case 'verify':
      return runVerify(rest);
    default:
      console.error('Usage: node tools/release-projection.mjs <barrier|plan|decide|verify> ...');
      return 2;
  }
}

function runBarrier() {
  const raw = process.env.HELL_REQUIRED_REGISTRIES;
  if (!raw) {
    console.error('HELL_REQUIRED_REGISTRIES must carry the JSON registry results.');
    return 2;
  }
  let registries;
  try {
    registries = JSON.parse(raw);
  } catch (error) {
    console.error(`HELL_REQUIRED_REGISTRIES must be valid JSON: ${error.message}`);
    return 2;
  }
  const { failures } = evaluateRegistryBarrier(registries);
  if (report('Required Registry barrier', failures)) return 1;
  console.log(
    `Required Registry barrier ok: ${registries
      .map((entry) => `${entry.name} ${entry.required ? entry.result : `optional (${entry.result})`}`)
      .join(', ')}.`,
  );
  return 0;
}

function runPlan(args) {
  const evidence = args.includes('--evidence');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');

  let manifestVersion = null;
  try {
    manifestVersion = JSON.parse(readFileSync(join(root, packageManifestPath), 'utf8')).version;
  } catch (error) {
    console.error(`Could not read ${packageManifestPath}: ${error.message}`);
    return 1;
  }

  const tagName = process.env.HELL_RELEASE_TAG ?? (evidence ? `v${manifestVersion}` : undefined);
  if (typeof tagName !== 'string') {
    console.error('HELL_RELEASE_TAG must carry the release tag (or pass --evidence to derive it).');
    return 2;
  }

  const notesPath = join(root, '.changes', `${manifestVersion}.md`);
  const notesBody = existsSync(notesPath) ? readFileSync(notesPath, 'utf8') : null;
  const { failures, expected } = planReleaseProjection({
    tagName,
    commit: process.env.HELL_RELEASE_COMMIT,
    manifestVersion,
    notesBody,
  });
  if (report('Release projection plan', failures)) return 1;

  console.error(
    `Release projection plan ok${evidence ? ' (evidence only, nothing is published)' : ''}: ` +
      `${expected.tagName} titled ${expected.title} at ${expected.commit}, ` +
      `${expected.prerelease ? 'a GitHub prerelease' : 'a stable release'}, ` +
      `body of ${Buffer.byteLength(expected.body, 'utf8')} bytes from .changes/${manifestVersion}.md.`,
  );
  console.log(JSON.stringify(expected, null, 2));
  return 0;
}

function runDecide(args) {
  const [expectedPath, existingPath] = args;
  if (!expectedPath || !existingPath) {
    console.error('Usage: node tools/release-projection.mjs decide <expected.json> <existing-releases.json>');
    return 2;
  }
  const expected = readJson(expectedPath);
  const existing = readJson(existingPath);
  const { failures, action, release } = chooseProjectionAction(existing);
  if (report('Release projection decision', failures)) return 1;

  if (action === 'create') {
    console.error(`No GitHub release exists for ${expected.tagName}; this run drafts it.`);
  } else {
    console.error(
      `A GitHub ${release.draft ? 'draft' : 'published release'} already exists for ` +
        `${expected.tagName}; this rerun verifies it exactly and never edits it.`,
    );
  }
  console.log(JSON.stringify({ action, releaseId: release?.id ?? null }));
  return 0;
}

function runVerify(args) {
  const positional = [];
  let phase = null;
  let policyPath = null;
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--phase') phase = args[++index];
    else if (args[index] === '--policy') policyPath = args[++index];
    else positional.push(args[index]);
  }
  const [expectedPath, releasePath] = positional;
  if (!expectedPath || !releasePath || !phase) {
    console.error(
      'Usage: node tools/release-projection.mjs verify <expected.json> <release.json> ' +
        '--phase <projection|published> [--policy <immutable-releases.json>]',
    );
    return 2;
  }

  const { failures } = verifyReleaseProjection({
    expected: readJson(expectedPath),
    release: normalizeGithubRelease(readJson(releasePath)),
    tagCommit: process.env.HELL_TAG_COMMIT,
    phase,
    immutableReleasesPolicy: policyPath ? readJson(policyPath) : null,
  });
  if (report(`Release projection verification (${phase})`, failures)) return 1;
  console.log(`Release projection verification (${phase}) ok: the release matches the tagged notes exactly.`);
  return 0;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    console.error(`Could not read JSON from ${path}: ${error.message}`);
    process.exit(2);
  }
}

function report(label, failures) {
  if (failures.length === 0) return false;
  console.error(`${label} failed:`);
  for (const failure of failures) console.error(`- ${failure}`);
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
