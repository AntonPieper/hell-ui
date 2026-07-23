# ADR: Changie release-note source and projections

- Status: Accepted
- Date: 2026-07-23

## Context

Hell UI's hand-edited `CHANGELOG.md` grew into a 1,989-line engineering
evidence ledger. Its unreleased section alone contains 147 top-level bullets
for 254 commits after `v0.2.0`, mixing consumer outcomes with implementation
detail, validation evidence, and intermediate pre-release churn. That shape is
costly to review, creates a shared merge-conflict surface, and obscures the
migration information an adopter actually needs.

The package is still pre-1.0 and has one maintained release train. Git and the
published tag preserve the old engineering history, so the release-note
contract can take a hard `0.2.0` baseline and describe later releases as net
consumer-visible deltas. Release notes must also remain aligned with the
existing gated, multi-registry publish workflow without becoming separate
editable copies on npm, the docs site, or GitHub.

## Decision

### Record Consumer Changes with Changie

Use Changie-backed **Change Fragments** as the only unreleased release-note
source. One fragment represents one coherent **Consumer Change**, not one pull
request, commit, file, test, or validation record. A pull request may therefore
add zero, one, or several fragments.

Fragments use five kinds:

- `Breaking` and `Added` select a minor bump before `1.0.0`.
- `Changed`, `Fixed`, and `Security` select a patch bump.
- `Removed` is expressed as `Breaking`; `Deprecated` is expressed as
  `Changed`.

Every fragment has a nonblank consumer-facing body. A `Breaking` fragment also
has a mandatory nonblank migration instruction. Fragments contain no issue,
pull-request, author, component, project, or validation-evidence fields. Hard
character limits are rejected: Changie keeps `minLength: 1` for prompt
feedback, while concision is an authoring and review responsibility.

Changie must never infer a **Release Stage Promotion**. Before stable, breaking
changes select a minor release rather than `1.0.0`; stable promotion requires
an explicit version and a separate compatibility decision.

### Require exactly one pull-request state

Every pull request has exactly one of these mutually exclusive states:

1. it adds one or more valid Change Fragments;
2. it carries `no-consumer-change`; or
3. it carries `release-preparation`.

CI rejects both and neither. Fragment validation is separate from state
enforcement. A trusted `pull_request_target` workflow inspects only GitHub file
and label metadata without checking out or executing pull-request code. A
read-only `pull_request` workflow validates the proposed fragments and
deterministic release artifacts. Both checks become required by the protected
`main` ruleset after the workflows land on `main`.

Direct edits to `CHANGELOG.md` are prohibited outside Release Preparation.
Dependency, documentation, test, and internal-only pull requests use
`no-consumer-change`; they do not create placeholder fragments or receive
special exemptions.

### Make Release Preparation an artifact-only transaction

Release Preparation remains maintainer-driven. The public command surface is:

```text
pnpm change
pnpm test:changelog
pnpm release:prepare [version]
pnpm release:dry-run
```

Changie's `new`, `batch`, and `merge` commands remain private implementation
details. Publishing remains CI-only.

`pnpm release:prepare` uses automatic version selection unless an explicit
version is supplied, consumes pending fragments, creates exactly one
`.changes/<version>.md`, updates the published package manifest to the same
version, regenerates the root changelog, and runs the narrow changelog checks.
It does not commit, tag, push, publish, or silently roll back a failed
generation.

A release-preparation check regenerates `CHANGELOG.md` from the committed
Changie records and requires byte-for-byte equality. It also proves that the
single new version file accounts for the consumed fragments.

A `release-preparation` pull request may change only:

- `CHANGELOG.md`;
- the published package manifest;
- one newly generated Released Version Notes file; and
- the consumed files under `.changes/unreleased/`.

Source, documentation, configuration, lockfile, expired migration-guard, and
other cleanup changes must land first in independently classified pull
requests.

Use one release train:

```text
.changes/
|-- header.tpl.md
|-- 0.2.0.md
`-- unreleased/
    `-- <generated fragments>.yaml
```

The `0.2.0` file is a short internal-beta baseline. The old `0.1.0` detail and
the hand-edited unreleased ledger are not archived elsewhere; Git history
retains them. Migration fragments describe only the net delta from `v0.2.0` to
the release candidate, grouping intermediate work by adopter outcome.

### Keep one source with deterministic projections

`.changes/<version>.md` is the immutable **Released Version Notes** source at
the locked release tag. The root `CHANGELOG.md` is the canonical generated
aggregate of those records, newest first. It starts with `# Changelog`, has no
explanatory introduction or `Unreleased` section, uses ISO release dates, and
renders only nonempty kinds in this order:

1. `Breaking changes`
2. `Added`
3. `Changed`
4. `Fixed`
5. `Security`

The GitHub Release body is a byte-for-byte **Release Projection** of the tagged
Released Version Notes. Do not copy the changelog into npm tarballs or the docs
site, attach custom GitHub Release assets, or independently author GitHub
release prose.

### Publish projections last

A real tag-triggered release runs the release gate, publishes GitHub Packages,
then publishes every other configured **Required Registry**, and only then
creates the GitHub Release. npmjs is outside the barrier while
`HELL_ENABLE_NPMJS_PUBLISH` is disabled; once enabled, it becomes required,
runs after GitHub Packages, and blocks the GitHub Release when skipped,
cancelled, or failed. Future required private registries follow the same rule.
Disabled optional registries do not block. Manual workflow dispatch remains
evidence-only.

For a real release, CI:

1. creates a draft GitHub Release from the tagged version file;
2. verifies its tag, title, target commit, exact body, prerelease
   classification, lack of custom assets, and repository immutability policy;
3. publishes it only after every Required Registry succeeds; and
4. treats a rerun as successful only when an existing release matches exactly.

Every `0.x.y` GitHub Release is a prerelease until the explicit `1.0.0` Release
Stage Promotion. Versions with a prerelease suffix remain prereleases at any
major version.

Enable GitHub's native immutable-release setting to lock release tags and
assets and produce an attestation. GitHub still permits editing release titles
and notes, so a read-only `release: edited` workflow detects body or metadata
drift against the tagged version file. Automation never rewrites a published
release. An administrator may only restore an accidentally drifted body to the
exact tagged bytes; if the tagged notes themselves are wrong, publish a
corrective patch release.

## Consequences

- The root workspace depends on `changie@^1.25.1` and directly declares the
  YAML parser used by the objective fragment validator.
- The validator enforces only allowed kinds, a nonblank body, and a mandatory
  nonblank migration for `Breaking`; Changie owns its file structure and
  template rendering.
- `packages/angular/package.json` is no longer edited manually for ordinary
  releases; Changie's merge replacement owns its version.
- The old `tools/check-changelog.mjs` contract changes from finding a
  hand-written current-version heading to validating fragments, version
  agreement, and deterministic generated projections.
- Two repository labels, two required PR checks, native release immutability,
  and a staged ruleset activation become part of the release-management
  surface.
- The workflow introducing the trusted enforcement check must merge before
  that check can be required. Existing pull requests must then rebase, choose
  one state, and replace direct changelog edits with fragments.

## Rejected alternatives

- Keep the hand-edited Keep a Changelog evidence ledger.
- Generate release notes from commit messages or pull-request chronology.
- Require one fragment per pull request or placeholder fragments for internal
  work.
- Keep an `Unreleased` section synchronized with independent fragments.
- Preserve a second archive of the pre-1.0 ledger.
- Publish changelog copies in npm packages or the docs site.
- Create GitHub Releases before registry publication, attach package assets,
  generate independent GitHub prose, or repair published notes automatically.
- Expose local batch, merge, or publish commands as contributor-facing release
  APIs.
