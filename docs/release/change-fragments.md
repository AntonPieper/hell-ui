# Change Fragment authoring

Hell UI records release notes as Changie-backed **Change Fragments**: one
reviewable YAML file per coherent **Consumer Change**, committed beside the
pull request that introduces it. The decision record is
`docs/adr/0003-changie-release-notes.md`; the domain terms are defined in
`CONTEXT.md`.

While the changelog migration is pending, the root `CHANGELOG.md` stays the
legacy hand-maintained Release Changelog. New Consumer Changes should be
recorded as fragments with `pnpm change` instead of growing the legacy
`## [Unreleased]` ledger; Release Preparation tooling assembles fragments into
Released Version Notes in follow-up work.

## Commands

```bash
pnpm change          # create one pending Change Fragment (interactive)
pnpm test:changelog  # validate the repository release-note state
```

`pnpm change` is the only contributor-facing fragment creation command. It
prompts for a kind and a consumer-facing body (plus migration guidance for
Breaking) and writes one file under `.changes/unreleased/`. It never batches a
version, edits `CHANGELOG.md`, commits, tags, pushes, or publishes. Changie's
`batch` and `merge` primitives stay private to release tooling; do not call
them locally.

Fragments are plain YAML files. After creation you may edit the file directly
— for example to rework the body into multiline prose or to expand migration
guidance beyond the single-line prompt — and `pnpm test:changelog` revalidates
it. Commit fragments with the change they describe.

## Consumer Change boundaries

A Change Fragment describes one coherent consumer outcome, not the work that
produced it. Write a fragment when adopters' code, behavior, styling,
dependencies, or migration work is affected: new or changed Package Entry
Points, public API or Part Style Map changes, behavior and accessibility
changes consumer tests may assert, CSS variable or stylesheet changes, and
peer-dependency changes.

One pull request may add zero, one, or several fragments. Several coherent
Consumer Changes get several fragments instead of one collapsed note; one
outcome spread across many commits gets exactly one fragment. Fragments carry
no issue, pull-request, author, component, project, or validation-evidence
fields — the pull request already records that engineering context.

## No Consumer Change

Work with no adopter-visible outcome gets no fragment — not a placeholder.
Examples:

- documentation-site content, examples, and guides;
- tests, CI workflows, benchmarks, and repository tooling;
- internal refactors that keep the public surface and behavior identical;
- dependency bumps with no consumer-visible behavior, styling, or peer-range
  change.

Per ADR 0003, such pull requests declare the explicit No Consumer Change state
(the `no-consumer-change` label) instead of adding fragments; CI enforcement
of the pull-request states lands with the PR-state contract work.

## Choosing a kind

The schema has exactly five kinds. Removals and deprecations are not separate
kinds:

| Kind | Use for | Pre-1.0 bump |
| --- | --- | --- |
| `Breaking` | Any Breaking Consumer Change, including removals of documented APIs, entry points, parts, or CSS contracts | minor |
| `Added` | New consumer-usable capability | minor |
| `Changed` | Changed behavior or contracts that stay compatible, including deprecations | patch |
| `Fixed` | Bug fixes adopters can observe | patch |
| `Security` | Security-relevant fixes or hardening | patch |

- **Removed is recorded as `Breaking`** so the removal carries migration
  guidance instead of a separate overlapping category.
- **Deprecated is recorded as `Changed`** — the API still works; describe the
  replacement in the body.
- Version selection never infers a Release Stage Promotion: before stable,
  `Breaking` selects a minor release, and `1.0.0` requires an explicit
  decision (see `docs/release/semver-policy.md`).

## Migration guidance for Breaking

Every `Breaking` fragment must carry nonblank migration guidance in
`custom.migration`. Write it for the adopter who upgrades: name what they
change in their code, templates, styles, or package configuration, and what
replaces the removed surface. Multiline guidance is welcome for complex
migrations — edit the fragment file when the prompt is too small.

## Concision is review-owned

There are no hard character limits; prompts only reject blank input. Keep
fragments concise through authoring and review instead:

- lead with the adopter outcome, not the implementation;
- leave out commit lists, file paths, test names, and validation evidence;
- prefer one or two sentences of prose per fragment, and let complex
  migrations take the space they need.

## Validation

`pnpm test:changelog` (also part of `pnpm release:dry-run`) enforces the
objective fragment contract: every pending fragment in `.changes/unreleased/`
must parse as YAML, use one of the five kinds, have a nonblank body, and — for
`Breaking` — nonblank `custom.migration` guidance. The same run proves the
real Changie configuration and validator against isolated repository fixtures,
and it keeps the legacy current-version changelog check green until the
migration completes.
