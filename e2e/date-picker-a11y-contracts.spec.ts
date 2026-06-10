import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDatePicker(page: Page): Promise<void> {
  await freezeBrowserDate(page);
  await page.goto('/components/date-picker');
  await expect(page.getByRole('heading', { name: 'Date picker', level: 1 })).toBeVisible();
}

async function freezeBrowserDate(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(2026, 3, 22, 12, 0, 0, 0).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        Object.defineProperty(FixedDate, 'name', { value: 'Date' });
        globalThis.Date = FixedDate;
      })();
    `,
  });
}

test.describe('date picker browser accessibility contract', () => {
  test('single-date picker exposes grid relationships and APG-style keyboard navigation', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-single-date-example');
    const picker = example.locator('hell-date-picker');
    await expect(example).toBeVisible();
    await expect(monthLabel(picker, 'April 2026')).toHaveAttribute('aria-live', 'polite');

    const grid = picker.getByRole('grid', { name: 'April 2026' });
    await expect(grid).toBeVisible();
    await expect(cellForDay(picker, 22)).toHaveAttribute('aria-selected', 'true');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-selected', '');

    await picker.getByRole('button', { name: 'Next month' }).click();
    await expect(monthLabel(picker, 'May 2026')).toBeVisible();
    await picker.getByRole('button', { name: 'Previous month' }).click();
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();
    await picker.getByRole('button', { name: 'Next year' }).click();
    await expect(monthLabel(picker, 'April 2027')).toBeVisible();
    await picker.getByRole('button', { name: 'Previous year' }).click();
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();

    await dayButton(picker, 22).click();
    await expect(dayButton(picker, 22)).toBeFocused();
    await expect(dayButton(picker, 22)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowRight');
    await expect(dayButton(picker, 23)).toBeFocused();
    await expect(dayButton(picker, 23)).toHaveAttribute('tabindex', '0');
    await expect(dayButton(picker, 22)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowDown');
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(dayButton(picker, 1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(monthLabel(picker, 'May 2026')).toBeVisible();
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();
    await expect(dayButton(picker, 30)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 30)).toHaveAttribute('data-selected', '');
    await expect(cellForDay(picker, 30)).toHaveAttribute('aria-selected', 'true');
    await expect(example).toContainText('Selected: Thu Apr 30 2026');
  });

  test('bounded and disabled pickers expose disabled navigation and date states', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const boundedPicker = page
      .locator('app-date-picker-bounded-example')
      .locator('hell-date-picker');
    await expect(monthLabel(boundedPicker, 'April 2026')).toBeVisible();
    await expect(boundedPicker.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Previous year' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    await expect(boundedPicker.getByRole('button', { name: 'Next month' })).toBeEnabled();
    await expect(boundedPicker.getByRole('button', { name: 'Next year' })).toBeDisabled();

    const disabledPicker = page
      .locator('app-date-picker-disabled-example')
      .locator('hell-date-picker')
      .first();
    await expect(disabledPicker.getByRole('grid')).toHaveAttribute('data-disabled', '');
    for (const name of ['Previous year', 'Previous month', 'Next month', 'Next year']) {
      await expect(disabledPicker.getByRole('button', { name })).toBeDisabled();
      await expect(disabledPicker.getByRole('button', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    await expect(dayButton(disabledPicker, 22)).toBeDisabled();
    await expect(cellForDay(disabledPicker, 22)).toHaveAttribute('aria-disabled', 'true');
  });

  test('range picker exposes start, between, end states and keyboard range reselection', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-range-example');
    const picker = example.locator('hell-date-range-picker');
    await expect(picker).toHaveAttribute('data-range', 'true');
    await expect(dayButton(picker, 5)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 6)).toHaveAttribute('data-range-between', '');
    await expect(dayButton(picker, 12)).toHaveAttribute('data-range-end', '');
    await expect(example).toContainText('Sun Apr 05 2026');
    await expect(example).toContainText('Sun Apr 12 2026');

    await dayButton(picker, 18).focus();
    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 18)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 12)).not.toHaveAttribute('data-range-end');
    await expect(example).toContainText('Sat Apr 18 2026');
    await expect(example).toContainText(/Sat Apr 18 2026\s*\u2192\s*\u2014/);

    await page.keyboard.press('ArrowRight');
    await expect(dayButton(picker, 19)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(dayButton(picker, 18)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 19)).toHaveAttribute('data-range-end', '');
    await expect(example).toContainText('Sun Apr 19 2026');
  });
});

function monthLabel(picker: Locator, name: string): Locator {
  return picker.getByRole('heading', { level: 2, name });
}

function dayButton(picker: Locator, day: number): Locator {
  return picker
    .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
    .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) })
    .first();
}

function cellForDay(picker: Locator, day: number): Locator {
  return dayButton(picker, day).locator('xpath=ancestor::td[1]');
}
