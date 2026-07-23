# Directive census

All public directives and components exported by `@hell-ui/angular` entry
points, classified by the role that justifies their existence as a directive
class. Kept current alongside API reports: when a PR adds, removes, or
repurposes a public directive, update its row here. Established by #261.

## Roles

| Role | Meaning |
| --- | --- |
| behavior | Owns interaction, state, focus, keyboard, registration with a controller/runtime, `hostDirectives` delegation, dynamic ARIA wiring, or widget-pattern semantics (for example `role=radiogroup`, `role=toolbar`) that change assistive-technology interaction. |
| projection/query marker | Routes projected content or templates: detected by `contentChild`/`contentChildren`, targeted by `ng-content select`, or carries a `TemplateRef`/declaration into a renderer. |
| styling hook | Public styling surface with a demonstrated consumer use case: state-reflecting `data-*` attributes, component-identity default recipes, or selectors that entrypoint stylesheets or Theme Adapter Stylesheets target. |
| decoration only | Only writes default classes (or a trivially static attribute) onto consumer-owned markup — nothing a plain element with classes could not do. Decoration-only directives are removal candidates and should not be added. |

A directive is classified by its strongest role in that order; the notes
column records the concrete evidence. Classification is grounded in the
entrypoint API reports (`etc/api-reports`), directive/component host metadata,
library-wide content-query and `ng-content` usage, entrypoint stylesheets,
theme adapters, and docs usage.

## Summary

| Role | Count |
| --- | ---: |
| behavior | 144 |
| projection/query marker | 21 |
| styling hook | 28 |
| decoration only (all removed in #261) | 5 |
| app-shell navigation family (removed in #206) | 7 |
| total | 205 |

## Census

### accordion

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellAccordion` | `[hellAccordion]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellAccordionContent` | `[hellAccordionContent]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellAccordionItem` | `[hellAccordionItem]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellAccordionTrigger` | `button[hellAccordionTrigger]` | directive | behavior | Delegates via `hostDirectives`. |

### alert

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellAlert` | `hell-alert` | component | behavior | Owned anatomy with per-variant glyphs, dismiss wiring, and the alert Label Contract. |
| `HellAlertActions` | `[hellAlertActions]` | directive | styling hook | Alert actions-row layout recipe. |
| `HellAlertDescription` | `[hellAlertDescription]` | directive | styling hook | Alert description typography recipe. |
| `HellAlertDismiss` | `button[hellAlertDismiss]` | directive | behavior | Host listeners (click). |
| `HellAlertIcon` | `[hellAlertIcon]` | directive | projection/query marker | `contentChild` query drives default-glyph suppression; routed by `ng-content select`. |
| `HellAlertTitle` | `[hellAlertTitle]` | directive | styling hook | Alert title typography recipe. |

### app-shell

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellAppContent` | `[hellAppContent]` | directive | behavior | Activates the scoped-dialog root (`data-hell-dialog-scope-root`) for the content area. |
| `HellAppSecondary` | `[hellAppSecondary]` | directive | behavior | `@HostBinding` hidden/mobile-hidden state; registers as the shell's secondary panel. |
| `HellAppSecondaryBody` | `[hellAppSecondaryBody]` | directive | behavior | `@HostBinding` `aria-hidden`/`inert` while the secondary panel is hidden. |
| `HellAppShell` | `[hellAppShell]` | component | behavior | Outputs (sidenavCollapsedChange, secondaryHiddenChange). |
| `HellAppSidenav` | `[hellAppSidenav]` | directive | behavior | `@HostBinding` collapse/mobile-hidden/`inert` state; registers as the shell's sidenav panel. |
| `HellAppTopbar` | `[hellAppTopbar]` | directive | styling hook | Topbar chrome recipe for the shell's top slot. |
| `HellSecondaryToggle` | `button[hellSecondaryToggle]` | directive | behavior | Host listeners (click). |
| `HellSidenavToggle` | `button[hellSidenavToggle]` | directive | behavior | Host listeners (click). |

The navigation mini-family (`HellNavItem`, `HellNavItemIcon`,
`HellNavItemLabel`, `HellNavItemTrailing`, `HellNavSection`,
`HellNavSectionToggle`, `HellNavSectionItems`) was removed in #206: navigation
links, labels, icons, trailing content, and collapsible groups are now docs
recipes over plain elements and existing primitives, keyed off the shell's
stable state attributes (`data-sidenav-collapsed`, `data-mobile-layout`, and
the sidenav's `data-collapsed`).

### audio-player

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellAudioPlayer` | `hell-audio-player` | component | behavior | Owned template with interaction logic. |

### avatar

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellAvatar` | `hell-avatar` | component | behavior | Delegates via `hostDirectives`. |
| `HellAvatarGroup` | `hell-avatar-group` | component | styling hook | Layout-and-variables owner: stacking recipe plus `data-size` cascade to projected avatars. |
| `HellAvatarGroupItem` | `[hellAvatarGroupItem]` | directive | styling hook | Reflects `data-selected` for stack styling. |
| `HellAvatarGroupOverflow` | `[hellAvatarGroupOverflow]` | directive | styling hook | Overflow-chip identity recipe with hover/open interactive states. |

### breadcrumbs

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellBreadcrumbEllipsis` | `[hellBreadcrumbEllipsis]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbItem` | `li[hellBreadcrumbItem]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbLink` | `a[hellBreadcrumbLink]`, `button[hellBreadcrumbLink]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbList` | `ol[hellBreadcrumbList]`, `ul[hellBreadcrumbList]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbPage` | `[hellBreadcrumbPage]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbSeparator` | `li[hellBreadcrumbSeparator]`, `[hellBreadcrumbSeparator]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellBreadcrumbs` | `nav[hellBreadcrumbs]` | directive | behavior | Delegates via `hostDirectives`. |

### button

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellButton` | `button[hellButton]`, `a[hellButton]` | directive | behavior | Host listeners (click, keydown); delegates via `hostDirectives`. |

### card

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellCard` | `[hellCard]` | directive | styling hook | Reflects `data-elevation`; card surface recipe. |
| `HellCardBody` | `[hellCardBody]` | directive | styling hook | Card anatomy recipe; targeted by theme adapters (compact-mono). |
| `HellCardFooter` | `[hellCardFooter]` | directive | styling hook | Card anatomy recipe. |
| `HellCardHeader` | `[hellCardHeader]` | directive | styling hook | Card anatomy recipe; targeted by theme adapters (newspaper, compact-mono). |

### checkbox

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellCheckbox` | `button[hellCheckbox]` | component | behavior | Host listeners (blur); outputs (checkedChange, indeterminateChange). |
| `HellNativeCheckbox` | `input[type=\` | directive | behavior | Host listeners (change); outputs (checkedChange, indeterminateChange). |

### chip

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellBadge` | `[hellBadge]` | directive | styling hook | Standalone badge visual identity. |
| `HellChip` | `[hellChip]` | directive | behavior | Host listeners (focusin); outputs (remove); coordinates through `HellChipController`, `HellChipSetController`. |
| `HellChipInput` | `input[hellChipInput]` | directive | behavior | Registers the input with the Chip Set controller for token keyboard behavior. |
| `HellChipRemove` | `button[hellChipRemove]` | directive | behavior | Host listeners (click); coordinates through `HellChipController`. |
| `HellChipSet` | `[hellChipSet]` | directive | behavior | Host listeners (keydown); coordinates through `HellChipSetController`. |
| `HellKbd` | `kbd[hellKbd]`, `[hellKbd]` | directive | styling hook | Standalone keyboard-hint visual identity. |

### combobox

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellCombobox` | `[hellCombobox]` | directive | behavior | Delegates via `hostDirectives`; coordinates through `HellComboboxController`. |
| `HellComboboxButton` | `button[hellComboboxButton]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellComboboxDropdown` | `[hellComboboxDropdown]` | directive | behavior | Delegates via `hostDirectives`; coordinates through `HellComboboxController`. |
| `HellComboboxEmpty` | `[hellComboboxEmpty]` | directive | styling hook | Empty/no-results surface recipe used by docs status chrome. |
| `HellComboboxInput` | `input[hellComboboxInput]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellComboboxOption` | `[hellComboboxOption]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellComboboxPortal` | `[hellComboboxPortal]` | directive | behavior | Delegates via `hostDirectives`. |

### control-group

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellControlGroup` | `[hellControlGroup]` | directive | behavior | Host listeners (focusin, focusout). |
| `HellControlGroupAction` | `button[hellControlGroupAction]` | directive | behavior | Propagates group disabled/invalid/size state onto the action button, including the native `disabled` attribute. |
| `HellControlGroupPrefix` | `[hellControlGroupPrefix]` | directive | styling hook | Reflects group size/invalid/disabled data attributes for adornment styling. |
| `HellControlGroupSuffix` | `[hellControlGroupSuffix]` | directive | styling hook | Reflects group size/invalid/disabled data attributes for adornment styling. |

### date-input

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellDateInput` | `input[hellDateInput]` | directive | behavior | Host listeners (input, blur, keydown); outputs (valueChange); delegates via `hostDirectives`. |

### date-picker

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellDatePicker` | `hell-date-picker` | component | behavior | Delegates via `hostDirectives`. |
| `HellDatePickerNextYear` | `button[hellDatePickerNextYear]` | directive | behavior | Host listeners (click). |
| `HellDatePickerPreviousYear` | `button[hellDatePickerPreviousYear]` | directive | behavior | Host listeners (click). |
| `HellDateRangePicker` | `hell-date-range-picker` | component | behavior | Delegates via `hostDirectives`. |

### dialog

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellDialog` | `[hellDialog]` | directive | behavior | Host listeners (keydown); delegates via `hostDirectives`. |
| `HellDialogDescription` | `[hellDialogDescription]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellDialogOverlay` | `[hellDialogOverlay]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellDialogScope` | `[hellDialogScope]` | directive | behavior | Marks and activates an independent Dialog Scope root. |
| `HellDialogTitle` | `[hellDialogTitle]` | directive | behavior | Delegates via `hostDirectives`. |

### empty-state

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellEmptyState` | `hell-empty-state` | component | behavior | Owned anatomy querying projected markers to render media/title/description/actions regions. |
| `HellEmptyStateActions` | `[hellEmptyStateActions]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |
| `HellEmptyStateDescription` | `[hellEmptyStateDescription]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |
| `HellEmptyStateMedia` | `[hellEmptyStateMedia]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |
| `HellEmptyStateTitle` | `[hellEmptyStateTitle]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |

### features/filter-builder

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellFilterBuilder` | `hell-filter-builder` | component | behavior | Outputs (valueChange). |
| `HellFilterBuilderEditor` | `ng-template[hellFilterBuilderEditor]` | directive | projection/query marker | `ng-template` carrier registering a typed editor per field descriptor. |

### field

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellField` | `[hellField]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellFieldDescription` | `[hellFieldDescription]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellFieldError` | `[hellFieldError]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellFieldLabel` | `label[hellFieldLabel]` | directive | behavior | Delegates via `hostDirectives`. |

### file-picker

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellFilePicker` | `[hellFilePicker]` | directive | behavior | Host listeners (click, keydown, dragenter); outputs (selection). |

### icon

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellIcon` | `hell-icon` | component | behavior | Owns the decorative-vs-labelled ARIA policy (`aria-hidden`/`aria-label`) around the icon engine. |

### input

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellInput` | `input[hellInput]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellSearch` | `[hellSearch]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellSearchClear` | `button[hellSearchClear]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellTextarea` | `textarea[hellTextarea]` | directive | behavior | Delegates via `hostDirectives`. |

### internal/core (`@hell-ui/angular/internal/core`)

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellFloatingElement` | `[hellFloatingElement]` | directive | behavior | Registers its host with the nearest Floating Scope (internal seam re-exported for Hell entry points). |

### listbox

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellListbox` | `[hellListbox]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellListboxHeader` | `[hellListboxHeader]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellListboxOption` | `[hellListboxOption]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellListboxSection` | `[hellListboxSection]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellListboxTrigger` | `[hellListboxTrigger]` | directive | behavior | Delegates via `hostDirectives`. |

### master-detail

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellMasterDetail` | `[hellMasterDetail]` | directive | behavior | Master Detail controller: compact-layout detection, `detailOpen` model, pane coordination. |
| `HellMasterDetailBack` | `button[hellMasterDetailBack]` | directive | behavior | Renderer click listener closing the compact detail pane; effect-driven hidden state. |
| `HellMasterPane` | `[hellMasterPane]` | directive | behavior | Effect-driven hidden/`data-active` rendering from the Master Detail controller. |

### menu

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellMenu` | `[hellMenu]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellMenuItem` | `button[hellMenuItem]`, `a[hellMenuItem]`, `div[hellMenuItem]` | directive | behavior | Host listeners (click, keydown, keydown); delegates via `hostDirectives`. |
| `HellMenuItemCheckbox` | `button[hellMenuItemCheckbox]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellMenuItemIcon` | `[hellMenuItemIcon]` | directive | styling hook | Menu stylesheet couples icon color to item hover/active state. |
| `HellMenuItemIndicator` | `[hellMenuItemIndicator]` | directive | behavior | Delegates to `NgpMenuItemIndicator` via `hostDirectives`. |
| `HellMenuItemRadio` | `button[hellMenuItemRadio]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellMenuItemRadioGroup` | `[hellMenuItemRadioGroup]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellMenuItemTrailing` | `[hellMenuItemTrailing]` | directive | styling hook | Menu stylesheet suppresses the submenu chevron via `:has()` when trailing content exists. |
| `HellMenuLabel` | `[hellMenuLabel]` | directive | styling hook | Section-label typography; targeted by the newspaper theme adapter. |
| `HellMenuSection` | `[hellMenuSection]` | directive | styling hook | Grouping wrapper (`role=group`) with between-section spacing. |
| `HellMenuSeparator` | `[hellMenuSeparator]` | directive | styling hook | Divider identity with informational `role=separator`. |
| `HellMenuTrigger` | `button[hellMenuTrigger]`, `a[hellMenuTrigger]` | directive | behavior | Host listeners (click, keydown); outputs (openChange); delegates via `hostDirectives`. |
| `HellSubmenuTrigger` | `[hellSubmenuTrigger]` | directive | behavior | Delegates via `hostDirectives`. |

### number-input

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellNumberInput` | `input[hellNumberInput]` | directive | behavior | Host listeners (input, blur, keydown); outputs (valueChange); delegates via `hostDirectives`. |
| `HellNumberStep` | `button[hellNumberStep]` | directive | behavior | Host listeners (pointerdown, pointerup, pointerleave). |

### omnibar

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellOmnibar` | `hell-omnibar` | component | behavior | Outputs (submit); coordinates through `HellChipSetController`, `HellGlobalKeydownService`. |
| `HellOmnibarAction` | `button[hellOmnibarAction]` | directive | behavior | Host listeners (keydown); coordinates through `HellOmnibarController`. |
| `HellOmnibarActionsStrip` | `[hellOmnibarActions]` | directive | behavior | `role=toolbar` + `aria-orientation` semantics for the F6/arrow-key actions pattern; `ng-content select` target. |
| `HellOmnibarGroup` | `[hellOmnibarGroup]` | directive | behavior | `role=group` + `aria-labelledby`/`aria-label` naming wired from a content query. |
| `HellOmnibarGroupLabel` | `[hellOmnibarGroupLabel]` | directive | projection/query marker | Queried by `HellOmnibarGroup` (`contentChild`) to wire `aria-labelledby`; carries a stable id. |
| `HellOmnibarItem` | `button[hellOmnibarItem]` | directive | behavior | Host listeners (click, mousemove); outputs (select); coordinates through `HellOmnibarController`. |

### page-header

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellPageHeader` | `hell-page-header` | component | behavior | Owned template with interaction logic. |
| `HellPageHeaderBack` | `hell-page-header-back` | component | behavior | Outputs (back). |
| `HellPageHeaderDescription` | `[hellPageHeaderDescription]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |
| `HellPageHeaderLeading` | `[hellPageHeaderLeading]` | directive | projection/query marker | `contentChildren` query + `ng-content select` routing into the leading region. |
| `HellPageHeaderMeta` | `[hellPageHeaderMeta]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |
| `HellPageHeaderTitle` | `[hellPageHeaderTitle]` | directive | projection/query marker | `ng-content select` routing into the heading element. |
| `HellPageHeaderToolbar` | `[hellPageHeaderToolbar]` | directive | projection/query marker | `contentChild` query + `ng-content select` routing. |

### pagination

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellPageLink` | `button[hellPageLink]`, `a[hellPageLink]` | directive | behavior | Host listeners (click, keydown, keydown). |
| `HellPagination` | `[hellPagination]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellPaginationStrip` | `hell-pagination` | component | behavior | Delegates via `hostDirectives`. |

### popover

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellPopover` | `[hellPopover]` | directive | behavior | Popover surface: floating-scope registration, dismissal wiring, `aria-modal` reflection. |
| `HellPopoverTrigger` | `button[hellPopoverTrigger]`, `a[hellPopoverTrigger]` | directive | behavior | Host listeners (click, keydown); outputs (openChange). |

### progress

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellProgress` | `[hellProgress]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellProgressBar` | `[hellProgressBar]` | directive | behavior | Delegates via `hostDirectives`. |

### radio

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellNativeRadio` | `input[type=\` | directive | behavior | Host listeners (change); outputs (checkedChange). |
| `HellNativeRadioGroup` | `[hellNativeRadioGroup]` | directive | behavior | `role=radiogroup` widget semantics plus orientation reflection for AT interaction. |
| `HellRadio` | `button[hellRadio]` | directive | behavior | Delegates via `hostDirectives`; coordinates through `HellRadioRovingRegistry`. |
| `HellRadioGroup` | `[hellRadioGroup]` | directive | behavior | Host listeners (focusout); delegates via `hostDirectives`; coordinates through `HellRadioRovingRegistry`. |

### resizable

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellResizable` | `[hellResizable]` | directive | behavior | Coordinates through `HellResizableController`. |
| `HellResizableHandle` | `[hellResizableHandle]` | component | behavior | Host listeners (pointerdown, keydown); coordinates through `HellResizableController`. |
| `HellResizablePane` | `[hellResizablePane]` | directive | behavior | Registers pane sizing (initial flex, min size) with the Resizable controller. |

### save-bar

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellSaveBar` | `hell-save-bar` | component | behavior | Owned save-bar anatomy with the mode/dirty/busy state machine. |

### select

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellNativeSelect` | `select[hellNativeSelect]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellSelect` | `[hellSelect]` | directive | behavior | Delegates via `hostDirectives`; coordinates through `HellSelectController`. |
| `HellSelectDropdown` | `[hellSelectDropdown]` | directive | behavior | Delegates via `hostDirectives`; coordinates through `HellSelectController`. |
| `HellSelectOption` | `[hellSelectOption]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellSelectPlaceholder` | `[hellSelectPlaceholder]` | directive | styling hook | Muted, truncating placeholder recipe inside the trigger. |
| `HellSelectPortal` | `[hellSelectPortal]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellSelectValue` | `[hellSelectValue]` | directive | styling hook | Truncating value-text recipe inside the trigger. |

### separator

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellSeparator` | `[hellSeparator]` | directive | behavior | Delegates via `hostDirectives`. |

### skeleton

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellSkeleton` | `[hellSkeleton]` | directive | styling hook | Shape/size Styled Primitive driven by CSS variables; statically `aria-hidden`. |

### slider

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellSlider` | `hell-slider` | component | behavior | Host listeners (pointerdown, focusout); outputs (valueChange). |

### spinner

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellSpinner` | `[hellSpinner]` | directive | styling hook | Variant/size data attributes; accessible name from the Label Contract. |

### switch

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellNativeSwitch` | `input[type=\` | directive | behavior | Host listeners (change); outputs (checkedChange). |
| `HellSwitch` | `button[hellSwitch]` | component | behavior | Host listeners (blur); outputs (checkedChange). |

### table

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTable` | `[hellTableRoot]`, `table[hellTable]` | directive | behavior | Re-asserts table semantics (`role`) under CSS display overrides; root width state; `exportAs`. |
| `HellTableBody` | `[hellTableBody]` | directive | behavior | Re-asserts `rowgroup` semantics under CSS display overrides. |
| `HellTableCell` | `[hellTableCell]` | directive | behavior | Re-asserts `cell` semantics under CSS display overrides; align/space styling attributes. |
| `HellTableContainer` | `[hellTableContainer]` | directive | behavior | Owns busy state (`aria-busy`, `data-loading`) around the scroll container. |
| `HellTableHead` | `[hellTableHeader]`, `thead[hellTableHead]` | directive | behavior | Re-asserts `rowgroup` semantics under CSS display overrides; `exportAs`. |
| `HellTableHeaderCell` | `[hellTableHeaderCell]` | directive | behavior | Outputs (sortToggle). |
| `HellTableMeasureRow` | `[hellTableMeasureRow]` | directive | behavior | Outputs (measured). |
| `HellTableResizeHandle` | `[hellTableResizeHandle]` | component | behavior | Host listeners (pointerdown, keydown); outputs (resizeCommit). |
| `HellTableRow` | `[hellTableRow]` | directive | behavior | Re-asserts `row` semantics; reflects active/selected state; `exportAs`. |
| `HellTableRowAction` | `button[hellTableRowAction]`, `a[hellTableRowAction]` | directive | behavior | Row-action affordance excluded from row activation via its stable marker attribute; `exportAs` for harnesses. |
| `HellTableRowCheckbox` | `input[type=\` | directive | behavior | Host listeners (change); outputs (checkedChange, indeterminateChange). |
| `HellTableRowIgnore` | `[data-hell-row-ignore]`, `[hellTableRowIgnore]` | directive | projection/query marker | Writes the `data-hell-row-ignore` DOM marker that excludes elements from row activation. |
| `HellTableRowRadio` | `input[type=\` | directive | behavior | Host listeners (change); outputs (checkedChange). |
| `HellTableSelectionCell` | `[hellTableSelectionCell]` | directive | styling hook | Stable `data-hell-table-selection-cell` attribute targeted by table styles and harnesses. |
| `HellTableSortTrigger` | `button[hellTableSortTrigger]` | directive | behavior | Host listeners (click); outputs (sortToggle). |

### table-tanstack

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellDefaultTableEmptyState` | `hell-default-table-empty-state` | component | behavior | Owned template with interaction logic. |
| `HellDefaultTableErrorState` | `hell-default-table-error-state` | component | styling hook | Owned default error chrome registered through `provideHellTableStatusViews()`. |
| `HellDefaultTableLoadingState` | `hell-default-table-loading-state` | component | styling hook | Owned default loading chrome registered through `provideHellTableStatusViews()`. |
| `HellTableShellEmpty` | `ng-template[hellTableShellEmpty]` | directive | projection/query marker | `TemplateRef` carrier queried by the shell (`contentChildren`). |
| `HellTableShellError` | `ng-template[hellTableShellError]` | directive | projection/query marker | `TemplateRef` carrier queried by the shell (`contentChildren`). |
| `HellTableShellExpandedRow` | `ng-template[hellTableShellExpandedRow]` | directive | projection/query marker | `TemplateRef` carrier queried by the shell (`contentChildren`). |
| `HellTableShellFooter` | `[hellTableShellFooter]` | directive | projection/query marker | Repeatable region marker; `contentChildren` query + order-preserving data attribute. |
| `HellTableShellLoading` | `ng-template[hellTableShellLoading]` | directive | projection/query marker | `TemplateRef` carrier queried by the shell (`contentChildren`). |
| `HellTableShellToolbar` | `[hellTableShellToolbar]` | directive | projection/query marker | Repeatable region marker; `contentChildren` query + order-preserving data attribute. |
| `HellTanStackColumnFilter` | `hell-tanstack-column-filter` | component | behavior | Owned template with interaction logic. |
| `HellTanStackGlobalFilter` | `hell-tanstack-global-filter` | component | behavior | Owned template with interaction logic. |
| `HellTanStackPagination` | `hell-tanstack-pagination` | component | behavior | Owned template with interaction logic. |
| `HellTanStackTable` | `hell-tanstack-table` | component | behavior | TanStack Table Shell root: renders a caller-owned table instance with status, sticky-header, and projection contracts. |

### table-tanstack/virtual

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTanStackVirtualRows` | `hell-tanstack-table[hellTanStackVirtualRows]` | directive | behavior | Virtual Table Body Strategy: TanStack Virtual measurement and row windowing inside the shell. |

### tabs

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTab` | `button[hellTab]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellTabList` | `[hellTabList]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellTabPanel` | `[hellTabPanel]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellTabset` | `[hellTabset]` | directive | behavior | Delegates via `hostDirectives`. |

### time-input

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTimeInput` | `input[hellTimeInput]` | directive | behavior | Host listeners (input, blur, keydown); outputs (valueChange); delegates via `hostDirectives`. |

### time-picker

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTimePicker` | `hell-time-picker` | component | behavior | Owned segmented time-selection anatomy: keyboard navigation, clock bounds, presets, disabled reflection. |

### toast

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellToaster` | `hell-toaster` | component | behavior | Toast Stack renderer: position/expand/scroll state plus lifetime and layout coordination. |

### toggle

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellToggle` | `button[hellToggle]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellToggleGroup` | `[hellToggleGroup]` | directive | behavior | Host listeners (focusout); outputs (valueChange, touch); delegates via the `ngpToggleGroup` primitive engine. |
| `HellToggleGroupItem` | `button[hellToggleGroupItem]` | directive | behavior | Delegates via `hostDirectives`. |

### toolbar

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellOverflowToolbar` | `hell-overflow-toolbar` | component | behavior | Overflow toolbar renderer: measures available width, collapses action groups into the overflow menu. |
| `HellToolbar` | `[hellToolbar]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellToolbarAction` | `ng-template[hellToolbarAction]` | directive | behavior | Owns the action contract (`label`, `disabled`, `overflow`, `activated` output); also a declaration `TemplateRef` carrier. |
| `HellToolbarItem` | `[hellToolbarItem]` | directive | behavior | Delegates via `hostDirectives`. |
| `HellToolbarSeparator` | `ng-template[hellToolbarSeparator]` | directive | projection/query marker | `ng-template` declaration provider registering a separator with the overflow toolbar host. |
| `HellToolbarWidget` | `ng-template[hellToolbarWidget]` | directive | projection/query marker | `ng-template` declaration provider carrying the widget `TemplateRef` to the overflow toolbar host. |

### tooltip

| Directive | Selector | Kind | Role | Notes |
| --- | --- | --- | --- | --- |
| `HellTooltip` | `[hellTooltip]` | directive | behavior | Outputs (openChange). |
| `HellTooltipSurface` | `[hellTooltipSurface]` | directive | behavior | Delegates via `hostDirectives`. |

## Removed in #261 — omnibar decoration-only family

These five omnibar directives were decoration only — no content-query or
behavior role, no stylesheet or theme-adapter coupling beyond rules that
duplicated their own recipes — and were removed. Docs and examples now use
plain elements with classes; the replacement class recipes are documented on
the omnibar docs page and in the CHANGELOG breaking entry.

| Directive | Selector | Role | Notes |
| --- | --- | --- | --- |
| `HellOmnibarPanel` | `[hellOmnibarPanel]` | decoration only | Empty recipe; wrote only `data-slot` onto a consumer wrapper. |
| `HellOmnibarItemIcon` | `[hellOmnibarItemIcon]` | decoration only | Default classes + static `aria-hidden`; no query or state. |
| `HellOmnibarItemText` | `[hellOmnibarItemText]` | decoration only | Default layout classes only. |
| `HellOmnibarItemSubtext` | `[hellOmnibarItemSubtext]` | decoration only | Default typography classes only. |
| `HellOmnibarItemTrailing` | `[hellOmnibarItemTrailing]` | decoration only | Default layout classes only. |
