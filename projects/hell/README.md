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
pnpm add hell ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss
```

Feature entry points add their own optional stacks only when imported:

| Entry point | Install when used |
| --- | --- |
| `hell/primitives`, `hell/composites` | `ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss` |
| `hell/features/data-table` | Angular + `tailwindcss` only |
| `hell/features/code-editor` | `@codemirror/view @codemirror/state @codemirror/commands @codemirror/language @lezer/highlight` plus any language package, e.g. `@codemirror/lang-javascript` |
| `hell/features/pdf-viewer` | `pdfjs-dist` plus the base light UI stack (`ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss`) |

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton, HELL_SELECT_DIRECTIVES } from 'hell/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell/composites';
import { HELL_TABLE_DIRECTIVES } from 'hell/features/data-table';
```

## CSS Imports

```css
@import "tailwindcss";
@import "hell/styles";
```

For progressive loading:

```css
@import "hell/styles/tokens";
@import "hell/styles/primitives";
@import "hell/styles/composites";
@import "hell/styles/features/code-editor";
@import "hell/styles/features/data-table";
@import "hell/styles/features/pdf-viewer";
```

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
