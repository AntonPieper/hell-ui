# Runtime Debugging

Read this for browser-only behavior, floating interactions, hotkeys, resize,
PDF, CodeMirror, audio transcript, omnibar, table resize, SSR/global access, or
hard UI bugs.

## Runtime Seams

- Start with `docs/architecture/manual-runtime-ownership.md` for custom runtime
  ownership decisions.
- Floating dismissal: delegate dialog/popover behavior to ng-primitives where it
  owns the contract. Keep the flyout manual adapter and omnibar focus-only rule
  narrow; do not generalize them without reopening the ADR.
- Global hotkeys: only explicit opt-ins use `HellGlobalKeydownService`. Do not
  grow a global shortcut framework.
- Resize behavior: keep the adjacent-pair resize adapter for split panes and
  table resize. Use CDK DragDrop for drag/reorder work, not separator resize.
- Browser globals stay behind `docs/architecture/browser-global-seams.md` and
  the architecture allowlist.
- Direct `document`, `window`, `ResizeObserver`, and `IntersectionObserver`
  usage is exact-line allowlisted by `tools/check-architecture.mjs`.
- Floating behavior has sharp boundaries: Dialog/Popover delegate,
  Flyout is the manual full-dismissal exception, and Omnibar uses CDK overlay
  plus focus-only dismissal.
- Global hotkeys go through `HellGlobalKeydownService`; ng-primitives
  state-channel writes go through
  `packages/angular/internal/ng-primitives/ngp-state-adapters.ts` (combobox,
  radio, and roving-focus only — select uses public ng-primitives setters).
- Current Angular, CDK, ng-primitives, CodeMirror, pdf.js, TanStack,
  Playwright, pnpm, or Vercel facts require the configured docs/MCP path before
  relying on memory.

## Contract-Layer Debugging

Trace the failing contract in this order:

1. Input/model/output state.
2. Host directive or local Hell behavior.
3. Data attributes.
4. CSS variables and token values.
5. Component CSS selector.
6. DOM/a11y result.

Patch the broken layer. Do not mask symptoms with local classes or inline visual
styles.

Completion criterion: debugging is done when the failing layer is named, the
patch targets that layer, and the proof exercises the browser/runtime contract
that failed.
