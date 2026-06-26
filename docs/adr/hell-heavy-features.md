# ADR: Heavy feature package boundary

- Status: Accepted
- Date: 2026-05-28

## Context

Hell should remain a compact Angular design-system package, not a grab bag of app features. Angular Package Format supports primary and secondary entrypoints for code splitting and special-purpose APIs; Context7 `/websites/angular_dev` confirmed this is the intended APF shape for Angular libraries.

Current local evidence:

- `@hell-ui/angular` root is core-only (`packages/angular/public-api.ts`).
- Package peer metadata is package-wide (`packages/angular/package.json`), so optional feature peers still appear in the main package metadata.
- Package-consumer peer tiers are asserted with strict installs in `tools/check-package-consumer.mjs`.
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
- Existing package-consumer scenarios already prove root/button installs do not need CodeMirror or pdf.js peers.
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
| PDF viewer | `pdf-viewer` package-consumer scenario requires the core group, `tailwindcss`, `@ng-icons/font-awesome`, and exact `pdfjs-dist@5.6.205`; the app supplies a worker source. | `pdfjs-dist` remains an optional peer in `@hell-ui/angular` metadata even though root/button do not install it. PDF runtime owns pdf.js viewer imports, workers, printing, downloads, global quirks, and browser-only assumptions. | Main package drops the pdf.js peer and PDF feature entrypoint; new package owns `pdfjs-dist`, worker docs, package-consumer scenario, and lifecycle risk. | Split to a separate Angular package. |
| CodeMirror | `code-editor` scenario requires the core group, `tailwindcss`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`, and `@lezer/highlight`. Root/button scenarios are asserted to exclude heavy feature peers. | Optional CodeMirror peers remain visible in main metadata, but the feature is a small wrapper over caller-supplied CodeMirror extensions and has an established narrow entrypoint. | Removes CodeMirror peer names from core metadata but adds package overhead for a comparatively narrow editor shell. | Keep as optional entrypoint, guarded by consumer/architecture checks. |
| Audio transcript | `audio-player` and `audio-transcript` package-consumer scenarios prove the base player and opt-in provider peer groups; neither uses CodeMirror or pdf.js peers. Docs/API mark speech transcript experimental; runtime uses `SpeechRecognition`, `webkitSpeechRecognition`, and `HTMLMediaElement.captureStream()` only inside `@hell-ui/angular/features/audio-transcript`. | No extra npm peer impact, and the transcript runtime no longer travels with audio-player/composites unless the provider is imported. | A separate package would be mostly packaging overhead because there is no third-party peer to isolate. | Keep in package behind the explicit optional feature/provider entrypoint. |
| Table shell | Primitive `/table` and TanStack-shell `/table-tanstack` package-consumer scenarios prove the supported paths. | Primitive table styling remains compact business UI. TanStack-owned dynamic table behavior stays behind the TanStack shell path, and TanStack Virtual stays isolated to its optional body strategy. | A separate package is not needed for primitives or the TanStack shell, but package-consumer gates must prove TanStack/Virtual peers do not leak into `/table` or root. | Use `/table` plus `/table-tanstack`; reject unsupported paths before beta. |

Root, core, and button package-consumer scenarios must continue to exclude `@codemirror/*`, `@lezer/highlight`, and `pdfjs-dist`. This is currently asserted by `assertHeavyPeersAreIsolated()` in the package-consumer runner.

## Consequences

- Public beta migration docs must describe the PDF split and the kept optional entrypoints.
- The main package may keep temporary deprecated compatibility entrypoints during alpha/beta migration, but a PDF bridge must delegate to the split package and must not keep `pdfjs-dist` advertised by `@hell-ui/angular`; all temporary bridges need expiry notes.
- Any future feature with package-wide optional peers or browser-only runtime larger than its UI primitive must go through this ADR’s split-vs-keep test before being added to `@hell-ui/angular`.
