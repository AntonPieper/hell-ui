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

### Changed

- Upgraded `ng-primitives` from 0.117.2 to 0.123.0 and shrank Hell's
  version-bound compatibility seams to match
  (`docs/adr/ng-primitives-state-adapter.md` recheck, 2026-07-03):
  `HellSelect` now syncs form writes through the public
  `NgpSelectState.setValue(value, { emit: false })` / `setDisabled()` API
  instead of the internal state adapter; the popover close adapter
  (`ngp-popover-close-adapter.ts`) was deleted because ng-primitives now emits
  `openChange(false)` during trigger destroy while output bindings are still
  attached; the state adapter keeps only the combobox/radio channel writes and
  the non-focusing roving-focus tab-stop write. Hell pagination controls now
  read combined disabled state from the public `injectPagination*State()`
  providers and restore Enter/Space keyboard activation that regressed
  upstream (evidence: `packages/angular/pagination/pagination.spec.ts`,
  `packages/angular/internal/ng-primitives/ngp-state-adapters.spec.ts`).
  `HellControlledValueState` now absorbs user interactions through a linked
  signal when a control is not form-controlled, because ng-primitives >= 0.123
  latches any defined value input as permanently controlled — without this,
  unbound checkboxes stopped toggling (evidence:
  `packages/angular/checkbox/checkbox.spec.ts` "toggles an unbound checkbox").
  Natively disabled date-picker navigation buttons no longer carry a redundant
  `aria-disabled` attribute: ng-primitives >= 0.123 strips it from
  hard-disabled native buttons, so Hell's year-shift buttons and the a11y
  contracts now assert `disabled` + `data-disabled` instead (evidence:
  `e2e/date-picker-a11y-contracts.spec.ts`).

- Restyled `@hell-ui/angular/listbox` defaults to match the Select/Menu family:
  the listbox root is now a bordered elevated panel and options render as flat
  rows with soft active/selected backgrounds instead of per-option outlines.
- Redesigned the PDF viewer toolbar into grouped clusters, drove page
  navigation through the Hell pagination primitives, constrained the zoom
  select width, and replaced ad-hoc color mixes with semantic theme tokens.
- Extended the Glass, Aurora, Newspaper, High contrast, and Compact mono theme
  adapters to also treat Listbox panels/options, Toast surfaces, the Omnibar
  control and panel, and Date/Time input roots.

### Fixed

- Skeleton sizing: the recipe no longer hard-codes width/height utilities, so
  consumer `class`/`ui` sizing utilities (`h-5`, `size-10`, …) win over the
  stylesheet defaults.
- Menus opened from Composites: menus and submenus now join the browser
  Popover API top-most rendering context, so they paint above popover-based
  overlay panes such as the Omnibar panel, and property-bound
  `[hellSubmenuTrigger]` items now carry a static
  `data-hell-submenu-trigger` marker so submenu chevrons render.
- Omnibar: the actions strip only renders when action buttons register, so
  actionless omnibars no longer show an empty toolbar band.
- Date input: picker-panel overrides flow through the popover's Part Style Map,
  removing the doubled outline and padding ring around the embedded date
  picker.
- Time input: the native `type="time"` picker indicator is hidden in favor of
  the component's clock trigger, and trigger icons size their glyph to the
  icon box instead of clipping.
- Audio player: the speech-transcript strip anchors below the player again
  (its classes flow through the flyout's Part Style Map), sliders center
  vertically in the control rows, and slider thumbs reserve their overhang so
  they stop colliding with neighboring controls.
- Toast: the accent bar follows the themed corner radius via an inset overlay
  border, and the Glass skin now applies its translucency and backdrop blur to
  toasts.

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
