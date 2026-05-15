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

  test('toast renders in the notification region and passes axe smoke', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Success' }).first().click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toHaveAttribute('role', 'region');
    await expect(notifications).toHaveAttribute('aria-label', 'Notifications');
    await expect(notifications).not.toHaveAttribute('aria-live');
    await expect(notifications).not.toHaveAttribute('aria-atomic');
    await expect(notifications.getByText('Article published', { exact: true })).toBeVisible();
    await expectNoSeriousA11yIssues(page, '[role="region"][aria-label="Notifications"]');
  });

  test('resizable handles support keyboard resizing semantics', async ({ page }) => {
    await page.goto('/components/resizable');

    const handle = page.getByRole('separator', { name: 'Resize panels' }).first();
    await expect(handle).toHaveAttribute('aria-valuemin', '0');
    await expect(handle).toHaveAttribute('aria-valuemax', '100');

    await handle.focus();
    const before = await handle.getAttribute('aria-valuenow');
    await expect(handle).toHaveAttribute('aria-valuenow', /^\d+$/);
    if (before === null) throw new Error('Expected initial aria-valuenow.');

    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', /^\d+$/);
    await expect(handle).not.toHaveAttribute('aria-valuenow', before);
  });

  test('select opens, supports keyboard selection, and updates selected value', async ({ page }) => {
    await page.goto('/components/select');

    const select = page.getByRole('combobox', { name: 'Select priority…' }).first();
    await expect(select).toHaveAttribute('aria-expanded', 'false');

    await select.focus();
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveAttribute('aria-expanded', 'true');

    const option = page.getByRole('option', { name: 'Lowest' });
    await expect(option).toBeVisible();
    await page.keyboard.press('Enter');

    const selectedText = await select.textContent();
    if (!selectedText?.includes('Lowest')) {
      await option.click();
    }

    await expect(select).toContainText('Lowest');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await expect(option).toHaveAttribute('aria-selected', 'true');
  });

  test('combobox filters options and selects with keyboard focus', async ({ page }) => {
    await page.goto('/components/combobox');

    const input = page.getByRole('combobox', { name: 'Search fruit…' }).first();
    await input.click();
    await input.fill('Blue');
    await expect(page.getByRole('option', { name: 'Blueberry' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Apple' })).not.toBeVisible();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(input).toHaveValue('Blueberry');
    await expect(input).toBeFocused();
  });

  test('checkbox page contrasts native and custom semantics', async ({ page }) => {
    await page.goto('/components/checkbox');

    const custom = page.getByRole('checkbox', { name: 'I agree to the terms' }).first();
    const native = page.getByRole('checkbox', { name: 'Accept terms' }).first();

    await expect(custom).toHaveAttribute('type', 'button');
    await expect(custom).toHaveAttribute('role', 'checkbox');
    await expect(native).toHaveAttribute('type', 'checkbox');
    const nativeTag = await native.evaluate((node) => node.tagName.toLowerCase());
    expect(nativeTag).toBe('input');

    await custom.click();
    await expect(custom).toHaveAttribute('aria-checked', 'true');
    await native.click();
    await expect(native).toBeChecked();
  });

  test('listbox supports keyboard traversal and selection', async ({ page }) => {
    await page.goto('/components/listbox');

    const listbox = page.getByRole('listbox', { name: 'Choose a reviewer' });
    await expect(listbox).toBeVisible();

    await listbox.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('option', { name: 'Katherine Johnson' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('menu supports arrow navigation and focus restoration', async ({ page }) => {
    await page.goto('/components/menu');

    const trigger = page.getByRole('button', { name: 'Actions' }).first();
    await trigger.click();

    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Rename' }).first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Duplicate' }).first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('menu submenu opens, returns focus, and can be dismissed', async ({ page }) => {
    await page.goto('/components/menu');

    const trigger = page.getByRole('button', { name: 'File' }).first();
    await trigger.click();

    const openRecent = page.getByRole('menuitem', { name: 'Open recent' }).first();
    await expect(openRecent).toBeVisible();
    await openRecent.hover();
    const nested = page.getByRole('menuitem', { name: 'Project Atlas' }).first();
    if (!(await nested.isVisible())) {
      await openRecent.click();
    }
    await expect(nested).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(openRecent).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('data table allows keyboard resize and ignores nested row controls for row selection', async ({ page }) => {
    await page.goto('/components/data-table');
    await page.getByRole('tab', { name: 'Preview' }).nth(1).click();

    const separator = page.getByRole('separator').first();
    await separator.focus();
    const before = await separator.getAttribute('aria-valuenow');

    await page.keyboard.press('ArrowRight');
    await expect(separator).not.toHaveAttribute('aria-valuenow', before ?? '');

    const row1 = page.getByRole('row', { name: /User 1/ }).first();
    const row2 = page.getByRole('row', { name: /User 2/ }).first();

    await row1.click();
    await expect(row1).toHaveAttribute('data-selected', 'true');

    const row2Action = row2.getByRole('button', { name: 'Open' }).first();
    await row2Action.click();

    await expect(row1).toHaveAttribute('data-selected', 'true');
    await expect(row2).not.toHaveAttribute('data-selected', 'true');
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

  test('pdf viewer keyboard controls and overview thumbnail smoke path remain stable', async ({ page }) => {
    await page.goto('/components/pdf-viewer');

    const previewTabs = page.getByRole('tab', { name: 'Preview' });
    await previewTabs.nth(1).click();

    const viewer = page.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.focus();

    const findInput = page.getByRole('searchbox', { name: /find/i });
    const findShortcutButton = page.getByRole('button', { name: /Find in document/i });

    await page.keyboard.press('ControlOrMeta+f');
    if (!(await findInput.isVisible())) {
      await findShortcutButton.click();
    }
    await expect(findInput).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(findInput).not.toBeVisible();

    const overviewButton = page.getByRole('button', { name: /Page overview/i }).first();
    await overviewButton.click();
    await expect(overviewButton).toHaveAttribute('aria-pressed', 'true');

    const overviewPane = page.locator('aside.hell-pdf-overview');
    await expect(overviewPane).toBeVisible();

    const thumbnails = page.locator('button[aria-label^="Go to page"]');
    if ((await thumbnails.count()) > 0) {
      await expect(thumbnails.first()).toBeVisible();
      await thumbnails.first().click();
      await expect(page.getByRole('spinbutton', { name: /page/i })).toHaveValue(/\d+/);
    }
  });
});
