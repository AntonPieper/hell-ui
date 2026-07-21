import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoSliderPage(page: Page): Promise<void> {
  await page.goto('/components/slider');
  await expect(page.getByRole('heading', { name: 'Slider', level: 1 })).toBeVisible();
}

async function expectValue(slider: Locator, value: number): Promise<void> {
  await expect(slider).toHaveAttribute('aria-valuenow', String(value));
}

test.describe('slider accessibility contracts', () => {
  test('public docs sliders all have accessible names', async ({ page }) => {
    await gotoSliderPage(page);

    await expect(page.getByRole('slider')).toHaveCount(14);
    await expect(page.getByRole('slider', { name: /.+/ })).toHaveCount(14);
  });

  test('horizontal slider supports APG arrow and Home/End keyboard behavior', async ({ page }) => {
    await gotoSliderPage(page);

    const example = page.locator('app-slider-basic-example');
    const slider = example.getByRole('slider', { name: 'Volume' });
    const value = example.locator('code');

    await expect(slider).toHaveAttribute('aria-valuemin', '0');
    await expect(slider).toHaveAttribute('aria-valuemax', '100');
    await expect(slider).toHaveAttribute('aria-orientation', 'horizontal');
    await expectValue(slider, 50);

    await example.getByText('Volume', { exact: true }).click();
    await expect(slider).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expectValue(slider, 51);
    await expect(value).toHaveText('51%');

    await page.keyboard.press('ArrowUp');
    await expectValue(slider, 52);

    await page.keyboard.press('ArrowLeft');
    await expectValue(slider, 51);

    await page.keyboard.press('ArrowDown');
    await expectValue(slider, 50);

    await page.keyboard.press('End');
    await expectValue(slider, 100);

    await page.keyboard.press('Home');
    await expectValue(slider, 0);
  });

  test('horizontal slider continues track pointerdown into a drag', async ({ page }) => {
    await gotoSliderPage(page);

    const example = page.locator('app-slider-basic-example');
    const host = example.locator('hell-slider').first();
    const track = host.locator('[data-slot="track"]');
    const slider = example.getByRole('slider', { name: 'Volume' });
    const value = example.locator('code');
    const trackBox = await track.boundingBox();
    if (!trackBox) throw new Error('Expected slider track box.');

    const y = trackBox.y + trackBox.height / 2;
    await page.mouse.move(trackBox.x + trackBox.width * 0.2, y);
    await page.mouse.down();
    await expect(host).toHaveAttribute('data-active-drag', 'true');
    await page.mouse.move(trackBox.x + trackBox.width * 0.8, y);
    await page.mouse.up();

    await expect(host).not.toHaveAttribute('data-active-drag', 'true');
    const nextValue = Number(await slider.getAttribute('aria-valuenow'));
    expect(nextValue).toBeGreaterThan(50);
    await expect(value).toHaveText(`${nextValue}%`);
  });

  test('vertical slider exposes orientation and uses the same value keyboard contract', async ({
    page,
  }) => {
    await gotoSliderPage(page);

    const slider = page
      .locator('app-slider-orientation-example')
      .getByRole('slider', { name: 'Vertical low' });

    await expect(slider).toHaveAttribute('aria-orientation', 'vertical');
    await expectValue(slider, 30);

    await slider.focus();
    await page.keyboard.press('ArrowUp');
    await expectValue(slider, 31);

    await page.keyboard.press('ArrowDown');
    await expectValue(slider, 30);

    await page.keyboard.press('End');
    await expectValue(slider, 100);

    await page.keyboard.press('Home');
    await expectValue(slider, 0);
  });

  test('signal forms slider shares one value with the field and reports touched on blur', async ({
    page,
  }) => {
    await gotoSliderPage(page);

    const example = page.locator('app-slider-forms-example');
    const slider = example.getByRole('slider', { name: 'Volume' });
    const value = example.locator('code').first();
    const touched = example.locator('code').last();

    // The field's max(80) validator metadata drives the slider's own bound.
    await expect(slider).toHaveAttribute('aria-valuemax', '80');
    await expectValue(slider, 65);
    await expect(value).toHaveText('65%');
    await expect(touched).toHaveText('false');

    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expectValue(slider, 66);
    await expect(value).toHaveText('66%');

    await page.keyboard.press('End');
    await expectValue(slider, 80);
    await expect(value).toHaveText('80%');
    await expect(touched).toHaveText('false');

    await page.keyboard.press('Tab');
    await expect(touched).toHaveText('true');
  });

  test('disabled slider is named, removed from tab order, and ignores keyboard changes', async ({
    page,
  }) => {
    await gotoSliderPage(page);

    const slider = page
      .locator('app-slider-disabled-example')
      .getByRole('slider', { name: 'Disabled volume' });

    await expect(slider).toHaveAttribute('aria-disabled', 'true');
    await expect(slider).toHaveAttribute('tabindex', '-1');
    await expectValue(slider, 50);

    await slider.focus();
    await expect(slider).toBeFocused();
    await page.keyboard.press('ArrowRight');

    await expectValue(slider, 50);
  });
});
