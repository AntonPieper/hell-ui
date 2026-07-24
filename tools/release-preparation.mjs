// Deterministic Release Preparation transaction (ADR 0003).
//
// One preparation turns every reviewed pending Change Fragment into exactly
// one Released Version Notes record, synchronizes the published package
// manifest to the same version, regenerates the Release Changelog with the
// real Changie binary, and proves the narrow changelog contract plus the
// allowed candidate shape. It never commits, tags, pushes, or publishes, and
// it never silently rolls back partially generated output after a failure —
// recovery is an explicit `git restore`/`git clean` decision.
//
// Automatic version selection is defined for plain pre-1.0 versions only:
// Breaking or Added fragments select the next minor, everything else the next
// patch. It can never produce `1.0.0` — a Release Stage Promotion and every
// prerelease are explicit-version decisions.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { parse } from 'yaml';
import { collectUnreleasedFragmentErrors, listUnreleasedFragments } from './change-fragments.mjs';
import {
  collectChangelogContractErrors,
  collectReleasedVersionNotesErrors,
  compareSemVer,
  isSemVer,
  listReleasedVersionFiles,
  packageManifestPath,
  parseSemVer,
} from './release-changelog.mjs';

const changieTimeoutMs = 30_000;

const candidateContractSummary =
  'a Release Preparation candidate may only change the package version, one new ' +
  'Released Version Notes record, the consumed pending fragments, and the generated Release Changelog';

// Runs the whole preparation against `root`. Returns
// `{ failures, version, mutated }`; `mutated` reports whether the repository
// was touched before the first failure, so callers know a failed candidate
// was intentionally left in place.
export function prepareRelease({ root, changieBinary, explicitVersion = null }) {
  const failures = [];
  const unreleasedDir = join(root, '.changes', 'unreleased');
  const fail = (version = null) => ({ failures, version, mutated: false });

  if (!existsSync(changieBinary)) {
    failures.push(`Missing Changie binary at ${changieBinary}; run pnpm install first.`);
    return fail();
  }

  // Pre-flight: the transaction starts from a released, fragment-bearing
  // repository whose working tree carries no disallowed changes, so nothing
  // is consumed when the candidate could never validate.
  const preflightStatus = readGitStatus(root);
  failures.push(...preflightStatus.failures);
  const preflightDisallowed = listDisallowedEntries(preflightStatus.entries);
  if (preflightDisallowed.length > 0) {
    failures.push(
      `Working tree changes outside the Release Preparation contract: ${preflightDisallowed.join(', ')}. ` +
        `${capitalize(candidateContractSummary)}; land source, documentation, configuration, lockfile, ` +
        'and cleanup changes in independently classified pull requests first.',
    );
  }

  failures.push(...collectReleasedVersionNotesErrors(root, (path) => relative(root, path)));
  failures.push(...collectUnreleasedFragmentErrors(unreleasedDir, (path) => relative(root, path)));
  if (failures.length > 0) return fail();

  const manifestVersion = readManifestVersion(root, failures);
  const latestReleased = listReleasedVersionFiles(join(root, '.changes'))
    .map((name) => name.replace(/\.md$/, ''))
    .sort(compareSemVer)
    .at(-1);
  if (manifestVersion !== null && latestReleased !== undefined && manifestVersion !== latestReleased) {
    failures.push(
      `${packageManifestPath} version ${manifestVersion} disagrees with the latest Released Version ` +
        `Notes record ${latestReleased}; Release Preparation starts from an agreed released state.`,
    );
  }

  const pendingFragments = existsSync(unreleasedDir) ? listUnreleasedFragments(unreleasedDir) : [];
  if (pendingFragments.length === 0) {
    failures.push(
      'No pending Change Fragments under .changes/unreleased/; Release Preparation assembles ' +
        'reviewed fragments and never fabricates an empty version.',
    );
  }
  if (failures.length > 0) return fail();

  const version = chooseVersion({
    explicitVersion,
    latestReleased,
    pendingKinds: pendingFragments.map((name) => parse(readFileSync(join(unreleasedDir, name), 'utf8')).kind),
    failures,
  });
  if (failures.length > 0) return fail(version);

  // Transaction: from here on, generated output stays in place on failure.
  const batch = runChangie(root, changieBinary, ['batch', version]);
  if (batch !== null) {
    failures.push(`changie batch ${version} ${batch}`);
    return { failures, version, mutated: true };
  }

  updateManifestVersion(root, version, failures);
  if (failures.length > 0) return { failures, version, mutated: true };

  const merge = runChangie(root, changieBinary, ['merge']);
  if (merge !== null) {
    failures.push(`changie merge ${merge}`);
    return { failures, version, mutated: true };
  }

  // Post-flight: prove the candidate — fragments consumed, one new record,
  // the narrow changelog contract (including byte-for-byte regeneration),
  // and a diff limited to the allowed artifact set.
  const remaining = existsSync(unreleasedDir) ? listUnreleasedFragments(unreleasedDir) : [];
  if (remaining.length > 0) {
    failures.push(`Preparation left unconsumed pending fragments: ${remaining.join(', ')}.`);
  }
  if (!existsSync(unreleasedDir)) {
    failures.push('Preparation must leave the .changes/unreleased/ directory in place for future fragments.');
  }

  const contract = collectChangelogContractErrors({
    root,
    changieBinary,
    describePath: (path) => relative(root, path),
  });
  failures.push(...contract.errors);

  const postStatus = readGitStatus(root);
  failures.push(...postStatus.failures);
  const postDisallowed = listDisallowedEntries(postStatus.entries);
  if (postDisallowed.length > 0) {
    failures.push(
      `Prepared candidate changes outside the Release Preparation contract: ${postDisallowed.join(', ')}; ` +
        `${candidateContractSummary}.`,
    );
  }
  const addedRecords = postStatus.entries
    .filter((entry) => isAllowedCandidateEntry(entry) && isReleasedRecordPath(entry.path))
    .map((entry) => entry.path);
  if (addedRecords.length !== 1 || addedRecords[0] !== `.changes/${version}.md`) {
    failures.push(
      `Preparation must add exactly one Released Version Notes record .changes/${version}.md; ` +
        `found ${addedRecords.join(', ') || '(none)'}.`,
    );
  }

  return { failures, version, mutated: true };
}

function chooseVersion({ explicitVersion, latestReleased, pendingKinds, failures }) {
  if (explicitVersion !== null) {
    if (!isSemVer(explicitVersion)) {
      failures.push(`Explicit version ${explicitVersion} must be valid SemVer, for example 0.3.0 or 0.3.0-beta.1.`);
      return null;
    }
    if (compareSemVer(explicitVersion, latestReleased) <= 0) {
      failures.push(
        `Explicit version ${explicitVersion} must advance the latest released version ${latestReleased}.`,
      );
      return null;
    }
    return explicitVersion;
  }

  const latest = parseSemVer(latestReleased);
  if (latest.major >= 1) {
    failures.push(
      `Automatic version selection is defined for pre-1.0 releases; the latest released version is ` +
        `${latestReleased}, so pass an explicit version.`,
    );
    return null;
  }
  if (latest.prerelease.length > 0) {
    failures.push(
      `The latest released version ${latestReleased} is a prerelease; pass an explicit version to ` +
        'state the intended release.',
    );
    return null;
  }

  // Pre-1.0 policy: Breaking and Added select the next minor, Changed,
  // Fixed, and Security the next patch. The major digit is never bumped, so
  // automatic selection can never reach 1.0.0 or any Release Stage Promotion.
  const minorBump = pendingKinds.some((kind) => kind === 'Breaking' || kind === 'Added');
  return minorBump ? `0.${latest.minor + 1}.0` : `0.${latest.minor}.${latest.patch + 1}`;
}

function readManifestVersion(root, failures) {
  const manifestAbsolute = join(root, packageManifestPath);
  if (!existsSync(manifestAbsolute)) {
    failures.push(`Missing ${packageManifestPath}.`);
    return null;
  }
  let version;
  try {
    version = JSON.parse(readFileSync(manifestAbsolute, 'utf8')).version;
  } catch (error) {
    failures.push(`${packageManifestPath} must be valid JSON: ${error.message}`);
    return null;
  }
  if (typeof version !== 'string' || !isSemVer(version)) {
    failures.push(`${packageManifestPath} must declare a valid SemVer version.`);
    return null;
  }
  return version;
}

function updateManifestVersion(root, version, failures) {
  const manifestAbsolute = join(root, packageManifestPath);
  const original = readFileSync(manifestAbsolute, 'utf8');
  const updated = original.replace(
    /^(\s*"version":\s*")[^"]*(")/m,
    (match, prefix, suffix) => `${prefix}${version}${suffix}`,
  );
  writeFileSync(manifestAbsolute, updated);
  const written = JSON.parse(readFileSync(manifestAbsolute, 'utf8')).version;
  if (written !== version) {
    failures.push(`Failed to update ${packageManifestPath} to version ${version}; found ${written}.`);
  }
}

function runChangie(root, changieBinary, args) {
  const result = spawnSync(changieBinary, args, {
    cwd: root,
    encoding: 'utf8',
    killSignal: 'SIGKILL',
    timeout: changieTimeoutMs,
  });
  if (result.error) return `failed to run: ${result.error.message}`;
  if (result.signal) return `was killed by ${result.signal}.`;
  if (result.status !== 0) return `exited with ${result.status}: ${result.stderr || result.stdout}`;
  return null;
}

function listDisallowedEntries(entries) {
  return entries
    .filter((entry) => !isAllowedCandidateEntry(entry))
    .map((entry) => `"${entry.state} ${entry.path}"`);
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function readGitStatus(root) {
  const result = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return {
      failures: [`git status failed: ${result.error?.message ?? result.stderr ?? `exit ${result.status}`}`],
      entries: [],
    };
  }
  const entries = result.stdout
    .split('\n')
    .filter((line) => line.length > 3)
    .map((line) => ({ state: line.slice(0, 2), path: line.slice(3) }));
  return { failures: [], entries };
}

// The allowed candidate shape. Pending fragments may be additions (the
// reviewed inputs) or deletions (consumed); the record is a single addition;
// the changelog and the package manifest are modifications of committed
// files. Everything else — source, docs, configuration, lockfile, cleanup —
// is outside the Release Preparation contract.
function isAllowedCandidateEntry(entry) {
  if (entry.path === 'CHANGELOG.md' || entry.path === packageManifestPath) {
    return entry.state === ' M' || entry.state === 'M ' || entry.state === 'MM';
  }
  if (isReleasedRecordPath(entry.path)) {
    return entry.state === '??' || entry.state === 'A ';
  }
  if (/^\.changes\/unreleased\/[^/]+\.ya?ml$/.test(entry.path)) {
    return entry.state === '??' || entry.state === 'A ' || entry.state === ' D' || entry.state === 'D ';
  }
  return false;
}

function isReleasedRecordPath(path) {
  if (!/^\.changes\/[^/]+\.md$/.test(path)) return false;
  return isSemVer(basename(path).replace(/\.md$/, ''));
}
