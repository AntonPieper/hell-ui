import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoSwitch(page: Page): Promise<void> {
  await page.goto('/components/switch');
  await expect(page.getByRole('heading', { name: 'Switch', level: 1 })).toBeVisible();
}

test.describe('switch browser accessibility contract', () => {
  test('custom switches expose visible names, checked state, keyboard, and disabled state', async ({
    page,
  }) => {
    await gotoSwitch(page);

    const basicExample = page.locator('app-switch-basic-example');
    await expect(basicExample).toBeVisible();
    await expect(basicExample.getByRole('switch')).toHaveCount(1);

    const notifications = basicExample.getByRole('switch', { name: 'Email notifications' });
    await expect(notifications).toHaveAttribute('type', 'button');
    await expect(notifications).toHaveAttribute('role', 'switch');
    await expect(notifications).toHaveAttribute('aria-checked', 'true');
    await expectSwitchThumbSide(notifications, 'right');

    await basicExample.getByText('Email notifications', { exact: true }).click();
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
    await expect(basicExample).toContainText('Current value: false');
    await expectSwitchThumbSide(notifications, 'left');

    await notifications.focus();
    await page.keyboard.press('Space');
    await expect(notifications).toBeFocused();
    await expect(notifications).toHaveAttribute('aria-checked', 'true');
    await expect(basicExample).toContainText('Current value: true');
    await expectSwitchThumbSide(notifications, 'right');

    await page.keyboard.press('Enter');
    await expect(notifications).toHaveAttribute('aria-checked', 'false');
    await expect(basicExample).toContainText('Current value: false');
    await expectSwitchThumbSide(notifications, 'left');

    const statesExample = page.locator('app-switch-states-example');
    await expect(statesExample).toBeVisible();
    await expect(statesExample.getByRole('switch')).toHaveCount(4);

    const disabled = statesExample.getByRole('switch', { name: 'Disabled, off', exact: true });
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await expect(disabled).toHaveAttribute('aria-checked', 'false');
    await expectSwitchThumbSide(disabled, 'left');

    const disabledOn = statesExample.getByRole('switch', { name: 'Disabled, on', exact: true });
    await expect(disabledOn).toBeDisabled();
    await expect(disabledOn).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledOn).toHaveAttribute('tabindex', '-1');
    await expect(disabledOn).toHaveAttribute('aria-checked', 'true');
    await expectSwitchThumbSide(disabledOn, 'right');
  });

  test('signal forms switch shares one checked state with the field and reports touched on blur', async ({
    page,
  }) => {
    await gotoSwitch(page);

    const example = page.locator('app-switch-forms-example');
    await expect(example).toBeVisible();

    const digest = example.getByRole('switch', { name: 'Email digest' });
    const realtime = example.getByRole('switch', { name: 'Realtime alerts' });

    await expect(digest).toHaveAttribute('aria-checked', 'false');
    // The schema's disabled() rule locks the dependent switch while the digest is off.
    await expect(realtime).toBeDisabled();
    await expect(example).toContainText('Digest: false');
    await expect(example).toContainText('Touched: false');

    await digest.focus();
    await page.keyboard.press('Space');
    await expect(digest).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Digest: true');
    await expect(realtime).toBeEnabled();
    await expect(example).toContainText('Touched: false');

    await page.keyboard.press('Tab');
    await expect(example).toContainText('Touched: true');
  });

  test('native switch keeps checkbox semantics with visible label and Space key behavior', async ({
    page,
  }) => {
    await gotoSwitch(page);

    const nativeExample = page.locator('app-switch-native-example');
    await expect(nativeExample).toBeVisible();
    await expect(nativeExample.getByRole('switch')).toHaveCount(1);

    const native = nativeExample.getByRole('switch', { name: 'Auto-renew subscription' });
    await expect(native).toHaveAttribute('type', 'checkbox');
    await expect(native).toHaveAttribute('role', 'switch');
    await expect(native).toHaveAttribute('required', '');
    await expect(native).toHaveAttribute('aria-required', 'true');
    await expect(native).not.toBeChecked();

    await nativeExample.getByText('Auto-renew subscription', { exact: true }).click();
    await expect(native).toBeChecked();
    await expect(nativeExample).toContainText('Checked: true');

    await native.focus();
    await page.keyboard.press('Space');
    await expect(native).not.toBeChecked();
    await expect(nativeExample).toContainText('Checked: false');
  });
});

async function expectSwitchThumbSide(switchControl: Locator, side: 'left' | 'right'): Promise<void> {
  await expect
    .poll(async () => {
      return switchControl.evaluate((button) => {
        const thumb = button.querySelector('[data-slot="thumb"]');
        if (!(thumb instanceof HTMLElement)) throw new Error('Expected switch thumb.');

        const rootBox = button.getBoundingClientRect();
        const thumbBox = thumb.getBoundingClientRect();
        const rootCenter = rootBox.left + rootBox.width / 2;
        const thumbCenter = thumbBox.left + thumbBox.width / 2;

        return thumbCenter > rootCenter ? 'right' : 'left';
      });
    })
    .toBe(side);
}
