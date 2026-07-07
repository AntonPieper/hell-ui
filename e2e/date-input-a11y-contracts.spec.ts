import { expect, test, type Locator, type Page } from '@playwright/test';

// The docs dev server compiles routes on demand and is shared across the whole
// browser matrix, so first navigation to this route can be slow under load —
// especially on Firefox. Widen the navigation/settle budgets so the contract
// assertions below are exercised against a hydrated page instead of racing a
// cold compile. These timeouts only grant the existing assertions more time to
// become true; they never relax what is asserted.
const NAV_TIMEOUT = 60_000;
const HYDRATION_TIMEOUT = 15_000;

async function gotoDateInput(page: Page): Promise<void> {
  test.setTimeout(90_000);
  await freezeBrowserDate(page);
  await page.goto('/components/date-input', {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: 'Date input', level: 1 })).toBeVisible({
    timeout: HYDRATION_TIMEOUT,
  });
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

    const example = page.locator('app-date-input-reactive-forms-example');
    const departure = example.getByRole('textbox', { name: 'Invoice date' });
    const departureLabel = example
      .locator('label[hellFieldLabel]')
      .filter({ hasText: 'Invoice date' });
    const departureDescription = example.locator('[hellFieldDescription]').first();
    const departureLabelId = await requiredId(departureLabel, 'Invoice date label');
    const departureDescriptionId = await requiredId(
      departureDescription,
      'Invoice date description',
    );
    await expect(departure).toHaveAttribute('id', 'reactive-date');
    await expect(departure).toHaveAttribute('aria-labelledby', departureLabelId);
    await expect(departure).toHaveAttribute('aria-describedby', departureDescriptionId);
    await expect(departure).not.toHaveAttribute('aria-label', /.+/);
    await expect(departure).toHaveAccessibleDescription(
      'Reactive forms receive Date | null; empty text writes null.',
    );

    await departure.fill('2026-02-31');
    await departure.blur();
    await expect(departure).toHaveValue('2026-02-31');
    // The invalid draft flows through the control's parse/validate round-trip
    // before aria-invalid flips; allow extra settle time under a loaded server.
    await expect(departure).toHaveAttribute('aria-invalid', 'true', {
      timeout: HYDRATION_TIMEOUT,
    });

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

    const example = page.locator('app-date-input-bounds-and-validation-example');
    const input = example.getByRole('textbox', { name: 'Bounded date' });
    const trigger = dateInputHost(input).getByRole('button', { name: 'Choose date for Bounded date' });

    await trigger.click();
    const popover = page.locator('[data-slot="pickerPanel"]', {
      has: page.getByRole('grid'),
    });
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
    const reopened = page.locator('[data-slot="pickerPanel"]', {
      has: page.getByRole('grid'),
    });
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
  const header = await requiredBox(picker.locator('[data-slot="header"]'), 'picker header');
  const grid = await requiredBox(picker.locator('[data-slot="grid"]'), 'picker grid');
  const label = await requiredBox(picker.locator('[data-slot="label"]'), 'picker label');
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
