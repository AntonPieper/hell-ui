import { expect, test, type Locator, type Page } from '@playwright/test';

// The save bar slides in (translate + opacity) on appearance; measuring geometry
// mid-animation is worth a few px and flakes tight pixel comparisons. Wait for a
// settled layout signal — the element's animations finished and two paint frames —
// then compare with an explicit tolerance instead of racing the render. The
// tolerance also absorbs CI scrollbar-width variance (overlay vs classic).
const GEOMETRY_TOLERANCE_PX = 8;

async function gotoSaveBar(page: Page): Promise<void> {
  await page.goto('/components/save-bar');
  await expect(page.getByRole('heading', { name: 'Save bar', level: 1 })).toBeVisible();
}

async function waitForLayoutSettled(locator: Locator): Promise<void> {
  await locator.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {})));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
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
    // Let the slide-in finish before trusting any geometry.
    await waitForLayoutSettled(bar);

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

    // Relative invariant: the bar's bottom edge sits at the container's visible
    // bottom, within a small tolerance for sub-pixel rounding.
    expect(Math.abs((await barBottom()) - (await containerBottom()))).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE_PX,
    );

    // Scrolled to the end, the bar still closes the container without
    // overlapping the last field.
    await container.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
    await waitForLayoutSettled(bar);
    expect(Math.abs((await barBottom()) - (await containerBottom()))).toBeLessThanOrEqual(
      GEOMETRY_TOLERANCE_PX,
    );

    const lastField = example.getByRole('textbox', { name: 'Notes' });
    const lastFieldBox = await lastField.boundingBox();
    const barBox = await bar.boundingBox();
    if (!lastFieldBox || !barBox) throw new Error('Expected boxes for overlap check.');
    // The last field's bottom never crosses into the bar (relative ordering).
    expect(lastFieldBox.y + lastFieldBox.height).toBeLessThanOrEqual(
      barBox.y + GEOMETRY_TOLERANCE_PX,
    );
  });

  test('the default Save emits saved without submitting an enclosing form', async ({ page }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-contextual-form-example');
    const form = example.locator('form');
    const bar = example.locator('hell-save-bar');

    // Instrument the form: count native submit events without swallowing them.
    await form.evaluate((element) => {
      element.dataset['submitCount'] = '0';
      element.addEventListener('submit', () => {
        element.dataset['submitCount'] = String(Number(element.dataset['submitCount'] ?? '0') + 1);
      });
    });

    const name = example.getByRole('textbox', { name: 'Display name' });
    await name.click();
    await name.pressSequentially(' Jr.');
    await expect(bar).toBeVisible();

    // The default Save is type="button": clicking it runs the save (bar goes
    // busy, then resolves hidden) but never triggers the form's native submit.
    await bar.getByRole('button', { name: 'Save' }).click();
    await expect(bar).toHaveAttribute('data-busy', '');
    expect(await form.getAttribute('data-submit-count')).toBe('0');
    await expect(bar).toBeHidden({ timeout: 3_000 });
  });

  test('saveType="submit" saves on Enter and announces the per-instance message', async ({
    page,
  }) => {
    await gotoSaveBar(page);

    const example = page.locator('app-save-bar-form-submit-example');
    const bar = example.locator('hell-save-bar');
    await expect(bar).toBeHidden();

    const subject = example.getByRole('textbox', { name: 'Subject' });
    await subject.click();
    await subject.pressSequentially(' (urgent)');
    await expect(bar).toBeVisible();

    // The per-instance message overrides the Label Contract, both rendered and
    // announced politely.
    await expect(bar.locator('[data-slot="message"]')).toHaveText('You have an unsent fax');
    const announcer = page.locator('.cdk-live-announcer-element');
    await expect(announcer).toHaveText('You have an unsent fax');

    // saveType="submit" wires Save to native submission, so Enter in a field saves.
    await subject.press('Enter');
    await expect(bar).toHaveAttribute('data-busy', '');
    await expect(bar).toBeHidden({ timeout: 3_000 });
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
