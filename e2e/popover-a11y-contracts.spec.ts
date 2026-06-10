import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('popover browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPopoverDocs(page);
  });

  test('opens a named dialog, relates the trigger, and traps focus inside controls', async ({
    page,
  }) => {
    const { trigger } = popoverExample(page);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-describedby', /.+/);

    await trigger.focus();
    await page.keyboard.press('Enter');

    const popover = profilePopover(page);
    await expect(popover).toBeVisible();
    await expect(popover).toHaveAttribute('aria-labelledby', 'profile-popover-title');

    const popoverId = await popover.getAttribute('id');
    expect(popoverId).toEqual(expect.stringMatching(/\S/));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-describedby', popoverId ?? '');

    const message = popover.getByRole('button', { name: 'Message Heinrich' });
    const activity = popover.getByRole('button', { name: 'View activity' });
    await expect(message).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(activity).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(message).toBeFocused();

    await page.keyboard.press('Shift+Tab');
    await expect(activity).toBeFocused();
  });

  test('Escape closes the popover and restores focus to the trigger', async ({ page }) => {
    const { trigger } = popoverExample(page);

    await trigger.click();
    const popover = profilePopover(page);
    const activity = popover.getByRole('button', { name: 'View activity' });
    await expect(popover).toBeVisible();
    await activity.focus();
    await expect(activity).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-describedby', /.+/);
  });

  test('outside pointer interaction closes the popover', async ({ page }) => {
    const { trigger } = popoverExample(page);

    await trigger.click();
    const popover = profilePopover(page);
    await expect(popover).toBeVisible();

    await page.getByRole('heading', { name: 'Popover', level: 1 }).click();

    await expect(popover).toBeHidden();
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
  const example = page.locator('app-popover-example-example');
  return {
    trigger: example.getByRole('button', { name: 'Show profile summary' }),
  };
}

function profilePopover(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Profile summary' });
}
