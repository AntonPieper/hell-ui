# Docs example import boundaries

- ID: docs-example-import-boundaries
- Slice: HELL-050; HELL-087 docs code preview exception
- Enforced by: `pnpm run test:static-contracts` (`tools/check-static-contracts.mjs`, `checkDocsLazyRouteImportGraphContract()`)
- Route source of truth: `projects/hell-docs/src/app/docs-catalog.ts`
- Static Contract Manifest: `tools/static-contracts/docs-lazy-route-boundaries.json`

## Rule

Docs pages are lazy routes. Keep each page's live examples and raw source imports inside that page boundary:

1. Add example components under `projects/hell-docs/src/app/pages/<route>/examples/`.
2. Import the live example component and its `?raw` source only from that route's page component.
3. Register search metadata in `projects/hell-docs/src/app/docs-search-index.ts`; do not import example implementations there.
4. Put reusable docs shell widgets in `projects/hell-docs/src/app/shared/`, not in another page directory.
5. Do not import page/example code from another lazy route unless the exact edge is listed in `tools/static-contracts/docs-lazy-route-boundaries.json`.

When the static-contract check fails, it lists the page/example import edge that crosses a lazy-route boundary so the next agent can move the code to `shared/`, move the example under the owning route, or add a narrow documented allowance.

## Manifest-owned Policies

`tools/static-contracts/docs-lazy-route-boundaries.json` owns:

- heavy lazy-route package and stylesheet boundaries;
- the single shared docs code-preview wrapper exception;
- allowed cross-boundary page imports, including owner slice and rationale.

No other page-to-page or example-to-other-page imports are allowed. Future test harnesses should either live under the routed page that owns them or be promoted to `projects/hell-docs/src/app/shared/` if more than one lazy route needs them. If a stable exception is needed, add it to the manifest in the same slice as the route change.
