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
    .toContain(expectedText);

  await expect(owner, `${label} keeps focus on the listbox owner`).toBeFocused();
}

test.describe('listbox accessibility contracts', () => {
  test('single-select listbox supports Arrow, Home, End, disabled skip, and Enter selection', async ({
    page,
  }) => {
    await page.goto('/components/listbox');

    const example = page.locator('app-listbox-basic-example');
    const listbox = example.getByRole('listbox', { name: 'Choose a reviewer' });
    const ada = listbox.getByRole('option', { name: /Ada Lovelace/ });
    const grace = listbox.getByRole('option', { name: /Grace Hopper/ });
    const margaret = listbox.getByRole('option', { name: /Margaret Hamilton/ });
    const katherine = listbox.getByRole('option', { name: /Katherine Johnson/ });

    await expect(listbox).toBeVisible();
    await expect(grace).toHaveAttribute('aria-selected', 'true');
    await expect(margaret).toHaveAttribute('aria-disabled', 'true');
    await expect(margaret).toHaveAttribute('aria-selected', 'false');

    await listbox.focus();
    await expectActiveDescendantText(page, listbox, 'Grace Hopper', 'initial selected option is active');

    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'Katherine Johnson',
      'ArrowDown skips the disabled reviewer option',
    );
    await page.keyboard.press('Enter');
    await expect(katherine).toHaveAttribute('aria-selected', 'true');
    await expect(grace).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, listbox, 'Ada Lovelace', 'Home moves to the first option');
    await page.keyboard.press('End');
    await expectActiveDescendantText(
      page,
      listbox,
      'Katherine Johnson',
      'End moves to the last option',
    );

    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(ada).toHaveAttribute('aria-selected', 'true');
    await expect(katherine).toHaveAttribute('aria-selected', 'false');
  });

  test('multiple listbox exposes multiselect state and toggles independent selections', async ({
    page,
  }) => {
    await page.goto('/components/listbox');

    const example = page.locator('app-listbox-basic-example');
    const listbox = example.getByRole('listbox', { name: 'Choose launch checks' });
    const docs = listbox.getByRole('option', { name: /Documentation/ });
    const a11y = listbox.getByRole('option', { name: /Accessibility review/ });
    const migration = listbox.getByRole('option', { name: /Blocked migration/ });
    const release = listbox.getByRole('option', { name: /Release notes/ });

    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect(a11y).toHaveAttribute('aria-selected', 'true');
    await expect(migration).toHaveAttribute('aria-disabled', 'true');
    await expect(migration).toHaveAttribute('aria-selected', 'false');

    await listbox.focus();
    await expectActiveDescendantText(
      page,
      listbox,
      'Accessibility review',
      'initial selected check is active',
    );

    await page.keyboard.press('Space');
    await expect(a11y).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'Release notes',
      'ArrowDown skips the disabled migration check',
    );
    await page.keyboard.press('Enter');
    await expect(release).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, listbox, 'Documentation', 'Home moves to first check');
    await page.keyboard.press('Space');
    await expect(docs).toHaveAttribute('aria-selected', 'true');
    await expect(release).toHaveAttribute('aria-selected', 'true');
    await expect(a11y).toHaveAttribute('aria-selected', 'false');
    await expect(migration).toHaveAttribute('aria-selected', 'false');
  });
});
