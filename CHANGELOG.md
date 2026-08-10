# Changelog

## [0.4.0] - 2026-08-10

### Breaking changes

- The tested range for the `@ng-icons/core` and `@ng-icons/font-awesome` integrations moved from `^33.0.0` to `^34.0.0`. Only consumers of icon-backed entry points are affected. (These packages are no longer declared as peers — see the integration-contract entry under Changed — so nothing enforces the range at install time; the library is built against v34.)

  Migration: Upgrade `@ng-icons/core` and `@ng-icons/font-awesome` to `^34.0.0`; both must move together.

- The tested `pdfjs-dist` version for `hell-ui/features/pdf-viewer` moved from exactly `5.6.205` to exactly `6.2.108`; the viewer is built against the v6 API and worker contract. Only consumers of the PDF viewer entry point are affected.

  Migration: Upgrade `pdfjs-dist` to `6.2.108` alongside this release. The package is no longer declared as a peer (see the integration-contract entry under Changed), so no installer will flag a stale 5.x install — the viewer fails at runtime against it instead. Check your lockfile.

- The tested `@tanstack/angular-table` range moved from `^8.21.4` to `^9.0.0`, and the `hell-ui/table-tanstack` shell now drives a v9 table. The package is no longer declared as a peer (see the integration-contract entry under Changed), so installers no longer enforce the range — a v8 install fails at runtime against the shell instead. The source migration below is what is specific to the `hell-ui/table-tanstack` and `hell-ui/table-tanstack/virtual` entry points.

  Migration: Upgrade `@tanstack/angular-table` to `^9.0.0` and migrate your own table
construction with it: v9 is a redesign rather than a compatible release.
Replace `createAngularTable(() => options)` with `injectTable(() => options)`
called in an Angular injection context (a component field initializer is one);
drop the `getCoreRowModel()` option, which is now automatic; and move features
and row models into a `features: tableFeatures({ ... })` object built once at
module scope rather than inside the initializer. Row-model options become
sibling slots — `getSortedRowModel()` becomes
`sortedRowModel: createSortedRowModel()`, `getFilteredRowModel()` becomes
`filteredRowModel: createFilteredRowModel()`, `getPaginationRowModel()` becomes
`paginatedRowModel: createPaginatedRowModel()`, and `getExpandedRowModel()`
becomes `expandedRowModel: createExpandedRowModel()`. Every feature you use must
be imported and registered; all of them are re-exported from
`@tanstack/angular-table`, so no new dependency is required.
Register the sort and filter functions too, not just the features and row
models. v9 no longer bundles the built-ins: `sortFn` and `filterFn` resolve by
name out of the `sortFns` and `filterFns` registries, and so does the `auto`
default that every column uses unless it names one. An unregistered name fails
quietly rather than loudly — a column that resolves to `alphanumeric` falls back
to a plain comparison and sorts `Person 1, Person 10, Person 2`, and one that
resolves to `includesString` gets no filter function at all, so the filter is
skipped and every row stays visible. Development builds warn
(`sortFn 'alphanumeric' (auto) for column 'name' is not registered`), so check the
console after upgrading. `auto` picks `alphanumeric` for strings containing digits,
`text` for other strings, `datetime` for dates, `includesString` for string
filters, `inNumberRange` for numbers, `equals` for booleans and objects,
`arrIncludes` for arrays and `inDateRange` for date ranges. Import the ones your
columns resolve to and register them under those names, for example
`sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text }` and
`filterFns: { includesString: filterFn_includesString }`. Spreading the exported
`sortFns`/`filterFns` registries also works but bundles every built-in. Tables
that leave sorting and filtering to a server need neither, because no client row
model runs.
TanStack's own
reference for the rest is bundled at
`@tanstack/angular-table/skills/migrate-v8-to-v9/SKILL.md`.
One timing difference is easy to miss: the row model now follows the `data`
option through Angular reactivity, so it has not rebuilt yet in a
`queueMicrotask` scheduled right after you write new data. Code that writes
rows and then reads them back with `table.getRowModel()` in a microtask —
for example to select a row after a server page loads — will see the previous
data. Use the rows you just fetched instead of re-deriving them from the table.

- Column pinning in the `hell-ui/table-tanstack` shell is now logical rather than physical: the shell publishes `data-pinned="start"` and `data-pinned="end"` instead of `"left"`/`"right"`, and pinned columns are positioned with `inset-inline-start`/`inset-inline-end` so they follow the writing direction.

  Migration: Update anything that selects or asserts on the pinned attributes: replace
`[data-pinned='left']` with `[data-pinned='start']` and `[data-pinned='right']`
with `[data-pinned='end']`. The `--hell-table-pinned-start` and
`--hell-table-pinned-after` CSS variables keep their names. If you set TanStack
pinning state yourself, its shape changed too: `columnPinning.left`/`.right`
became `.start`/`.end`, and `column.pin('left' | 'right')` became
`column.pin('start' | 'end')`. Because the shell now positions with logical
inset properties, pinned columns follow the writing direction — under `dir="rtl"`
a start-pinned column sticks to the right edge, where it previously stuck to the
left, and the pinned-region boundary shadows flip with it so they keep casting
toward the scrolling centre. If you restyled those shadows, they now read the
`--hell-table-pinned-shadow-inline` custom property rather than hard-coded
physical offsets.

- The `hell-ui/table-tanstack` shell classes now take TanStack's `TFeatures` type parameter ahead of `TData`, and each one requires the TanStack features it reads to be registered on the table you pass it.

  Migration: Both type parameters are inferred from the `[table]` binding, so templates need
no change. Update explicit annotations to put features first — `Table<T>` becomes
`Table<typeof features, T>`, and likewise for `ColumnDef`, `Row`, `Column`,
`Cell` and `Header` — matching TanStack's own v9 order. Then register the
features each shell class reads. `hell-tanstack-table` needs
`columnPinningFeature`, `columnSizingFeature`,
`columnVisibilityFeature`, `rowExpandingFeature` and `rowSortingFeature`;
`hell-tanstack-pagination` needs `rowPaginationFeature`;
`hell-tanstack-global-filter` needs `columnFilteringFeature` and
`globalFilteringFeature`; `hell-tanstack-column-filter` needs
`columnFilteringFeature`. Column resizing is not a shell requirement:
it is opt-in through the `hellTanStackResizableColumns` directive, which
needs `columnResizingFeature` alongside `columnSizingFeature` on the
tables that use it — see this release's column-resizing change entry.
Import the features from `@tanstack/angular-table` and pass
them to `tableFeatures({ ... })`. Registering more than a shell needs is fine —
the shells are generic over your feature set — but omitting one is a compile
error naming the missing feature rather than a runtime failure.
Hell's own exported generics moved with them, so update explicit annotations of
these too: `HellTanStackTable`, `HellTanStackPagination`, `HellTanStackGlobalFilter`
and `HellTanStackColumnFilter`; the projection directives
`HellTableShellHeader`, `HellTableShellCell` and `HellTableShellFooterCell`
(`<TFeatures, TData, TValue>`) and `HellTableShellExpandedRow`
(`<TFeatures, TData>`); their template context interfaces
`HellTableShellHeaderContext`, `HellTableShellCellContext` and
`HellTableShellExpandedRowContext`; `HellTanStackRowClass`, whose callback now
receives `Row<TFeatures, TData>`; and `HellTanStackVirtualRows` from
`hell-ui/table-tanstack/virtual`, which becomes
`HellTanStackVirtualRows<TFeatures, TData>`. All of them take `TFeatures` ahead of
`TData`. The four component classes leave it without a default, because no one
feature set is right for every table, so an explicit annotation has to name yours.
The projection directives, the context interfaces, `HellTanStackRowClass` and
`HellTanStackVirtualRows` all default both parameters, so annotations that passed
no type arguments keep working; only ones that passed a single `TData` argument
need the feature set inserted ahead of it.
The shells also emit four more `protected` template helpers than before:
`visibleLeafColumns`, `rowCells` and `sortable` on `HellTanStackTable`, and
`value` on `HellTanStackGlobalFilter`. Each reads something the template cannot
reach directly — the first three are feature-gated APIs, and `value` normalises the
`globalFilter` state atom that replaced `getState().globalFilter`.
They are not part of the supported surface, but they do appear in the generated
declarations, so a subclass of one of these components that already declares a
member of the same name has to rename it.

- Every TanStack shell CSS rule moved out of `hell-ui/table/styles.css` into the opt-in `hell-ui/table-tanstack/styles.css`, so the Default Style Bundle no longer ships shell selectors to consumers with no TanStack table. Rendering the shell now requires that stylesheet.

  Migration: Add `@import 'hell-ui/table-tanstack/styles.css';` wherever you render the shell. It
works in either style mode: alongside `hell-ui/styles.css` if you use the Default Style
Bundle, or in place of `hell-ui/table/styles.css` if you import entrypoint stylesheets
granularly. It imports the base table styles itself, so it stays one import either way and
the shared base still resolves once. Order is not significant beyond Hell's usual rule that
theme adapter stylesheets come after the component CSS they adapt.
What moved is every shell-only rule Tailwind cannot express — the toolbar and footer bars,
the scrollport and its scrollbars, the shell table sizing, the sticky-header rule, pinned
column positioning and its boundary shadows, the status and expanded-row scaffolding, the
filter search rows, the pagination controls and the virtual-row geometry.
Without the import the shell still renders and stays operable, but pinned columns lose
sticky positioning and their boundary shadows, the scrollport loses its thin scrollbars,
and the virtual row strategy loses the geometry that keeps its rows on the header grid.
Consumers with no TanStack table need no change and get a smaller bundle: the measured
Default Style Bundle drops by roughly 4.5 kB raw.

- Column resizing on `hell-tanstack-table` is now opt-in through the new `hellTanStackResizableColumns` directive (`hell-ui/table-tanstack`). The shell alone no longer renders resize separators, no longer honours `enableColumnResizing: true` as the opt-in, and `HellTanStackTableFeatures` no longer requires `columnResizingFeature` — tables that never resize stop registering the resizing feature and carrying its state.

  Migration: For each resizable table, add the `hellTanStackResizableColumns` directive to
the shell element and import `HellTanStackResizableColumns` alongside
`HellTanStackTable`: `<hell-tanstack-table [table]="table"
hellTanStackResizableColumns>`. The directive shares the shell's `[table]`
binding and requires `columnResizingFeature` and `columnSizingFeature` on that
table (`HellTanStackResizableColumnsFeatures`), so keep both registered in
`tableFeatures({ ... })` where you resize. An explicit
`enableColumnResizing: true` is no longer needed and can be deleted — the
directive is the per-table opt-in, and TanStack's defaults take over from
there. The opt-outs are unchanged and still TanStack's own:
`enableColumnResizing: false` parks a whole table and
`columnDef.enableResizing: false` parks one column, with
`minSize`/`maxSize` bounding each pair. Binding the attribute
(`[hellTanStackResizableColumns]="flag"`) toggles the opt-in live.
For each table that never resizes, delete `columnResizingFeature` from its
`tableFeatures({ ... })` call and any leftover `enableColumnResizing`
option. The `data-hell-tanstack-resizable-columns` host attribute is now
reflected by the directive instead of the shell, so it only ever appears on
opted-in tables — selectors keyed on it keep working.

- The `ng-primitives` peer dependency moved from `0.123.0` to `0.128.8`. The pinned version now declares `@phenomnomnominal/tsquery` `6.2.0`, so installs against TypeScript 6 under strict peer resolution work without a workaround. The `placement` inputs of `HellPopoverTrigger` and `HellTooltip` are now typed as the unified `NgpPlacement` (upstream renamed its per-primitive placement aliases); the accepted values are unchanged.

  Migration: Install `ng-primitives@0.128.8`. If your workspace carried an override or resolution forcing `@phenomnomnominal/tsquery` to `6.2.0` to install against TypeScript 6, delete it. If you imported the `NgpPopoverPlacement` or `NgpTooltipPlacement` types from ng-primitives to type values passed to `placement`, import `NgpPlacement` from `ng-primitives/portal` instead.

### Changed

- The package manifest now declares only the seven required core peers (`@angular/cdk`, `@angular/common`, `@angular/core`, `@angular/forms`, `@floating-ui/dom`, `ng-primitives`, `rxjs`). The twelve feature integrations that were declared as optional peers (Tailwind, Router, ng-icons, TanStack table/virtual, CodeMirror, pdf.js) are no longer declared at all: registries serving npm abbreviated metadata drop `peerDependenciesMeta`, so installers saw every optional peer as required — strict-peer installs failed on peers the consumer never used, and default-posture installs silently pulled in all twelve with their transitive closure. Install an integration alongside the entry point that uses it; the tested ranges per entry point are listed in the consumer guide's integration table.

### Fixed

- Pinning a column that was not already leading applied the `hell-ui/table-tanstack` shell's `<colgroup>` widths to the wrong columns and paired each resize separator with the wrong neighbour. The shell now walks the pinned start/centre/end regions in the order TanStack renders them.

- On WebKit, reopening a combobox dropdown under a stationary pointer could hand the active option to whatever was painted beneath the cursor, overriding the keyboard's choice. WebKit reports a relayout under a resting cursor as a trusted `pointermove` at the resting position; the resting-pointer guard now recognizes that move as no use of the pointer, while moves anywhere else and presses keep behaving exactly as before.

- A hell-tanstack-table nested inside a virtual-rows shell's projected toolbar could hijack the outer shell's measurements: the nested table came first in document order, so its width drove the virtual row width and the virtualizer could fall back to the nested scrollport. Virtual rows now reaches its scrollport and table through the direct host > scrollport > table path the shell template guarantees, so only the owning shell's elements are measured.

## [0.3.0] - 2026-08-04

### Breaking changes

- The published package is renamed from `@hell-ui/angular` to `hell-ui`, with no alias or compatibility package. Entry-point paths under the new name are unchanged, and the GitHub Packages mirror publishes as `@antonpieper/hell-ui`.

  Migration: Install `hell-ui` instead of `@hell-ui/angular`, then replace the `@hell-ui/angular` prefix with `hell-ui` in every TypeScript and stylesheet import.

- The separate `@hell-ui/pdf-viewer` package is discontinued; the PDF viewer now ships inside `hell-ui` as the optional `hell-ui/features/pdf-viewer` entry point. Components and behavior are unchanged.

  Migration: Remove the `@hell-ui/pdf-viewer` dependency, import from `hell-ui/features/pdf-viewer`, repoint the stylesheet import to `hell-ui/features/pdf-viewer/styles.css`, and keep the exact `pdfjs-dist` peer installed.

- All `HELL_*_DIRECTIVES` tuple exports are renamed to `HELL_*_IMPORTS`, with no compatibility aliases. Their contents and behavior are unchanged.

  Migration: Rename each import one-for-one, for example `HELL_MENU_DIRECTIVES` becomes `HELL_MENU_IMPORTS`; the first-beta consumer guide lists every mapping.

- All form controls replace `ControlValueAccessor` with signal-based `value` models (`checked` for checkbox and switch) that work identically with direct binding, two-way binding, Signal Forms, Reactive Forms, and `ngModel`. Every migrated control also gains a `(touch)` output and a forms-driven `disabled` input.

  Migration: Classic `formControl`/`ngModel` bindings keep working; drop any use of `writeValue`, `registerOnChange`, or the `NG_VALUE_ACCESSOR`/`NG_VALIDATORS` providers. Declare required and range rules on the form — controls no longer contribute them. Replace static value attributes with bindings, for example `[checked]="true"` and `[value]="42"`. The first-beta consumer guide covers the per-control mapping.

- Select is now projection-first: the owned `<hell-select-basic>` renderer and its options model are removed. You project your own trigger, placeholder, options, and dropdown through the `[hellSelect]` directive suite, which keeps handling forms, selection, keyboard behavior, and accessibility.

  Migration: Replace `<hell-select-basic [options]="...">` with the directive suite and one projected `[hellSelectOption]` per value. Style through each directive's `ui` input, and rename the value types to the Pick Value family from `hell-ui/core`: `HellSelectSingleValue` → `HellPickSingleValue`, `HellSelectMultipleValue` → `HellPickMultipleValue`, `HellSelectFormValue` → `HellPickValue`.

- Combobox is now projection-first: the owned `<hell-combobox-basic>` renderer and its options, display, and search model are removed. You project your own options through the `[hellCombobox]` directive suite, which keeps handling forms, keyboard navigation, dismissal, and accessibility.

  Migration: Replace `<hell-combobox-basic [options]="...">` with the `[hellCombobox]` directive suite, drive filtering through `hellSearchResource`, and render each result as a projected `hellComboboxOption`. Compose `hell-ui/chip` for multiple-selection chips, and rename the value types to the Pick Value family from `hell-ui/core`: `HellComboboxSingleValue` → `HellPickSingleValue`, `HellComboboxMultipleValue` → `HellPickMultipleValue`, `HellComboboxValue` → `HellPickValue`.

- Date Input is now a directive on your own native input: `input[hellDateInput]` replaces the owned `<hell-date-input>` component and its embedded picker trigger. Parsing, formatting, validation, and forms behavior carry over.

  Migration: Author `<input hellDateInput>` and replace `[date]`/`(dateChange)` with `[value]`/`(valueChange)`. Move `inputId`, `name`, `placeholder`, and other native attributes onto the input, and compose a Control Group action, Popover, and Date Picker when you need a calendar. In tests, replace `getInputValue()`/`setInputValue()` with `getValue()`/`setValue()`; `openPicker()` is gone.

- Time Input is now a directive on your own native input: `input[hellTimeInput]` replaces the owned `<hell-time-input>` component and its embedded trigger and picker. Parsing, formatting, validation, and forms behavior carry over.

  Migration: Author `<input hellTimeInput>` and keep the `value`/`valueChange` pair. Move `inputId`, `name`, `placeholder`, and other native attributes onto the input, and compose a Control Group action, Popover, and `hell-time-picker` when you need segmented selection. In tests, replace `getInputValue()`/`setInputValue()` with `getValue()`/`setValue()`; `openPicker()` is gone.

- The date, time, and number input adapters now share one core contract, `HellTypedInputAdapter`, with common parse-result helpers. The per-entry-point standalone parse/format helpers and `Hell*InputParseResult` aliases are removed.

  Migration: Rename a custom date adapter's `coerce` hook to `normalize`, let the time adapter's `format` accept `null` (return an empty string), and build parse results with the core constructors. The `provideHell<X>InputAdapter` registration functions and default adapter exports are unchanged.

- App Shell narrows to layout, responsive overlay behavior, and its toggle actions. The `HellNavItem`/`HellNavSection` navigation components, the toggle `appearance` inputs, and `HellAppContent.maxWidth` are removed; navigation is now your own markup styled against stable shell state attributes.

  Migration: Build navigation as your own markup keyed off the `data-sidenav-collapsed`, `data-mobile-layout`, and `data-collapsed` attributes; the app-shell docs page shows the recipes. Style toggles through their `ui` maps, set content width with `--hell-app-content-max-width`, and bind the `sidenavCollapsed`/`secondaryHidden` models to read or persist shell state.

- The owned `hell-ui/split-view` component is replaced by the projection-first `hell-ui/master-detail` controller: you author the root, panes, and back button yourself. The controlled `detailOpen` model and `compactBelow` breakpoint remain, and a readonly `compact()` signal is added.

  Migration: Replace `<hell-split-view>` and its templates with the `HELL_MASTER_DETAIL_IMPORTS` directives over your own markup. Use Resizable panes for sizing, ordinary Toolbar or Pagination controls for item navigation, and each directive's `ui` map for styling. Import `hell-ui/master-detail/styles.css` plus the stylesheets of composed primitives.

- The `hell-ui/drop-zone` entry point and its stylesheet are removed; file acquisition is now the `hell-ui/file-picker` directive. Upload queues, progress, retry, and server work stay in your app.

  Migration: Replace `[hellDropzone]` with `[hellFilePicker]`, `(files)` with `(selection)`, and the `data-active` drag hook with `data-dragging`. Use `open()` instead of a bound native input for browsing, import `hell-ui/file-picker/styles.css`, and switch tests to `HellFilePickerHarness`.

- Omnibar narrows to command-palette interaction behind controlled `query` and `open` models; results and their loading, error, and empty chrome are now projected from your own search state. The built-in search source, status templates, imperative methods, decoration directives, and omnibar-specific chips are removed, and `[value]` on items is required.

  Migration: Bind the controlled query and open models, drive results with `hellSearchResource`, and bind `[value]` on every omnibar item. Replace the removed decoration directives with plain markup, and compose `hell-ui/chip` for editable scope tokens.

- Creating a toast now returns a small immutable `HellToastRef` instead of a numeric id; update and dismiss through the ref. The `id` option, `dismiss(id)`, the writable `toasts` signal, and `pauseAll()`/`resumeAll()` are removed; `dismissAll()` remains.

  Migration: Keep the ref returned by `show()` and the message helpers, then call `ref.update(patch)` or `ref.dismiss()`. Updates patch in place; only an explicit `duration` patch restarts the countdown, and both actions are no-ops once dismissal begins.

- Tooltip is redesigned around one `[hellTooltip]` trigger that accepts a string or a template; `[hellTooltipSurface]` marks a custom surface. Defaults change to a 500 ms show delay and a 300 ms cooldown, content is always hoverable, and the `disabled` and `hoverableContent` inputs are removed.

  Migration: Rename `hellTooltipTrigger` bindings to `hellTooltip` and mark rendered surfaces with `hellTooltipSurface`. Disable by passing `null` or an empty string instead of the removed `disabled` input, set shared timing or placement policy through `provideHellTooltipDefaults`, and revisit interactions that relied on the previous instant show.

- The flyout entry point is retired; a popover with `[trapFocus]="false"` is now the anchored, non-modal, light-dismiss surface. The popover trigger gains `trapFocus`, `anchor`, `boundary`, and a reactive `open` signal.

  Migration: Replace `HellFlyout`/`HellFlyoutTrigger` with the popover pair plus `[trapFocus]="false"`, rename `closeOnOutsideInteraction` to `closeOnOutsideClick`, widen the light-dismiss region with `boundary` where nested surfaces should count as inside, and import the popover stylesheet instead of the flyout one.

- Styling is now one contract: `ui` Part Style Maps. The `unstyled` opt-out inputs are removed everywhere, the internal class-merge plumbing and recipe constants are no longer exported, and the single-part `Hell<Module>Part`/`Hell<Module>Ui` aliases are gone.

  Migration: Replace `unstyled` opt-outs with `ui` part refinements, and replace removed recipe-constant reads with your own class strings. Configure `tailwind-merge` in your app if you need class merging. Annotate single-part `ui` values as `HellUi<'root'>` or drop the annotation, and replace `class="hell-button"` with the `hellButton` directive.

- Label overrides consolidate on one core provider: `provideHellLabels(token, overrides)` replaces every per-module `provideHell<Module>Labels` function. Label interfaces and the `HELL_*_LABELS` tokens are unchanged.

  Migration: Replace each `provideHell<Module>Labels({...})` call with `provideHellLabels(HELL_<MODULE>_LABELS, {...})` from `hell-ui/core`.

- Avatar group folds into `hell-ui/avatar`; the `hell-ui/avatar-group` import path and stylesheet are removed. Avatar initials typography also moved from the `root` part to the `fallback` part.

  Migration: Import the avatar-group components from `hell-ui/avatar` and their styles from `hell-ui/avatar/styles.css`. Retarget initials refinements to the `fallback` part, for example `[ui]="{ fallback: 'font-bold' }"`.

- The `hell-ui/tag` entry point folds into `hell-ui/chip`. `HellTag` is replaced by a static chip host with the same six variants, `HellBadge` and `HellKbd` move to `hell-ui/chip` unchanged, and `HellTagVariant` becomes `HellChipVariant`.

  Migration: Replace `hellTag` hosts with `<span hellChip variant="...">`, import Badge and Kbd from `hell-ui/chip`, rename `HellTagVariant` to `HellChipVariant`, and repoint `hell-ui/tag/styles.css` imports to the chip stylesheet.

- Pagination is now the numbered strip plus one `hellPageLink` directive that replaces the five nav-button directives. The `mode` input and the status/jump parts are removed; compact and page-jump layouts become documented recipes you compose yourself.

  Migration: Migrate `hellPaginationFirst` → `hellPageLink="first"`, `hellPaginationPrev` → `hellPageLink="previous"`, `hellPaginationNext` → `hellPageLink="next"`, `hellPaginationLast` → `hellPageLink="last"`, and `hellPaginationButton [page]="p"` → `[hellPageLink]="p"`, then rebuild compact, status, and jump layouts from the documented recipes.

- `HellSpinner` moves from `hell-ui/skeleton` to its own `hell-ui/spinner` entry point, together with its labels and stylesheet. Markup and behavior are unchanged.

  Migration: Import the spinner component and types from `hell-ui/spinner`, rename skeleton label overrides to the spinner token, and import `hell-ui/spinner/styles.css` wherever the skeleton stylesheet previously covered spinners.

- Dialpad moves to the optional feature entry point `hell-ui/features/dialpad`; the `hell-ui/dialpad` path is removed. The component itself is unchanged.

  Migration: Import the dialpad component, part types, and labels from `hell-ui/features/dialpad`, and repoint the stylesheet import to `hell-ui/features/dialpad/styles.css`.

- `HellNativeSelect` now exports from `hell-ui/select` instead of `hell-ui/input`, and the `hell-ui/search` entry point folds into `hell-ui/input`. Selectors, behavior, and styling are unchanged.

  Migration: Update the import paths; no template or stylesheet changes are required.

- `hell-ui/resizable` no longer exposes its internal registry, measurement, and sizing methods. Resize behavior is unchanged.

  Migration: Compose the public `[hellResizablePane]` and `[hellResizableHandle]` directives through their documented inputs and native pointer/keyboard interaction instead of calling controller methods.

- `size` inputs now accept exactly the sizes their styles implement: `'sm' | 'md' | 'lg' | 'xl'` on `HellDialog` and `'sm' | 'md' | 'lg'` on `HellSlider`. The removed values previously type-checked but rendered the base `md` visuals.

  Migration: Replace `size="xs"` on dialogs with `sm`, and `size="xs"`/`size="xl"` on sliders with `sm`/`lg`; rendered output is unchanged.

- The pre-beta deprecated aliases are removed: `allowLiveCaptions` on the audio player, the `hellAudioSpeechSupported` re-export from `hell-ui/audio-player`, the `hellCodeEditorSetup` constant, and the legacy `data-dialog-root` attribute.

  Migration: Use `allowSpeechTranscript` plus `provideHellAudioTranscript()`, import `hellAudioSpeechSupported` from `hell-ui/features/audio-transcript`, call `hellCodeEditorSetupFactory(ownerDocument)`, and target `data-hell-dialog-scope-root` in styles and tests.

- `hell-ui/table-tanstack` no longer re-exports TanStack's FlexRender helpers. The table shell's behavior is unchanged.

  Migration: Import `FlexRenderDirective`, `FlexRender`, and the other FlexRender helpers directly from `@tanstack/angular-table`.

- The experimental Filter Builder is rebuilt on the Control Group + Chip Set pattern. One Control Group frame now holds the filter chips and the inline field picker in a single Chip Set flow; the create editor opens in an anchored popover instead of replacing the picker inline; and clear-all becomes an icon-only group action at the end of the frame instead of a detached ghost button. The Public Parts are reshuffled accordingly: `root` is now the frame, `control` is the frameless inline picker inside the chip flow, `clear` is a `button[hellControlGroupAction]`, `tokenLabel` now wraps the new `tokenField`, `tokenOperator`, and `tokenValue` segments, and `editor` renders in a body-level popover for create as well as edit. The controlled value, identity, projected-editor, Label Contract, and announcement contracts are unchanged.

  Migration: Rework `ui` Part Style Maps against the new anatomy. Move frame border, background, and padding refinements onto `root`, and move surrounding layout onto the element around `hell-filter-builder`. Keep only picker sizing on `control`. Drop Button variant utilities from `clear`, which is now a Control Group action. Move whole-label typography from `tokenLabel` onto `tokenField`, `tokenOperator`, and `tokenValue`; a descriptor without `displayParts` now renders its flat `display(filter)` string inside `tokenValue`, so a long label truncates at `16rem` and gains medium weight. Replace any CSS that selected the editor through `hell-filter-builder [data-slot="editor"]`: both editor modes now portal to `body`, so only the `editor` entry of the `ui` map still reaches them.

- `HellDateInputAdapter`'s `parseText`, `format`, `normalize`, and `isWithinBounds` hooks now receive a `HellDateInputAdapterContext` (`{ format }`) as their trailing argument, the same shape Time Input's adapter context already uses; `isSameValue` compares two values and receives no context. Custom adapters that ignore the argument keep compiling; direct calls into `HELL_DEFAULT_DATE_INPUT_ADAPTER` must pass a context.

  Migration: Inside an adapter hook that delegates to `HELL_DEFAULT_DATE_INPUT_ADAPTER` forward the `context` argument your hook received. Passing a fixed `{ format: HELL_DEFAULT_DATE_INPUT_FORMAT }` there also compiles but pins that adapter to ISO forever and makes `provideHellDateInputFormat` do nothing for your app; use the fixed context only for calls made outside an adapter hook.

- `hell-ui/time-picker` is rebuilt around scrollable unit columns. The `-`/`+` steppers and the fixed 00/15/30/45 minute-preset grid are removed; each visible unit now renders a `role="listbox"` column of `role="option"` values with a roving tab stop, selection-follows-focus arrows, typed-digit entry, and tap selection. `HellTimePickerPart` drops `units`, `unit`, `unitLabel`, `unitControl`, `unitValue`, `unitStep`, `minutePresets`, and `minutePreset`, and adds `columns`, `column`, `columnLabel`, `options`, and `option`. `HellTimePickerLabels` drops `decreaseUnit`, `increaseUnit`, `minutePresets`, and `minutePreset`, and adds `noTimeSelected`. New `min`, `max`, `minuteStep`, and `secondStep` inputs add inclusive same-day bounds and column granularity. A `null` value now renders a placeholder readout with no selection instead of a silent midnight readout; the first activation still commits one complete `HellTimeValue`.

  Migration: Retarget Part Style Maps onto the new parts: `unitValue`, `unitStep`, and `minutePreset` refinements become `option`; `unit` and `unitControl` become `column` and `options`; `units` becomes `columns`. Replace the removed `decreaseUnit`, `increaseUnit`, `minutePresets`, and `minutePreset` label overrides with `noTimeSelected`. Render bespoke preset rows as consumer markup beside the picker, or set `minuteStep` for fixed granularity. Bind an explicit initial value where code relied on a `null` value rendering 00:00.

- The File Picker drop zone now renders a decorative upload glyph on its root and a clearly separate drag-over treatment: the dashed border turns solid, the glyph lifts and takes the primary color, and hover sharpens the projected copy. The glyph is a `::before` mask that never joins the accessible name, but it adds about 32px to the root's intrinsic height, so a drop zone whose content already cleared the built-in 140px floor grows while one still resting on the floor keeps its height, and a host that already projects its own drop icon now renders two glyphs. The root is also `select-none` now, so projected copy in every drop zone stops being selectable; projected `input`, `textarea`, and `[contenteditable]` keep their caret selection.

  Migration: Add `before:hidden` to the picker's `ui` refinement when your host already projects its own drop icon. Re-check fixed-height drop zones too — the built-in glyph adds about 32px to the root's intrinsic height. Refine the root with `select-auto` when a drop zone projects copy your users are meant to select.

### Added

- One recommended stylesheet: importing `hell-ui/styles.css` brings in the design tokens and every standard component style at once. The per-entry-point `hell-ui/<entrypoint>/styles.css` files remain for granular imports; use one approach or the other, since combining both duplicates the same CSS.

- New `hell-ui/file-picker` entry point: attach `[hellFilePicker]` to accept files by drag-and-drop or a built-in browse action. It validates type, size, and count, and emits one selection event carrying the accepted files and structured rejections.

- New `hell-ui/time-picker` entry point: `hell-time-picker` offers segmented, keyboard-navigable time selection with optional seconds and minute presets. Compose it with a time input and a popover when you want a dropdown picker.

- New optional `hell-ui/features/filter-builder` entry point: `hell-filter-builder` edits typed filter expressions against fields you describe, rendering each value editor from your own templates. It handles keyboard interaction, focus, and announcements; your app owns the filter model, rendering, and validation.

- New `hell-ui/chip` entry point: pill-shaped chips as spans, buttons, or anchors, an optional remove button, a keyboard-navigable chip set, and a chip input for building editable token lists. Removal is event-only — your app owns the collection.

- New `hell-ui/control-group` entry point: wrap your own input or trigger with prefix, suffix, and action-button surfaces inside one shared frame that reflects focus, size, invalid, and disabled state.

- Core now exports `hellSearchResource`, a signal-based search helper for local ranking and asynchronous sources. It debounces remote queries, cancels stale requests, and publishes results with idle, loading, success, and error state.

- New `hell-ui/alert` entry point: an inline message surface with info, success, warning, and danger variants, projected title, description, and action content, and an optional dismiss button. Your app owns visibility.

- New `hell-ui/confirm` entry point: `injectHellPrompt()` returns a prompt service whose `confirm()` opens an accessible modal or anchored popconfirm and whose `choose()` handles typed multi-option decisions. Prompts always resolve, including on Escape or backdrop dismissal.

- New `hell-ui/empty-state` entry point: `hell-empty-state` renders a centered glyph, title, description, and actions layout with overridable content and a configurable heading level. Ready-made copy for no-data, no-results, error, and forbidden states ships as plain localizable data.

- New `hell-ui/number-input` entry point: `input[hellNumberInput]` binds `number | null` on your own native input with spinbutton semantics, keyboard and hold-to-repeat stepping, integer mode, and locale-aware parsing. Stepping clamps into bounds; typed out-of-range values commit but fail validation.

- New `hell-ui/save-bar` entry point: a save/discard action bar driven by `dirty`, `busy`, and `disabled` inputs, with no form coupling. It shows contextually while dirty or persistently as a footer, sticks to the nearest scroll container, and never steals focus.

- New `hell-ui/toolbar` entry point: `[hellToolbar]` gives your own controls the standard roving-focus toolbar keyboard pattern, and `hell-overflow-toolbar` additionally moves declared actions into a trailing overflow menu when the container runs out of room.

- New `hell-ui/page-header` entry point: slot-based page chrome for leading content, title, metadata, description, and a toolbar, filled by projecting real components. An optional back affordance emits a `back` event while routing stays with your app.

- `HellTextarea` gains an `autoGrow` opt-in: the textarea grows with its content through CSS `field-sizing`. Bound the growth with `min-block-size`/`max-block-size` in your styles; browsers without support fall back to a normal fixed-size textarea.

- Avatar, checkbox, audio player, pagination, and the TanStack table shell expose more granular styleable parts through their existing `ui` maps. TanStack `data-slot` values are now camelCase, and the private `.hell-tanstack-*` host classes are gone.

- The menu trigger now matches Hell's other anchored surfaces: it gains a reactive `open` signal, an `(openChange)` output, a `show()` method, and an `exportAs` matching the directive name.

- The TanStack table shell now renders keyboard-operable column resize separators when the caller-owned table sets TanStack `enableColumnResizing: true`; per-column opt-out stays `columnDef.enableResizing`. Resizing commits to TanStack `columnSizing` state, bounded by each column's `minSize`/`maxSize` and preserving the resized pair's combined width, so the colgroup, header cells, and virtualized body cells stay on one column grid.

- Filter Builder field descriptors accept an optional `displayParts(filter)` callback returning `{ field, operator?, value }`. When present the chip renders muted field and operator segments plus an emphasized value segment through the new `tokenField`, `tokenOperator`, and `tokenValue` Public Parts. When absent the chip still renders the flat `display(filter)` string, now inside `tokenValue`, so a long flat label truncates at `16rem` and renders at medium weight. It is presentation-only: `display(filter)` remains the single source for accessible names and announcements, and duplicate detection stays identity-based.

- Date Input's format is configurable: `provideHellDateInputFormat` sets one format for an injector scope, and a new `format` input overrides that scope for a single input. Patterns are written with the `YYYY`, `MM`, and `DD` tokens plus literal separators, and parsing, display, the native `min`/`max` attributes, and the placeholder hint all follow the effective format. The committed `Date | null` value contract is unchanged.

- Date picker: the month and year in the calendar heading are now buttons. Activating one replaces the day grid with a month grid or a 24-year grid centred on the year in view, so a date years away takes a handful of interactions instead of paging month by month. Both drill-downs are keyboard-operable grids that honour `min`/`max`, and they add the `monthTrigger`, `yearTrigger`, `panel`, `panelCell`, and `panelOption` parts, the `previousYears`, `nextYears`, `chooseMonth`, and `chooseYear` labels, and a `data-view="day|month|year"` attribute on the picker host. `locale` stays display formatting for Gregorian calendars only.

- `--hell-icon-upload` joins the CSS-only icon masks in `hell-ui/tokens.css`, so your own elements can mask the same upload glyph the File Picker drop zone uses.

- `hellAppSidenav` publishes its resting content widths as `--hell-app-sidenav-content-width` and `--hell-app-sidenav-collapsed-content-width`, with the sidenav's own inline padding already subtracted. Navigation recipes size rail rows and center rail glyphs against these instead of against the box the shell interpolates while collapsing, so labels no longer re-wrap or re-ellipsise and icons no longer jump between positions mid transition.

- The PDF viewer now works on touch. One finger pans, two fingers pinch-zoom, and a double tap toggles between the fitted zoom preset and a magnified view anchored on the tap. Toolbar and find-bar controls grow to finger-sized targets on coarse pointers, and on phone-sized viewports the page overview floats over the document instead of dividing it.

- A dialog overlay marked `scoped` now blocks only its Dialog Scope root instead of the whole page: the scope root becomes `inert` and stops scrolling, the panel reports `aria-modal="false"`, and everything outside it — an app shell's topbar, sidenav, secondary panel, and any popover, menu, or omnibar panel they open — keeps focus, pointer input, and its place in the accessibility tree. Focus still cycles inside the dialog panel, so it never reaches the blocked region, and closing releases the region before focus returns to the trigger. A page-blocking dialog opened from inside a scoped one, including a `hell-ui/confirm` prompt, blocks the whole page again for as long as it is open.

- Filter Builder: the available fields are explorable on an empty prompt. A pointer click on the inline picker or on empty frame space opens the full field list without typing, deleting a typed query back to empty keeps the list open with every available field, and ArrowDown keeps opening it from the keyboard. Focus alone never opens the list, so tabbing through the builder and the focus restores after commit, cancel, and clear stay quiet.

### Changed

- Transitions and entrance animations now collapse under `prefers-reduced-motion: reduce`, and the spinner, skeleton, and audio player disable their keyframe motion. Your own `[data-slot]` elements are deliberately left untouched.

- Field label, description, and error text now render at 13px instead of 12px, and wrapped helper text keeps a steady line rhythm across skins. Weights and layout are unchanged.

- Activating an omnibar entry — by pointer or keyboard — now clears the query, ready for the next search. Dismissing the panel without activating keeps the typed text, and the submit payload still carries the query at activation time.

- Dialpad keys, typing, and backspace now act on the caret in the number display: place the caret inside the number and the next key press inserts there, backspace deletes there, and a selected range is replaced. A display nobody has moved the caret in keeps appending, so ordinary dialing is unchanged, as does one whose `[value]` was just written from outside.

- Pinch and Ctrl+wheel zoom in the PDF viewer now coalesce to one scale update per animation frame, and pdf.js re-scales the already-rendered pages during the gesture and re-rasterizes them once it settles.

- The PDF viewer page overview now allocates a thumbnail canvas only once that thumbnail is rendered, instead of reserving one per page the moment the overview opens.

- Date Input now fills the native `placeholder` of inputs that do not author one, but only where a format is configured through `provideHellDateInputFormat` or the `format` input, and only with the text the active adapter returns from its new optional `placeholderHint` hook. Inputs without a configured format keep an empty placeholder exactly as before, an adapter that omits the hook suppresses the write, and authoring `placeholder=""` opts out. Nothing is written onto an input that authors no naming markup at all — no `aria-label`, no `aria-labelledby` (including an enclosing Field's), and no associated `<label>` — so a hint does not become the accessible name of an input that had none. That check reads markup rather than computing a name, so empty or dangling naming markup still counts as authored: keep a Field label or `aria-label` on every Date Input.

- `--hell-z-dialog-scoped` drops from `1020` to `900` so that popovers, menus, and CDK-portaled panels opened from the surrounding shell layer over a scoped dialog's region. Page-modal dialogs keep `--hell-z-dialog` at `1200` and stay on top.

- Filter Builder: Tab in the inline picker commits the active field option only when a query has been typed. On an empty prompt Tab now leaves the field instead of committing the highlighted option, so exploring the field list never turns a leave gesture into a commit.

- The PDF viewer's page overview rail now mounts only the pages around the visible window instead of one button per page, so opening it on a long document no longer blocks on building the whole rail. Thumbnails fit a uniform box, so rows no longer resize as pages paint; the rail scrolls to keep the current page in view; and the mounted buttons carry `aria-posinset`/`aria-setsize` so the real page count survives virtualization.

### Fixed

- All documented toaster placements now position, stack, and animate correctly instead of only `bottom-right`: top placements no longer drift off-screen, exit animations slide toward the nearest edge, and the dismiss-all toolbar renders at full size.

- Buttons and other affected controls now actually inherit their intended font family; the previous inheritance class was silently dropped when it appeared next to font-weight utilities.

- Code editor line-number and fold gutters now meet WCAG AA 4.5:1 contrast against the gutter background.

- TanStack column filters no longer render object-valued state as the literal text `[object Object]`; only scalar filter values appear in the input.

- Multiple-select toggle-group items are now announced as toggle buttons through `aria-pressed` instead of incorrectly exposing radio semantics. Single-select groups keep radio items.

- Interactive breadcrumb ellipsis buttons are now announced to assistive technology instead of being focusable yet hidden; decorative span hosts stay hidden.

- Shipped type declarations no longer contain unbound identifiers, so consumers compiling without `skipLibCheck` get clean builds.

- The table utilities' attribute inputs are now readable getter/setter pairs instead of write-only setters, so reading them returns the bound state instead of `undefined`.

- Virtual rows in the TanStack table shell now share one column grid with the header, so body cells stay aligned with their column headers at any scrollport width, including while scrolling.

- Dialpad keys now register every tap during fast dialing, including overlapping touches where a second finger lands before the first one lifts. Those sequences previously entered no digits at all.

- The app shell keeps main content clear of the secondary sidebar rail. Below the 768px breakpoint the content region now reserves the collapsed rail's width instead of rendering and taking clicks underneath it, and a shell with no projected `hellAppSecondary` no longer reserves a dead secondary column.

- The PDF viewer no longer keeps a broken zoom when it bootstraps inside a collapsed box. The `auto`, `page-fit`, and `page-width` presets now wait for a real container and re-fit whenever it resizes, instead of locking in a negative scale that rendered every page invisible.

- Reopening the PDF viewer page overview repaints its thumbnails. They previously stayed blank because the viewer still considered the discarded canvases painted.

- Typing an out-of-range page number in the PDF viewer toolbar now snaps the field back to the page the viewer actually navigated to, instead of leaving the rejected number on screen.

- Date picker: a day that is both today and the selected date is readable again. Tailwind's variant sort let the `today` text colour win over the selected one, so the day number was painted in its own background colour and disappeared. The `today` ring is scoped the same way, so a selected or in-range day no longer draws it inside the selection fill; a day that is only today keeps its ring.

- Combobox: a resting pointer no longer changes which option is active. A dropdown that repositions itself after opening could move options under a pointer the user never moved, hijacking or clearing the keyboard's active option so Enter committed the wrong one.

- A Resizable pane that another module has hidden — such as the inactive pane in a compact Master Detail frame — no longer reserves width in the group. The panes still on screen fill the frame, and the split the group had before is restored when the hidden pane comes back.

- The PDF viewer's page overview no longer collapses each thumbnail to a control height, which left every preview overlapping the pages below it in the rail. A thumbnail row is now as tall as its preview and label.

- PDF viewer page-overview thumbnails now paint the window the rail is showing instead of working through every window it scrolled past, and each thumbnail rasterizes without yielding to requestAnimationFrame between operator chunks. On a busy machine — Firefox especially — revealing the end of a document no longer leaves its thumbnails blank for many seconds.

- PDF viewer tap gestures measure their timing at input time instead of handler-run time, so quick taps and double-tap zoom register even while the main thread is busy rasterizing pages.

## [0.2.0] - 2026-07-03

Internal-beta baseline. This generated Release Changelog starts at Hell UI
`0.2.0`; the detailed pre-baseline history, including `0.1.0`, remains
available in Git history at the `v0.2.0` tag.
