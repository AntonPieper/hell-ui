#!/usr/bin/env node
// Read-only Release Projection drift entry (ADR 0003).
//
// Runs inside .github/workflows/release-drift.yml against a checkout of the
// edited release's tag. Inputs:
//
// - HELL_RELEASE_JSON — path to the GitHub REST release object, captured
//   read-only from the API;
// - GITHUB_SHA — the commit this checkout (and therefore the Released Version
//   Notes record it reads) sits at; for release events that is the tagged
//   commit;
// - HELL_TAG_COMMIT — the commit the release tag resolves to now, read back
//   from the API, so a record read from a commit the tag no longer points at
//   fails instead of silently passing. It must be set, and is deliberately
//   allowed to be empty: an unresolvable tag is drift evidence, not a reason
//   to skip the check. Defaulting it would let a workflow edit that drops the
//   capture step pass the tag comparison trivially.
//
// The check only reads and compares against the same projection the release
// workflow drafts from; it exits nonzero with drift evidence and never
// touches the release.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseTagVersion, verifyReleaseDrift } from './release-projection.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const releaseJsonPath = process.env.HELL_RELEASE_JSON;
const recordCommit = process.env.GITHUB_SHA;
const tagCommit = process.env.HELL_TAG_COMMIT;
if (!releaseJsonPath || !recordCommit || tagCommit === undefined) {
  console.error(
    'check-release-drift requires HELL_RELEASE_JSON, GITHUB_SHA, and HELL_TAG_COMMIT ' +
      '(set to the empty string when the release tag could not be resolved).',
  );
  process.exit(1);
}

const release = JSON.parse(readFileSync(releaseJsonPath, 'utf8'));

// The tag is validated as a v-prefixed SemVer release tag before it names a
// path: a tag outside that shape never reaches the filesystem, and the seam
// reports it as drift.
const version = releaseTagVersion(release.tag_name);
const recordPath = version === null ? null : join(root, '.changes', `${version}.md`);
const taggedRecord =
  recordPath !== null && existsSync(recordPath) ? readFileSync(recordPath, 'utf8') : null;

const { failures } = verifyReleaseDrift({ release, taggedRecord, recordCommit, tagCommit });
if (failures.length > 0) {
  console.error(`Release Projection drift for ${release.tag_name ?? '(unknown tag)'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    'Drift detection is read-only: automation never repairs, edits, or republishes a release. ' +
      'A maintainer restores the exact tagged bytes, or publishes a corrective patch release when ' +
      'the tagged Released Version Notes themselves are wrong (docs/release/release-immutability.md).',
  );
  process.exit(1);
}

console.log(
  `Release ${release.tag_name} exactly projects .changes/${version}.md at ${recordCommit}; no drift.`,
);
