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
pnpm add @hell-ui/angular ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core @ng-icons/font-awesome tailwindcss
```

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton, HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/composites';
import { HELL_TABLE_UTILITY_DIRECTIVES } from '@hell-ui/angular/features/table-utilities';
```

Peer dependency expectations by entry point:

| Entry point | Extra peers beyond Angular core/common |
|---|---|
| `@hell-ui/angular/core` | `rxjs` |
| `@hell-ui/angular/primitives` | `@angular/forms`, `@angular/router`, `ng-primitives`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `@ng-icons/font-awesome`, `rxjs`, `tailwindcss` |
| `@hell-ui/angular/composites` | Light UI stack above |
| `@hell-ui/angular/features/code-editor` | `@codemirror/*`, `@lezer/highlight`, `tailwindcss` |
| `@hell-ui/angular/features/table-utilities` | `tailwindcss` |
| `@hell-ui/angular/features/pdf-viewer` | `pdfjs-dist` plus the light UI stack |

`@hell-ui/angular/features/data-table` remains a legacy alias for table utilities.

## Public API Tiers

| Tier | Stability | Entry points | Compatibility |
|---|---|---|---|
| Primitives | Stable | `@hell-ui/angular/primitives` | SSR-compatible |
| Composites | Beta | `@hell-ui/angular/composites` | Browser DOM + `document`/`window`/global listeners |
| Table utilities | Beta | `@hell-ui/angular/features/table-utilities` | Uses `ResizeObserver`; browser-first |
| Code editor | Beta/optional peer | `@hell-ui/angular/features/code-editor` | Needs `window` + `document` |
| PDF viewer | Experimental | `@hell-ui/angular/features/pdf-viewer` | Browser-only; requires `window`/`document`, pdf workers, and global listeners |
| Live captions | Experimental (feature opt-in) | `@hell-ui/angular/composites` (`allowLiveCaptions`) | Browser-only; uses `navigator` + `SpeechRecognition` |

## Styles

```css
@import "tailwindcss";
@import "@hell-ui/angular/styles";
```

`@hell-ui/angular/styles` is the all-in stylesheet: primitives, composites, and
every feature stylesheet. Use smaller CSS tiers when the app only needs part of
the library:

```css
@import "@hell-ui/angular/styles/tokens";
@import "@hell-ui/angular/styles/primitives";
@import "@hell-ui/angular/styles/composites";
@import "@hell-ui/angular/styles/features/table-utilities";
@import "@hell-ui/angular/styles/features/code-editor";
@import "@hell-ui/angular/styles/features/pdf-viewer";
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
