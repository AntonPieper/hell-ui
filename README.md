<p align="center">
  <img src="projects/hell/assets/hell-ui-logo.svg" alt="Hell UI logo" width="96" />
</p>

# Hell UI

Hell UI is a compact Angular component system for dense business applications.
It favors directive-first primitives, optional styled primitives, opinionated
composites, and heavier features behind feature-specific entry points or split packages.
The root `@hell-ui/angular` export is intentionally scoped to stable core only;
primitives remain available through `/primitives` and narrow primitive entry
points. Composites and kept features are intended for secondary entry points; the PDF viewer lives in `@hell-ui/pdf-viewer`.

## Workspace

```bash
pnpm install
pnpm build:lib
pnpm build:docs
pnpm test
pnpm ci:playwright
pnpm ci:verify # full pre-push: unit, architecture, lint, e2e, package consumer, build
pnpm release:dry-run -- --fast # local release preflight
pnpm release:dry-run -- --full # release-candidate evidence gate
pnpm production-ready:check     # production-ready claim gate
```

`release:dry-run -- --full` runs lint, architecture, CI contract, unit tests,
`build:lib`, pack audit, selected package-consumer scenarios, API report, and
`build:docs`. Evidence is written to timestamped log and JSON files under
`test-results/release-evidence/`. Use `--fast` for local preflight before the
full release-candidate gate. Trusted npm publishing and provenance setup is
specified in `docs/release/npm-publishing.md`.

## Production readiness

Hell UI is **internal beta** and not yet production-ready. Keep release notes,
npm copy, docs, and README language in internal-beta/beta/experimental terms
until `pnpm production-ready:check` passes against fresh release-candidate
evidence.

The docs app accessibility matrix at `/accessibility` lists role patterns,
keyboard coverage, axe/ARIA/browser-test evidence, and known gaps for every
public primitive, composite, and feature. The release checklist in
`docs/release/production-readiness-checklist.md` maps package-consumer, API,
a11y, docs budget, pack audit, and release dry-run blockers to slice IDs and
command evidence. Read the [first-beta consumer migration guide](docs/release/first-beta-consumer-guide.md)
before external pilot installs.

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
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

Peer dependency tiers:

> npm peer metadata is package-wide. Install the core peer group for any
> `@hell-ui/angular` package entry point, then add tier peers only for entry
> points and styles you import. A normal Angular app already has
> `@angular/common`, `@angular/core`, and `rxjs`; install missing peers
> explicitly.
>
> `@floating-ui/dom` is required by `ng-primitives` (not by Hell directly).
> `@angular/router` is an optional peer only for `ng-primitives/dialog` consumers;
> install it when importing Hell dialog or the aggregate `/primitives` entry point.
> Package-consumer scenarios assert these groups with strict peer installs.

| Tier | Entry points / scenarios | Peer group asserted |
|---|---|---|
| Core | `@hell-ui/angular`, `/core`, `/testing`; `root-core`, `core`, `testing` | `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `ng-primitives`, `rxjs` |
| Primitive | Narrow primitives such as `/button`; aggregate `/primitives`; `button-unstyled`, `button`, `primitives-css` | Core peers. Add `tailwindcss` when importing primitive CSS. Aggregate `/primitives` also asserts optional `@angular/router` and `@ng-icons/font-awesome` because dialog and icon-backed primitives are bundled in the aggregate FESM. |
| Composite | `/composites` and narrow composite entry points such as `/app-shell` and `/audio-player`; `composites-css`, `app-shell`, `audio-player` | Core peers plus `tailwindcss` for composite CSS. Aggregate/icon-backed composites also assert optional `@ng-icons/font-awesome`. |
| Audio transcript | `/features/audio-transcript`; `audio-transcript` | Same peers as the icon-backed audio-player composite; no CodeMirror or pdf.js peers. Import `provideHellAudioTranscript()` only where browser transcript capture is deliberately enabled. |
| Table | `/table`, `/data-table`, planned `/table-virtual`, `/table-cdk`; `table`, `data-table` | Core peers plus `tailwindcss`; no CodeMirror, router, Font Awesome, pdf.js, TanStack, or adapter-specific peers for the primitive/simple paths. |
| TanStack table | `/table-tanstack`; `table-tanstack` | Core peers plus `tailwindcss` and optional `@tanstack/angular-table`. Root, `/table`, and `/data-table` scenarios prove TanStack is not installed unless this adapter is imported. |
| Code editor | `/features/code-editor`; `code-editor` | Core peers plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. |
| PDF viewer | `@hell-ui/pdf-viewer`; `pdf-viewer` | Separate package. Install the core peer group plus `@hell-ui/pdf-viewer`, `tailwindcss`, `@ng-icons/font-awesome`, and the package's pdf.js peer. |

CodeMirror and TanStack peers remain optional and are not required by root, button, table, data-table, audio-player, audio-transcript, composite, or PDF package-consumer scenarios. `@hell-ui/angular/features/code-editor` is a kept optional entry point; keep live editor surfaces lazy/client-only when SSR, hydration, or third-party runtime risk matters. pdf.js belongs to `@hell-ui/pdf-viewer`, not `@hell-ui/angular`. The audio transcript runtime is isolated behind `@hell-ui/angular/features/audio-transcript` and has no CodeMirror/pdf.js peers.

## Public API Tiers

| Tier | Stability | Entry points | Compatibility |
|---|---|---|---|
| Primitives | Stable | `@hell-ui/angular/primitives` | SSR-compatible |
| Composites | Beta | `@hell-ui/angular/composites` and narrow composite entry points such as `@hell-ui/angular/app-shell` | Browser DOM + `document`/`window`/global listeners |
| Table primitives | Beta | `@hell-ui/angular/table` | Uses `ResizeObserver`; browser-first |
| Data table and adapters | Experimental | `@hell-ui/angular/data-table`, `@hell-ui/angular/table-tanstack`, `@hell-ui/angular/table-virtual`, `@hell-ui/angular/table-cdk` | Simple native data table and TanStack adapter are available; virtual/CDK adapter entrypoints remain placeholders until HELL-078/079 land |
| Code editor | Beta/optional peer; excluded from stable API reports until policy promotion | `@hell-ui/angular/features/code-editor` | Needs `window` + `document`; keep lazy/client-only when runtime risk matters |
| PDF viewer | Experimental split package | `@hell-ui/pdf-viewer` | Browser-only app surface/recipe owned outside `@hell-ui/angular` |
| Testing harnesses | Beta/test-only | `@hell-ui/angular/testing` | CDK component harnesses for consumer and library tests |
| Speech transcript | Experimental/best-effort (feature opt-in) | `@hell-ui/angular/features/audio-transcript` provider plus `allowSpeechTranscript` / deprecated `allowLiveCaptions` on `@hell-ui/angular/audio-player` or `/composites`; import `hellAudioSpeechSupported` from the feature entrypoint | Browser-only; uses `navigator` + `SpeechRecognition` + `captureStream`; best-effort only, not accessibility-grade captions/timed text |

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
kitchen-sink/legacy aliases: primitives, composites, and kept in-package feature
styles such as CodeMirror. Use them only when the app intentionally accepts all
in-package feature styles.

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/table";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/components/button";
```

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
