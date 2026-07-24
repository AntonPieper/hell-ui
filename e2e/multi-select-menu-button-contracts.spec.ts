import { expect, test, type Page } from '@playwright/test';

const STORAGE_KEY = 'hell-docs.people-table.column-visibility.v1';

// The multi-select menu button recipe lives on the Menu docs page (#347).
async function gotoMultiSelect(page: Page): Promise<void> {
  await page.goto('/components/menu');
  await expect(
    page.getByRole('heading', { name: 'Multi-select menu button', level: 2 }),
  ).toBeVisible();
}

// The recipe persists column visibility to localStorage, so start each recipe
// test from a cleared, reloaded page for a deterministic all-columns-visible state.
async function gotoRecipeClean(page: Page): Promise<void> {
  await gotoMultiSelect(page);
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Multi-select menu button', level: 2 }),
  ).toBeVisible();
}

test.describe('multi-select menu button recipe browser contract', () => {
  test('exposes projected checkbox rows, keeps the menu open, and reflects caller state', async ({
    page,
  }) => {
    await gotoMultiSelect(page);

    const example = page.locator('app-menu-multi-select-example');
    const trigger = example.getByRole('button', { name: 'Channels' });
    const menu = page.getByRole('menu', { name: 'Channels' });

    // Nothing is emitted on first render; the trigger reflects the controlled state.
    await expect(trigger).toHaveAttribute('data-selection-count', '2');
    await expect(trigger).toHaveAttribute('data-has-selection', '');
    await expect(example.locator('[data-slot="count"]')).toHaveText('2');
    await expect(example.locator('strong')).toHaveText('Email, Push');

    await trigger.click();
    await expect(menu).toBeVisible();

    // Each domain row is a menuitemcheckbox with a projected checked indicator.
    const email = page.getByRole('menuitemcheckbox', { name: 'Email' });
    const sms = page.getByRole('menuitemcheckbox', { name: 'SMS' });
    const push = page.getByRole('menuitemcheckbox', { name: 'Push' });
    const webhook = page.getByRole('menuitemcheckbox', { name: 'Webhook' });
    await expect(email).toHaveAttribute('aria-checked', 'true');
    await expect(email.locator('[hellMenuItemIndicator]')).toHaveAttribute('data-checked', '');
    await expect(push).toHaveAttribute('aria-checked', 'true');
    await expect(sms).toHaveAttribute('aria-checked', 'false');

    // Caller-owned collection logic adds the row; the menu stays open.
    await sms.click();
    await expect(menu).toBeVisible();
    await expect(sms).toHaveAttribute('aria-checked', 'true');
    await expect(trigger).toHaveAttribute('data-selection-count', '3');
    await expect(example.locator('strong')).toHaveText('Email, Push, SMS');

    // Caller-owned collection logic removes the row; the menu is still open.
    await email.click();
    await expect(menu).toBeVisible();
    await expect(email).toHaveAttribute('aria-checked', 'false');
    await expect(trigger).toHaveAttribute('data-selection-count', '2');
    await expect(example.locator('strong')).toHaveText('Push, SMS');

    // A disabled option is inert.
    await expect(webhook).toBeDisabled();
    await expect(webhook).toHaveAttribute('aria-checked', 'false');
  });

  test('enforces the minSelected floor while still allowing additions', async ({ page }) => {
    await gotoMultiSelect(page);

    const example = page.locator('app-menu-multi-select-example');
    const trigger = example.getByRole('button', { name: 'Channels' });
    const menu = page.getByRole('menu', { name: 'Channels' });

    await trigger.click();
    await expect(menu).toBeVisible();

    const email = page.getByRole('menuitemcheckbox', { name: 'Email' });
    const sms = page.getByRole('menuitemcheckbox', { name: 'SMS' });
    const push = page.getByRole('menuitemcheckbox', { name: 'Push' });

    // Drop to the floor of one selected option.
    await email.click();
    await expect(trigger).toHaveAttribute('data-selection-count', '1');

    // At the floor (minSelected=1) the last selected option disables itself.
    await expect(push).toBeDisabled();
    await expect(email).toBeEnabled();

    // Additions are still allowed; once above the floor, deselection reopens.
    await sms.click();
    await expect(trigger).toHaveAttribute('data-selection-count', '2');
    await expect(push).toBeEnabled();
  });

  test('typeahead focuses an option, reset emits distinctly, and Escape closes', async ({ page }) => {
    await gotoMultiSelect(page);

    const example = page.locator('app-menu-multi-select-example');
    const trigger = example.getByRole('button', { name: 'Channels' });
    const menu = page.getByRole('menu', { name: 'Channels' });

    await trigger.click();
    await expect(menu).toBeVisible();

    // The composed menu's typeahead moves focus without changing selection.
    const sms = page.getByRole('menuitemcheckbox', { name: 'SMS' });
    await page.keyboard.press('s');
    await expect(sms).toBeFocused();
    await expect(trigger).toHaveAttribute('data-selection-count', '2');

    // Change the selection away from the defaults.
    await sms.click();
    await expect(trigger).toHaveAttribute('data-selection-count', '3');

    // The reset item restores the consumer's own defaults.
    await page.getByRole('menuitem', { name: 'Reset to default' }).click();
    await expect(trigger).toHaveAttribute('data-selection-count', '2');
    await expect(example.locator('strong')).toHaveText('Email, Push');

    // Outside interaction dismisses the menu.
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.getByRole('heading', { name: 'Multi-select menu button', level: 2 }).click();
    await expect(menu).toBeHidden();

    // Escape closes the menu and returns focus to the trigger.
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('recipe: binds TanStack column visibility, respects enableHiding, and shows/hides real columns', async ({
    page,
  }) => {
    await gotoRecipeClean(page);

    const example = page.locator('app-menu-tanstack-columns-example');
    const trigger = example.getByRole('button', { name: 'Columns' });
    const menu = page.getByRole('menu', { name: 'Columns' });

    // Every column starts visible.
    for (const name of ['Name', 'Role', 'Status', 'Team', 'Email']) {
      await expect(example.getByRole('columnheader', { name })).toBeVisible();
    }
    await expect(trigger).toHaveAttribute('data-selection-count', '4');

    await trigger.click();
    await expect(menu).toBeVisible();

    // The non-hideable identity column (enableHiding: false) is not offered.
    await expect(page.getByRole('menuitemcheckbox', { name: 'Name' })).toHaveCount(0);
    await expect(page.getByRole('menuitemcheckbox', { name: 'Email' })).toBeVisible();

    // Hiding a column removes its header from the real table; the menu stays open.
    await page.getByRole('menuitemcheckbox', { name: 'Email' }).click();
    await expect(menu).toBeVisible();
    await expect(example.getByRole('columnheader', { name: 'Email' })).toHaveCount(0);
    await expect(trigger).toHaveAttribute('data-selection-count', '3');

    // Showing it again brings the column back.
    const email = page.getByRole('menuitemcheckbox', { name: 'Email' });
    await email.click();
    await expect(example.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(trigger).toHaveAttribute('data-selection-count', '4');

    // The floor is caller-owned and disables only the last visible hideable column.
    for (const name of ['Role', 'Status', 'Team']) {
      await page.getByRole('menuitemcheckbox', { name }).click();
      await expect(example.getByRole('columnheader', { name })).toHaveCount(0);
    }
    await expect(email).toBeDisabled();
    await expect(trigger).toHaveAttribute('data-selection-count', '1');

    // Reset is an ordinary menu item routed back through TanStack state.
    await page.getByRole('menuitem', { name: 'Reset to default' }).click();
    await expect(menu).toBeHidden();
    for (const name of ['Name', 'Role', 'Status', 'Team', 'Email']) {
      await expect(example.getByRole('columnheader', { name })).toBeVisible();
    }
    await expect(trigger).toHaveAttribute('data-selection-count', '4');
  });

  test('recipe: persists column visibility across reloads via localStorage', async ({ page }) => {
    await gotoRecipeClean(page);

    const example = page.locator('app-menu-tanstack-columns-example');
    const trigger = example.getByRole('button', { name: 'Columns' });

    await trigger.click();
    await page.getByRole('menuitemcheckbox', { name: 'Email' }).click();
    await expect(example.getByRole('columnheader', { name: 'Email' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    // The hidden column survives a full reload — persistence is the app's, not the control's.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Multi-select menu button', level: 2 }),
    ).toBeVisible();
    await expect(example.getByRole('columnheader', { name: 'Email' })).toHaveCount(0);
    await expect(trigger).toHaveAttribute('data-selection-count', '3');

    // Clean up so a rerun starts fresh.
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  });
});
