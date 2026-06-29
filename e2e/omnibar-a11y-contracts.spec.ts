import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoOmnibar(page: Page): Promise<void> {
  await page.goto('/components/omnibar');
  await expect(page.getByRole('heading', { name: 'Omnibar', level: 1 })).toBeVisible();
}

function peopleInput(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Search people' });
}

function peopleOption(page: Page, person: number, team: string): Locator {
  return page.getByRole('option', {
    name: new RegExp(`User ${person}\\s+user${person}@example\\.com\\s+${team}`),
  });
}

async function requiredId(locator: Locator, label: string): Promise<string> {
  const id = await locator.getAttribute('id');
  expect(id, `${label} should expose an id for aria-activedescendant`).toBeTruthy();
  return id!;
}

test.describe('omnibar accessibility contract', () => {
  test('global hotkey opens the combobox, skips disabled options, and submits active result', async ({
    page,
  }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press('/');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await input.fill('user');
    const user1 = peopleOption(page, 1, 'Design');
    const user2 = peopleOption(page, 2, 'Engineering');
    const user3 = peopleOption(page, 3, 'Support');
    await expect(user1).toBeVisible();
    await expect(user2).toHaveAttribute('aria-disabled', 'true');
    await expect(user2).toBeDisabled();
    await expect(input).toHaveAttribute('aria-activedescendant', await requiredId(user1, 'User 1'));

    await page.keyboard.press('ArrowDown');
    await expect(user2).toHaveAttribute('aria-selected', 'false');
    await expect(user3).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute('aria-activedescendant', await requiredId(user3, 'User 3'));

    await page.keyboard.press('Enter');
    await expect(page.getByText('Selected User 3 from Support.')).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
  });

  test('bare global hotkey does not steal typing from another editable field', async ({ page }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await page.evaluate(() => {
      const field = document.createElement('input');
      field.setAttribute('aria-label', 'Outside editor');
      document.body.append(field);
      field.focus();
    });

    const outsideEditor = page.getByRole('textbox', { name: 'Outside editor' });
    await expect(outsideEditor).toBeFocused();

    await page.keyboard.press('/');

    await expect(outsideEditor).toHaveValue('/');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  test('F6 moves through the action strip without adding tab stops', async ({ page }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await input.fill('user');
    await expect(peopleOption(page, 1, 'Design')).toBeVisible();

    const toolbar = page.getByRole('toolbar', { name: 'People search filters' });
    const filters = toolbar.getByRole('button', { name: 'Filters' });
    const clearSelection = toolbar.getByRole('button', { name: 'Clear selection' });
    await expect(filters.locator('hell-icon')).toBeVisible();
    await expect(clearSelection.locator('hell-icon')).toBeVisible();
    await expect(filters).toHaveAttribute('tabindex', '-1');
    await expect(clearSelection).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('F6');
    await expect(filters).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(clearSelection).toBeFocused();

    await page.keyboard.press('ArrowLeft');
    await expect(filters).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(filters).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('F6');
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('async errors are announced and recover on the next successful query', async ({ page }) => {
    await gotoOmnibar(page);

    const input = peopleInput(page);
    await input.fill('error');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('alert')).toHaveText('Search failed. Try again.');
    await expect(input).toBeFocused();

    await input.fill('user1');
    await expect(peopleOption(page, 1, 'Design')).toBeVisible();
    await expect(page.getByRole('alert')).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  test('docs omnibar menus render above the omnibar panel with icon-labelled triggers', async ({
    page,
  }) => {
    await page.goto('/');
    const docsSearch = page.getByRole('combobox', { name: 'Search docs' });

    await docsSearch.click();
    await docsSearch.fill('table');
    await expect(docsSearch).toHaveAttribute('aria-expanded', 'true');

    const toolbar = page.getByRole('toolbar', { name: 'Docs search controls' });
    const controls = toolbar.getByRole('button', { name: 'Docs search controls' });
    const kind = toolbar.getByRole('button', { name: 'All types' });
    const section = toolbar.getByRole('button', { name: 'All sections' });
    await expect(controls.locator('hell-icon')).toBeVisible();
    await expect(kind.locator('hell-icon')).toBeVisible();
    await expect(section.locator('hell-icon')).toBeVisible();

    await controls.click();
    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();

    const stack = await page.evaluate(() => {
      const menu = document.querySelector<HTMLElement>('[hellMenu][data-slot="root"]');
      const pane = document.querySelector<HTMLElement>('.hell-omnibar-overlay-pane');
      if (!menu || !pane) throw new Error('Expected omnibar menu and pane.');

      const rect = menu.getBoundingClientRect();
      const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        menuZ: Number(getComputedStyle(menu).zIndex),
        paneZ: Number(getComputedStyle(pane).zIndex),
        topIsMenu: Boolean(target?.closest('[hellMenu][data-slot="root"]')),
      };
    });

    expect(stack.menuZ).toBeGreaterThan(stack.paneZ);
    expect(stack.topIsMenu).toBe(true);
  });
});
