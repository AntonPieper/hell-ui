import { expect, test, type Locator, type Page } from '@playwright/test';
import { SETTLE_TIMEOUT, ensurePageIsActive, finishPageAnimations } from './utils';

interface TooltipTiming {
  hoverAt?: number;
  shownAt?: number;
  leaveAt?: number;
  hiddenAt?: number;
}

type TooltipTimingWindow = Window & { __tooltipTiming?: TooltipTiming };

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
    // Wall-clock sleeps race the page's 600ms show timer on a loaded runner,
    // and a deactivated headless WebKit page freezes the timer clock
    // entirely, so activate the page first and measure both delays on the
    // page's own clock: trigger mouse events → overlay DOM mutations.
    await ensurePageIsActive(page);

    const triggerName = 'Hover for 600ms';
    const trigger = page.getByRole('button', { name: triggerName });
    const tooltip = page.getByRole('tooltip', { name: 'Took my time' });

    await trigger.evaluate((element) => {
      const timing: TooltipTiming = {};
      (window as TooltipTimingWindow).__tooltipTiming = timing;
      // The tooltip trigger shows on mouseenter and hides on mouseleave, so
      // these listeners observe the instants that start its delay timers.
      element.addEventListener('mouseenter', () => {
        timing.hoverAt ??= performance.now();
      });
      element.addEventListener('mouseleave', () => {
        timing.leaveAt ??= performance.now();
      });
      const observer = new MutationObserver(() => {
        if (document.querySelector('[role="tooltip"]')) {
          timing.shownAt ??= performance.now();
        } else if (timing.shownAt !== undefined) {
          timing.hiddenAt ??= performance.now();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    const readTiming = (): Promise<TooltipTiming> =>
      page.evaluate(() => (window as TooltipTimingWindow).__tooltipTiming ?? {});

    await trigger.hover();
    // Reactivate each attempt so a dropped activation cannot freeze the show
    // timer past the poll timeout.
    await expect
      .poll(
        async () => {
          await page.bringToFront();
          return tooltip.isVisible();
        },
        {
          message: 'tooltip should show after the configured show delay',
          timeout: SETTLE_TIMEOUT,
        },
      )
      .toBe(true);
    await expectDescribedBy(trigger, tooltip);

    const showTiming = await readTiming();
    if (showTiming.hoverAt === undefined || showTiming.shownAt === undefined) {
      throw new Error('Expected instrumented hover and show timestamps.');
    }
    // The 600ms show timer never fires early; the slack only absorbs reduced
    // timer precision in headless browsers.
    expect(showTiming.shownAt - showTiming.hoverAt).toBeGreaterThanOrEqual(590);

    await page.mouse.move(0, 0);
    // Reactivate and finish the exit animation each attempt so neither a
    // frozen hide timer nor a frozen animation clock keeps the tooltip
    // visible past the assertion timeout.
    await expect
      .poll(
        async () => {
          await page.bringToFront();
          await finishPageAnimations(page);
          return tooltip.isHidden();
        },
        {
          message: 'tooltip should hide after the configured hide delay',
          timeout: SETTLE_TIMEOUT,
        },
      )
      .toBe(true);
    await expect(trigger).not.toHaveAttribute('aria-describedby');

    const hideTiming = await readTiming();
    if (hideTiming.leaveAt === undefined || hideTiming.hiddenAt === undefined) {
      throw new Error('Expected instrumented leave and hide timestamps.');
    }
    // Same for the 300ms hide timer: the overlay must have stayed up for the
    // configured delay after the pointer left the trigger.
    expect(hideTiming.hiddenAt - hideTiming.leaveAt).toBeGreaterThanOrEqual(290);
  });

  test('tooltip content is always hoverable and stays open while the pointer is over it', async ({
    page,
  }) => {
    await gotoTooltip(page);

    // A right-placed surface opens beside its trigger, so it can never be
    // occluded by the sticky docs header regardless of scroll position.
    const trigger = page.getByRole('button', { name: 'Right', exact: true });
    const tooltip = page.getByRole('tooltip', { name: "I'm on the right" });

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    // Hoverability is an invariant: no hoverable-content switch, always auto.
    await expect(tooltip).toHaveCSS('pointer-events', 'auto');
    await expectDescribedBy(trigger, tooltip);

    // Settle the entrance animation so the measured box is the final geometry.
    await finishPageAnimations(page);
    const box = await tooltip.boundingBox();
    if (!box) throw new Error('Expected hoverable tooltip to have a layout box.');
    // One pointer event crosses from the trigger onto the surface: the
    // surface's pointerenter precedes the engine's bridge check, so the
    // guaranteed 0ms hide delay never fires mid-crossing.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-describedby', /.+/);

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden({ timeout: 1_000 });
    await expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  test('present content changes update the open tooltip in place and absence closes it', async ({
    page,
  }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Mark one as read' });
    const tooltip = page.getByRole('tooltip', { name: '3 unread notifications' });

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await expectDescribedBy(trigger, tooltip);
    const tooltipId = await tooltip.getAttribute('id');

    // A present-to-present content change re-renders the same open overlay:
    // same tooltip id, no close/reopen lifecycle transition.
    await trigger.click();
    const updated = page.getByRole('tooltip', { name: '2 unread notifications' });
    await expect(updated).toBeVisible();
    await expect(updated).toHaveAttribute('id', tooltipId ?? '');
    await expect(trigger).toHaveAttribute('data-open', '');

    // Draining the count to zero makes the content empty: absent content
    // closes immediately and disables the interaction without a disabled input.
    await trigger.click();
    await trigger.click();
    await expect(page.getByRole('tooltip')).toBeHidden();
    await expect(trigger).not.toHaveAttribute('aria-describedby');

    // Still hovering the trigger: absence keeps the tooltip disabled.
    await page.waitForTimeout(700);
    await expect(page.getByRole('tooltip')).toBeHidden();
  });
});
