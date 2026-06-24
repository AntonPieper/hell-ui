# HELL-131 Button Part Style Map Visual Review

Date: 2026-06-24

## Scope

Reviewed the docs `/components/button` route after migrating `HellButton` from the legacy `hell-button` host class / `unstyled` opt-out path to the Part Style Map `ui.root` API. Also checked `/components/split-view` because its selected master row relies on Button color hooks.

## Tooling

Captured evidence with Playwright against the local docs server at `http://127.0.0.1:4321`.

## Evidence

- `button-desktop-full.png`: desktop full-page capture from the top of the Button docs route.
- `button-desktop-part-style-map-region.png`: desktop close crop of the new Part style map section.
- `button-mobile-full.png`: mobile full-page capture from the top of the Button docs route.
- `button-mobile-part-style-map-region.png`: mobile close crop of the new Part style map section.
- `split-view-desktop-master-detail-region.png`: desktop crop of the Split View master/detail example with the selected master item.
- `visual-metrics.json`: Playwright console/page-error results plus computed metrics for the customization example buttons and selected Split View master item.

## UX Judgement

Pass. The new Part style map section fits between the Block and API sections without layout overlap on desktop or mobile. The custom buttons render visible root-part refinements, preserve `data-slot="root"`, and do not receive the legacy `hell-button` class.

The Split View selected master item also passes the compatibility check: it uses the CSS-variable ghost Button recipe, computes to `rgb(238, 240, 243)` background, `rgb(49, 58, 70)` foreground, and `rgb(227, 230, 236)` border, and does not receive the legacy `hell-button` class. Playwright recorded no console errors or page errors.

## Validation

- `pnpm run build:lib`
- `pnpm run build:docs`
- `pnpm run diagnose:docs-bundle`
- `HELL_PACKAGE_CONSUMER_SCENARIOS=button-ui,button pnpm run test:package-consumer -- --minimal-deps`
- Playwright visual capture against `http://127.0.0.1:4321/components/button` and `/components/split-view`
