// Fixture-driven tests for the trusted three-state pull-request policy
// (ADR 0003).
//
// Every fixture is a captured-metadata scenario: label names plus GitHub
// changed-file entries, optionally split into pagination pages exactly as the
// REST API returns them. The runner concatenates the pages and asserts the
// policy verdict, covering every valid and invalid state combination, direct
// aggregate and record edits, the Release Preparation candidate shape, rename
// metadata, pagination, and fail-closed handling of unrecognized metadata.
// Nothing here talks to GitHub.

import {
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
// `{ state, errors: [substring, ...] }` for a failing one; every listed
// substring must appear in the reported errors.
const fixtures = [
  {
    name: 'one added fragment is a Consumer Change',
    labels: [],
    files: [fragmentAddition(), file('packages/angular/button/button.ts', 'modified')],
    expect: { state: 'consumer-change' },
  },
  {
    name: 'several fragments and a pending-fragment edit stay one Consumer Change',
    labels: [],
    files: [
      fragmentAddition('Breaking-20260724-120000.yaml'),
      fragmentAddition('Added-20260724-120001.yaml'),
      file('.changes/unreleased/Fixed-20260701-090000.yaml', 'modified'),
      file('packages/angular/menu/menu.ts', 'modified'),
    ],
    expect: { state: 'consumer-change' },
  },
  {
    name: 'a fragment renamed into place counts as an addition',
    labels: [],
    files: [file('.changes/unreleased/Added-20260724-120000.yaml', 'renamed', 'docs/draft-note.yaml')],
    expect: { state: 'consumer-change' },
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
    name: 'an empty unlabeled pull request fails',
    labels: [],
    files: [],
    expect: { state: null, errors: ['Declares no state'] },
  },
  {
    name: 'fragments combined with no-consumer-change fail',
    labels: [noConsumerChangeLabel],
    files: [fragmentAddition()],
    expect: { state: 'no-consumer-change', errors: ['while carrying "no-consumer-change"'] },
  },
  {
    name: 'fragments combined with release-preparation fail',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ extras: [fragmentAddition('Changed-20260724-130000.yaml')] }),
    expect: { state: 'release-preparation', errors: ['while carrying "release-preparation"'] },
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
    name: 'Release Preparation with a lockfile change fails',
    labels: [releasePreparationLabel],
    files: preparationCandidate({ extras: [file('pnpm-lock.yaml', 'modified')] }),
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
    name: 'a fragment addition on a later pagination page is still seen',
    labels: [],
    pages: [
      Array.from({ length: 100 }, (_, index) => file(`docs/examples/example-${index}.ts`, 'modified')),
      Array.from({ length: 100 }, (_, index) => file(`e2e/specs/spec-${index}.ts`, 'modified')),
      [file('apps/docs/src/app/app.ts', 'modified'), fragmentAddition()],
    ],
    expect: { state: 'consumer-change' },
  },
  {
    name: 'a violation on a later pagination page is still seen',
    labels: [noConsumerChangeLabel],
    pages: [
      Array.from({ length: 100 }, (_, index) => file(`docs/examples/example-${index}.ts`, 'modified')),
      [file(releaseChangelogPath, 'modified')],
    ],
    expect: { state: 'no-consumer-change', errors: ['generated Release Changelog'] },
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
  const failures = [];
  for (const fixture of fixtures) {
    for (const failure of runFixture(fixture)) {
      failures.push(`pr-state policy fixture "${fixture.name}": ${failure}`);
    }
  }
  return { failures, total: fixtures.length };
}

function runFixture(fixture) {
  const failures = [];
  const files = fixture.pages ? fixture.pages.flat() : fixture.files;
  const { state, errors } = evaluatePullRequestState({ labels: fixture.labels, files });

  if (state !== fixture.expect.state) {
    failures.push(`expected state ${JSON.stringify(fixture.expect.state)}, got ${JSON.stringify(state)}.`);
  }

  const expectedErrors = fixture.expect.errors ?? [];
  if (expectedErrors.length === 0) {
    if (errors.length > 0) {
      failures.push(`expected a passing decision; got: ${errors.join(' | ')}`);
    }
    return failures;
  }

  if (errors.length === 0) {
    failures.push(`expected a failing decision mentioning ${expectedErrors.join(', ')}; got a pass.`);
    return failures;
  }
  for (const needle of expectedErrors) {
    if (!errors.some((error) => error.includes(needle))) {
      failures.push(`expected an error mentioning "${needle}"; got: ${errors.join(' | ')}`);
    }
  }
  return failures;
}
