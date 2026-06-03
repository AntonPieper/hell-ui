# Docs example import boundaries

- ID: docs-example-import-boundaries
- Slice: HELL-050
- Enforced by: `npm run test:architecture` (`tools/check-architecture.mjs`, `checkDocsLazyRouteImportGraphContract()`)
- Source of truth: `projects/hell-docs/src/app/docs-catalog.ts`

## Rule

Docs pages are lazy routes. Keep each page's live examples and raw source imports inside that page boundary:

1. Add example components under `projects/hell-docs/src/app/pages/<route>/examples/`.
2. Import the live example component and its `?raw` source only from that route's page component.
3. Register search metadata in `projects/hell-docs/src/app/docs-search-index.ts`; do not import example implementations there.
4. Put reusable docs shell widgets in `projects/hell-docs/src/app/shared/`, not in another page directory.
5. Do not import page/example code from another lazy route unless the exact edge is listed below and mirrored in `tools/check-architecture.mjs`.

When the architecture check fails, it lists the page/example import edge that crosses a lazy-route boundary so the next agent can move the code to `shared/`, move the example under the owning route, or add a narrow documented allowance.

## Heavy lazy-route policies

| Policy ID | Lazy route | Boundary | Guarded imports / references | Status |
| --- | --- | --- | --- | --- |
| pdf-viewer-docs | `/components/pdf-viewer` | `components/pdf-viewer` | `@hell-ui/pdf-viewer`, `pdfjs-dist`, `@hell-ui/pdf-viewer/styles`, `hell-ui/pdf-viewer/styles/pdf-viewer.css`, `pdfjs/pdf_viewer.css` | PDF examples are proven lazy by `docs-catalog.ts`; heavy imports and stylesheet references may appear only inside the PDF viewer route boundary. |
| code-editor-docs | `/components/code-editor` | `components/code-editor` | `@hell-ui/angular/features/code-editor`, `@codemirror/`, `@hell-ui/angular/styles/features/code-editor` | CodeMirror examples are proven lazy by `docs-catalog.ts`; CodeMirror imports and feature CSS may appear only inside the code editor route boundary. |
| audio-player-docs | `/components/audio-player` | `components/audio-player` | `@hell-ui/angular/audio-player`, `@hell-ui/angular/features/audio-transcript` | Audio player and speech transcript examples are proven lazy by `docs-catalog.ts`; the optional transcript provider may appear only inside the audio player route boundary. |

## Allowed cross-boundary page imports

| From | To | Owner | Rationale |
| --- | --- | --- | --- |
| `projects/hell-docs/src/app/pages/components/flyout/flyout.page.ts` | `projects/hell-docs/src/app/pages/testing/floating-dismissal-harness.page.ts` | HELL-040/HELL-057 | Flyout exposes the query-param-only floating dismissal browser harness; it is deliberately bundled only with the lazy flyout route, not the docs shell. |

No other page-to-page or example-to-other-page imports are allowed. Future test harnesses should either live under the routed page that owns them or be promoted to `projects/hell-docs/src/app/shared/` if more than one lazy route needs them.
