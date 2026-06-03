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
| audio-transcript-window-probe | `projects/hell/src/lib/features/audio-transcript/audio-transcript.ts` | `window` | HELL-055 | Accepted optional feature seam | The speech-transcript provider probes `SpeechRecognition`/`webkitSpeechRecognition` only after a `typeof window` guard and is imported from `@hell-ui/angular/features/audio-transcript`, not the base audio-player/composites paths. |
| resizable-pane-resize-observer | `projects/hell/src/lib/composites/resizable/resizable.ts` | `ResizeObserver` | HELL-061 | Browser-contract follow-up | Split-pane resize observes rendered panes after view init and disconnects on teardown; HELL-061 owns browser evidence for the kept resize behavior. |
| split-view-resize-observer | `projects/hell/src/lib/composites/split-view/split-view.ts` | `ResizeObserver` | HELL-048 | Accepted component seam | Split-view observes only its rendered host after view init, guards missing `ResizeObserver`, and disconnects through `DestroyRef`; no module-import browser access is allowed. |
| toast-viewport-resize-observer | `projects/hell/src/lib/composites/toast/toast.ts` | `ResizeObserver` | HELL-048 | Accepted component seam | Toast viewport collapse logic needs rendered viewport dimensions, is guarded for non-browser runtimes, and disconnects on destroy. |
| floating-dismissal-document-fallback | `projects/hell/src/lib/core/floating-dismissal.ts` | `document` | HELL-057 | Accepted flyout/core fallback | Floating dismissal is a pure controller usable outside Angular DI, so it has a guarded fallback when no owner document is passed. HELL-057 accepts this for the named flyout manual adapter; HELL-058 removed omnibar's direct full interaction-controller usage and passes an owner document for its focus-only rule. |
| floating-scope-resize-observer | `projects/hell/src/lib/core/floating-scope.ts` | `ResizeObserver` | HELL-048 | Accepted core seam | Floating scope is the documented owner for portaled-surface CSS variable sync; it guards observer creation and disconnects listeners/observer on teardown. |
| code-editor-legacy-document-setup | `projects/hell/src/lib/features/code-editor/code-editor.runtime.ts` | `document` | HELL-054 | Provisional follow-up | The deprecated `hellCodeEditorSetup` compatibility constant guards `document` on import and points consumers at `hellCodeEditorSetupFactory(ownerDocument)`. HELL-054 owns keeping CodeMirror client-only and narrow. |

## Follow-up ownership

The provisional rows above are not permanent waivers. They map to existing board slices: HELL-054 (CodeMirror optional/client-only boundary) and HELL-061 (resize browser contracts). HELL-053 moved PDF browser globals out of the main `@hell-ui/angular` package into `@hell-ui/pdf-viewer`; HELL-055 moved audio transcript globals into the optional transcript feature provider; HELL-057 accepted the remaining flyout/core floating-dismissal fallback; HELL-058 shrank omnibar to a focus-only owner-document rule. Those feature/package seams own their browser-only runtime separately. If any of those slices changes scope, update this document and the architecture allowlist in the same commit.
