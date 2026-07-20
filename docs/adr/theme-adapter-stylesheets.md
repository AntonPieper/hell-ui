# ADR: Theme adapter stylesheets

- Status: Accepted; amended 2026-07-20 (Default Style Bundle interaction)
- Date: 2026-07-01

## Amendment (2026-07-20)

The target package identity is `hell-ui`. Theme Adapter Stylesheets remain
explicit opt-ins and are not included in the Default Style Bundle accepted by
`0002-public-package-and-stylesheet-surface.md`. Consumers import an adapter
after `hell-ui/styles.css` or after the Shared Style Substrate and relevant
Entrypoint-Scoped Stylesheets in Granular Style Mode.

## Context

`packages/angular/tokens.css` is Hell's Shared Style Substrate. It should define
base Semantic Theme Tokens, palettes, and skin-wide primitives. Putting selectors
such as `[data-hell-skin="glass"] [hellCard][data-slot="root"]` in that file
made tokens know every component that might need a skin-specific visual decision.
That does not scale with import-path-first entrypoints or the Part Style Map
contract.

## Decision

Use optional Theme Adapter Stylesheets.

- Keep `hell-ui/tokens.css` limited to Semantic Theme Tokens,
  palettes, skin-wide primitives, and page-level skin backgrounds.
- Export per-skin adapter CSS files from `hell-ui/themes/<skin>.css`.
- Import adapters after the selected standard-style mode: either
  `hell-ui/styles.css` or `tokens.css` plus the concrete entrypoint styles they
  adapt.
- Do not include adapters in the Default Style Bundle.
- Adapter selectors may target component directive selectors only together with
  stable Public Parts expressed through `data-slot`.
- Adapter coverage is explicit and partial. If a component is not listed in an
  adapter stylesheet, it keeps the default entrypoint style for that skin.
- Do not create category CSS aggregates or make `tokens.css` a component
  selector registry. The package-level Default Style Bundle is the sole
  accepted standard CSS aggregate.

## Consequences

- Theme authors can make a skin visually distinctive without inventing a giant
  semantic-token ontology for every component state.
- Component implementors keep their normal Part Style Map and semantic-token
  contract; they do not need to add component-specific public token families for
  every curated skin.
- Package metadata, pack audit, docs, and architecture guards must treat
  `themes/*.css` as first-class style exports while continuing to reject legacy
  category style paths.
- Docs may lazy-load adapter styles for curated themes because adapter files are
  optional skin polish, not required component defaults.
