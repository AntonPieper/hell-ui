import { expect, test, type Page } from '@playwright/test';

async function gotoStandaloneTimePicker(page: Page) {
  await page.goto('/components/time-picker');
  await expect(page.getByRole('heading', { name: 'Time picker', level: 1 })).toBeVisible();

  const example = page.locator('app-time-picker-basic-example');
  const picker = example.locator('hell-time-picker');
  await expect(picker).toBeVisible();
  return { example, picker };
}

test.describe('time picker accessibility contract', () => {
  test('renders only the canonical public anatomy with labelled spinbuttons and focus', async ({
    page,
  }) => {
    const { picker } = await gotoStandaloneTimePicker(page);

    await expect(picker).toHaveAttribute('data-slot', 'root');
    for (const part of [
      'header',
      'readout',
      'units',
      'unit',
      'unitLabel',
      'unitControl',
      'unitValue',
      'unitStep',
      'minutePresets',
      'minutePreset',
    ]) {
      await expect(picker.locator(`[data-slot="${part}"]`).first()).toBeVisible();
    }

    const renderedSlots = await picker.evaluate((element) => [
      ...new Set(
        [element, ...element.querySelectorAll('[data-slot]')].map((candidate) =>
          candidate.getAttribute('data-slot'),
        ),
      ),
    ]);
    expect(new Set(renderedSlots)).toEqual(
      new Set([
        'root',
        'header',
        'readout',
        'units',
        'unit',
        'unitLabel',
        'unitControl',
        'unitValue',
        'unitStep',
        'minutePresets',
        'minutePreset',
      ]),
    );
    expect(renderedSlots.some((slot) => slot?.startsWith('picker'))).toBe(false);

    const hours = picker.getByRole('spinbutton', { name: 'Hours' });
    const minutes = picker.getByRole('spinbutton', { name: 'Minutes' });
    await hours.focus();
    await expect(hours).toBeFocused();
    await expect(hours).toHaveAttribute('aria-valuemin', '0');
    await expect(hours).toHaveAttribute('aria-valuemax', '23');
    await expect(hours).toHaveAttribute('aria-valuenow', '14');
    await expect(minutes).toHaveAttribute('aria-valuemax', '59');
    await expect(picker.locator('[data-slot="readout"]')).toHaveAttribute(
      'aria-label',
      'Selected time 14:30',
    );
    await expect(picker.getByRole('group', { name: 'Minute presets' })).toBeVisible();
  });

  test('commits bounded keyboard steps and the fixed pressed minute presets', async ({ page }) => {
    const { example, picker } = await gotoStandaloneTimePicker(page);
    const hours = picker.getByRole('spinbutton', { name: 'Hours' });
    const minutes = picker.getByRole('spinbutton', { name: 'Minutes' });

    await hours.press('End');
    await expect(example.getByText('Selected: 23:30')).toBeVisible();
    await hours.press('ArrowUp');
    await expect(example.getByText('Selected: 23:30')).toBeVisible();
    await expect(hours).toHaveAttribute('aria-valuenow', '23');

    await minutes.press('PageUp');
    await expect(example.getByText('Selected: 23:35')).toBeVisible();
    await minutes.press('Home');
    await expect(example.getByText('Selected: 23:00')).toBeVisible();

    const preset = picker.getByRole('button', { name: 'Set minutes to 45' });
    await preset.click();
    await expect(example.getByText('Selected: 23:45')).toBeVisible();
    await expect(preset).toHaveAttribute('aria-pressed', 'true');
    await expect(preset).toHaveAttribute('data-selected', 'true');
  });

  test('shows bounded seconds and disables every interaction in the locked example', async ({
    page,
  }) => {
    await page.goto('/components/time-picker');
    const examples = page.locator('app-time-picker-seconds-and-disabled-example');
    const precise = examples.locator('hell-time-picker').first();
    const seconds = precise.getByRole('spinbutton', { name: 'Seconds' });
    await expect(seconds).toHaveAttribute('aria-valuenow', '56');
    await seconds.press('End');
    await expect(seconds).toHaveAttribute('aria-valuenow', '59');
    await seconds.press('ArrowUp');
    await expect(seconds).toHaveAttribute('aria-valuenow', '59');

    const locked = examples.locator('hell-time-picker').nth(1);
    const lockedHours = locked.getByRole('spinbutton', { name: 'Hours' });
    await expect(locked).toHaveAttribute('data-disabled', 'true');
    await expect(lockedHours).toHaveAttribute('tabindex', '-1');
    await expect(lockedHours).toHaveAttribute('aria-disabled', 'true');
    await expect(locked.getByRole('button', { name: 'Increase hours' })).toBeDisabled();
    await expect(locked.getByRole('button', { name: 'Set minutes to 45' })).toBeDisabled();
  });
});
