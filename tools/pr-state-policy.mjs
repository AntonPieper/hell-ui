// Trusted three-state pull-request policy (ADR 0003).
//
// Every pull request has exactly one state: Consumer Change (it adds one or
// more Change Fragments), No Consumer Change (`no-consumer-change`), or
// Release Preparation (`release-preparation`). This module decides that state
// from GitHub metadata only — label names plus changed-file metadata — so the
// privileged workflow consuming it never checks out, imports, evaluates, or
// executes pull-request content. Fragment *validity* is deliberately out of
// scope: the read-only content check validates checked-out fragments, so a
// malformed present fragment can never satisfy the Consumer Change state
// through this policy alone.
//
// The module is dependency-free on purpose: the trusted workflow runs it from
// a base-branch checkout without installing anything.

export const noConsumerChangeLabel = 'no-consumer-change';
export const releasePreparationLabel = 'release-preparation';

export const releaseChangelogPath = 'CHANGELOG.md';
export const packageManifestPath = 'packages/angular/package.json';

const pendingFragmentPattern = /^\.changes\/unreleased\/[^/]+\.ya?ml$/;
const releasedRecordPattern = /^\.changes\/[^/]+\.md$/;
const semVerPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

// GitHub "list pull request files" statuses. Anything else fails closed so a
// new API status can never silently widen the policy.
const knownFileStatuses = ['added', 'removed', 'modified', 'changed', 'renamed', 'copied', 'unchanged'];

const exactlyOneStateGuidance =
  'a pull request has exactly one state: it adds Change Fragments (Consumer Change), carries ' +
  `"${noConsumerChangeLabel}", or carries "${releasePreparationLabel}"`;

function isPendingFragmentPath(path) {
  return pendingFragmentPattern.test(path);
}

function isReleasedRecordPath(path) {
  if (!releasedRecordPattern.test(path)) return false;
  const name = path.slice('.changes/'.length, -'.md'.length);
  return name !== 'header.tpl' && semVerPattern.test(name);
}

// Decides one pull request's state from trusted metadata.
//
// `labels` is an array of label names; `files` is the GitHub REST
// changed-file metadata (`filename`, `status`, optional `previous_filename`),
// already concatenated across pagination pages. Returns
// `{ state, errors }`; the decision passes only when `errors` is empty.
// `state` names the claimed state (or null when no state can be claimed) so
// callers can report what was evaluated even on failure.
export function evaluatePullRequestState({ labels, files }) {
  const errors = collectMetadataShapeErrors(labels, files);
  if (errors.length > 0) return { state: null, errors };

  const touches = files.flatMap((file) => normalizeFileTouches(file, errors));
  if (errors.length > 0) return { state: null, errors };

  const hasNoConsumerChange = labels.includes(noConsumerChangeLabel);
  const hasReleasePreparation = labels.includes(releasePreparationLabel);
  const fragmentAdditions = touches
    .filter((touch) => touch.kind === 'added' && isPendingFragmentPath(touch.path))
    .map((touch) => touch.path);

  if (hasNoConsumerChange && hasReleasePreparation) {
    errors.push(
      `Carries both "${noConsumerChangeLabel}" and "${releasePreparationLabel}"; ${exactlyOneStateGuidance}.`,
    );
    return { state: null, errors };
  }

  if (hasReleasePreparation) {
    if (fragmentAdditions.length > 0) {
      errors.push(
        `Adds Change Fragments (${fragmentAdditions.join(', ')}) while carrying ` +
          `"${releasePreparationLabel}"; ${exactlyOneStateGuidance}. Release Preparation consumes ` +
          'reviewed fragments and introduces no new Consumer Change.',
      );
    }
    errors.push(...collectReleasePreparationShapeErrors(touches));
    return { state: 'release-preparation', errors };
  }

  // Outside Release Preparation the generated aggregate and the immutable
  // Released Version Notes records are read-only surfaces.
  const changelogTouches = touches.filter((touch) => touch.path === releaseChangelogPath);
  if (changelogTouches.length > 0) {
    errors.push(
      `${releaseChangelogPath} is the generated Release Changelog; it may only change in a ` +
        `"${releasePreparationLabel}" pull request. Record Consumer Changes as Change Fragments instead.`,
    );
  }
  const recordTouches = touches.filter((touch) => isReleasedRecordPath(touch.path));
  if (recordTouches.length > 0) {
    errors.push(
      `Released Version Notes records are immutable outside "${releasePreparationLabel}": ` +
        `${[...new Set(recordTouches.map((touch) => touch.path))].join(', ')}. An incorrect published ` +
        'record is corrected by a subsequent release, never by editing history.',
    );
  }

  if (hasNoConsumerChange) {
    if (fragmentAdditions.length > 0) {
      errors.push(
        `Adds Change Fragments (${fragmentAdditions.join(', ')}) while carrying ` +
          `"${noConsumerChangeLabel}"; ${exactlyOneStateGuidance}. Drop the label or the fragments.`,
      );
    }
    return { state: 'no-consumer-change', errors };
  }

  if (fragmentAdditions.length === 0) {
    errors.push(
      `Declares no state: ${exactlyOneStateGuidance}. Add a Change Fragment with \`pnpm change\` for a ` +
        `Consumer Change, or apply "${noConsumerChangeLabel}" when adopters are unaffected.`,
    );
    return { state: null, errors };
  }

  return { state: 'consumer-change', errors };
}

// A Release Preparation candidate may change only the generated Release
// Changelog, the published package manifest, exactly one new Released Version
// Notes record, and the consumed pending fragments — and it must actually
// perform that whole transaction.
function collectReleasePreparationShapeErrors(touches) {
  const errors = [];

  const unrelated = touches.filter((touch) => !isAllowedReleasePreparationTouch(touch));
  if (unrelated.length > 0) {
    errors.push(
      'Release Preparation must contain no unrelated changes; found ' +
        `${unrelated.map((touch) => `"${touch.kind} ${touch.path}"`).join(', ')}. It may only modify ` +
        `${releaseChangelogPath} and ${packageManifestPath}, add one Released Version Notes record, ` +
        'and remove consumed pending fragments.',
    );
  }

  const recordAdditions = touches
    .filter((touch) => touch.kind === 'added' && isReleasedRecordPath(touch.path))
    .map((touch) => touch.path);
  if (recordAdditions.length !== 1) {
    errors.push(
      'Release Preparation must add exactly one new Released Version Notes record under .changes/; ' +
        `found ${recordAdditions.join(', ') || '(none)'}.`,
    );
  }

  const consumedFragments = touches.filter(
    (touch) => touch.kind === 'removed' && isPendingFragmentPath(touch.path),
  );
  if (consumedFragments.length === 0) {
    errors.push(
      'Release Preparation must consume pending Change Fragments from .changes/unreleased/; ' +
        'it never fabricates an empty version.',
    );
  }

  if (!touches.some((touch) => touch.kind === 'modified' && touch.path === packageManifestPath)) {
    errors.push(
      `Release Preparation must update the published package manifest ${packageManifestPath} ` +
        'to the prepared version.',
    );
  }

  if (!touches.some((touch) => touch.kind === 'modified' && touch.path === releaseChangelogPath)) {
    errors.push(
      `Release Preparation must regenerate the Release Changelog ${releaseChangelogPath} ` +
        'from the committed records.',
    );
  }

  return errors;
}

function isAllowedReleasePreparationTouch(touch) {
  if (touch.path === releaseChangelogPath || touch.path === packageManifestPath) {
    return touch.kind === 'modified';
  }
  if (isReleasedRecordPath(touch.path)) return touch.kind === 'added';
  if (isPendingFragmentPath(touch.path)) return touch.kind === 'removed';
  return false;
}

// One changed-file metadata entry becomes one or two path touches: a rename
// removes the previous path and adds the new one, so a fragment renamed into
// place counts as an addition and the Release Changelog renamed away still
// counts as touched.
function normalizeFileTouches(file, errors) {
  switch (file.status) {
    case 'added':
    case 'copied':
      return [{ path: file.filename, kind: 'added' }];
    case 'removed':
      return [{ path: file.filename, kind: 'removed' }];
    case 'modified':
    case 'changed':
      return [{ path: file.filename, kind: 'modified' }];
    case 'unchanged':
      return [];
    case 'renamed': {
      if (typeof file.previous_filename !== 'string' || file.previous_filename === '') {
        errors.push(
          `Changed-file metadata for ${JSON.stringify(file.filename)} is renamed but carries no ` +
            'previous_filename; refusing to decide from incomplete metadata.',
        );
        return [];
      }
      return [
        { path: file.previous_filename, kind: 'removed' },
        { path: file.filename, kind: 'added' },
      ];
    }
    default:
      errors.push(
        `Changed-file metadata for ${JSON.stringify(file.filename)} has unknown status ` +
          `${JSON.stringify(file.status)}; known statuses are ${knownFileStatuses.join(', ')}. ` +
          'Refusing to decide from unrecognized metadata.',
      );
      return [];
  }
}

function collectMetadataShapeErrors(labels, files) {
  const errors = [];
  if (!Array.isArray(labels) || labels.some((label) => typeof label !== 'string')) {
    errors.push('Label metadata must be an array of label-name strings.');
  }
  if (!Array.isArray(files)) {
    errors.push('Changed-file metadata must be an array of file entries.');
    return errors;
  }
  for (const file of files) {
    if (
      typeof file !== 'object' ||
      file === null ||
      typeof file.filename !== 'string' ||
      file.filename === '' ||
      typeof file.status !== 'string'
    ) {
      errors.push(
        'Changed-file metadata entries must carry string filename and status fields; got ' +
          `${JSON.stringify(file)}.`,
      );
    }
  }
  return errors;
}
