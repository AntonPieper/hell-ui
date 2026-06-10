import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoCheckbox(page: Page): Promise<void> {
  await page.goto('/components/checkbox');
  await expect(page.getByRole('heading', { name: 'Checkbox', level: 1 })).toBeVisible();
}

test.describe('checkbox browser accessibility contract', () => {
  test('custom checkbox exposes required, disabled, mixed, and keyboard state', async ({
    page,
  }) => {
    await gotoCheckbox(page);

    const example = page.locator('app-checkbox-examples-example');
    await expect(example).toBeVisible();

    const required = example.getByRole('checkbox', { name: 'I agree to the terms' });
    await expect(required).toHaveAttribute('type', 'button');
    await expect(required).toHaveAttribute('role', 'checkbox');
    await expect(required).toHaveAttribute('required', '');
    await expect(required).toHaveAttribute('aria-required', 'true');
    await expect(required).toHaveAttribute('aria-checked', 'false');

    await required.focus();
    await page.keyboard.press('Enter');
    await expect(required).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Space');
    await expect(required).toHaveAttribute('aria-checked', 'true');
    await expect(required).toBeFocused();
    await expect(example).toContainText('Current value: true');

    const mixed = example.getByRole('checkbox', { name: 'Indeterminate' });
    await expect(mixed).toHaveAttribute('aria-checked', 'mixed');
    await expect(mixed).toHaveAttribute('data-indeterminate', '');
    await mixed.focus();
    await page.keyboard.press('Space');
    await expect(mixed).toHaveAttribute('aria-checked', 'true');
    await expect(mixed).not.toHaveAttribute('data-indeterminate');

    const disabled = example.getByRole('checkbox', { name: 'Disabled', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await expect(disabled).toHaveAttribute('aria-checked', 'false');

    const disabledChecked = example.getByRole('checkbox', { name: 'Disabled, checked' });
    await expect(disabledChecked).toBeDisabled();
    await expect(disabledChecked).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledChecked).toHaveAttribute('aria-checked', 'true');
  });

  test('native checkbox keeps browser required validity and indeterminate state', async ({
    page,
  }) => {
    await gotoCheckbox(page);

    const nativeExample = page.locator('app-checkbox-native-example');
    await expect(nativeExample).toBeVisible();

    const native = nativeExample.getByRole('checkbox', { name: 'Accept terms' });
    const nativeInput = nativeExample.locator('input[hellNativeCheckbox]');
    await expect(native).toHaveAttribute('type', 'checkbox');
    await expect(native).toHaveAttribute('required', '');
    await expect(native).toHaveAttribute('aria-required', 'true');
    await expect(native).toHaveJSProperty('indeterminate', true);
    await expect(native).not.toBeChecked();
    await expect.poll(() => valueMissing(nativeInput)).toBe(true);

    await native.focus();
    await page.keyboard.press('Space');
    await expect(native).toBeChecked();
    await expect(native).toHaveJSProperty('indeterminate', false);
    await expect.poll(() => valueMissing(nativeInput)).toBe(false);
    await expect(nativeExample).toContainText('State: checked');

    await page.keyboard.press('Space');
    await expect(native).not.toBeChecked();
    await expect(native).toHaveJSProperty('indeterminate', false);
    await expect.poll(() => valueMissing(nativeInput)).toBe(true);
    await expect(nativeExample).toContainText('State: unchecked');
  });
});

async function valueMissing(locator: Locator): Promise<boolean> {
  return locator.evaluate((node) => {
    if (!(node instanceof HTMLInputElement)) {
      throw new Error('Expected native checkbox input.');
    }

    return node.validity.valueMissing;
  });
}
