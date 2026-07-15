import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function gotoFilterBuilder(page: Page): Promise<void> {
  await page.goto('/components/filter-builder', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Filter Builder', level: 1 })).toBeVisible();
}

function recipesExample(page: Page): Locator {
  return page.locator('app-filter-builder-recipes-example');
}

function asyncEntityExample(page: Page): Locator {
  return page.locator('app-filter-builder-async-entity-example');
}

function dateRangeExample(page: Page): Locator {
  return page.locator('app-filter-builder-date-range-example');
}

async function selectField(
  page: Page,
  root: Locator,
  builderName: string,
  field: string,
): Promise<void> {
  const picker = root.getByRole('combobox', { name: builderName });
  await picker.fill(field);
  await expect(picker).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option', { name: field, exact: true })).toBeVisible();
  await picker.press('Enter');
}

async function addName(page: Page, value: string): Promise<void> {
  const root = recipesExample(page);
  await selectField(page, root, 'People filter builder', 'Name');
  const editor = root.locator('[data-slot="editor"][data-mode="create"][data-field="name"]');
  await editor.getByRole('textbox', { name: 'Name text' }).fill(value);
  await editor.getByRole('button', { name: 'Apply', exact: true }).click();
}

test.describe('Filter Builder browser contract', () => {
  test('text and options recipes create and edit through their typed projected templates', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);

    await addName(page, 'Ada');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Name contains “Ada”');

    await selectField(page, root, 'People filter builder', 'Status');
    const createStatus = root.locator(
      '[data-slot="editor"][data-mode="create"][data-field="status"]',
    );
    const statusInput = createStatus.getByRole('combobox', { name: 'Status option' });
    await statusInput.fill('pau');
    await statusInput.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Paused', exact: true })).toBeVisible();
    await statusInput.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Name contains “Ada”',
      'Status is paused',
    ]);

    await root.getByRole('button', { name: 'Edit Name contains “Ada”' }).click();
    let edit = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="name"]',
    );
    await edit.getByRole('textbox', { name: 'Name text' }).fill('Grace');
    await edit.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(root.locator('[data-slot="tokenLabel"]').first()).toHaveText(
      'Name contains “Grace”',
    );

    await root.getByRole('button', { name: 'Edit Status is paused' }).click();
    edit = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="status"]',
    );
    await edit.getByRole('combobox', { name: 'Status option' }).fill('act');
    await edit.getByRole('combobox', { name: 'Status option' }).press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Active', exact: true })).toBeVisible();
    await edit.getByRole('combobox', { name: 'Status option' }).press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Name contains “Grace”',
      'Status is active',
    ]);
    await expect(root.locator('[data-slot="live"]')).toHaveText('Status is active updated');
  });

  test('Tab leaves an open picker when its query has no active option', async ({ page }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);

    await addName(page, 'Ada');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });
    await expect(picker).toBeFocused();
    await picker.fill('Status');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'Status', exact: true })).toBeVisible();

    await picker.fill('No matching field');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await expect(picker).not.toHaveAttribute('aria-activedescendant', /.+/);
    await expect(page.locator('[hellComboboxDropdown]:visible [role="option"]')).toHaveCount(0);

    await picker.press('Tab');
    await expect(picker).not.toBeFocused();
  });

  test('custom operators display through descriptors and token removal preserves focus continuity', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await addName(page, 'Ada');
    await addName(page, 'Grace');
    await selectField(page, root, 'People filter builder', 'Priority ≥');
    const customEditor = root.locator(
      '[data-slot="editor"][data-mode="create"][data-field="priority"]',
    );
    await customEditor.getByRole('spinbutton', { name: 'Minimum priority' }).fill('4');
    await customEditor.getByRole('button', { name: 'Apply ≥' }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Name contains “Ada”',
      'Name contains “Grace”',
      'Priority ≥ 4',
    ]);

    const tokens = root.locator('[data-slot="token"]');
    await tokens.first().focus();
    await tokens.first().press('Delete');
    await expect(tokens).toHaveCount(2);
    await expect(tokens.first()).toBeFocused();
    await expect(root.locator('[data-slot="live"]')).toHaveText(
      'Name contains “Ada” removed',
    );

    await root.getByRole('button', { name: 'Edit Name contains “Grace”' }).click();
    const edit = page.locator('[hellPopover] [data-slot="editor"][data-mode="edit"]');
    await expect(edit).toBeVisible();
    await page.getByRole('button', { name: 'Collapse sidebar' }).focus();
    await expect(edit).toBeHidden();

    await root.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(tokens).toHaveCount(0);
    await expect(root.locator('[data-slot="live"]')).toHaveText('All filters cleared');
    await expect(picker).toBeFocused();
  });

  test('an application-owned async Search Resource exposes loading, error, create, and edit', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = asyncEntityExample(page);

    await selectField(page, root, 'Owner filter builder', 'Owner');
    let editor = root.locator(
      '[data-slot="editor"][data-mode="create"][data-field="owner"]',
    );
    let input = editor.getByRole('combobox', { name: 'Owner directory' });
    await expect(input).toBeFocused();

    await input.fill('fail');
    await input.press('ArrowDown');
    let dropdown = page.locator('[hellComboboxDropdown]:visible');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await expect(dropdown.getByRole('alert')).toHaveText(
      'Owner directory unavailable. Try another query.',
    );
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);

    await input.fill('grace');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await expect(page.getByRole('option', { name: /Grace Hopper/ })).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner is Grace Hopper');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner is Grace Hopper added');

    await root.getByRole('button', { name: 'Edit Owner is Grace Hopper' }).click();
    editor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="owner"]',
    );
    input = editor.getByRole('combobox', { name: 'Owner directory' });
    await input.fill('linus');
    await input.press('ArrowDown');
    dropdown = page.locator('[hellComboboxDropdown]:visible');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await expect(page.getByRole('option', { name: /Linus Torvalds/ })).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner is Linus Torvalds');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner is Linus Torvalds updated');
  });

  test('nested date calendar Escape is layered before editor cancellation and focus restoration', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = dateRangeExample(page);
    const picker = root.getByRole('combobox', { name: 'Created date filter builder' });

    await selectField(page, root, 'Created date filter builder', 'Created date');
    let editor = root.locator(
      '[data-slot="editor"][data-mode="create"][data-field="created"]',
    );
    let from = editor.getByRole('textbox', { name: 'Created from' });
    await expect(from).toBeFocused();

    const calendarTrigger = editor.getByRole('button', { name: 'Choose date for Created from' });
    await calendarTrigger.click();
    const calendar = page.locator('[data-slot="pickerPanel"]:visible');
    await expect(calendar.getByRole('grid')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(calendar).toBeHidden();
    await expect(editor).toBeVisible();
    await from.press('Escape');
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();

    await selectField(page, root, 'Created date filter builder', 'Created date');
    editor = root.locator(
      '[data-slot="editor"][data-mode="create"][data-field="created"]',
    );
    from = editor.getByRole('textbox', { name: 'Created from' });
    const to = editor.getByRole('textbox', { name: 'Created to' });
    await from.fill('2026-07-01');
    await from.press('Enter');
    await to.fill('2026-07-31');
    await to.press('Enter');
    await editor.getByRole('button', { name: 'Apply range' }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(
      'Created 2026-07-01 – 2026-07-31',
    );

    const token = root.locator('[data-slot="token"]');
    await token.focus();
    await token.press('Enter');
    editor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="created"]',
    );
    await expect(editor.getByRole('textbox', { name: 'Created from' })).toHaveValue('2026-07-01');
    await editor.getByRole('textbox', { name: 'Created to' }).fill('2026-08-31');
    await editor.getByRole('textbox', { name: 'Created to' }).press('Escape');
    await expect(editor).toBeHidden();
    await expect(token).toBeFocused();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(
      'Created 2026-07-01 – 2026-07-31',
    );
  });

  test('projected editor composition is axe-clean', async ({ page }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    await selectField(page, root, 'People filter builder', 'Status');
    await expect(root.locator('[data-slot="editor"][data-field="status"]')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('app-filter-builder-recipes-example')
      .withTags(WCAG_SMOKE_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
