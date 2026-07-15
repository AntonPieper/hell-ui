import { expect, test, type Locator, type Page } from '@playwright/test';

function attributeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function expectActiveDescendantText(
  page: Page,
  owner: Locator,
  expectedText: string,
  label: string,
): Promise<void> {
  await expect
    .poll(
      async () => {
        const id = await owner.getAttribute('aria-activedescendant');
        if (!id) return null;

        const active = page.locator(`[id="${attributeSelectorValue(id)}"]`);
        return (await active.textContent())?.trim().replace(/\s+/g, ' ') ?? null;
      },
      { message: label },
    )
    .toBe(expectedText);

  await expect(owner, `${label} keeps DOM focus on the active-descendant owner`).toBeFocused();
}

test.describe('menu-select-combobox-keyboard matrix', () => {
  test('menu uses roving focus, skips disabled items, activates with Enter and Space, and restores focus', async ({
    page,
  }) => {
    const menuActions: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      if (text.startsWith('menu action:')) menuActions.push(text);
    });

    await page.goto('/components/menu');

    const trigger = page.getByRole('button', { name: 'Actions' }).first();
    const menu = page.getByRole('menu').first();
    const rename = page.getByRole('menuitem', { name: 'Rename' }).first();
    const duplicate = page.getByRole('menuitem', { name: 'Duplicate' }).first();
    const moveDisabled = page.getByRole('menuitem', { name: 'Move' }).first();
    const deleteItem = page.getByRole('menuitem', { name: 'Delete' }).first();

    await trigger.focus();
    await page.keyboard.press('Enter');

    await expect(menu).toBeVisible();
    await expect(rename).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(duplicate).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(rename).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(moveDisabled).toBeDisabled();
    await expect(deleteItem).toBeFocused();

    await page.keyboard.press('Home');
    await expect(rename).toBeFocused();
    await page.keyboard.press('End');
    await expect(deleteItem).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Space');
    await expect(menu).toBeVisible();
    await expect(rename).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(deleteItem).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(menuActions).toContain('menu action: delete');

    await page.keyboard.press('Space');
    await expect(menu).toBeVisible();
    await expect(rename).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(duplicate).toBeFocused();
    await page.keyboard.press('Space');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(menuActions).toContain('menu action: duplicate');
  });

  test('select keeps trigger focus, exposes aria-activedescendant, skips disabled options, and selects with Enter', async ({
    page,
  }) => {
    await page.goto('/components/select');

    const select = page.getByRole('combobox', { name: 'Priority' }).first();

    await expect(select).toHaveAttribute('hellSelect', '');
    await expect(select).not.toHaveAttribute('hellSelectTrigger');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await select.focus();
    await page.keyboard.press('ArrowDown');

    await expect(select).toHaveAttribute('aria-expanded', 'true');
    const dropdownId = await select.getAttribute('aria-controls');
    expect(dropdownId).toBeTruthy();
    await expect(page.locator(`[id="${attributeSelectorValue(dropdownId ?? '')}"]`)).toHaveRole(
      'listbox',
    );
    await expectActiveDescendantText(page, select, 'Lowest', 'select opens on ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expectActiveDescendantText(page, select, 'Highest', 'select ArrowUp wraps to last option');
    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, select, 'Lowest', 'select Home moves to first option');
    await page.keyboard.press('End');
    await expectActiveDescendantText(page, select, 'Highest', 'select End moves to last option');
    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, select, 'Lowest', 'select Home resets before skip check');

    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(page, select, 'Low', 'select ArrowDown moves to next option');
    await expect(page.getByRole('option', { name: 'Medium' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(page, select, 'High', 'select skips disabled visible options');

    await page.keyboard.press('Enter');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await expect(select).toContainText('High');
    await expect(select).toBeFocused();

    await page.keyboard.press('Space');
    await expect(select).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(select).toHaveAttribute('aria-expanded', 'false');
    await expect(select).toBeFocused();
  });

  test('select projects domain objects and keeps field label and description relationships', async ({
    page,
  }) => {
    await page.goto('/components/select');

    const richExample = page.locator('app-select-rich-options-example');
    const status = richExample.getByRole('combobox', { name: 'Service status' });
    await expect(status).toContainText('Operational');
    await status.click();
    await page.getByRole('option', { name: /Degraded/ }).click();
    await expect(status).toContainText('Degraded');
    await expect(status).toHaveAttribute('aria-expanded', 'false');

    const fieldExample = page.locator('app-select-preset-example');
    const region = fieldExample.getByRole('combobox', { name: 'Deployment region' });
    const description = fieldExample.getByText('Data stays inside the selected region.');
    const descriptionId = await description.getAttribute('id');
    expect(descriptionId).toBeTruthy();
    await expect(region).toHaveAttribute('aria-describedby', descriptionId ?? '');
    await expect(region).toContainText('EU (Frankfurt)');
  });

  test('combobox opens projected domain objects on the first toggle activation', async ({
    page,
  }) => {
    await page.goto('/components/combobox');

    const example = page.locator('app-combobox-basic-example');
    const input = example.getByRole('combobox', { name: 'Settlement currency' });

    await expect(example.locator('[hellCombobox]')).toHaveCount(1);
    await expect(example.locator('hell-combobox')).toHaveCount(0);

    await input.evaluate((element) =>
      element.scrollIntoView({ block: 'center', behavior: 'instant' }),
    );
    await example.getByRole('button', { name: 'Toggle currencies' }).click();
    await expect(page.getByRole('option', { name: 'AUD — Australian Dollar' })).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await input.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });

  test('combobox keeps input focus, skips disabled filtered options, and closes with Escape', async ({
    page,
  }) => {
    await page.goto('/components/combobox');

    const example = page.locator('app-combobox-basic-example');
    const input = example.getByRole('combobox', { name: 'Settlement currency' });

    await input.focus();
    await page.keyboard.press('ArrowDown');

    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'AUD — Australian Dollar' })).toContainText(
      'Australian Dollar',
    );
    await expectActiveDescendantText(page, input, 'AUD — Australian Dollar', 'combobox opens on ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expectActiveDescendantText(page, input, 'USD — US Dollar', 'combobox ArrowUp wraps to last option');
    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, input, 'AUD — Australian Dollar', 'combobox Home moves to first option');
    await page.keyboard.press('End');
    await expectActiveDescendantText(page, input, 'USD — US Dollar', 'combobox End moves to last option');

    await page.keyboard.press('Escape');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();

    await input.fill('c');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'CHF — Swiss Franc' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'CNY — Chinese Yuan' })).toBeVisible();
    await page.keyboard.press('Home');
    await expectActiveDescendantText(
      page,
      input,
      'CHF — Swiss Franc',
      'combobox skips disabled visible options',
    );

    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('CHF — Swiss Franc');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });
});
