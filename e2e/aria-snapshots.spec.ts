import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectNamedAriaSnapshot(locator: Locator, name: string): Promise<void> {
  await expect(locator).toMatchAriaSnapshot({ name, timeout: 10_000 });
}

async function gotoDocsPage(page: Page, path: string, heading: string | RegExp): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

async function openBasicMenu(page: Page): Promise<Locator> {
  await gotoDocsPage(page, '/components/menu', 'Menu');
  await page.getByRole('button', { name: 'Actions' }).first().click();

  const menu = page.getByRole('menu').first();
  await expect(menu).toBeVisible();
  return menu;
}

test.describe('public docs aria snapshots', () => {
  test('accordion snapshot records heading buttons and named expanded panel state', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/accordion', 'Accordion');

    const example = page.locator('app-accordion-single-collapsible-example');
    await expect(example).toBeVisible();
    await expect(example.getByRole('button', { name: 'Installation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await expectNamedAriaSnapshot(example, 'accordion-single-open.aria.yml');
  });

  test('dialog snapshot records the named modal surface and actions', async ({ page }) => {
    await gotoDocsPage(page, '/components/dialog', 'Dialog');
    await page.getByRole('button', { name: 'Publish article' }).click();

    const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
    await expect(dialog).toBeVisible();

    await expectNamedAriaSnapshot(dialog, 'dialog-publish-open.aria.yml');
  });

  test('menu snapshot records action roles, names, and disabled state', async ({ page }) => {
    const menu = await openBasicMenu(page);

    await expectNamedAriaSnapshot(menu, 'menu-actions-open.aria.yml');
  });

  test('select snapshots record the expanded trigger and option roles', async ({ page }) => {
    await gotoDocsPage(page, '/components/select', 'Select');

    const select = page.getByRole('combobox', { name: 'Select priority' }).first();
    await select.focus();
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveAttribute('aria-expanded', 'true');

    const options = page.getByRole('listbox').first();
    await expect(options).toBeVisible();

    await expectNamedAriaSnapshot(select, 'select-trigger-open.aria.yml');
    await expectNamedAriaSnapshot(options, 'select-options-open.aria.yml');
  });

  test('combobox snapshots record the filtered input and option roles', async ({ page }) => {
    await gotoDocsPage(page, '/components/combobox', 'Combobox');

    const input = page.getByRole('combobox', { name: 'Search fruit…' }).first();
    await input.fill('Bl');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'Blueberry' })).toBeVisible();

    const options = page.getByRole('listbox').first();
    await expect(options).toBeVisible();

    await expectNamedAriaSnapshot(input, 'combobox-input-filtered.aria.yml');
    await expectNamedAriaSnapshot(options, 'combobox-options-filtered.aria.yml');
  });

  test('omnibar snapshots record the expanded searchbox and async results', async ({ page }) => {
    await gotoDocsPage(page, '/components/omnibar', 'Omnibar');

    const input = page.getByRole('combobox', { name: 'Search people' });
    await input.fill('user');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: /User 1/ }).first()).toBeVisible();

    const results = page.getByRole('listbox').first();
    await expect(results).toBeVisible();

    await expectNamedAriaSnapshot(input, 'omnibar-input-results.aria.yml');
    await expectNamedAriaSnapshot(results, 'omnibar-results-listbox.aria.yml');
  });

  test('progress snapshots record visible labels and value states', async ({ page }) => {
    await gotoDocsPage(page, '/components/progress', 'Progress');

    const examples = page.locator('app-progress-examples-example');
    await expect(examples).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Queued migration' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    await expect(page.getByRole('progressbar', { name: 'Profile import' })).toHaveAttribute(
      'aria-valuenow',
      '33',
    );
    await expect(page.getByRole('progressbar', { name: 'Media processing' })).toHaveAttribute(
      'aria-valuenow',
      '66',
    );
    await expect(page.getByRole('progressbar', { name: 'Backup complete' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );

    await expectNamedAriaSnapshot(examples, 'progress-labeled-values.aria.yml');
  });

  test('radio snapshots record group labels and checked states', async ({ page }) => {
    await gotoDocsPage(page, '/components/radio', 'Radio');

    const vertical = page.locator('app-radio-example-example');
    const horizontal = page.locator('app-radio-horizontal-example');
    await expect(vertical).toBeVisible();
    await expect(horizontal).toBeVisible();

    await expectNamedAriaSnapshot(vertical, 'radio-plan-group.aria.yml');
    await expectNamedAriaSnapshot(horizontal, 'radio-size-group.aria.yml');
  });

  test('table utility snapshot records active row semantics and cell action name', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/data-table', 'Table utilities');

    const masterDetail = page.locator('app-data-table-example-example');
    await expect(masterDetail).toBeVisible();

    const firstRow = masterDetail.getByRole('row', { name: /User 1/ }).first();
    const open = firstRow.getByRole('button', { name: 'Open details for User 1' });
    await expect(open).toBeVisible();
    await open.click();
    await expect(firstRow).toHaveAttribute('data-active', 'true');
    await expect(firstRow).not.toHaveAttribute('aria-selected');
    await expect(firstRow).not.toHaveAttribute('tabindex');

    await expectNamedAriaSnapshot(firstRow, 'table-utilities-row-cell-action.aria.yml');
  });
});
