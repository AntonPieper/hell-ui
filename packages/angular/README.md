<p align="center">
  <img src="assets/hell-ui-logo.svg" alt="Hell logo" width="96" />
</p>

# Hell

Compact Angular component system for dense business applications.

Release status: **internal beta**. Do not treat Hell as production-ready until
the repository production-readiness gate passes against fresh release-candidate
evidence. Read the [first-beta consumer migration guide](https://github.com/AntonPieper/hell-ui/blob/main/docs/release/first-beta-consumer-guide.md)
before external pilot installs.

Hell exposes:

- Behavior primitives: directive-first modules where callers own markup.
- Styled primitives: the same behavior plus optional Hell classes and tokens.
- Composites: higher-level recipes that may own useful structure.
- Features: heavier modules behind feature-specific entry points.

The root package `hell-ui` export is limited to stable core only.
UI surfaces live behind narrow import-path entry points such as `/button`,
`/select`, `/app-shell`, `/features/code-editor`, and `/features/pdf-viewer`;
kept features remain behind scoped entry points.

## Install

```bash
pnpm add hell-ui @angular/forms ng-primitives @angular/cdk @floating-ui/dom rxjs tailwindcss
# add @ng-icons/core and @ng-icons/font-awesome when you use icon-backed entries such as date-picker
```

Feature peers remain optional at runtime, but package peer metadata is package-wide: install the core peer group for any package entry point, then add tier peers only for entry points and styles you import. A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing peers explicitly.

`@angular/forms`, `@angular/cdk`, and `@floating-ui/dom` are strict peers of `ng-primitives`; install them explicitly with the primitive stack. `@ng-icons/core` is an optional peer needed only by icon-backed entry points. `@angular/router` is an optional peer only for `ng-primitives/dialog`; install it when importing Hell dialog.

### Peer dependency tiers

Package-consumer scenarios assert these peer groups with strict peer installs. CodeMirror, pdf.js, TanStack Table, and TanStack Virtual peers stay optional and are not required by root, button, or table scenarios. TanStack Table is isolated behind `hell-ui/table-tanstack`, TanStack Virtual behind `hell-ui/table-tanstack/virtual`, and pdf.js behind `hell-ui/features/pdf-viewer`.

| Tier | Entry points / scenarios | Peer group asserted |
| --- | --- | --- |
| Core | `hell-ui`, `/core`, `/testing`; `core`, `testing`, plus the `root-core` consumer fixture | `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `ng-primitives`, `rxjs` |
| Primitive | Narrow primitives such as `/button`, `/pagination`, `/select`, and `/icon`; `button-ui`, `button`, `pagination`, `primitive-icons-css` | Core peers. Add `tailwindcss` when importing primitive CSS; add `@ng-icons/core` and `@ng-icons/font-awesome` for icon-backed entries. |
| Composite | Narrow composite entry points such as `/app-shell`, `/resizable`, `/master-detail`, `/dialog`, `/omnibar`, `/toast`, and `/audio-player`; `composite-css`, `app-shell`, `resizable`, `master-detail`, `audio-player` | Core peers plus `tailwindcss` for composite CSS. Icon-backed composites also assert optional `@ng-icons/core` and `@ng-icons/font-awesome`; Dialog also needs the optional router peer required by `ng-primitives/dialog`. |
| Audio transcript | `/features/audio-transcript`; `audio-transcript` | Same peers as the icon-backed audio-player composite; no CodeMirror or pdf.js peers. Import `provideHellAudioTranscript()` only where browser transcript capture is deliberately enabled. |
| Table primitives | `/table`; `table` | Core peers plus `tailwindcss`; no CodeMirror, router, Font Awesome, pdf.js, TanStack Table, or TanStack Virtual peers. |
| TanStack table shell | `/table-tanstack`; `table-tanstack` | Core peers plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`. Root, button, and `/table` scenarios prove TanStack Table is not installed unless this shell is imported. |
| TanStack virtual row strategy | `/table-tanstack/virtual`; `table-tanstack-virtual` | Same shell peers plus optional `@tanstack/virtual-core`. The strategy mounts on `hell-tanstack-table`; it is not a separate table engine or root component. |
| Code editor | `/features/code-editor`; `code-editor` | Core peers plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. |
| PDF viewer | `/features/pdf-viewer`; `pdf-viewer` | Core peers plus `tailwindcss`, `@ng-icons/core`, `@ng-icons/font-awesome`, and the exact optional `pdfjs-dist` peer. |


## API Stability

### Stability category policy

Every exported API belongs to one documented category:

- `Stable`: supported public contract. Stable entry points are API-report guarded where listed below; breaking changes need an explicit semver/changelog decision.
- `Beta`: public but still pre-1.0. Shape changes require release notes and migration guidance, but are not promoted as final stable contracts.
- `Experimental`: importable app surface for heavier/browser-specific features. API comments or generated entry-point comments must include `@experimental`, docs must disclose the risk, and apps should isolate the import behind lazy/client-only boundaries when applicable.
- `Deprecated`: compatibility alias with a preferred replacement. API comments must include `@deprecated`, docs must name the replacement, and removal needs an explicit release decision.
- `Internal`: implementation detail, not a consumer import path. `hell-ui/internal/*` subpaths exist only because Angular Package Format cross-entrypoint linking requires resolvable seams; they keep the `internal` prefix and internal Module Category, carry no support promise, and never appear in consumer docs, examples, fixtures, or public API stability reports. Public API files must not export from `/internal/`, `/adapters/`, or metadata-declared internal directories unless the architecture allowlist names the exception and rationale.

The API report gate is manifest-driven: every entry point is guarded unless it
appears in `apiReportExclusions` in `tools/check-api-reports.mjs`. Public API
stability reports in `etc/api-reports/` cover root, `/core`, `/testing`,
narrow primitive, composite, and table entry points. Guarded Internal Package
Path seams whose declarations cross guarded boundaries keep drift-guard
baselines apart under `etc/api-reports/internal/` — they are not public
stability reports. In particular, `hell-ui/internal/core` has such a baseline
because stable root/core exports and narrow runtime contracts reference its
shapes. Guarding an Internal, Beta, or Experimental entry point detects shape
drift; it does not promote that surface to Stable or make it a supported
consumer import path.

The current exclusions are the experimental feature surfaces
`/features/audio-transcript`, `/features/code-editor`, `/features/dialpad`, and
`/features/pdf-viewer`, plus the implementation-only seams
`/internal/audio-transcript`, `/internal/chip`, and
`/internal/ng-primitives`. Excluded entry points are not externalized into the
API Extractor declaration mirror, so any contract that leaks from one into a
guarded report remains locally visible.

| Surface | Category | Browser/SSR notes |
|---|---|---|
| Root/core (`hell-ui`, `/core`) | Stable | Lightweight contracts; no composite or heavy feature exports |
| Report-guarded narrow primitives | Stable | SSR-safe unless a primitive's own docs say otherwise |
| Composites (narrow composite entry points) | Beta | Browser-first surfaces can use `window`/`document` and global listeners for overlays |
| Table primitives (`hell-ui/table`) | Beta | Optional peer; uses `ResizeObserver` for table sizing |
| TanStack table shell (`hell-ui/table-tanstack`, `/table-tanstack/virtual`) | Experimental | Caller-owned TanStack Table remains the engine; Hell owns shell chrome, styling, projection regions, status views, controls, and the optional TanStack Virtual body strategy |
| Code editor (`hell-ui/features/code-editor`) | Experimental | Browser-only CodeMirror runtime: `window`/`document` interactions |
| PDF viewer (`hell-ui/features/pdf-viewer`) | Experimental | Browser-only pdf.js runtime; apps own the worker source; keep behind a lazy route |
| Testing harnesses (`hell-ui/testing`) | Stable/test-only | CDK component harnesses for consumer and library tests |
| Speech transcript (`allowSpeechTranscript`) | Experimental/browser-only/best-effort | Requires `provideHellAudioTranscript()` from `hell-ui/features/audio-transcript`; uses `navigator` + `SpeechRecognition` + `captureStream`; not accessibility-grade captions or production timed text |
| Removed table aliases and row-as-control APIs | Removed before beta | Use `hell-ui/table` for primitives or `hell-ui/table-tanstack` for a TanStack-owned table shell |

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from 'hell-ui/button';
import { HELL_SELECT_IMPORTS } from 'hell-ui/select';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HELL_RESIZABLE_IMPORTS } from 'hell-ui/resizable';
import { HELL_MASTER_DETAIL_IMPORTS } from 'hell-ui/master-detail';
import { HELL_TABLE_UTILITIES_IMPORTS } from 'hell-ui/table';
import { HellButtonHarness } from 'hell-ui/testing';
```

## CSS Imports

Hell style entry points require Tailwind v4. The recommended setup is the
Default Style Bundle — one import that carries the Shared Style Substrate
(`tokens.css`) plus every standard component stylesheet:

```css
@import "tailwindcss";
@import "hell-ui/styles.css";
```

The bundle is generated deterministically from entrypoint metadata. Heavy
Feature Stylesheets (Code Editor, PDF Viewer, TanStack table shell) and Theme
Adapter Stylesheets are never part of it; add them explicitly when you import
those entry points:

```css
@import "tailwindcss";
@import "hell-ui/styles.css";
@import "hell-ui/features/code-editor/styles.css";
```

Advanced consumers can use Granular Style Mode instead: import the token
substrate once, then only the entrypoint stylesheets the app uses:

```css
@import "tailwindcss";
@import "hell-ui/tokens.css";
@import "hell-ui/app-shell/styles.css";
@import "hell-ui/resizable/styles.css";
@import "hell-ui/master-detail/styles.css";
@import "hell-ui/table/styles.css";
```

Choose one standard-style mode. Do not combine `hell-ui/styles.css` with
entrypoint `styles.css` imports for standard component CSS — that duplicates
the same styles in your build.

Optional Theme Adapter Stylesheets may be added to either mode, after the
standard CSS they adapt:

```css
@import "tailwindcss";
@import "hell-ui/styles.css";
@import "hell-ui/themes/glass.css";
```

Old category-level style paths are not public package contracts; the one
package-level `hell-ui/styles.css` bundle is the deliberate exception to the
import-path-first CSS rule.

## Part Style Maps

Migrated primitives and composites support typed Part Style Maps. Pass `[ui]`
with a `root` class string to refine a single-host directive recipe while
keeping behavior, accessibility, and state attributes. Directive-suite children,
such as `hellCardHeader` or `hellAccordionTrigger`, expose their own local
`root` `ui` contract. App Shell/nav directives follow the same local-root rule:
style each directive through its own `ui`. App Shell toggle placement is structural:
a direct topbar child receives the leading sidenav-toggle recipe, while direct
secondary-panel and secondary-body children receive the rail and header recipes.
Set the content cap through `--hell-app-content-max-width` in `hellAppContent`'s
local `ui`. Resizable and Master Detail directives follow that local-root rule
as well: Master Detail owns responsive state, visibility, Back, and focus policy,
while consumer markup owns layout, presentation, and navigation. Toast,
AudioPlayer, Omnibar, and CodeEditor expose flat owned-anatomy maps through
`HellToasterUi`, `HellAudioPlayerUi`, `HellOmnibarUi`, and
`HellCodeEditorUi`. Primitives that have not migrated yet still document
`unstyled` locally.

```html
<button hellButton variant="primary">Save</button>
<button hellButton [ui]="{ root: 'rounded-hell-pill bg-hell-primary' }">Save</button>
<div hellCard [ui]="{ root: 'rounded-hell-xl' }">
  <div hellCardBody>Card body</div>
</div>
<div hellAppShell ui="bg-hell-surface-muted">
  <header hellAppTopbar>
    <button hellSidenavToggle type="button"></button>
  </header>
  <main hellAppContent ui="[--hell-app-content-max-width:960px]">Content</main>
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
<hell-audio-player [ui]="{ controls: 'gap-hell-3', time: 'tabular-nums' }" src="/audio.ogg" />
<hell-toaster [ui]="{ toast: 'shadow-hell-lg', toolbar: 'gap-hell-2' }" />
<hell-code-editor [ui]="{ root: 'rounded-hell-lg', editor: 'min-h-[16rem]' }" />
```

## Customization

Hell uses semantic tokens plus Part Style Maps for migrated styling surfaces:

```html
<button
  hellSelect
  ui="min-w-64 rounded-hell-pill"
  [value]="country()"
  (valueChange)="country.set($event)"
>
  <span hellSelectValue [ui]="{ root: 'font-semibold' }">{{ country() }}</span>
</button>
```

## Headless Composition

```html
<button hellSelect [value]="country()" (valueChange)="country.set($event)">
  <span hellSelectValue>{{ country() }}</span>
  <ng-template hellSelectPortal>
    <div hellSelectDropdown>
      <button hellSelectOption value="DE">Germany</button>
      <button hellSelectOption value="FR">France</button>
    </div>
  </ng-template>
</button>
```
