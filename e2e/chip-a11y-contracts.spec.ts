import { expect, test, type Page } from '@playwright/test';

async function gotoChip(page: Page): Promise<void> {
  await page.goto('/components/chip');
  await expect(page.getByRole('heading', { name: 'Chip', level: 1 })).toBeVisible();
}

test.describe('chip browser accessibility contract', () => {
  test('chip collection has one roving tab stop with arrow, Home, and End focus', async ({
    page,
  }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    await expect(example).toBeVisible();
    const set = example.locator('[hellChipSet]');
    const chips = example.locator('[hellChip]');

    await expect(set).toHaveAttribute('role', 'group');
    await expect(set).toHaveAttribute('aria-labelledby', 'assigned-people-label');
    await expect(chips).toHaveCount(4);

    // Exactly one chip is in the tab order.
    await expect(chips.nth(0)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '-1');
    await expect(chips.nth(2)).toHaveAttribute('tabindex', '-1');
    await expect(chips.nth(3)).toHaveAttribute('tabindex', '-1');

    await chips.nth(0).focus();
    await expect(chips.nth(0)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(chips.nth(1)).toBeFocused();
    await expect(chips.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(chips.nth(0)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('End');
    await expect(chips.nth(3)).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(chips.nth(2)).toBeFocused();

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
    await expect(example.getByRole('button', { name: 'Remove Dana Wu' })).toHaveCount(0);
  });

  test('Delete removes the focused chip and moves focus to the next chip', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');

    await chips.nth(0).focus();
    await expect(chips.nth(0)).toContainText('Anna Fischer');
    await page.keyboard.press('Delete');

    await expect(chips).toHaveCount(3);
    await expect(example.getByText('Anna Fischer')).toHaveCount(0);
    // Focus continuity: the next chip in order takes focus.
    await expect(chips.nth(0)).toBeFocused();
    await expect(chips.nth(0)).toContainText('Ben Weber');
  });

  test('empty-input Backspace focuses the final removable chip and removal keeps roving order', async ({
    page,
  }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('textbox', { name: 'Add assignee' });

    await input.focus();
    await page.keyboard.press('Backspace');

    // The first Backspace only transfers focus; it does not mutate the collection.
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(2)).toContainText('Cara Lang');
    await expect(chips.nth(2)).toBeFocused();

    await page.keyboard.press('Backspace');

    await expect(chips).toHaveCount(3);
    await expect(example.getByText('Cara Lang')).toHaveCount(0);
    await expect(chips.nth(2)).toContainText('Dana Wu');
    await expect(chips.nth(2)).toBeFocused();
  });

  test('mixed removable and enabled boundaries preserve roving order and input exit', async ({
    page,
  }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('textbox', { name: 'Add assignee' });

    await input.focus();
    await page.keyboard.press('Backspace');
    await expect(chips.nth(2)).toContainText('Cara Lang');
    await expect(chips.nth(2)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(chips.nth(3)).toContainText('Dana Wu');
    await expect(chips.nth(3)).toBeFocused();

    const modifiedWasPrevented = await chips.nth(3).evaluate((chip) => {
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        altKey: true,
        bubbles: true,
        cancelable: true,
      });
      chip.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(modifiedWasPrevented).toBe(false);
    await expect(chips.nth(3)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(input).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(chips.nth(3)).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(input).toBeFocused();
  });

  test('removing a true final removable chip returns focus to the input', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');
    const input = example.getByRole('textbox', { name: 'Add assignee' });

    await input.fill('Eli Park');
    await input.press('Enter');
    await expect(chips).toHaveCount(5);
    await expect(chips.nth(4)).toContainText('Eli Park');
    await expect(input).toHaveValue('');

    await input.press('Backspace');
    await expect(chips.nth(4)).toBeFocused();

    await page.keyboard.press('Backspace');
    await expect(chips).toHaveCount(4);
    await expect(example.getByText('Eli Park')).toHaveCount(0);
    await expect(input).toBeFocused();
  });

  test('clicking a remove button removes its chip', async ({ page }) => {
    await gotoChip(page);

    const example = page.locator('app-chip-basic-example');
    const chips = example.locator('[hellChip]');

    await example.getByRole('button', { name: 'Remove Ben Weber' }).click();
    await expect(chips).toHaveCount(3);
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
