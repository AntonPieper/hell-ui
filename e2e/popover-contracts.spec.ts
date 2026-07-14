import { expect, test, type Page } from '@playwright/test';

async function gotoPopover(page: Page): Promise<void> {
  await page.goto('/components/popover');
  await expect(page.getByRole('heading', { name: 'Popover', level: 1 })).toBeVisible();
}

function nonModalExample(page: Page) {
  return page.locator('app-popover-non-modal-example');
}

test.describe('Popover browser contract', () => {
  test('modal popover traps focus and restores it to the trigger on Escape', async ({ page }) => {
    await gotoPopover(page);
    const trigger = page
      .locator('app-popover-basic-example')
      .getByRole('button', { name: 'What is this status?' });

    await trigger.click();
    const panel = page.locator('[hellPopover]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-focus-trap', '');
    await expect(panel).not.toHaveAttribute('aria-modal', 'false');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('non-modal popover keeps focus on the trigger and skips the trap', async ({ page }) => {
    await gotoPopover(page);
    const root = nonModalExample(page);
    const trigger = root.getByRole('button', { name: 'Playback volume' });

    await trigger.click();
    const panel = page.locator('[hellPopover]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-modal', 'false');
    await expect(panel).not.toHaveAttribute('data-focus-trap', '');
    // No initial focus steal: focus never moves into the panel. (WebKit blurs
    // buttons on mouse click, so assert on the panel rather than the trigger.)
    const focusInsidePanel = await panel.evaluate((element) =>
      element.contains(element.ownerDocument.activeElement),
    );
    expect(focusInsidePanel).toBe(false);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('boundary interactions keep a non-modal popover open while outside clicks close it without stealing focus', async ({
    page,
  }) => {
    await gotoPopover(page);
    const root = nonModalExample(page);
    const trigger = root.getByRole('button', { name: 'Playback volume' });
    const skip = root.getByRole('button', { name: /Skip/ });

    await trigger.click();
    const panel = page.locator('[hellPopover]');
    await expect(panel).toBeVisible();

    // The sibling control inside the boundary stays interactive and does not dismiss.
    await skip.click();
    await expect(skip).toContainText('Skip (1)');
    await expect(panel).toBeVisible();

    // An outside click closes the panel without yanking focus back to the trigger.
    await page.getByRole('heading', { name: 'Non-modal' }).click();
    await expect(panel).toBeHidden();
    await expect(trigger).not.toBeFocused();
  });

  test('non-modal popover closes when focus moves outside', async ({ page }) => {
    await gotoPopover(page);
    const root = nonModalExample(page);
    const trigger = root.getByRole('button', { name: 'Playback volume' });

    await trigger.focus();
    await trigger.click();
    const panel = page.locator('[hellPopover]');
    await expect(panel).toBeVisible();

    // Tab past the boundary's controls until focus leaves the inside region.
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(panel).toBeHidden();
  });
});
