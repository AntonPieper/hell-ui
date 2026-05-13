<p align="center">
  <img src="projects/hell/assets/hell-ui-logo.svg" alt="Hell UI logo" width="96" />
</p>

# Hell UI

Hell UI is a compact Angular component system for dense business applications.
It favors directive-first primitives, optional styled primitives, opinionated
composites, and heavier features behind feature-specific entry points.
Feature dependencies are optional peers; install only the feature stacks your
app imports.

## Workspace

```bash
pnpm install
pnpm build:lib
pnpm build:docs
pnpm test
pnpm ci:verify # full pre-push: unit, architecture, lint, e2e, package consumer, build
```

## Package Imports

Install the light UI stack when using primitives/composites:

```bash
pnpm add hell ng-primitives @ng-icons/core @ng-icons/font-awesome tailwindcss
```

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton, HELL_SELECT_DIRECTIVES } from 'hell/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell/composites';
import { HELL_TABLE_UTILITY_DIRECTIVES } from 'hell/features/table-utilities';
```

Heavy feature entry points keep extra peers local: CodeMirror packages for
`hell/features/code-editor`, `pdfjs-dist` plus the light UI stack for
`hell/features/pdf-viewer`, and no icon/ng-primitives stack for
`hell/features/table-utilities`. `hell/features/data-table` remains as a
legacy compatibility alias for table utilities.

## Styles

```css
@import "tailwindcss";
@import "hell/styles";
```

`hell/styles` is the all-in stylesheet: primitives, composites, and every
feature stylesheet. Use smaller CSS tiers when the app only needs part of the
library:

```css
@import "hell/styles/tokens";
@import "hell/styles/primitives";
@import "hell/styles/composites";
@import "hell/styles/features/table-utilities";
@import "hell/styles/features/data-table"; /* legacy alias */
@import "hell/styles/features/code-editor";
@import "hell/styles/features/pdf-viewer";
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
