# First beta consumer migration guide

Status: **internal beta guide for first external consumers**. Do not describe
Hell UI as production-ready until `pnpm production-ready:check` passes against
fresh release-candidate evidence. The gate exists now, but current release copy
must keep internal-beta/beta/experimental wording until it passes.

Use this guide when moving an app from local/alpha Hell imports to the first beta package shape for `@hell-ui/angular`.

## Quick path

1. Start from an Angular 21 app that satisfies `@angular/common`, `@angular/core`, `@angular/forms`, and `rxjs` peer ranges from [`packages/angular/package.json`](../../packages/angular/package.json).
2. Install the smallest peer tier for the entry points and CSS you import.
3. Replace root or kitchen-sink imports with narrow secondary entry points where possible.
4. Import only the Hell CSS files you need. Migrated components use `ui` Part Style Maps; components not yet migrated are tracked in the legacy allowlist and MUST replace `unstyled`.
5. Treat browser-only/heavy features as lazy, client-only, and beta/experimental unless their own docs say otherwise.
6. Check the accessibility matrix and the production-readiness gate before making production claims.

## Install peer tiers

Package peer metadata is package-wide. Some optional peers appear in the package manifest even when they are only required by a kept feature entry point. The PDF viewer is now split into `@hell-ui/pdf-viewer`, so `@hell-ui/angular` no longer advertises pdf.js. The package-consumer runner proves the actual strict-peer install groups in [`tools/check-package-consumer.mjs`](../../tools/check-package-consumer.mjs).

Release-candidate evidence uses the scenario set in
[`docs/release/release-evidence-policy.md`](release-evidence-policy.md). The
`pdf-viewer` scenario is an explicit split-package evidence exception: it proves
`@hell-ui/pdf-viewer` with its exact pdf.js peer as part of the release train,
but it does not put pdf.js back into `@hell-ui/angular` peer metadata.

A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing core peers explicitly. Use `pnpm add` in consumer snippets below because the package-consumer proof uses pnpm strict-peer installs.

| Consumer path                 | Install peers for this path                                                                                                                     | Entry points / CSS                                                                                                                                                                                                                | Proof scenario                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Root/core only                | `@hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs` plus Angular app peers                        | `@hell-ui/angular`, `@hell-ui/angular/core`, `@hell-ui/angular/testing`; no Hell CSS required                                                                                                                                     | [`root-core`, `core`, `testing`](../../tools/check-package-consumer.mjs)                |
| Button Part Style Map         | Core peer group only                                                                                                                            | Narrow Button import plus `ui`; no Hell CSS/Tailwind required for compile-time behavior proof                                                                                                                                     | [`button-ui`](../../tools/check-package-consumer.mjs)                                   |
| Styled narrow primitive       | Core peer group plus `tailwindcss`                                                                                                              | Narrow primitive import plus `@hell-ui/angular/tokens.css` and each imported entry point's `styles.css`                                                                                                                           | [`button`, `pagination`](../../tools/check-package-consumer.mjs)                        |
| Icon-backed primitive mix     | Core peer group plus `tailwindcss`, `@ng-icons/font-awesome`                                                                                    | Narrow primitive imports such as `@hell-ui/angular/button`, `@hell-ui/angular/icon`, and `@hell-ui/angular/input`; no aggregate primitive path                                                                                    | [`primitive-icons-css`](../../tools/check-package-consumer.mjs)                         |
| Composites                    | Core peer group plus `tailwindcss`; add `@ng-icons/font-awesome` for icon-backed composites                                                    | Narrow composite entry points such as `@hell-ui/angular/app-shell`, `@hell-ui/angular/resizable`, `@hell-ui/angular/split-view`, and `@hell-ui/angular/audio-player`, plus explicit entrypoint CSS                            | [`app-shell`, `resizable`, `split-view`, `audio-player`, `composite-css`](../../tools/check-package-consumer.mjs) |
| Audio transcript              | Composite audio-player peer group; no CodeMirror or pdf.js peers                                                                                | `@hell-ui/angular/audio-player` plus provider import from `@hell-ui/angular/features/audio-transcript`; use composite CSS, no feature CSS                                                                                         | [`audio-transcript`](../../tools/check-package-consumer.mjs)                            |
| Table primitives              | Core peer group plus `tailwindcss`; no optional table-engine peers                                                                              | `@hell-ui/angular/table`; CSS from `@hell-ui/angular/table/styles.css`; removed table aliases stay unavailable                                                                                                                    | [`table`, `no-legacy-alias`](../../tools/check-package-consumer.mjs)                    |
| TanStack table shell          | Core peer group plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`                                          | `@hell-ui/angular/table-tanstack`; caller-owned TanStack Table remains the engine                                                                                                                                                 | [`table-tanstack`](../../tools/check-package-consumer.mjs)                              |
| TanStack virtual row strategy | TanStack shell peer group plus optional `@tanstack/virtual-core`                                                                                | `@hell-ui/angular/table-tanstack/virtual`; mounts on `hell-tanstack-table` and does not create a second table engine or root component                                                                                            | [`table-tanstack-virtual`](../../tools/check-package-consumer.mjs)                      |
| Code editor                   | Core peer group plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight` | Kept optional entry point `@hell-ui/angular/features/code-editor`; keep lazy/client-only when runtime risk matters                                                                                                                | [`code-editor`](../../tools/check-package-consumer.mjs)                                 |
| PDF viewer                    | Core peer group plus `@hell-ui/pdf-viewer`, `tailwindcss`, `@ng-icons/font-awesome`, and the split package's pdf.js peer                        | `@hell-ui/pdf-viewer`; app must provide the pdf.js worker source                                                                                                                                                                  | [`pdf-viewer`](../../tools/check-package-consumer.mjs)                                  |

Styled examples also need the Tailwind v4 build plugin from
`@tailwindcss/postcss` plus `postcss` in dev dependencies, with the same
`.postcssrc.json` shown in the Getting Started guide.

Examples:

```bash
# Button Part Style Map. Proved by the button-ui scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs

# Styled primitives. Proved by the button/pagination/primitive-icons-css scenarios.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss
pnpm add -D @tailwindcss/postcss postcss

# Audio transcript feature. Proved by the audio-transcript scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss

# Table primitives. Proved by the table/no-legacy-alias scenarios.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss

# TanStack table shell. Proved by the table-tanstack scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss @tanstack/angular-table

# TanStack virtual row strategy. Proved by the table-tanstack-virtual scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss @tanstack/angular-table @tanstack/virtual-core

# Code editor feature. Proved by the code-editor scenario.
pnpm add @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss @codemirror/commands @codemirror/language @codemirror/state @codemirror/view @lezer/highlight

# Split PDF viewer package. Proved by the pdf-viewer scenario.
pnpm add @hell-ui/angular @hell-ui/pdf-viewer @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss pdfjs-dist@5.6.205
```

Maintainers can rerun a proof path from the product workspace:

```bash
HELL_PACKAGE_CONSUMER_SCENARIOS=root-core,core,testing,button-ui,button,primitive-icons-css,pagination,composite-css,app-shell,resizable,split-view,audio-player,audio-transcript,table,table-tanstack,table-tanstack-virtual,no-legacy-alias,code-editor,pdf-viewer pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=root-core,core,testing pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=button-ui,button,primitive-icons-css,pagination pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=composite-css,app-shell,resizable,split-view,audio-player,audio-transcript pnpm run test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=table,no-legacy-alias,table-tanstack,table-tanstack-virtual pnpm run test:package-consumer -- --minimal-deps
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
@import '@hell-ui/pdf-viewer/styles';
```

Avoid old category-level style imports; CSS follows the same import-path-first rule as TypeScript. PDF viewer styles come from `@hell-ui/pdf-viewer/styles`.

Hell's migrated component defaults are compiled into the shipped CSS entry
points. Consumers do not need to add Tailwind `@source` scanning for
`node_modules/@hell-ui/angular` to receive those defaults. If an app invents
its own Tailwind classes in `ui`, those classes still belong to the app's own
Tailwind content/source pipeline.

## Part Style Maps replace Style Opt-Out

`HellButton`, `HellInput`, `HellNativeSelect`, `HellTextarea`, `HellDialpad`,
`HellDateInput`, `HellTimeInput`, `HellDatePicker`, `HellDateRangePicker`, the
first directive-suite batch (`HellCard`, `HellField`, `HellTabset`, and
`HellAccordion` families), the App Shell/nav directives, and Resizable
directives have migrated from Style Opt-Out to the Part Style Map API. Pass
`ui` when you want to refine public parts while keeping Hell behavior, state
attributes, and accessibility wiring.

Split View also exposes flat owned parts such as `pane`, `compactHeader`, and
`itemNavigation`.

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
<hell-date-input [ui]="{ input: 'tabular-nums', pickerPanel: 'shadow-hell-lg' }" />
```

Rules for migration:

- Keep the directive import narrow, for example `@hell-ui/angular/button`,
  `@hell-ui/angular/input`, `@hell-ui/angular/card`, or
  `@hell-ui/angular/split-view`.
- Import Hell CSS when you want shipped default visuals; the `primitive-icons-css`
  package-consumer scenario proves the primitive, first directive-suite, App
  Shell, Resizable, and Split View recipe utilities ship without consumer
  `@source` scanning.
- Use `ui="..."` for single-root directives such as Button, Input, Card, Field,
  Tabs, Accordion, App Shell/nav, and Resizable directives.
- Use each projected child directive's local `ui`; a Card, Field, Tabs,
  Accordion, or App Shell root does not style its children remotely.
- Use `[ui]="{ ... }"` for owned-anatomy components with multiple public parts,
  such as Dialpad and Split View.
- Use `class` for layout hooks and non-conflicting additions only; use `ui` for deterministic Tailwind utility conflicts because template class order is outside the Part-Class Pipeline.
- Continue to test the behavior and accessible name; styling APIs are not accessibility opt-outs.

The [`button-ui`](../../tools/check-package-consumer.mjs) package-consumer
scenario proves the typed Button `ui` path without Tailwind or Hell CSS. The
styled [`button`](../../tools/check-package-consumer.mjs) scenario proves
compiled Button recipe CSS and semantic token runtime theming. The
[`primitive-icons-css`](../../tools/check-package-consumer.mjs) scenario proves
the primitive and first directive-suite recipe CSS ships without consumer
`@source` scanning for Hell defaults.

The not-yet-migrated list is machine-tracked as `legacyStyleableAllowlist` in
[`tools/check-architecture.mjs`](../../tools/check-architecture.mjs). Every
symbol in that allowlist is legacy compatibility only and MUST replace
`unstyled` with a Part Style Map before that component can be promoted as a
migrated styling surface.

## Heavy and browser-only features

Treat these as deliberate opt-ins, not default UI kit imports.

| Feature                             | First-beta guidance                                                                                                                                                                                                                                                                                        | Current status                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table primitives and TanStack shell | Keep primitives behind `@hell-ui/angular/table`. Use `@hell-ui/angular/table-tanstack` for a Hell-styled shell around a caller-owned TanStack Table instance. Use `@hell-ui/angular/table-tanstack/virtual` only when the shell needs TanStack Virtual row math.                                           | Beta primitives; TanStack shell and virtual row strategy are experimental. Legacy table feature aliases and unsupported table paths are removed before beta and the `no-legacy-alias` package-consumer scenario rejects them. |
| Code editor                         | Keep behind the kept optional `@hell-ui/angular/features/code-editor` entry point; lazy-load or client-only load in SSR-sensitive apps; pass owner-document-aware setup where possible.                                                                                                                    | Experimental in package/source comments; stable API report promotion stays policy-owned.                                                                                                                                       |
| PDF viewer                          | Package path is `@hell-ui/pdf-viewer`; install the split package with its exact pdf.js peer and pass an app-owned worker source.                                                                                                                                                                           | Experimental/browser-only split package.                                                                                                                                                                                      |
| Audio speech transcript             | Do not present `allowSpeechTranscript` as accessibility captions or timed text. Import `provideHellAudioTranscript()` from `@hell-ui/angular/features/audio-transcript` only where the route/app deliberately opts into the browser transcript provider, and provide real captions/transcripts separately. | Experimental Chromium-only / best-effort; runtime is isolated behind the optional feature provider.                                                                                                                           |
| Floating/flyout/omnibar dismissal   | Use documented components, but avoid building product-critical guarantees on unreviewed dismissal internals.                                                                                                                                                                                               | Browser contracts exist for key paths; remaining seams must stay covered by current browser evidence.                                                                                                                         |
| Resize behavior                     | Treat split/table resizing as browser behavior requiring current browser evidence.                                                                                                                                                                                                                         | Browser resize contracts must stay current before production-ready claims.                                                                                                                                                     |

## Known experimental and deprecated APIs

Known experimental/best-effort surfaces:

- `@hell-ui/angular/features/audio-transcript`
- `@hell-ui/angular/features/code-editor`
- `@hell-ui/angular/table-tanstack`
- `@hell-ui/angular/table-tanstack/virtual`
- `@hell-ui/pdf-viewer`
- audio-player speech transcript options such as `allowSpeechTranscript`

Removed pre-beta table compatibility surfaces:

| Removed surface                                                                    | Replacement                                                                                                                          |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| old table feature entrypoints and unsupported adapter paths                        | `@hell-ui/angular/table` for primitives; `@hell-ui/angular/table-tanstack` for TanStack-owned table behavior                         |
| `HELL_TABLE_DIRECTIVES`, `HELL_TABLE_UTILITY_DIRECTIVES`                           | `HELL_TABLE_UTILITIES_DIRECTIVES` from `@hell-ui/angular/table`                                                                      |
| `HellTableRow.interactive` / `selectionSemantics` / `[selectable]` / `(rowSelect)` | `hellTableRowAction` for row actions; `hellTableRowCheckbox` / `hellTableRowRadio` inside `hellTableSelectionCell` for row selection |

Known deprecated non-table compatibility surfaces to migrate away from:

| Deprecated surface                                              | Preferred replacement                                                                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `allowLiveCaptions`                                             | `allowSpeechTranscript` plus `provideHellAudioTranscript()` from `@hell-ui/angular/features/audio-transcript`, with the same best-effort warning |
| `hellAudioSpeechSupported` from `@hell-ui/angular/audio-player` | `hellAudioSpeechSupported` from `@hell-ui/angular/features/audio-transcript`                                                                     |
| `hellCodeEditorSetup`                                           | `hellCodeEditorSetupFactory(ownerDocument)`                                                                                                      |

Experimental APIs may change or disappear between pre-1.0 releases. Deprecated aliases exist only to help alpha/internal-beta consumers migrate; removal needs a changelog and migration note.

## Browser, SSR, and accessibility support

Current support is evidence-based and not a production guarantee.

- Root/core and API-report guarded primitives are the safest SSR import paths. Primitive docs may still name component-specific browser behavior.
- Composites are browser-first and may use `document`, `window`, or global listeners for overlays, hotkeys, portals, and dismissal.
- Table primitives use `ResizeObserver`.
- Code editor needs browser `window`/`document` through CodeMirror.
- PDF viewer is browser-only and lives in `@hell-ui/pdf-viewer`: pdf.js worker setup, printing/download helpers, thumbnails, global listeners, and browser compatibility are app-owned risk.
- Speech transcript uses Chromium-only Web Speech and media-capture APIs where available through `@hell-ui/angular/features/audio-transcript`; it is not accessibility-grade captions.

Current browser evidence is tracked through Playwright. The production-ready gate requires `test-results/playwright-report.json` to pass every `e2e/*.spec.ts` file across chromium, firefox, and webkit on the current commit. Until that gate passes, treat browser support as scenario evidence rather than a general browser-support guarantee.

Accessibility support lives in the docs app accessibility matrix source at [`apps/docs/src/app/pages/accessibility/accessibility.page.ts`](../../apps/docs/src/app/pages/accessibility/accessibility.page.ts). The matrix tracks role pattern, keyboard coverage, axe/ARIA/browser-test coverage, and known gaps per public surface.

Current not-production-ready gaps until the production-readiness gate passes:

- Critical accessibility gaps still block a production-ready claim for several public surfaces, including omnibar.
- Full release-candidate evidence must prove the package-consumer scenario set, API report membership, accessibility/browser, docs budget, pack audit, and release dry-run tasks from [`docs/release/release-evidence-policy.md`](release-evidence-policy.md) on the current commit.
- Local `test-results/` evidence is intentionally untracked; rerun the commands for each release candidate instead of relying on stale artifacts.

Before telling external consumers that Hell UI is production-ready, run:

```bash
pnpm release:dry-run -- --full
pnpm e2e
pnpm production-ready:check
```

If any gate fails, release notes and docs must keep **internal beta**, **beta**, or **experimental** wording.
