# ADR: Heavy feature package boundary

- Status: Accepted; amended 2026-07-08 (PDF viewer split reversed) and
  2026-07-20 (package and stylesheet surface)
- Date: 2026-05-28

## Amendment (2026-07-20)

`0002-public-package-and-stylesheet-surface.md` renames the target package to
`hell-ui` without a compatibility package. References below to
`@hell-ui/angular` describe the package identity at the time of the original
decision and its 2026-07-08 amendment.

Feature isolation now applies to CSS as well as TypeScript and peers. Code
Editor, PDF Viewer, TanStack integrations, and future heavy or optional
stylesheets are excluded from `hell-ui/styles.css` and remain explicit
entrypoint imports. The earlier root/core/primitives/composites wording names
architectural roles, not TypeScript category barrels. Any allowance below for a
temporary feature bridge does not authorize a compatibility package for the
package rename.

## Amendment (2026-07-08)

Decision 2 is reversed: the PDF viewer moved back into the main package as the
optional feature entry point `@hell-ui/angular/features/pdf-viewer`, using the
same boundary as CodeMirror. Running the split produced a full second release
train (build, pack audit, provenance, GHPR mirror, consumer scenario, exact
`@hell-ui/angular` version peer) whose ongoing cost outweighed the one benefit
of keeping `pdfjs-dist` out of the main package metadata — the same trade
already accepted for the CodeMirror peers. `pdfjs-dist` is now an optional peer
of `@hell-ui/angular`, pinned to the workspace catalog version, and package
consumer scenarios still prove root/core/button installs never need it.

## Context

Hell should remain a compact Angular design-system package, not a grab bag of app features. Angular Package Format supports primary and secondary entrypoints for code splitting and special-purpose APIs; Context7 `/websites/angular_dev` confirmed this is the intended APF shape for Angular libraries.

Current local evidence:

- `@hell-ui/angular` root is core-only (`packages/angular/public-api.ts`).
- Package peer metadata is package-wide (`packages/angular/package.json`), so optional feature peers still appear in the main package metadata.
- Package-consumer peer groups are asserted with strict installs by the checked-in fixtures in `tools/consumer-fixtures/` (`tools/check-consumer-fixtures.mjs`).
- `audio-player` is exported by the composites aggregate and narrow `@hell-ui/angular/audio-player` entrypoint; the speech transcript path has no npm peer but does carry Web Speech / media-capture runtime risk. That runtime is isolated behind `@hell-ui/angular/features/audio-transcript` and `provideHellAudioTranscript()`.

## Decision

Use a hybrid boundary:

1. Keep `@hell-ui/angular` root/core/primitives/composites light.
2. Split the PDF viewer out of `@hell-ui/angular` into a separate Angular package before public beta.
3. Keep CodeMirror as an in-package optional feature entrypoint: `@hell-ui/angular/features/code-editor`.
4. Use exactly two table paths: `@hell-ui/angular/table` for primitives and `@hell-ui/angular/table-tanstack` for a Hell-styled shell around a caller-owned TanStack `Table<T>`. Remove `@hell-ui/angular/data-table`, separate virtual table entrypoints, and CDK table skins before beta because there are no consumers yet.
5. Keep the base audio player in package, but isolate speech transcript behind an explicit optional feature/adapter entrypoint so normal audio-player/composite consumers do not load or own the Web Speech runtime.

## Options compared

### Keep heavy features as optional entrypoints in `@hell-ui/angular`

Benefits:

- One npm package and release train.
- APF secondary entrypoints preserve narrow imports and code splitting.
- Existing consumer fixtures already prove root/button installs do not need CodeMirror or pdf.js peers.
- Works well for small business-UI features whose dependencies are just the core/style stack.

Costs:

- Optional peers are still visible in `@hell-ui/angular` package metadata, so the compact package looks heavier than the runtime import graph.
- Browser-only lifecycle hazards stay tied to the main package reputation.
- Docs and release checks must keep feature examples lazy and peer tables precise.

### Split features into separate packages

Benefits:

- Main package metadata and package-consumer peer groups lose the split feature peer entirely.
- Release, docs, and compatibility risk can be owned by the feature package.
- Browser-only workers/global runtime quirks stop defining the core library boundary.

Costs:

- More package build, publish, provenance, and consumer-migration work.
- Cross-package style/tokens/docs links need new checks.
- Temporary compatibility entrypoints can create a second migration surface.

## Consumer install and peer impact

| Feature | Current consumer evidence | Keep-in-package impact | Split-package impact | Decision |
| --- | --- | --- | --- | --- |
| PDF viewer | The `pdf-viewer` consumer fixture requires the core group, `tailwindcss`, `@ng-icons/font-awesome`, and exact `pdfjs-dist@5.6.205`; the app supplies a worker source. | `pdfjs-dist` remains an optional peer in `@hell-ui/angular` metadata even though root/button do not install it. PDF runtime owns pdf.js viewer imports, workers, printing, downloads, global quirks, and browser-only assumptions. | Main package drops the pdf.js peer and PDF feature entrypoint; new package owns `pdfjs-dist`, worker docs, consumer fixture, and lifecycle risk. | Split to a separate Angular package. |
| CodeMirror | `code-editor` scenario requires the core group, `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. Root/button scenarios are asserted to exclude heavy feature peers. | Optional CodeMirror peers remain visible in main metadata, but the feature is a small wrapper over caller-supplied CodeMirror extensions and has an established narrow entrypoint. | Removes CodeMirror peer names from core metadata but adds package overhead for a comparatively narrow editor shell. | Keep as optional entrypoint, guarded by consumer/architecture checks. |
| Audio transcript | The `icon-audio` consumer fixture proves the base player and opt-in provider peer group; it uses no CodeMirror or pdf.js peers. Docs/API mark speech transcript experimental; runtime uses `SpeechRecognition`, `webkitSpeechRecognition`, and `HTMLMediaElement.captureStream()` only inside `@hell-ui/angular/features/audio-transcript`. | No extra npm peer impact, and the transcript runtime no longer travels with audio-player/composites unless the provider is imported. | A separate package would be mostly packaging overhead because there is no third-party peer to isolate. | Keep in package behind the explicit optional feature/provider entrypoint. |
| Table shell | The `styled-controls` (primitive `/table`) and TanStack-shell `table-tanstack` consumer fixtures prove the supported paths. | Primitive table styling remains compact business UI. TanStack-owned dynamic table behavior stays behind the TanStack shell path, and TanStack Virtual stays isolated to its optional body strategy. | A separate package is not needed for primitives or the TanStack shell, but package-consumer gates must prove TanStack/Virtual peers do not leak into `/table` or root. | Use `/table` plus `/table-tanstack`; reject unsupported paths before beta. |

The foundation and styled consumer fixtures must continue to exclude `@codemirror/*`, `@lezer/highlight`, and `pdfjs-dist`. This is currently asserted by the `forbiddenDependencies` manifests of the checked-in fixtures in `tools/consumer-fixtures/`.

## Consequences

- Public beta migration docs must describe the PDF split and the kept optional entrypoints.
- The main package may keep temporary deprecated compatibility entrypoints during alpha/beta migration, but a PDF bridge must delegate to the split package and must not keep `pdfjs-dist` advertised by `@hell-ui/angular`; all temporary bridges need expiry notes.
- Any future feature with package-wide optional peers or browser-only runtime larger than its UI primitive must go through this ADR’s split-vs-keep test before being added to `@hell-ui/angular`.
