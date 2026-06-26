# ADR: Global hotkey ownership

- Status: Accepted
- Date: 2026-06-03

## Context

Document-level keyboard listeners can steal consuming-app shortcuts, intercept
editable fields, leak after component destroy, or cause multiple Hell instances
to respond to one key.

Current local implementation evidence:

- `packages/angular/internal/hotkeys/hotkeys.ts` centralizes document-level `keydown` and `pointerdown` listener ownership behind Angular `DOCUMENT` injection and caller-provided `DestroyRef` cleanup.
- `HellOmnibar` exposes an optional `hotkey` input. The default is `null`; when configured, it can open the command palette from a document-level shortcut.
- `HellPdfViewer` exposes `globalShortcuts`. The default is `false`; host-level shortcuts still work from the focused viewer without a document listener.
- PDF global shortcuts are scoped to a viewer that has focus, pointer activity, or selection inside it. Omnibar bare shortcuts avoid stealing from other editable targets.

Sources checked:

- Angular CLI MCP was attempted first but failed to connect in this environment with `spawn node ENOENT`.
- Context7 `/websites/angular_dev` confirmed `DestroyRef.onDestroy` registers cleanup callbacks and returns an unregister function, and Angular's `DOCUMENT` token is the DI path for the rendering document.
- Local Angular 21.2.13 package/tests remain the executable source of truth.

## Decision

Keep Hell's global hotkey runtime only as a tiny, opt-in listener owner.

Hell may register a document-level `keydown` listener only when all of these are true:

1. The public component API has an explicit opt-in such as `hotkey` or `globalShortcuts`.
2. The component still has a host/local keyboard path for normal focused interaction when that opt-in is disabled.
3. The listener is registered through `HellGlobalKeydownService`, not by ad hoc `document.addEventListener` calls.
4. The listener is tied to the component `DestroyRef` and unregisters when the opt-in changes or the component is destroyed.
5. The handler ignores `event.defaultPrevented` so an app-level shortcut manager can win by preventing the event earlier.
6. Bare printable shortcuts do not run while focus or event target is another editable control; modifier shortcuts may run only after exact modifier matching.
7. Multi-instance behavior is explicit: independent opt-in instances may register listeners, but the first matching handler that calls `preventDefault()` prevents later Hell handlers from also handling the same cancelable keydown.

This is not permission to grow a global shortcut framework. If Hell needs scopes, priority, rebinding UI, sequences, or collision diagnostics, the consuming app or a dedicated hotkey library should own that policy and Hell components should receive local open/close commands instead.

## Options compared

| Option | Benefits | Costs | Decision |
| --- | --- | --- | --- |
| Delete document-level hotkeys entirely | No library/global shortcut collision risk. | Removes useful command-palette and active PDF viewer convenience. Consumers would need boilerplate for every demo/default setup. | Rejected for now; keep a tiny opt-in seam. |
| Keep the central opt-in service | One SSR-guarded/document-injected owner for listener lifecycle, cleanup, default-prevented handling, and tests. | Hell still owns a small global listener path and must keep it narrow. | Chosen. |
| Add a full hotkey manager | Could solve priorities/collisions in-library. | Turns Hell into an app shortcut framework, expanding surface and policy far beyond component UI. | Rejected. Host apps own global shortcut policy. |
| Delegate to a third-party hotkey library | Mature app-level shortcut features. | Adds dependency and still leaves app-specific priority/collision decisions. | Rejected for Hell internals; recommended for consumers with broad shortcut needs. |

## Consumer contract

- Use local/host keyboard handlers first. Omnibar and PDF viewer keyboard behavior works while the component is focused without global document listeners.
- Opt in only where document-level shortcuts are desired: `hotkey="mod+k"` for `HellOmnibar`, `[globalShortcuts]="true"` for the active PDF viewer.
- If the app has a shortcut manager, let it own collisions. It may call `preventDefault()` before the event reaches Hell, or pass `null` / `false` to Hell inputs and open components through app state.
- Do not configure the same global combo on multiple always-mounted Hell surfaces unless the app accepts first-handler-wins behavior.
- Bare shortcuts such as `/` are for command-palette-style convenience only and must not override typing in other inputs, textareas, selects, or contenteditable regions.

## Consequences

- `HellOmnibar` now registers its document listener only while `hotkey` is non-null.
- `HellGlobalKeydownService` ignores already-prevented keydowns and uses one-shot cleanup for manual unregister and destroy cleanup.
- Unit tests cover opt-in/opt-out listener registration, editable targets, modifier matching, cleanup, app shortcut preemption, and multi-instance isolation.
- `docs/architecture/browser-global-seams.md` owns the broader static
  SSR/browser-safety audit for direct globals outside allowed seams.
