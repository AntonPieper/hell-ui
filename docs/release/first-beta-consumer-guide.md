# First beta consumer migration guide

Status: **internal beta guide for first external consumers**. Do not describe Hell UI as production-ready until the HELL-049 gate (`pnpm production-ready:check`) passes against fresh release-candidate evidence. The gate exists now, but current release copy must keep internal-beta/beta/experimental wording until it passes.

Use this guide when moving an app from local/alpha Hell imports to the first beta package shape for `@hell-ui/angular`.

## Quick path

1. Start from an Angular 21 app that satisfies `@angular/common`, `@angular/core`, `@angular/forms`, and `rxjs` peer ranges from [`projects/hell/package.json`](../../projects/hell/package.json).
2. Install the smallest peer tier for the entry points and CSS you import.
3. Replace root or kitchen-sink imports with narrow secondary entry points where possible.
4. Import only the Hell CSS files you need, or use `unstyled` behavior-only directives and own the styling yourself.
5. Treat browser-only/heavy features as lazy, client-only, and beta/experimental unless their own docs say otherwise.
6. Check the accessibility matrix and the production-readiness gate before making production claims.

## Install peer tiers

npm peer metadata is package-wide. Some optional peers appear in the package manifest even when they are only required by a kept feature entry point. The PDF viewer is now split into `@hell-ui/pdf-viewer`, so `@hell-ui/angular` no longer advertises pdf.js. The package-consumer runner proves the actual strict-peer install groups in [`tools/check-package-consumer.mjs`](../../tools/check-package-consumer.mjs).

A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing core peers explicitly. Use `npm install` in consumer snippets below because the package-consumer proof uses npm strict-peer installs. `pnpm add` is equivalent for pnpm apps.

| Consumer path | Install peers for this path | Entry points / CSS | Proof scenario |
| --- | --- | --- | --- |
| Root/core only | `@hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs` plus Angular app peers | `@hell-ui/angular`, `@hell-ui/angular/core`, `@hell-ui/angular/testing`; no Hell CSS required | [`root-core`, `core`, `testing`](../../tools/check-package-consumer.mjs) |
| Behavior-only primitive | Core peer group only | Narrow primitive import such as `@hell-ui/angular/button`; use `unstyled`; no Hell CSS/Tailwind required | [`button-unstyled`](../../tools/check-package-consumer.mjs) |
| Styled narrow primitive | Core peer group plus `tailwindcss` | Narrow primitive import plus `@hell-ui/angular/styles/tokens` and primitive/component CSS | [`button`](../../tools/check-package-consumer.mjs) |
| Aggregate primitives | Core peer group plus `tailwindcss`, `@angular/router`, `@ng-icons/font-awesome` | `@hell-ui/angular/primitives` plus primitive CSS. Router is needed because the aggregate includes dialog through `ng-primitives/dialog`; Font Awesome is needed because icon-backed primitives are bundled in the aggregate FESM. | [`primitives-css`](../../tools/check-package-consumer.mjs) |
| Composites | Core peer group plus `tailwindcss`; add `@ng-icons/font-awesome` for aggregate/icon-backed composites | Prefer narrow composite entry points such as `@hell-ui/angular/app-shell`; use `@hell-ui/angular/composites` only when you accept aggregate peers | [`app-shell`, `composites-css`](../../tools/check-package-consumer.mjs) |
| Table utilities | Core peer group plus `tailwindcss` | `@hell-ui/angular/features/table-utilities`; legacy `@hell-ui/angular/features/data-table` only while migrating | [`table-utilities`, `data-table`](../../tools/check-package-consumer.mjs) |
| Code editor | Core peer group plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, `@lezer/highlight` | `@hell-ui/angular/features/code-editor`; keep lazy/client-only when runtime risk matters | [`code-editor`](../../tools/check-package-consumer.mjs) |
| PDF viewer | Core peer group plus `@hell-ui/pdf-viewer`, `tailwindcss`, `@ng-icons/font-awesome`, and the split package's pdf.js peer | `@hell-ui/pdf-viewer`; app must provide the pdf.js worker source | [`pdf-viewer`](../../tools/check-package-consumer.mjs) |

Examples:

```bash
# Behavior-only button. Proved by the button-unstyled scenario.
npm install @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs

# Styled primitives. Proved by the button/primitives-css scenarios.
npm install @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss

# Code editor feature. Proved by the code-editor scenario.
npm install @hell-ui/angular @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core ng-primitives rxjs tailwindcss @codemirror/commands @codemirror/language @codemirror/state @codemirror/view @lezer/highlight

# Split PDF viewer package. Proved by the pdf-viewer scenario.
npm install @hell-ui/angular @hell-ui/pdf-viewer @angular/forms @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome ng-primitives rxjs tailwindcss pdfjs-dist@5.6.205
```

Maintainers can rerun a proof path from the product workspace:

```bash
HELL_PACKAGE_CONSUMER_SCENARIOS=button-unstyled pnpm test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=primitives-css pnpm test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=code-editor pnpm test:package-consumer -- --minimal-deps
HELL_PACKAGE_CONSUMER_SCENARIOS=pdf-viewer pnpm test:package-consumer -- --minimal-deps
```

## Root imports versus narrow imports

The root entry point is intentionally stable core only. Do not migrate alpha code by changing every import to the root barrel.

Prefer:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

Avoid broad imports when a narrow path exists:

```ts
// Valid, but broader than the matching narrow entry points. Use only when you intentionally accept aggregate peers.
import { HellButton, HellInput } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/composites';
```

Use `@hell-ui/angular` for stable core exports only. Use `/primitives`, `/composites`, `/features/*`, and narrow component entry points for UI surfaces.

## CSS imports

Hell CSS entry points use Tailwind v4 theme features. Install `tailwindcss` whenever you import Hell CSS.

Preferred narrow component imports:

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/components/button";
```

Use the primitive aggregate stylesheet instead when the app intentionally wants every primitive style in one import:

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/primitives";
```

Add only the feature CSS you import:

```css
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/pdf-viewer/styles";
```

Avoid `@hell-ui/angular/styles` and `@hell-ui/angular/styles/kitchen-sink` for production migration unless the app intentionally accepts every primitive, composite, CodeMirror, and table-utility style in one bundle. PDF viewer styles come from `@hell-ui/pdf-viewer/styles`. Use `@hell-ui/angular/styles/features/data-table` only as the legacy CSS alias for table utilities.

## Unstyled mode

Use `unstyled` when you want Hell behavior, state attributes, and accessibility wiring without Hell host classes.

```html
<button hellButton unstyled type="button">Save</button>
```

Rules for migration:

- Keep the directive import narrow, for example `@hell-ui/angular/button`.
- Do not import Hell CSS for behavior-only controls unless another Hell surface needs it.
- Own focus, color, density, and layout styles in your app CSS.
- Continue to test the behavior and accessible name; `unstyled` is not an accessibility opt-out.

The [`button-unstyled`](../../tools/check-package-consumer.mjs) package-consumer scenario proves this path without Tailwind or Hell CSS.

## Heavy and browser-only features

Treat these as deliberate opt-ins, not default UI kit imports.

| Feature | First-beta guidance | Current status |
| --- | --- | --- |
| Table utilities | Keep behind `@hell-ui/angular/features/table-utilities`. It is table utilities, not a data-grid framework. Prefer semantic table markup with real cell controls. | Beta feature; legacy `/features/data-table` remains deprecated compatibility. |
| Code editor | Keep behind `@hell-ui/angular/features/code-editor`; lazy-load or client-only load in SSR-sensitive apps; pass owner-document-aware setup where possible. | Experimental in package/source comments; follow-up HELL-054 locks the kept optional boundary. |
| PDF viewer | Package path is `@hell-ui/pdf-viewer`; install the split package with its exact pdf.js peer and pass an app-owned worker source. | Experimental/browser-only split package. |
| Audio speech transcript | Do not present `allowSpeechTranscript` as accessibility captions or timed text. Keep it behind explicit user opt-in and provide real captions/transcripts separately. | Experimental Chromium-only / best-effort; HELL-055 will isolate transcript runtime behind an optional feature seam. |
| Floating/flyout/omnibar dismissal | Use documented components, but avoid building product-critical guarantees on unreviewed dismissal internals. | Browser contracts exist for key paths; follow-up HELL-057/HELL-058 shrink remaining seams. |
| Resize behavior | Treat split/table resizing as browser behavior requiring current browser evidence. | HELL-061 still owns browser resize contracts. |

## Known experimental and deprecated APIs

Known experimental/best-effort surfaces:

- `@hell-ui/angular/features/code-editor`
- `@hell-ui/pdf-viewer`
- audio-player speech transcript options such as `allowSpeechTranscript`

Known deprecated compatibility surfaces to migrate away from:

| Deprecated surface | Preferred replacement |
| --- | --- |
| `@hell-ui/angular/features/data-table` | `@hell-ui/angular/features/table-utilities` |
| `HELL_TABLE_DIRECTIVES`, `HELL_TABLE_UTILITY_DIRECTIVES` | `HELL_TABLE_UTILITIES_DIRECTIVES` |
| `HellTableRow.interactive` | real cell controls, explicit row selection, or `selectable` where documented |
| `allowLiveCaptions` | `allowSpeechTranscript` with the same best-effort warning |
| `HellDataTableLabels` | `HellTableUtilitiesLabels` from `@hell-ui/angular` or `@hell-ui/angular/core` |
| `hellCodeEditorSetup` | `hellCodeEditorSetupFactory(ownerDocument)` |

Experimental APIs may change or disappear between pre-1.0 releases. Deprecated aliases exist only to help alpha/internal-beta consumers migrate; removal needs a changelog and migration note.

## Browser, SSR, and accessibility support

Current support is evidence-based and not a production guarantee.

- Root/core and stable primitives are the safest SSR import paths. Primitive docs may still name component-specific browser behavior.
- Composites are browser-first and may use `document`, `window`, or global listeners for overlays, hotkeys, portals, and dismissal.
- Table utilities use `ResizeObserver`.
- Code editor needs browser `window`/`document` through CodeMirror.
- PDF viewer is browser-only and lives in `@hell-ui/pdf-viewer`: pdf.js worker setup, printing/download helpers, thumbnails, global listeners, and browser compatibility are app-owned risk.
- Speech transcript uses Chromium-only Web Speech and media-capture APIs where available; it is not accessibility-grade captions.

Current browser evidence is tracked through Playwright. The production-ready gate requires `test-results/playwright-report.json` to pass every `e2e/*.spec.ts` file across chromium, firefox, and webkit on the current commit. Until that gate passes, treat browser support as scenario evidence rather than a general browser-support guarantee.

Accessibility support lives in the docs app accessibility matrix source at [`projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts`](../../projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts). The matrix tracks role pattern, keyboard coverage, axe/ARIA/browser-test coverage, and known gaps per public surface.

Current not-production-ready gaps until the HELL-049 production-readiness gate passes:

- Critical accessibility gaps still block a production-ready claim for several public surfaces, including accordion, checkbox, date picker/date input, flyout, listbox, popover, radio, slider, switch, tabs, tooltip, omnibar, and time input.
- Full release-candidate evidence must prove package-consumer, API report, accessibility/browser, docs budget, pack audit, and release dry-run tasks on the current commit.
- Local `test-results/` evidence is intentionally untracked; rerun the commands for each release candidate instead of relying on stale artifacts.

Before telling external consumers that Hell UI is production-ready, run:

```bash
pnpm release:dry-run -- --full
pnpm e2e
pnpm production-ready:check
```

If any gate fails, release notes and docs must keep **internal beta**, **beta**, or **experimental** wording.
