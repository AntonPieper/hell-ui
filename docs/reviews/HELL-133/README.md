# HELL-133 Part Style Map Gates Visual Review

Date: 2026-06-25

## Scope

Reviewed the docs `/components/date-input` and `/components/time-input` routes after changing the internal Input primitive `data-slot` host contract from composite-owned field slots back to the primitive root part.

Reviewed `/components/toggle`, `/components/split-view`, and `/components/pagination` after replacing the public legacy `--hell-button-*` compatibility hooks with private helper variables used only by not-yet-migrated legacy `.hell-button` consumers.

## Tooling

Captured evidence with Playwright against the local docs server at `http://127.0.0.1:4301`. The pass checked desktop `1280x900` and mobile `390x844` viewports, full-page screenshots, focused input crops, broader example-region crops, console messages, DOM slot values, and computed CSS custom property values on legacy helper buttons.

## Evidence

- `visuals/date-input-desktop-full.png`: desktop full-page capture for Date input.
- `visuals/date-input-desktop-region.png`: desktop close region for the affected Date input example.
- `visuals/date-input-desktop-focus.png`: desktop crop around the first Date input field.
- `visuals/date-input-mobile-full.png`: mobile full-page capture for Date input.
- `visuals/date-input-mobile-region.png`: mobile close region for the affected Date input example.
- `visuals/date-input-mobile-focus.png`: mobile crop around the first Date input field.
- `visuals/time-input-desktop-full.png`: desktop full-page capture for Time input.
- `visuals/time-input-desktop-region.png`: desktop close region for the affected Time input example.
- `visuals/time-input-desktop-focus.png`: desktop crop around the first Time input field.
- `visuals/time-input-mobile-full.png`: mobile full-page capture for Time input.
- `visuals/time-input-mobile-region.png`: mobile close region for the affected Time input example.
- `visuals/time-input-mobile-focus.png`: mobile crop around the first Time input field.
- `visuals/playwright-summary.json`: Playwright DOM/assertion summary and console warning capture.
- `visuals/toggle-desktop-full.png` and `visuals/toggle-mobile-full.png`: full-page Toggle captures.
- `visuals/toggle-desktop-region.png` and `visuals/toggle-mobile-region.png`: Toggle group crops proving the legacy helper still renders segmented controls.
- `visuals/split-view-desktop-full.png` and `visuals/split-view-mobile-full.png`: full-page Split View captures.
- `visuals/split-view-desktop-region.png` and `visuals/split-view-mobile-region.png`: Split View example crops proving selected/navigation controls still render.
- `visuals/pagination-desktop-full.png` and `visuals/pagination-mobile-full.png`: full-page Pagination captures.
- `visuals/pagination-desktop-region.png` and `visuals/pagination-mobile-region.png`: Pagination control crops proving legacy helper buttons still render.
- `visuals/hell-133-css-helper-visual-summary.json`: computed-style summary for the legacy helper CSS pass.

## UX Judgement

Pass. The full-page screenshots render nonblank and coherent at desktop and mobile widths. The affected Date input and Time input examples keep helper text, invalid states, disabled states, icons, and control geometry intact without overlap or clipping. The Toggle, Split View, and Pagination captures show the legacy `.hell-button` consumers still render with visible backgrounds, borders, selected/current states, and readable text after the public `--hell-button-*` hooks were removed.

## Console And DOM Notes

Playwright found no console errors and no page errors. It recorded the existing Angular duplicate component ID warning for `_HellIcon` on icon-backed routes. The DOM assertion confirmed every internal `input[hellinput]` on the reviewed Date/Time pages had `data-slot="root"` and no `input[hellinput][data-slot="field"]` remained.

The computed-style pass sampled legacy helper buttons on Toggle, Split View, and Pagination. Every sampled `.hell-button` had private `--_hell-btn-*` values and no sampled button exposed a public `--hell-button-background` value. The reviewed pages reported no horizontal document overflow at either viewport.

## Validation

- `pnpm run build:docs`
- Playwright visual capture against `http://127.0.0.1:4301/components/date-input`
- Playwright visual capture against `http://127.0.0.1:4301/components/time-input`
- Playwright visual capture against `http://127.0.0.1:4301/components/toggle`
- Playwright visual capture against `http://127.0.0.1:4301/components/split-view`
- Playwright visual capture against `http://127.0.0.1:4301/components/pagination`
