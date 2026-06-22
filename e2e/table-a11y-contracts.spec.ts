import { expect, test, type Locator, type Page } from '@playwright/test';

const TABLE_A11Y_HARNESS_PATH = '/components/table?tableA11yHarness=1';

async function gotoTableA11yHarness(page: Page): Promise<void> {
  await page.goto(TABLE_A11Y_HARNESS_PATH);
  await expect(
    page.getByRole('heading', { name: 'Table accessibility harness', level: 1 }),
  ).toBeVisible();
}

async function expectNamedAriaSnapshot(locator: Locator, name: string): Promise<void> {
  await expect(locator).toMatchAriaSnapshot({ name, timeout: 10_000 });
}

test.describe('table layer browser accessibility contracts', () => {
  test.beforeEach(async ({ page }) => {
    await gotoTableA11yHarness(page);
  });

  test('native table primitives keep rows passive and expose table semantics', async ({ page }) => {
    const table = page.getByTestId('native-table');
    const adaRow = table.getByRole('row', { name: /Ada Lovelace/ });

    await expect(table).toBeVisible();
    await expect(table).not.toHaveAttribute('role');
    await expect(table).not.toHaveAttribute('tabindex');
    await expect(table).not.toHaveAttribute('aria-activedescendant');
    await expect(adaRow).not.toHaveAttribute('role');
    await expect(adaRow).not.toHaveAttribute('tabindex');
    await expect(adaRow).not.toHaveAttribute('aria-selected');
    await expect(adaRow.getByRole('button', { name: 'View Ada Lovelace' })).toBeVisible();

    await expectNamedAriaSnapshot(table, 'table-native-primitives.aria.yml');
  });

  test('sortable table puts aria-sort on the header and activation on a native button', async ({
    page,
  }) => {
    const table = page.getByTestId('sortable-table');
    const nameHeader = table.getByRole('columnheader', { name: 'Name' });
    const trigger = nameHeader.getByRole('button', { name: 'Name' });

    await expect(nameHeader).not.toHaveAttribute('tabindex');
    await expect(nameHeader).not.toHaveAttribute('aria-sort');
    await expect(trigger).toHaveAttribute('type', 'button');

    await trigger.focus();
    await expect(trigger).toBeFocused();
    await trigger.press('Enter');

    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(nameHeader).toHaveAttribute('data-sort', 'asc');
    await expect(trigger).toBeFocused();

    await expectNamedAriaSnapshot(table, 'table-sortable-ascending.aria.yml');
  });

  test('checkbox and radio row selection expose checked controls without row-as-button semantics', async ({
    page,
  }) => {
    const section = page.getByTestId('selection-table-section');
    const adaRow = section.getByRole('row', { name: /Ada Lovelace/ });
    const graceRow = section.getByRole('row', { name: /Grace Hopper/ });
    const adaRadio = section.getByRole('radio', {
      name: 'Choose Ada Lovelace as primary',
    });

    await adaRadio.check();

    await expect(adaRadio).toBeChecked();
    await expect(adaRow).toHaveAttribute('data-selected', 'true');
    await expect(graceRow).not.toHaveAttribute('data-selected', 'true');
    await expect(adaRow).not.toHaveAttribute('aria-selected');
    await expect(graceRow).not.toHaveAttribute('aria-selected');
    await expect(adaRow).not.toHaveAttribute('tabindex');
    await expect(graceRow).not.toHaveAttribute('tabindex');

    await expectNamedAriaSnapshot(section, 'table-checkbox-radio-row-selection.aria.yml');
  });

  test('TanStack shell renders expansion through native row context without owning state', async ({
    page,
  }) => {
    const section = page.getByTestId('tanstack-shell-section');
    const table = section.locator('hell-tanstack-table');
    const adaRow = table.getByRole('row', { name: /Ada Lovelace/ }).first();
    const adaDetails = adaRow.getByRole('button', { name: 'Details' });
    const graceRow = table.getByRole('row', { name: /Grace Hopper/ }).first();
    const graceDetails = graceRow.getByRole('button', { name: 'Details' });

    await expect(table).toBeVisible();
    await expect(adaDetails).toHaveAttribute('aria-expanded', 'true');
    await expect(table.getByText('Ada Lovelace expanded.')).toBeVisible();

    await graceDetails.click();

    await expect(graceDetails).toHaveAttribute('aria-expanded', 'true');
    await expect(table.getByText('Grace Hopper expanded.')).toBeVisible();
    await expect(table).not.toHaveAttribute('role');

    await expectNamedAriaSnapshot(section, 'table-tanstack-shell-expanded.aria.yml');
  });
});
