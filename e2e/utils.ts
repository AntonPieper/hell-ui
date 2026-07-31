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

/**
 * Assert focus with settle headroom, and attach a focus-state dump to the
 * failure so a CI-only miss says where focus actually went.
 */
export async function expectFocused(page: Page, locator: Locator, label: string): Promise<void> {
  try {
    await expect(locator, label).toBeFocused({ timeout: SETTLE_TIMEOUT });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\n\n${await collectFocusDiagnostics(page)}`, { cause: error });
  }
}

export async function collectFocusDiagnostics(page: Page): Promise<string> {
  const [documentState, focusedPath, ariaSnapshot] = await Promise.all([
    page
      .evaluate(
        () => `visibilityState=${document.visibilityState} hasFocus=${document.hasFocus()}`,
      )
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
    focusedElementPath(page),
    page
      .locator('body')
      .ariaSnapshot()
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
  ]);

  return `Document state: ${documentState}\n\nFocused element path:\n${focusedPath}\n\nAccessibility tree:\n${ariaSnapshot}`;
}

async function focusedElementPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return '<none>';

    const parts: string[] = [];
    let current: Element | null = active;

    while (current) {
      const element = current;
      const tag = element.tagName.toLowerCase();
      const attributes = ['id', 'role', 'aria-label', 'data-hell-dialog-trigger']
        .map((name) => [name, element.getAttribute(name)] as const)
        .filter(([, value]) => value !== null && value !== '')
        .map(([name, value]) => `[${name}="${value}"]`)
        .join('');
      const text = ['button', 'a'].includes(tag)
        ? (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
        : '';
      parts.unshift(`${tag}${attributes}${text ? ` "${text}"` : ''}`);
      current = element.parentElement;
    }

    return parts.join(' > ');
  });
}
