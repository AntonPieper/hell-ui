import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoCombobox(page: Page): Promise<Locator> {
  await page.goto('/components/combobox');
  await expect(page.getByRole('heading', { name: 'Combobox', level: 1 })).toBeVisible();
  const example = page.locator('app-combobox-chips-example');
  await expect(example).toBeVisible();
  return example;
}

test.describe('combobox chips presentation accessibility contract', () => {
  test('renders a removable chip per selected value labelled through the chip Label Contract', async ({
    page,
  }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');

    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toContainText('Dispatch');
    await expect(chips.nth(1)).toContainText('On-call');
    await expect(example.getByRole('button', { name: 'Remove Dispatch' })).toBeVisible();
    await expect(example.getByRole('button', { name: 'Remove On-call' })).toBeVisible();
  });

  test('chip remove button removes the value and keeps option selection state coherent', async ({
    page,
  }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });

    // Before removal the selected option announces itself as selected.
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Dispatch' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Escape');

    await example.getByRole('button', { name: 'Remove Dispatch' }).click();
    await expect(chips).toHaveCount(1);
    await expect(chips.nth(0)).toContainText('On-call');
    await expect(example.getByRole('button', { name: 'Remove Dispatch' })).toHaveCount(0);

    // After removal the option no longer announces selection; the survivor still does.
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Dispatch' })).not.toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('option', { name: 'On-call' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('chips form one tab stop with roving focus and keyboard removal', async ({ page }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });
    const removeButtons = example.locator('button[hellChipRemove]');

    await expect(chips.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(removeButtons.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(removeButtons.nth(1)).toHaveAttribute('tabindex', '-1');

    // The input follows the chips in DOM order, so Shift+Tab enters the chip
    // collection at its single roving tab stop rather than its nested buttons.
    await input.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(chips.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(chips.nth(1)).toBeFocused();

    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(1);
    await expect(chips.nth(0)).toContainText('Dispatch');
    await expect(chips.nth(0)).toBeFocused();

    await page.keyboard.press('Delete');
    await expect(chips).toHaveCount(0);
    await expect(example.locator('[hellComboboxChips]')).toBeFocused();
  });

  test('Backspace in the empty input removes the last selection', async ({ page }) => {
    const example = await gotoCombobox(page);
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('combobox', { name: 'Assign groups' });

    await expect(chips).toHaveCount(2);
    await input.focus();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Backspace');

    await expect(chips).toHaveCount(1);
    await expect(chips.nth(0)).toContainText('Dispatch');
    await expect(example.getByRole('button', { name: 'Remove On-call' })).toHaveCount(0);

    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(0);
  });
});
