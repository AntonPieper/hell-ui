# SSR/browser global seams

- Enforced by: `pnpm run test:architecture`
  (`tools/check-architecture.mjs`, `checkBrowserGlobalContract()`)
- Scope: production TypeScript under `packages/angular`; specs,
  declarations, and the PDF worker file are excluded.

## Rule

Do not reference browser globals directly from library source unless the exact
source line is listed below. The static audit parses TypeScript source and
reports runtime identifier use of `document`, `window`, `ResizeObserver`, and
`IntersectionObserver`; comments, string text, type positions, declaration
names, and non-global property names do not count, but template expressions do.

Angular SSR guidance says browser-specific globals such as `document` should
not be referenced directly; use `DOCUMENT` for platform-aware document access.
Angular render callbacks such as `afterNextRender` run only in the browser, but
this package still keeps explicit seams so imports remain safe and browser-only
behavior has a clear contract.

A new direct global must do one of these in the same change:

1. Move behind an existing Angular/DOM seam such as injected `DOCUMENT`, an
   owner document passed by the caller, or a browser-only render/lifecycle
   callback.
2. Add one narrow allowlist row here with a rationale.
3. Create a tracked follow-up if the row is provisional.

## Allowed Seams

| Seam ID | File | Globals | Status | Rationale |
| --- | --- | --- | --- | --- |
| audio-transcript-window-probe | `packages/angular/features/audio-transcript/audio-transcript.ts` | `window` | Accepted optional feature seam | The speech-transcript provider probes `SpeechRecognition`/`webkitSpeechRecognition` only after a `typeof window` guard and is imported from `@hell-ui/angular/features/audio-transcript`, not the base audio-player/composites paths. |
| resizable-pane-resize-observer | `packages/angular/resizable/resizable.ts` | `ResizeObserver` | Browser-contract follow-up | Split-pane resize observes rendered panes after view init and disconnects on teardown; the kept resize behavior still needs current browser evidence before production-ready language. |
| split-view-resize-observer | `packages/angular/split-view/split-view.ts` | `ResizeObserver` | Accepted component seam | Split-view observes only its rendered host after view init, guards missing `ResizeObserver`, and disconnects through `DestroyRef`; no module-import browser access is allowed. |
| toast-viewport-resize-observer | `packages/angular/toast/toast.ts` | `ResizeObserver` | Accepted component seam | Toast viewport collapse logic needs rendered viewport dimensions, is guarded for non-browser runtimes, and disconnects on destroy. |
| floating-dismissal-document-fallback | `packages/angular/internal/core/floating-dismissal.ts` | `document` | Accepted flyout/internal fallback | Floating dismissal is a pure controller usable outside Angular DI, so it has a guarded fallback when no owner document is passed. Omnibar passes an owner document for its focus-only rule. |
| floating-scope-resize-observer | `packages/angular/internal/core/floating-scope.ts` | `ResizeObserver` | Accepted internal seam | Floating scope is the documented owner for portaled-surface CSS variable sync; it guards observer creation and disconnects listeners/observer on teardown. |
| pdf-adapter-owner-document-fallback | `packages/angular/features/pdf-viewer/pdf-viewer.adapter.ts` | `document` | Accepted optional feature seam | The pdf.js adapter prefers a caller-supplied owner document and only falls back to the global after a `typeof document` guard; the feature entry point is browser-only by contract. |
| pdf-print-owner-document-fallback | `packages/angular/features/pdf-viewer/pdf-viewer.print.ts` | `document` | Accepted optional feature seam | Print sessions prefer a caller-supplied owner document and only fall back to the global after a `typeof document` guard. |
| pdf-runtime-cleanup-window-fallback | `packages/angular/features/pdf-viewer/pdf-viewer.runtime.ts` | `window` | Accepted optional feature seam | Print cleanup scheduling prefers the owner document's `defaultView` and only falls back to the global after a `typeof window` guard. |
| pdf-thumbs-intersection-observer | `packages/angular/features/pdf-viewer/pdf-viewer.ts` | `IntersectionObserver` | Accepted optional feature seam | Thumbnail rendering lazily observes visible canvases, falls back to microtask rendering when the observer is missing, and disconnects on close/destroy. |
| pdf-wheel-page-delta-window | `packages/angular/features/pdf-viewer/pdf-viewer.utils.ts` | `window` | Accepted optional feature seam | Wheel page-delta math runs only inside a browser `WheelEvent` handler and reads `window.innerHeight` for `DOM_DELTA_PAGE` normalization. |

Provisional rows are not permanent waivers. If a seam changes scope, update
this document and the architecture allowlist in the same commit.
