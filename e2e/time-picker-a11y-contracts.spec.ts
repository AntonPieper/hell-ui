import { expect, test, type Locator, type Page } from '@playwright/test';

const PUBLIC_PARTS = [
  'root',
  'header',
  'readout',
  'columns',
  'column',
  'columnLabel',
  'options',
  'option',
];

function column(picker: Locator, unit: string): Locator {
  return picker.locator(`[data-unit="${unit}"]`);
}

function option(picker: Locator, unit: string, text: string): Locator {
  return column(picker, unit).getByRole('option', { name: text, exact: true });
}

/** The single roving tab stop of one column. */
function tabStop(picker: Locator, unit: string): Locator {
  return column(picker, unit).locator('[data-slot="option"][tabindex="0"]');
}

async function gotoBasicPicker(page: Page) {
  await page.goto('/components/time-picker');
  await expect(page.getByRole('heading', { name: 'Time picker', level: 1 })).toBeVisible();

  const example = page.locator('app-time-picker-basic-example');
  const picker = example.locator('hell-time-picker');
  await expect(picker).toBeVisible();
  return { example, picker };
}

async function gotoBoundedPicker(page: Page) {
  await page.goto('/components/time-picker');
  const example = page.locator('app-time-picker-steps-and-bounds-example');
  const picker = example.locator('hell-time-picker');
  await expect(picker).toBeVisible();
  return { example, picker };
}

test.describe('time picker anatomy and accessibility', () => {
  test('renders only the canonical public anatomy with labelled column listboxes', async ({
    page,
  }) => {
    const { picker } = await gotoBasicPicker(page);

    await expect(picker).toHaveAttribute('data-slot', 'root');
    for (const part of PUBLIC_PARTS.slice(1)) {
      await expect(picker.locator(`[data-slot="${part}"]`).first()).toBeVisible();
    }

    const renderedSlots = await picker.evaluate((element) => [
      ...new Set(
        [element, ...element.querySelectorAll('[data-slot]')].map((candidate) =>
          candidate.getAttribute('data-slot'),
        ),
      ),
    ]);
    expect(new Set(renderedSlots)).toEqual(new Set(PUBLIC_PARTS));

    // The root carries the accessible name; the readout must not repeat it.
    await expect(picker).toHaveAttribute('role', 'group');
    await expect(picker).toHaveAttribute('aria-label', 'Selected time 14:30');
    const readout = picker.locator('[data-slot="readout"]');
    await expect(readout).toHaveAttribute('aria-hidden', 'true');
    await expect(readout).toHaveText('14:30');

    const lists = picker.getByRole('listbox');
    await expect(lists).toHaveCount(2);
    await expect(picker.getByRole('listbox', { name: 'Hours' })).toBeVisible();
    await expect(picker.getByRole('listbox', { name: 'Minutes' })).toBeVisible();

    const selectedHour = option(picker, 'hour', '14');
    await expect(selectedHour).toHaveAttribute('aria-selected', 'true');
    await expect(selectedHour).toHaveAttribute('data-selected', 'true');
    await expect(option(picker, 'hour', '13')).toHaveAttribute('aria-selected', 'false');
  });

  test('keeps exactly one tab stop per column and tabs between them', async ({ page }) => {
    const { picker } = await gotoBasicPicker(page);

    for (const unit of ['hour', 'minute']) {
      await expect(tabStop(picker, unit)).toHaveCount(1);
    }
    await expect(tabStop(picker, 'hour')).toHaveText('14');
    await expect(tabStop(picker, 'minute')).toHaveText('30');

    await option(picker, 'hour', '14').focus();
    await expect(option(picker, 'hour', '14')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(option(picker, 'minute', '30')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(option(picker, 'hour', '14')).toBeFocused();
  });

  test('marks out-of-bounds options disabled and inert', async ({ page }) => {
    const { example, picker } = await gotoBoundedPicker(page);

    await expect(picker).toHaveAttribute('aria-label', 'No time selected');
    await expect(picker.locator('[data-slot="readout"]')).toHaveText('--:--');
    await expect(example.getByText('Selected: not set')).toBeVisible();

    const early = option(picker, 'hour', '08');
    await expect(early).toHaveAttribute('aria-disabled', 'true');
    await expect(early).toHaveAttribute('data-disabled', 'true');
    await expect(option(picker, 'hour', '09')).not.toHaveAttribute('aria-disabled', 'true');
    await expect(option(picker, 'hour', '18')).toHaveAttribute('aria-disabled', 'true');

    // A disabled option cannot be activated by pointer.
    await early.click({ force: true });
    await expect(example.getByText('Selected: not set')).toBeVisible();

    // The empty picker parks its tab stop on the first enabled option.
    await expect(tabStop(picker, 'hour')).toHaveText('09');
  });
});

test.describe('time picker interaction contract', () => {
  test('commits on tap and never on scroll', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);
    const minutes = column(picker, 'minute').locator('[data-slot="options"]');

    // Scrolling only reveals options.
    await minutes.evaluate((element) => {
      element.scrollTop += 240;
    });
    await expect(example.getByText('Selected: 14:30')).toBeVisible();

    await option(picker, 'minute', '45').click();
    await expect(example.getByText('Selected: 14:45')).toBeVisible();
    await expect(option(picker, 'minute', '45')).toHaveAttribute('data-selected', 'true');
    await expect(option(picker, 'minute', '30')).toHaveAttribute('aria-selected', 'false');
  });

  test('moves and commits with selection following focus, without wrapping', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);

    await option(picker, 'hour', '14').focus();
    await page.keyboard.press('ArrowDown');
    await expect(example.getByText('Selected: 15:30')).toBeVisible();
    await expect(option(picker, 'hour', '15')).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(example.getByText('Selected: 14:30')).toBeVisible();

    await page.keyboard.press('End');
    await expect(example.getByText('Selected: 23:30')).toBeVisible();
    // No wrap past the last option.
    await page.keyboard.press('ArrowDown');
    await expect(example.getByText('Selected: 23:30')).toBeVisible();

    await page.keyboard.press('Home');
    await expect(example.getByText('Selected: 00:30')).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await expect(example.getByText('Selected: 00:30')).toBeVisible();
  });

  test('moves focus between columns with left and right arrows', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);

    await option(picker, 'hour', '14').focus();
    await page.keyboard.press('ArrowRight');
    await expect(option(picker, 'minute', '30')).toBeFocused();
    // Crossing columns never commits.
    await expect(example.getByText('Selected: 14:30')).toBeVisible();

    await page.keyboard.press('PageDown');
    await expect(example.getByText('Selected: 14:35')).toBeVisible();
    await page.keyboard.press('PageUp');
    await expect(example.getByText('Selected: 14:30')).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(option(picker, 'hour', '14')).toBeFocused();
  });

  test('accepts typed digits and auto-advances between columns', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);

    await option(picker, 'hour', '14').focus();
    // 0 then 8 completes the hour and moves to minutes.
    await page.keyboard.press('0');
    await page.keyboard.press('8');
    await expect(example.getByText('Selected: 08:30')).toBeVisible();
    await expect(option(picker, 'minute', '30')).toBeFocused();

    await page.keyboard.press('4');
    await page.keyboard.press('5');
    await expect(example.getByText('Selected: 08:45')).toBeVisible();

    // A leading 7 cannot be extended inside 0-59, so it completes at once.
    await option(picker, 'minute', '45').focus();
    await page.keyboard.press('7');
    await expect(example.getByText('Selected: 08:07')).toBeVisible();
  });

  test('snaps typed digits onto a stepped column without creating off-step values', async ({
    page,
  }) => {
    const { example, picker } = await gotoBoundedPicker(page);

    await expect(
      column(picker, 'minute').locator('[data-slot="option"]'),
    ).toHaveText(['00', '15', '30', '45']);

    // First activation of an empty picker commits the earliest in-range value.
    await option(picker, 'minute', '30').click();
    await expect(example.getByText('Selected: 09:30')).toBeVisible();

    // 3 then 7 snaps to the nearest enabled option, 30.
    await option(picker, 'minute', '30').focus();
    await page.keyboard.press('4');
    await page.keyboard.press('5');
    await expect(example.getByText('Selected: 09:45')).toBeVisible();
    await page.keyboard.press('3');
    await page.keyboard.press('7');
    await expect(example.getByText('Selected: 09:30')).toBeVisible();
    await expect(
      column(picker, 'minute').locator('[data-slot="option"]'),
    ).toHaveText(['00', '15', '30', '45']);
  });

  test('skips disabled options while traversing a bounded column', async ({ page }) => {
    const { example, picker } = await gotoBoundedPicker(page);

    await option(picker, 'hour', '09').click();
    await expect(example.getByText('Selected: 09:00')).toBeVisible();

    // Everything before 09:00 is out of range, so Up cannot leave hour 09.
    await option(picker, 'hour', '09').focus();
    await page.keyboard.press('ArrowUp');
    await expect(example.getByText('Selected: 09:00')).toBeVisible();

    // End lands on the last enabled hour, not hour 23.
    await page.keyboard.press('End');
    await expect(example.getByText('Selected: 17:00')).toBeVisible();
    await expect(option(picker, 'hour', '17')).toBeFocused();
  });

  test('shows a stepped seconds column and locks the disabled picker', async ({ page }) => {
    await page.goto('/components/time-picker');
    const examples = page.locator('app-time-picker-seconds-and-disabled-example');

    const precise = examples.locator('hell-time-picker').first();
    await expect(precise.getByRole('listbox')).toHaveCount(3);
    await expect(precise.locator('[data-slot="readout"]')).toHaveText('12:34:45');
    await expect(
      column(precise, 'second').locator('[data-slot="option"]'),
    ).toHaveText(['00', '15', '30', '45']);
    await option(precise, 'second', '15').click();
    await expect(precise.locator('[data-slot="readout"]')).toHaveText('12:34:15');

    const locked = examples.locator('hell-time-picker').nth(1);
    await expect(locked).toHaveAttribute('data-disabled', 'true');
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    await expect(tabStop(locked, 'hour')).toHaveCount(0);
    await expect(locked.locator('[data-slot="readout"]')).toHaveText('09:00');
  });
});

test.describe('time picker touch contract', () => {
  // `pointer: coarse` needs real mobile emulation, and `isMobile` is a
  // Chromium-only capability in Playwright.
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'mobile emulation for pointer: coarse is Chromium-only',
  );
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('raises option hit targets to 44px and commits on tap', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);

    const target = option(picker, 'minute', '45');
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await target.tap();
    await expect(example.getByText('Selected: 14:45')).toBeVisible();
  });

  test('reveals options by scrolling without committing', async ({ page }) => {
    const { example, picker } = await gotoBasicPicker(page);
    const hours = column(picker, 'hour').locator('[data-slot="options"]');

    const before = await hours.evaluate((element) => element.scrollTop);
    await hours.evaluate((element) => {
      element.scrollTop += 200;
    });
    await expect
      .poll(() => hours.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(before);
    await expect(example.getByText('Selected: 14:30')).toBeVisible();
  });
});
