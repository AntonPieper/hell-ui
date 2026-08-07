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
- Browser globals stay behind injected seams per
  `docs/architecture/browser-global-seams.md`; direct `document`, `window`,
  `ResizeObserver`, and `IntersectionObserver` use is banned by ESLint
  `no-restricted-globals` and escape hatches carry justified inline disables.
- Floating behavior has sharp boundaries: Dialog/Popover delegate,
  Flyout is the manual full-dismissal exception, and Omnibar uses CDK overlay
  plus focus-only dismissal.
- Global hotkeys go through `HellGlobalKeydownService`; ng-primitives
  state-channel writes go through
  `packages/angular/internal/ng-primitives/ngp-state-adapters.ts` (combobox
  only — select, radio, and roving-focus use public ng-primitives setters:
  `setValue(value, { emit: false })`/`setDisabled` and `setTabStop(id)`).
- A host ARIA attribute that flaps or refuses to hold a bound value is usually
  an ng-primitives `attrBinding` render-effect writer beating an Angular host
  binding (0.128+). Hell's deliberate contract differences are re-asserted
  through `packages/angular/internal/ng-primitives/ngp-attr-ownership.ts`
  (decision record: `docs/adr/ngp-attribute-ownership.md`; version-bound, call
  sites allowlisted by the `ngp-attr-ownership-seam` architecture check).
  Never add a competing host binding — either feed the upstream input/config
  or extend the seam.
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
