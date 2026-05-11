import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoSeriousA11yIssues(
  page: Page,
  include: string,
  disabledRules: string[] = [],
) {
  const builder = new AxeBuilder({ page }).include(include);
  if (disabledRules.length) builder.disableRules(disabledRules);

  const results = await builder.analyze();

  const serious = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  );
  expect(serious).toEqual([]);
}

test.describe('Hell UI browser behavior', () => {
  test('dialog opens, traps focus, closes with Escape, and passes axe smoke', async ({ page }) => {
    await page.goto('/components/dialog');
    const trigger = page.getByRole('button', { name: 'Publish article' }).first();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
    const cancel = dialog.getByRole('button', { name: 'Cancel' });
    const publish = dialog.getByRole('button', { name: 'Publish' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Once published, the article will be visible to everyone.', { exact: true }),
    ).toBeVisible();
    await expectNoSeriousA11yIssues(page, '[role="dialog"]');

    await publish.focus();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(publish).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('toast announces through a live notification region', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Success' }).first().click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toHaveAttribute('aria-live', 'polite');
    await expect(notifications).toHaveAttribute('aria-atomic', 'true');
    await expect(notifications.getByText('Article published', { exact: true })).toBeVisible();
    await expectNoSeriousA11yIssues(page, '[role="region"][aria-label="Notifications"]');
  });

  test('resizable handles support keyboard resizing semantics', async ({ page }) => {
    await page.goto('/components/resizable');

    const handle = page.getByRole('separator', { name: 'Resize panels' }).first();
    await expect(handle).toHaveAttribute('aria-valuemin', '0');
    await expect(handle).toHaveAttribute('aria-valuemax', '100');

    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', /\d+/);
  });

  test('drop zone keeps nested drag state stable and accepts files', async ({ page }) => {
    await page.goto('/components/drop-zone');

    const dropzone = page.getByRole('button', { name: /Drop files here/ });
    await expect(dropzone).toHaveAttribute('role', 'button');

    const chooserPromise = page.waitForEvent('filechooser');
    await dropzone.click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'browser-smoke.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hell ui'),
    });

    await expect(page.getByText('browser-smoke.txt')).toBeVisible();
  });
});
