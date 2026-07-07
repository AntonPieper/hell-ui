import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoToggle(page: Page): Promise<void> {
  await page.goto('/components/toggle');
  await expect(page.getByRole('heading', { name: 'Toggle', level: 1 })).toBeVisible();
}

test.describe('toggle browser accessibility contract', () => {
  test('standalone toggle exposes aria-pressed and toggles with Space and Enter', async ({
    page,
  }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-basic-example');
    await expect(example).toBeVisible();
    // The interactive standalone toggle is the first button in the basic
    // example (the disabled sibling is the second, asserted separately below).
    // Its accessible name swaps with pressed state (Mute/Unmute notifications),
    // so hold a state-stable reference by position rather than by name.
    const toggle = example.getByRole('button').first();
    await expect(toggle).toHaveAttribute('type', 'button');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAccessibleName('Mute notifications');
    await expect(example).toContainText('Notify');

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // Model change is observable: label and accessible name flip to the pressed copy.
    await expect(toggle).toHaveAccessibleName('Unmute notifications');
    await expect(example).toContainText('Muted');

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAccessibleName('Mute notifications');
    await expect(example).toContainText('Notify');
  });

  test('disabled standalone toggle exposes disabled semantics', async ({ page }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-basic-example');
    await expect(example).toBeVisible();

    const disabledToggle = example.getByRole('button', { name: 'Disabled' });
    await expect(disabledToggle).toBeDisabled();
    await expect(disabledToggle).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(disabledToggle).toHaveAttribute('tabindex', '-1');
    await expect(disabledToggle).toHaveAttribute('data-disabled', '');
  });

  test('single-select group applies radio semantics with roving arrow focus and Enter/Space activation', async ({
    page,
  }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-group-single-example');
    await expect(example).toBeVisible();
    const group = example.locator('[hellToggleGroup]');
    const left = example.getByRole('radio', { name: 'Align left' });
    const center = example.getByRole('radio', { name: 'Align center' });
    const right = example.getByRole('radio', { name: 'Align right' });

    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('data-type', 'single');
    await expectSelectedItem(left);
    await expectUnselectedItem(center);
    await expectUnselectedItem(right);

    await left.focus();
    await expect(left).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(center).toBeFocused();
    // Roving focus moves without changing selection until the item is activated.
    await expect(center).toHaveAttribute('aria-checked', 'false');
    await expect(left).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Enter');
    await expectSelectedItem(center);
    // Single-select replaces the previous selection.
    await expectUnselectedItem(left);
    await expect(example).toContainText('center');

    await page.keyboard.press('ArrowRight');
    await expect(right).toBeFocused();
    await page.keyboard.press('Space');
    await expectSelectedItem(right);
    await expectUnselectedItem(center);
    await expect(example).toContainText('right');
  });

  test('multiple-select group exposes pressed toggle buttons with independent selections', async ({
    page,
  }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-group-multiple-example');
    await expect(example).toBeVisible();
    const group = example.locator('[hellToggleGroup]');
    const bold = example.getByRole('button', { name: 'B' });
    const italic = example.getByRole('button', { name: 'I' });

    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('data-type', 'multiple');
    await expectPressedItem(bold);
    await expectUnpressedItem(italic);
    // Roving focus still applies in multiple mode.
    await expect(bold).toHaveAttribute('tabindex', '0');
    await expect(italic).toHaveAttribute('tabindex', '-1');

    await bold.focus();
    await page.keyboard.press('ArrowRight');
    await expect(italic).toBeFocused();
    await page.keyboard.press('Enter');

    // Multiple-select keeps both selections instead of replacing.
    await expectPressedItem(italic);
    await expectPressedItem(bold);
    await expect(example).toContainText('bold, italic');
  });
});

async function expectSelectedItem(item: Locator): Promise<void> {
  await expect(item).toHaveAttribute('role', 'radio');
  await expect(item).toHaveAttribute('aria-checked', 'true');
  await expect(item).toHaveAttribute('tabindex', '0');
}

async function expectUnselectedItem(item: Locator): Promise<void> {
  await expect(item).toHaveAttribute('role', 'radio');
  await expect(item).toHaveAttribute('aria-checked', 'false');
  await expect(item).toHaveAttribute('tabindex', '-1');
}

// Multiple-select items are native toggle buttons: no radio role override and
// no aria-checked, with the selection exposed through aria-pressed instead.
async function expectPressedItem(item: Locator): Promise<void> {
  await expect(item).not.toHaveAttribute('role');
  await expect(item).not.toHaveAttribute('aria-checked');
  await expect(item).toHaveAttribute('aria-pressed', 'true');
}

async function expectUnpressedItem(item: Locator): Promise<void> {
  await expect(item).not.toHaveAttribute('role');
  await expect(item).not.toHaveAttribute('aria-checked');
  await expect(item).toHaveAttribute('aria-pressed', 'false');
}
