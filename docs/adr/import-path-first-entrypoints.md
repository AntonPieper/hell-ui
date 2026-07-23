# ADR: Import-path-first Angular entrypoints

- Status: Accepted; amended 2026-07-20 (Default Style Bundle exception)
- Date: 2026-06-26

## Amendment (2026-07-20)

The public package is renamed to `hell-ui` by
`0002-public-package-and-stylesheet-surface.md`, without a compatibility
package. Import-path-first remains the TypeScript rule: the Light Root Entry
Point stays core-only, logical component entrypoints remain canonical, and
Module Categories do not become TypeScript barrels.

CSS now has one deliberate exception. `hell-ui/styles.css` is the recommended
package-level Default Style Bundle, generated from explicit entrypoint metadata
and containing the Shared Style Substrate plus standard component styles.
Entrypoint-Scoped Stylesheets remain available for Granular Style Mode. Heavy
Feature Stylesheets and Theme Adapter Stylesheets remain explicit opt-ins, and
category CSS paths remain prohibited.

## Context

At the time of the original decision, `hell-ui` had many secondary
entrypoints. The previous source layout mixed real package entrypoint
directories with implementation directories under category folders below the
old library source root. That made files harder to find: a consumer import such
as `hell-ui/button` did not point at the source directory a maintainer
should open first.

Angular Package Format still requires real secondary-entrypoint package
directories with `ng-package.json` files. The question is whether those
directories should remain thin wrappers around implementation folders, or
whether the source should move to the import path.

## Decision

Use an import-path-first layout for `hell-ui`.

- The source directory for an entrypoint matches the public import path.
  `hell-ui/button` lives in `packages/angular/button`, and
  `hell-ui/features/code-editor` lives in
  `packages/angular/features/code-editor`.
- Each entrypoint owns its category metadata in a local
  `hell-entrypoint.json` sidecar next to its `ng-package.json`. Categories such
  as `styled-primitive`, `mixed-entrypoint`, `composite`, `feature`,
  `table-primitives`, and `tanstack-table-shell` are classification data, not
  directory names or public aggregate import segments. The central tooling only
  discovers those sidecars and renders generated `public-api.ts` and
  `ng-package.json` files.
- Do not publish TypeScript category aggregates for primitives or composites.
- Do not publish category CSS paths. Shared tokens stay at
  `hell-ui/tokens.css`; Granular Style Mode imports component, composite,
  table, and feature CSS from the matching entrypoint, for example
  `hell-ui/button/styles.css`, `hell-ui/table/styles.css`, or
  `hell-ui/features/code-editor/styles.css`.
- Permit exactly one package-level standard CSS aggregate:
  `hell-ui/styles.css`. Generate it from explicit entrypoint style policy;
  exclude Heavy Feature Stylesheets and Theme Adapter Stylesheets.
- Keep the root `hell-ui` entrypoint light and core-only.

## Consequences

- Maintainers can find implementation files by following the import path first.
- Category reclassification is an entrypoint-local sidecar edit, not a
  filesystem move or central script edit.
- Package consumers must import each TypeScript surface explicitly. This is
  intentional: runtime, peer, and API costs stay attached to the entrypoints
  that need them. Consumers may choose the Default Style Bundle or import
  standard CSS entrypoint by entrypoint.
- Architecture, package-consumer, package-audit, CI, docs, and release tooling
  must reject aggregate TypeScript paths and category CSS paths while
  recognizing the one package-level Default Style Bundle.
- Subfolders under an entrypoint are reserved for real internal subdomains, not
  for primitive/composite taxonomy.
