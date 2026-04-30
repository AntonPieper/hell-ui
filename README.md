# Hell UI

Hell UI is a compact Angular component system for dense business applications.
It favors directive-first primitives, optional styled primitives, opinionated
composites, and heavier features behind feature-specific entry points.

## Workspace

```bash
pnpm install
pnpm build:lib
pnpm build:docs
pnpm test
```

## Package Imports

```ts
import { HellButton } from 'hell';
import { HELL_SELECT_DIRECTIVES } from 'hell/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell/composites';
import { HELL_TABLE_DIRECTIVES } from 'hell/features/data-table';
```

## Styles

```css
@import "tailwindcss";
@import "hell/styles";
```

Use smaller CSS tiers when the app only needs part of the library:

```css
@import "hell/styles/tokens";
@import "hell/styles/primitives";
@import "hell/styles/composites";
@import "hell/styles/features/data-table";
```

## Component Contract

Public modules should expose behavior through directives, optional default host
classes, `data-*` state attributes, `data-slot` part attributes, public CSS
variables for supported visual overrides, and `unstyled` for full Style Opt-Out.

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
