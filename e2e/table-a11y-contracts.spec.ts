import { expect, test, type Locator, type Page } from '@playwright/test';

const TABLE_A11Y_HARNESS_PATH = '/components/data-table?tableA11yHarness=1';

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

    await trigger.click();

    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(nameHeader).toHaveAttribute('data-sort', 'asc');
    await expect(trigger).toBeFocused();

    await expectNamedAriaSnapshot(table, 'table-sortable-ascending.aria.yml');
  });

  test('active master detail uses row action state without selected or checked semantics', async ({
    page,
  }) => {
    const section = page.getByTestId('active-editor-section');
    const adaRow = section.getByRole('row', { name: /Ada Lovelace/ });
    const openEditor = adaRow.getByRole('button', { name: 'Open editor for Ada Lovelace' });

    await openEditor.click();

    await expect(adaRow).toHaveAttribute('data-active', 'true');
    await expect(adaRow).not.toHaveAttribute('data-selected');
    await expect(adaRow).not.toHaveAttribute('aria-selected');
    await expect(adaRow).not.toHaveAttribute('tabindex');
    await expect(openEditor).toHaveAttribute('aria-controls', 'table-a11y-active-editor-pane');
    await expect(openEditor).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('active-editor-pane')).toContainText('Editing Ada Lovelace.');

    await expectNamedAriaSnapshot(section, 'table-active-master-detail-editor.aria.yml');
  });

  test('checkbox and radio row selection expose checked controls without row-as-button semantics', async ({
    page,
  }) => {
    const section = page.getByTestId('selection-table-section');
    const adaRow = section.getByRole('row', { name: /Ada Lovelace/ });
    const graceRow = section.getByRole('row', { name: /Grace Hopper/ });
    const adaCheckbox = section.getByRole('checkbox', {
      name: 'Select Ada Lovelace for bulk actions',
    });
    const graceRadio = section.getByRole('radio', {
      name: 'Choose Grace Hopper as the primary row',
    });

    await adaCheckbox.check();
    await graceRadio.check();

    await expect(adaCheckbox).toBeChecked();
    await expect(graceRadio).toBeChecked();
    await expect(adaRow).toHaveAttribute('data-selected', 'true');
    await expect(graceRow).toHaveAttribute('data-selected', 'true');
    await expect(adaRow).not.toHaveAttribute('aria-selected');
    await expect(graceRow).not.toHaveAttribute('aria-selected');
    await expect(adaRow).not.toHaveAttribute('tabindex');
    await expect(graceRow).not.toHaveAttribute('tabindex');

    await expectNamedAriaSnapshot(section, 'table-checkbox-radio-row-selection.aria.yml');
  });

  test('column visibility panel exposes a named checkbox group with required and hidden notes', async ({
    page,
  }) => {
    const section = page.getByTestId('column-panel-section');
    const panel = section.locator('hell-column-visibility-panel');
    const group = panel.getByRole('group', { name: 'Harness columns' });
    const name = panel.getByRole('checkbox', { name: 'Name' });
    const email = panel.getByRole('checkbox', { name: 'Email' });
    const role = panel.getByRole('checkbox', { name: 'Role' });

    await expect(group).toBeVisible();
    await expect(name).toBeChecked();
    await expect(name).toBeDisabled();
    await expect(email).toBeChecked();
    await expect(role).not.toBeChecked();
    await expect(panel.getByText('Required').first()).toBeVisible();
    await expect(panel.getByText('Initially hidden')).toBeVisible();

    await email.uncheck();

    await expect(email).not.toBeChecked();
    await expect(panel.getByRole('button', { name: 'Reset columns' })).toBeEnabled();

    await expectNamedAriaSnapshot(panel, 'table-column-visibility-panel.aria.yml');
  });

  test('explicit grid mode is opt-in, single-tab-stop, and exposes grid indexes', async ({
    page,
  }) => {
    const section = page.getByTestId('grid-table-section');
    const grid = page.getByTestId('grid-table');
    const selectedRow = grid.getByRole('row', { name: /Ada Lovelace Admin/ });
    const action = grid.getByRole('button', { name: 'Edit Ada Lovelace' });

    await expect(grid).toHaveAttribute('role', 'grid');
    await expect(grid).toHaveAttribute('tabindex', '0');
    await expect(grid).toHaveAttribute('aria-rowcount', '3');
    await expect(grid).toHaveAttribute('aria-colcount', '3');
    await expect(grid).toHaveAttribute('aria-activedescendant', 'grid-name');
    await expect(section.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(action).toHaveAttribute('tabindex', '-1');
    await expect(selectedRow).toHaveAttribute('aria-selected', 'true');
    await expect(grid.getByRole('gridcell', { name: 'Ada Lovelace', exact: true })).toHaveAttribute(
      'aria-colindex',
      '1',
    );

    await grid.focus();
    await page.keyboard.press('ArrowRight');

    await expect(grid).toBeFocused();
    await expect(grid).toHaveAttribute('aria-activedescendant', 'grid-role');

    await expectNamedAriaSnapshot(grid, 'table-explicit-grid-mode.aria.yml');
  });
});
