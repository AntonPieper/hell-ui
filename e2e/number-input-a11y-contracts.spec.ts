import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function gotoNumberInput(page: Page): Promise<Locator> {
  await page.goto('/components/number-input');
  await expect(page.getByRole('heading', { name: 'Number input', level: 1 })).toBeVisible();
  const port = page
    .locator('app-number-input-basic-example')
    .getByRole('spinbutton', { name: 'Listen port' });
  await expect(port).toBeVisible();
  await expect(port).toHaveAttribute('hellNumberInput', '');
  await expect(page.locator('app-number-input-basic-example hell-number-input')).toHaveCount(0);
  return port;
}

test.describe('number input accessibility contract', () => {
  test('reflects spinbutton semantics and steps with the keyboard', async ({ page }) => {
    const port = await gotoNumberInput(page);

    await expect(port).toHaveAttribute('aria-valuenow', '8080');
    await expect(port).toHaveAttribute('aria-valuemin', '1');
    await expect(port).toHaveAttribute('aria-valuemax', '65535');
    await expect(port).toHaveAttribute('inputmode', 'numeric');

    await port.focus();

    await page.keyboard.press('ArrowUp');
    await expect(port).toHaveValue('8081');
    await expect(port).toHaveAttribute('aria-valuenow', '8081');

    await page.keyboard.press('ArrowDown');
    await expect(port).toHaveValue('8080');

    await page.keyboard.press('Shift+ArrowUp');
    await expect(port).toHaveValue('8090');

    await page.keyboard.press('Home');
    await expect(port).toHaveValue('1');
    await expect(port).toHaveAttribute('aria-valuenow', '1');

    await page.keyboard.press('End');
    await expect(port).toHaveValue('65535');
    await expect(port).toHaveAttribute('aria-valuenow', '65535');
  });

  test('does not change the value when scrolling over the focused field', async ({ page }) => {
    const port = await gotoNumberInput(page);

    await port.focus();
    await expect(port).toHaveValue('8080');
    await port.hover();
    await page.mouse.wheel(0, 240);
    await page.mouse.wheel(0, -240);

    await expect(port).toHaveValue('8080');
    await expect(port).toHaveAttribute('aria-valuenow', '8080');
  });

  test('repeats stepping while a stepper button is held', async ({ page }) => {
    const port = await gotoNumberInput(page);
    const increment = page
      .locator('app-number-input-basic-example')
      .getByRole('button', { name: 'Increase Listen port' });

    // hover() scrolls the button into the viewport before positioning the
    // pointer; raw boundingBox coordinates can sit below the fold, where a
    // pressed button never receives the pointerdown.
    await increment.hover();
    await page.mouse.down();
    // The first step lands on press; poll so a browser that renders the
    // pressed value asynchronously still observes it.
    await expect
      .poll(async () => Number(await port.inputValue()), { timeout: 10_000 })
      .toBeGreaterThan(8080);
    // A slow browser may already have crossed the hold delay before this
    // read, so capture its post-press baseline.
    const pressed = Number(await port.inputValue());
    // Holding repeats beyond that observed baseline before release.
    await expect
      .poll(async () => Number(await port.inputValue()), { timeout: 10_000 })
      .toBeGreaterThan(pressed);
    await page.mouse.up();

    // Releasing stops the repetition; the value settles.
    const held = Number(await port.inputValue());
    await page.waitForTimeout(200);
    expect(Number(await port.inputValue())).toBe(held);
  });

  test('uses explicit directional targets and consumer-owned suffix semantics', async ({ page }) => {
    await gotoNumberInput(page);
    const basic = page.locator('app-number-input-basic-example');
    const increment = basic.getByRole('button', { name: 'Increase Listen port' });
    const decrement = basic.getByRole('button', { name: 'Decrease Listen port' });

    await expect(increment).toHaveAttribute('data-direction', 'increment');
    await expect(decrement).toHaveAttribute('data-direction', 'decrement');

    const duration = page.locator('app-number-input-duration-seconds-example');
    const interval = duration.getByRole('spinbutton', { name: 'Announce interval' });
    await expect(duration.getByText('seconds', { exact: true })).toBeVisible();
    await expect(interval).toHaveAttribute('aria-valuetext', '30 seconds');

    await interval.focus();
    await page.keyboard.press('ArrowUp');
    await expect(interval).toHaveValue('35');
    await expect(interval).toHaveAttribute('aria-valuetext', '35 seconds');
  });

  test('commits a pending typed draft before a stepper click', async ({ page }) => {
    const port = await gotoNumberInput(page);
    const increment = page
      .locator('app-number-input-basic-example')
      .getByRole('button', { name: 'Increase Listen port' });

    // Commit a baseline value with the keyboard.
    await port.focus();
    await page.keyboard.press('ArrowUp');
    await expect(port).toHaveValue('8081');

    // Type a fresh value without committing it (no blur / Enter), then click +.
    await port.fill('500');
    await increment.click();

    // The draft commits first (500), then a single step lands → 501, never 8082.
    await expect(port).toHaveValue('501');
    await expect(port).toHaveAttribute('aria-valuenow', '501');
  });

  test('keeps a static, axe-clean spinbutton when the field is empty', async ({ page }) => {
    const port = await gotoNumberInput(page);

    await port.fill('');
    await port.blur();
    await expect(port).toHaveValue('');

    // Role and bounds are static; only aria-valuenow drops while the value is null.
    await expect(port).toHaveAttribute('role', 'spinbutton');
    await expect(port).toHaveAttribute('aria-valuemin', '1');
    await expect(port).toHaveAttribute('aria-valuemax', '65535');
    expect(await port.getAttribute('aria-valuenow')).toBeNull();

    const results = await new AxeBuilder({ page })
      .include('app-number-input-basic-example')
      .withTags(WCAG_SMOKE_TAGS)
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('keeps the stepper buttons out of the tab order', async ({ page }) => {
    const port = await gotoNumberInput(page);
    const increment = page
      .locator('app-number-input-basic-example')
      .getByRole('button', { name: 'Increase Listen port' });
    const decrement = page
      .locator('app-number-input-basic-example')
      .getByRole('button', { name: 'Decrease Listen port' });

    await expect(increment).toHaveAttribute('tabindex', '-1');
    await expect(decrement).toHaveAttribute('tabindex', '-1');

    // Tab from the field lands past the steppers, never on them.
    await port.focus();
    await page.keyboard.press('Tab');
    await expect(increment).not.toBeFocused();
    await expect(decrement).not.toBeFocused();
  });

  test('flags an out-of-range typed value as invalid without clamping it', async ({ page }) => {
    const port = await gotoNumberInput(page);

    await port.fill('70000');
    await port.blur();

    await expect(port).toHaveValue('70000');
    await expect(port).toHaveAttribute('aria-invalid', 'true');
  });

  test('binds one Signal Forms field with metadata bounds and commit-boundary parse errors', async ({
    page,
  }) => {
    await gotoNumberInput(page);

    const example = page.locator('app-number-input-forms-example');
    const input = example.getByRole('spinbutton', { name: 'Listen port' });
    const state = example.locator('[data-number-input-forms-state]');

    // The field's min()/max() metadata drives the spinbutton ARIA bounds.
    await expect(input).toHaveValue('8080');
    await expect(input).toHaveAttribute('aria-valuemin', '1', { timeout: 15_000 });
    await expect(input).toHaveAttribute('aria-valuemax', '65535');
    await expect(state).toContainText('touched: false');
    await expect(state).toContainText('errors: none');

    // A committed malformed draft stays editable and reports one parse error.
    await input.fill('80x');
    await input.blur();
    await expect(input).toHaveValue('80x');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(state).toContainText('Committed: 8080');
    await expect(state).toContainText('touched: true');
    await expect(state).toContainText('invalidNumberInputDraft');

    // A corrected Enter commit updates the field once and clears the error.
    await input.fill('8443');
    await input.press('Enter');
    await expect(state).toContainText('Committed: 8443');
    await expect(state).toContainText('errors: none');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');

    // Stepping writes the same field authority.
    const increment = example.getByRole('button', { name: 'Increase Listen port' });
    await increment.click();
    await expect(state).toContainText('Committed: 8444');
  });
});
