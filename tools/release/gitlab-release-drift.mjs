#!/usr/bin/env node
// GitLab release machinery: the drift sweep's release half, and the
// maintainer's restoration command.
//
// The GitLab twin of tools/release/check-release-drift.mjs, following the
// same twin convention as gitlab-release-projection.mjs: self-contained for
// the GitLab side, sharing no code with the GitHub side, which is deleted
// whole at cutover. The ported idea is ADR 0003's: a Release is a projection
// of the tagged Released Version Notes, verified byte-for-byte and never
// edited to make verification pass. Where the GitHub check audits the one
// release an event names, the sweep re-reads every release via the API
// (never webhook payloads) on a schedule — release edits and rule deletions
// are silent on this platform edition, so the sweep is the audit trail.
//
// Two subcommands over the same policy seam:
//
// - `audit` only reads and compares: every release against the record at its
//   tag's commit, plus the one package-type asset link. Drift is reported,
//   never repaired. Runs daily in the scheduled policy-sweep pipeline (with
//   the read-only HELL_POLICY_TOKEN) and locally via the maintainer's `glab`
//   login.
// - `restore <tag> [--apply]` is the explicit maintainer command the sweep
//   points at: it re-derives the projection from the tagged artifacts and
//   writes the exact bytes back. Plan by default, `--apply` to write —
//   restoration is always a deliberate human decision, never automation, so
//   the write-capable credential never enters CI.
//
// Transport and project selection are tools/policy/gitlab-api.mjs, shared
// with the protected-main policy commands: the project is never named in the
// tree, and the sweep's token is the same single read-only project access
// token the policy half uses.

import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  apiGet,
  apiList,
  apiSend,
  describeTransport,
  resolveProjectPath,
} from '../policy/gitlab-api.mjs';
import {
  choosePublishedPackage,
  isReservedDryRunVersion,
  normalizeRelease,
  packageWebUrl,
  planRelease,
  publishedPackageName,
  releaseTagVersion,
  verifyRelease,
} from './gitlab-release-projection.mjs';

// Audits one captured release against the tagged artifacts: the tag it sits
// on, the Released Version Notes record at that tag's commit, and the
// published registry package its asset link names. Inputs are captured API
// objects, so every decision is reachable in fixtures without a live
// project.
export function auditRelease({ release, tag, record, packages, projectUrl }) {
  const derived = deriveExpected({
    tagName: release?.tag_name ?? null,
    tag,
    record,
    packages,
    projectUrl,
  });
  if (derived.failures.length > 0) return { failures: derived.failures };
  return verifyRelease({
    expected: derived.expected,
    release: normalizeRelease(release),
    assetUrl: derived.assetUrl,
  });
}

// The tagged truth one release is held to — shared by the audit and the
// restoration command, so the two can never drift apart on what a release
// tag must look like (a dry-run tag, say, refuses in both). Returns the
// expected projection and its asset link, or every reason they cannot exist.
function deriveExpected({ tagName, tag, record, packages, projectUrl }) {
  const version = releaseTagVersion(tagName);
  if (version === null) {
    return {
      failures: [
        `The release sits on ${JSON.stringify(tagName)}, which is not a v-prefixed SemVer ` +
          'release tag; only v<version> tags carry projected releases.',
      ],
    };
  }
  if (isReservedDryRunVersion(version)) {
    return {
      failures: [
        `The release sits on the reserved dry-run tag ${tagName}; a dry run never creates a ` +
          'release, so this one was created outside the release machinery.',
      ],
    };
  }
  if (!tag) {
    return {
      failures: [
        `The tag ${tagName} no longer exists; the v* protected-tag rule guards creation only, ` +
          'so a deleted tag is exactly the silent drift this sweep exists to catch.',
      ],
    };
  }

  const plan = planRelease({
    tagName,
    commit: tag?.commit?.id ?? null,
    manifestVersion: version,
    notesBody: record ?? null,
  });
  if (plan.expected === null) return { failures: plan.failures };

  const chosen = choosePublishedPackage({ packages, name: publishedPackageName, version });
  if (chosen.failures.length > 0) return { failures: chosen.failures };
  if (chosen.id === null) {
    return {
      failures: [
        `The project registry no longer holds an npm package ${publishedPackageName}@${version}; ` +
          "the release's asset link has lost its target.",
      ],
    };
  }

  return {
    failures: [],
    version,
    expected: plan.expected,
    assetUrl: packageWebUrl(projectUrl, chosen.id),
  };
}

// Derives the writes that take one drifted release back to the exact tagged
// bytes: a title/description update, the asset links to delete, and the one
// package link to create. Commit drift is refused — a release naming the
// wrong commit means the tag moved, and moving refs is tag surgery a
// maintainer performs deliberately, not a release edit.
export function planRestoration({ expected, release, assetUrl }) {
  const current = normalizeRelease(release);
  if (current.commit !== expected.commit) {
    return {
      failures: [
        `The release names commit ${current.commit}, not the tagged commit ${expected.commit}: ` +
          'the tag moved out from under it. This command only edits release content; deciding ' +
          'where the tag belongs is a separate, deliberate maintainer call.',
      ],
      plan: null,
    };
  }

  const update =
    current.title === expected.title && current.body === expected.body
      ? null
      : { name: expected.title, description: expected.body };

  const links = Array.isArray(release?.assets?.links) ? release.assets.links : [];
  const exact = links.filter(
    (link) =>
      link?.name === expected.assetName && link?.url === assetUrl && link?.link_type === 'package',
  );
  const keep = exact.length > 0 ? exact[0] : null;
  const stray = links.filter((link) => link !== keep);
  const unidentified = stray.filter((link) => typeof link?.id !== 'number');
  if (unidentified.length > 0) {
    return {
      failures: [
        `${unidentified.length} asset link(s) carry no numeric id, so they cannot be deleted ` +
          'through the API; restoration refuses rather than leaving them behind silently.',
      ],
      plan: null,
    };
  }

  return {
    failures: [],
    plan: {
      update,
      deleteLinkIds: stray.map((link) => link.id),
      createLink: keep
        ? null
        : { name: expected.assetName, url: assetUrl, link_type: 'package' },
    },
  };
}

// The v* release tags that carry no release. Not drift: pre-machinery tags
// (and any release removed with its whole tag by a deliberate maintainer
// decision) are simply outside the audited domain, but the sweep says so
// instead of letting "0 releases audited" read as full coverage.
export function unreleasedReleaseTags({ tags, releases }) {
  const released = new Set(releases.map((release) => release?.tag_name));
  return tags
    .map((tag) => tag?.name)
    .filter((name) => {
      const version = releaseTagVersion(name);
      return version !== null && !isReservedDryRunVersion(version) && !released.has(name);
    });
}

// ---------------------------------------------------------------------------
// CLI — thin entries over the seam above. `audit` is the sweep job's half;
// `restore` is the maintainer command the sweep's failure output points at.
// ---------------------------------------------------------------------------

async function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'audit':
      return runAudit(rest);
    case 'restore':
      return runRestore(rest);
    default:
      console.error(
        'Usage: node tools/release/gitlab-release-drift.mjs <audit | restore <tag> [--apply]>',
      );
      return 2;
  }
}

async function runAudit(args) {
  if (args.length > 0) {
    console.error('Usage: pnpm verify:release-drift');
    return 2;
  }

  const surfaces = await loadSurfaces();
  if (surfaces === null) return 1;
  const { projectPath, projectUrl, releases, tags, packages } = surfaces;

  const failures = [];
  const audited = [];
  for (const release of releases) {
    const tagName = release?.tag_name ?? '(unknown tag)';
    const tag = tags.get(release?.tag_name) ?? null;
    let record;
    try {
      record = await readTaggedRecord(projectPath, tag, releaseTagVersion(release?.tag_name));
    } catch (error) {
      failures.push(`${tagName}: cannot read the tagged record: ${error.message}`);
      continue;
    }
    const result = auditRelease({ release, tag, record, packages, projectUrl });
    audited.push(tagName);
    for (const failure of result.failures) failures.push(`${tagName}: ${failure}`);
  }

  const unreleased = unreleasedReleaseTags({ tags: [...tags.values()], releases });
  const coverage =
    unreleased.length === 0
      ? 'every v* release tag carries a release'
      : `${unreleased.length} v* tag(s) carry no release and are outside the audited domain ` +
        `(${unreleased.join(', ')}): only projected releases are compared`;

  if (failures.length > 0) {
    console.error(`Release drift check failed (read via ${describeTransport()}; ${coverage}):`);
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(
      'Drift detection is read-only: automation never repairs, edits, or republishes a release. ' +
        'A maintainer restores the exact tagged bytes with ' +
        '`pnpm restore:release -- <tag> --apply`, or publishes a corrective patch release when ' +
        'the tagged Released Version Notes themselves are wrong.',
    );
    return 1;
  }

  console.log(
    `Release drift ok via ${describeTransport()}: ` +
      `${audited.length === 0 ? 'no releases exist yet' : `${audited.length} release(s) exactly project their tagged records (${audited.join(', ')})`}; ` +
      `${coverage}.`,
  );
  return 0;
}

async function runRestore(args) {
  const apply = args.includes('--apply');
  const positional = args.filter((arg) => arg !== '--apply');
  if (positional.length !== 1) {
    console.error('Usage: pnpm restore:release -- <tag> [--apply]');
    return 2;
  }
  const [tagName] = positional;

  const surfaces = await loadSurfaces();
  if (surfaces === null) return 1;
  const { projectPath, projectUrl, releases, tags, packages } = surfaces;

  const release = releases.find((entry) => entry?.tag_name === tagName);
  if (!release) {
    console.error(
      `No release exists for ${tagName}. This command repairs an edited release; a deleted ` +
        "release is re-created by re-running its tag pipeline's projection job, which verifies " +
        'what it stores.',
    );
    return 1;
  }

  const tag = tags.get(tagName) ?? null;
  const record = await readTaggedRecord(projectPath, tag, releaseTagVersion(tagName));
  const derived = deriveExpected({ tagName, tag, record, packages, projectUrl });
  if (derived.failures.length > 0) {
    console.error('Cannot derive the tagged truth to restore to:');
    for (const failure of derived.failures) console.error(`- ${failure}`);
    return 1;
  }
  const { version, expected, assetUrl } = derived;

  const { failures, plan } = planRestoration({ expected, release, assetUrl });
  if (failures.length > 0) {
    console.error(`Restoration for ${tagName} refused:`);
    for (const failure of failures) console.error(`- ${failure}`);
    return 1;
  }

  if (plan.update === null && plan.deleteLinkIds.length === 0 && plan.createLink === null) {
    console.log(`Release ${tagName} already reproduces the tagged record exactly; nothing to restore.`);
    return 0;
  }

  console.log(`Restoration plan for ${tagName}:`);
  if (plan.update) {
    console.log(
      `- restore title to ${JSON.stringify(plan.update.name)} and description to the exact ` +
        `tagged bytes (${Buffer.byteLength(plan.update.description, 'utf8')} bytes from ` +
        `.changes/${version}.md at ${expected.commit})`,
    );
  }
  for (const id of plan.deleteLinkIds) console.log(`- delete stray asset link ${id}`);
  if (plan.createLink) {
    console.log(`- create asset link ${plan.createLink.name} -> ${plan.createLink.url}`);
  }

  if (!apply) {
    console.log('Plan only; nothing was written. Re-run with --apply to write it.');
    return 0;
  }

  const releasePath = `${projectPath}/releases/${encodeURIComponent(tagName)}`;
  if (plan.update) await apiSend('PUT', releasePath, plan.update);
  for (const id of plan.deleteLinkIds) await apiSend('DELETE', `${releasePath}/assets/links/${id}`, null);
  if (plan.createLink) await apiSend('POST', `${releasePath}/assets/links`, plan.createLink);

  // Verify what the API stored, not what was sent.
  const stored = await apiGet(releasePath);
  const verdict = auditRelease({ release: stored, tag, record, packages, projectUrl });
  if (verdict.failures.length > 0) {
    console.error(`Release ${tagName} still drifts after restoration:`);
    for (const failure of verdict.failures) console.error(`- ${failure}`);
    return 1;
  }
  console.log(`Restored ${tagName}: the release reproduces the tagged record byte-for-byte again.`);
  return 0;
}

// --- Captured reads --------------------------------------------------------

// The one failure-reporting entry both subcommands read through.
async function loadSurfaces() {
  try {
    return await readReleaseSurfaces();
  } catch (error) {
    console.error(`Cannot read the release surfaces via ${describeTransport()}: ${error.message}`);
    return null;
  }
}

// Everything both subcommands compare: the project (for its web URL), every
// release, every tag (read as a list so a deleted tag is an absent entry,
// not a transport error the two transports report differently), and the
// package registry. Packages are skipped while no release needs them.
async function readReleaseSurfaces() {
  const projectPath = resolveProjectPath();
  const project = await apiGet(projectPath);
  if (typeof project?.web_url !== 'string' || project.web_url === '') {
    throw new Error('the project answered without a web_url; asset links cannot be resolved.');
  }
  const releases = await apiList(`${projectPath}/releases`);
  const tagList = await apiList(`${projectPath}/repository/tags`);
  const packages = releases.length > 0 ? await apiList(`${projectPath}/packages`) : [];
  return {
    projectPath,
    projectUrl: project.web_url,
    releases,
    tags: new Map(tagList.map((tag) => [tag?.name, tag])),
    packages,
  };
}

// The Released Version Notes bytes at the tag's own commit — the tagged
// record the release must reproduce, which the copy on main can drift from.
// Presence comes from the tree listing rather than a 404 (the two transports
// report HTTP errors differently); the bytes come from the JSON file
// endpoint, base64-decoded.
async function readTaggedRecord(projectPath, tag, version) {
  if (version === null || !tag?.commit?.id) return null;
  const ref = tag.commit.id;
  const entries = await apiList(
    `${projectPath}/repository/tree`,
    `path=${encodeURIComponent('.changes')}&ref=${ref}`,
  );
  const name = `${version}.md`;
  if (!entries.some((entry) => entry?.type === 'blob' && entry?.name === name)) return null;
  const file = await apiGet(
    `${projectPath}/repository/files/${encodeURIComponent(`.changes/${name}`)}?ref=${ref}`,
  );
  if (file?.encoding !== 'base64' || typeof file?.content !== 'string') {
    throw new Error(
      `.changes/${name} at ${ref} came back in encoding ${JSON.stringify(file?.encoding ?? null)}, ` +
        'not base64; refusing to compare bytes that were not read exactly.',
    );
  }
  return Buffer.from(file.content, 'base64').toString('utf8');
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
