<p align="center">
  <img src="projects/hell/assets/hell-ui-logo.svg" alt="Hell UI logo" width="96" />
</p>

# Hell UI

Hell UI is a compact Angular component system for dense business applications.
It favors directive-first primitives, optional styled primitives, opinionated
composites, and heavier features behind feature-specific entry points.
The root `@hell-ui/angular` export is intentionally scoped to stable core only;
primitives remain available through `/primitives` and narrow primitive entry
points. Composites and features are intended for secondary entry points.

## Workspace

```bash
pnpm install
pnpm build:lib
pnpm build:docs
pnpm test
pnpm ci:playwright
pnpm ci:verify # full pre-push: unit, architecture, lint, e2e, package consumer, build
```

The contributor workspace is pnpm-first and CI-backed by `pnpm-lock.yaml`.
A root `package-lock.json` is also checked in so GitHub CI can smoke-test
`npm ci`; packed-package consumer tests continue to verify npm installs for
applications consuming `@hell-ui/angular`.

### Unit test parallelism

`pnpm test` and `pnpm ci:test` use Vitest's default worker pool and are the
supported CI path. In constrained meta/agent containers, prefer the meta root
`npm run hell:test:unit` command; it defaults `VITEST_MAX_WORKERS` to `1` and disables
coverage so the suite runs serially with less worker pressure. Use the meta
root `npm run hell:test:unit:parallel` command only when reproducing CI worker
scheduling from that constrained environment. The serial and parallel commands
are intentionally not equivalent defaults.

## Package Imports

Install the light UI stack when using primitives/composites. npm peer metadata
is package-wide, so optional feature peers can appear in package metadata even
though they are only runtime-needed when importing their feature entry points:

```bash
pnpm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
# add @ng-icons/font-awesome when you use icon-backed entries such as pagination or date-picker
# or
npm install @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
```

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

Peer dependency expectations by entry point:

> npm peer metadata is package-wide. Install the light UI stack for any
> `@hell-ui/angular` package entry point; feature rows below list additional
> optional peers required only when that feature is imported.
>
> `@floating-ui/dom` is required by `ng-primitives` (not by Hell directly).
> `@angular/router` is an optional peer only for `ng-primitives/dialog` consumers;
> install it when importing Hell dialog or the aggregate `/primitives` entry point.

| Entry point | Required peers |
|---|---|
| `@hell-ui/angular`, `/core`, `/primitives`, `/testing` | Light UI stack: `@angular/forms`, `ng-primitives`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `rxjs`, and style-only `tailwindcss`; add optional `@angular/router` when using dialog or aggregate `/primitives`; add optional `@ng-icons/font-awesome` for icon-backed entries |
| `@hell-ui/angular/composites`, `/app-shell`, `/audio-player`, `/avatar-group`, `/date-input`, `/dialpad`, `/drop-zone`, `/omnibar`, `/resizable`, `/split-view`, `/time-input`, `/toast` | Light UI stack; prefer narrow composite entry points such as `@hell-ui/angular/app-shell` when possible |
| `@hell-ui/angular/features/table-utilities` | Light UI stack |
| `@hell-ui/angular/features/code-editor` | Light UI stack plus `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight` |
| `@hell-ui/angular/features/pdf-viewer` | Light UI stack plus exact `pdfjs-dist@5.6.205`; app must provide a pdf.js worker source |

`@hell-ui/angular/features/data-table` remains a legacy alias for table utilities.

## Public API Tiers

| Tier | Stability | Entry points | Compatibility |
|---|---|---|---|
| Primitives | Stable | `@hell-ui/angular/primitives` | SSR-compatible |
| Composites | Beta | `@hell-ui/angular/composites` and narrow composite entry points such as `@hell-ui/angular/app-shell` | Browser DOM + `document`/`window`/global listeners |
| Table utilities | Beta | `@hell-ui/angular/features/table-utilities` | Uses `ResizeObserver`; browser-first |
| Code editor | Beta/optional peer | `@hell-ui/angular/features/code-editor` | Needs `window` + `document` |
| PDF viewer | Experimental | `@hell-ui/angular/features/pdf-viewer` | Experimental app surface/recipe; browser-only; requires `window`/`document`, app-provided pdf worker, global listeners, and your own pdf.js/browser compatibility decisions |
| Testing harnesses | Beta/test-only | `@hell-ui/angular/testing` | CDK component harnesses for consumer and library tests |
| Speech transcript | Experimental/best-effort (feature opt-in) | `@hell-ui/angular/composites` (`allowSpeechTranscript`, `allowLiveCaptions` alias) | Browser-only; uses `navigator` + `SpeechRecognition` + `captureStream`; best-effort only, not accessibility-grade captions/timed text |

## Styles

Hell's shipped CSS uses Tailwind v4 theme features, so Tailwind is required
whenever an app imports Hell style entry points. Prefer fine-grained imports for
production:

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
```

`@hell-ui/angular/styles` and `@hell-ui/angular/styles/kitchen-sink` are
kitchen-sink/legacy aliases: primitives, composites, and every feature
stylesheet, including CodeMirror and PDF viewer styling. Use them only when the
app intentionally accepts all feature styles.

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/features/pdf-viewer";
@import "@hell-ui/angular/styles/components/button";
```

Use `@hell-ui/angular/styles/features/data-table` only as the legacy CSS alias for table
utilities.

## Component Contract

Public modules should expose behavior through directives, optional default host
classes, `data-*` state attributes, `data-slot` part attributes, public CSS
variables for supported visual overrides, and `unstyled` for opting out of Hell
default host class styling.

```html
<button hellButton variant="primary">Save</button>
<button hellButton unstyled>Custom behavior-only button</button>

<button hellSelect>
  <span hellSelectValue>Germany</span>
</button>
```

## Docs App

```bash
pnpm start
```

Open `http://localhost:4200/`.
