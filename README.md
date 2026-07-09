<p align="center">
  <img src="packages/angular/assets/hell-ui-logo.svg" alt="Hell UI logo" width="96" />
</p>

# Hell UI

Hell UI is a compact Angular component system for dense business applications.
It favors directive-first primitives, optional styled primitives, opinionated
composites, and heavier features behind feature-specific entry points.
The root `@hell-ui/angular` export is intentionally scoped to stable core only;
UI surfaces are available through narrow import-path entry points such as
`/button`, `/select`, `/app-shell`, `/features/code-editor`, and `/features/pdf-viewer`.

## Workspace

```bash
pnpm install
pnpm build:lib
pnpm build:docs
pnpm test
pnpm ci:playwright:chromium
pnpm ci:verify # pre-push preflight (delegates to release:dry-run --fast)
pnpm release:dry-run -- --fast # local release preflight
pnpm release:dry-run -- --full # release-candidate evidence gate
```

`release:dry-run -- --full` runs lint, architecture, CI coverage, unit tests,
`build:lib`, pack audit, selected package-consumer scenarios, API report, and
`build:docs`. Evidence is written to timestamped log and JSON files under
`test-results/release-evidence/`. Use `--fast` for local preflight before the
full release-candidate gate. Trusted npm publishing and provenance setup is
specified in `docs/release/npm-publishing.md`.

## Production readiness

Hell UI is **internal beta** and not yet production-ready. Keep release notes,
package registry copy, docs, and README language in internal-beta/beta/experimental
terms until fresh release-candidate evidence (`pnpm release:dry-run -- --full`
plus a full `pnpm e2e` pass) says otherwise.

The docs app accessibility matrix at `/accessibility` lists role patterns,
keyboard coverage, axe/ARIA/browser-test evidence, and known gaps for every
public primitive, composite, and feature. Read the
[first-beta consumer migration guide](docs/release/first-beta-consumer-guide.md)
before external pilot installs.

The contributor workspace is pnpm-only and CI-backed by `pnpm-lock.yaml`.
Use `pnpm install --frozen-lockfile` for reproducible CI installs; package-consumer
scenarios verify pnpm strict-peer installs for applications consuming `@hell-ui/angular`.

## Package Imports

Install the light UI stack when using primitives/composites. Package peer metadata
is package-wide, so optional feature peers can appear in package metadata even
though they are only runtime-needed when importing their feature entry points:

```bash
pnpm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom rxjs tailwindcss
pnpm add -D @tailwindcss/postcss postcss
# add @ng-icons/core and @ng-icons/font-awesome when you use icon-backed entries such as icon or date-picker
```

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

Peer dependency tiers:

> Package peer metadata is package-wide. Install the core peer group for any
> `@hell-ui/angular` package entry point, then add tier peers only for entry
> points and styles you import. A normal Angular app already has
> `@angular/common`, `@angular/core`, and `rxjs`; install missing peers
> explicitly.
>
> `@angular/forms`, `@angular/cdk`, and `@floating-ui/dom` are strict peers of
> `ng-primitives` itself, so every Hell install needs them even when Hell code
> does not import them directly.
> `@ng-icons/core` is an optional peer needed only by icon-backed entry points.
> `@angular/router` is an optional peer only for `ng-primitives/dialog` consumers;
> install it when importing Hell dialog.
> Package-consumer scenarios assert these groups with strict peer installs.

| Tier                          | Entry points / scenarios                                                                                                                | Peer group asserted                                                                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core                          | `@hell-ui/angular`, `/core`, `/testing`; `root-core`, `core`, `testing`                                                                 | `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `ng-primitives`, `rxjs`                                                                                                                     |
| Primitive                     | Narrow primitives such as `/button`, `/pagination`, `/select`, and `/icon`; `button-ui`, `button`, `pagination`, `primitive-icons-css` | Core peers. Add `tailwindcss` when importing primitive CSS; add `@ng-icons/core` and `@ng-icons/font-awesome` for icon-backed entries.                                                                                               |
| Composite                     | Narrow composite entry points such as `/app-shell`, `/resizable`, `/split-view`, and `/audio-player`; `composite-css`, `app-shell`, `resizable`, `split-view`, `audio-player` | Core peers plus `tailwindcss` for composite CSS. Icon-backed composites also assert optional `@ng-icons/core` and `@ng-icons/font-awesome`.                                                                                            |
| Audio transcript              | `/features/audio-transcript`; `audio-transcript`                                                                                        | Same peers as the icon-backed audio-player composite; no CodeMirror or pdf.js peers. Import `provideHellAudioTranscript()` only where browser transcript capture is deliberately enabled.                                             |
| Table primitives              | `/table`; `table`                                                                                                                       | Core peers plus `tailwindcss`; no CodeMirror, router, Font Awesome, pdf.js, TanStack Table, or TanStack Virtual peers.                                                                                                                |
| TanStack table shell          | `/table-tanstack`; `table-tanstack`                                                                                                     | Core peers plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`. Root, button, and `/table` scenarios prove TanStack Table is not installed unless this shell is imported.                          |
| TanStack virtual row strategy | `/table-tanstack/virtual`; `table-tanstack-virtual`                                                                                     | Same shell peers plus optional `@tanstack/virtual-core`. The strategy mounts on `hell-tanstack-table`; it is not a separate table engine or root component.                                                                           |
| Code editor                   | `/features/code-editor`; `code-editor`                                                                                                  | Core peers plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`.                                                                                       |
| PDF viewer                    | `/features/pdf-viewer`; `pdf-viewer`                                                                                                    | Core peers plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`, and the exact optional `pdfjs-dist` peer.                                                                                                                  |

CodeMirror, pdf.js, TanStack Table, and TanStack Virtual peers remain optional and are not required by root, button, table, audio-player, audio-transcript, or composite package-consumer scenarios. `@hell-ui/angular/features/code-editor` is a kept optional entry point; keep live editor surfaces lazy/client-only when SSR, hydration, or third-party runtime risk matters. TanStack Table is isolated behind `@hell-ui/angular/table-tanstack`, and TanStack Virtual is isolated behind `@hell-ui/angular/table-tanstack/virtual`. pdf.js is isolated behind `@hell-ui/angular/features/pdf-viewer`. The audio transcript runtime is isolated behind `@hell-ui/angular/features/audio-transcript` and has no CodeMirror/pdf.js peers.

## Public API Tiers

| Tier                 | Stability                                                                   | Entry points                                                                                                                                                                                                                           | Compatibility                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives           | Stable                                                                      | Narrow entry points such as `@hell-ui/angular/button` and `@hell-ui/angular/select`                                                                                                                                                    | SSR-compatible unless an entry point's own docs say otherwise                                                                                                                |
| Composites           | Beta                                                                        | Narrow entry points such as `@hell-ui/angular/app-shell` and `@hell-ui/angular/audio-player`                                                                                                                                           | Browser DOM + `document`/`window`/global listeners                                                                                                                           |
| Table primitives     | Beta                                                                        | `@hell-ui/angular/table`                                                                                                                                                                                                               | Uses `ResizeObserver`; browser-first                                                                                                                                         |
| TanStack table shell | Experimental                                                                | `@hell-ui/angular/table-tanstack`, `@hell-ui/angular/table-tanstack/virtual`                                                                                                                                                           | Caller-owned TanStack Table remains the engine; Hell owns shell chrome, styling, projection regions, status views, controls, and the optional TanStack Virtual body strategy |
| Code editor          | Beta/optional peer; excluded from stable API reports until policy promotion | `@hell-ui/angular/features/code-editor`                                                                                                                                                                                                | Needs `window` + `document`; keep lazy/client-only when runtime risk matters                                                                                                 |
| PDF viewer           | Experimental feature entry point                                            | `@hell-ui/angular/features/pdf-viewer`                                                                                                                                                                                                 | Browser-only; apps own the pdf.js worker source; keep behind a lazy route                                                                                                    |
| Testing harnesses    | Beta/test-only                                                              | `@hell-ui/angular/testing`                                                                                                                                                                                                             | CDK component harnesses for consumer and library tests                                                                                                                       |
| Speech transcript    | Experimental/best-effort (feature opt-in)                                   | `@hell-ui/angular/features/audio-transcript` provider plus `allowSpeechTranscript` / deprecated `allowLiveCaptions` on `@hell-ui/angular/audio-player`; import `hellAudioSpeechSupported` from the feature entrypoint                 | Browser-only; uses `navigator` + `SpeechRecognition` + `captureStream`; best-effort only, not accessibility-grade captions/timed text                                        |

## Styles

Hell's shipped CSS uses Tailwind v4 theme features, so Tailwind and the
Tailwind v4 PostCSS plugin are required whenever an app imports Hell style
entry points. Add a workspace `.postcssrc.json` with `@tailwindcss/postcss`,
then prefer fine-grained imports for production:

```css
@import 'tailwindcss';
@import '@hell-ui/angular/tokens.css';
@import '@hell-ui/angular/button/styles.css';
@import '@hell-ui/angular/input/styles.css';
```

CSS follows the same import-path-first rule as TypeScript: import shared tokens
once, then import each entry point's `styles.css`.

```css
@import '@hell-ui/angular/tokens.css';
@import '@hell-ui/angular/app-shell/styles.css';
@import '@hell-ui/angular/table/styles.css';
@import '@hell-ui/angular/features/code-editor/styles.css';
```

## Component Contract

Public modules expose behavior through directives, `data-*` state attributes,
stable `data-slot` part attributes, and a Part Style Map for styling surfaces.

```html
<button hellButton variant="primary">Save</button>
<button hellButton ui="rounded-hell-pill">Custom button</button>

<button hellSelect>
  <span hellSelectValue>Germany</span>
</button>
```

## Docs App

```bash
pnpm start
```

Open `http://localhost:4200/`.
