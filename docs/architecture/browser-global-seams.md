# SSR/browser global seams

- Slice: HELL-048
- Enforced by: `npm run test:architecture` (`tools/check-architecture.mjs`, `checkBrowserGlobalContract()`)
- Scope: production TypeScript under `projects/hell/src/lib`; specs, declarations, and the PDF worker file are excluded.

## Rule

Do not reference browser globals directly from library source unless the exact source line is listed below. The static audit parses TypeScript source and reports runtime identifier use of `document`, `window`, `ResizeObserver`, and `IntersectionObserver`; comments, string text, type positions, declaration names, and non-global property names do not count, but template expressions do.

Angular SSR guidance says browser-specific globals such as `document` should not be referenced directly; use `DOCUMENT` for platform-aware document access. Angular render callbacks such as `afterNextRender` run only in the browser, but this package still keeps explicit seams so imports remain safe and browser-only behavior has an owner.

A new direct global must do one of these in the same slice:

1. move behind an existing Angular/DOM seam such as injected `DOCUMENT`, an owner document passed by the caller, or a browser-only render/lifecycle callback;
2. add one narrow allowlist row here with a rationale and owner slice; or
3. create/update a follow-up board slice and mark the row as provisional until the debt is removed.

## Allowed seams

| Seam ID | File | Globals | Owner | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| audio-transcript-window-probe | `projects/hell/src/lib/composites/audio-player/audio-player.runtime.ts` | `window` | HELL-055 | Provisional follow-up | The current speech-transcript runtime probes `SpeechRecognition`/`webkitSpeechRecognition` only after a `typeof window` guard. HELL-055 owns moving transcript runtime behind an explicit optional feature seam. |
| resizable-pane-resize-observer | `projects/hell/src/lib/composites/resizable/resizable.ts` | `ResizeObserver` | HELL-061 | Browser-contract follow-up | Split-pane resize observes rendered panes after view init and disconnects on teardown; HELL-061 owns browser evidence for the kept resize behavior. |
| split-view-resize-observer | `projects/hell/src/lib/composites/split-view/split-view.ts` | `ResizeObserver` | HELL-048 | Accepted component seam | Split-view observes only its rendered host after view init, guards missing `ResizeObserver`, and disconnects through `DestroyRef`; no module-import browser access is allowed. |
| toast-viewport-resize-observer | `projects/hell/src/lib/composites/toast/toast.ts` | `ResizeObserver` | HELL-048 | Accepted component seam | Toast viewport collapse logic needs rendered viewport dimensions, is guarded for non-browser runtimes, and disconnects on destroy. |
| floating-dismissal-document-fallback | `projects/hell/src/lib/core/floating-dismissal.ts` | `document` | HELL-057/HELL-058 | Provisional follow-up | Floating dismissal is a pure controller usable outside Angular DI, so it has a guarded fallback when no owner document is passed. Flyout/omnibar shrink decisions own reducing this seam. |
| floating-scope-resize-observer | `projects/hell/src/lib/core/floating-scope.ts` | `ResizeObserver` | HELL-048 | Accepted core seam | Floating scope is the documented owner for portaled-surface CSS variable sync; it guards observer creation and disconnects listeners/observer on teardown. |
| code-editor-legacy-document-setup | `projects/hell/src/lib/features/code-editor/code-editor.runtime.ts` | `document` | HELL-054 | Provisional follow-up | The deprecated `hellCodeEditorSetup` compatibility constant guards `document` on import and points consumers at `hellCodeEditorSetupFactory(ownerDocument)`. HELL-054 owns keeping CodeMirror client-only and narrow. |
| pdf-adapter-document-fallback | `projects/hell/src/lib/features/pdf-viewer/pdf-viewer.adapter.ts` | `document` | HELL-053 | Provisional follow-up | PDF adapter print/download helpers accept an owner document and fall back only when running in a browser. HELL-053 owns splitting PDF runtime out of the main package. |
| pdf-print-document-fallback | `projects/hell/src/lib/features/pdf-viewer/pdf-viewer.print.ts` | `document` | HELL-053 | Provisional follow-up | Hidden iframe printing accepts a caller document and uses a guarded browser fallback for legacy call sites. HELL-053 owns the PDF package split. |
| pdf-print-cleanup-window | `projects/hell/src/lib/features/pdf-viewer/pdf-viewer.runtime.ts` | `window` | HELL-053 | Provisional follow-up | Print cleanup prefers `ownerDocument.defaultView` and only falls back to guarded `window`; HELL-053 owns isolating this browser-only runtime. |
| pdf-thumbnail-intersection-observer | `projects/hell/src/lib/features/pdf-viewer/pdf-viewer.ts` | `IntersectionObserver` | HELL-053 | Provisional follow-up | Thumbnail lazy rendering is browser-only and currently guarded for missing `IntersectionObserver`; HELL-053 owns the PDF split/package boundary. |
| pdf-wheel-window-height | `projects/hell/src/lib/features/pdf-viewer/pdf-viewer.utils.ts` | `window` | HELL-053 | Provisional follow-up | Page-wheel delta conversion currently reads `window.innerHeight`; HELL-053 owns moving PDF browser utilities out of the main package or replacing the global with an event/view seam. |

## Follow-up ownership

The provisional rows above are not permanent waivers. They map to existing board slices: HELL-053 (PDF split), HELL-054 (CodeMirror optional/client-only boundary), HELL-055 (audio transcript feature seam), HELL-057/HELL-058 (floating dismissal/focus shrink), and HELL-061 (resize browser contracts). If any of those slices changes scope, update this document and the architecture allowlist in the same commit.
