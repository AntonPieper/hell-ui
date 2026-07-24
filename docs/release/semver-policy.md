# SemVer policy from alpha to stable

Hell UI follows SemVer 2.0.0, but the compatibility promise depends on the release stage. The package is currently **internal beta** and must not be described as production-ready until fresh release-candidate evidence (full release dry-run plus a full browser e2e pass) says otherwise.

## Stage promises

| Stage | Version shape | Audience | SemVer promise |
| --- | --- | --- | --- |
| Alpha | `0.x.y-alpha.n` or unreleased local builds | Maintainers and throwaway prototypes | No compatibility promise. Any API, CSS token, peer tier, import path, behavior, or docs contract may change in any release. Changelog entries still call out known breaking changes so internal consumers can rebase deliberately. |
| Internal beta | `0.x.y` while access is controlled | Maintainer-owned apps and trusted design partners | Patch releases should avoid intentional breaks to documented stable APIs, but minor releases may still break beta or experimental entrypoints. Stable entrypoint breaks require a changelog `Breaking changes` note, migration guidance, and review evidence. Consumers should pin exact or `~` ranges. |
| Public beta | `0.x.y-beta.n` or a clearly announced `0.x.y` public beta | External pilot consumers | Patch releases must be bugfix-only for documented stable and beta APIs. Minor releases may contain breaking changes only when the changelog and migration guide name the affected entrypoints, peer tiers, CSS imports, and deprecation/removal path. Deprecated APIs should survive at least one public-beta minor where practical. |
| Stable | `1.0.0` and later | General production consumers | Standard SemVer applies. Patch releases fix bugs without intentional breaking changes. Minor releases add compatible APIs. Major releases carry breaking changes and migration notes. Deprecated stable APIs should normally survive at least one minor before removal. |

## API stability overlay

The release stage defines the package-level promise. API comments and docs still classify exports as:

- **Stable**: covered by the strongest promise available for the current stage.
- **Beta**: intended for real use, but may still change at minor boundaries before `1.0.0`.
- **Experimental**: may change or disappear between any pre-1.0 releases; consumers must opt in deliberately.
- **Deprecated**: still present for compatibility, with changelog and migration notes required before removal.
- **Internal**: not public API, even if reachable through built files; architecture checks should keep these out of public exports.

## What counts as breaking

Record a breaking change when a consumer may need to edit code, styles, package manifests, or release assumptions. Examples:

- removing, renaming, or changing runtime behavior of a documented export;
- changing an entrypoint path or moving a feature between root, primitive, composite, feature, or separate-package boundaries;
- changing required peers or peer-version ranges for a documented tier;
- removing or renaming CSS files, CSS variables, data attributes, slots, or unstyled-mode hooks;
- changing keyboard/focus/ARIA behavior that consumer tests may assert;
- changing SSR/browser-only expectations, worker setup, global listeners, or optional feature isolation.

## Changelog contract

The root `CHANGELOG.md` is the generated Release Changelog (ADR 0003): Changie
assembles it deterministically from the immutable Released Version Notes
records under `.changes/`, newest first, starting at the `0.2.0` internal-beta
baseline record. Earlier history, including `0.1.0`, lives in Git history at
the `v0.2.0` tag.

- The aggregate starts with `# Changelog` and proceeds directly to the newest
  release; it carries no introduction and no `Unreleased` section.
- Each release renders as `## [x.y.z] - YYYY-MM-DD` with only its nonempty
  kind sections, in this order: `Breaking changes`, `Added`, `Changed`,
  `Fixed`, `Security`.
- Breaking changes carry the migration guidance authored in their Change
  Fragments.
- Pending Consumer Changes are Change Fragments under `.changes/unreleased/`
  (see [`change-fragments.md`](./change-fragments.md)); they appear in the
  Release Changelog only when Release Preparation assembles a version.
- Release notes must keep alpha/internal-beta/public-beta/stable wording aligned with this policy.

`pnpm release:dry-run` and the release workflow run `pnpm test:changelog`. That check reads the published package source manifest at `packages/angular/package.json` and fails when the current package version lacks a `.changes/<version>.md` Released Version Notes record or the `0.2.0` baseline record is missing; it validates every pending Change Fragment, regenerates the Release Changelog from the committed records and fails on any byte-level disagreement with `CHANGELOG.md`, and proves the fragment and merge tooling against isolated repository fixtures.

## Promotion rules

A stage promotion is a release-management decision, not just a version bump.

- Alpha → internal beta: package-consumer smoke coverage and API category docs exist; known gaps are recorded.
- Internal beta → public beta: release evidence has no critical blockers, migration guide exists, and release dry-run evidence is fresh.
- Public beta → stable: stable API reports, docs, accessibility evidence, consumer fixtures, pack audit, trusted publishing, and changelog/migration history have held through at least one public beta cycle.

If evidence invalidates these promises, update this policy and the release
evidence in the same reviewed change instead of silently weakening the contract.
