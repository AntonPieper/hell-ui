<p align="center">
  <img src="assets/hell-ui-logo.svg" alt="Hell logo" width="96" />
</p>

# Hell

Compact Angular component system for dense business applications.

Hell exposes:

- Behavior primitives: directive-first modules where callers own markup.
- Styled primitives: the same behavior plus optional Hell classes and tokens.
- Composites: higher-level recipes that may own useful structure.
- Features: heavier modules behind feature-specific entry points.

The root package `@hell-ui/angular` export is limited to stable core only.
Primitives live behind `/primitives` and narrow primitive entry points; composites and features remain behind scoped entry points.

## Install

```bash
pnpm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
# add @ng-icons/font-awesome when you use icon-backed entries such as pagination or date-picker
# or
npm add @hell-ui/angular @angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs tailwindcss
```

Feature peers remain optional, but npm peer metadata is package-wide: install the base light stack for any package entry point.

`@floating-ui/dom` is required by `ng-primitives`; install it explicitly with the primitive stack.

| Entry point | Install when used |
| --- | --- |
| `@hell-ui/angular`, `/core`, `/primitives`, `/composites`, `/testing` | Base light stack: `@angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs` plus style-only `tailwindcss`; add optional `@ng-icons/font-awesome` for icon-backed entries |
| `@hell-ui/angular/features/table-utilities` | Base light stack |
| `@hell-ui/angular/features/data-table` | Legacy compatibility alias for `@hell-ui/angular/features/table-utilities` |
| `@hell-ui/angular/features/code-editor` | Base light stack plus `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight` |
| `@hell-ui/angular/features/pdf-viewer` | Base light stack plus exact `pdfjs-dist@5.6.205`; app must provide a pdf.js worker source |


## API Stability

| Tier | Stability | Browsing/SSR notes |
|---|---|---|
| Primitives (`@hell-ui/angular/primitives`) | Stable | SSR-safe |
| Composites (`@hell-ui/angular/composites`) | Beta | Browser-first: `window`/`document` and global listeners for overlays |
| Table utilities (`@hell-ui/angular/features/table-utilities`) | Beta | Optional peer; uses `ResizeObserver` for table sizing |
| Code editor (`@hell-ui/angular/features/code-editor`) | Beta/optional peer | Browser-only: `window`/`document` interactions |
| PDF viewer (`@hell-ui/angular/features/pdf-viewer`) | Experimental | Browser-only app surface/recipe: `window`/`document`, pdf workers, global listeners, and app-owned pdf.js/browser compatibility decisions |
| Testing harnesses (`@hell-ui/angular/testing`) | Beta/test-only | CDK component harnesses for consumer and library tests |
| Speech transcript (`allowSpeechTranscript`) | Experimental/browser-only/best-effort | Uses `navigator` + `SpeechRecognition` + `captureStream`; not accessibility-grade captions or production timed text |

The PDF viewer component now exposes:

- `globalShortcuts` input (default `false`) to opt into document-level keyboard listeners.
- `worker` input to pass an app-owned URL/Worker; Hell does not bundle a default worker in the package tarball.
- incremental thumbnail rendering behind `IntersectionObserver` for overview mode.

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/composites';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
import { HellButtonHarness } from '@hell-ui/angular/testing';
```

## CSS Imports

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles/kitchen-sink";
```

For progressive loading:

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/features/pdf-viewer";
@import "@hell-ui/angular/styles/components/button";
```

`@hell-ui/angular/styles` and `@hell-ui/angular/styles/kitchen-sink` are legacy kitchen-sink aliases. Use `@hell-ui/angular/styles/features/data-table` only as the legacy CSS alias for table
utilities.

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
