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

## Install

```bash
pnpm add @hell-ui/angular ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss
```

Feature entry points add their own optional stacks only when imported:

| Entry point | Install when used |
| --- | --- |
| `@hell-ui/angular/primitives`, `@hell-ui/angular/composites` | `ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss` |
| `@hell-ui/angular/features/table-utilities` | Angular + `tailwindcss` only |
| `@hell-ui/angular/features/data-table` | Legacy compatibility alias for `@hell-ui/angular/features/table-utilities` |
| `@hell-ui/angular/features/code-editor` | `@codemirror/view @codemirror/state @codemirror/commands @codemirror/language @lezer/highlight` plus any language package, e.g. `@codemirror/lang-javascript` |
| `@hell-ui/angular/features/pdf-viewer` | `pdfjs-dist` plus the base light UI stack (`ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss`) |

## API Stability

| Tier | Stability | Browsing/SSR notes |
|---|---|---|
| Primitives (`@hell-ui/angular/primitives`) | Stable | SSR-safe |
| Composites (`@hell-ui/angular/composites`) | Beta | Browser-first: `window`/`document` and global listeners for overlays |
| Table utilities (`@hell-ui/angular/features/table-utilities`) | Beta | Optional peer; uses `ResizeObserver` for table sizing |
| Code editor (`@hell-ui/angular/features/code-editor`) | Beta/optional peer | Browser-only: `window`/`document` interactions |
| PDF viewer (`@hell-ui/angular/features/pdf-viewer`) | Experimental | Browser-only: `window`/`document`, pdf workers, and global listeners |
| Live captions (`allowLiveCaptions`) | Experimental/browser-only | Uses `navigator` + `SpeechRecognition` |

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton, HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/composites';
import { HELL_TABLE_UTILITY_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
```

## CSS Imports

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles";
```

For progressive loading:

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/features/pdf-viewer";
```

Use `@hell-ui/angular/features/data-table` only as the legacy CSS alias for table
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
