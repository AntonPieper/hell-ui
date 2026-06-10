import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoOmnibar(page: Page): Promise<void> {
  await page.goto('/components/omnibar');
  await expect(page.getByRole('heading', { name: 'Omnibar', level: 1 })).toBeVisible();
}

function peopleInput(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Search people' });
}

function peopleOption(page: Page, person: number, team: string): Locator {
  return page.getByRole('option', {
    name: new RegExp(`User ${person}\\s+user${person}@example\\.com\\s+${team}`),
  });
}

async function requiredId(locator: Locator, label: string): Promise<string> {
  const id = await locator.getAttribute('id');
  expect(id, `${label} should expose an id for aria-activedescendant`).toBeTruthy();
  return id!;
}

test.describe('omnibar accessibility contract', () => {
  test('global hotkey opens the combobox, skips disabled options, and submits active result', async ({
    page,
  }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('/');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await input.fill('user');
    const user1 = peopleOption(page, 1, 'Design');
    const user2 = peopleOption(page, 2, 'Engineering');
    const user3 = peopleOption(page, 3, 'Support');
    await expect(user1).toBeVisible();
    await expect(user2).toHaveAttribute('aria-disabled', 'true');
    await expect(user2).toBeDisabled();
    await expect(input).toHaveAttribute('aria-activedescendant', await requiredId(user1, 'User 1'));

    await page.keyboard.press('ArrowDown');
    await expect(user2).toHaveAttribute('aria-selected', 'false');
    await expect(user3).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', await requiredId(user3, 'User 3'));

    await page.keyboard.press('Enter');
    await expect(page.getByText('Selected User 3 from Support.')).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });

  test('F6 moves through the action strip without adding tab stops', async ({ page }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await input.fill('user');
    await expect(peopleOption(page, 1, 'Design')).toBeVisible();

    const toolbar = page.getByRole('toolbar', { name: 'People search filters' });
    const filters = toolbar.getByRole('button', { name: 'Filters' });
    const clearSelection = toolbar.getByRole('button', { name: 'Clear selection' });
    await expect(filters).toHaveAttribute('tabindex', '-1');
    await expect(clearSelection).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('F6');
    await expect(filters).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(clearSelection).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(filters).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(filters).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('F6');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('async errors are announced and recover on the next successful query', async ({ page }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await input.fill('error');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('alert')).toHaveText('Search failed. Try again.');
    await expect(input).toBeFocused();

    await input.fill('user1');
    await expect(peopleOption(page, 1, 'Design')).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});
