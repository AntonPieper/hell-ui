# HELL-121 Toast Stack Visual Review

Date: 2026-06-10

## Scope

Reviewed the docs `/components/toast` route after implementing scrollable expanded toast stacks, built-in dismiss-all, viewport edge scaling/fade, collapse/reset behavior, and docs examples for long persistent bursts. This review refresh covers the reopened visual regression where expanded cards initially overlapped, collapsed scroll reset flashed, and the dismiss-all X looked struck through.

## Tooling Note

Initial visual evidence was captured with Playwright CLI screenshots against the local docs server on `http://127.0.0.1:4302/components/toast`. A final Playwright MCP pass on 2026-06-10 then exercised the live route directly: click `Send 8 toasts`, hover the notification region, scroll the viewport, collapse by hovering outside the stack, and click `Dismiss all`.

Before final verification, the meta worktree was fast-forward pulled through `e6543a9`, `projects/hell` was updated through `4fa2cf5`, and the HELL-121 stashes were reapplied cleanly with no merge conflicts.

## Evidence

- `toast-desktop-expanded-full.png`: desktop page with expanded bottom-right stack and dismiss-all control.
- `toast-desktop-expanded-region.png`: close crop of the default bottom/newest scroll origin.
- `toast-desktop-scrolled-top-region.png`: close crop after scrolling to older toasts.
- `toast-desktop-collapse-transition-region.png`: close crop during the collapse transition after mouse exit.
- `toast-desktop-collapsed-reset.png`: stack after pointer exit, collapsed back to newest edge.
- `toast-mobile-expanded-full.png`: mobile viewport with expanded stack and dismiss-all control.
- `toast-mobile-expanded-region.png`: mobile close crop of scrollable stack.
- `visual-metrics.json`: Playwright metrics for scroll position, toast gaps, and dismiss-all icon rendering.

## UX Judgement

Pass. The dismiss-all action is discoverable only while the stack is intentionally expanded, which avoids cluttering the normal compact notification state. The expanded viewport now has enough backing surface that docs text does not bleed through the card gaps, and the edge cards fade/scale without hiding reachable content. The refreshed metrics record a `12.3px` minimum expanded toast gap at both scroll origins, `scrollTop: 0` during collapse and after reset, one dismiss-all SVG path, and `text-decoration: none`.

Playwright MCP live metrics matched the tracked artifacts: expanded `scrollHeight` 596 / `clientHeight` 420 with `scrollTop` 176 at the newest origin, `scrollbar-width: thin` while hovered, `minGap: 12.3`, `pathCount: 1`, and `textDecorationLine: none`. After scrolling to older toasts, MCP still reported `minGap: 12.3` with smooth edge-progress values. After pointer exit, MCP reported `expanded: null`, `scrollTop: 0`, `clientHeight: 64`, `scrollHeight: 64`; after clicking `Dismiss all`, MCP reported `toastCount: 0` and no notification region.

Scrollbar decision: keep a styled scrollbar affordance for accessibility and discoverability, hidden while idle and enabled on hover/focus. On macOS overlay scrollbars may not appear in static screenshots, but the CSS path is explicit for hover/focus and the behavior test verifies the viewport is scrollable.

Fresh-context review result: no blocking UX, accessibility, or stack-math findings. HELL-121 is ready to commit.

## Validation

Rerun after the clean pull on 2026-06-10:

- `pnpm exec prettier --check ...toast files...`
- `pnpm exec vitest run projects/hell/src/lib/composites/toast/toast.spec.ts --coverage=false`
- `pnpm run lint`
- `pnpm run test:api-report`
- `pnpm run test:architecture`
- `pnpm run test:ci-contract`
- `env PLAYWRIGHT_PORT=4302 pnpm exec playwright test e2e/ui-behavior.spec.ts --project=chromium --grep toast --reporter=list --output=/private/tmp/hell-toast-playwright-output`
- `pnpm run build:lib`
- `pnpm run build:docs` (existing accepted initial-bundle warning; no budget regression)
