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
 * Assert that `locator` is the document's active element, and nothing else is.
 *
 * `toBeFocused` reports "inactive" (never matching) whenever the page has lost
 * OS-level activation, which headless WebKit on a loaded runner does mid Tab
 * sequence. Re-assert activation on every poll so the check reflects the real
 * focus state instead of the deactivated one.
 *
 * The predicate resolves to a description of whatever actually holds focus
 * rather than a bare boolean, so a failure names the offending element instead
 * of only reporting `false`.
 */
export async function expectFocused(
  page: Page,
  locator: Locator,
  message: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.bringToFront();
        return locator.evaluate((element) => {
          window.focus();
          const active = document.activeElement;
          if (element === active) return 'expected';
          if (!(active instanceof HTMLElement)) return String(active);
          return `${active.tagName.toLowerCase()}#${active.id || '(no-id)'}`;
        });
      },
      { message, timeout: SETTLE_TIMEOUT },
    )
    .toBe('expected');
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
 * Settle an overlay's enter animation before asserting a focus contract.
 *
 * A throttled WebKit page can freeze the enter animation's clock just below
 * full opacity, which wedges focus on `<body>` instead of letting the focus
 * trap grab the initial control. Drive the timeline to its final frame, then
 * confirm the panel really reached full opacity rather than trusting that
 * finishing the animations was enough.
 */
export async function settleEnterAnimation(overlay: Locator): Promise<void> {
  await finishAnimations(overlay);
  await expect
    .poll(() => overlay.evaluate((element) => getComputedStyle(element).opacity), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe('1');
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
