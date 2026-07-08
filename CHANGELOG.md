# Changelog

Hell UI uses the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape plus the stage-specific SemVer rules in `docs/release/semver-policy.md`.
Every published `@hell-ui/angular` version gets a `## [x.y.z] - YYYY-MM-DD` section, and each version section cites the issue, pull request, or local evidence that explains the change.

## [Unreleased]

### Breaking changes

- `HellSlider`'s `size` input narrowed from `HellSize` to
  `Exclude<HellSize, 'xs' | 'xl'>` (`'sm' | 'md' | 'lg'`). The slider recipe
  and structural CSS only ever styled `sm`/`md`/`lg`, so `xs` and `xl`
  type-checked but silently rendered the base `md` visuals; the narrowed type
  matches the recipe coverage and the form-control convention (`HellInput`,
  `HellNativeSelect`, `HellTextarea`, `HellDateInput`, `HellTimeInput`).
  Consumers passing `size="xs"` or `size="xl"` now get a compile error and
  should pick `sm`/`lg`; rendered output is unchanged. Evidence:
  `etc/api-reports/hell-ui-angular-slider.api.md` and the `data-size`
  assertions in `packages/angular/slider/slider.spec.ts`.
- Moved `HellSpinner` out of `@hell-ui/angular/skeleton` into its own
  `@hell-ui/angular/spinner` entry point, per the Light Root Entry Point and
  import-path-first layout rules: the two modules solve different problems and
  each already had its own docs page. The spinner's Label Contract moves with
  it and is renamed to match its owning entry point — `HellSkeletonLabels`,
  `HELL_SKELETON_LABELS`, and `provideHellSkeletonLabels` become
  `HellSpinnerLabels`, `HELL_SPINNER_LABELS`, and `provideHellSpinnerLabels`
  (the `loading` label was only ever consumed by `hellSpinner`;
  `hellSkeleton` is `aria-hidden` and owns no text, so the skeleton entry
  point no longer exports a label contract). Spinner visuals also move to
  `@hell-ui/angular/spinner/styles.css`. Migration: import `HellSpinner`,
  `HellSpinnerPart`, `HellSpinnerUi`, and `HellSpinnerVariant` from
  `@hell-ui/angular/spinner`; rename label overrides to
  `provideHellSpinnerLabels({ loading })` from the same entry point; and add
  `@import '@hell-ui/angular/spinner/styles.css'` wherever the skeleton
  stylesheet previously covered spinners. No selectors, data attributes,
  parts, keyframes, or runtime behavior changed. Evidence:
  `packages/angular/spinner/spinner.spec.ts`,
  `etc/api-reports/hell-ui-angular-spinner.api.md`, and
  `pnpm run test:architecture`.
- Migrated the last two Style Opt-Out surfaces to typed Part Style Maps and
  removed the legacy `HellStyleable` base (and its `unstyled` input) from
  `@hell-ui/angular/core`. `HellAvatarGroup`, `HellAvatarGroupItem`, and
  `HellAvatarGroupOverflow` now expose `ui` inputs with `root` Public Parts and
  `data-slot`-keyed entrypoint styles; `HellPdfViewer` exposes a
  `HellPdfViewerPart` anatomy (`root`, `toolbar`, `toolbarGroup`, `divider`,
  `pageInput`, `toolbarText`, `zoomSelect`, `findBar`, `findInput`,
  `findCount`, `viewport`, `sidebar`, `thumb`, `thumbLabel`, `pageArea`)
  through its `ui` input while keeping the PDF Runtime, labels, and
  `--hell-pdf-*` variables unchanged. Replace `unstyled` opt-outs with `ui`
  part refinements; legacy `.hell-avatar-group*` chrome classes are gone and
  `.hell-pdf` chrome styling is re-keyed onto scoped `data-slot` selectors
  (private `.hell-pdf-*` scaffolding class names remain on non-contract
  DOM). Evidence: `packages/angular/avatar-group/avatar-group.spec.ts`,
  `packages/pdf-viewer/src/lib/pdf-viewer/pdf-viewer.spec.ts`, and
  `pnpm run test:architecture`.
- `HellAvatar` initials typography (size factor, weight, tracking, color)
  moved from the `root` recipe to the new `fallback` part. Consumers who
  restyled initials through `ui` root shorthand (e.g. `ui="font-bold"`) must
  target the `fallback` part instead: `[ui]="{ fallback: 'font-bold' }"`.
  Evidence: part assertions in `packages/angular/avatar/avatar.spec.ts`.
- Removed the vestigial `unstyled` input that trigger directives inherited
  from the internal `HellNativeInteractiveDisabledGuard` base (Tooltip,
  Popover, Dialog, Menu, and Flyout triggers). The input was never read by any
  component after the Part Style Map migration; disabled semantics and ARIA
  wiring are unchanged. Evidence: `grep -r "unstyled" packages/angular` and
  `pnpm run test:architecture`.

### Added

- More granular Public Parts across six entrypoints, all styleable through the
  existing `ui` Part Style Maps: `HellAvatar` gains `image` and `fallback`
  parts, `HellCheckbox` gains `indicator` (the check/dash glyph),
  `HellAudioPlayer` gains `captionsText` (the committed transcript leaf),
  `HellPaginationStrip` gains `control` (its owned nav/page buttons), and
  `HellSplitView` gains `backButton` (the compact-mode back control). The
  TanStack table shell adopts the Part Style Map contract for the first time:
  `HellTanStackTable` exposes `root`, `toolbar`, `footer`, and `scrollport`,
  and `HellTanStackPagination` exposes `root` and `pageSize` with camelCase
  `data-slot` values replacing the former kebab-case markers; the private
  `.hell-tanstack-table` and `.hell-tanstack-pagination` host classes are
  gone. Evidence: part assertions in each entrypoint's spec and
  `pnpm run test:architecture`.

### Fixed

- Multiple-select `[hellToggleGroup]` items no longer expose `role="radio"`
  and `aria-checked`; they are native toggle buttons announcing selection via
  `aria-pressed`, matching the WAI-ARIA toggle-button pattern. This works
  around ng-primitives (<= 0.124) hardcoding radio semantics on toggle-group
  items in both selection modes ([ng-primitives#813](https://github.com/ng-primitives/ng-primitives/issues/813));
  single-select groups keep radio items. Evidence: mode-specific assertions in
  `packages/angular/toggle/toggle.spec.ts` and
  `e2e/toggle-a11y-contracts.spec.ts`.

## [0.2.0] - 2026-07-03

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

- Removed the public `HellPartStyleable<Part>` inheritance base from
  `@hell-ui/angular/core` (and its `@hell-ui/angular/input` re-export). The
  Part-Class Pipeline is now the `hellPartStyler<Part>` composition factory:
  every styled module declares its own typed
  `readonly ui = input<HellUiInput<Part>>(undefined, { alias: 'ui' })` signal
  input and composes `hellPartStyler<Part>(this.ui, { defaultPart, recipe })`.
  The consumer-facing `[ui]` binding, string shorthand, part unions,
  `Hell<Component>Ui` types, recipes, and `data-slot` contract are unchanged;
  only code that subclassed `HellPartStyleable` breaks. Migration: replace
  `extends HellPartStyleable<Part>` + `defaultUiPart`/`recipe` members with the
  typed `ui` input plus a `hellPartStyler` field (see the amended
  `docs/adr/part-style-map.md`). This removes the protected abstract
  inheritance contract from every component declaration, so core styling
  changes no longer ripple through subclass d.ts surfaces.

- Replaced the central Label Contract bag in `@hell-ui/angular/core`
  (`HellLabels`, `HellLabelOverrides`, `HELL_LABELS`, `HELL_DEFAULT_LABELS`,
  `provideHellLabels`) with entry-point-owned label contracts. Each labeled
  entry point now exports its own interface, token, and provide function —
  for example `provideHellPaginationLabels({...})` from
  `@hell-ui/angular/pagination`, `provideHellSkeletonLabels({ loading })` from
  `@hell-ui/angular/skeleton`, and `provideHellPdfViewerLabels({...})` from
  `@hell-ui/pdf-viewer` (whose labels no longer live in the Angular core
  package). Core keeps only the `hellCreateLabels` factory. Migration: replace
  one `provideHellLabels({ group: {...} })` call with the matching
  `provideHell<Module>Labels({...})` calls, and import label interfaces such
  as `HellPaginationLabels` from their entry points instead of core. This
  removes core's compile-time knowledge of every component and stops
  unrelated label strings (including PDF viewer labels) from landing in every
  consumer bundle.

### Added

- Licensed the workspace and both published packages under MIT: a root
  `LICENSE` file, per-package `LICENSE` copies shipped in the packed tarballs,
  and `"license": "MIT"` metadata in `@hell-ui/angular` and
  `@hell-ui/pdf-viewer`. The pack audit now requires the packed `LICENSE`
  (evidence: `tools/package-pack-audit.mjs`).
- Added a GitHub Packages publish workflow so tagged releases publish both
  package tarballs to `npm.pkg.github.com` alongside the documented npmjs
  trusted-publishing path. The GitHub Packages copy is an owner-scope mirror
  (`@antonpieper/hell-ui-angular`, `@antonpieper/hell-ui-pdf-viewer`) because
  the `@hell-ui` GitHub namespace belongs to an unrelated account; consumers
  install it through npm aliases (evidence: `docs/release/npm-publishing.md`).
- Added unit coverage for the previously untested `@hell-ui/angular/avatar-group`
  entry point and the internal embedded-input UI contract (evidence:
  `packages/angular/avatar-group/avatar-group.spec.ts`,
  `packages/angular/internal/input/embedded-input-ui.spec.ts`).
- Added dedicated browser accessibility contracts for Pagination (aria labels,
  disabled edge controls, current-page announcement, keyboard activation) and
  Toggle (aria-pressed, disabled, group modes) (evidence:
  `e2e/pagination-a11y-contracts.spec.ts`, `e2e/toggle-a11y-contracts.spec.ts`).
- Added a Renovate configuration for automated dependency update proposals,
  with `ng-primitives` bumps gated behind dashboard approval per the
  version-bound seam ADR (evidence: `docs/adr/ng-primitives-state-adapter.md`).

- Expanded API-report guard coverage from 6 to 41 entry points: every
  non-experimental `@hell-ui/angular` entry point now has a committed API
  Extractor baseline under `etc/api-reports/`, so public-surface drift on
  select-adjacent, table, composite, and primitive entry points is reviewed
  like root/core. Four entry points (`/audio-player`, `/combobox`,
  `/date-input`, `/select`) are temporarily excluded through the documented
  `apiReportBlockedEntrypoints` policy because `@microsoft/api-extractor`
  crashes on their flattened declarations; the list is re-probed on extractor
  upgrades. Experimental surfaces stay out of stable reports by policy.
- Documented every human-authored export of the report-guarded surfaces
  (root, `/core`, `/input`, `/dialpad`, `/testing`) with TSDoc; those API
  reports now carry zero authored `ae-undocumented` warnings, and all
  entry-point label contracts, part unions, and Part Style Map types ship
  doc comments for IDE IntelliSense.
- Added this changelog, the alpha-to-beta SemVer policy, and a release dry-run
  guard that fails when the current package version has no changelog entry.
- Added the [first-beta consumer migration guide](docs/release/first-beta-consumer-guide.md)
  covering peer tiers, import paths, CSS imports, Part Style Maps, heavy
  features, experimental APIs, and production-readiness gaps.
- Added global Part Style Map architecture, API/report, package-consumer, and
  migration-guide gates for migrated Button, Input, and Dialpad styling
  contracts.

### Changed

- `@ng-icons/core` is now an optional peer dependency of `@hell-ui/angular`.
  Only icon-backed entry points (`/icon`, `/date-input`, `/date-picker`,
  `/dialpad`, `/time-input`, `/split-view`, `/audio-player`, and
  `@hell-ui/pdf-viewer`) need it at runtime; core, button, table, and other
  non-icon consumers now strict-peer install without any `@ng-icons/*` package.
  The required light peer stack is `@angular/common`, `@angular/core`,
  `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `ng-primitives`, and
  `rxjs` (forms/cdk/floating-ui are mandated by `ng-primitives` itself).
  Package-consumer scenarios, pack audit, and architecture gates now assert the
  icon tier separately (evidence: `pnpm test:architecture`,
  `pnpm test:ci-contract`, `pnpm test:package-consumer -- --minimal-deps`).

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

### Security

- Forced transitive `fast-uri` to a patched release (>= 3.1.2) via a pnpm
  override, clearing GHSA-q3j6-qgpj-74h6 and GHSA-v39h-62p7-jpjc from the
  docs-app build toolchain audit (evidence: `CHANGELOG.md` section 0.2.0,
  `pnpm audit --prod`).

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
