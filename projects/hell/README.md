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
```

Feature peers remain optional at runtime, but package peer metadata is package-wide: install the core peer group for any package entry point, then add tier peers only for entry points and styles you import. A normal Angular app already has `@angular/common`, `@angular/core`, and `rxjs`; install any missing peers explicitly.

`@floating-ui/dom` is required by `ng-primitives`; install it explicitly with the primitive stack. `@angular/router` is an optional peer only for `ng-primitives/dialog`; install it when importing Hell dialog or the aggregate `/primitives` entry point.

### Peer dependency tiers

Package-consumer scenarios assert these peer groups with strict peer installs. The source repository keeps the peer tier/group manifest at `tools/static-contracts/package-consumer-peer-contracts.json`. CodeMirror, TanStack Table, and TanStack Virtual peers stay optional and are not required by root, button, table, data-table, or table-cdk scenarios. The CDK table skin is an optional entry point but adds no peer beyond the core `@angular/cdk` peer. PDF viewer dependencies belong to `@hell-ui/pdf-viewer`, not this package.

| Tier | Entry points / scenarios | Peer group asserted |
| --- | --- | --- |
| Core | `@hell-ui/angular`, `/core`, `/testing`; `root-core`, `core`, `testing` | `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/cdk`, `@floating-ui/dom`, `@ng-icons/core`, `ng-primitives`, `rxjs` |
| Primitive | Narrow primitives such as `/button`; aggregate `/primitives`; `button-unstyled`, `button`, `primitives-css` | Core peers. Add `tailwindcss` when importing primitive CSS. Aggregate `/primitives` also asserts optional `@angular/router` and `@ng-icons/font-awesome` because dialog and icon-backed primitives are bundled in the aggregate FESM. |
| Composite | `/composites` and narrow composite entry points such as `/app-shell` and `/audio-player`; `composites-css`, `app-shell`, `audio-player` | Core peers plus `tailwindcss` for composite CSS. Aggregate/icon-backed composites also assert optional `@ng-icons/font-awesome`. |
| Audio transcript | `/features/audio-transcript`; `audio-transcript` | Same peers as the icon-backed audio-player composite; no CodeMirror or pdf.js peers. Import `provideHellAudioTranscript()` only where browser transcript capture is deliberately enabled. |
| Table primitives / simple data table | `/table`, `/data-table`; `table`, `data-table`, `no-legacy-alias` | Core peers plus `tailwindcss`; no CodeMirror, router, Font Awesome, pdf.js, TanStack Table, or TanStack Virtual peers. The negative scenario proves removed legacy table aliases and CSS aliases stay unavailable. |
| TanStack table adapter | `/table-tanstack`; `table-tanstack` | Core peers plus `tailwindcss` and optional `@tanstack/angular-table`; no `@tanstack/virtual-core`. Root, button, `/table`, and `/data-table` scenarios prove TanStack Table is not installed unless this adapter is imported. |
| TanStack virtual adapter | `/table-virtual`; `table-virtual` | Core peers plus `tailwindcss` and optional `@tanstack/virtual-core`; no `@tanstack/angular-table`. Root, button, `/table`, and `/data-table` scenarios prove TanStack Virtual is not installed unless this adapter is imported. |
| CDK table skin adapter | `/table-cdk`; `table-cdk` | Core peers plus `tailwindcss`; no TanStack Table or TanStack Virtual peer. The CDK adapter uses the core `@angular/cdk` peer already required by Hell. |
| Code editor | `/features/code-editor`; `code-editor` | Core peers plus `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. |
| PDF viewer | `@hell-ui/pdf-viewer`; `pdf-viewer` | Separate package; see that package for its own install contract. |


## API Stability

### Stability category policy

Every exported API belongs to one documented category:

- `Stable`: supported public contract. Stable entry points are API-report guarded by the entrypoint stability manifest; breaking changes need an explicit semver/changelog decision.
- `Beta`: public but still pre-1.0. Shape changes require release notes and migration guidance, but are not promoted as final stable contracts.
- `Experimental`: importable app surface for heavier/browser-specific features. API comments or generated entry-point comments must include `@experimental`, docs must disclose the risk, and apps should isolate the import behind lazy/client-only boundaries when applicable.
- `Deprecated`: compatibility alias with a preferred replacement. API comments must include `@deprecated`, docs must name the replacement, and removal needs an explicit release decision.
- `Internal`: implementation detail, not a consumer import path. Public API files must not export from `/internal/`, `/adapters/`, or manifest-declared internal directories unless the static-contract allowlist names the exception and rationale.

The machine-readable source of truth for entrypoint tier, owner package, peer tier, package-consumer scenario, and API-report expectation is `tools/entrypoint-manifest.mjs`.

The PDF viewer was split out before public beta; use `@hell-ui/pdf-viewer` for the component, styles, and worker setup docs.

## Angular Imports

Prefer the narrowest entry point that contains the API you use:

```ts
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/primitives';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
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
@import "@hell-ui/angular/styles/table";
@import "@hell-ui/angular/styles/components/button";
```

`@hell-ui/angular/styles` and `@hell-ui/angular/styles/kitchen-sink` are legacy kitchen-sink aliases that include primitives, composites, and kept in-package feature styles such as CodeMirror. Use them only when the app intentionally accepts all in-package feature styles.

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
