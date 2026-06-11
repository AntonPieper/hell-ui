# SemVer policy from alpha to stable

Hell UI follows SemVer 2.0.0, but the compatibility promise depends on the release stage. The package is currently **internal beta** and must not be described as production-ready until `pnpm production-ready:check` passes against fresh release-candidate evidence.

## Stage promises

| Stage | Version shape | Audience | SemVer promise |
| --- | --- | --- | --- |
| Alpha | `0.x.y-alpha.n` or unreleased local builds | Maintainers and throwaway prototypes | No compatibility promise. Any API, CSS token, peer tier, import path, behavior, or docs contract may change in any release. Changelog entries still call out known breaking changes so internal consumers can rebase deliberately. |
| Internal beta | `0.x.y` while access is controlled | Maintainer-owned apps and trusted design partners | Patch releases should avoid intentional breaks to documented stable APIs, but minor releases may still break beta or experimental entrypoints. Stable entrypoint breaks require a changelog `Breaking changes` note, migration guidance, and a slice/review trail. Consumers should pin exact or `~` ranges. |
| Public beta | `0.x.y-beta.n` or a clearly announced `0.x.y` public beta | External pilot consumers | Patch releases must be bugfix-only for documented stable and beta APIs. Minor releases may contain breaking changes only when the changelog and migration guide name the affected entrypoints, peer tiers, CSS imports, and deprecation/removal path. Deprecated APIs should survive at least one public-beta minor where practical. |
| Stable | `1.0.0` and later | General production consumers | Standard SemVer applies. Patch releases fix bugs without intentional breaking changes. Minor releases add compatible APIs. Major releases carry breaking changes and migration notes. Deprecated stable APIs should normally survive at least one minor before removal. |

## API stability overlay

The release stage defines the package-level promise. API comments and docs still classify exports as:

- **Stable**: covered by the strongest promise available for the current stage.
- **Beta**: intended for real use, but may still change at minor boundaries before `1.0.0`.
- **Experimental**: may change or disappear between any pre-1.0 releases; consumers must opt in deliberately.
- **Deprecated**: still present for compatibility, with changelog and migration notes required before removal.
- **Internal**: not public API, even if reachable through built files; static-contract checks should keep these out of public exports.

The entrypoint stability source of truth is `tools/entrypoint-manifest.mjs`. It records the tier, owning package, peer tier, consumer scenario, and API-report expectation for each importable TypeScript and style entrypoint.

## What counts as breaking

Record a breaking change when a consumer may need to edit code, styles, package manifests, or release assumptions. Examples:

- removing, renaming, or changing runtime behavior of a documented export;
- changing an entrypoint path or moving a feature between root, primitive, composite, feature, or separate-package boundaries;
- changing required peers or peer-version ranges for a documented tier;
- removing or renaming CSS files, CSS variables, data attributes, slots, or unstyled-mode hooks;
- changing keyboard/focus/ARIA behavior that consumer tests may assert;
- changing SSR/browser-only expectations, worker setup, global listeners, or optional feature isolation.

## Changelog contract

Hell UI uses `CHANGELOG.md` in Keep a Changelog shape:

- `## [Unreleased]` collects work after the current package version.
- Each package version must have `## [x.y.z] - YYYY-MM-DD` before a release tag or publish.
- Each entry cites the HELL slice IDs that explain the change.
- Breaking changes get a dedicated `### Breaking changes` section with affected entrypoints, migration steps, and the first version carrying the break.
- Release notes must keep alpha/internal-beta/public-beta/stable wording aligned with this policy and the production-readiness checklist.

`pnpm run release:dry-run --fast` and `pnpm run release:dry-run --full` run `pnpm test:changelog`. That check reads the published package source manifest at `projects/hell/package.json` and fails if the current package version lacks a matching changelog section or this policy is missing its required stage definitions.

## Promotion rules

A stage promotion is a release-management decision, not just a version bump.

- Alpha → internal beta: package-consumer smoke coverage and API category docs exist; known gaps are recorded.
- Internal beta → public beta: production-readiness checklist has no critical blockers, migration guide exists, and release dry-run evidence is fresh.
- Public beta → stable: stable API reports, docs, accessibility evidence, package-consumer scenarios, pack audit, trusted publishing, and changelog/migration history have held through at least one public beta cycle.

If evidence invalidates these promises, update this policy and the slice board in the same reviewed slice instead of silently weakening the contract.
