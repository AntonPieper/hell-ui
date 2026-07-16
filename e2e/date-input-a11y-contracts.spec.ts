import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const NAV_TIMEOUT = 60_000;
const HYDRATION_TIMEOUT = 15_000;
const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

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

test.describe('date input native behavior and composition contracts', () => {
  test('keeps Field, native keyboard, validation, required, disabled, and clear semantics', async ({
    page,
  }) => {
    await gotoDateInput(page);

    const forms = page.locator('app-date-input-reactive-forms-example');
    const invoice = forms.getByRole('textbox', { name: 'Invoice date' });
    const invoiceLabel = forms.locator('label[hellFieldLabel]').filter({
      hasText: 'Invoice date',
    });
    const invoiceDescription = forms.locator('[hellFieldDescription]').first();
    const invoiceLabelId = await requiredId(invoiceLabel, 'Invoice date label');
    const invoiceDescriptionId = await requiredId(
      invoiceDescription,
      'Invoice date description',
    );

    await expect(invoice).toHaveAttribute('id', 'reactive-date');
    await expect(invoice).toHaveAttribute('hellDateInput', '');
    await expect(invoice).toHaveAttribute('aria-labelledby', invoiceLabelId);
    await expect(invoice).toHaveAttribute('aria-describedby', invoiceDescriptionId);
    await expect(invoice).toHaveAccessibleDescription(
      'Reactive forms receive Date | null; empty text writes null.',
    );

    await invoice.fill('2026-02-31');
    await invoice.blur();
    await expect(invoice).toHaveValue('2026-02-31');
    await expect(invoice).toHaveAttribute('aria-invalid', 'true', {
      timeout: HYDRATION_TIMEOUT,
    });

    await invoice.fill('2026-06-06');
    await invoice.press('Enter');
    await expect(invoice).toHaveValue('2026-06-06');
    await expect(invoice).not.toHaveAttribute('aria-invalid', 'true');

    await invoice.fill('');
    await invoice.blur();
    await expect(invoice).toHaveValue('');

    const states = page.locator('app-date-input-bounds-and-validation-example');
    await expect(states.getByRole('textbox', { name: 'Required date' })).toHaveAttribute(
      'required',
      '',
    );
    await expect(states.getByRole('textbox', { name: 'Required date' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(states.getByRole('textbox', { name: 'Disabled date' })).toBeDisabled();
    await expect(page.locator('hell-date-input')).toHaveCount(0);
  });

  test('serializes canonical committed text for click and Enter native form submissions', async ({
    page,
  }) => {
    await gotoDateInput(page);

    const example = page.locator('app-date-input-basic-example');
    const input = example.getByRole('textbox', { name: 'Invoice date' });
    await input.evaluate((nativeInput) => {
      if (!(nativeInput instanceof HTMLInputElement)) throw new Error('Expected date input.');

      const ownerDocument = nativeInput.ownerDocument;
      const parent = nativeInput.parentElement;
      if (!parent) throw new Error('Expected date input parent.');

      const form = ownerDocument.createElement('form');
      form.dataset['nativeDateForm'] = '';
      const submit = ownerDocument.createElement('button');
      submit.type = 'submit';
      submit.textContent = 'Submit native date';
      nativeInput.name = 'invoiceDate';
      parent.insertBefore(form, nativeInput);
      form.append(nativeInput, submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const serialized = new FormData(form).get('invoiceDate');
        form.dataset['serializedDate'] = typeof serialized === 'string' ? serialized : '';
      });
    });

    const form = example.locator('form[data-native-date-form]');
    const submit = form.getByRole('button', { name: 'Submit native date' });

    await input.fill(' 2026-05-06 ');
    await submit.click();
    await expect(form).toHaveAttribute('data-serialized-date', '2026-05-06');
    await expect(input).toHaveValue('2026-05-06');

    await input.fill(' 2026-07-08 ');
    await input.press('Enter');
    await expect(form).toHaveAttribute('data-serialized-date', '2026-07-08');
    await expect(input).toHaveValue('2026-07-08');
  });

  test('composes calendar open, keyboard selection, close, and focus restoration explicitly', async ({
    page,
  }) => {
    await gotoDateInput(page);

    const example = page.locator('app-date-input-with-calendar-picker-example');
    const input = example.getByRole('textbox', { name: 'Ship date' });
    const trigger = example.getByRole('button', { name: 'Choose ship date' });
    const group = example.locator('[hellControlGroup]');

    await input.focus();
    await expect(input).toBeFocused();
    await expect(group).toHaveAttribute('data-focus-within', 'true');
    await trigger.focus();
    await expect(group).toHaveAttribute('data-focus-within', 'true');

    await trigger.click();
    const popover = page.locator('[data-date-input-calendar]');
    await expect(popover).toBeVisible();
    await expect(popover.getByRole('grid', { name: 'June 2026' })).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await dayButton(popover, 15).focus();
    await page.keyboard.press('ArrowRight');
    await expect(dayButton(popover, 16)).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(input).toHaveValue('2026-06-16');
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();

    await trigger.click();
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('reports no WCAG smoke violations for the native field and open picker recipe', async ({
    page,
  }) => {
    await gotoDateInput(page);
    const example = page.locator('app-date-input-with-calendar-picker-example');
    await example.getByRole('button', { name: 'Choose ship date' }).click();
    await expect(page.locator('[data-date-input-calendar]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_SMOKE_TAGS)
      .include('main')
      .include('[data-date-input-calendar]')
      .analyze();

    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
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
