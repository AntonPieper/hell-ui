# First beta consumer migration guide

Status: **internal beta guide for first external consumers**. Do not describe
Hell UI as production-ready; release copy keeps internal-beta/beta/experimental
wording until fresh release-candidate evidence (full release dry-run plus a
full browser e2e pass) says otherwise.

Use this guide when moving an app from local/alpha Hell imports to the first beta package shape for `@hell-ui/angular`.

## Quick path

1. Start from an Angular 22 app that satisfies `@angular/common`, `@angular/core`, `@angular/forms`, and `rxjs` peer ranges from [`packages/angular/package.json`](../../packages/angular/package.json).
2. Install the smallest peer tier for the entry points and CSS you import.
3. Replace root or kitchen-sink imports with narrow secondary entry points where possible.
4. Import only the Hell CSS files you need. Components expose `ui` Part Style Maps for styling refinements.
5. Treat browser-only/heavy features as lazy, client-only, and beta/experimental unless their own docs say otherwise.
6. Check the accessibility matrix and current release evidence before making production claims.

## Install peer tiers

Package peer metadata is package-wide. Some optional peers appear in the package manifest even when they are only required by a kept feature entry point; pdf.js is an optional peer needed only by `@hell-ui/angular/features/pdf-viewer`. The package-consumer runner proves the actual strict-peer install groups in [`tools/check-package-consumer.mjs`](../../tools/check-package-consumer.mjs).

The release workflow runs every scenario in that catalog before publishing.

A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing core peers explicitly. Use `pnpm add` in consumer snippets below because the package-consumer proof uses pnpm strict-peer installs.

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

| Consumer path                 | Install peers for this path                                                                                                                     | Entry points / CSS                                                                                                                                                                                                                | Proof scenario                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Root/core only                | `@hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs` plus Angular app peers                                       | `@hell-ui/angular`, `@hell-ui/angular/core`, `@hell-ui/angular/testing`; no Hell CSS required                                                                                                                                     | [`root-core`, `core`, `testing`](../../tools/check-package-consumer.mjs)                |
| Button Part Style Map         | Core peer group only                                                                                                                            | Narrow Button import plus `ui`; no Hell CSS/Tailwind required for compile-time behavior proof                                                                                                                                     | [`button-ui`](../../tools/check-package-consumer.mjs)                                   |
| Styled narrow primitive       | Core peer group plus `tailwindcss`                                                                                                              | Narrow primitive import plus `@hell-ui/angular/tokens.css` and each imported entry point's `styles.css`                                                                                                                           | [`button`, `pagination`](../../tools/check-package-consumer.mjs)                        |
| Icon-backed primitive mix     | Core peer group plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`                                                                  | Narrow primitive imports such as `@hell-ui/angular/button`, `@hell-ui/angular/icon`, and `@hell-ui/angular/input`; no aggregate primitive path                                                                                    | [`primitive-icons-css`](../../tools/check-package-consumer.mjs)                         |
| Composites                    | Core peer group plus `tailwindcss`; add `@ng-icons/core` and `@ng-icons/font-awesome` for icon-backed composites and `@angular/router` when Dialog is imported | Narrow composite entry points such as `@hell-ui/angular/app-shell`, `@hell-ui/angular/resizable`, `@hell-ui/angular/split-view`, `@hell-ui/angular/dialog`, `@hell-ui/angular/omnibar`, `@hell-ui/angular/toast`, and `@hell-ui/angular/audio-player`, plus explicit entrypoint CSS | [`app-shell`, `resizable`, `split-view`, `audio-player`, `composite-css`](../../tools/check-package-consumer.mjs) |
| Audio transcript              | Composite audio-player peer group; no CodeMirror or pdf.js peers                                                                                | `@hell-ui/angular/audio-player` plus provider import from `@hell-ui/angular/features/audio-transcript`; use composite CSS, no feature CSS                                                                                         | [`audio-transcript`](../../tools/check-package-consumer.mjs)                            |
| Table primitives              | Core peer group plus `tailwindcss`; no optional table-engine peers                                                                              | `@hell-ui/angular/table`; CSS from `@hell-ui/angular/table/styles.css`                                                                                                                                                            | [`table`](../../tools/check-package-consumer.mjs)                                       |
| TanStack table shell          | Core peer group plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`                                          | `@hell-ui/angular/table-tanstack`; caller-owned TanStack Table remains the engine                                                                                                                                                 | [`table-tanstack`](../../tools/check-package-consumer.mjs)                              |
| TanStack virtual row strategy | TanStack shell peer group plus optional `@tanstack/virtual-core`                                                                                | `@hell-ui/angular/table-tanstack/virtual`; mounts on `hell-tanstack-table` and does not create a second table engine or root component                                                                                            | [`table-tanstack-virtual`](../../tools/check-package-consumer.mjs)                      |
| Code editor                   | Core peer group plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight` | Kept optional entry point `@hell-ui/angular/features/code-editor`; keep lazy/client-only when runtime risk matters                                                                                                                | [`code-editor`](../../tools/check-package-consumer.mjs)                                 |
| PDF viewer                    | Core peer group plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`, and the exact pdf.js peer                                       | `@hell-ui/angular/features/pdf-viewer`; app must provide the pdf.js worker source                                                                                                                                                 | [`pdf-viewer`](../../tools/check-package-consumer.mjs)                                  |

Styled examples also need the Tailwind v4 build plugin from
`@tailwindcss/postcss` plus `postcss` in dev dependencies, with the same
`.postcssrc.json` shown in the Getting Started guide.

Examples:

```bash
# Button Part Style Map. Proved by the button-ui scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs

# Styled primitives. Proved by the button/pagination scenarios.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss
pnpm add -D @tailwindcss/postcss postcss

# Icon-backed primitives. Proved by the primitive-icons-css scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss

# Audio transcript feature. Proved by the audio-transcript scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss

# Table primitives. Proved by the table scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss

# TanStack table shell. Proved by the table-tanstack scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @tanstack/angular-table

# TanStack virtual row strategy. Proved by the table-tanstack-virtual scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @tanstack/angular-table @tanstack/virtual-core

# Code editor feature. Proved by the code-editor scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom ng-primitives rxjs tailwindcss @codemirror/commands @codemirror/language @codemirror/state @codemirror/view @lezer/highlight

# PDF viewer feature. Proved by the pdf-viewer scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss pdfjs-dist@5.6.205
```

Maintainers can rerun a proof path from the product workspace:

```bash
HELL_PACKAGE_CONSUMER_SCENARIOS=root-core,core,testing,button-ui,button,primitive-icons-css,pagination,composite-css,app-shell,resizable,split-view,audio-player,audio-transcript,table,table-tanstack,table-tanstack-virtual,code-editor,pdf-viewer pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=root-core,core,testing pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=button-ui,button,primitive-icons-css,pagination pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=composite-css,app-shell,resizable,split-view,audio-player,audio-transcript pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=table,table-tanstack,table-tanstack-virtual pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=code-editor pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=pdf-viewer pnpm run test:package-consumer -- --minimal-deps
```

## Root imports versus narrow imports

The root entry point is intentionally stable core only. Do not migrate alpha code by changing every import to the root barrel.

Prefer:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

Avoid broad imports when a narrow path exists:

```ts
// Removed aggregate paths. Import each surface from its import-path entry point instead.
import { HellButton } from '@hell-ui/angular/button';
import { HellInput } from '@hell-ui/angular/input';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';
```

Use `@hell-ui/angular` for stable core exports only. Use `/table`, `/table-tanstack`, `/features/*`, and narrow component entry points for UI surfaces.

## CSS imports

Hell CSS entry points use Tailwind v4 theme features. Install `tailwindcss` and configure `@tailwindcss/postcss` whenever you import Hell CSS.

Preferred primitive imports:

```css
@import 'tailwindcss';
@import '@hell-ui/angular/tokens.css';
@import '@hell-ui/angular/button/styles.css';
@import '@hell-ui/angular/input/styles.css';
```

Add only the extra entrypoint CSS needed by the entry points the app imports:

```css
@import '@hell-ui/angular/app-shell/styles.css';
@import '@hell-ui/angular/resizable/styles.css';
@import '@hell-ui/angular/split-view/styles.css';
@import '@hell-ui/angular/table/styles.css';
@import '@hell-ui/angular/features/code-editor/styles.css';
@import '@hell-ui/angular/features/pdf-viewer/styles.css';
```

Optional Theme Adapter Stylesheets are imported after the component CSS they
adapt. They are partial by design; unsupported components keep their default
entrypoint styles.

```css
@import '@hell-ui/angular/card/styles.css';
@import '@hell-ui/angular/dialog/styles.css';
@import '@hell-ui/angular/menu/styles.css';
@import '@hell-ui/angular/themes/glass.css';
```

Avoid old category-level style imports; CSS follows the same import-path-first rule as TypeScript. PDF viewer styles come from `@hell-ui/angular/features/pdf-viewer/styles.css`.

Hell's CSS entry points carry the Tailwind source anchors needed by the package
build, and the package-consumer matrix verifies consumers can import those
shipped CSS files without adding `node_modules/@hell-ui/angular` to their own
Tailwind `@source` scanning. If an app invents its own Tailwind classes in
`ui`, those classes still belong to the app's own Tailwind content/source
pipeline.

## Part Style Maps replace Style Opt-Out

`HellButton`, `HellInput`, `HellNativeSelect`, `HellTextarea`, `HellDialpad`,
`HellDateInput`, `HellTimeInput`, `HellDatePicker`, `HellDateRangePicker`,
Checkbox/NativeCheckbox, RadioGroup/Radio/NativeRadioGroup/NativeRadio,
Switch/NativeSwitch, Toggle/ToggleGroup/ToggleGroupItem, Slider, the migrated
directive-suite batches (`HellCard`, `HellField`, `HellTabset`,
`HellAccordion`, `HellMenu`, `HellListbox`, `HellPopover`, `HellTooltip`,
`HellSelect`, and `HellCombobox` families), ComboboxBasic, the App Shell/nav
directives, Resizable directives,
Pagination/PaginationStrip, and Table primitives have migrated from
Style Opt-Out to the Part Style Map API. Pass `ui` when you want to refine
public parts while keeping Hell behavior, state attributes, and accessibility
wiring.

Split View also exposes flat owned parts such as `pane`, `compactHeader`, and
`itemNavigation`. Dialog, Toast, AudioPlayer, Omnibar, and CodeEditor now use
the same Part Style Map contract for their owned anatomy and no longer expose
`unstyled`.

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
<hell-split-view [ui]="{ pane: 'overflow-auto', itemNavigation: 'gap-hell-3' }">
  <ng-template hellSplitPrimary>Primary</ng-template>
  <ng-template hellSplitDetail>Detail</ng-template>
</hell-split-view>
<hell-dialpad [ui]="{ keyButton: 'rounded-hell-pill', callButton: 'bg-hell-success-strong' }" />
<hell-audio-player [ui]="{ controls: 'gap-hell-3', time: 'tabular-nums' }" src="/audio.ogg" />
<hell-toaster [ui]="{ toast: 'shadow-hell-lg', toolbar: 'gap-hell-2' }" />
<hell-code-editor [ui]="{ root: 'rounded-hell-lg', editor: 'min-h-[16rem]' }" />
<hell-date-input [ui]="{ input: 'tabular-nums', pickerPanel: 'shadow-hell-lg' }" />
<button hellCheckbox ui="rounded-hell-pill" aria-label="Accepted"></button>
<button hellSwitch [ui]="{ root: 'bg-hell-info-soft', thumb: 'shadow-none' }" aria-label="Alerts"></button>
<hell-slider [ui]="{ range: 'bg-hell-info', thumb: 'border-hell-info' }" aria-label="Volume" />
```

Rules for migration:

- Keep the directive import narrow, for example `@hell-ui/angular/button`,
  `@hell-ui/angular/input`, `@hell-ui/angular/card`,
  `@hell-ui/angular/app-shell`, `@hell-ui/angular/resizable`,
  `@hell-ui/angular/split-view`, `@hell-ui/angular/pagination`, or
  `@hell-ui/angular/table`.
- Import Hell CSS when you want shipped default visuals; package-consumer
  scenarios assert representative compiled recipe utilities, and the broader
  matrix verifies migrated CSS entry points are importable without consumer
  `@source` scanning for Hell package files.
- Use `ui="..."` for single-root directives such as Button, Input, Card, Field,
  Tabs, Accordion, App Shell/nav, Resizable, Checkbox, NativeCheckbox, Radio,
  RadioGroup, NativeRadio, NativeRadioGroup, NativeSwitch, Toggle, ToggleGroup,
  ToggleGroupItem, Menu, Listbox, Popover, Tooltip, Select, Combobox,
  Pagination controls, and Table primitive directives.
- Use each projected child directive's local `ui`; a Card, Field, Tabs,
  Accordion, or App Shell root does not style its children remotely.
- Use `[ui]="{ ... }"` for owned-anatomy components with multiple public parts,
  such as Dialpad, PaginationStrip, Split View, Slider, Switch, Dialog, Toast,
  AudioPlayer, Omnibar, CodeEditor, and ComboboxBasic.
- Use `class` for layout hooks and non-conflicting additions only; use `ui` for deterministic Tailwind utility conflicts because template class order is outside the Part-Class Pipeline.
- Continue to test the behavior and accessible name; styling APIs are not accessibility opt-outs.

The [`button-ui`](../../tools/check-package-consumer.mjs) package-consumer
scenario proves the typed Button `ui` path without Tailwind or Hell CSS. The
styled [`button`](../../tools/check-package-consumer.mjs) scenario proves
compiled Button recipe CSS and semantic token runtime theming. The
[`primitive-icons-css`](../../tools/check-package-consumer.mjs),
[`pagination`](../../tools/check-package-consumer.mjs),
[`table`](../../tools/check-package-consumer.mjs), and composite scenarios widen
that proof across migrated primitive, floating/list directive-suite,
pagination, table, layout, feedback, media, search, and editor CSS entry
points, including Checkbox, Radio, Slider, Switch, Toggle, Dialog, Toast,
AudioPlayer, Omnibar, and CodeEditor.

## Heavy and browser-only features

Treat these as deliberate opt-ins, not default UI kit imports.

| Feature                             | First-beta guidance                                                                                                                                                                                                                                                                                        | Current status                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table primitives and TanStack shell | Keep primitives behind `@hell-ui/angular/table`. Use `@hell-ui/angular/table-tanstack` for a Hell-styled shell around a caller-owned TanStack Table instance. Use `@hell-ui/angular/table-tanstack/virtual` only when the shell needs TanStack Virtual row math.                                           | Beta primitives; TanStack shell and virtual row strategy are experimental. Legacy table feature aliases and unsupported table paths were removed before beta; the entrypoint manifest check rejects new ones. |
| Code editor                         | Keep behind the kept optional `@hell-ui/angular/features/code-editor` entry point; lazy-load or client-only load in SSR-sensitive apps; pass owner-document-aware setup where possible.                                                                                                                    | Experimental in package/source comments; stable API report promotion stays policy-owned.                                                                                                                                       |
| PDF viewer                          | Keep behind the optional `@hell-ui/angular/features/pdf-viewer` entry point; install the exact pdf.js peer and pass an app-owned worker source.                                                                                                                                                            | Experimental/browser-only feature entry point.                                                                                                                                                                               |
| Audio speech transcript             | Do not present `allowSpeechTranscript` as accessibility captions or timed text. Import `provideHellAudioTranscript()` from `@hell-ui/angular/features/audio-transcript` only where the route/app deliberately opts into the browser transcript provider, and provide real captions/transcripts separately. | Experimental Chromium-only / best-effort; runtime is isolated behind the optional feature provider.                                                                                                                           |
| Floating/popover/omnibar dismissal   | Use documented components, but avoid building product-critical guarantees on unreviewed dismissal internals.                                                                                                                                                                                               | Browser contracts exist for key paths; remaining seams must stay covered by current browser evidence.                                                                                                                         |
| Resize behavior                     | Treat split/table resizing as browser behavior requiring current browser evidence.                                                                                                                                                                                                                         | Browser resize contracts must stay current before production-ready claims.                                                                                                                                                     |

## Known experimental and deprecated APIs

Known experimental/best-effort surfaces:

- `@hell-ui/angular/features/audio-transcript`
- `@hell-ui/angular/features/code-editor`
- `@hell-ui/angular/table-tanstack`
- `@hell-ui/angular/table-tanstack/virtual`
- `@hell-ui/angular/features/pdf-viewer`
- audio-player speech transcript options such as `allowSpeechTranscript`

Removed pre-beta table compatibility surfaces:

| Removed surface                                                                    | Replacement                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| old table feature entrypoints and unsupported adapter paths                        | `@hell-ui/angular/table` for primitives; `@hell-ui/angular/table-tanstack` for TanStack-owned table behavior                         |
| `HELL_TABLE_DIRECTIVES`, `HELL_TABLE_UTILITY_DIRECTIVES`                           | `HELL_TABLE_UTILITIES_DIRECTIVES` from `@hell-ui/angular/table`                                                                      |
| `HellTableRow.interactive` / `selectionSemantics` / `[selectable]` / `(rowSelect)` | `hellTableRowAction` for row actions; `hellTableRowCheckbox` / `hellTableRowRadio` inside `hellTableSelectionCell` for row selection |

Experimental APIs may change or disappear between pre-1.0 releases.

## Browser, SSR, and accessibility support

Current support is evidence-based and not a production guarantee.

- Root/core and API-report guarded primitives are the safest SSR import paths. Primitive docs may still name component-specific browser behavior.
- Composites are browser-first and may use `document`, `window`, or global listeners for overlays, hotkeys, portals, and dismissal.
- Table primitives use `ResizeObserver`.
- Code editor needs browser `window`/`document` through CodeMirror.
- PDF viewer is browser-only and lives behind `@hell-ui/angular/features/pdf-viewer`: pdf.js worker setup, printing/download helpers, thumbnails, global listeners, and browser compatibility are app-owned risk.
- Speech transcript uses Chromium-only Web Speech and media-capture APIs where available through `@hell-ui/angular/features/audio-transcript`; it is not accessibility-grade captions.

Current browser evidence is tracked through Playwright: a production-ready claim needs every `e2e/*.spec.ts` file passing across chromium, firefox, and webkit on the current commit. Until then, treat browser support as scenario evidence rather than a general browser-support guarantee.

Accessibility support lives in the docs app accessibility matrix source at [`apps/docs/src/app/pages/accessibility/accessibility.page.ts`](../../apps/docs/src/app/pages/accessibility/accessibility.page.ts). The matrix tracks role pattern, keyboard coverage, axe/ARIA/browser-test coverage, and known gaps per public surface.

Current not-production-ready gaps:

- The accessibility matrix currently records no critical gaps, but the production-ready claim still requires fresh browser evidence (`pnpm e2e` across chromium/firefox/webkit) on the release-candidate commit; per-surface known gaps in the matrix remain consumer-relevant reading.
- A release-candidate commit must pass the release workflow gate (changelog, lint, architecture, unit, build, pack audit, package-consumer scenarios, API report, docs build) on the current commit.
- Local `test-results/` evidence is intentionally untracked; rerun the commands for each release candidate instead of relying on stale artifacts.

Before telling external consumers that Hell UI is production-ready, run:

```bash
pnpm release:dry-run
pnpm e2e
```

If either gate fails, release notes and docs must keep **internal beta**, **beta**, or **experimental** wording.
