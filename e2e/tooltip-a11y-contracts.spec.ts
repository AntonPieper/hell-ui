import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoTooltip(page: Page): Promise<void> {
  await page.goto('/components/tooltip');
  await expect(page.getByRole('heading', { name: 'Tooltip', level: 1 })).toBeVisible();
}

async function expectDescribedBy(trigger: Locator, tooltip: Locator): Promise<void> {
  await expect(tooltip).toHaveAttribute('role', 'tooltip');
  await expect(tooltip).toHaveAttribute('id', /.+/);

  const tooltipId = await tooltip.getAttribute('id');
  if (!tooltipId) throw new Error('Tooltip must expose a non-empty id.');

  await expect(trigger).toHaveAttribute('aria-describedby', tooltipId);
}

test.describe('tooltip browser accessibility contract', () => {
  test('focus opens a described tooltip and Escape closes it', async ({ page }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Top' });
    const tooltip = page.getByRole('tooltip', { name: "I'm on top" });

    await trigger.focus();
    await expect(trigger).toBeFocused();
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute('data-open', '');
    await expectDescribedBy(trigger, tooltip);

    await page.keyboard.press('Escape');
    await expect(tooltip).toBeHidden();
    await expect(trigger).not.toHaveAttribute('aria-describedby');
    await expect(trigger).not.toHaveAttribute('data-open');
    await expect(trigger).toBeFocused();
  });

  test('hover respects configured show and hide delays', async ({ page }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Hover for 600ms' });
    const tooltip = page.getByRole('tooltip', { name: 'Took my time' });

    await trigger.hover();
    await page.waitForTimeout(300);
    await expect(tooltip).toBeHidden();

    await page.waitForTimeout(350);
    await expect(tooltip).toBeVisible();
    await expectDescribedBy(trigger, tooltip);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(150);
    await expect(tooltip).toBeVisible();

    await expect(tooltip).toBeHidden({ timeout: 1_000 });
    await expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  test('hoverable tooltip content stays open while the pointer is over the tooltip', async ({
    page,
  }) => {
    await gotoTooltip(page);

    const trigger = page.getByRole('button', { name: 'Hoverable' });
    const tooltip = page.getByRole('tooltip', {
      name: 'Stays open while you hover this hint.',
    });

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute('data-hoverable', '');
    await expect(tooltip).toHaveCSS('pointer-events', 'auto');
    await expectDescribedBy(trigger, tooltip);

    const box = await tooltip.boundingBox();
    if (!box) throw new Error('Expected hoverable tooltip to have a layout box.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await page.waitForTimeout(300);
    await expect(tooltip).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-describedby', /.+/);

    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden({ timeout: 1_000 });
    await expect(trigger).not.toHaveAttribute('aria-describedby');
  });
});
