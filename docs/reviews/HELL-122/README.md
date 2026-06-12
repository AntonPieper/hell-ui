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
