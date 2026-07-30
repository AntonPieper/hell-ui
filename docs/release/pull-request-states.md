# Pull-request states

Every pull request has exactly one state (ADR 0003,
`docs/adr/0003-changie-release-notes.md`):

| State | You declare it by | Choose it when |
| --- | --- | --- |
| **Consumer Change** | adding one or more Change Fragments with `pnpm change` | adopters' code, behavior, styling, dependencies, or migration work is affected — see [`change-fragments.md`](./change-fragments.md) |
| **No Consumer Change** | applying the `no-consumer-change` label | docs-site content, tests, CI, tooling, internal refactors, and dependency bumps with no adopter-visible outcome |
| **Release Preparation** | applying the `release-preparation` label | the pull request carries one `pnpm release:prepare` candidate — see [`release-preparation.md`](./release-preparation.md) |

The states are mutually exclusive: CI rejects a pull request that claims both
(fragments plus either label, or both labels together) and one that claims
neither. Work with no adopter-visible outcome gets the label, never a
placeholder fragment.

## The two checks

Two independent CI checks report the contract, and each is visible on its
own:

- **`PR state (metadata)`** (`.github/workflows/pr-state.yml`) is the trusted
  half. It reads only GitHub metadata — the pull request's labels and
  changed-file paths — and decides that exactly one state is claimed. Because
  it is privileged (`pull_request_target` runs the base branch's workflow), it
  never checks out, imports, evaluates, or executes pull-request content;
  `pnpm run test:pr-states` proves that contract statically and drives the
  policy through captured-metadata fixtures.
- **`Release notes (content)`** (`.github/workflows/pr-content.yml`) is the
  read-only half. It checks out the proposed content with read-only
  permissions and runs `pnpm run test:changelog`: fragment schema, Released
  Version Notes shape, package-version agreement, and byte-for-byte Release
  Changelog regeneration.

Fragment validity is deliberately reported separately from PR-state validity:
a present but malformed fragment satisfies the metadata check's Consumer
Change state while the content check fails, so it can never pass overall.

### Re-triggering after label changes

Applying or removing `no-consumer-change` or `release-preparation` re-runs
`PR state (metadata)` automatically (the workflow listens to `labeled` and
`unlabeled` events), so fixing a state mistake never requires a new commit.
`Release notes (content)` does not depend on labels; it re-runs when commits
change the proposed content.

On a GitLab merge request the same contract runs as the `pr-state` and
`release-notes` pipeline jobs (`.gitlab/ci/mr-contract.yml`), with one known
degradation: **label edits do not start a new pipeline**. After applying or
removing a state label, re-run the merge-request pipeline — `pr-state` reads
the labels captured at pipeline creation, and its failure output repeats this
reminder. Fixing a state mistake still never requires a new commit.

## What the metadata check enforces

- Exactly one state: added fragments under `.changes/unreleased/`, or exactly
  one of the two labels.
- `CHANGELOG.md` is the generated Release Changelog; direct edits fail in
  every state except `release-preparation`.
- Released Version Notes records (`.changes/<version>.md`) are immutable
  outside `release-preparation`; an incorrect published record is corrected by
  a subsequent release.
- A `release-preparation` pull request must contain exactly the prepared
  candidate: one new `.changes/<version>.md` record, the consumed pending
  fragments, the updated `packages/angular/package.json` version, and the
  regenerated `CHANGELOG.md` — and nothing else. The content check then proves
  the versions agree and the aggregate regenerates byte-for-byte.

Editing or withdrawing an existing pending fragment (for example a typo fix
under `no-consumer-change`) is allowed in any state; only *added* fragments
claim the Consumer Change state.

## Staged activation

The checks land as ordinary, observable contexts first. Making them required
on protected `main` is a separate, staged ruleset change once both contexts
exist on `main` (see ADR 0003) — the checked-in ruleset, the activation
command, and the verification evidence are documented in
[`pull-request-contract.md`](./pull-request-contract.md).
