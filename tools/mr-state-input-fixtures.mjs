// Fixtures for the GitLab merge-request input adapter (ADR 0003).
//
// Two layers. The adapter fixtures drive the two parsers directly: the
// comma-joined `$CI_MERGE_REQUEST_LABELS` string and NUL-delimited
// `git diff --name-status -z` output, including the fail-closed rejection of
// statuses and record shapes the adapter does not recognize. The corpus
// replay then re-encodes every representable pull-request policy fixture as
// GitLab inputs, decodes them through the adapter, and asserts the identical
// verdict — proving the ported policy behaves the same behind the adapter.
// Nothing here talks to GitLab or runs git.

import {
  collectExpectationFailures,
  jsonEquals,
  runNamedFixtures,
} from './fixture-harness.mjs';
import { evaluatePullRequestState } from './pr-state-policy.mjs';
import { collectVerdictFailures, prStatePolicyFixtures } from './pr-state-policy-fixtures.mjs';
import { parseMergeRequestLabels, parseNameStatusDiff } from './mr-state-input.mjs';

const labelFixtures = [
  { name: 'an unset labels variable is no labels', raw: undefined, expect: [] },
  { name: 'an empty labels variable is no labels', raw: '', expect: [] },
  { name: 'a single label parses alone', raw: 'no-consumer-change', expect: ['no-consumer-change'] },
  {
    name: 'comma-joined labels split into names',
    raw: 'documentation,no-consumer-change',
    expect: ['documentation', 'no-consumer-change'],
  },
  {
    name: 'surrounding whitespace and empty segments are dropped',
    raw: ' documentation , ,release-preparation ',
    expect: ['documentation', 'release-preparation'],
  },
];

const diffFixtures = [
  {
    name: 'an empty diff is an empty file list',
    raw: '',
    expect: { files: [] },
  },
  {
    name: 'additions, modifications, and deletions map to GitHub statuses',
    raw: 'A\0.changes/unreleased/Added-20260730-120000.yaml\0M\0packages/angular/button/button.ts\0D\0docs/notes.md\0',
    expect: {
      files: [
        { filename: '.changes/unreleased/Added-20260730-120000.yaml', status: 'added' },
        { filename: 'packages/angular/button/button.ts', status: 'modified' },
        { filename: 'docs/notes.md', status: 'removed' },
      ],
    },
  },
  {
    name: 'a scored rename carries both paths',
    raw: 'R087\0docs/draft-note.yaml\0.changes/unreleased/Added-20260730-120000.yaml\0',
    expect: {
      files: [
        {
          filename: '.changes/unreleased/Added-20260730-120000.yaml',
          status: 'renamed',
          previous_filename: 'docs/draft-note.yaml',
        },
      ],
    },
  },
  {
    name: 'a type change is a content change',
    raw: 'T\0docs/link.md\0',
    expect: { files: [{ filename: 'docs/link.md', status: 'changed' }] },
  },
  {
    name: 'an unknown status token fails closed',
    raw: 'M2\0docs/notes.md\0',
    expect: { errors: ['unrecognized git status'] },
  },
  // One fixture per call site of the truncation guard: a rename reads two
  // paths, so a missing destination covers the absent-field rejection, and a
  // single-path status covers the empty-field one.
  {
    name: 'a rename missing its destination fails closed',
    raw: 'R100\0docs/old.md\0',
    expect: { errors: ['truncated'] },
  },
  {
    name: 'an empty path fails closed',
    raw: 'A\0\0',
    expect: { errors: ['truncated'] },
  },
];

// Encoders from the corpus's GitHub-shaped entries back to GitLab inputs.
// Returning null marks an entry (and thereby its fixture) as unrepresentable:
// git can never emit it, so replaying it proves nothing about the adapter.
function encodeChangedFile(entry) {
  if (typeof entry !== 'object' || entry === null || typeof entry.filename !== 'string') return null;
  switch (entry.status) {
    case 'added':
      return `A\0${entry.filename}\0`;
    case 'modified':
      return `M\0${entry.filename}\0`;
    case 'changed':
      return `T\0${entry.filename}\0`;
    case 'removed':
      return `D\0${entry.filename}\0`;
    case 'renamed':
      if (typeof entry.previous_filename !== 'string' || entry.previous_filename === '') return null;
      return `R100\0${entry.previous_filename}\0${entry.filename}\0`;
    default:
      return null;
  }
}

// A corpus fixture is representable when its labels form a plain
// comma-joinable list and every changed file has a git encoding. Fixtures
// exercising GitHub-only metadata guards — pagination truncation via
// `expectedFileCount`, unknown REST statuses, malformed entries — stay with
// the GitHub runner.
function encodeCorpusFixture(fixture) {
  if (fixture.expectedFileCount !== undefined) return null;
  if (!fixture.labels.every((label) => typeof label === 'string' && !label.includes(','))) return null;

  const entries = fixture.files.map(encodeChangedFile);
  if (entries.some((encoded) => encoded === null)) return null;
  return { labelsRaw: fixture.labels.join(','), diffRaw: entries.join('') };
}

export function runMrStateInputFixtures() {
  const labels = runNamedFixtures(labelFixtures, runLabelFixture, 'mr-state label fixture');
  const diffs = runNamedFixtures(diffFixtures, runDiffFixture, 'mr-state diff fixture');
  const replay = runCorpusReplay();

  return {
    failures: [...labels.failures, ...diffs.failures, ...replay.failures],
    total: labels.total + diffs.total,
    replayed: replay.replayed,
  };
}

function runLabelFixture(fixture) {
  const labels = parseMergeRequestLabels(fixture.raw);
  if (jsonEquals(labels, fixture.expect)) return [];
  return [`expected ${JSON.stringify(fixture.expect)}, got ${JSON.stringify(labels)}.`];
}

const diffDialect = {
  pass: (errors) => `expected a pass; got: ${errors.join(' | ')}`,
  none: (expected) => `expected a rejection mentioning ${expected.join(', ')}; got a pass.`,
  missing: (needle, errors) => `expected an error mentioning "${needle}"; got: ${errors.join(' | ')}`,
};

function runDiffFixture(fixture) {
  const { files, errors } = parseNameStatusDiff(fixture.raw);
  const expectedErrors = fixture.expect.errors ?? [];
  if (expectedErrors.length > 0 || errors.length > 0) {
    return collectExpectationFailures(errors, expectedErrors, diffDialect);
  }
  // A clean parse only counts if it decoded the exact records expected.
  return jsonEquals(files, fixture.expect.files)
    ? []
    : [`expected ${JSON.stringify(fixture.expect.files)}, got ${JSON.stringify(files)}.`];
}

// Re-encodes every representable policy fixture as GitLab inputs and asserts
// the identical verdict, so the ported policy is proven behind the adapter
// rather than only in front of it.
function runCorpusReplay() {
  const failures = [];
  let replayed = 0;
  for (const fixture of prStatePolicyFixtures) {
    const encoded = encodeCorpusFixture(fixture);
    if (encoded === null) continue;
    replayed += 1;

    const { files, errors } = parseNameStatusDiff(encoded.diffRaw);
    if (errors.length > 0) {
      failures.push(
        `mr-state corpus replay "${fixture.name}": the adapter rejected the encoded diff: ` +
          errors.join(' | '),
      );
      continue;
    }
    const verdict = evaluatePullRequestState({
      labels: parseMergeRequestLabels(encoded.labelsRaw),
      files,
    });
    for (const failure of collectVerdictFailures(fixture.expect, verdict)) {
      failures.push(`mr-state corpus replay "${fixture.name}": ${failure}`);
    }
  }
  if (replayed === 0) {
    failures.push('mr-state corpus replay: no policy fixture was representable as GitLab input.');
  }
  return { failures, replayed };
}
