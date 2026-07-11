import { expect, test, type Page } from '@playwright/test';

async function gotoFilterBar(page: Page): Promise<void> {
  await page.goto('/components/filter-bar');
  await expect(page.getByRole('heading', { name: 'Filter Bar', level: 1 })).toBeVisible();
}

function example(page: Page) {
  return page.locator('app-filter-bar-tanstack-example');
}

function serverExample(page: Page) {
  return page.locator('app-filter-bar-server-dispatch-example');
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

  test('async entity search exposes status, commits only results, and shares edit/remove behavior', async ({
    page,
  }) => {
    await gotoFilterBar(page);
    const root = serverExample(page);
    const picker = root.getByRole('combobox', { name: 'Work order filters' });

    await picker.fill('own');
    await picker.press('Enter');
    const createEditor = root.locator('[data-slot="editor"][data-field="owner"]');
    const ownerInput = createEditor.getByRole('combobox', { name: 'Owner' });
    await expect(ownerInput).toBeFocused();

    await ownerInput.pressSequentially('not in the directory');
    await expect(ownerInput).toHaveValue('not in the directory');
    await expect(page.locator('[data-slot="status"][data-state="loading"]')).toBeVisible();
    await expect(page.locator('[data-slot="status"][data-state="empty"]')).toBeVisible();
    await ownerInput.press('Enter');
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);

    // Escape leaves no half-open editor state, and the same field can be reopened immediately.
    await ownerInput.press('Escape');
    await expect(createEditor).toBeHidden();
    await expect(picker).toBeFocused();
    await picker.fill('owner');
    await picker.press('Enter');

    const reopenedEditor = root.locator('[data-slot="editor"][data-field="owner"]');
    const reopenedInput = reopenedEditor.getByRole('combobox', { name: 'Owner' });
    await reopenedInput.fill('mara');
    await expect(page.locator('[data-slot="status"][data-state="loading"]')).toBeVisible();
    const mara = page.getByRole('option', { name: 'Mara Voss', exact: true });
    await expect(mara).toBeVisible();
    await expect(reopenedInput).toHaveAttribute('aria-activedescendant', await mara.getAttribute('id'));
    await reopenedInput.press('Enter');

    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner: Mara Voss');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner: Mara Voss added');
    await expect(root.getByTestId('filter-server-request')).toContainText('"id": "mara"');

    await root.getByRole('button', { name: 'Edit Owner: Mara Voss' }).click();
    const editEditor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="owner"]',
    );
    const editInput = editEditor.getByRole('combobox', { name: 'Owner' });
    await editInput.fill('theo');
    const theo = page.getByRole('option', { name: 'Theo Martin', exact: true });
    await expect(theo).toBeVisible();
    await editInput.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner: Theo Martin');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner: Theo Martin updated');
    await expect(root.getByTestId('filter-server-request')).toContainText('"id": "theo"');

    const token = root.locator('[data-slot="token"]');
    await token.focus();
    await token.press('Delete');
    await expect(token).toHaveCount(0);
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner: Theo Martin removed');
    await expect(root.getByTestId('filter-server-request')).toContainText('"filters": []');
  });

  test('date range keeps calendar Escape nested and round-trips closed and open ranges', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await gotoFilterBar(page);
    const root = serverExample(page);
    const picker = root.getByRole('combobox', { name: 'Work order filters' });

    await picker.fill('cre');
    await picker.press('Enter');
    let editor = root.locator('[data-slot="editor"][data-field="created"]');
    let from = editor.getByRole('textbox', { name: 'Created from' });
    await expect(from).toBeFocused();

    // A calendar is inside the Filter Bar's Floating Scope: interacting with
    // its portal must not outside-dismiss the owning range editor.
    const fromTrigger = editor.getByRole('button', { name: 'Choose date for Created from' });
    await fromTrigger.focus();
    await fromTrigger.press('Enter');
    let calendar = page.locator('[data-slot="pickerPanel"]:visible');
    await expect(calendar.getByRole('grid')).toBeVisible();
    await calendar
      .locator('button[ngpdatepickerdatebutton]:not([disabled]):not([data-outside-month])')
      .nth(10)
      .click();
    await expect(editor).toBeVisible();

    // Escape consumes the nested calendar first, then the shared Filter Bar
    // editor, and finally restores the field picker.
    await fromTrigger.click();
    calendar = page.locator('[data-slot="pickerPanel"]:visible');
    await expect(calendar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(calendar).toBeHidden();
    await expect(editor).toBeVisible();
    await from.press('Escape');
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();

    await picker.fill('created');
    await picker.press('Enter');
    editor = root.locator('[data-slot="editor"][data-field="created"]');
    from = editor.getByRole('textbox', { name: 'Created from' });
    const to = editor.getByRole('textbox', { name: 'Created to' });
    await from.fill('2026-01-01');
    await to.fill('2026-04-30');
    await to.press('Enter');

    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(
      'Created: 2026-01-01 to 2026-04-30',
    );
    await expect(root.locator('[data-slot="live"]')).toHaveText(
      'Created: 2026-01-01 to 2026-04-30 added',
    );
    const request = root.getByTestId('filter-server-request');
    await expect(request).toContainText('"kind": "dateRange"');
    await expect(request).toContainText('"from": "2026-01-01"');
    await expect(request).toContainText('"to": "2026-04-30"');

    // Editing uses the same seeded controls; Escape discards the draft and
    // restores the token rather than leaking an intermediate controlled value.
    const token = root.locator('[data-slot="token"]');
    await root.getByRole('button', { name: /^Edit Created:/ }).click();
    let editEditor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="created"]',
    );
    let editTo = editEditor.getByRole('textbox', { name: 'Created to' });
    await expect(editEditor.getByRole('textbox', { name: 'Created from' })).toHaveValue(
      '2026-01-01',
    );
    await expect(editTo).toHaveValue('2026-04-30');
    const editApply = editEditor.getByRole('button', { name: 'Apply filter' });
    await editTo.fill('not-a-date');
    await expect(editApply).toBeDisabled();
    await editTo.press('Enter');
    await expect(editEditor).toBeVisible();
    await expect(request).toContainText('"to": "2026-04-30"');
    await editTo.fill('2026-06-30');
    await editTo.press('Escape');
    await expect(editEditor).toBeHidden();
    await expect(token).toBeFocused();
    await expect(request).toContainText('"to": "2026-04-30"');

    // A nullable bound remains a clean JSON value, not an empty string or UTC timestamp.
    await token.press('Enter');
    editEditor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="created"]',
    );
    await expect(editEditor).toBeVisible();
    const editFrom = editEditor.getByRole('textbox', { name: 'Created from' });
    editTo = editEditor.getByRole('textbox', { name: 'Created to' });
    await editFrom.fill('');
    await editFrom.press('Tab');
    await page.keyboard.press('Tab');
    await editTo.press('Tab');
    await page.keyboard.press('Tab');
    const openEndedApply = editEditor.getByRole('button', { name: 'Apply filter' });
    await expect(openEndedApply).toBeFocused();
    await openEndedApply.press('Enter');

    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(
      'Created: Through 2026-04-30',
    );
    await expect(root.locator('[data-slot="live"]')).toHaveText(
      'Created: Through 2026-04-30 updated',
    );
    await expect(request).toContainText('"from": null');
    await expect(request).toContainText('"to": "2026-04-30"');
  });
});
