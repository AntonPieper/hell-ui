# Changelog

Hell UI uses the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape plus the stage-specific SemVer rules in `docs/release/semver-policy.md`.
Every published `@hell-ui/angular` version gets a `## [x.y.z] - YYYY-MM-DD` section, and each version section cites the issue, pull request, or local evidence that explains the change.

## [Unreleased]

### Breaking changes

- Removed the accidental public hotkey helpers and listener services from
  `@hell-ui/angular` and `@hell-ui/angular/core`, and removed `matchHotkey` from
  `@hell-ui/angular/omnibar`. Consumers should stop importing Hell hotkey
  internals; use component opt-ins such as `HellOmnibar`'s `hotkey` input or
  `HellPdfViewer`'s `globalShortcuts` input, and keep app-wide shortcut policy
  in the host application.
- Migrated `@hell-ui/angular/checkbox`, `@hell-ui/angular/radio`,
  `@hell-ui/angular/switch`, `@hell-ui/angular/toggle`, and
  `@hell-ui/angular/slider` from Style Opt-Out to Part Style Maps for PR #51.
  Affected surfaces are `Checkbox`, `NativeCheckbox`, `RadioGroup`, `Radio`,
  `NativeRadioGroup`, `NativeRadio`, `Switch`, `NativeSwitch`, `Toggle`,
  `ToggleGroup`, `ToggleGroupItem`, and `Slider`; replace `unstyled` styling
  opt-outs with `ui` string shorthand or part maps and import the corresponding
  entrypoint CSS for default visuals.
- Removed the Style Opt-Out `unstyled` input from Dialog, Toast, AudioPlayer,
  Omnibar, and CodeEditor as those surfaces move to typed Part Style Maps. Use
  each component's `ui` input and exported `Hell*Ui` type to customize public
  parts while keeping runtime ownership, portals, focus, media, search, and
  form contracts intact.

### Added

- Added this changelog, the alpha-to-beta SemVer policy, and a release dry-run
  guard that fails when the current package version has no changelog entry.
- Added the [first-beta consumer migration guide](docs/release/first-beta-consumer-guide.md)
  covering peer tiers, import paths, CSS imports, Part Style Maps, heavy
  features, experimental APIs, and production-readiness gaps.
- Added global Part Style Map architecture, API/report, package-consumer, and
  migration-guide gates for migrated Button, Input, and Dialpad styling
  contracts.

## [0.1.0] - 2026-06-03

Initial internal-beta seed. This version is not a stable-production claim; see
`docs/release/production-readiness-checklist.md` for the remaining production-readiness checklist.

### Added

- Generated entrypoint manifests so public package entrypoints can be audited
  instead of hand-maintained.
- Made package-consumer checks observable, preflighted, and runnable by
  individual install scenario.
- Added pnpm pack/APF audit coverage and documented peer-dependency tiers for
  core, primitive, composite, table, code-editor, and PDF viewer entrypoints.
- Added API Extractor reports for stable public entrypoints and documented
  stable, beta, experimental, deprecated, and internal export categories.
- Added release dry-run evidence, trusted npm publishing/provenance workflow
  docs, and a production-readiness checklist gate.
- Added browser accessibility contracts, keyboard matrices, axe smoke checks,
  ARIA snapshots, and a component accessibility support matrix.
- Added docs bundle diagnosis, docs budget policy enforcement, and a static
  guard against eager heavy docs imports.

### Changed

- Recorded package-boundary and manual-runtime ownership decisions for heavy
  features, table utilities, resize behavior, global hotkeys, and browser-global
  usage.
- Reduced or isolated PDF viewer docs bundle cost so heavy demo code stays out
  of eager docs paths.
- Extracted an omnibar state/keyboard contract without changing public behavior.

### Fixed

- Centralized and guarded the version-bound ng-primitives state adapter, with
  explicit contract tests and ADR coverage.
- Reduced floating dismissal custom-code risk and recorded the delegation
  experiment path.
- Tightened accessibility contracts for named flyout/dialog surfaces, omnibar
  focus, interactive table rows, select labels, and grouped-control examples.

### Deprecated

- Deprecated aliases are explicitly tagged in API/docs comments instead of being
  silently treated as stable.

### Known gaps

- Heavy/browser-only features, accessibility coverage, API reports,
  package-consumer evidence, pack audit, and release dry-run evidence must stay
  current before a public beta or stable-production claim.
- Hell UI stays **internal beta** until the production-readiness gate passes
  against fresh release-candidate evidence.
