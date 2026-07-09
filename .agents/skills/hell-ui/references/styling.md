# Styling And Design

Read this for CSS, component appearance, Part Style Map migrations, semantic
tokens, themes, or design polish.

## Styling Contract

- Library visuals flow through Part Style Maps, Public Parts with `data-slot`,
  `data-*` state, semantic theme tokens, CSS custom properties, and component
  CSS colocated with import-path-first entry points such as
  `packages/angular/button/styles.css`.
- Runtime theming targets semantic Hell tokens such as `--color-hell-*`,
  `--spacing-hell-*`, `--radius-hell-*`, and `--shadow-hell-*`.
  Component-specific public `--hell-*` vars need a documented scoped-theming,
  geometry, or measurement reason.
- Component CSS lives in `@layer components`. Variants should set internal vars;
  base declarations read those vars.
- Do not patch library visuals through ad hoc template classes, `ngClass`,
  inline visual styles, `[style.*]`, `style.setProperty(...)`, or `classList`.
- Template `class` is additive for layout/test/non-conflicting hooks, not the
  Tailwind conflict-resolution path.

## Part Style Maps

- Start at `packages/angular/core/styleable.ts` and
  `packages/angular/core/part-style-merge.ts`.
- Export each migrated component's part union and concrete UI type.
- Use shared `HellUiInput`, `HellRecipe`, `HellPartStyleable`, and configured
  `hellTwMerge`; do not create per-component merge helpers, `clsx`, `cva`,
  `tailwind-variants`, or local `cn` helpers for migrated part styling.
- Public Parts render with stable `data-slot` values. Do not introduce
  `data-part`.
- Do not expose `[ui].class`, `omit`, or global visual layers.
- Migrated components drop `unstyled`; do not add compatibility `unstyled`
  inputs for new Part Style Map surfaces.
- For styling migrations, search composed consumers and stale docs/comments, then
  prove type exports, API reports, shipped recipe CSS, semantic token runtime
  styles, and package-consumer behavior when the public surface changes.
- `tools/check-architecture.mjs` derives migrated Part Style Map modules from
  decorated source classes that declare the typed `ui` signal and
  `hellPartStyler` pipeline. It enforces that emitted `data-slot` values match
  each component's exported Part union. Button is the single-root reference;
  Dialpad is the multi-part reference.
- Shipped recipe CSS may depend on component CSS `@source` pointing at built
  FESM output. Consumer apps should not need Hell `@source` scanning for default
  visuals; prove that with package-consumer scenarios.

## Design Taste

- hell is compact, neutral, and work-focused for dense business applications.
- Use dense but breathable spacing: 4, 6, 8, 12, 16, 20, 24, 32px; controls
  around 28, 34, 40px.
- App screens use persistent topbar, sidenav, content, and optional secondary
  panel.
- Cards are for repeated items, demos, modals, and framed tools; page sections
  stay unframed.
- Prefer tonal layers and 1px borders. Heavy shadows are for overlays and
  floating surfaces.
- Avoid oversized hero treatment, decorative gradients, giant rounded cards,
  one-note palettes, and marketing composition in product UI.
