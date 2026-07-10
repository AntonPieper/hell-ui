import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoNumberInput(page: Page): Promise<Locator> {
  await page.goto('/components/number-input');
  await expect(page.getByRole('heading', { name: 'Number input', level: 1 })).toBeVisible();
  const port = page
    .locator('app-number-input-basic-example')
    .getByRole('spinbutton', { name: 'Listen port' });
  await expect(port).toBeVisible();
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

    const box = await increment.boundingBox();
    if (!box) throw new Error('Expected increment stepper bounding box.');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // The first step lands immediately on press.
    await expect(port).toHaveValue('8081');
    // Holding repeats the step several more times before release.
    await expect
      .poll(async () => Number(await port.inputValue()), { timeout: 2000 })
      .toBeGreaterThan(8083);
    await page.mouse.up();

    // Releasing stops the repetition; the value settles.
    const held = Number(await port.inputValue());
    await page.waitForTimeout(200);
    expect(Number(await port.inputValue())).toBe(held);
  });

  test('flags an out-of-range typed value as invalid without clamping it', async ({ page }) => {
    const port = await gotoNumberInput(page);

    await port.fill('70000');
    await port.blur();

    await expect(port).toHaveValue('70000');
    await expect(port).toHaveAttribute('aria-invalid', 'true');
  });
});
