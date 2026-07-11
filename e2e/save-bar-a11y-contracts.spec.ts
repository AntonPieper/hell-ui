import { expect, test, type Page } from '@playwright/test';

async function gotoSaveBar(page: Page): Promise<void> {
  await page.goto('/components/save-bar');
  await expect(page.getByRole('heading', { name: 'Save bar', level: 1 })).toBeVisible();
}

test.describe('save bar browser accessibility contract', () => {
  test('appears on dirty without stealing focus and announces politely', async ({ page }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-contextual-form-example');
    const bar = example.locator('hell-save-bar');
    await expect(bar).toBeHidden();

    const name = example.getByRole('textbox', { name: 'Display name' });
    await name.click();
    await name.pressSequentially(' Jr.');

    // The bar appears in normal flow while typing continues uninterrupted.
    await expect(bar).toBeVisible();
    await expect(name).toBeFocused();
    await expect(bar).toHaveAttribute('data-mode', 'contextual');

    // The message reaches screen readers once, through the polite CDK announcer,
    // not through a live region on the bar itself.
    const announcer = page.locator('.cdk-live-announcer-element');
    await expect(announcer).toHaveAttribute('aria-live', 'polite');
    await expect(announcer).toHaveText('You have unsaved changes');
    await expect(bar.locator('[aria-live]')).toHaveCount(0);
  });

  test('sticks to the bottom of the nearest scroll container in normal flow', async ({ page }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-sticky-scroll-example');
    const container = example.locator('div[class*="overflow-y-auto"]');
    const bar = example.locator('hell-save-bar');
    await expect(bar).toBeHidden();

    const field = example.getByRole('textbox', { name: 'Trunk name' });
    await field.click();
    await field.pressSequentially('x');
    await expect(bar).toBeVisible();

    // The container actually scrolls and the bar docks to its visible bottom.
    expect(
      await container.evaluate((element) => element.scrollHeight > element.clientHeight),
    ).toBe(true);

    const containerBottom = async () => {
      const box = await container.boundingBox();
      if (!box) throw new Error('Expected the scroll container to have a box.');
      return box.y + box.height;
    };
    const barBottom = async () => {
      const box = await bar.boundingBox();
      if (!box) throw new Error('Expected the save bar to have a box.');
      return box.y + box.height;
    };

    expect(Math.abs((await barBottom()) - (await containerBottom()))).toBeLessThanOrEqual(8);

    // Scrolled to the end, the bar still closes the container without
    // overlapping the last field.
    await container.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
    expect(Math.abs((await barBottom()) - (await containerBottom()))).toBeLessThanOrEqual(8);

    const lastField = example.getByRole('textbox', { name: 'Notes' });
    const lastFieldBox = await lastField.boundingBox();
    const barBox = await bar.boundingBox();
    if (!lastFieldBox || !barBox) throw new Error('Expected boxes for overlap check.');
    expect(lastFieldBox.y + lastFieldBox.height).toBeLessThanOrEqual(barBox.y + 1);
  });

  test('actions are keyboard-reachable in document order and operable', async ({ page }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-contextual-form-example');
    const bar = example.locator('hell-save-bar');
    const email = example.getByRole('textbox', { name: 'Email' });
    await email.click();
    await email.press('End');
    await email.pressSequentially('x');
    await expect(bar).toBeVisible();

    // Tab order continues from the fields straight into the bar's actions.
    await page.keyboard.press('Tab');
    await expect(bar.getByRole('button', { name: 'Discard' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(bar.getByRole('button', { name: 'Save' })).toBeFocused();

    // Keyboard activation works: discarding resets the form and hides the bar.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await expect(bar).toBeHidden();
  });

  test('busy gates both actions and resolves back to a hidden contextual bar', async ({ page }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-contextual-form-example');
    const bar = example.locator('hell-save-bar');
    const name = example.getByRole('textbox', { name: 'Display name' });
    await name.click();
    await name.pressSequentially(' Jr.');
    await expect(bar).toBeVisible();

    await bar.getByRole('button', { name: 'Save' }).click();
    await expect(bar).toHaveAttribute('data-busy', '');
    await expect(bar.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(bar.getByRole('button', { name: 'Discard' })).toBeDisabled();

    // The simulated mutation resolves, the form goes pristine, the bar leaves.
    await expect(bar).toBeHidden({ timeout: 3_000 });
  });

  test('reduced motion suppresses the slide-in transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-contextual-form-example');
    const bar = example.locator('hell-save-bar');
    const name = example.getByRole('textbox', { name: 'Display name' });
    await name.click();
    await name.pressSequentially(' Jr.');
    await expect(bar).toBeVisible();

    expect(await bar.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    expect(await bar.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'hell-save-bar-in',
    );
  });
});
