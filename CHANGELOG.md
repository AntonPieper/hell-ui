# Changelog

Hell UI uses the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) shape plus the stage-specific SemVer rules in `docs/release/semver-policy.md`.
Every published `@hell-ui/angular` version gets a `## [x.y.z] - YYYY-MM-DD` section, and each version section cites the issue, pull request, or local evidence that explains the change.

## [Unreleased]

### Added

- Added `hell-menu-options` to the menu entry point: a data-driven checkable
  option list rendering one checkbox menu item per core `HellOption`
  (`{ value, label, disabled? }`) with a controlled `selected` model and
  `selectedChange` output. Disabled options render but cannot be toggled, so a
  consumer enforces a selection floor by disabling still-selected options. It
  composes freely inside a `[hellMenu]` panel next to hand-written items,
  sections, and separators, and joins `HELL_MENU_DIRECTIVES`. Closes #150
  (spec #147). Evidence: menu unit suite, docs data-driven options example.
- Brought the select, combobox, date-input, audio-player, and TanStack table
  shell (including its virtual-rows strategy) entry points under API reports:
  59 entry points are now guarded. The api-extractor "Unable to follow symbol"
  crashes came from ng-packagr's d.ts flattener shipping unbound identifiers
  for types inferred through internal entry points; those members now carry
  explicit annotations, which also fixes the shipped typings for consumers
  compiling without `skipLibCheck`. Closes #148.

- Extended Filter Bar with the remaining `entity` and `dateRange` field kinds.
  Entity editors orchestrate a consumer-owned `HellSearchSource` with debounce,
  cancellation, stale-result protection, loading/empty/error states, and a
  structured `{ kind: 'entity', id, label }` token value that remains useful
  offline. Date ranges compose two `HellDateInput` controls, support open-ended
  local-calendar ranges, and serialize as
  `{ kind: 'dateRange', from: string | null, to: string | null }`. Both kinds use
  the same create/edit/Escape/focus-restoration lifecycle as core fields, including
  nested portaled surfaces registered through the Filter Bar floating scope.
  Docs add a simulated server-dispatch recipe; unit, browser, package-consumer,
  API-report, and axe contracts cover the widened public seam. Closes #118
  (spec #100).
- Added the `@hell-ui/angular/filter-bar` Package Entry Point (Composite): a
  keyboard-first `hell-filter-bar` for declared `text` and fixed `options`
  fields plus first-class free text on the reserved `$text` key. The complete
  `{ key, operator: 'eq', value }[]` is controlled and serializable; the bar
  emits whole next arrays only on commit, removal, clear-all, or opt-in
  debounced live free text, and owns no fetching, persistence, or engine state.
  Its field combobox always highlights a visible outcome (including “Search
  for …”), so Enter never silently reinterprets a field name; `field:` is an
  accelerator into the same editor. One per-kind editor state serves create at
  the input and edit in a token-anchored Popover. Escape consumes one layer,
  Backspace-on-empty removes only the last token in the picker, and token
  navigation/removal composes the Chip Set contract. The Label Contract covers
  built-in copy and polite add/update/remove/clear announcements; the Part Style Map
  covers the flat token, control, editor, panel, option, clear, and live-region
  anatomy. The delegated Combobox wrapper now exposes a `wrapNavigation` input for
  clamped Arrow-key flows while keeping active-descendant ownership in ng-primitives.
  Docs ship a real TanStack Table Shell Filter Controls recipe.
  Evidence: `packages/angular/filter-bar/filter-bar.spec.ts`,
  `packages/angular/filter-bar/filter-bar.state.spec.ts`,
  `e2e/filter-bar-contracts.spec.ts`, the docs page at
  `/components/filter-bar`, and its axe WCAG A/AA smoke coverage. Closes #117
  (spec #100).
- Added the `@hell-ui/angular/page-header` Package Entry Point (Composite): a
  `hell-page-header` slot-based page chrome with `root`, `leading`, `titleGroup`,
  `title`, `meta`, `description`, and `toolbar` Public Parts. Everything is
  content projection of real Hell components — no config-array API. The title is
  marked with `hellPageHeaderTitle` and exposed as the page's main heading via
  `role="heading"` at a configurable `level` (default `1`); badges go in
  `hellPageHeaderMeta`, a supporting line in `hellPageHeaderDescription`, and
  trailing actions (typically `hell-toolbar`) in `hellPageHeaderToolbar`. The
  optional `hell-page-header-back` affordance renders a ghost icon button with an
  inline chevron (no icon-package dependency), takes its accessible name from the
  page-header Label Contract (`provideHellPageHeaderLabels`), and emits a `back`
  event only — routing stays with the app. Breadcrumbs and the back button
  compose into the responsive `leading` region. Refine the parts through the Part
  Style Map and import `@hell-ui/angular/page-header/styles.css` for the default
  layout. Evidence: `packages/angular/page-header/page-header.spec.ts`,
  `e2e/page-header-contracts.spec.ts`, the docs page at `/components/page-header`
  (list-screen and detail-screen anatomies), and its axe WCAG A/AA smoke
  coverage. Closes #116 (spec #96).
- Added the `@hell-ui/angular/multi-select-menu-button` Package Entry Point
  (Composite): `hell-multi-select-menu-button` is a button that opens a menu of
  checkable options and reflects the selected count on its trigger. Selection is
  controlled — the consumer binds `options` (`{ value, label, disabled? }[]`)
  and `selected` (`value[]`) and owns the array; toggling an option keeps the
  menu open (composed menu-item-checkbox semantics), emits the whole next
  selection through `selectedChange`, never mutates the consumer's array, and
  emits nothing on first render. `minSelected` is a deselection floor that
  disables the still-selected options once the selection reaches it (so a table
  can never reach zero visible columns); an opt-in `resettable` item emits a
  distinct `reset` event with its label behind the Label Contract
  (`provideHellMultiSelectMenuButtonLabels`). The trigger reflects state through
  the `count` badge part and `data-selection-count` / `data-has-selection`
  attributes; refine the `root`, `trigger`, and `count` parts through the Part
  Style Map, and import `@hell-ui/angular/multi-select-menu-button/styles.css`
  for the default visuals. Docs ship a TanStack Table Shell column-visibility
  recipe (respecting `enableHiding`) with a localStorage persistence snippet.
  The composed menu also restores its documented printable-key typeahead while
  leaving roving focus, activation, dismissal, and nested menus delegated to
  ng-primitives.
  Evidence: `packages/angular/multi-select-menu-button/multi-select-menu-button.spec.ts`,
  `e2e/multi-select-menu-button-contracts.spec.ts`, the docs page at
  `/components/multi-select-menu-button`, and its axe WCAG A/AA smoke coverage.
  Closes #109 (spec #98).
- Added the `@hell-ui/angular/file-upload` Package Entry Point (Composite): a
  drop-zone composite with a managed, fully controlled file list. It performs no
  HTTP — the consumer holds `items: HellFileUploadItem[]` and feeds per-file
  `status`/`progress`/`error` in, while `filesAdded` (validated files),
  `rejected` (file + machine-readable `'type' | 'size' | 'count'` reason),
  `removed`, and `retried` are the whole seam (Hell owns the chrome, the app owns
  the engine). Validation (accept extensions and MIME, `maxBytes`, `maxFiles`)
  runs identically for the drag-drop and Browse paths; violations emit `rejected`
  and render a transient inline rejection row with the Label Contract reason (not
  a toast), and the hidden input's `multiple` is derived from `maxFiles`. Browse
  is a real `HellButton`, per-file progress uses the progress primitive's
  progressbar semantics, and additions/rejections/completion or failure
  transitions are announced politely through the CDK LiveAnnouncer. Remove and
  Retry render built-in CSS-mask glyphs (`--hell-icon-close` and a new
  `--hell-icon-refresh` token) on empty buttons, following the chip/alert glyph
  mechanism. Refine the `root`, `dropzone`, `browse`, `list`, `item`,
  `itemIcon`, `itemName`, `itemMeta`, `itemProgress`, `itemError`, `itemRemove`,
  and `itemRetry` parts through the Part Style Map, override built-in strings with
  `provideHellFileUploadLabels`, and import
  `@hell-ui/angular/file-upload/styles.css` for the default visuals. Evidence:
  `packages/angular/file-upload/file-upload.spec.ts`,
  `e2e/file-upload-a11y-contracts.spec.ts`, the docs page at
  `/components/file-upload` (including a mock-HTTP upload adapter reference
  integration), and its axe WCAG A/AA smoke coverage. Closes #110 (spec #99).
- Added `HELL_CHIP_DIRECTIVES` to `@hell-ui/angular/chip` (array of
  `HellChipSet`, `HellChip`, and `HellChipRemove`) for bulk `imports`, matching
  the alert/empty-state/toolbar convention, plus a `--hell-icon-close` token and
  "Conditional content" docs sections on the alert and empty-state pages that
  document the `@if` + `ngProjectAs` content-projection recipe. See #135.
- Added a chips presentation to the `@hell-ui/angular/combobox` Package Entry
  Point: a `hellComboboxChips` directive, placed inside the control before
  `hellComboboxInput`, that renders each multiple-mode selection as a removable
  chip composed from the `@hell-ui/angular/chip` primitive (`hellChip` /
  `hellChipRemove` / `HellChipSet`), cementing the combobox → chip dependency
  direction. The selected chips form one roving tab stop with Arrow/Home/End
  navigation, Delete/Backspace removal, and focus continuity after removal.
  Removal — via a chip's remove button or Backspace in the empty input — routes
  through the combobox selection state, so the emitted form value, the options'
  `aria-selected` state, and the rendered chips never diverge, even for values
  whose option has been filtered out of the dropdown; a disabled combobox
  disables every chip's remove button. Label chips with `[displayWith]`, size
  them with `[size]`, and refine the `root` and `chip` parts through the Part
  Style Map (each chip's remove button ships the chip primitive's built-in `×`
  glyph and derives its `Remove {label}` name from the chip's text). The
  combobox stylesheet carries the composed chip stylesheet, so a packed
  consumer importing only `@hell-ui/angular/combobox/styles.css` gets the chip
  recipe and built-in glyph. `HELL_COMBOBOX_DIRECTIVES` now includes
  `hellComboboxChips`, and the entry point exports `HellComboboxChipsPart` /
  `HellComboboxChipsUi`. Existing non-chips combobox behavior is unchanged.
  Evidence: `packages/angular/combobox/combobox.spec.ts`,
  `e2e/combobox-chips-a11y-contracts.spec.ts`, the assign-groups example on the
  docs page at `/components/combobox`, and its axe WCAG A/AA smoke coverage.
  Closes #114 (spec #95).
- Added an `autoGrow` opt-in to `HellTextarea` in the `@hell-ui/angular/input`
  Package Entry Point: the native `<textarea>` grows with its content via CSS
  `field-sizing: content` — no resize observers, no per-keystroke JavaScript
  measurement, no animated height. It reflects `data-auto-grow` and disables the
  native resize handle while active (the two affordances conflict); bound the growth
  in CSS with `min-block-size` for the minimum (`rows` is not a floor under
  `field-sizing: content`) plus `max-block-size` and `overflow-y: auto` for the
  maximum so a long paste scrolls internally. Progressive enhancement:
  browsers without `field-sizing` degrade to a normal fixed-size textarea with no
  JavaScript polyfill. Evidence: `packages/angular/input/input.spec.ts`, the
  docs page at `/components/input` (Auto-grow example), and its axe WCAG A/AA
  smoke coverage. Closes #112 (spec #101).
- Added the `@hell-ui/angular/alert` Package Entry Point (Styled Primitive): a
  persistent inline messaging surface with `info`/`success`/`warning`/`danger`
  variants reflected as `data-variant` and colored via Semantic Theme Tokens, a
  default per-variant glyph that is replaceable via a projected `hellAlertIcon`
  and removable via `[showIcon]="false"`, projected `hellAlertTitle`,
  `hellAlertDescription`, and `hellAlertActions` directives, and a full-width
  `layout="banner"` variant. An opt-in `hellAlertDismiss` button emits the
  alert's `dismissed` event without self-removing (the consumer owns visibility)
  and takes its accessible name from the alert Label Contract
  (`provideHellAlertLabels`). Alerts carry no live-region semantics by default;
  async insertions pair with an explicit `role` or the toast announcer.
  Refine the `root`, `icon`, and `content` parts through the Part Style Map, and
  import `@hell-ui/angular/alert/styles.css` for the default visuals. Evidence:
  `packages/angular/alert/alert.spec.ts`, `e2e/alert-a11y-contracts.spec.ts`,
  the docs page at `/components/alert`, and its axe WCAG A/AA smoke coverage
  (issues #91, #102).
- Added the `@hell-ui/angular/confirm` Package Entry Point (Composite) on the
  prompt + action model: `injectHellConfirm()` returns
  `(prompt, action?, cancelAction?) => Promise<boolean>`, opening one accessible
  modal on the dialog primitive, and `injectHellChoice()` returns a typed N-way
  `(prompt, actions) => Promise<K | null>` for decisions with more than two
  honest answers. A prompt is a string or `{ title, description? }`; actions are
  opaque `HellConfirmAction` values built only through combinators aligned with
  the button variant vocabulary — `hellPrimaryAction`, `hellSecondaryAction`,
  `hellDestructiveAction` (destructive ⇒ initial focus on cancel), the
  `hellCountdownAction(seconds, action)` decorator (disables the button with a
  visible Label-Contract-formatted suffix; gating only, never auto-confirms),
  and `hellChoiceAction(key, action, { dismissEquivalent? })`. Promises always
  resolve — Escape, backdrop, and cancel resolve `false`, and a dismissed
  choice resolves its single dismiss-equivalent key, else `null` — and modal
  calls queue so two confirm surfaces never show at once. `confirm()` without
  an action falls back to the Label Contract's default primary action, and
  `cancelAction` replaces the default cancel button per call. All default
  strings sit behind the `HELL_CONFIRM_LABELS` Label Contract
  (`provideHellConfirmLabels`). Docs cover basic, destructive, countdown, and
  `choice()` unsaved-changes examples plus a `choice()`-based unsaved-changes
  route-guard recipe, all under axe WCAG A/AA smoke coverage. Ships
  `@hell-ui/angular/confirm/styles.css`. See #104 and #131 (spec #93).
- Added the `@hell-ui/angular/empty-state` Package Entry Point: a
  `hell-empty-state` owned-anatomy component with `root`, `media`, `title`,
  `description`, and `actions` Public Parts. A `preset`
  (`noData | noResults | error | forbidden`) supplies a default glyph and Label
  Contract copy (overridable via `provideHellEmptyStateLabels` or by projecting
  `hellEmptyStateMedia`/`Title`/`Description`/`Actions`), the title promotes to a
  heading via `headingLevel`, and the component owns container-filling centering.
  The TanStack Table Shell's default empty chrome (`HellDefaultTableEmptyState`)
  now recomposes this component. Closes #103.
- Added the `@hell-ui/angular/chip` Package Entry Point (Mixed Entry Point):
  `hellChip` (span/button/anchor host with interactive semantics only on
  interactive hosts, `variant`/`size` aligned with `hellTag`, `data-variant`/
  `data-size`/`data-disabled`, and a `(remove)` output), `hellChipRemove` (a
  real sibling `button` named `Remove {label}` through the Label Contract and
  disabled with its chip), and `hellChipSet` (a single tab stop with roving
  arrow/Home/End focus, `Delete`/`Backspace` removal, and focus continuity to a
  neighbouring chip or the set after removal). Removal is event-only; the
  consumer owns the collection. See issue #106 (spec #95).
- Added an imperative popconfirm to `@hell-ui/angular/confirm`:
  `injectHellPopconfirm()` returns
  `(anchor, prompt, action?) => Promise<boolean>` for anchored, in-context
  confirmations such as a row delete — the same linear control flow as
  `injectHellConfirm`, rendered on the popover primitive against the passed
  anchor element. Focus moves into the panel on open and returns to the anchor
  on close, Escape or an outside click dismiss it through the shared Floating
  Dismissal rules and resolve `false`, and the panel joins the surrounding Hell
  Floating Scope. One popconfirm is open at a time — opening one dismisses
  another and resolves it `false`, so armed deletes never accumulate.
  Destructive and countdown-gated actions start focus on cancel, mirroring the
  modal, and the default action plus cancel labels come from the
  `HELL_CONFIRM_LABELS` Label Contract. Docs gain a canonical row-delete
  example under `/components/confirm` with axe WCAG A/AA smoke coverage.
  Evidence: `packages/angular/confirm/popconfirm.spec.ts` and
  `e2e/confirm-a11y-contracts.spec.ts`. See #113 and #131 (spec #93).
- Added the `@hell-ui/angular/number-input` Package Entry Point (Styled
  Primitive), joining the Typed Value Input family alongside date and time
  input. `HellNumberInput` binds a real `number | null` through
  `ControlValueAccessor` + `Validator`: a text field (numeric/decimal
  `inputmode`, not native `type="number"`) with APG spinbutton semantics
  (`role`/`aria-valuenow`/`aria-valuemin`/`aria-valuemax` reflected), Arrow
  stepping (Shift/PageUp/PageDown for a larger jump) and Home/End to bounds,
  optional hold-to-repeat stepper buttons, a unit `suffix` Public Part, integer
  mode, and a pluggable locale parse/format adapter behind
  `HELL_NUMBER_INPUT_ADAPTER`. Stepping clamps into `[min, max]`; typing never
  clamps live — out-of-range values commit but fail validation. The `Validator`
  reports `required`, `numberInputMalformed`, `min`, and `max` as distinct
  keys, and the control shares date input's ambient form-field
  invalid/label/description wiring. Public Parts: `root`, `input`,
  `increment`, `decrement`, `suffix`. Closes #105 (spec #94).

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

- Added the `@hell-ui/angular/save-bar` Package Entry Point (Composite): a
  save/discard action bar for edit surfaces with no form coupling — state flows
  in through `dirty`/`busy`/`disabled` inputs (one-line reactive-form binding:
  dirty/invalid/pending) and actions flow out through `saved`/`discarded`
  outputs. The default `contextual` mode renders the bar only while dirty;
  `persistent` mode keeps a stable footer for settings pages. `busy` gates both
  actions and shows a progress glyph in Save; `disabled` gates Save only. The
  built-in Save button defaults to `type=button` and emits only `saved`, so it
  never submits an enclosing form (no double-fire); `saveType=submit` opts into
  native form submission, and `size` forwards to both built-in buttons. The
  bar renders in normal flow, sticky to the bottom of its nearest scroll
  container (no fixed-position portal), never steals focus on appearance,
  announces its message politely through the CDK LiveAnnouncer — at most once
  per dirty session, so a form that flaps dirty→pristine→dirty within a tick
  raises no announcement storm — and suppresses its slide-in under
  `prefers-reduced-motion`; persistent mode renders no empty message paragraph
  while pristine. Extra consumer actions project into the actions part before
  the built-in Discard/Save buttons. Message and button labels come from the
  Label Contract (`provideHellSaveBarLabels`), and the unsaved-changes `message`
  can be overridden per instance.
  Refine the `root`, `message`, `actions`, `save`, and `discard` parts through
  the Part Style Map, and import `@hell-ui/angular/save-bar/styles.css` (which
  carries the button primitive styles it composes) for the default visuals.
  Evidence: `packages/angular/save-bar/save-bar.spec.ts`,
  `e2e/save-bar-a11y-contracts.spec.ts`, the docs page at
  `/components/save-bar` (including app-shell placement and confirm-service
  discard recipes), and its axe WCAG A/AA smoke coverage. Closes #108
  (spec #97).
- New `@hell-ui/angular/toolbar` Composite entry point: an APG-toolbar-pattern
  action bar where actions are declared once as `hellToolbarAction` templates
  (label, optional icon, `disabled`, `priority` of `primary`/`default`/
  `overflowOnly`, an `iconOnly` inline rendering whose accessible name and
  `title` tooltip come from `label`, and an `activated` output) and rendered
  either as inline Hell buttons or as items in a trailing Hell overflow menu
  (which always shows the label). `hellToolbarSeparator` declares group
  dividers that render inline and as menu separators, and make collapse
  group-aware: a trailing separated group overflows as a unit instead of
  stranding a half-cluster. `hellToolbarWidget` projects arbitrary content
  (search field, select) that joins the layout and roving focus but never
  collapses or menu-ifies. Membership is recomputed from a container-driven
  `ResizeObserver` against an off-screen sizing row — measured and committed
  outside change detection, once per resize frame, with the overflow trigger's
  width reserved and last-known widths cached so container growth never feeds
  zero widths back into the policy — and first paint starts collapsed to the
  pinned items until the first measurement commits, so no action is ever
  unreachable, clipped, or oscillating at any width. A roving tabindex spans
  the visible controls and the overflow trigger for a single tab stop; when
  the focused action collapses out of the row, focus moves to the overflow
  trigger. The overflow trigger's default name lives in the toolbar Label
  Contract (`provideHellToolbarLabels`). Exposes the `root`, `action`,
  `separator`, `widget`, `overflowTrigger`, `overflowMenu`, `overflowItem`,
  and `overflowSeparator` Public Parts, plus the exported
  `hellResolveToolbarOverflow` priority policy. Evidence:
  `packages/angular/toolbar/toolbar.spec.ts`, `e2e/toolbar-contracts.spec.ts`,
  the docs page at `/components/toolbar`, and its axe WCAG A/AA smoke
  coverage. Closes #107, #133 (spec #96).

### Changed

- Hell's duration-token-driven transitions and entrance animations now collapse
  under `prefers-reduced-motion: reduce`; Spinner, Skeleton, and Audio Player
  also disable their hardcoded keyframe motion locally. The shared token
  stylesheet deliberately leaves consumer and third-party `[data-slot]`
  elements untouched. Evidence: `e2e/reduced-motion-contracts.spec.ts`. See
  #90.
- Release publishing now delegates its shared gates to `release:dry-run`, and
  package validation runs Publint before the Hell-specific tarball audit.
- The workspace lockfile is deduplicated and build/test transitive dependencies
  are constrained to patched releases; both full and production audits are clean.
- The docs initial-bundle warning now starts just above the accepted baseline
  instead of warning on every successful production build; the 1.05 MB failure
  threshold remains unchanged. Playwright now exercises that production output
  through Vite preview instead of running optimized bundles through a dev
  server; the unused stats-file output is gone as well.
- Accessibility documentation now describes stable ownership boundaries and
  consumer responsibilities instead of maintaining a per-demo test matrix
  that had already drifted from the executable coverage.
- Production TypeScript is linted with type information. Test fixtures stay on
  the syntax-aware ruleset because Angular and third-party test doubles expose
  deliberately loose values that would make type-aware lint mostly noise.
- The omnibar's `[hellOmnibarChip]` / `button[hellOmnibarChipRemove]` scope
  pills now use the same presentation implementation as the public
  `@hell-ui/angular/chip` primitive instead of private recipes and CSS. The
  composition stays behind the existing omnibar `ui` inputs, so the public
  omnibar API is unchanged; chip-only `variant`, `size`, `disabled`, and
  `label` inputs do not leak into the Composite. The remove button keeps the
  omnibar tab rule: it leaves the tab order while the panel is open and rejoins
  it when closed. `@hell-ui/angular/omnibar/styles.css` imports the chip styles
  so omnibar-only consumers still get the shared visuals. Evidence:
  `packages/angular/omnibar/omnibar.spec.ts` and
  `e2e/omnibar-a11y-contracts.spec.ts`. Closes #115 (spec #95).

### Fixed

- `HellNumberInput` now commits a pending typed draft before stepping, so typing
  a value and then clicking a stepper or pressing Arrow / Page / Home / End steps
  from what was typed instead of the stale committed value it shadowed (commit
  8081, type `500`, click `+` now yields `501`, not `8082`). Its spinbutton
  semantics are also static: `role="spinbutton"` and `aria-valuemin` /
  `aria-valuemax` are reflected whenever the corresponding bound exists regardless
  of the current value, and only `aria-valuenow` drops while the value is null
  (empty fields stay axe-clean). The Shift multiplier now persists across
  hold-to-repeat steps, and the increment / decrement stepper buttons are out of
  the tab order (`tabindex="-1"`, APG spinbutton prior art) so keyboard stepping on
  the field is the single, accessible tab stop. Evidence:
  `packages/angular/number-input/number-input.spec.ts`,
  `e2e/number-input-a11y-contracts.spec.ts`, and the docs page at
  `/components/number-input`. Closes #134 (spec #94).
- `hellAlertDismiss` and `hellChipRemove` now ship a built-in × glyph so the
  dismiss/remove controls are visible with zero consumer markup — the previous
  attribute directives rendered empty buttons. The glyph is a CSS mask on the
  empty button (mirroring the breadcrumb-separator mechanism), keyed off a new
  `--hell-icon-close` token; projecting any content into the button drops the
  `:empty` match and replaces the default glyph. Import
  `@hell-ui/angular/alert/styles.css` / `@hell-ui/angular/chip/styles.css` for
  the glyph. Evidence: `packages/angular/alert/alert.spec.ts`,
  `packages/angular/chip/chip.spec.ts`, `e2e/alert-a11y-contracts.spec.ts`,
  `e2e/chip-a11y-contracts.spec.ts`. Closes #135 (specs #91, #95).
- `hellChipRemove` now derives its accessible name (`Remove {label}`) from the
  chip's rendered text content by default, demoting the `hellChip` `label` input
  to an optional override — one source of truth, so the label is no longer
  written twice. Docs examples drop the redundant `[label]`. Evidence:
  `packages/angular/chip/chip.spec.ts`.
- `hell-empty-state` no longer applies `role="heading"`/`aria-level` to the
  title wrapper when a `hellEmptyStateTitle` is projected, so a projected real
  heading is not nested inside a second heading role; `headingLevel` still
  promotes the built-in preset title. Evidence:
  `packages/angular/empty-state/empty-state.spec.ts`.
- TanStack column filters no longer render object-valued state as the literal
  text `[object Object]`; only scalar filter values are shown in the input.
- Multiple-select `[hellToggleGroup]` items no longer expose `role="radio"`
  and `aria-checked`; they are native toggle buttons announcing selection via
  `aria-pressed`, matching the WAI-ARIA toggle-button pattern. This works
  around ng-primitives (<= 0.124) hardcoding radio semantics on toggle-group
  items in both selection modes ([ng-primitives#813](https://github.com/ng-primitives/ng-primitives/issues/813));
  single-select groups keep radio items. Evidence: mode-specific assertions in
  `packages/angular/toggle/toggle.spec.ts` and
  `e2e/toggle-a11y-contracts.spec.ts`.

### Removed

- Removed duplicate public pass-throughs from
  `@hell-ui/angular/table-tanstack`: import TanStack's FlexRender helpers
  directly from `@tanstack/angular-table`. Internal PDF/toast/tooling exports
  with no callers and unused workspace catalog entries are gone as well.
- Removed dead dependency and test-artifact surface. Knip is now the standard
  dead-file/export/dependency gate, and strict consumer workspaces no longer
  install unused `@emnapi` development packages. Local unit tests no longer
  generate coverage, JUnit, JSON-summary, LCOV, and Cobertura output on every
  run; CI and release checks use the explicit `test:coverage` path, and
  Playwright no longer writes an unconsumed JSON report per shard.
- Removed direct browser-global seams: runtimes now resolve observer
  constructors and animation frames from the relevant owner window. ESLint
  rejects direct observer and animation-frame
  globals alongside `document`/`window`, closing SSR and portaled-document gaps
  without another custom architecture registry.
- Replaced hand-maintained CI sharding and its meta-guard with native tooling:
  Playwright now shards with `--shard=N/9` (every test in exactly one shard by
  construction), so the named `ciGroups` grep table in `playwright.config.ts`
  and all of `tools/check-ci-coverage.mjs` are gone. The package-consumer CI
  matrix now selects harness-owned groups via `HELL_PACKAGE_CONSUMER_GROUP`
  instead of mirroring scenario lists in workflow YAML.
- Deleted `tools/run-unit-tests.mjs` (360 lines re-verifying what Vitest
  already enforces: exit codes, JUnit output, coverage thresholds). `test:unit`
  invokes `ng test` directly with the single `vitest.config.ts`
  (`vitest.ci.config.ts` folded in); thresholds stay enforced by
  `coverage.thresholds`.
- Deleted the docs bundle budget apparatus (`tools/docs-budget-policy.mjs`,
  `tools/docs-bundle-budget-report.mjs`, `docs/release/docs-budget-policy.md`,
  the CI diagnosis artifact). Angular's native `budgets` in
  `apps/docs/angular.json` keep failing the build at the error threshold.
- Dissolved the release-evidence ceremony: `tools/release-dry-run.mjs`
  (timestamped log/JSON "evidence" plus an awk re-verification of a job that
  already gates by `needs:`) and `tools/release-evidence-policy.mjs` (a
  300-line entrypoint mirror). API-report membership is now derived from the
  entrypoint manifest in `tools/check-api-reports.mjs` with one documented
  exclusion list; the npm-publish workflow runs the gates as plain steps;
  `release:dry-run` is a package.json chain; `check-changelog` verifies only
  that the version has a changelog section with a bullet.
- Pruned `tools/check-architecture.mjs` by ~700 more lines: string-mirror
  checks that re-asserted exact source/CSS text (app-shell breakpoint, select
  and combobox chevron CSS, label-contract forbidden strings, code-editor
  `createElementNS` pin), tombstones (`.hell-*` behavior sentinels), checks
  duplicating unit tests or API reports (CVA classes, hotkey export leaks,
  floating registration), the docs table-CSS ceremony, and the Component
  Contract manifest comparison. NgClass/HostBinding/HostListener bans and the
  exact-line browser-global allowlist moved to standard ESLint rules
  (`no-restricted-imports`, `no-restricted-globals`) with justified inline
  disables at the 11 SSR seams.
- Deleted `packages/angular/component-contract.spec.ts`: a 155-symbol registry
  where ~130 entries declared `coverage: 'static'` (tested by nothing) and the
  16 DOM cases mirrored implementation class strings; per-component specs
  carry the behavioral coverage. Also deleted the pack audit's embedded
  self-test and derived its recipe-file list from `ng-package.json` assets
  instead of a 43-line mirror.
- Re-enabled ESLint rules the config had switched off
  (`no-irregular-whitespace`, `no-unused-vars` outside the library,
  `no-unused-expressions`), which immediately caught a literal NBSP in the
  dialpad template (now an explicit ` `), a statement-position ternary in
  flyout, and a dead `.length` read in omnibar.

- Dissolved `tools/check-ci-contract.mjs` (892 lines of string mirrors that
  re-pinned package.json scripts, workflow YAML, and other tools' source text)
  into the derived `tools/check-ci-coverage.mjs`, which computes coverage from
  the real Playwright config, the real consumer-scenario catalog, and the real
  CI workflow: every test must land in exactly one CI shard and every consumer
  scenario in exactly one matrix entry. The new check immediately caught a real
  gap the old mirrors missed — the `TanStack virtual row strategy` axe test
  matched neither docs-smoke shard grep and silently never ran in CI (fixed in
  `playwright.config.ts`). Deleted with it: `.gitlab-ci.yml` and
  `Dockerfile.ci` (a parallel-universe CI path that never executed; the
  Dockerfile was provably broken since PR #84), `tools/run-ci-tests.mjs`,
  `tools/ci-summary.mjs` (folded into `tools/run-unit-tests.mjs --ci-summary`),
  and 18 package.json scripts (17 with no remaining callers plus
  `test:ci-contract`, replaced by `test:ci-coverage`). The docs budget
  policy/markdown sync check moved into
  `tools/docs-bundle-budget-report.mjs --check`, now run blocking in CI's
  docs-bundle-diagnosis step so policy drift fails on every PR.
- Cut `tools/check-architecture.mjs` from 5,238 to 2,598 lines: removed the
  1,420-line hand-maintained `migratedPartStyleMapModules` table (the Part
  Style Map migration completed 2026-07) in favor of deriving styleable
  classes and the `data-slot` ⇔ Part-union invariant from source inside
  `checkComponentContract`; removed post-migration tombstones (table
  semantics/sort/resize-handle guards, floating-adapter reach-in bans,
  component-variable-prefix bans), api-extractor duplicates
  (`checkApiReportContract`, search/date-time token existence), and docs-copy
  mirrors (experimental JSDoc phrases, category badge strings, README heading
  pins). Mutation-tested: the derived checks still fail on rogue `data-slot`
  literals, removed Part-union members, and hardcoded labels.
- Deleted the dead `@hell-ui/angular/internal/input` entry point (its last
  real consumer left in June 2026; only its own spec read
  `HELL_EMBEDDED_INPUT_UI`) and the empty `internal/ng-primitives/adapters.ts`
  marker file.
- Removed duplicate and tautological tests: seven `ui-behavior.spec.ts` e2e
  tests that were strict subsets of the dedicated a11y-contract specs, the
  docs-chrome CSS-pinning "visual regression smoke", the split-view
  class-list assertions that restated the docs example's own Tailwind classes,
  two transition-property pinning tests, the `component-contract.spec.ts`
  blocks that verbatim re-asserted per-component specs (button, card, field,
  app-shell nav, resizable, pagination, table, split-view — the manifest the
  architecture checker consumes stays), the omnibar duplicate of
  `internal/hotkeys` matcher tests, four zero-power mock-writer tests and the
  version-string tautology in `ngp-state-adapters.spec.ts`, and assorted
  meta/passthrough tests (avatar-group directive bundle, button signal-input,
  toggle setter spies, PDF runtime arg-forwarding). Review found two
  attributes whose only coverage lived in the deleted contract-spec blocks
  (`hell-split-view` `data-framed` and the table container's `aria-busy`);
  both moved into their per-component specs instead. Evidence:
  `pnpm run test:unit`, `pnpm run test:architecture`, and
  `pnpm run test:ci-coverage` all pass.
- Dead docs-app code: `shared/lazy-global-style.ts` (zero importers), the
  unused `hasBadges` computed in `shared/page-header.ts`, and five unused
  `HELL_*_DIRECTIVES` spreads in page components.

### Breaking changes

- Removed the `@hell-ui/angular/multi-select-menu-button` Package Entry Point.
  The composite is now a documented recipe: `hellButton` + `[hellMenu]` +
  `hell-menu-options`, with the count badge as consumer markup, the reset item
  as an ordinary menu item, and the selection floor expressed by disabling
  still-selected options (see the Multi-select menu button recipe page).
  `HellMultiSelectMenuButton`, `HellMultiSelectOption`,
  `HELL_MULTI_SELECT_MENU_BUTTON_LABELS`, and its labels interface are gone —
  migrate `HellMultiSelectOption` to core's `HellOption`. Closes #151
  (spec #147). Evidence: recipe page examples, migrated browser contract suite
  `e2e/multi-select-menu-button-contracts.spec.ts`.
- The select and combobox presets now consume the shared core option contract:
  `hell-select-basic` and `hell-combobox-basic` take
  `options: readonly HellOption<T>[]` (`{ value, label, disabled? }`, exported
  from `@hell-ui/angular/core` with `HellOptionDisplayWith` and
  `HellOptionCompareWith`) instead of raw value arrays. Display text defaults
  to each option's `label`; `displayWith` becomes a nullable override that also
  labels selected values missing from `options`; combobox filtering matches
  the rendered label; per-option `disabled` flows to the option rows. The
  entry-point-local `HellSelectDisplayWith`/`HellSelectCompareWith`/
  `HellComboboxDisplayWith`/`HellComboboxCompareWith` aliases are gone —
  migrate `[options]="['A', 'B']"` to
  `[options]="[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]"` and
  import the callback types from core. Closes #149 (spec #147). Evidence:
  select and combobox unit suites, updated docs examples.
- Removed the 278 information-free single-part Part Style Map aliases
  (`Hell<Module>Part = 'root'` and their `Hell<Module>Ui = HellUi<...>`
  counterparts) from every entry point. Single-part modules now type their
  `ui` input as `HellUiInput<'root'>` from `@hell-ui/angular/core` directly;
  multi-part unions such as `HellToasterPart` or `HellNumberInputPart` and
  their `Ui` maps remain exported. Migrate `HellXUi` annotations on single-part
  modules to `HellUi<'root'>` (or drop the annotation). Evidence: API reports
  shrink accordingly; behavior, recipes, and `data-slot` contracts are
  unchanged per the untouched unit and e2e suites.
- Consolidated the 26 per-entry-point `provideHell<Module>Labels` functions
  into one generic `provideHellLabels(token, overrides)` exported from
  `@hell-ui/angular/core`. `hellCreateLabels` now returns the `InjectionToken`
  itself and registers its defaults for the generic provider; the
  `HellLabelContract` type is gone. Migrate
  `provideHellAlertLabels({ dismiss: '…' })` to
  `provideHellLabels(HELL_ALERT_LABELS, { dismiss: '…' })`; the label
  interfaces and `HELL_*_LABELS` tokens are unchanged. Evidence: migrated
  spec coverage across all label-owning entry points.
- `@hell-ui/angular/table-tanstack` no longer re-exports
  `FlexRenderDirective`/`FlexRender` or the other TanStack FlexRender helpers;
  import them from `@tanstack/angular-table`. TanStack shell behavior is
  unchanged.
- Folded the split `@hell-ui/pdf-viewer` package back into `@hell-ui/angular`
  as the optional feature entry point `@hell-ui/angular/features/pdf-viewer`,
  reversing the pre-beta package split (see the amended heavy feature boundary
  ADR in `docs/adr/hell-heavy-features.md`). The standalone package is no
  longer published; running a second release train (build, pack audit,
  provenance, registry mirror, exact-version peer on `@hell-ui/angular`) cost
  more than the one benefit of keeping `pdfjs-dist` out of the main package
  metadata — the same trade already accepted for the CodeMirror peers.
  Migration: replace `@hell-ui/pdf-viewer` imports with
  `@hell-ui/angular/features/pdf-viewer`, replace the
  `@hell-ui/pdf-viewer/styles` CSS import with
  `@hell-ui/angular/features/pdf-viewer/styles.css`, drop the
  `@hell-ui/pdf-viewer` dependency, and keep the exact `pdfjs-dist@5.6.205`
  peer (now optional in `@hell-ui/angular`). Component selectors, parts,
  labels, worker inputs, and runtime behavior are unchanged; the PDF specs now
  run inside the main unit suite. Evidence:
  `packages/angular/features/pdf-viewer/*.spec.ts`, the `pdf-viewer`
  package-consumer scenario, and `pnpm run test:architecture`.

- `HellDialog`'s `size` input narrowed from `HellSize` to
  `Exclude<HellSize, 'xs'>` (`'sm' | 'md' | 'lg' | 'xl'`). The dialog recipe
  only styles `sm`/`lg`/`xl` max-widths on top of the `md` base, so `xs`
  type-checked but silently rendered the base `md` visuals; the narrowed type
  matches the recipe coverage, following the repo convention that components
  narrow `size` to exactly the sizes their recipe styles. Consumers passing
  `size="xs"` now get a compile error and should pick `sm`; rendered output is
  unchanged. Evidence: `etc/api-reports/hell-ui-angular-dialog.api.md` and the
  `data-size` assertions in `packages/angular/dialog/dialog.spec.ts`.

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
- Removed the pre-beta deprecated compatibility aliases: the
  `allowLiveCaptions` input on `HellAudioPlayer` (use `allowSpeechTranscript`
  plus `provideHellAudioTranscript()`), the `hellAudioSpeechSupported`
  re-export from `@hell-ui/angular/audio-player` (import it from
  `@hell-ui/angular/features/audio-transcript`; the removed alias always
  returned `false`), the browser-global `hellCodeEditorSetup` constant (use
  `hellCodeEditorSetupFactory(ownerDocument)`), and the legacy
  `data-dialog-root` scope attribute that `hellDialogScope` and
  `hellAppContent` wrote alongside `data-hell-dialog-scope-root`. The
  completed-migration guards for these aliases were removed from
  `tools/check-architecture.mjs` in the same change. Evidence:
  `packages/angular/audio-player/audio-player.spec.ts`,
  `packages/angular/dialog/dialog.spec.ts`, and
  `pnpm run test:architecture`.
- Removed the dead `.hell-button` legacy helper rule from
  `@hell-ui/angular/button/styles.css`. It was documented as a stopgap for
  primitives that had not migrated to Part Style Map; the migration is
  complete and no component, docs page, or example has applied the class
  since. Consumers who added `class="hell-button"` to their own markup must
  use `hellButton` (or the `ui` Part Style Map) instead. The unconsumed
  `--hell-button-*` custom-property declarations in the `@hell-ui/pdf-viewer`
  thumb styles — theming hooks for that removed rule, and a violation of the
  ADR rule against component-specific public variables — were removed in the
  same change, along with the per-spec "legacy class must not reappear"
  assertions that only existed to guard the finished migration. No rendered
  output changes: nothing consumed the rule or the variables. Evidence:
  `grep -r "hell-button" packages apps e2e`, `pnpm run test:unit`, and
  `pnpm run e2e` (table docs regressions).

- The production-readiness gate (`tools/production-ready-check.mjs`,
  `docs/release/production-readiness-checklist.md`, and the
  `production-ready:check` script). The gate validated a checklist document
  whose JSON block had to byte-for-byte mirror constants hardcoded in the
  script itself, ran in no CI job, and duplicated what the release dry-run and
  npm-publish workflow already enforce. Release-claim policy is now one
  sentence in the README/semver policy: internal-beta wording until a full
  release dry-run and full browser e2e pass on the current commit.
- The `no-legacy-alias` package-consumer scenario and its negative-build
  machinery (`expectBuildFailure`, `runPnpmExpectingFailure`), plus the
  legacy-table tarball boundary checks and their self-tests in
  `tools/package-pack-audit.mjs`, the docs legacy-table-API scan, and the
  Label Contract "must not reintroduce `HELL_LABELS`" check. These were
  post-migration must-not-reintroduce guards spending a full consumer
  install+build per CI provider to prove that entry points removed before beta
  still do not exist; the entrypoint manifest check (`Unsupported Table Path
  entry points must not be published`) already rejects them statically.
- The string-mirror meta-guards in `tools/check-ci-contract.mjs` (the
  `fileChecks` list pinning verbatim source lines and doc phrasings of other
  tools, obsolete-script tombstones, and dead-identifier forbidden patterns)
  and the matching doc-mirroring in `tools/check-changelog.mjs`
  (`validateReleaseEvidencePolicyDoc` and the semver-policy term scan).
  `docs/release/release-evidence-policy.md` is slimmed to prose that points at
  `tools/release-evidence-policy.mjs` as the single enforced source instead of
  mirroring its tables. The CI contract keeps its real function: provider
  adapters, scripts, scenario catalog, and e2e groups staying in sync.
  Evidence: `pnpm run test:ci-contract`, `pnpm run test:changelog`, and
  `pnpm run test:architecture`.
- Broad documentation accessibility-tree snapshots and their 38 snapshots.
  Explicit role, name, state, keyboard, focus, and axe assertions remain the
  accessibility contract without snapshot churn from unrelated demo copy.
- Package-consumer registry/store preflights and five diagnostic package-manager
  commands that duplicated the real strict install and production build.

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

### Changed

- Release publishing now delegates its shared gates to `release:dry-run`, and
  package validation runs Publint before the Hell-specific tarball audit.
- The workspace lockfile is deduplicated and build/test transitive dependencies
  are constrained to patched releases; both full and production audits are clean.
- The docs initial-bundle warning now starts just above the accepted baseline
  instead of warning on every successful production build; the 1.05 MB failure
  threshold remains unchanged. Playwright now exercises that production output
  through Vite preview instead of running optimized bundles through a dev
  server; the unused stats-file output is gone as well.
- Accessibility documentation now describes stable ownership boundaries and
  consumer responsibilities instead of maintaining a per-demo test matrix
  that had already drifted from the executable coverage.
- Production TypeScript is linted with type information. Test fixtures stay on
  the syntax-aware ruleset because Angular and third-party test doubles expose
  deliberately loose values that would make type-aware lint mostly noise.

### Fixed

- TanStack column filters no longer render object-valued state as the literal
  text `[object Object]`; only scalar filter values are shown in the input.
- Multiple-select `[hellToggleGroup]` items no longer expose `role="radio"`
  and `aria-checked`; they are native toggle buttons announcing selection via
  `aria-pressed`, matching the WAI-ARIA toggle-button pattern. This works
  around ng-primitives (<= 0.124) hardcoding radio semantics on toggle-group
  items in both selection modes ([ng-primitives#813](https://github.com/ng-primitives/ng-primitives/issues/813));
  single-select groups keep radio items. Evidence: mode-specific assertions in
  `packages/angular/toggle/toggle.spec.ts` and
  `e2e/toggle-a11y-contracts.spec.ts`.
- Interactive `[hellBreadcrumbEllipsis]` buttons no longer carry the
  `role="presentation"` and `aria-hidden="true"` that `NgpBreadcrumbEllipsis`
  applies unconditionally, so a focusable ellipsis button is announced instead
  of violating axe's `aria-hidden-focus` rule; span hosts stay decorative.
  Evidence: host-specific assertions in
  `packages/angular/breadcrumbs/breadcrumbs.spec.ts` and the new breadcrumbs
  target in `e2e/docs-axe-smoke.spec.ts`.

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
