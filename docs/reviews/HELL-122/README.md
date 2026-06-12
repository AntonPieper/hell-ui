# HELL-122 component polish and regressions

Scope: fix visual and interaction regressions across date picker, pagination, flyout, sliders,
toggle group, app shell, audio player, avatar group, date input, dialpad, omnibar, split view, time
input, and toast stack expansion.

## Five compared design approaches

The visual comparison board is `design/approaches.html`; the captured screenshot is generated as
`design/approaches.png`.

- A. Dense utility: compact, scannable controls for date picker and pagination.
- B. Overlay-first: no layout shift and stronger floating-layer z-order.
- C. Mobile stack: explicit mobile grids and stable vertical control dimensions.
- D. Contrast led: selected/hovered states use meaningful contrast, especially in dark mode.
- E. Keyboard flow: direct keyboard stepping and adjacent navigation for repetitive tasks.

Chosen blend: A for pagination/date geometry, B for flyout/date-input/omnibar, C for audio/app-shell
/slider mobile layout, D for toggle/avatar/toast clarity, and E for dialpad/time/split-view flows.

## Verification targets

- Playwright visual evidence compares baseline and final screenshots.
- Browser assertions cover no flyout layout shift, date cell centering, mobile secondary rail
  interactivity, omnibar menu z-order/icons, date-input unstyled picker wrapper, slider containment,
  audio wrapping, split-view pagination, keyboard-friendly time/dialpad flows, and immediate toast
  expanded measurement.

## Review audit follow-up

The stricter review pass adds `review-audit/` screenshots and reruns the component polish browser
suite against the live docs app:

```bash
HELL_E2E_BASE_URL=http://127.0.0.1:4305 \
HELL_VISUAL_EVIDENCE_DIR=docs/reviews/HELL-122/review-audit \
pnpm --dir projects/hell exec playwright test e2e/component-polish-regressions.spec.ts --project=chromium
```

Additional audited coverage:

- Docs-site secondary sidebar opens on mobile from a topbar info button without reserving a tiny
  right-side rail while closed; the opened secondary body is not inert or `aria-hidden`.
- Audio controls are checked at 390px and 640px so the compact wrapping is proven beyond phone-only
  widths; the compact layout keeps transport, times, mute, and download together before the seek
  and volume rows.
- Avatar overflow hover now uses lift/border affordance only; the focus ring is reserved for
  `:focus-visible`.
- Date-input picker anchoring is checked after removing the padded popover wrapper.
- Omnibar menu layering is checked with `elementFromPoint`, not just numeric z-index.
- A direct Browser API check on the live docs app reported mobile layout `true`, no
  `data-secondary-hidden` after opening, `aria-expanded="true"`, `bodyInert: false`, a 390px main
  content width, and a visible 220px secondary sheet.
- Fresh read-only subagent review covered every listed bullet with visual/DOM evidence; the focused
  app-shell/audio/avatar checks were rerun after clearing stale Angular dev-server cache.
