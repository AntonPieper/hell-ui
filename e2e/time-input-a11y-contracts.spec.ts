import { expect, test, type Page } from '@playwright/test';

async function gotoTimeInput(page: Page): Promise<void> {
  await page.goto('/components/time-input');
  await expect(page.getByRole('heading', { name: 'Time input', level: 1 })).toBeVisible();
}

async function openReminderPicker(page: Page) {
  const trigger = page.getByRole('button', { name: 'Choose time for Reminder time' }).first();
  await trigger.click();
  const hours = page.getByRole('spinbutton', { name: 'Hours' });
  await expect(hours).toBeVisible();
  return { trigger, hours };
}

test.describe('time input accessibility contract', () => {
  test('wires visible labels, exposes invalid drafts, and closes the picker with Escape', async ({
    page,
  }) => {
    await gotoTimeInput(page);

    const input = page.getByRole('textbox', { name: 'Reminder time' }).first();
    await expect(input).toHaveAttribute('id', 'reminder-time');
    await expect(input).toHaveAccessibleDescription(
      'Type directly or adjust the segmented picker.',
    );

    await input.fill('25:99');
    await input.blur();
    await expect(input).toHaveValue('25:99');
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    const { trigger, hours } = await openReminderPicker(page);
    await expect(page.getByRole('spinbutton', { name: 'Minutes' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(hours).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('supports spinbutton keyboard changes and quick minute presets', async ({ page }) => {
    await gotoTimeInput(page);

    const input = page.getByRole('textbox', { name: 'Reminder time' }).first();
    const { hours } = await openReminderPicker(page);
    const minutes = page.getByRole('spinbutton', { name: 'Minutes' });

    await hours.focus();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('15:30');
    await expect(hours).toHaveAttribute('aria-valuenow', '15');

    await page.keyboard.press('Home');
    await expect(input).toHaveValue('00:30');
    await expect(hours).toHaveAttribute('aria-valuenow', '0');

    await minutes.focus();
    await page.keyboard.press('PageUp');
    await expect(input).toHaveValue('00:35');
    await expect(minutes).toHaveAttribute('aria-valuenow', '35');

    await page.getByRole('button', { name: 'Set minutes to 45' }).click();
    await expect(input).toHaveValue('00:45');
    await expect(minutes).toHaveAttribute('aria-valuenow', '45');
  });
});
