import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoTooltip(page: Page): Promise<void> {
  await page.goto('/components/tooltip');
  await expect(page.getByRole('heading', { name: 'Tooltip', level: 1 })).toBeVisible();
}

async function expectDescribedBy(trigger: Locator, tooltip: Locator): Promise<void> {
  await expect(tooltip).toHaveAttribute('role', 'tooltip');
  await expect(tooltip).toHaveAttribute('id', /.+/);

  const tooltipId = await tooltip.getAttribute('id');
  if (!tooltipId) throw new Error('Tooltip must expose a non-empty id.');

  await expect(trigger).toHaveAttribute('aria-describedby', tooltipId);
}

/**
 * Stamps a baseline on the page's own clock, taken BEFORE the pointer action
 * that arms a tooltip show/hide timer. Because the baseline is captured before
 * the interaction, any elapsed time measured against it is a conservative upper
 * bound on the true delay — so a starved renderer can only inflate, never
 * shrink, the observed value, keeping the "honors the delay" lower bounds sound.
 */
async function armPageClock(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as { __hellClockBaseline: number }).__hellClockBaseline =
      performance.now();
  });
}

/**
 * Waits — entirely inside the page's own event loop — for the named trigger's
 * `data-open` state to reach `targetOpen`, and returns the delay in ms measured
 * from the baseline stamped by {@link armPageClock}. Both the elapsed time and
 * the open-state observation share the renderer's clock, so the measurement is
 * immune to the wall-clock drift that pushes `page.waitForTimeout` out of step
 * with the tooltip's internal timers under concurrent load. Returns Infinity if
 * the transition never happens within `budgetMs`.
 */
async function awaitOpenStateMs(
  page: Page,
  triggerText: string,
  targetOpen: boolean,
  budgetMs: number,
): Promise<number> {
  return page.evaluate(
    async ({ triggerText, targetOpen, budgetMs }) => {
      const baseline = (window as unknown as { __hellClockBaseline: number })
        .__hellClockBaseline;
      const trigger = [...document.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === triggerText,
      );
      if (!trigger) throw new Error(`Trigger "${triggerText}" not found.`);
      const isOpen = () => trigger.hasAttribute('data-open');
      while (isOpen() !== targetOpen) {
        if (performance.now() - baseline > budgetMs) return Number.POSITIVE_INFINITY;
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      }
      return performance.now() - baseline;
    },
    { triggerText, targetOpen, budgetMs },
  );
}

test.describe('tooltip browser accessibility contract', () => {
  test('focus opens a described tooltip and Escape closes it', async ({ page }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Top' });
    const tooltip = page.getByRole('tooltip', { name: "I'm on top" });

    await trigger.focus();
    await expect(trigger).toBeFocused();
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute('data-open', '');
    await expectDescribedBy(trigger, tooltip);

    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(trigger).not.toHaveAttribute('aria-describedby');
    await expect(trigger).not.toHaveAttribute('data-open');
    await expect(trigger).toBeFocused();
  });

  test('hover respects configured show and hide delays', async ({ page }) => {
    await gotoTooltip(page);

    const triggerName = 'Hover for 600ms';
    const trigger = page.getByRole('button', { name: triggerName });
    const tooltip = page.getByRole('tooltip', { name: 'Took my time' });

    // Show delay is 600ms: the tooltip must not open eagerly. Measure the
    // hover→open latency in the page's own clock so a starved renderer cannot
    // drift the observation out of step with the internal show timer.
    await armPageClock(page);
    await trigger.hover();
    const showDelayMs = await awaitOpenStateMs(page, triggerName, true, 5_000);
    // Honors the delay (not eager: never open before the 300ms mark) and still
    // opens well within budget (finite, not stuck hidden forever).
    expect(showDelayMs).toBeGreaterThanOrEqual(300);
    expect(showDelayMs).toBeLessThan(5_000);
    await expect(tooltip).toBeVisible();
    await expectDescribedBy(trigger, tooltip);

    // Hide delay is 300ms: after the pointer leaves the tooltip stays open
    // briefly before closing. Measure the leave→close latency the same way.
    await armPageClock(page);
    await page.mouse.move(0, 0);
    const hideDelayMs = await awaitOpenStateMs(page, triggerName, false, 5_000);
    // Honors the delay (stays open past the 150ms mark) and does close in budget.
    expect(hideDelayMs).toBeGreaterThanOrEqual(150);
    expect(hideDelayMs).toBeLessThan(5_000);
    await expect(tooltip).toBeHidden();
    await expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  test('hoverable tooltip content stays open while the pointer is over the tooltip', async ({
    page,
  }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Hoverable' });
    const tooltip = page.getByRole('tooltip', {
      name: 'Stays open while you hover this hint.',
    });

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute('data-hoverable', '');
    await expect(tooltip).toHaveCSS('pointer-events', 'auto');
    await expectDescribedBy(trigger, tooltip);

    const box = await tooltip.boundingBox();
    if (!box) throw new Error('Expected hoverable tooltip to have a layout box.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await page.waitForTimeout(300);
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-describedby', /.+/);

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden({ timeout: 1_000 });
    await expect(trigger).not.toHaveAttribute('aria-describedby');
  });
});
