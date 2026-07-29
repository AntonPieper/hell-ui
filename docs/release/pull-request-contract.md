# The required pull-request contract

Every pull request into `main` has exactly one state — Consumer Change,
No Consumer Change, or Release Preparation (ADR 0003; the domain terms are
defined in `CONTEXT.md`). The states, the two CI checks that report them, and
what each check enforces are documented in
[`pull-request-states.md`](./pull-request-states.md). This document covers the
protection half: the protected `main` ruleset that makes those checks
required, how a contributor unblocks a failing pull request, and how a
maintainer changes and verifies the ruleset.

## Required checks

The protected `main` ruleset requires these status checks with a strict
up-to-date-branch policy:

| Check context | Proves |
| --- | --- |
| `Static contracts` | Lint, dead-code, architecture, and PR-state policy contracts |
| `Unit tests` | Unit test suite with coverage |
| `Build and API` | Library/docs build, API report, package audit |
| `E2E` | Every planned Playwright shard succeeded |
| `Package consumer` | Every consumer fixture against the packed tarball |
| `PR state (metadata)` | Exactly one pull-request state, decided from trusted GitHub metadata only ([`pull-request-states.md`](./pull-request-states.md)) |
| `Release notes (content)` | Read-only validation of the checked-out release-note artifacts: fragment schema, Released Version Notes, package-version agreement, deterministic Release Changelog regeneration |

GitHub refuses to merge a pull request until every required check succeeds
on a branch that is up to date with `main`.

## Fixing a blocked pull request

There are no exemptions and no placeholder fragments. Pick the remediation
that matches the failure:

- **Neither state** — the work has an adopter-visible outcome? Record it with
  `pnpm change` and commit the fragment. No adopter-visible outcome? Apply
  the `no-consumer-change` label — label changes re-run `PR state (metadata)`
  without a new commit.
- **Both states** — remove the label that does not apply, or drop the added
  fragments if the work truly has no Consumer Change.
- **Malformed fragment** — fix the YAML under `.changes/unreleased/` (allowed
  kind, nonblank body, nonblank `custom.migration` for Breaking) and
  revalidate locally with `pnpm test:changelog`.
- **Direct `CHANGELOG.md` edit** — revert the aggregate edit; record the
  Consumer Change as a fragment instead. Only a Release Preparation pull
  request regenerates the aggregate.
- **Invalid Release Preparation** — regenerate the candidate with
  `pnpm release:prepare` so the version record, package version, consumed
  fragments, and regenerated aggregate agree, and remove any unrelated
  changes from the pull request.

## The ruleset as code

`.github/rulesets/protect-main.json` is the checked-in source of truth for
the protected `main` ruleset, including the full required-check list above.
Changing the protection contract means changing that file in a reviewed pull
request, then applying it.

Maintainers apply the file to the live ruleset (rulesets are repository
settings, so this is an explicit API action, not CI automation):

```bash
gh api "repos/{owner}/{repo}/rulesets" --jq '.[] | [.id, .name] | @tsv'
gh api --method PUT "repos/{owner}/{repo}/rulesets/<id>" \
  --input .github/rulesets/protect-main.json
```

Apply it only after the workflows that provide every required context are on
`main`; a required context with no run blocks every merge.

## Verification evidence

```bash
pnpm verify:main-ruleset          # local + GitHub API evidence
pnpm verify:main-ruleset --local  # workflow job-name cross-check only
```

The command proves that every required check context in the checked-in
ruleset matches a static job name in a workflow triggered by `pull_request`
or `pull_request_target` (a required check that never runs on pull requests
would block every merge), and — via an authenticated `gh` CLI — that the
live ruleset matches the checked-in rules exactly, including bypass actors
and ref conditions, and that the `no-consumer-change` and
`release-preparation` labels exist with nonblank descriptions. It fails until the updated ruleset is
live; run it after every ruleset change to capture GitHub API evidence.
