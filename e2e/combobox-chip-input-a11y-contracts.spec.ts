import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoCombobox(page: Page): Promise<Locator> {
  await page.goto('/components/combobox');
  await expect(page.getByRole('heading', { name: 'Combobox', level: 1 })).toBeVisible();
  const example = page.locator('app-combobox-chips-example');
  await expect(example).toBeVisible();
  return example;
}

test.describe('Combobox with public Chip Input accessibility contract', () => {
  test('projects one labelled, removable chip per selected domain object', async ({ page }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');

    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toContainText('Dispatch');
    await expect(chips.nth(1)).toContainText('On-call');
    await expect(example.getByRole('button', { name: 'Remove Dispatch' })).toBeVisible();
    await expect(example.getByRole('button', { name: 'Remove On-call' })).toBeVisible();
    await expect(example.locator('[hellChipSet]')).toHaveAttribute('aria-label', 'Assigned groups');
  });

  test('consumer-owned removal and Combobox option selection stay coherent', async ({ page }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });

    await input.focus();
    await input.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Dispatch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await input.press('Escape');

    await example.getByRole('button', { name: 'Remove Dispatch' }).click();
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toContainText('On-call');

    await input.focus();
    await input.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Dispatch' })).not.toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('option', { name: 'On-call' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('Chip Set owns one roving tab stop and returns final-removal focus to Chip Input', async ({
    page,
  }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });
    const removeButtons = example.locator('button[hellChipRemove]');

    await expect(chips.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(removeButtons.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(removeButtons.nth(1)).toHaveAttribute('tabindex', '-1');

    await input.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(chips.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(chips.nth(1)).toBeFocused();

    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toContainText('Dispatch');
    await expect(input).toBeFocused();

    await input.press('Backspace');
    await expect(chips.first()).toBeFocused();
    await page.keyboard.press('Delete');
    await expect(chips).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test('empty-input Backspace focuses before it removes', async ({ page }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });

    await input.focus();
    await input.press('Escape');
    await input.press('Backspace');

    await expect(chips).toHaveCount(2);
    await expect(chips.nth(1)).toContainText('On-call');
    await expect(chips.nth(1)).toBeFocused();

    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toContainText('Dispatch');
    await expect(input).toBeFocused();

    await input.press('Backspace');
    await expect(chips.first()).toBeFocused();
    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(0);
    await expect(input).toBeFocused();
  });
});
