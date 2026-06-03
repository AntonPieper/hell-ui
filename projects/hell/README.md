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

The root package `@hell-ui/angular` export is limited to stable core only.
Primitives live behind `/primitives` and narrow primitive entry points. Composites live behind `/composites` and narrow composite entry points; kept features remain behind scoped entry points. The PDF viewer lives in the separate `@hell-ui/pdf-viewer` package.

## Install

```bash
pnpm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
# add @ng-icons/font-awesome when you use icon-backed entries such as pagination or date-picker
# or
npm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
```

Feature peers remain optional at runtime, but npm peer metadata is package-wide: install the core peer group for any package entry point, then add tier peers only for entry points and styles you import. A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing peers explicitly.

`@floating-ui/dom` is required by `ng-primitives`; install it explicitly with the primitive stack. `@angular/router` is an optional peer only for `ng-primitives/dialog`; install it when importing Hell dialog or the aggregate `/primitives` entry point.

### Peer dependency tiers

Package-consumer scenarios assert these peer groups with strict peer installs. CodeMirror peers stay optional and are not required by the root or button scenarios. PDF viewer dependencies belong to `@hell-ui/pdf-viewer`, not this package.

| Tier | Entry points / scenarios | Peer group asserted |
| --- | --- | --- |
| Core | `@hell-ui/angular`, `/core`, `/testing`; `root-core`, `core`, `testing` | `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `ng-primitives`, `rxjs` |
| Primitive | Narrow primitives such as `/button`; aggregate `/primitives`; `button-unstyled`, `button`, `primitives-css` | Core peers. Add `tailwindcss` when importing primitive CSS. Aggregate `/primitives` also asserts optional `@angular/router` and `@ng-icons/font-awesome` because dialog and icon-backed primitives are bundled in the aggregate FESM. |
| Composite | `/composites` and narrow composite entry points such as `/app-shell`; `composites-css`, `app-shell` | Core peers plus `tailwindcss` for composite CSS. Aggregate/icon-backed composites also assert optional `@ng-icons/font-awesome`. |
| Table utilities | `/features/table-utilities`, legacy `/features/data-table`; `table-utilities`, `data-table` | Core peers plus `tailwindcss`; no CodeMirror, router, or Font Awesome peers. |
| Code editor | `/features/code-editor`; `code-editor` | Core peers plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. |
| PDF viewer | `@hell-ui/pdf-viewer`; `pdf-viewer` | Separate package; see that package for its own install contract. |


## API Stability

### Stability category policy

Every exported API belongs to one documented category:

- `Stable`: supported public contract. Stable entry points are API-report guarded where listed below; breaking changes need an explicit semver/changelog decision.
- `Beta`: public but still pre-1.0. Shape changes require release notes and migration guidance, but are not promoted as final stable contracts.
- `Experimental`: importable app surface for heavier/browser-specific features. API comments or generated entry-point comments must include `@experimental`, docs must disclose the risk, and apps should isolate the import behind lazy/client-only boundaries when applicable.
- `Deprecated`: compatibility alias with a preferred replacement. API comments must include `@deprecated`, docs must name the replacement, and removal needs an explicit release decision.
- `Internal`: implementation detail, not a consumer import path. Public API files must not export from `/internal/`, `/adapters/`, or manifest-declared internal directories unless the architecture allowlist names the exception and rationale.

The stable API report set currently covers `@hell-ui/angular`, `@hell-ui/angular/core`, `@hell-ui/angular/primitives`, and `@hell-ui/angular/testing`.

| Surface | Category | Browser/SSR notes |
|---|---|---|
| Root/core (`@hell-ui/angular`, `/core`) | Stable | Lightweight contracts; no composite or heavy feature exports |
| Primitives (`@hell-ui/angular/primitives`, narrow primitive entry points) | Stable | SSR-safe unless a primitive's own docs say otherwise |
| Composites (`@hell-ui/angular/composites`, narrow composite entry points) | Beta | Browser-first surfaces can use `window`/`document` and global listeners for overlays |
| Table utilities (`@hell-ui/angular/features/table-utilities`) | Beta feature | Optional peer; uses `ResizeObserver` for table sizing |
| Code editor (`@hell-ui/angular/features/code-editor`) | Experimental | Browser-only CodeMirror runtime: `window`/`document` interactions |
| PDF viewer (`@hell-ui/pdf-viewer`) | Experimental split package | Browser-only app surface/recipe owned outside `@hell-ui/angular` |
| Testing harnesses (`@hell-ui/angular/testing`) | Stable/test-only | CDK component harnesses for consumer and library tests |
| Speech transcript (`allowSpeechTranscript`) | Experimental/browser-only/best-effort | Uses `navigator` + `SpeechRecognition` + `captureStream`; not accessibility-grade captions or production timed text |
| Deprecated aliases (`/features/data-table`, `HELL_TABLE_DIRECTIVES`, `HELL_TABLE_UTILITY_DIRECTIVES`, `HellTableRow.interactive`, `allowLiveCaptions`, `HellDataTableLabels`, `hellCodeEditorSetup`) | Deprecated | Keep compatibility imports only while migrating to the documented replacements |

The PDF viewer was split out before public beta; use `@hell-ui/pdf-viewer` for the component, styles, and worker setup docs.

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

## CSS Imports

Hell style entry points require Tailwind v4. Prefer fine-grained imports for production:

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
```

For broader loading:

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/components/button";
```

`@hell-ui/angular/styles` and `@hell-ui/angular/styles/kitchen-sink` are legacy kitchen-sink aliases that include primitives, composites, and kept in-package feature styles such as CodeMirror. Use them only when the app intentionally accepts all in-package feature styles. Use `@hell-ui/angular/styles/features/data-table` only as the legacy CSS alias for table utilities.

## Style Opt-Out

`unstyled` removes Hell host classes while keeping behavior, accessibility, and
state attributes.

```html
<button hellButton variant="primary">Save</button>
<button hellButton unstyled variant="primary">Save</button>
```

## Customization

Hell uses semantic tokens and supported component variables:

```css
.danger-zone {
  --hell-button-radius: 999px;
  --hell-button-height: 40px;
  --hell-select-width: auto;
  --hell-select-indicator-display: none;
}
```

## Headless Composition

```html
<button hellSelect [value]="country()" (valueChange)="country.set($event)">
  <span hellSelectValue>{{ country() }}</span>
</button>

<ng-template hellSelectPortal>
  <div hellSelectDropdown>
    <button hellSelectOption value="DE">Germany</button>
    <button hellSelectOption value="FR">France</button>
  </div>
</ng-template>
```
