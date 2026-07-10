import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Loaded CI runners (webkit especially) can deactivate the page long enough for
 * the default 5s focus expectations to flake: a dropped page activation both
 * freezes CSS animation clocks (the dialog enter animation's computed opacity
 * sticks just below 1) and makes toBeFocused report "inactive". Focus
 * predicates therefore get extra headroom, mirroring the dialog focus contract.
 */
const FOCUS_SETTLE_TIMEOUT = 10_000;

test.describe('confirm browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/confirm');
    await expect(page.getByRole('heading', { name: 'Confirm', level: 1 })).toBeVisible();
  });

  test('opens a named dialog, focuses confirm, and Escape resolves as cancelled', async ({
    page,
  }) => {
    const example = page.locator('app-confirm-basic-example');
    const trigger = example.getByRole('button', { name: 'Publish article' });

    await ensurePageIsActive(page);
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    // Named by its title and described by its description.
    await expect(dialog).toHaveAttribute('aria-describedby', /\S/);
    const describedBy = (await dialog.getAttribute('aria-describedby')) ?? '';
    await expect(page.locator(`#${cssId(describedBy)}`)).toHaveText(
      'Once published, the article is visible to everyone.',
    );

    const confirm = dialog.getByRole('button', { name: 'Publish', exact: true });
    const cancel = dialog.getByRole('button', { name: 'Cancel' });

    // Default severity focuses confirm; both controls are real, un-pruned tab stops.
    await expectFocused(page, confirm, 'default severity focuses the confirm button');
    await expect(confirm).not.toHaveAttribute('tabindex', '-1');
    await expect(cancel).not.toHaveAttribute('tabindex', '-1');

    // The trap wraps at both edges — focus never escapes to the surrounding document.
    await confirm.focus();
    await page.keyboard.press('Tab');
    await expectFocused(page, cancel, 'forward tab off the last control wraps to the first');
    await page.keyboard.press('Shift+Tab');
    await expectFocused(page, confirm, 'reverse tab off the first control wraps to the last');

    // Escape resolves confirmed:false and restores focus to the opener.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(trigger).toBeFocused({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Publishing cancelled.')).toBeVisible();
  });

  test('danger severity uses the destructive variant and focuses cancel', async ({ page }) => {
    const example = page.locator('app-confirm-danger-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Delete project' }).click();

    const dialog = page.getByRole('dialog', { name: 'Delete this project?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    const confirm = dialog.getByRole('button', { name: 'Delete project' });
    const cancel = dialog.getByRole('button', { name: 'Keep project' });

    await expect(confirm).toHaveAttribute('data-variant', 'danger');
    await expectFocused(page, cancel, 'danger severity focuses the cancel button');

    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Project deleted.')).toBeVisible();
  });

  test('countdown gates the confirm button and never auto-confirms', async ({ page }) => {
    const example = page.locator('app-confirm-countdown-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Reset database' }).click();

    const dialog = page.getByRole('dialog', { name: 'Reset the production database?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    const confirm = dialog.getByRole('button', { name: /Reset now/ });
    await expect(confirm).toBeDisabled();
    await expect(confirm).toContainText('(');

    // The countdown only enables the button; it does not confirm on its own.
    await expect(confirm).toBeEnabled({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(dialog).toBeVisible();
    await expect(example.getByText('Database untouched.')).toBeVisible();

    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Database reset.')).toBeVisible();
  });

  test('projected content state rides back in the result', async ({ page }) => {
    const example = page.locator('app-confirm-content-template-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Delete contact' }).click();

    const dialog = page.getByRole('dialog', { name: 'Delete this contact?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    await dialog.getByLabel('Also delete imported groups').check();
    await dialog.getByRole('button', { name: 'Delete contact' }).click();

    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Contact and imported groups deleted.')).toBeVisible();
  });
});

/**
 * Headless WebKit on a loaded runner can drop page activation, which both
 * freezes CSS animation clocks and makes toBeFocused report "inactive". Bring
 * the page to the front and wait until it is genuinely visible and focused
 * before asserting any focus contract.
 */
async function ensurePageIsActive(page: Page): Promise<void> {
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
        message: 'page should be visible and focused before asserting the focus contract',
        timeout: FOCUS_SETTLE_TIMEOUT,
      },
    )
    .toBe(true);
}

/**
 * Assert that `locator` is the document's active element, re-asserting page
 * activation on every poll so the check reflects the real focus state instead
 * of a deactivated one.
 */
async function expectFocused(page: Page, locator: Locator, message: string): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.bringToFront();
        return locator.evaluate((element) => {
          window.focus();
          return element === document.activeElement;
        });
      },
      { message, timeout: FOCUS_SETTLE_TIMEOUT },
    )
    .toBe(true);
}

/**
 * Finish the dialog's enter animation deterministically. A throttled WebKit
 * page can freeze the animation clock just below full opacity, which wedges
 * focus on <body> instead of letting the trap grab the initial control.
 */
async function settleDialogAnimations(dialog: Locator): Promise<void> {
  await dialog.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      try {
        animation.finish();
      } catch {
        // Infinite animations cannot finish and do not gate settling.
      }
    }
  });
  await expect
    .poll(() => dialog.evaluate((element) => getComputedStyle(element).opacity), {
      timeout: FOCUS_SETTLE_TIMEOUT,
    })
    .toBe('1');
}

function cssId(ids: string): string {
  return ids.trim().split(/\s+/)[0].replace(/([^\w-])/g, '\\$1');
}
