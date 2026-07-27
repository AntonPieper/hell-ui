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

function tanStackExample(page: Page): Locator {
  return page.locator('app-filter-builder-tanstack-example');
}

function serverDispatchExample(page: Page): Locator {
  return page.locator('app-filter-builder-server-dispatch-example');
}

/**
 * Scrolls the docs content so the given element sits near the top of the
 * viewport, leaving room below it for an anchored surface to open downward
 * instead of flipping.
 */
async function scrollNearTop(target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((element) => {
    const main = element.ownerDocument.querySelector('main');
    if (!main) return;
    main.scrollTop +=
      element.getBoundingClientRect().top - main.getBoundingClientRect().top - 80;
  });
}

function createEditor(page: Page, field: string): Locator {
  return page.locator(
    `[hellPopover] [data-slot="editor"][data-mode="create"][data-field="${field}"]`,
  );
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
  const option = page.getByRole('option', { name: field, exact: true });
  await expect(option).toBeVisible();
  await picker.press('ArrowDown');
  const optionId = await option.getAttribute('id');
  expect(optionId).not.toBeNull();
  await expect(picker).toHaveAttribute('aria-activedescendant', optionId!);
  await picker.press('Enter');
}

async function addName(page: Page, value: string): Promise<void> {
  const root = recipesExample(page);
  await selectField(page, root, 'People filter builder', 'Name');
  const editor = createEditor(page, 'name');
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
    const createStatus = createEditor(page, 'status');
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

  test('field and projected option pickers clamp active-descendant navigation at both boundaries', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await picker.press('ArrowDown');
    const firstField = page.getByRole('option', { name: 'Name', exact: true });
    const lastField = page.getByRole('option', { name: 'Priority ≥', exact: true });
    await expect(firstField).toBeVisible();
    const firstFieldId = await firstField.getAttribute('id');
    const lastFieldId = await lastField.getAttribute('id');
    expect(firstFieldId).not.toBeNull();
    expect(lastFieldId).not.toBeNull();
    await expect(picker).toHaveAttribute('aria-activedescendant', firstFieldId!);

    await picker.press('ArrowUp');
    await picker.press('ArrowUp');
    await expect(picker).toHaveAttribute('aria-activedescendant', firstFieldId!);

    await picker.press('ArrowDown');
    await picker.press('ArrowDown');
    await expect(picker).toHaveAttribute('aria-activedescendant', lastFieldId!);
    await picker.press('ArrowDown');
    await picker.press('ArrowDown');
    await expect(picker).toHaveAttribute('aria-activedescendant', lastFieldId!);

    await picker.press('Escape');
    await selectField(page, root, 'People filter builder', 'Status');
    const statusInput = createEditor(page, 'status')
      .getByRole('combobox', { name: 'Status option' });
    await statusInput.press('ArrowDown');
    const firstStatus = page.getByRole('option', { name: 'Active', exact: true });
    const lastStatus = page.getByRole('option', { name: 'Paused', exact: true });
    await expect(firstStatus).toBeVisible();
    const firstStatusId = await firstStatus.getAttribute('id');
    const lastStatusId = await lastStatus.getAttribute('id');
    expect(firstStatusId).not.toBeNull();
    expect(lastStatusId).not.toBeNull();
    await expect(statusInput).toHaveAttribute('aria-activedescendant', firstStatusId!);

    await statusInput.press('ArrowUp');
    await statusInput.press('ArrowUp');
    await expect(statusInput).toHaveAttribute('aria-activedescendant', firstStatusId!);

    await statusInput.press('ArrowDown');
    await expect(statusInput).toHaveAttribute('aria-activedescendant', lastStatusId!);
    await statusInput.press('ArrowDown');
    await statusInput.press('ArrowDown');
    await expect(statusInput).toHaveAttribute('aria-activedescendant', lastStatusId!);
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
    const customEditor = createEditor(page, 'priority');
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

  test('application-owned expressions drive TanStack global and column filter state', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = tanStackExample(page);

    await selectField(page, root, 'People table filters', 'Search');
    let editor = createEditor(page, 'query');
    await editor.getByRole('textbox', { name: 'Global search' }).fill('Compiler');
    await editor.getByRole('button', { name: 'Apply search' }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText(
      'Search contains “Compiler”',
    );
    await expect(root.getByText('1 people shown')).toBeVisible();
    await expect(root.getByRole('cell', { name: 'Grace Hopper' })).toBeVisible();

    await selectField(page, root, 'People table filters', 'Status');
    editor = createEditor(page, 'status');
    await editor.getByRole('button', { name: 'Active', exact: true }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Search contains “Compiler”',
      'Status is Active',
    ]);
    await expect(root.getByText('1 people shown')).toBeVisible();

    await selectField(page, root, 'People table filters', 'Team');
    editor = createEditor(page, 'team');
    await editor.getByRole('button', { name: 'Compiler', exact: true }).click();
    await selectField(page, root, 'People table filters', 'Team');
    editor = createEditor(page, 'team');
    await editor.getByRole('button', { name: 'Operations', exact: true }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Search contains “Compiler”',
      'Status is Active',
      'Team is Compiler',
      'Team is Operations',
    ]);
    await expect(root.getByText('1 people shown')).toBeVisible();
  });

  test('an application-owned async Search Resource exposes loading, error, create, and edit', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = asyncEntityExample(page);

    await selectField(page, root, 'Owner filter builder', 'Owner');
    let editor = createEditor(page, 'owner');
    let input = editor.getByRole('combobox', { name: 'Owner directory' });
    await expect(input).toBeFocused();

    await input.press('ArrowDown');
    let dropdown = page.locator('[hellComboboxDropdown]:visible');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(dropdown).toBeVisible();

    await input.fill('fail');
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
    await input.press('ArrowDown');
    dropdown = page.locator('[hellComboboxDropdown]:visible');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(dropdown).toBeVisible();

    await input.fill('linus');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await expect(page.getByRole('option', { name: /Linus Torvalds/ })).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner is Linus Torvalds');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner is Linus Torvalds updated');
  });

  test('server dispatch keeps Search Resource cancellation and date-range policy in the app', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await gotoFilterBuilder(page);
    const root = serverDispatchExample(page);

    await selectField(page, root, 'Work order filter builder', 'Owner');
    let editor = createEditor(page, 'owner');
    const input = editor.getByRole('combobox', { name: 'Owner directory' });
    await expect(input).toBeFocused();

    await input.press('ArrowDown');
    const dropdown = page.locator('[hellComboboxDropdown]:visible');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(dropdown).toBeVisible();

    await input.fill('error');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await expect(dropdown.getByRole('alert')).toHaveText(
      'Owner directory unavailable. Try another query.',
    );
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);

    await input.fill('mara');
    await expect(dropdown.getByRole('status')).toHaveText('Loading owners…');
    await input.fill('theo');
    await expect(page.getByRole('option', { name: 'Theo Martin', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Mara Voss', exact: true })).toHaveCount(0);
    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText('Owner is Theo Martin');
    await expect(root.locator('[data-slot="live"]')).toHaveText('Owner is Theo Martin added');
    const request = root.getByTestId('filter-builder-server-request');
    await expect(request).toContainText('"id": "theo"');
    await expect(root.getByText('1 work orders returned.')).toBeVisible();

    await selectField(page, root, 'Work order filter builder', 'Created');
    editor = createEditor(page, 'created');
    const from = editor.getByRole('textbox', { name: 'Created from' });
    const to = editor.getByRole('textbox', { name: 'Created to' });
    await from.fill('2026-05-01');
    await from.press('Enter');
    await to.fill('2026-06-30');
    await to.press('Enter');
    await editor.getByRole('button', { name: 'Apply range' }).click();
    await expect(root.locator('[data-slot="tokenLabel"]')).toHaveText([
      'Owner is Theo Martin',
      'Created 2026-05-01 – 2026-06-30',
    ]);
    await expect(request).toContainText('"from": "2026-05-01"');
    await expect(request).toContainText('"to": "2026-06-30"');
  });

  test('native date input Escape cancels the editor and restores focus', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = dateRangeExample(page);
    const picker = root.getByRole('combobox', { name: 'Created date filter builder' });

    await selectField(page, root, 'Created date filter builder', 'Created date');
    let editor = createEditor(page, 'created');
    let from = editor.getByRole('textbox', { name: 'Created from' });
    await expect(from).toBeFocused();

    await from.press('Escape');
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();

    await selectField(page, root, 'Created date filter builder', 'Created date');
    editor = createEditor(page, 'created');
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

  test('renders one Control Group frame holding chips, the inline picker, and a clear action', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const frame = root.locator('[hellControlGroup][data-slot="root"]');
    const tokens = root.locator('[data-slot="tokens"]');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    // The frame is the Control Group; the chip set opts into in-group spacing.
    await expect(frame).toHaveAttribute('role', 'group');
    await expect(frame).toHaveAttribute('data-size', 'md');
    await expect(tokens).toHaveAttribute('data-in-control-group', '');
    await expect(tokens.locator('[data-hell-filter-builder-input]')).toHaveCount(1);
    // No clear action while the builder is empty.
    await expect(root.locator('[data-slot="clear"]')).toHaveCount(0);

    await addName(page, 'Ada');
    const clear = root.locator('[data-slot="clear"]');
    await expect(clear).toHaveAttribute('aria-label', 'Clear all filters');
    // The clear action is a group action inside the frame, not a detached button.
    await expect(frame.locator('> [data-slot="clear"]')).toHaveCount(1);
    await expect(clear).toHaveText('');

    // Segmented chip anatomy from the descriptor's displayParts.
    const chip = root.locator('[data-slot="token"]').first();
    await expect(chip.locator('[data-slot="tokenField"]')).toHaveText('Name');
    await expect(chip.locator('[data-slot="tokenOperator"]')).toHaveText('contains');
    await expect(chip.locator('[data-slot="tokenValue"]')).toHaveText('“Ada”');
    // display() stays the single source for accessible names.
    await expect(chip.locator('[data-slot="tokenLabel"]')).toHaveAttribute(
      'aria-label',
      'Edit Name contains “Ada”',
    );

    // Clicking empty frame space focuses the inline picker.
    await picker.blur();
    await expect(picker).not.toBeFocused();
    const frameBox = (await frame.boundingBox())!;
    await page.mouse.click(frameBox.x + frameBox.width - 60, frameBox.y + frameBox.height / 2);
    await expect(picker).toBeFocused();
  });

  test('the create editor opens in a popover anchored to the frame instead of replacing the picker', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const frame = root.locator('[hellControlGroup][data-slot="root"]');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await scrollNearTop(frame);
    await selectField(page, root, 'People filter builder', 'Name');
    const editor = createEditor(page, 'name');
    await expect(editor).toBeVisible();
    // The inline picker stays in the chip flow while the editor is open.
    await expect(picker).toHaveCount(1);
    await expect(frame).toHaveAttribute('data-editing', 'create');

    const frameBox = (await frame.boundingBox())!;
    const editorBox = (await editor.locator('xpath=ancestor::*[@hellPopover]').boundingBox())!;
    expect(Math.abs(editorBox.x - frameBox.x)).toBeLessThan(2);
    expect(editorBox.y).toBeGreaterThanOrEqual(frameBox.y + frameBox.height);

    // Escape cancels the create editor and returns focus to the picker.
    await editor.getByRole('textbox', { name: 'Name text' }).press('Escape');
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);
  });

  test('the frame keyboard matrix moves focus between chips, the picker, and the clear action', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const picker = root.getByRole('combobox', { name: 'People filter builder' });
    const chips = root.locator('[data-slot="token"]');

    await addName(page, 'Ada');
    await addName(page, 'Grace');
    await expect(chips).toHaveCount(2);

    // Roving focus, then ArrowRight off the last chip enters the picker.
    await chips.first().focus();
    await chips.first().press('ArrowRight');
    await expect(chips.nth(1)).toBeFocused();
    await chips.nth(1).press('Home');
    await expect(chips.first()).toBeFocused();
    await chips.first().press('End');
    await expect(chips.nth(1)).toBeFocused();
    await chips.nth(1).press('ArrowRight');
    await expect(picker).toBeFocused();

    // ArrowLeft in the empty picker returns to the last chip; Escape goes back.
    await picker.press('ArrowLeft');
    await expect(chips.nth(1)).toBeFocused();
    await chips.nth(1).press('Escape');
    await expect(picker).toBeFocused();

    // A printable key on a chip starts a query in the picker.
    await chips.first().focus();
    await chips.first().press('p');
    await expect(picker).toBeFocused();
    await expect(picker).toHaveValue('p');
    await expect(page.getByRole('option', { name: 'Priority ≥', exact: true })).toBeVisible();

    // Escape layers: close the dropdown first, then clear the query.
    await picker.press('Escape');
    await expect(picker).toHaveAttribute('aria-expanded', 'false');
    await expect(picker).toHaveValue('p');
    await picker.press('Escape');
    await expect(picker).toHaveValue('');

    // Two-step Backspace never destroys on the first press.
    await picker.press('Backspace');
    await expect(chips.nth(1)).toBeFocused();
    await expect(chips).toHaveCount(2);
    await chips.nth(1).press('Backspace');
    await expect(chips).toHaveCount(1);
    await expect(root.locator('[data-slot="live"]')).toHaveText('Name contains “Grace” removed');
    await expect(picker).toBeFocused();

    // Tab order: chip set, then the picker, then the clear action.
    await chips.first().focus();
    await page.keyboard.press('Tab');
    await expect(picker).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(root.locator('[data-slot="clear"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(chips).toHaveCount(0);
    await expect(root.locator('[data-slot="live"]')).toHaveText('All filters cleared');
    await expect(picker).toBeFocused();
  });

  test('an edit editor anchors to its chip and restores chip focus after commit', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const chip = root.locator('[data-slot="token"]').first();

    await addName(page, 'Ada');
    await scrollNearTop(chip);
    await chip.focus();
    await chip.press('Enter');
    const editor = page.locator(
      '[hellPopover] [data-slot="editor"][data-mode="edit"][data-field="name"]',
    );
    await expect(editor).toBeVisible();

    const chipBox = (await chip.boundingBox())!;
    const panelBox = (await editor.locator('xpath=ancestor::*[@hellPopover]').boundingBox())!;
    expect(panelBox.y).toBeGreaterThanOrEqual(chipBox.y + chipBox.height);

    // The projected operator control feeds the operator segment.
    await editor.getByRole('combobox', { name: 'Name operator' }).selectOption('startsWith');
    await editor.getByRole('button', { name: 'Apply', exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(chip.locator('[data-slot="tokenOperator"]')).toHaveText('starts with');
    await expect(chip.locator('[data-slot="tokenValue"]')).toHaveText('“Ada”');
    await expect(root.locator('[data-slot="live"]')).toHaveText(
      'Name starts with “Ada” updated',
    );
    await expect(chip).toBeFocused();
  });

  test('create editing ends when focus returns to the frame, never leaving two live surfaces', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const frame = root.locator('[hellControlGroup][data-slot="root"]');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await scrollNearTop(frame);
    await selectField(page, root, 'People filter builder', 'Status');
    const editor = createEditor(page, 'status');
    await expect(editor).toBeVisible();

    // The picker stays clickable beside the open editor, so "start another
    // filter" is a natural move. It must close the editor, not stack a second
    // overlay from the same builder on top of it.
    await picker.click();
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();

    await picker.fill('Prio');
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('[hellPopover] [data-slot="editor"]')).toHaveCount(0);

    await picker.press('ArrowDown');
    await picker.press('Enter');
    const second = createEditor(page, 'priority');
    await expect(second).toBeVisible();
    // The swapped-in editor owns focus rather than stranding it on <body>.
    await expect(second.locator(':focus')).toHaveCount(1);
  });

  test('tabbing forward off the create editor returns focus to the inline picker', async ({
    page,
  }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const frame = root.locator('[hellControlGroup][data-slot="root"]');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await scrollNearTop(frame);
    await selectField(page, root, 'People filter builder', 'Name');
    const editor = createEditor(page, 'name');
    await expect(editor.getByRole('textbox', { name: 'Name text' })).toBeFocused();

    // Walk the editor's own stops, then off the end of the portalled panel.
    await page.keyboard.press('Tab');
    await expect(editor.getByRole('combobox', { name: 'Name operator' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(editor.getByRole('button', { name: 'Apply', exact: true })).toBeFocused();
    await page.keyboard.press('Tab');

    // Chromium and WebKit strand focus on <body> when Tab runs off the end of
    // a body-level panel; that is the case that used to drop the user at the
    // top of the page, and the shell must hand focus back to the picker.
    // Firefox gives that Tab to the browser chrome without blurring the
    // document, so focus never leaves the editor and there is nothing to
    // restore. Neither engine may leave focus anywhere else, and neither may
    // leave it nowhere.
    const focusHome = await page.evaluate(() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement) || active === document.body) return 'stranded';
      if (active.closest('[data-slot="editor"]')) return 'editor';
      if (active.closest('app-filter-builder-recipes-example')) return 'builder';
      return 'elsewhere';
    });
    expect(focusHome).not.toBe('stranded');
    expect(focusHome).not.toBe('elsewhere');
    if (focusHome === 'builder') {
      await expect(editor).toBeHidden();
      await expect(picker).toBeFocused();
    } else {
      await expect(editor).toBeVisible();
    }
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);
  });

  test('Escape cancels a projected editor whose field is a Combobox', async ({ page }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    const frame = root.locator('[hellControlGroup][data-slot="root"]');
    const picker = root.getByRole('combobox', { name: 'People filter builder' });

    await scrollNearTop(frame);
    await selectField(page, root, 'People filter builder', 'Status');
    const editor = createEditor(page, 'status');
    const option = editor.getByRole('combobox', { name: 'Status option' });
    await expect(option).toBeFocused();

    // Layered: the first Escape closes the field's own dropdown only.
    await option.press('ArrowDown');
    await expect(option).toHaveAttribute('aria-expanded', 'true');
    await option.press('Escape');
    await expect(option).toHaveAttribute('aria-expanded', 'false');
    await expect(editor).toBeVisible();

    // With no layer of its own left, the field's Escape cancels the editor.
    await option.press('Escape');
    await expect(editor).toBeHidden();
    await expect(picker).toBeFocused();
    await expect(root.locator('[data-slot="token"]')).toHaveCount(0);
  });

  test('descriptors without displayParts keep the flat display string', async ({ page }) => {
    await gotoFilterBuilder(page);
    const root = dateRangeExample(page);

    await selectField(page, root, 'Created date filter builder', 'Created date');
    const editor = createEditor(page, 'created');
    const from = editor.getByRole('textbox', { name: 'Created from' });
    await from.fill('2026-07-01');
    await from.press('Enter');
    await editor.getByRole('button', { name: 'Apply range' }).click();

    const chip = root.locator('[data-slot="token"]').first();
    await expect(chip.locator('[data-slot="tokenField"]')).toHaveCount(0);
    await expect(chip.locator('[data-slot="tokenOperator"]')).toHaveCount(0);
    const value = chip.locator('[data-slot="tokenValue"]');
    await expect(value).toHaveText('Created 2026-07-01 – any time');

    // The flat label is still one string, but it now sits inside tokenValue
    // and therefore inherits that part's truncation and weight. Pinned here
    // because it is the one visible behavior change for descriptors that ship
    // no displayParts.
    const presentation = await value.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        maxWidth: Number.parseFloat(style.maxWidth),
        textOverflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
        fontWeight: style.fontWeight,
      };
    });
    expect(presentation.textOverflow).toBe('ellipsis');
    expect(presentation.whiteSpace).toBe('nowrap');
    expect(presentation.maxWidth).toBeGreaterThan(0);
    expect(Number(presentation.fontWeight)).toBeGreaterThan(400);
  });

  test('projected editor composition is axe-clean', async ({ page }) => {
    await gotoFilterBuilder(page);
    const root = recipesExample(page);
    await selectField(page, root, 'People filter builder', 'Status');
    await expect(createEditor(page, 'status')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('app-filter-builder-recipes-example')
      .withTags(WCAG_SMOKE_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

