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
    await page.goto('/components/listbox', { waitUntil: 'domcontentloaded' });

    // The single-select example that still carries a disabled option is the
    // sections demo ("Jump to region"): a single-mode listbox whose trailing
    // Dublin option is disabled, so it exercises the same Arrow/Home/End/
    // disabled-skip/Enter matrix the old combined reviewer listbox did.
    const example = page.locator('app-listbox-sections-example');
    const listbox = example.getByRole('listbox', { name: 'Jump to region' });
    const usEast = listbox.getByRole('option', { name: 'US East' });
    const usWest = listbox.getByRole('option', { name: 'US West' });
    const frankfurt = listbox.getByRole('option', { name: 'Frankfurt' });
    const dublin = listbox.getByRole('option', { name: /Dublin/ });

    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'false');
    await expect(usEast).toHaveAttribute('aria-selected', 'true');
    await expect(dublin).toHaveAttribute('aria-disabled', 'true');
    await expect(dublin).toHaveAttribute('aria-selected', 'false');

    await listbox.focus();
    await expectActiveDescendantText(page, listbox, 'US East', 'initial selected option is active');

    await page.keyboard.press('End');
    await expectActiveDescendantText(
      page,
      listbox,
      'Frankfurt',
      'End moves to the last enabled option, skipping the disabled Dublin option',
    );
    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'Frankfurt',
      'ArrowDown at the last enabled option does not move onto the disabled Dublin option',
    );
    await page.keyboard.press('Enter');
    await expect(frankfurt).toHaveAttribute('aria-selected', 'true');
    await expect(usEast).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Home');
    await expectActiveDescendantText(page, listbox, 'US East', 'Home moves to the first option');
    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'US West',
      'ArrowDown moves to the next enabled option',
    );
    await page.keyboard.press('Enter');
    await expect(usWest).toHaveAttribute('aria-selected', 'true');
    await expect(frankfurt).toHaveAttribute('aria-selected', 'false');
  });

  test('multiple listbox exposes multiselect state and toggles independent selections', async ({
    page,
  }) => {
    await page.goto('/components/listbox', { waitUntil: 'domcontentloaded' });

    const example = page.locator('app-listbox-multiple-example');
    const listbox = example.getByRole('listbox', { name: 'Launch checks' });
    const docs = listbox.getByRole('option', { name: /Documentation/ });
    const a11y = listbox.getByRole('option', { name: /Accessibility review/ });
    const migration = listbox.getByRole('option', { name: /Data migration/ });
    const release = listbox.getByRole('option', { name: /Release notes/ });

    await expect(listbox).toBeVisible();
    await expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    await expect(docs).toHaveAttribute('aria-selected', 'true');
    await expect(a11y).toHaveAttribute('aria-selected', 'true');
    await expect(migration).toHaveAttribute('aria-disabled', 'true');
    await expect(migration).toHaveAttribute('aria-selected', 'false');

    await listbox.focus();
    await expectActiveDescendantText(
      page,
      listbox,
      'Documentation',
      'initial selected check is active',
    );

    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'Accessibility review',
      'ArrowDown moves to the next check',
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
    await page.keyboard.press('ArrowDown');
    await expectActiveDescendantText(
      page,
      listbox,
      'Accessibility review',
      'ArrowDown returns to the accessibility review check',
    );
    await page.keyboard.press('Space');
    await expect(docs).toHaveAttribute('aria-selected', 'true');
    await expect(release).toHaveAttribute('aria-selected', 'true');
    await expect(a11y).toHaveAttribute('aria-selected', 'true');
    await expect(migration).toHaveAttribute('aria-selected', 'false');
  });
});
