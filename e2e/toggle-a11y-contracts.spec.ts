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

    const example = page.locator('app-toggle-single-toggle-example');
    const bold = example.getByRole('button', { name: 'B' });
    await expect(bold).toHaveAttribute('type', 'button');
    await expect(bold).toHaveAttribute('aria-pressed', 'false');

    await bold.focus();
    await page.keyboard.press('Space');
    await expect(bold).toBeFocused();
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(example).toContainText('bold=true');

    await page.keyboard.press('Enter');
    await expect(bold).toHaveAttribute('aria-pressed', 'false');
    await expect(example).toContainText('bold=false');
  });

  test('disabled toggle and disabled group expose disabled semantics', async ({ page }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-disabled-example');

    const disabledToggle = example.getByRole('button', { name: 'Disabled' });
    await expect(disabledToggle).toBeDisabled();
    await expect(disabledToggle).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(disabledToggle).toHaveAttribute('tabindex', '-1');
    await expect(disabledToggle).toHaveAttribute('data-disabled', '');

    const group = example.locator('[hellToggleGroup]');
    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('data-type', 'single');
    await expect(group).toHaveAttribute('data-disabled', '');

    const itemA = example.getByRole('radio', { name: 'A' });
    const itemB = example.getByRole('radio', { name: 'B' });
    await expect(itemA).toHaveAttribute('tabindex', '-1');
    await expect(itemB).toHaveAttribute('tabindex', '-1');
    await expect(itemA).toHaveAttribute('aria-checked', 'false');
  });

  test('single-select group applies radio semantics with roving arrow focus and Enter/Space activation', async ({
    page,
  }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-toggle-group-single-example');
    const group = example.locator('[hellToggleGroup]');
    const left = example.getByRole('radio', { name: 'Left' });
    const center = example.getByRole('radio', { name: 'Center' });
    const right = example.getByRole('radio', { name: 'Right' });

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

  test('multiple-select group keeps independent selections across items', async ({ page }) => {
    await gotoToggle(page);

    const example = page.locator('app-toggle-toggle-group-multiple-example');
    const group = example.locator('[hellToggleGroup]');
    const bold = example.getByRole('radio', { name: 'Bold' });
    const italic = example.getByRole('radio', { name: 'Italic' });

    await expect(group).toHaveAttribute('role', 'group');
    await expect(group).toHaveAttribute('data-type', 'multiple');
    await expectSelectedItem(bold);
    await expectUnselectedItem(italic);

    await bold.focus();
    await page.keyboard.press('ArrowRight');
    await expect(italic).toBeFocused();
    await page.keyboard.press('Enter');

    // Multiple-select keeps both selections instead of replacing.
    await expect(italic).toHaveAttribute('aria-checked', 'true');
    await expect(bold).toHaveAttribute('aria-checked', 'true');
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
