# Changelog

Hell UI uses the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape plus the stage-specific SemVer rules in `docs/release/semver-policy.md`.
Every published `@hell-ui/angular` version gets a `## [x.y.z] - YYYY-MM-DD` section, and entries cite the HELL slice IDs that caused the change.

## [Unreleased]

### Breaking changes

- HELL-047: Removed the accidental public hotkey helpers and listener services from `@hell-ui/angular` and `@hell-ui/angular/core`, and removed `matchHotkey` from `@hell-ui/angular/omnibar`. Consumers should stop importing Hell hotkey internals; use component opt-ins such as `HellOmnibar`'s `hotkey` input or `HellPdfViewer`'s `globalShortcuts` input, and keep app-wide shortcut policy in the host application.

### Added

- HELL-051: Added this changelog, the alpha-to-beta SemVer policy, and a release dry-run guard that fails when the current package version has no changelog entry.
- HELL-052: Added the [first-beta consumer migration guide](docs/release/first-beta-consumer-guide.md) covering peer tiers, import paths, CSS imports, unstyled mode, heavy features, experimental APIs, and production-readiness gaps.

## [0.1.0] - 2026-06-03

Initial internal-beta seed reconstructed from the slice board through HELL-050. This version is not a stable-production claim; see `docs/release/production-readiness-checklist.md` for the remaining release gate.

### Added

- HELL-004: Generated entrypoint manifests so public package entrypoints can be audited instead of hand-maintained.
- HELL-020, HELL-021, HELL-022: Made package-consumer checks observable, preflighted, and runnable by individual install scenario.
- HELL-023, HELL-024: Added pnpm pack/APF audit coverage and documented peer-dependency tiers for core, primitive, composite, table-utilities, code-editor, and PDF viewer entrypoints.
- HELL-025, HELL-026: Added API Extractor reports for stable public entrypoints and documented stable, beta, experimental, deprecated, and internal export categories.
- HELL-027, HELL-028, HELL-049: Added release dry-run evidence, trusted npm publishing/provenance workflow docs, and a production-readiness checklist gate.
- HELL-038, HELL-039, HELL-040, HELL-041, HELL-042, HELL-043: Added browser accessibility contracts, keyboard matrices, axe smoke checks, ARIA snapshots, and a component accessibility support matrix.
- HELL-030, HELL-032, HELL-050: Added docs bundle diagnosis, docs budget policy enforcement, and a static guard against eager heavy docs imports.

### Changed

- HELL-014: Documented Vitest parallelism policy so CI worker-pool mode and constrained serial agent mode are not confused.
- HELL-029, HELL-036, HELL-044, HELL-046, HELL-047, HELL-048: Recorded package-boundary and manual-runtime ownership decisions for heavy features, table utilities, resize behavior, global hotkeys, and browser-global usage.
- HELL-031: Reduced or isolated PDF viewer docs bundle cost so heavy demo code stays out of eager docs paths.
- HELL-045: Extracted an omnibar state/keyboard contract without changing public behavior.

### Fixed

- HELL-001: Stabilized serial unit-test execution for constrained agent environments.
- HELL-002, HELL-013, HELL-033, HELL-034, HELL-035: Centralized and guarded the version-bound ng-primitives state adapter, with explicit contract tests and ADR coverage.
- HELL-003, HELL-037: Reduced floating dismissal custom-code risk and recorded the delegation experiment path.
- HELL-006, HELL-007, HELL-008, HELL-009, HELL-010: Tightened accessibility contracts for named flyout/dialog surfaces, omnibar focus, interactive table rows, select labels, and grouped-control examples.

### Deprecated

- HELL-026: Deprecated aliases are explicitly tagged in API/docs comments instead of being silently treated as stable.

### Known gaps

- HELL-052, HELL-053, HELL-054, HELL-055, HELL-056, HELL-057, HELL-058, HELL-059, HELL-061 remain open follow-up slices before a public beta or stable-production claim.
- Hell UI stays **internal beta** until the production-readiness gate passes against fresh release-candidate evidence.
