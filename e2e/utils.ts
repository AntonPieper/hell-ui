import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Loaded CI runners (webkit especially) can deactivate the page long enough
 * for 5s focus and style expectations to flake, so settle predicates get
 * extra headroom.
 */
export const SETTLE_TIMEOUT = 10_000;

/**
 * Headless WebKit on a loaded runner can drop page activation, which freezes
 * CSS animation clocks and page timers, stops hover repaints, and makes
 * toBeFocused report "inactive". Poll activation back before asserting
 * activation-sensitive behavior.
 */
export async function ensurePageIsActive(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.bringToFront();
        return page.evaluate(() => {
          window.focus();
          return document.visibilityState === 'visible' && document.hasFocus();
        });
      },
      {
        message: 'page should be visible and focused before activation-sensitive assertions',
        timeout: SETTLE_TIMEOUT,
      },
    )
    .toBe(true);
}

/**
 * A throttled WebKit page can freeze a CSS animation or transition clock
 * mid-flight, so finish running animations deterministically instead of
 * waiting for a possibly-frozen timeline to reach the final frame on its own.
 */
export async function finishAnimations(locator: Locator): Promise<void> {
  await locator.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      try {
        animation.finish();
      } catch {
        // Infinite animations cannot finish and do not gate settling.
      }
    }
  });
}

/**
 * Document-wide variant of finishAnimations for elements that may detach
 * mid-transition (e.g. overlays animating out).
 */
export async function finishPageAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {
        // Infinite animations cannot finish and do not gate settling.
      }
    }
  });
}
