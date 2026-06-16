import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('flyout browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await gotoFlyoutDocs(page);
  });

  test('exposes a named non-modal dialog with trigger relationships', async ({ page }) => {
    const { example, trigger } = flyoutExample(page);

    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toHaveAttribute('aria-controls', /.+/);

    await trigger.click();

    const panel = page.getByRole('dialog', { name: 'Anchored, non-modal' });
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-modal', 'false');
    await expect(panel).toHaveAttribute('aria-labelledby', 'boundary-flyout-title');
    await expect(panel).not.toHaveAttribute('aria-label', /.+/);
    await expect(panel.getByRole('button', { name: 'Review settings' })).toBeVisible();

    const panelId = await panel.getAttribute('id');
    expect(panelId).toMatch(/^hell-flyout-\d+$/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('aria-controls', panelId ?? '');
    await expect(example.getByLabel('Sibling input within boundary')).toBeVisible();
  });

  test('keeps tab order non-modal inside the boundary and closes on outside focus', async ({
    page,
  }) => {
    const { example, trigger } = flyoutExample(page);

    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Anchored, non-modal' });
    await expect(panel).toBeVisible();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(example.getByLabel('Sibling input within boundary')).toBeFocused();
    await expect(panel).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(panel.getByRole('button', { name: 'Review settings' })).toBeFocused();
    await expect(panel).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(example.getByRole('button', { name: 'Outside boundary action' })).toBeFocused();
    await expect(panel).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens as anchored floating UI without moving surrounding content', async ({ page }) => {
    const { example, input, trigger } = flyoutExample(page);
    const outsideAction = example.getByRole('button', { name: 'Outside boundary action' });

    await trigger.scrollIntoViewIfNeeded();
    const beforeOutside = await requiredBox(outsideAction, 'outside action before open');
    const beforeBoundary = await requiredBox(example.locator('.hd-flyout-boundary'), 'boundary');

    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Anchored, non-modal' });
    await expect(panel).toBeVisible();

    const afterOutside = await requiredBox(outsideAction, 'outside action after open');
    const afterBoundary = await requiredBox(example.locator('.hd-flyout-boundary'), 'boundary');
    expect(Math.abs(afterOutside.y - beforeOutside.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(afterBoundary.height - beforeBoundary.height)).toBeLessThanOrEqual(1);

    const inputBox = await requiredBox(input, 'input anchor');
    const panelBox = await requiredBox(panel, 'panel');
    await expectAnchoredToReference(panel, inputBox, panelBox);
    expect(Math.abs(panelBox.x - inputBox.x)).toBeLessThanOrEqual(2);

    await page.mouse.wheel(0, 120);
    await expect
      .poll(async () => {
        const scrolledInput = await requiredBox(input, 'scrolled input anchor');
        const scrolledPanel = await requiredBox(panel, 'scrolled panel');
        return Math.abs(scrolledPanel.x - scrolledInput.x);
      })
      .toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(panel).toBeVisible();
    const resizedInput = await requiredBox(input, 'resized input anchor');
    const resizedPanel = await requiredBox(panel, 'resized panel');
    await expectAnchoredToReference(panel, resizedInput, resizedPanel);
  });

  test('Escape closes the flyout and restores focus to the trigger', async ({ page }) => {
    const { trigger } = flyoutExample(page);

    await trigger.click();
    const panel = page.getByRole('dialog', { name: 'Anchored, non-modal' });
    const panelAction = panel.getByRole('button', { name: 'Review settings' });
    await panelAction.focus();
    await expect(panelAction).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(panel).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

async function gotoFlyoutDocs(page: Page): Promise<void> {
  await page.goto('/components/flyout');
  await expect(page.getByRole('heading', { name: 'Flyout', level: 1 })).toBeVisible();
}

function flyoutExample(page: Page): { example: Locator; input: Locator; trigger: Locator } {
  const example = page.locator('app-flyout-example-boundary-keeps-siblings-interactive-example');
  return {
    example,
    input: example.getByLabel('Sibling input within boundary'),
    trigger: example.getByRole('button', { name: /^(Show|Hide) flyout$/ }),
  };
}

async function requiredBox(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Expected ${label} to have a bounding box.`);
  return box;
}

async function expectAnchoredToReference(
  panel: Locator,
  referenceBox: { y: number; height: number },
  panelBox: { y: number; height: number },
) {
  const placement = (await panel.getAttribute('data-placement')) ?? 'bottom';
  expect(placement).toMatch(/^bottom/);
  expect(panelBox.y).toBeGreaterThanOrEqual(referenceBox.y + referenceBox.height);
}
