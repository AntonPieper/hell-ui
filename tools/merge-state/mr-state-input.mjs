// GitLab input adapter for the three-state merge-request policy (ADR 0003).
//
// The state-policy core (tools/merge-state/pr-state-policy.mjs) is ported unchanged; this
// module converts the two inputs a merge-request pipeline provides — the
// comma-joined `$CI_MERGE_REQUEST_LABELS` string and NUL-delimited
// `git diff --name-status -z` output over the merge-base diff — into the
// label-name and changed-file metadata shape the policy already consumes.
// Anything the adapter does not recognize becomes an error, never a guess:
// the policy's fail-closed posture starts here. Like the policy, it is
// dependency-free and never runs a command itself.

// GitLab joins label names with plain commas and no escaping, so a label name
// containing a comma splits into its parts here. Accepted: the label set is
// curated by the same trusted population that owns the labels themselves, and
// neither state label contains a comma.
export function parseMergeRequestLabels(raw) {
  if (raw === undefined || raw === null) return [];
  return raw
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label !== '');
}

// `git diff --name-status -z` emits NUL-terminated fields: a status token,
// then one path — or, for a rename (`R<score>`), the source path followed by
// the destination. Statuses map onto the GitHub changed-file vocabulary the
// policy evaluates; `T` (type change) is a content change at its path.
// Everything else — unmerged, broken, copies (never emitted without
// `--find-copies`), unknown — has no meaning the policy understands, so it
// rejects the whole diff. Unlike the REST changed-file list, the diff is
// complete by construction, so no truncation guard is needed here.
export function parseNameStatusDiff(raw) {
  const errors = [];
  const files = [];

  const fields = raw.split('\0');
  // A well-formed stream ends with a NUL, leaving one empty trailing field.
  if (fields.at(-1) === '') fields.pop();

  let index = 0;
  const nextPath = (status) => {
    const path = fields[index];
    index += 1;
    if (path === undefined || path === '') {
      errors.push(
        `Changed-file record with status "${status}" is truncated: expected a path field. ` +
          'Refusing to decide from unrecognized metadata.',
      );
      return null;
    }
    return path;
  };

  while (index < fields.length && errors.length === 0) {
    const status = fields[index];
    index += 1;

    if (status === 'A' || status === 'M' || status === 'D' || status === 'T') {
      const path = nextPath(status);
      if (path === null) break;
      const mapped = { A: 'added', M: 'modified', D: 'removed', T: 'changed' }[status];
      files.push({ filename: path, status: mapped });
      continue;
    }

    if (/^R\d{1,3}$/.test(status)) {
      const source = nextPath(status);
      if (source === null) break;
      const destination = nextPath(status);
      if (destination === null) break;
      files.push({ filename: destination, status: 'renamed', previous_filename: source });
      continue;
    }

    errors.push(
      `Changed-file record has unrecognized git status ${JSON.stringify(status)}; the adapter ` +
        'maps A, M, D, T, and R<score> only. Refusing to decide from unrecognized metadata.',
    );
  }

  return errors.length > 0 ? { files: [], errors } : { files, errors };
}
