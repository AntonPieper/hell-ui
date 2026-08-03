import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  SETTLE_TIMEOUT,
  ensurePageIsActive,
  expectFocused,
  settleEnterAnimation,
} from './utils';

test.describe('popover browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPopoverDocs(page);
  });

  test('opens a named dialog, relates the trigger, and traps focus inside controls', async ({
    page,
    browserName,
  }) => {
    const { trigger } = popoverExample(page);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-describedby', /.+/);

    await ensurePageIsActive(page);
    await trigger.focus();
    await page.keyboard.press('Enter');

    const popover = profilePopover(page);
    await expect(popover).toBeVisible();
    await expect(popover).toHaveAttribute('aria-labelledby', 'assignee-card-name');

    const popoverId = await popover.getAttribute('id');
    expect(popoverId).toEqual(expect.stringMatching(/\S/));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-describedby', popoverId ?? '');

    // A throttled WebKit page can freeze the enter animation's clock just below
    // full opacity, wedging focus on <body>; finish it deterministically before
    // asserting the settled focus trap.
    await settleEnterAnimation(popover);

    const viewProfile = popover.getByRole('button', { name: 'View profile' });
    const reassign = popover.getByRole('button', { name: 'Reassign' });

    // Opening the panel moves focus to the first control.
    await expectFocused(page, viewProfile, 'initial focus lands on the first control');

    // The panel is a real tab-stop cycle: both controls are focusable and
    // neither is pruned from the tab order. This is the property that native
    // forward traversal between the two controls stands in for — asserted on
    // every engine, then exercised as an actual Tab where the engine performs
    // synthetic traversal into the portalled panel (WebKit mirrors Safari's
    // default keyboard-access policy and omits it, so there it is covered by
    // the focusability + edge-wrap guarantees below).
    await expect(viewProfile).not.toHaveAttribute('tabindex', '-1');
    await expect(reassign).not.toHaveAttribute('tabindex', '-1');
    if (browserName !== 'webkit') {
      await page.keyboard.press('Tab');
      await expectFocused(page, reassign, 'forward tab moves to the second control');
    }

    // The trap wraps at both edges — the guarantee that focus is genuinely
    // trapped inside the panel and never escapes to the surrounding document.
    // These transitions are the ones the trap drives explicitly (it calls
    // preventDefault + refocuses), so every engine performs them.
    await reassign.focus();
    await expectFocused(page, reassign, 'focus rests on the last control');
    await page.keyboard.press('Tab');
    await expectFocused(page, viewProfile, 'forward tab off the last control wraps to the first');

    await page.keyboard.press('Shift+Tab');
    await expectFocused(page, reassign, 'reverse tab off the first control wraps to the last');
  });

  test('Escape closes the popover and restores focus to the trigger', async ({ page }) => {
    const { trigger } = popoverExample(page);

    await ensurePageIsActive(page);
    await trigger.click();
    const popover = profilePopover(page);
    const reassign = popover.getByRole('button', { name: 'Reassign' });
    await expect(popover).toBeVisible();
    await settleEnterAnimation(popover);
    await reassign.focus();
    await expect(reassign).toBeFocused({ timeout: SETTLE_TIMEOUT });

    await page.keyboard.press('Escape');

    await expect(popover).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(trigger).toBeFocused({ timeout: SETTLE_TIMEOUT });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-describedby', /.+/);
  });

  test('outside pointer interaction closes the popover', async ({ page }) => {
    const { trigger } = popoverExample(page);

    await trigger.click();
    const popover = profilePopover(page);
    await expect(popover).toBeVisible();

    await page.getByRole('heading', { name: 'Popover', level: 1 }).click();

    await expect(popover).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

async function gotoPopoverDocs(page: Page): Promise<void> {
  await page.goto('/components/popover');
  await expect(page.getByRole('heading', { name: 'Popover', level: 1 })).toBeVisible();
}

function popoverExample(page: Page): {
  trigger: Locator;
} {
  const example = page.locator('app-popover-with-card-example');
  return {
    trigger: example.getByRole('button', { name: 'Assigned to Mara Voss' }),
  };
}

function profilePopover(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Mara Voss' });
}
