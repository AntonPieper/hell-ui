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

  test('opens without moving the outside sibling action', async ({ page }) => {
    const { example, trigger } = flyoutExample(page);
    const outsideAction = example.getByRole('button', { name: 'Outside boundary action' });

    const before = await topOffset(outsideAction);
    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Anchored, non-modal' })).toBeVisible();
    const after = await topOffset(outsideAction);

    expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
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

function flyoutExample(page: Page): { example: Locator; trigger: Locator } {
  const example = page.locator('app-flyout-example-boundary-keeps-siblings-interactive-example');
  return {
    example,
    trigger: example.getByRole('button', { name: /^(Show|Hide) flyout$/ }),
  };
}

async function topOffset(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected element to have a bounding box.');
  return box.y;
}
