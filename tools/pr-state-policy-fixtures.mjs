// Fixture-driven tests for the trusted three-state pull-request policy
// (ADR 0003).
//
// Every fixture is a captured-metadata scenario: label names plus GitHub
// changed-file entries, already concatenated across pagination pages the way
// the policy consumes them. The runner asserts the policy verdict, covering
// every valid and invalid state combination, direct aggregate and record
// edits, the Release Preparation candidate shape, rename metadata, and
// fail-closed handling of unrecognized metadata. Nothing here talks to GitHub.

import {
  collectExpectationFailures,
  errorDialect,
  runNamedFixtures,
} from './fixture-harness.mjs';
import {
  changedFilesApiCap,
  evaluatePullRequestState,
  noConsumerChangeLabel,
  packageManifestPath,
  releaseChangelogPath,
  releasePreparationLabel,
} from './pr-state-policy.mjs';

const file = (filename, status, previous_filename = undefined) =>
  previous_filename === undefined ? { filename, status } : { filename, status, previous_filename };

const fragmentAddition = (name = 'Added-20260724-120000.yaml') =>
  file(`.changes/unreleased/${name}`, 'added');

const preparationCandidate = ({ record = '.changes/0.3.0.md', extras = [] } = {}) => [
  file(releaseChangelogPath, 'modified'),
  file(packageManifestPath, 'modified'),
  file(record, 'added'),
  file('.changes/unreleased/Added-20260724-120000.yaml', 'removed'),
  file('.changes/unreleased/Fixed-20260724-120001.yaml', 'removed'),
  ...extras,
];

// `expect` is either `{ state }` for a passing decision or
// `{ state, errors: [substring, ...] }` for a failing one. The listed
// substrings are the whole verdict: every one must appear in the reported
// errors, and an error no substring names fails the fixture too, so a scenario
// that starts failing for a second reason cannot pass on the strength of the
// first. The corpus is exported so the GitLab input adapter
// (tools/mr-state-input-fixtures.mjs) replays the same scenarios through its
// own encoding.
export const prStatePolicyFixtures = [
  {
    name: 'one added fragment is a Consumer Change',
    labels: [],
    files: [fragmentAddition(), file('packages/angular/button/button.ts', 'modified')],
    expect: { state: 'consumer-change' },
  },
  {
    name: 'a fragment renamed into place counts as an addition',
    labels: [],
    files: [file('.changes/unreleased/Added-20260724-120000.yaml', 'renamed', 'docs/draft-note.yaml')],
    expect: { state: 'consumer-change' },
  },
  {
    // Only an addition claims the Consumer Change state; editing a fragment
    // already under review declares nothing on its own.
    name: 'a modified pending fragment alone declares no state',
    labels: [],
    files: [file('.changes/unreleased/Fixed-20260701-090000.yaml', 'modified')],
    expect: { state: null, errors: ['Declares no state'] },
  },
  {
    name: 'the no-consumer-change label alone is valid',
    labels: [noConsumerChangeLabel, 'documentation'],
    files: [file('docs/release/change-fragments.md', 'modified'), file('e2e/menu.spec.ts', 'added')],
    expect: { state: 'no-consumer-change' },
  },
  {
    name: 'a fragment withdrawal under no-consumer-change is valid',
    labels: [noConsumerChangeLabel],
    files: [file('.changes/unreleased/Added-20260701-090000.yaml', 'removed')],
    expect: { state: 'no-consumer-change' },
  },
  {
    name: 'a complete Release Preparation candidate is valid',
    labels: [releasePreparationLabel],
    files: preparationCandidate(),
    expect: { state: 'release-preparation' },
  },
  {
    name: 'a prerelease Release Preparation record is valid',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ record: '.changes/0.3.0-beta.1.md' }),
    expect: { state: 'release-preparation' },
  },
  {
    name: 'both labels together fail',
    labels: [noConsumerChangeLabel, releasePreparationLabel],
    files: [file('docs/notes.md', 'modified')],
    expect: { state: null, errors: ['exactly one state'] },
  },
  {
    name: 'neither fragments nor a state label fails',
    labels: ['documentation'],
    files: [file('packages/angular/button/button.ts', 'modified')],
    expect: { state: null, errors: ['Declares no state', 'pnpm change'] },
  },
  {
    name: 'fragments combined with no-consumer-change fail',
    labels: [noConsumerChangeLabel],
    files: [fragmentAddition()],
    expect: { state: 'no-consumer-change', errors: ['while carrying "no-consumer-change"'] },
  },
  {
    // A pending fragment added inside a preparation candidate breaks two
    // rules at once — it declares a Consumer Change under the preparation
    // label, and it is a change the candidate shape does not admit — and the
    // verdict has to name both.
    name: 'fragments combined with release-preparation fail',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ extras: [fragmentAddition('Changed-20260724-130000.yaml')] }),
    expect: {
      state: 'release-preparation',
      errors: ['while carrying "release-preparation"', 'no unrelated changes'],
    },
  },
  {
    name: 'a direct Release Changelog edit fails a Consumer Change',
    labels: [],
    files: [fragmentAddition(), file(releaseChangelogPath, 'modified')],
    expect: { state: 'consumer-change', errors: ['generated Release Changelog'] },
  },
  {
    name: 'a direct Release Changelog edit fails under no-consumer-change',
    labels: [noConsumerChangeLabel],
    files: [file(releaseChangelogPath, 'modified')],
    expect: { state: 'no-consumer-change', errors: ['generated Release Changelog'] },
  },
  {
    name: 'renaming the Release Changelog away still counts as touching it',
    labels: [noConsumerChangeLabel],
    files: [file('docs/OLD-CHANGELOG.md', 'renamed', releaseChangelogPath)],
    expect: { state: 'no-consumer-change', errors: ['generated Release Changelog'] },
  },
  {
    name: 'editing a Released Version Notes record outside preparation fails',
    labels: [noConsumerChangeLabel],
    files: [file('.changes/0.2.0.md', 'modified')],
    expect: { state: 'no-consumer-change', errors: ['immutable outside'] },
  },
  {
    name: 'the header template is not a Released Version Notes record',
    labels: [noConsumerChangeLabel],
    files: [file('.changes/header.tpl.md', 'modified'), file('.changie.yaml', 'modified')],
    expect: { state: 'no-consumer-change' },
  },
  {
    name: 'Release Preparation with an unrelated source change fails',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ extras: [file('packages/angular/button/button.ts', 'modified')] }),
    expect: { state: 'release-preparation', errors: ['no unrelated changes'] },
  },
  {
    name: 'Release Preparation must add exactly one version record',
    labels: [releasePreparationLabel],
    files: [...preparationCandidate(), file('.changes/0.4.0.md', 'added')],
    expect: { state: 'release-preparation', errors: ['exactly one new Released Version Notes record'] },
  },
  {
    name: 'Release Preparation without a new version record fails',
    labels: [releasePreparationLabel],
    files: preparationCandidate().filter((entry) => entry.filename !== '.changes/0.3.0.md'),
    expect: { state: 'release-preparation', errors: ['exactly one new Released Version Notes record'] },
  },
  {
    name: 'Release Preparation editing an existing record fails',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ extras: [file('.changes/0.2.0.md', 'modified')] }),
    expect: { state: 'release-preparation', errors: ['no unrelated changes'] },
  },
  {
    name: 'Release Preparation must consume pending fragments',
    labels: [releasePreparationLabel],
    files: preparationCandidate().filter((entry) => entry.status !== 'removed'),
    expect: { state: 'release-preparation', errors: ['must consume pending Change Fragments'] },
  },
  {
    name: 'Release Preparation must update the package manifest',
    labels: [releasePreparationLabel],
    files: preparationCandidate().filter((entry) => entry.filename !== packageManifestPath),
    expect: { state: 'release-preparation', errors: ['update the published package manifest'] },
  },
  {
    name: 'Release Preparation must regenerate the Release Changelog',
    labels: [releasePreparationLabel],
    files: preparationCandidate().filter((entry) => entry.filename !== releaseChangelogPath),
    expect: { state: 'release-preparation', errors: ['regenerate the Release Changelog'] },
  },
  {
    name: 'a matching reported changed-file count passes',
    labels: [],
    files: [fragmentAddition(), file('packages/angular/button/button.ts', 'modified')],
    expectedFileCount: 2,
    expect: { state: 'consumer-change' },
  },
  {
    name: 'a changed-file list at the API cap fails closed',
    labels: [noConsumerChangeLabel],
    files: Array.from({ length: changedFilesApiCap }, (_, index) =>
      file(`docs/examples/example-${index}.ts`, 'modified'),
    ),
    expectedFileCount: changedFilesApiCap,
    expect: { state: null, errors: ['GitHub API cap'] },
  },
  {
    name: 'a diverging reported changed-file count fails closed',
    labels: [noConsumerChangeLabel],
    files: [file('docs/notes.md', 'modified')],
    expectedFileCount: 2,
    expect: { state: null, errors: ['refusing to decide from incomplete metadata'] },
  },
  {
    name: 'a malformed reported changed-file count fails closed',
    labels: [noConsumerChangeLabel],
    files: [file('docs/notes.md', 'modified')],
    expectedFileCount: '1',
    expect: { state: null, errors: ['must be a non-negative integer'] },
  },
  {
    name: 'an unknown changed-file status fails closed',
    labels: [noConsumerChangeLabel],
    files: [file('docs/notes.md', 'mystery-status')],
    expect: { state: null, errors: ['unknown status'] },
  },
  {
    name: 'a rename without previous_filename fails closed',
    labels: [noConsumerChangeLabel],
    files: [file('docs/notes.md', 'renamed')],
    expect: { state: null, errors: ['no previous_filename'] },
  },
  {
    name: 'malformed label metadata fails closed',
    labels: [null],
    files: [file('docs/notes.md', 'modified')],
    expect: { state: null, errors: ['array of label-name strings'] },
  },
  {
    name: 'malformed changed-file metadata fails closed',
    labels: [noConsumerChangeLabel],
    files: [{ status: 'modified' }],
    expect: { state: null, errors: ['string filename and status fields'] },
  },
];

export function runPrStatePolicyFixtures() {
  return runNamedFixtures(prStatePolicyFixtures, runFixture, 'pr-state policy fixture');
}

function runFixture(fixture) {
  const verdict = evaluatePullRequestState({
    labels: fixture.labels,
    files: fixture.files,
    expectedFileCount: fixture.expectedFileCount ?? null,
  });
  return collectVerdictFailures(fixture.expect, verdict);
}

const verdictDialect = errorDialect({
  clean: 'a passing decision',
  rejection: 'a failing decision',
});

// Compares one policy verdict against a fixture's expectation. Exported so
// the GitLab input-adapter fixtures assert the replayed corpus the same way.
export function collectVerdictFailures(expect, { state, errors }) {
  const failures = [];
  if (state !== expect.state) {
    failures.push(`expected state ${JSON.stringify(expect.state)}, got ${JSON.stringify(state)}.`);
  }
  failures.push(...collectExpectationFailures(errors, expect.errors ?? [], verdictDialect));
  return failures;
}
