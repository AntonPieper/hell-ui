import { expect, test, type Page } from '@playwright/test';

async function gotoSwitch(page: Page): Promise<void> {
  await page.goto('/components/switch');
  await expect(page.getByRole('heading', { name: 'Switch', level: 1 })).toBeVisible();
}

test.describe('switch browser accessibility contract', () => {
  test('custom switches expose visible names, checked state, keyboard, and disabled state', async ({
    page,
  }) => {
    await gotoSwitch(page);

    const example = page.locator('app-switch-examples-example');
    await expect(example).toBeVisible();
    await expect(example.getByRole('switch')).toHaveCount(3);

    const notifications = example.getByRole('switch', { name: 'Email notifications' });
    await expect(notifications).toHaveAttribute('type', 'button');
    await expect(notifications).toHaveAttribute('role', 'switch');
    await expect(notifications).toHaveAttribute('aria-checked', 'true');

    await example.getByText('Email notifications', { exact: true }).click();
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
    await expect(example).toContainText('Current value: false');

    await notifications.focus();
    await page.keyboard.press('Space');
    await expect(notifications).toBeFocused();
    await expect(notifications).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Current value: true');

    await page.keyboard.press('Enter');
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
    await expect(example).toContainText('Current value: false');

    const disabled = example.getByRole('switch', { name: 'Disabled', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await expect(disabled).toHaveAttribute('aria-checked', 'false');

    const disabledOn = example.getByRole('switch', { name: 'Disabled, on' });
    await expect(disabledOn).toBeDisabled();
    await expect(disabledOn).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledOn).toHaveAttribute('tabindex', '-1');
    await expect(disabledOn).toHaveAttribute('aria-checked', 'true');
  });

  test('native switch keeps checkbox semantics with visible label and Space key behavior', async ({
    page,
  }) => {
    await gotoSwitch(page);

    const nativeExample = page.locator('app-switch-native-example');
    await expect(nativeExample).toBeVisible();
    await expect(nativeExample.getByRole('switch')).toHaveCount(1);

    const native = nativeExample.getByRole('switch', { name: 'Auto updates' });
    await expect(native).toHaveAttribute('type', 'checkbox');
    await expect(native).toHaveAttribute('role', 'switch');
    await expect(native).toHaveAttribute('required', '');
    await expect(native).toHaveAttribute('aria-required', 'true');
    await expect(native).not.toBeChecked();

    await nativeExample.getByText('Auto updates', { exact: true }).click();
    await expect(native).toBeChecked();
    await expect(nativeExample).toContainText('Checked: true');

    await native.focus();
    await page.keyboard.press('Space');
    await expect(native).not.toBeChecked();
    await expect(nativeExample).toContainText('Checked: false');
  });
});
