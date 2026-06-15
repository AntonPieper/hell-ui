import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDateInput(page: Page): Promise<void> {
  await freezeBrowserDate(page);
  await page.goto('/components/date-input');
  await expect(page.getByRole('heading', { name: 'Date input', level: 1 })).toBeVisible();
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

test.describe('date input accessibility contract', () => {
  test('wires visible labels, descriptions, errors, and invalid typed drafts', async ({ page }) => {
    await gotoDateInput(page);

    const example = page.locator('app-date-input-text-input-calendar-popover-example');
    const departure = example.getByRole('textbox', { name: 'Departure' });
    const departureLabel = example
      .locator('label[hellFieldLabel]')
      .filter({ hasText: 'Departure' });
    const departureDescription = example.locator('[hellFieldDescription]').first();
    const departureLabelId = await requiredId(departureLabel, 'Departure label');
    const departureDescriptionId = await requiredId(departureDescription, 'Departure description');
    await expect(departure).toHaveAttribute('id', 'departure-date');
    await expect(departure).toHaveAttribute('aria-labelledby', departureLabelId);
    await expect(departure).toHaveAttribute('aria-describedby', departureDescriptionId);
    await expect(departure).not.toHaveAttribute('aria-label', /.+/);
    await expect(departure).toHaveAccessibleDescription(
      'Type a date or pick from the calendar — both work.',
    );

    await departure.fill('2026-02-31');
    await departure.blur();
    await expect(departure).toHaveValue('2026-02-31');
    await expect(departure).toHaveAttribute('aria-invalid', 'true');

    const invalid = example.getByRole('textbox', { name: 'Invalid' });
    const invalidLabel = example.locator('label[hellFieldLabel]').filter({ hasText: 'Invalid' });
    const invalidError = example.locator('[hellFieldError]');
    const invalidLabelId = await requiredId(invalidLabel, 'Invalid label');
    const invalidErrorId = await requiredId(invalidError, 'Invalid error');
    await expect(invalid).toHaveAttribute('id', 'invalid-date');
    await expect(invalid).toHaveAttribute('aria-labelledby', invalidLabelId);
    await expect(invalid).toHaveAttribute('aria-describedby', invalidErrorId);
    await expect(invalid).not.toHaveAttribute('aria-label', /.+/);
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAccessibleDescription('Pick a date in the future.');
  });

  test('supports picker keyboard navigation and closes on selection and Escape', async ({
    page,
  }) => {
    await gotoDateInput(page);

    const example = page.locator('app-date-input-text-input-calendar-popover-example');
    const input = example.getByRole('textbox', { name: 'Bounded' });
    const trigger = dateInputHost(input).getByRole('button', { name: 'Choose date' });

    await trigger.click();
    const popover = page.locator('.hell-popover');
    await expect(popover).toBeVisible();
    await expect(popover.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await expectPickerLayoutAligned(popover.locator('hell-date-picker'));
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await dayButton(popover, 15).focus();
    await page.keyboard.press('ArrowRight');
    await expect(dayButton(popover, 16)).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(popover.getByRole('grid', { name: 'July 2026' })).toBeVisible();
    await expect(dayButton(popover, 16)).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(popover.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await expect(dayButton(popover, 16)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('2026-06-16');
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();

    await trigger.click();
    const reopened = page.locator('.hell-popover');
    await expect(reopened).toBeVisible();
    await expect(reopened.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(reopened).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });
});

function dayButton(picker: Locator, day: number): Locator {
  return picker
    .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
    .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) })
    .first();
}

async function requiredId(locator: Locator, label: string): Promise<string> {
  const id = await locator.getAttribute('id');
  expect(id, `${label} should have an id generated for ARIA wiring`).toBeTruthy();
  return id!;
}

function dateInputHost(input: Locator): Locator {
  return input.locator('xpath=..');
}

async function expectPickerLayoutAligned(picker: Locator): Promise<void> {
  const header = await requiredBox(picker.locator('.hell-date-picker-header'), 'picker header');
  const grid = await requiredBox(picker.locator('.hell-date-picker-grid'), 'picker grid');
  const label = await requiredBox(picker.locator('.hell-date-picker-label'), 'picker label');
  const previousMonth = await requiredBox(
    picker.getByRole('button', { name: 'Previous month' }),
    'previous month button',
  );
  const nextMonth = await requiredBox(
    picker.getByRole('button', { name: 'Next month' }),
    'next month button',
  );

  expect(Math.abs(header.width - grid.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(centerX(header) - centerX(grid))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerY(label) - centerY(previousMonth))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerY(label) - centerY(nextMonth))).toBeLessThanOrEqual(1);
}

async function requiredBox(
  locator: Locator,
  label: string,
): Promise<NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>> {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a browser layout box`).not.toBeNull();
  return box!;
}

function centerX(box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>): number {
  return box.x + box.width / 2;
}

function centerY(box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>): number {
  return box.y + box.height / 2;
}
