import { expect, test, type Page } from '@playwright/test';

async function gotoChip(page: Page): Promise<void> {
  await page.goto('/components/chip');
  await expect(page.getByRole('heading', { name: 'Chip', level: 1 })).toBeVisible();
}

test.describe('chip browser accessibility contract', () => {
  test('chip set is a single tab stop with roving arrow, Home, and End focus', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    await expect(example).toBeVisible();
    const set = example.locator('[hellChipSet]');
    const chips = example.locator('[hellChip]');

    await expect(set).toHaveAttribute('role', 'group');
    await expect(set).toHaveAttribute('aria-label', 'Assigned people');
    await expect(chips).toHaveCount(3);

    // Exactly one chip is in the tab order.
    await expect(chips.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(chips.nth(2)).toHaveAttribute('tabindex', '-1');

    await chips.nth(0).focus();
    await expect(chips.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(chips.nth(1)).toBeFocused();
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('End');
    await expect(chips.nth(2)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(chips.nth(1)).toBeFocused();

    await page.keyboard.press('Home');
    await expect(chips.nth(0)).toBeFocused();
  });

  test('remove buttons are labelled through the Label Contract and stay out of the tab order', async ({
    page,
  }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const removeAnna = example.getByRole('button', { name: 'Remove Anna Fischer' });
    await expect(removeAnna).toBeVisible();
    await expect(removeAnna).toHaveAttribute('type', 'button');
    await expect(removeAnna).toHaveAttribute('tabindex', '-1');
    await expect(example.getByRole('button', { name: 'Remove Ben Weber' })).toBeVisible();
    await expect(example.getByRole('button', { name: 'Remove Cara Lang' })).toBeVisible();
  });

  test('Delete removes the focused chip and moves focus to the next chip', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');

    await chips.nth(0).focus();
    await expect(chips.nth(0)).toContainText('Anna Fischer');
    await page.keyboard.press('Delete');

    await expect(chips).toHaveCount(2);
    await expect(example.getByText('Anna Fischer')).toHaveCount(0);
    // Focus continuity: the next chip in order takes focus.
    await expect(chips.nth(0)).toBeFocused();
    await expect(chips.nth(0)).toContainText('Ben Weber');
  });

  test('Backspace removes the last chip and falls back to the previous chip', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');

    await chips.nth(2).focus();
    await expect(chips.nth(2)).toContainText('Cara Lang');
    await page.keyboard.press('Backspace');

    await expect(chips).toHaveCount(2);
    await expect(example.getByText('Cara Lang')).toHaveCount(0);
    // Focus falls back to the previous chip.
    await expect(chips.nth(1)).toBeFocused();
    await expect(chips.nth(1)).toContainText('Ben Weber');
  });

  test('clicking a remove button removes its chip', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');

    await example.getByRole('button', { name: 'Remove Ben Weber' }).click();
    await expect(chips).toHaveCount(2);
    await expect(example.getByText('Ben Weber')).toHaveCount(0);
  });

  test('interactive semantics attach only to interactive hosts', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-clickable-example');
    await expect(example).toBeVisible();

    const pill = example.getByRole('button', { name: /Filters/ });
    await expect(pill).toHaveAttribute('type', 'button');
    await expect(pill).toHaveAttribute('data-interactive', '');
    await pill.click();
    await expect(pill).toContainText('Filters: off');

    const link = example.getByRole('link', { name: '+49 30 123456' });
    await expect(link).toHaveAttribute('href', /#chip-clickable$/);
    await expect(link).toHaveAttribute('data-interactive', '');
  });

  test('a disabled chip disables its remove button and is skipped by roving focus', async ({
    page,
  }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-disabled-example');
    await expect(example).toBeVisible();
    const chips = example.locator('[hellChip]');

    const disabledChip = chips.nth(1);
    await expect(disabledChip).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledChip).toHaveAttribute('data-disabled', '');
    await expect(example.getByRole('button', { name: 'Remove Read only' })).toBeDisabled();

    const enabledChip = chips.nth(0);
    await enabledChip.focus();
    await page.keyboard.press('ArrowRight');
    // No enabled chip follows, so focus stays put and never lands on the disabled chip.
    await expect(enabledChip).toBeFocused();
  });
});
