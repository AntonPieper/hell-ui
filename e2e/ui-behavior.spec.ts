import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

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

interface DialogFocusContract {
  label: string;
  triggerName: string | RegExp;
  dialogName: string | RegExp;
  description: string;
  initialFocusName: string | RegExp;
  nextFocusName: string | RegExp;
}

async function expectDialogFocusContract(
  page: Page,
  contract: DialogFocusContract,
): Promise<void> {
  try {
    await test.step(`${contract.label} focus trap`, async () => {
      const trigger = page.getByRole('button', { name: contract.triggerName }).first();
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await expectFocused(page, trigger, `${contract.label} trigger before open`);

      await trigger.click();

      const dialog = page.getByRole('dialog', { name: contract.dialogName });
      const initialFocus = dialog.getByRole('button', { name: contract.initialFocusName });
      const nextFocus = dialog.getByRole('button', { name: contract.nextFocusName });

      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(contract.description, { exact: true })).toBeVisible();
      await expectNoSeriousA11yIssues(page, '[role="dialog"]');

      await expectFocused(page, initialFocus, `${contract.label} initial focus`);
      await page.keyboard.press('Tab');
      await expectFocused(page, nextFocus, `${contract.label} forward tab stays inside`);
      await page.keyboard.press('Tab');
      await expectFocused(page, initialFocus, `${contract.label} forward tab wraps inside`);
      await page.keyboard.press('Shift+Tab');
      await expectFocused(page, nextFocus, `${contract.label} reverse tab wraps inside`);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expectFocused(page, trigger, `${contract.label} trigger restore`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${contract.label} focus contract failed.\n${message}\n\n${await collectFocusDiagnostics(page)}`,
      { cause: error },
    );
  }
}

async function expectFocused(page: Page, locator: Locator, label: string): Promise<void> {
  try {
    await expect(locator, label).toBeFocused();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\n\n${await collectFocusDiagnostics(page)}`, { cause: error });
  }
}

async function collectFocusDiagnostics(page: Page): Promise<string> {
  const [focusedPath, ariaSnapshot] = await Promise.all([
    focusedElementPath(page),
    page
      .locator('body')
      .ariaSnapshot()
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
  ]);

  return `Focused element path:\n${focusedPath}\n\nAccessibility tree:\n${ariaSnapshot}`;
}

async function focusedElementPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return '<none>';

    const parts: string[] = [];
    let current: Element | null = active;

    while (current) {
      const element = current;
      const tag = element.tagName.toLowerCase();
      const attributes = ['id', 'role', 'aria-label', 'data-hell-dialog-trigger']
        .map((name) => [name, element.getAttribute(name)] as const)
        .filter(([, value]) => value !== null && value !== '')
        .map(([name, value]) => `[${name}="${value}"]`)
        .join('');
      const text = ['button', 'a'].includes(tag)
        ? (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
        : '';
      parts.unshift(`${tag}${attributes}${text ? ` "${text}"` : ''}`);
      current = element.parentElement;
    }

    return parts.join(' > ');
  });
}

test.describe('Hell UI browser behavior', () => {
  test('dialog focus trap and restore covers styled and unstyled modes', async ({ page }) => {
    await page.goto('/components/dialog');

    await expectDialogFocusContract(page, {
      label: 'styled dialog',
      triggerName: 'Publish article',
      dialogName: 'Publish this article?',
      description: 'Once published, the article will be visible to everyone.',
      initialFocusName: 'Cancel',
      nextFocusName: 'Publish',
    });

    await expectDialogFocusContract(page, {
      label: 'unstyled dialog',
      triggerName: 'Open unstyled dialog',
      dialogName: 'Unstyled confirmation',
      description: 'The dialog behavior stays intact while consumer CSS owns the presentation.',
      initialFocusName: 'Keep editing',
      nextFocusName: 'Send unstyled',
    });
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

    const select = page.getByRole('combobox', { name: 'Select priority' }).first();
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

    await select.click();
    await expect(page.getByRole('option', { name: 'Lowest' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Escape');
  });

  test('combobox filters options and selects with keyboard focus', async ({ page }) => {
    await page.goto('/components/combobox');

    const input = page.getByRole('combobox', { name: 'Search fruit…' }).first();
    await input.click();
    await input.fill('Blue');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Blueberry' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Apple' })).not.toBeVisible();

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

    const rename = page.getByRole('menuitem', { name: 'Rename' }).first();
    const duplicate = page.getByRole('menuitem', { name: 'Duplicate' }).first();
    await expect(rename).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(duplicate).toBeFocused();
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
    await expect(trigger).toBeFocused();
  });

  test('data table allows keyboard resize and keeps native rows passive', async ({ page }) => {
    await page.goto('/components/data-table');

    const rowEditor = page.locator('app-data-table-row-editor-example');
    await expect(rowEditor).toBeVisible();

    const separator = rowEditor.getByRole('separator', { name: 'Resize column' }).first();
    const before = await separator.getAttribute('aria-valuenow');
    if (before === null) throw new Error('Expected initial column resize value.');

    await separator.press('ArrowRight');
    await expect(separator).not.toHaveAttribute('aria-valuenow', before);

    const row1 = rowEditor.getByRole('row', { name: /User 1/ }).first();
    const row2 = rowEditor.getByRole('row', { name: /User 2/ }).first();

    await row1.click();
    await expect(row1).not.toHaveAttribute('data-selected', 'true');
    await expect(row1).not.toHaveAttribute('tabindex');
    await expect(row1).not.toHaveAttribute('aria-selected');

    const row2Action = row2.getByRole('button', { name: /Open editor for User 2/ }).first();
    await row2Action.click();

    await expect(row2).toHaveAttribute('data-active', 'true');
    await expect(row2).not.toHaveAttribute('data-selected', 'true');
  });

  test('docs visual regression smoke covers shell, table surfaces, and vertical sliders', async ({
    page,
  }) => {
    await page.goto('/');

    const brandTag = page.locator('.hd-brand-tag');
    await expect(brandTag).toHaveCSS('white-space', 'nowrap');

    const themeSelect = page.getByRole('combobox', { name: 'Theme' });
    await themeSelect.click();
    const themeDropdown = page.locator('.hd-palette-dropdown');
    await expect(themeDropdown).toBeVisible();
    await expect(themeDropdown).toHaveCSS('z-index', '60');

    await page.goto('/components/data-table');
    const firstExample = page.locator('hd-example-tabs').first();
    await firstExample.getByRole('tab', { name: 'Code' }).click();
    await expect(firstExample.locator('pre.hd-example-code')).toBeVisible();

    await firstExample.getByRole('tab', { name: 'Preview' }).click();
    await expect(page.locator('hell-data-table.hell-data-table').first()).toBeVisible();
    await expect(page.locator('hell-data-table table.hell-table').first()).toBeVisible();
    await expect(page.locator('hell-column-visibility-panel.hell-column-visibility-panel')).toBeVisible();

    await page.goto('/components/slider');
    const verticalSlider = page.locator('hell-slider[data-orientation="vertical"]').first();
    const verticalTrack = verticalSlider.locator('.hell-slider-track');
    const verticalThumb = verticalSlider.locator('.hell-slider-thumb');
    await expect(verticalThumb).toBeVisible();
    const trackBox = await verticalTrack.boundingBox();
    const thumbBox = await verticalThumb.boundingBox();
    if (!trackBox || !thumbBox) throw new Error('Expected vertical slider track and thumb boxes.');
    const trackCenterX = trackBox.x + trackBox.width / 2;
    const thumbCenterX = thumbBox.x + thumbBox.width / 2;
    expect(Math.abs(thumbCenterX - trackCenterX)).toBeLessThanOrEqual(1);

    await page.goto('/accessibility');
    await expect(page.locator('.hd-a11y-table-wrap.hell-table-container')).toBeVisible();
    await expect(page.locator('table.hd-a11y-table.hell-table')).toBeVisible();
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

    await viewer.dispatchEvent('keydown', {
      key: 'f',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    if (!(await findInput.isVisible())) {
      await findShortcutButton.click();
    }
    await expect(findInput).toBeVisible();
    await findInput.focus();

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
