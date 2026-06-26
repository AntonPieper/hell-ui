# ADR: Import-path-first Angular entrypoints

- Status: Accepted
- Date: 2026-06-26

## Context

`@hell-ui/angular` has many secondary entrypoints. The previous source layout
mixed real package entrypoint directories with implementation directories under
category folders below the old library source root. That made files harder to
find: a consumer import such as `@hell-ui/angular/button` did not point at the
source directory a maintainer should open first.

Angular Package Format still requires real secondary-entrypoint package
directories with `ng-package.json` files. The question is whether those
directories should remain thin wrappers around implementation folders, or
whether the source should move to the import path.

## Decision

Use an import-path-first layout for `@hell-ui/angular`.

- The source directory for an entrypoint matches the public import path.
  `@hell-ui/angular/button` lives in `packages/angular/button`, and
  `@hell-ui/angular/features/code-editor` lives in
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
  `@hell-ui/angular/tokens.css`; component, composite, table, and feature CSS
  is imported from the matching entrypoint, for example
  `@hell-ui/angular/button/styles.css`,
  `@hell-ui/angular/table/styles.css`, or
  `@hell-ui/angular/features/code-editor/styles.css`.
- Keep the root `@hell-ui/angular` entrypoint light and core-only.

## Consequences

- Maintainers can find implementation files by following the import path first.
- Category reclassification is an entrypoint-local sidecar edit, not a
  filesystem move or central script edit.
- Package consumers must import each surface explicitly. This is intentional:
  peer and style costs stay attached to the entrypoints that need them.
- Architecture, package-consumer, package-audit, CI, docs, and release tooling
  must reject old aggregate TypeScript paths and category CSS paths.
- Subfolders under an entrypoint are reserved for real internal subdomains, not
  for primitive/composite taxonomy.
