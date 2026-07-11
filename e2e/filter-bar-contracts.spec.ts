import { expect, test, type Page } from '@playwright/test';

async function gotoFilterBar(page: Page): Promise<void> {
  await page.goto('/components/filter-bar');
  await expect(page.getByRole('heading', { name: 'Filter Bar', level: 1 })).toBeVisible();
}

function example(page: Page) {
  return page.locator('app-filter-bar-tanstack-example');
}

test.describe('Filter Bar browser contract', () => {
  test('keyboard journey: highlighted options field wins, commits, and edits in the same editor', async ({
    page,
  }) => {
    await gotoFilterBar(page);
    const root = example(page);
    const picker = root.getByRole('combobox', { name: 'People filters' });

    await picker.fill('sta');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    const status = page.getByRole('option', { name: 'Status', exact: true });
    const statusId = await status.getAttribute('id');
    await expect(picker).toHaveAttribute('aria-activedescendant', statusId);
    await picker.press('ArrowUp');
    await expect(picker).toHaveAttribute('aria-activedescendant', statusId);

    // The highlighted field is authoritative: Enter opens its editor and emits no token yet.
    await picker.press('Enter');
    const createEditor = root.locator('[data-slot="editor"][data-mode="create"]');
    await expect(createEditor).toHaveAttribute('data-field', 'status');
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);

    const statusInput = createEditor.getByRole('combobox', { name: 'Status' });
    await statusInput.fill('inv');
    const invited = page.getByRole('option', { name: 'Invited', exact: true });
    const invitedId = await invited.getAttribute('id');
    await expect(statusInput).toHaveAttribute('aria-activedescendant', invitedId);
    await statusInput.press('ArrowDown');
    await expect(statusInput).toHaveAttribute('aria-activedescendant', invitedId);
    await statusInput.press('Enter');

    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Status: Invited');
    await expect(root.getByText('1 people shown')).toBeVisible();
    await expect(root.getByRole('cell', { name: 'Katherine Johnson' })).toBeVisible();

    // Edit mounts the same editor contract in a Popover anchored to the token.
    await root.getByRole('button', { name: 'Edit Status: Invited' }).click();
    const editEditor = page.locator('[hellPopover] [data-slot="editor"][data-mode="edit"]');
    await expect(editEditor).toHaveAttribute('data-field', 'status');
    const editInput = editEditor.getByRole('combobox', { name: 'Status' });
    await editInput.fill('act');
    await editInput.press('Enter');

    await expect(page.locator('[hellPopover]')).toBeHidden();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Status: Active');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Status: Active updated');
    await expect(root.getByText('3 people shown')).toBeVisible();
  });

  test('text, free-text, colon accelerator, Backspace-on-empty, and clear-all round-trip', async ({
    page,
  }) => {
    await gotoFilterBar(page);
    const root = example(page);
    const picker = root.getByRole('combobox', { name: 'People filters' });

    // The colon accelerator reaches the identical text editor state as field selection.
    await picker.fill('name:Ada');
    const nameEditor = root.locator('[data-slot="editor"][data-mode="create"]');
    await expect(nameEditor).toHaveAttribute('data-field', 'name');
    const nameInput = nameEditor.getByRole('searchbox', { name: 'Name' });
    await expect(nameInput).toHaveValue('Ada');
    await nameInput.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Name: Ada');
    await expect(root.getByText('1 people shown')).toBeVisible();

    // Free text is an explicit visible row, not a hidden fallback.
    await picker.fill('Compiler');
    const freeText = page.getByRole('option', { name: /Search for.*Compiler/ });
    await expect(picker).toHaveAttribute('aria-activedescendant', await freeText.getAttribute('id'));
    await picker.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Name: Ada',
      'Search: Compiler',
    ]);
    await expect(root.locator('[data-slot="live"]')).toHaveText('Search: Compiler added');
    // AND-combination leaves no matching row (Ada is not on Compiler).
    await expect(root.getByText('0 people shown')).toBeVisible();

    // Backspace in the empty PICK input removes only the last token.
    await expect(picker).toHaveValue('');
    await expect(picker).toHaveAttribute('aria-expanded', 'false');
    await picker.press('Backspace');
    await expect(root.locator('[data-slot="token"]')).toHaveCount(1);
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(['Name: Ada']);
    await expect(root.getByText('1 people shown')).toBeVisible();

    await root.getByRole('button', { name: 'Clear all filters' }).click();
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);
    await expect(root.getByText('4 people shown')).toBeVisible();
  });

  test('Escape consumes exactly one layer and chip keyboard removal stays in the token zone', async ({
    page,
  }) => {
    await gotoFilterBar(page);
    const root = example(page);
    const picker = root.getByRole('combobox', { name: 'People filters' });

    await picker.fill('sta');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await picker.press('Escape');
    await expect(picker).toHaveAttribute('aria-expanded', 'false');
    await expect(picker).toHaveValue('sta');
    await picker.press('Escape');
    await expect(picker).toHaveValue('');

    await picker.fill('status:inv');
    const createEditor = root.locator('[data-slot="editor"][data-mode="create"]');
    await createEditor.getByRole('combobox', { name: 'Status' }).press('Escape');
    await expect(createEditor).toBeHidden();
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);

    await picker.fill('invited');
    await picker.press('Enter');
    const token = root.locator('[data-slot="token"]');
    await expect(token).toHaveCount(1);

    // Token Enter reaches edit without a second tab stop; Escape discards and restores the token.
    await token.focus();
    await token.press('Enter');
    const editInput = page.locator('[hellPopover] [data-hell-filter-editor-input]');
    await editInput.fill('active');
    await editInput.press('Escape');
    await expect(page.locator('[hellPopover]')).toBeHidden();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Search: invited');
    await expect(token).toBeFocused();

    // A printable token key returns to PICK and preserves that character.
    await token.press('x');
    await expect(picker).toBeFocused();
    await expect(picker).toHaveValue('x');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await picker.press('Escape');
    await expect(picker).toHaveAttribute('aria-expanded', 'false');
    await picker.press('Escape');
    await expect(picker).toHaveValue('');

    // Chip Set owns roving token focus and keyboard removal.
    await token.focus();
    await token.press('Delete');
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);
    await expect(root.locator('[data-slot="live"]')).toHaveText('Search: invited removed');
    await expect(picker).toBeFocused();
  });

  test('Tab, Space, colon, multiple succession, and outside dismissal share one editor path', async ({
    page,
  }) => {
    await gotoFilterBar(page);
    const root = example(page);
    const picker = root.getByRole('combobox', { name: 'People filters' });

    await picker.fill('tea');
    await picker.press('Tab');
    const editor = root.locator('[data-slot="editor"][data-mode="create"]');
    await expect(editor).toHaveAttribute('data-field', 'team');
    const teamInput = editor.getByRole('combobox', { name: 'Team' });

    await teamInput.fill('plat');
    await teamInput.press('Space');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(['Team: Platform']);
    await expect(editor).toBeVisible();

    await teamInput.fill('comp');
    await teamInput.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Team: Platform',
      'Team: Compiler',
    ]);
    await expect(root.getByText('2 people shown')).toBeVisible();

    await page.getByRole('button', { name: 'Collapse sidebar' }).focus();
    await expect(editor).toBeHidden();

    await picker.fill('status:act');
    const statusEditor = root.locator('[data-slot="editor"][data-field="status"]');
    const statusInput = statusEditor.getByRole('combobox', { name: 'Status' });
    const active = page.getByRole('option', { name: 'Active', exact: true });
    await expect(statusInput).toHaveAttribute('aria-activedescendant', await active.getAttribute('id'));
    await statusInput.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Team: Platform',
      'Team: Compiler',
      'Status: Active',
    ]);
  });
});
