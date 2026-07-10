import { expect, test, type Page } from '@playwright/test';

async function gotoAlert(page: Page): Promise<void> {
  await page.goto('/components/alert');
  await expect(page.getByRole('heading', { name: 'Alert', level: 1 })).toBeVisible();
}

test.describe('alert browser accessibility contract', () => {
  test('dismiss button is keyboard-operable and emits without self-removing the alert markup', async ({
    page,
  }) => {
    await gotoAlert(page);

    const example = page.locator('app-alert-dismissible-example');
    await expect(example).toBeVisible();

    const alert = example.locator('hell-alert');
    await expect(alert).toBeVisible();

    const dismiss = example.getByRole('button', { name: 'Dismiss' });
    await expect(dismiss).toHaveAttribute('type', 'button');

    // Operable from the keyboard: focus and activate with Enter.
    await dismiss.focus();
    await expect(dismiss).toBeFocused();
    await page.keyboard.press('Enter');

    // The consumer owns visibility: the example hides the alert on dismissed.
    await expect(alert).toHaveCount(0);
    await expect(example.getByRole('button', { name: 'Show the tip again' })).toBeVisible();

    // Bring it back and confirm Space also activates the dismiss button.
    await example.getByRole('button', { name: 'Show the tip again' }).click();
    const dismissAgain = example.getByRole('button', { name: 'Dismiss' });
    await dismissAgain.focus();
    await page.keyboard.press('Space');
    await expect(example.locator('hell-alert')).toHaveCount(0);
  });

  test('action buttons are reachable in document order with visible focus', async ({ page }) => {
    await gotoAlert(page);

    const example = page.locator('app-alert-actions-example');
    await expect(example).toBeVisible();

    const retry = example.getByRole('button', { name: 'Retry sync' });
    const viewLog = example.getByRole('button', { name: 'View log' });
    await expect(retry).toBeVisible();
    await expect(viewLog).toBeVisible();

    await retry.focus();
    await expect(retry).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(viewLog).toBeFocused();
  });

  test('static alerts expose no ARIA role while async alerts opt into role="alert"', async ({
    page,
  }) => {
    await gotoAlert(page);

    const basic = page.locator('app-alert-basic-example hell-alert');
    await expect(basic).toBeVisible();
    await expect(basic).not.toHaveAttribute('role', /.+/);

    const asyncExample = page.locator('app-alert-async-role-example');
    await expect(asyncExample.getByRole('alert')).toHaveCount(0);

    await asyncExample.getByRole('button', { name: 'Simulate a failed call' }).click();
    const announced = asyncExample.getByRole('alert');
    await expect(announced).toBeVisible();
    await expect(announced).toContainText('Call dropped');
  });
});
