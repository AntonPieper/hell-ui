import { expect, test, type Locator, type Page } from '@playwright/test';

const NAV_TIMEOUT = 60_000;
const HYDRATION_TIMEOUT = 15_000;

async function gotoTimeInput(page: Page): Promise<void> {
  test.setTimeout(90_000);
  await page.goto('/components/time-input', {
    waitUntil: 'domcontentloaded',
    timeout: NAV_TIMEOUT,
  });
  await expect(page.getByRole('heading', { name: 'Time input', level: 1 })).toBeVisible({
    timeout: HYDRATION_TIMEOUT,
  });
}

test.describe('time input native behavior and composition contracts', () => {
  test('keeps authored native Field, focus, keyboard, CVA, and nullable-clear semantics', async ({
    page,
  }) => {
    await gotoTimeInput(page);

    const forms = page.locator('app-time-input-reactive-forms-example');
    const meeting = forms.getByRole('textbox', { name: 'Meeting time' });
    const meetingLabel = forms.locator('label[hellFieldLabel]').filter({
      hasText: 'Meeting time',
    });
    const meetingDescription = forms.locator('[hellFieldDescription]').first();
    const meetingLabelId = await requiredId(meetingLabel, 'Meeting time label');
    const meetingDescriptionId = await requiredId(
      meetingDescription,
      'Meeting time description',
    );

    await expect(meeting).toHaveAttribute('id', 'reactive-time');
    await expect(meeting).toHaveAttribute('hellTimeInput', '');
    await expect(meeting).toHaveAttribute('data-slot', 'root');
    await expect(meeting).toHaveAttribute('aria-labelledby', meetingLabelId);
    await expect(meeting).toHaveAttribute('aria-describedby', meetingDescriptionId);
    await expect
      .poll(() => meeting.evaluate((element) => (element as HTMLInputElement).type))
      .toBe('text');

    await meetingLabel.click();
    await expect(meeting).toBeFocused();

    await meeting.fill('9:');
    await meeting.blur();
    await expect(meeting).toHaveValue('9:');
    await expect(meeting).toHaveAttribute('aria-invalid', 'true', {
      timeout: HYDRATION_TIMEOUT,
    });

    await meeting.fill('9:05 pm');
    await meeting.press('ArrowLeft');
    await expect(meeting).toBeFocused();
    await expect(meeting).toHaveValue('9:05 pm');
    await meeting.press('Enter');
    await expect(meeting).toHaveValue('21:05');
    await expect(meeting).not.toHaveAttribute('aria-invalid', 'true');
    await expect(forms.getByText('Form value: 21:05')).toBeVisible();

    await meeting.fill('');
    await meeting.blur();
    await expect(meeting).toHaveValue('');
    await expect(forms.getByText('Form value: not set')).toBeVisible();
    await expect(page.locator('hell-time-input')).toHaveCount(0);
  });

  test('reflects required, bounds, seconds, and invalid drafts on the authored inputs', async ({
    page,
  }) => {
    await gotoTimeInput(page);

    const states = page.locator('app-time-input-seconds-and-validation-example');
    const precise = states.locator('#capture-time');
    const bounded = states.locator('#bounded-time');
    const required = states.locator('#required-time');
    const explicitlyInvalid = states.locator('#invalid-time');
    const disabled = states.locator('#disabled-time');

    await expect(precise).toHaveAttribute('hellTimeInput', '');
    await expect(precise).toHaveAttribute('step', '1');
    await expect(precise).toHaveValue('12:34:56');

    await expect(bounded).toHaveAttribute('min', '08:00');
    await expect(bounded).toHaveAttribute('max', '18:00');
    await expect(bounded).toHaveAttribute('step', '60');
    await bounded.fill('07:59');
    await bounded.blur();
    await expect(bounded).toHaveValue('07:59');
    await expect(bounded).toHaveAttribute('aria-invalid', 'true');
    await expect(bounded).toHaveAttribute('data-invalid', '');
    await bounded.fill('18:00');
    await bounded.press('Enter');
    await expect(bounded).toHaveValue('18:00');
    await expect(bounded).not.toHaveAttribute('aria-invalid', 'true');
    await expect(bounded).not.toHaveAttribute('data-invalid', '');

    await expect(required).toHaveAttribute('required', '');
    await expect(required).toHaveAttribute('data-required', 'true');
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAttribute('aria-describedby', 'required-time-error');
    await expect(explicitlyInvalid).toHaveAttribute('aria-invalid', 'true');
    await expect(explicitlyInvalid).toHaveAttribute('data-invalid', '');
    await expect(explicitlyInvalid).toHaveAttribute('aria-describedby', 'invalid-time-error');
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveAttribute('disabled', '');
    await expect(disabled).toHaveAttribute('data-disabled', '');
  });

  test('serializes canonical committed text for click and Enter native form submissions', async ({
    page,
  }) => {
    await gotoTimeInput(page);

    const example = page.locator('app-time-input-basic-example');
    const input = example.locator('#reminder-time');
    await input.evaluate((nativeInput) => {
      if (!(nativeInput instanceof HTMLInputElement)) throw new Error('Expected time input.');

      const ownerDocument = nativeInput.ownerDocument;
      const parent = nativeInput.parentElement;
      if (!parent) throw new Error('Expected time input parent.');

      const form = ownerDocument.createElement('form');
      form.dataset['nativeTimeForm'] = '';
      const submit = ownerDocument.createElement('button');
      submit.type = 'submit';
      submit.textContent = 'Submit native time';
      nativeInput.name = 'reminderTime';
      parent.insertBefore(form, nativeInput);
      form.append(nativeInput, submit);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const serialized = new FormData(form).get('reminderTime');
        form.dataset['serializedTime'] = typeof serialized === 'string' ? serialized : '';
      });
    });

    const form = example.locator('form[data-native-time-form]');
    const submit = form.getByRole('button', { name: 'Submit native time' });

    await input.fill(' 9:07 am ');
    await submit.click();
    await expect(form).toHaveAttribute('data-serialized-time', '09:07');
    await expect(input).toHaveValue('09:07');

    await input.fill(' 1325 ');
    await input.press('Enter');
    await expect(form).toHaveAttribute('data-serialized-time', '13:25');
    await expect(input).toHaveValue('13:25');
  });

  test('composes canonical Time Picker slots, keyboard value changes, and close focus explicitly', async ({
    page,
  }) => {
    await gotoTimeInput(page);

    const example = page.locator('app-time-input-with-time-picker-example');
    const input = example.locator('#picker-time');
    const trigger = example.getByRole('button', { name: 'Choose time' });
    const group = example.locator('[hellControlGroup]');
    const panel = page.locator('[data-testid="time-picker-panel"]');
    const picker = panel.locator('hell-time-picker');
    const hours = picker.getByRole('spinbutton', { name: 'Hours' });

    await input.focus();
    await expect(input).toBeFocused();
    await expect(group).toHaveAttribute('data-focus-within', 'true');
    await trigger.focus();
    await expect(group).toHaveAttribute('data-focus-within', 'true');

    await trigger.click();
    await expect(panel).toBeVisible();
    await expect(hours).toBeVisible();
    await expect(hours).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

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

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(panel).toBeVisible();
    await hours.focus();
    const initialValue = await input.inputValue();
    const initialHour = Number(await hours.getAttribute('aria-valuenow'));
    const key = initialHour === 23 ? 'ArrowDown' : 'ArrowUp';
    const expectedHour = initialHour === 23 ? 22 : initialHour + 1;
    const expectedValue = `${expectedHour.toString().padStart(2, '0')}:${initialValue.slice(3, 5)}`;
    await hours.press(key);
    await expect(hours).toHaveAttribute('aria-valuenow', String(expectedHour));
    await expect(input).toHaveValue(expectedValue);

    await panel.getByRole('button', { name: 'Done' }).click();
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });
});

async function requiredId(locator: Locator, label: string): Promise<string> {
  const id = await locator.getAttribute('id');
  expect(id, `${label} should have an id generated for ARIA wiring`).toBeTruthy();
  return id!;
}
