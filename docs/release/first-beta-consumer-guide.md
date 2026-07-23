# First beta consumer migration guide

Status: **internal beta guide for first external consumers**. Do not describe
Hell UI as production-ready; release copy keeps internal-beta/beta/experimental
wording until fresh release-candidate evidence (full release dry-run plus a
full browser e2e pass) says otherwise.

Use this guide when moving an app from local/alpha Hell imports to the first beta package shape for `hell-ui`.

## Quick path

1. Start from an Angular 22 app that satisfies `@angular/common`, `@angular/core`, `@angular/forms`, and `rxjs` peer ranges from [`packages/angular/package.json`](../../packages/angular/package.json).
2. Install the smallest peer tier for the entry points and CSS you import.
3. Replace root or kitchen-sink imports with narrow secondary entry points where possible.
4. Import only the Hell CSS files you need. Components expose `ui` Part Style Maps for styling refinements.
5. Treat browser-only/heavy features as lazy, client-only, and beta/experimental unless their own docs say otherwise.
6. Check the accessibility matrix and current release evidence before making production claims.

## Install peer tiers

Package peer metadata is package-wide. Some optional peers appear in the package manifest even when they are only required by a kept feature entry point; pdf.js is an optional peer needed only by `hell-ui/features/pdf-viewer`. The consumer fixture runner proves the actual strict-peer install groups with the checked-in fixtures in [`tools/consumer-fixtures/`](../../tools/consumer-fixtures/README.md).

The release workflow runs every fixture before publishing.

A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing core peers explicitly. Use `pnpm add` in consumer snippets below because the consumer fixture proof uses pnpm strict-peer installs.

Angular 22 / TypeScript 6 strict-pnpm consumers also need the current transitive
`ng-primitives` peer metadata workaround until `ng-primitives` moves from
`@phenomnomnominal/tsquery@6.1.3` to a TS-6-compatible release:

```json
{
  "pnpm": {
    "overrides": {
      "@phenomnomnominal/tsquery": "6.2.0"
    }
  }
}
```

| Consumer path                 | Install peers for this path                                                                                                                     | Entry points / CSS                                                                                                                                                                                                                | Proof fixture                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Root/core only                | `hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs` plus Angular app peers                                       | `hell-ui`, `hell-ui/core`, `hell-ui/testing`; no Hell CSS required                                                                                                                                     | [`root-core`, `testing`](../../tools/consumer-fixtures/README.md)                |
| Button Part Style Map         | Core peer group only                                                                                                                            | Narrow Button import plus `ui`; no Hell CSS/Tailwind required for compile-time behavior proof                                                                                                                                     | [`root-core`](../../tools/consumer-fixtures/README.md)                                   |
| Styled narrow primitive       | Core peer group plus `tailwindcss`                                                                                                              | Narrow primitive import plus `hell-ui/tokens.css` and each imported entry point's `styles.css`                                                                                                                           | [`styled-controls`](../../tools/consumer-fixtures/README.md) |
| Icon-backed primitive mix     | Core peer group plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`                                                                  | Narrow primitive imports such as `hell-ui/button`, `hell-ui/icon`, and `hell-ui/input`; no aggregate primitive path                                                                                    | [`icon-audio`](../../tools/consumer-fixtures/README.md)                         |
| Composites                    | Core peer group plus `tailwindcss`; add `@ng-icons/core` and `@ng-icons/font-awesome` for icon-backed composites and `@angular/router` when Dialog is imported | Narrow composite entry points such as `hell-ui/time-picker`, `hell-ui/app-shell`, `hell-ui/resizable`, `hell-ui/master-detail`, `hell-ui/dialog`, `hell-ui/omnibar`, `hell-ui/toast`, and `hell-ui/audio-player`, plus explicit entrypoint CSS | [`overlays-router`, `icon-audio`](../../tools/consumer-fixtures/README.md) |
| Audio transcript              | Composite audio-player peer group; no CodeMirror or pdf.js peers                                                                                | `hell-ui/audio-player` plus provider import from `hell-ui/features/audio-transcript`; use composite CSS, no feature CSS                                                                                         | [`icon-audio`](../../tools/consumer-fixtures/README.md)                            |
| Table primitives              | Core peer group plus `tailwindcss`; no optional table-engine peers                                                                              | `hell-ui/table`; CSS from `hell-ui/table/styles.css`                                                                                                                                                            | [`styled-controls`](../../tools/consumer-fixtures/README.md)                                       |
| TanStack table shell          | Core peer group plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`                                          | `hell-ui/table-tanstack`; caller-owned TanStack Table remains the engine                                                                                                                                                 | [`table-tanstack`](../../tools/consumer-fixtures/README.md)                              |
| TanStack virtual row strategy | TanStack shell peer group plus optional `@tanstack/virtual-core`                                                                                | `hell-ui/table-tanstack/virtual`; mounts on `hell-tanstack-table` and does not create a second table engine or root component                                                                                            | [`table-tanstack-virtual`](../../tools/consumer-fixtures/README.md)                      |
| Code editor                   | Core peer group plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight` | Kept optional entry point `hell-ui/features/code-editor`; keep lazy/client-only when runtime risk matters                                                                                                                | [`code-editor`](../../tools/consumer-fixtures/README.md)                                 |
| PDF viewer                    | Core peer group plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`, and the exact pdf.js peer                                       | `hell-ui/features/pdf-viewer`; app must provide the pdf.js worker source                                                                                                                                                 | [`pdf-viewer`](../../tools/consumer-fixtures/README.md)                                  |

Styled examples also need the Tailwind v4 build plugin from
`@tailwindcss/postcss` plus `postcss` in dev dependencies, with the same
`.postcssrc.json` shown in the Getting Started guide.

Examples:

```bash
# Button Part Style Map. Proved by the button-ui scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs

# Styled primitives. Proved by the button/date-input/time-input/number-input/pagination scenarios.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss
pnpm add -D @tailwindcss/postcss postcss

# Icon-backed primitives. Proved by the primitive-icons-css scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss

# Standalone Time Picker. Proved by the time-picker scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss

# Audio transcript feature. Proved by the audio-transcript scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss

# Table primitives. Proved by the table scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss

# TanStack table shell. Proved by the table-tanstack scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @tanstack/angular-table

# TanStack virtual row strategy. Proved by the table-tanstack-virtual scenario.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @tanstack/angular-table @tanstack/virtual-core

# Code editor feature. Proved by the code-editor fixture.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @codemirror/commands @codemirror/language @codemirror/state @codemirror/view @lezer/highlight

# PDF viewer feature. Proved by the pdf-viewer fixture.
pnpm add hell-ui @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss pdfjs-dist@5.6.205
```

Maintainers can rerun a proof path from the product workspace (checked-in
consumer fixtures; see `tools/consumer-fixtures/README.md`):

```bash
pnpm run test:consumer-fixtures
pnpm run test:consumer-fixtures root-core testing
pnpm run test:consumer-fixtures styled-controls
pnpm run test:consumer-fixtures overlays-router icon-audio
pnpm run test:consumer-fixtures table-tanstack table-tanstack-virtual
pnpm run test:consumer-fixtures code-editor
pnpm run test:consumer-fixtures pdf-viewer
```

## Root imports versus narrow imports

The root entry point is intentionally stable core only. Do not migrate alpha code by changing every import to the root barrel.

Prefer:

```ts
import { HellButton } from 'hell-ui/button';
import { HellDateInput } from 'hell-ui/date-input';
import { HellTimeInput } from 'hell-ui/time-input';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';
import { HELL_SELECT_IMPORTS } from 'hell-ui/select';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';
import { HELL_MASTER_DETAIL_IMPORTS } from 'hell-ui/master-detail';
import { HellTimePicker } from 'hell-ui/time-picker';
import { HELL_TABLE_UTILITIES_IMPORTS } from 'hell-ui/table';
import { HellButtonHarness } from 'hell-ui/testing';
```

Avoid broad imports when a narrow path exists:

```ts
// Removed aggregate paths. Import each surface from its import-path entry point instead.
import { HellButton } from 'hell-ui/button';
import { HellInput } from 'hell-ui/input';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';
import { HELL_MASTER_DETAIL_IMPORTS } from 'hell-ui/master-detail';
```

Use `hell-ui` for stable core exports only. Use `/table`, `/table-tanstack`, `/features/*`, and narrow component entry points for UI surfaces.

## CSS imports

Hell CSS entry points use Tailwind v4 theme features. Install `tailwindcss` and configure `@tailwindcss/postcss` whenever you import Hell CSS.

Recommended: the Default Style Bundle — one generated import carrying the
token substrate plus every standard component stylesheet:

```css
@import 'tailwindcss';
@import 'hell-ui/styles.css';
```

Advanced alternative (Granular Style Mode): import `hell-ui/tokens.css` once,
then only the entrypoint CSS needed by the entry points the app imports. Pick
one standard-style mode; combining the bundle with granular standard imports
duplicates the same CSS.

```css
@import 'tailwindcss';
@import 'hell-ui/tokens.css';
@import 'hell-ui/button/styles.css';
@import 'hell-ui/app-shell/styles.css';
@import 'hell-ui/table/styles.css';
```

Heavy Feature Stylesheets stay excluded from the Default Style Bundle; add
them explicitly, in either mode, when the app imports their entry points:

```css
@import 'hell-ui/features/code-editor/styles.css';
@import 'hell-ui/features/pdf-viewer/styles.css';
```

Optional Theme Adapter Stylesheets are imported after the component CSS they
adapt. They are partial by design; unsupported components keep their default
entrypoint styles.

```css
@import 'hell-ui/card/styles.css';
@import 'hell-ui/dialog/styles.css';
@import 'hell-ui/menu/styles.css';
@import 'hell-ui/themes/glass.css';
```

Avoid old category-level style imports; CSS follows the same import-path-first rule as TypeScript. PDF viewer styles come from `hell-ui/features/pdf-viewer/styles.css`.

Hell's CSS entry points carry the Tailwind source anchors needed by the package
build, and the package-consumer matrix verifies consumers can import those
shipped CSS files without adding `node_modules/hell-ui` to their own
Tailwind `@source` scanning. If an app invents its own Tailwind classes in
`ui`, those classes still belong to the app's own Tailwind content/source
pipeline.

## Date Input is native-input behavior

The owned `<hell-date-input>` component and its embedded calendar are removed.
Apply `hellDateInput` to the real input, rename `date` / `dateChange` to the
`value` model (`[value]` / `(valueChange)`, or two-way `[(value)]`), and
author native element attributes directly:

```html
<!-- Before -->
<hell-date-input
  inputId="ship-date"
  name="shipDate"
  placeholder="YYYY-MM-DD"
  [date]="shipDate"
  (dateChange)="shipDate = $event"
/>

<!-- After -->
<input
  id="ship-date"
  hellDateInput
  name="shipDate"
  placeholder="YYYY-MM-DD"
  [value]="shipDate"
  (valueChange)="shipDate = $event"
/>
```

The directive's committed `value` is one `Date | null` model — its Control
Value Authority. Direct `[value]`, two-way `[(value)]`, Signal Forms
`[formField]`, Reactive Forms `formControl`, and template-driven `ngModel` all
read and write the same model through Angular's built-in Signal Forms
interoperability; there is no `ControlValueAccessor` and no directive-owned
control errors. Declare required and range policy on the form
(`Validators.required` for classic controls, or `required()` /
`minDate()` / `maxDate()` schema rules whose metadata drives the reserved
`required` / `min` / `max` inputs); the directive keeps adapter overrides,
editable invalid drafts (commit attempts report `invalidDateInputDraft` to a
bound Signal Forms field), visual invalid state, external synchronization, and
nullable clear commits. Its `ui` refines the reused Input root only. The
removed `root`, `input`, `trigger`, `triggerIcon`, and `pickerPanel` Date
Input parts do not have aliases.

When a calendar is useful, compose a Control Group containing the Date Input
and an accessible action, then open Date Picker in Popover. Keep one controlled
date or form control; on selection update it, close the popover, and focus the
input. Popover restores focus to the trigger when Escape dismisses the panel.
Import and style Control Group, Popover, Date Picker, Icon, and any Button/action
surface from their own narrow entry points. `HellDateInputHarness` now targets
`input[hellDateInput]`; use `getValue()`, `setValue()`, `focus()`, and `blur()`
instead of inner-input or embedded-picker harness methods.

## Time Input is native-input behavior

The owned `<hell-time-input>` component, clock trigger, and embedded segmented
picker are removed. Apply `hellTimeInput` to the real input and author native
attributes directly:

```html
<!-- Before -->
<hell-time-input
  inputId="start-time"
  name="startTime"
  placeholder="HH:mm"
  [value]="startTime"
  (valueChange)="startTime = $event"
/>

<!-- After -->
<input
  id="start-time"
  hellTimeInput
  type="text"
  name="startTime"
  placeholder="HH:mm"
  inputmode="numeric"
  [value]="startTime"
  (valueChange)="startTime = $event"
/>
```

The directive's committed `value` is one `HellTimeValue | null` model — its
Control Value Authority. Direct `[value]`, two-way `[(value)]`, Signal Forms
`[formField]`, Reactive Forms `formControl`, and template-driven `ngModel` all
read and write the same model through Angular's built-in Signal Forms
interoperability; there is no `ControlValueAccessor` and no directive-owned
control errors. Declare required and range policy on the form (structured
times have no `minDate()`/`maxDate()` schema equivalent, so bind the reserved
`min` / `max` inputs directly when bounds apply); the directive keeps optional
seconds, adapter overrides, editable invalid drafts (commit attempts report
`invalidTimeInputDraft` to a bound Signal Forms field), visual invalid state,
external synchronization, and nullable clear commits. Bounds are a linear
time-of-day interval; a `min` later than `max` is not an overnight range.
Hidden seconds normalize to zero. Keep the input as text when the
default compact/12-hour parser, visible invalid drafts, or a custom textual
adapter is required; consumers may author `type="time"` when native browser
sanitization and picker UI are deliberate. The directive never changes the
authored type.

`ui` refines the reused Input root only. The removed label token, embedded
trigger, embedded picker, and 15-part `HellTimeInputPart` /
`HellTimeInputUi` anatomy have no aliases. When segmented selection is useful,
compose a Control Group containing the Time Input and an accessible action,
then open standalone Time Picker in Popover. Keep one controlled time or form
control; apply picker changes to it, close through an explicit Done action (or
through normal Escape/outside dismissal), and intentionally restore focus.
Import and style Control Group, Popover, Time Picker, Icon, and Button/action
surfaces from their own narrow entry points.

`HellTimeInputHarness` now targets `input[hellTimeInput]`; use `getValue()`,
`setValue()`, `focus()`, `blur()`, `isDisabled()`, `isRequired()`, and
`isInvalid()`. Replace `openPicker()` with harnesses for the
consumer-owned trigger, Popover, and Time Picker.

## Number Input is native-input behavior

The owned `<hell-number-input>` component, optional embedded steppers, and
suffix string are removed. Apply `hellNumberInput` to the real input, export
its controller, and compose only the directional actions and unit markup the
workflow needs:

```html
<!-- Before -->
<hell-number-input
  inputId="quantity"
  name="quantity"
  suffix="items"
  steppers
  [value]="quantity"
  (valueChange)="quantity = $event"
/>

<!-- After -->
<div hellControlGroup>
  <input
    #quantityInput="hellNumberInput"
    id="quantity"
    hellNumberInput
    name="quantity"
    aria-label="Quantity"
    [attr.aria-valuetext]="quantity === null ? null : quantity + ' items'"
    [value]="quantity"
    (valueChange)="quantity = $event"
  />
  <span hellControlGroupSuffix>items</span>
  <button hellNumberStep="decrement" [hellNumberStepFor]="quantityInput">−</button>
  <button hellNumberStep="increment" [hellNumberStepFor]="quantityInput">+</button>
</div>
```

The directive's committed `value` is one `number | null` model — its Control
Value Authority. Direct `[value]`, two-way `[(value)]`, Signal Forms
`[formField]`, Reactive Forms `formControl`, and template-driven `ngModel` all
read and write the same model through Angular's built-in Signal Forms
interoperability; there is no `ControlValueAccessor` and no directive-owned
control errors. Declare required and range policy on the form
(`Validators.required` / `Validators.min` / `Validators.max` for classic
controls, or `required()` / `min()` / `max()` schema rules whose metadata
drives the reserved `required` / `min` / `max` inputs); the directive keeps
adapter overrides, editable malformed drafts (commit attempts report
`invalidNumberInputDraft` to a bound Signal Forms field), visual invalid
state, external synchronization, keyboard and wheel behavior, and synchronous
native form submission. It deliberately owns a text input so invalid drafts
are not sanitized; `integer` selects numeric input-mode metadata while decimal
mode selects decimal metadata. Typing may commit an out-of-range value and
report validation; stepping clamps to bounds.

Each `button[hellNumberStep]` requires an `increment` or `decrement` direction
and an explicit `hellNumberStepFor` controller. It derives an accessible label
from the target, stays outside the tab order, disables at the corresponding
bound, supports Shift multiplication and hold-to-repeat, and keeps focus on the
input. Project units with Control Group or ordinary consumer markup and author
`aria-valuetext` when the unit changes the announced value. The removed
`steppers`, `suffix`, `inputId`, `HellNumberInputPart`, and
`HellNumberInputUi` surfaces have no aliases; style the input, step buttons,
group, and suffix through their own local `root` maps.

## Split View is replaced by the Master Detail controller

The owned `hell-ui/split-view` component and stylesheet are removed.
Import `HELL_MASTER_DETAIL_IMPORTS` from `hell-ui/master-detail` and
apply its directives to application-owned elements:

```html
<!-- Before -->
<hell-split-view
  framed
  [height]="480"
  [detailOpen]="detailOpen"
  (detailOpenChange)="detailOpen = $event"
>
  <ng-template hellSplitPrimary>Primary content</ng-template>
  <ng-template hellSplitDetail>Detail content</ng-template>
</hell-split-view>

<!-- After -->
<div
  hellMasterDetail
  [(detailOpen)]="detailOpen"
  ui="grid h-[480px] grid-cols-2 data-[compact=true]:grid-cols-1"
>
  <section hellMasterPane="primary">Primary content</section>
  <section hellMasterPane="detail">
    <button hellMasterDetailBack type="button">Back</button>
    Detail content
  </section>
</div>
```

`detailOpen` / `detailOpenChange` and `compactBelow` keep their meanings. The
exported controller also exposes a readonly `compact()` signal so consumer
markup can hide an external separator. Move `primaryFlex`, `detailFlex`,
`primaryMinSize`, and `detailMinSize` to separately imported
`hellResizablePane` directives; render `hellResizableHandle` between them.
Replace `framed`, `height`, and the removed owned Part Style Map with consumer
markup plus each directive's local `root` `ui`. Replace `backLabel` with the
projected native `button[hellMasterDetailBack]` content. Replace
`itemNavigation`, its labels and disabled inputs, and the `previousItem` /
`nextItem` outputs with ordinary Toolbar buttons or Pagination controls bound
to application-owned selection state. Import
`hell-ui/master-detail/styles.css` instead of the removed Split View
stylesheet, plus the narrow stylesheets for any composed Resizable, Toolbar,
Pagination, and Button entry points. There are no compatibility exports,
selectors, inputs, outputs, Public Parts, or package paths.

## App Shell keeps responsive coordination and slims presentation inputs

`hell-ui/app-shell` remains the Composite for the four-region grid,
responsive overlay transitions, focus trapping and restoration, and dismissal.
The shell root is now the only source of sidenav and secondary-panel state.
Keep its controlled `sidenavCollapsed` / `sidenavCollapsedChange` and
`secondaryHidden` / `secondaryHiddenChange` pairs when application code must
read, persist, or synchronize that state. Remove duplicate `collapsed`,
`hidden`, and shell-coordination `id` bindings from `hellAppSidenav` and
`hellAppSecondary`; the shell registers those projected panels and their ARIA
relationships internally.

Toggle chrome is now a placement recipe instead of an `appearance` mode:

```html
<div
  hellAppShell
  #shell="hellAppShell"
  [sidenavCollapsed]="sidenavCollapsed"
  (sidenavCollapsedChange)="sidenavCollapsed = $event"
  [secondaryHidden]="secondaryHidden"
  (secondaryHiddenChange)="secondaryHidden = $event"
>
  <header hellAppTopbar>
    <!-- A direct topbar child receives the leading toggle treatment. -->
    <button hellSidenavToggle type="button"></button>
  </header>

  <nav hellAppSidenav aria-label="Primary">…</nav>

  <main hellAppContent ui="[--hell-app-content-max-width:960px]">…</main>

  <aside hellAppSecondary>
    <!-- A direct secondary child becomes the collapsed rail action. -->
    <button hellSecondaryToggle type="button"></button>
    <div hellAppSecondaryBody>
      <!-- A direct body child becomes the full-width header action. -->
      <button hellSecondaryToggle type="button">Activity</button>
      …
    </div>
  </aside>
</div>
```

Remove `appearance="shell"`, `appearance="header"`, and
`appearance="rail"`; refine each toggle's local `root` Part Style Map through
`ui` when the shipped placement treatment needs customization. Replace
`hellAppContent[maxWidth]` with the public
`--hell-app-content-max-width` variable through that directive's local `ui`, as
shown above. The default remains `1760px`.

The public shell controller intentionally keeps only three imperative actions:
`toggleSidenav()`, `toggleSecondary()`, and `closeMobilePanels()`. Replace reads
of the removed `isSidenavCollapsed()`, `isSecondaryHidden()`,
`isMobileLayout()`, and `mobileOpenPanel()` getters (and shell-derived panel id
properties) with the controlled input/output pairs when consumer logic needs
state. Deliberate close actions such as routed-nav clicks may continue calling
`shell.closeMobilePanels()`.

## Tooltip content is explicit and surfaces stay separate

The Tooltip vocabulary is renamed without compatibility aliases. The trigger
`HellTooltipTrigger` (`button[hellTooltipTrigger], a[hellTooltipTrigger]`,
exported as `hellTooltipTrigger`) is now `HellTooltip` (`[hellTooltip]` on any
host, exported as `hellTooltip`), and the consumer-authored surface previously
named `HellTooltip` (`[hellTooltip]`) is now `HellTooltipSurface`
(`[hellTooltipSurface]`). The trigger binding is the content itself — exactly
`string | TemplateRef<unknown> | null | undefined`:

```html
<!-- Before: every hint required a template and a surface directive -->
<button hellButton type="button" [hellTooltipTrigger]="hint">Save</button>
<ng-template #hint>
  <div hellTooltip>Saves to every environment</div>
</ng-template>

<!-- After: plain text is one binding on the trigger -->
<button hellButton type="button" hellTooltip="Saves to every environment">Save</button>

<!-- After: rich markup keeps a template with an explicit, separately styled surface -->
<button hellButton type="button" [hellTooltip]="hint">Save</button>
<ng-template #hint>
  <div hellTooltipSurface [ui]="{ root: 'rounded-hell-pill' }">
    Press <kbd>S</kbd> to save
  </div>
</ng-template>
```

Rules for migration:

- Replace simple Tooltip templates with strings; keep a template only for rich
  markup or a custom `ui`. A present string renders the implicit default
  Tooltip Surface with the same `[hellTooltipSurface]` selector,
  `role="tooltip"`, root Public Part, recipe, and theme hooks as an explicit
  surface. The surface's `ui` styles only that floating surface, never the
  trigger host, so `HellButton` and Tooltip compose on one host without input
  collisions.
- `null`, `undefined`, and the empty string are absent content: they close and
  disable the interaction. The removed trigger `disabled` input has no
  replacement flag — bind absent content instead. Present-to-present content
  changes (including string/template transitions) update presentation without
  closing an open tooltip.
- The removed `hoverableContent` input and `data-hoverable` state attribute
  have no replacements: the surface is always hoverable, Escape always
  dismisses without moving focus, and the entrance animation respects
  `prefers-reduced-motion`.
- The trigger now attaches to any host without adding focusability or
  mutating the host (`type`, `aria-disabled`, and `tabindex` writes are
  removed), never derives the host's accessible name from content, and never
  opens on a natively disabled control; give explanatory help for a disabled
  control a separate focusable wrapper.
- Upstream positioning and timing capabilities stay reachable under upstream
  ng-primitives types: `placement`, `offset`, `flip`, `shift`, `container`,
  `anchor`, programmatic `position`, `trackPosition`, `showOnOverflow`,
  `scrollBehavior`, `showDelay`, `hideDelay`, and `cooldown`. Scope policy
  with `provideHellTooltipDefaults(...)`: partial `HellTooltipDefaults`
  objects merge over the nearest ancestor provider, local trigger inputs win,
  and Hell guarantees a 500 ms show delay, 0 ms hide delay, and 300 ms
  cooldown when nothing overrides them.
- `open`, `(openChange)`, `show()`, `hide()`, and `exportAs` `hellTooltip`
  keep the Anchored Surface Contract. Tooltip exports no directive
  convenience array: import `HellTooltip` for the common path and add
  `HellTooltipSurface` only for custom surfaces.

The [`styled-controls`](../../tools/consumer-fixtures/README.md) consumer
fixture proves both packed paths: the one-binding string hint and a custom
template with a separately styled explicit Tooltip Surface.

## Part Style Maps replace Style Opt-Out

`HellButton`, `HellInput`, `HellNativeSelect`, `HellTextarea`, `HellDialpad`,
`HellDateInput`, `HellTimeInput`, `HellTimePicker`, `HellDatePicker`, `HellDateRangePicker`,
Checkbox/NativeCheckbox, RadioGroup/Radio/NativeRadioGroup/NativeRadio,
Switch/NativeSwitch, Toggle/ToggleGroup/ToggleGroupItem, Slider, the migrated
directive-suite batches (`HellCard`, `HellField`, `HellTabset`,
`HellAccordion`, `HellMenu`, `HellListbox`, `HellPopover`, `HellTooltipSurface`,
`HellSelect`, and `HellCombobox` families), the App Shell/nav
directives, Resizable directives,
Pagination/PaginationStrip, and Table primitives have migrated from
Style Opt-Out to the Part Style Map API. Pass `ui` when you want to refine
public parts while keeping Hell behavior, state attributes, and accessibility
wiring.

Master Detail's three projected directives each expose only a local `root` map;
consumer markup owns pane layout, framing, and navigation. Dialog, Toast,
AudioPlayer, Omnibar, and CodeEditor use
the same Part Style Map contract for their owned anatomy and no longer expose
`unstyled`.

Omnibar owns command-interaction coordination, not search or token policy.
Bind its controlled `query` and `open` models, compose `hellSearchResource`
for local or async data/status state, and project the resulting chrome and
items. Omnibar composes the public Chip Set/Input keyboard behavior; project
public Chip and Chip Remove primitives when the query includes editable scope
tokens.

```html
<button hellButton type="button" ui="rounded-hell-pill bg-hell-primary">Save</button>
<input hellInput ui="rounded-hell-pill px-hell-5" aria-label="Search" />
<div hellCard [ui]="{ root: 'rounded-hell-xl' }">
  <div hellCardBody [ui]="{ root: 'p-hell-8' }">Card body</div>
</div>
<div hellAppShell ui="bg-hell-surface-muted">
  <nav hellAppSidenav ui="bg-hell-surface-elevated"></nav>
</div>
<div hellResizable orientation="horizontal" ui="h-[240px]">
  <section hellResizablePane ui="hd-surface-elevated p-4">Left</section>
  <div hellResizableHandle appearance="grip" ui="bg-hell-surface-muted"></div>
  <section hellResizablePane ui="hd-surface-subtle p-4">Right</section>
</div>
<div
  hellMasterDetail
  [(detailOpen)]="detailOpen"
  ui="grid grid-cols-2 data-[compact=true]:grid-cols-1"
>
  <section hellMasterPane="primary">Primary</section>
  <section hellMasterPane="detail">
    <button hellMasterDetailBack type="button">Back</button>
    Detail
  </section>
</div>
<hell-dialpad [ui]="{ keyButton: 'rounded-hell-pill', callButton: 'bg-hell-success-strong' }" />
<hell-audio-player [ui]="{ controls: 'gap-hell-3', time: 'tabular-nums' }" src="/audio.ogg" />
<hell-toaster [ui]="{ toast: 'shadow-hell-lg', toolbar: 'gap-hell-2' }" />
<hell-code-editor [ui]="{ root: 'rounded-hell-lg', editor: 'min-h-[16rem]' }" />
<input hellDateInput ui="tabular-nums" aria-label="Ship date" />
<input hellNumberInput ui="tabular-nums" aria-label="Quantity" />
<hell-time-picker [ui]="{ readout: 'text-hell-primary', minutePreset: 'rounded-hell-md' }" />
<button hellCheckbox ui="rounded-hell-pill" aria-label="Accepted"></button>
<button hellSwitch [ui]="{ root: 'bg-hell-info-soft', thumb: 'shadow-none' }" aria-label="Alerts"></button>
<hell-slider [ui]="{ range: 'bg-hell-info', thumb: 'border-hell-info' }" aria-label="Volume" />
```

Rules for migration:

- Keep the directive import narrow, for example `hell-ui/button`,
  `hell-ui/input`, `hell-ui/card`,
  `hell-ui/app-shell`, `hell-ui/resizable`,
  `hell-ui/master-detail`, `hell-ui/pagination`, or
  `hell-ui/table`.
- Import Hell CSS when you want shipped default visuals; package-consumer
  scenarios assert representative compiled recipe utilities, and the broader
  matrix verifies migrated CSS entry points are importable without consumer
  `@source` scanning for Hell package files.
- Use `ui="..."` for single-root directives such as Button, Input, Card, Field,
  Tabs, Accordion, App Shell/nav, Resizable, Checkbox, NativeCheckbox, Radio,
  RadioGroup, NativeRadio, NativeRadioGroup, NativeSwitch, Toggle, ToggleGroup,
  ToggleGroupItem, Menu, Listbox, Popover, Tooltip Surface, Select, Combobox, Date Input,
  Time Input, Number Input, Pagination controls, and Table primitive directives.
- Use each projected child directive's local `ui`; a Card, Field, Tabs,
  Accordion, or App Shell root does not style its children remotely.
- Use `[ui]="{ ... }"` for owned-anatomy components with multiple public parts,
  such as Dialpad, PaginationStrip, Slider, Switch, Time Picker,
  Dialog, Toast, AudioPlayer, Omnibar, and CodeEditor. Omnibar keeps owned interaction anatomy
  but composes projected Search Resource state and public Chip primitives.
  Combobox is projection-first: refine each projected directive's single
  `root` part and compose Search Resource, Control Group, Chip Set, or Chip
  Input from their own entry points as needed.
- Use `class` for layout hooks and non-conflicting additions only; use `ui` for deterministic Tailwind utility conflicts because template class order is outside the Part-Class Pipeline.
- Continue to test the behavior and accessible name; styling APIs are not accessibility opt-outs.

The [`root-core`](../../tools/consumer-fixtures/README.md) consumer fixture
proves the typed Button `ui` path without Tailwind or Hell CSS. The
[`styled-controls`](../../tools/consumer-fixtures/README.md) fixture proves
compiled recipe CSS and semantic token runtime theming for the styled
controls, and binds every migrated form control — Checkbox, Switch, Radio
Group, Slider, Toggle Group, Select, Combobox, and the native Date/Time/Number
Input directives — through direct, two-way, `formField`, `formControl`, and
`ngModel` paths at once, with reused Input-root CSS and adapter contracts and
without picker or icon peers. The
[`overlays-router`](../../tools/consumer-fixtures/README.md),
[`icon-audio`](../../tools/consumer-fixtures/README.md), and feature fixtures
widen that proof across migrated primitive, floating/list directive-suite,
pagination, table, layout, feedback, media, search, and editor CSS entry
points, including Checkbox, Radio, Slider, Switch, Toggle, Dialog, Toast,
AudioPlayer, Omnibar, and CodeEditor.

## Heavy and browser-only features

Treat these as deliberate opt-ins, not default UI kit imports.

| Feature                             | First-beta guidance                                                                                                                                                                                                                                                                                        | Current status                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table primitives and TanStack shell | Keep primitives behind `hell-ui/table`. Use `hell-ui/table-tanstack` for a Hell-styled shell around a caller-owned TanStack Table instance. Use `hell-ui/table-tanstack/virtual` only when the shell needs TanStack Virtual row math.                                           | Beta primitives; TanStack shell and virtual row strategy are experimental. Legacy table feature aliases and unsupported table paths were removed before beta; the entrypoint manifest check rejects new ones. |
| Code editor                         | Keep behind the kept optional `hell-ui/features/code-editor` entry point; lazy-load or client-only load in SSR-sensitive apps; pass owner-document-aware setup where possible.                                                                                                                    | Experimental in package/source comments; stable API report promotion stays policy-owned.                                                                                                                                       |
| PDF viewer                          | Keep behind the optional `hell-ui/features/pdf-viewer` entry point; install the exact pdf.js peer and pass an app-owned worker source.                                                                                                                                                            | Experimental/browser-only feature entry point.                                                                                                                                                                               |
| Audio speech transcript             | Do not present `allowSpeechTranscript` as accessibility captions or timed text. Import `provideHellAudioTranscript()` from `hell-ui/features/audio-transcript` only where the route/app deliberately opts into the browser transcript provider, and provide real captions/transcripts separately. | Experimental Chromium-only / best-effort; runtime is isolated behind the optional feature provider.                                                                                                                           |
| Floating/popover/omnibar dismissal   | Use documented components, but avoid building product-critical guarantees on unreviewed dismissal internals.                                                                                                                                                                                               | Browser contracts exist for key paths; remaining seams must stay covered by current browser evidence.                                                                                                                         |
| Resize behavior                     | Treat split/table resizing as browser behavior requiring current browser evidence.                                                                                                                                                                                                                         | Browser resize contracts must stay current before production-ready claims.                                                                                                                                                     |

## Known experimental and deprecated APIs

Known experimental/best-effort surfaces:

- `hell-ui/features/audio-transcript`
- `hell-ui/features/code-editor`
- `hell-ui/table-tanstack`
- `hell-ui/table-tanstack/virtual`
- `hell-ui/features/pdf-viewer`
- audio-player speech transcript options such as `allowSpeechTranscript`

Removed import-tuple compatibility exports:

| Removed alias                                      | Replacement                                                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `HELL_ACCORDION_DIRECTIVES`                        | `HELL_ACCORDION_IMPORTS` from `hell-ui/accordion`                                          |
| `HELL_ALERT_DIRECTIVES`                            | `HELL_ALERT_IMPORTS` from `hell-ui/alert`                                                   |
| `HELL_APP_SHELL_DIRECTIVES`                        | `HELL_APP_SHELL_IMPORTS` from `hell-ui/app-shell`                                          |
| `HELL_AVATAR_GROUP_DIRECTIVES`                     | `HELL_AVATAR_GROUP_IMPORTS` from `hell-ui/avatar`                                          |
| `HELL_BREADCRUMBS_DIRECTIVES`                      | `HELL_BREADCRUMBS_IMPORTS` from `hell-ui/breadcrumbs`                                      |
| `HELL_CARD_DIRECTIVES`                             | `HELL_CARD_IMPORTS` from `hell-ui/card`                                                     |
| `HELL_CHIP_DIRECTIVES`                             | `HELL_CHIP_IMPORTS` from `hell-ui/chip`                                                     |
| `HELL_COMBOBOX_DIRECTIVES`                         | `HELL_COMBOBOX_IMPORTS` from `hell-ui/combobox`                                            |
| `HELL_CONTROL_GROUP_DIRECTIVES`                    | `HELL_CONTROL_GROUP_IMPORTS` from `hell-ui/control-group`                                  |
| `HELL_DIALOG_DIRECTIVES`                           | `HELL_DIALOG_IMPORTS` from `hell-ui/dialog`                                                 |
| `HELL_EMPTY_STATE_DIRECTIVES`                      | `HELL_EMPTY_STATE_IMPORTS` from `hell-ui/empty-state`                                      |
| `HELL_FIELD_DIRECTIVES`                            | `HELL_FIELD_IMPORTS` from `hell-ui/field`                                                   |
| `HELL_SEARCH_DIRECTIVES`                           | `HELL_SEARCH_IMPORTS` from `hell-ui/input`                                                  |
| `HELL_LISTBOX_DIRECTIVES`                          | `HELL_LISTBOX_IMPORTS` from `hell-ui/listbox`                                               |
| `HELL_MENU_DIRECTIVES`                             | `HELL_MENU_IMPORTS` from `hell-ui/menu`                                                     |
| `HELL_OMNIBAR_DIRECTIVES`                          | `HELL_OMNIBAR_IMPORTS` from `hell-ui/omnibar`                                               |
| `HELL_PAGE_HEADER_DIRECTIVES`                      | `HELL_PAGE_HEADER_IMPORTS` from `hell-ui/page-header`                                      |
| `HELL_PAGINATION_DIRECTIVES`                       | `HELL_PAGINATION_IMPORTS` from `hell-ui/pagination`                                        |
| `HELL_RESIZABLE_DIRECTIVES`                        | `HELL_RESIZABLE_IMPORTS` from `hell-ui/resizable`                                          |
| `HELL_SELECT_DIRECTIVES`                           | `HELL_SELECT_IMPORTS` from `hell-ui/select`                                                 |
| `HELL_TABLE_UTILITIES_DIRECTIVES`                  | `HELL_TABLE_UTILITIES_IMPORTS` from `hell-ui/table`                                        |
| `HELL_TANSTACK_TABLE_DIRECTIVES`                   | `HELL_TANSTACK_TABLE_IMPORTS` from `hell-ui/table-tanstack`                                |
| `HELL_TANSTACK_TABLE_VIRTUAL_DIRECTIVES`           | `HELL_TANSTACK_TABLE_VIRTUAL_IMPORTS` from `hell-ui/table-tanstack/virtual`                |
| `HELL_TABS_DIRECTIVES`                             | `HELL_TABS_IMPORTS` from `hell-ui/tabs`                                                     |
| `HELL_TOAST_DIRECTIVES`                            | `HELL_TOAST_IMPORTS` from `hell-ui/toast`                                                   |
| `HELL_TOOLBAR_DIRECTIVES`                          | `HELL_TOOLBAR_IMPORTS` from `hell-ui/toolbar`                                               |

Removed pre-beta table compatibility surfaces:

| Removed surface                                                                    | Replacement                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| old table feature entrypoints and unsupported adapter paths                        | `hell-ui/table` for primitives; `hell-ui/table-tanstack` for TanStack-owned table behavior                         |
| `HELL_TABLE_DIRECTIVES`, `HELL_TABLE_UTILITY_DIRECTIVES`                           | `HELL_TABLE_UTILITIES_IMPORTS` from `hell-ui/table`                                                                         |
| `HellTableRow.interactive` / `selectionSemantics` / `[selectable]` / `(rowSelect)` | `hellTableRowAction` for row actions; `hellTableRowCheckbox` / `hellTableRowRadio` inside `hellTableSelectionCell` for row selection |

Experimental APIs may change or disappear between pre-1.0 releases.

## Browser, SSR, and accessibility support

Current support is evidence-based and not a production guarantee.

- Root/core and API-report guarded primitives are the safest SSR import paths. Primitive docs may still name component-specific browser behavior.
- Composites are browser-first and may use `document`, `window`, or global listeners for overlays, hotkeys, portals, and dismissal.
- Table primitives use `ResizeObserver`.
- Code editor needs browser `window`/`document` through CodeMirror.
- PDF viewer is browser-only and lives behind `hell-ui/features/pdf-viewer`: pdf.js worker setup, printing/download helpers, thumbnails, global listeners, and browser compatibility are app-owned risk.
- Speech transcript uses Chromium-only Web Speech and media-capture APIs where available through `hell-ui/features/audio-transcript`; it is not accessibility-grade captions.

Current browser evidence is tracked through Playwright: a production-ready claim needs every `e2e/*.spec.ts` file passing across chromium, firefox, and webkit on the current commit. Until then, treat browser support as scenario evidence rather than a general browser-support guarantee.

Accessibility support lives in the docs app accessibility matrix source at [`apps/docs/src/app/pages/accessibility/accessibility.page.ts`](../../apps/docs/src/app/pages/accessibility/accessibility.page.ts). The matrix tracks role pattern, keyboard coverage, axe/ARIA/browser-test coverage, and known gaps per public surface.

Current not-production-ready gaps:

- The accessibility matrix currently records no critical gaps, but the production-ready claim still requires fresh browser evidence (`pnpm e2e` across chromium/firefox/webkit) on the release-candidate commit; per-surface known gaps in the matrix remain consumer-relevant reading.
- A release-candidate commit must pass the release workflow gate (changelog, lint, architecture, unit, build, pack audit, consumer fixtures, API report, docs build) on the current commit.
- Local `test-results/` evidence is intentionally untracked; rerun the commands for each release candidate instead of relying on stale artifacts.

Before telling external consumers that Hell UI is production-ready, run:

```bash
pnpm release:dry-run
pnpm e2e
```

If either gate fails, release notes and docs must keep **internal beta**, **beta**, or **experimental** wording.
