import { expect, test, type Page } from '@playwright/test';

const TOOLBAR_HARNESS_PATH = '/components/toolbar?toolbarHarness=1';

const ALL_ACTIONS = ['New', 'Edit', 'Duplicate', 'Share', 'Download', 'Locked', 'Settings'];

async function gotoToolbarHarness(page: Page): Promise<void> {
  await page.goto(TOOLBAR_HARNESS_PATH);
  await expect(
    page.getByRole('heading', { name: 'Toolbar contract harness', level: 1 }),
  ).toBeVisible();
}

async function setWidth(page: Page, width: 640 | 420 | 220): Promise<void> {
  await page.getByTestId(`toolbar-width-${width}`).click();
  // Let the ResizeObserver commit the new overflow membership.
  await expect.poll(() => inlineLabels(page)).not.toHaveLength(0);
}

async function inlineLabels(page: Page): Promise<string[]> {
  return page
    .locator('[data-testid="toolbar"] [data-slot="action"] .hell-toolbar-action-label')
    .allInnerTexts()
    .then((texts) => texts.map((text) => text.trim()).filter(Boolean));
}

async function openOverflowLabels(page: Page): Promise<string[]> {
  const trigger = page.getByRole('button', { name: 'More actions' });
  if ((await trigger.count()) === 0) return [];
  await trigger.click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  const labels = (await menu.getByRole('menuitem').allInnerTexts()).map((text) => text.trim());
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  return labels;
}

test.describe('toolbar overflow + APG keyboard contracts', () => {
  test('collapses lower-priority actions into the overflow menu as the container narrows, losing none', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    await setWidth(page, 640);
    const wideInline = await inlineLabels(page);
    const wideOverflow = await openOverflowLabels(page);
    // primary stays visible; overflowOnly never renders inline.
    expect(wideInline).toContain('New');
    expect(wideInline).not.toContain('Settings');
    expect(wideOverflow).toContain('Settings');
    // No action is unreachable: inline ∪ overflow covers every declared action.
    expect([...wideInline, ...wideOverflow].sort()).toEqual([...ALL_ACTIONS].sort());

    await setWidth(page, 220);
    const narrowInline = await inlineLabels(page);
    const narrowOverflow = await openOverflowLabels(page);
    expect(narrowInline).toContain('New');
    expect(narrowInline.length).toBeLessThanOrEqual(wideInline.length);
    await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible();
    expect([...narrowInline, ...narrowOverflow].sort()).toEqual([...ALL_ACTIONS].sort());
  });

  test('keeps disabled parity for an action across the inline and menu renderings', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 640);

    const inlineLocked = page.locator(
      '[data-testid="toolbar"] [data-slot="action"]:has(.hell-toolbar-action-label:text-is("Locked"))',
    );
    if ((await inlineLocked.count()) > 0) {
      await expect(inlineLocked).toBeDisabled();
    } else {
      await page.getByRole('button', { name: 'More actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Locked' })).toBeDisabled();
      await page.keyboard.press('Escape');
    }
  });

  test('exposes one tab stop and roves focus across the button↔menu boundary', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 220);

    const firstControl = page.locator('[data-testid="toolbar"] [data-hell-toolbar-control]').first();
    await firstControl.focus();
    await expect(firstControl).toHaveAttribute('tabindex', '0');

    // Exactly one control is the tab stop.
    await expect(
      page.locator('[data-testid="toolbar"] [data-hell-toolbar-control][tabindex="0"]'),
    ).toHaveCount(1);

    // End jumps to the trailing overflow trigger; Enter opens the menu and
    // focus crosses into the menu (button → menu boundary).
    await page.keyboard.press('End');
    const trigger = page.getByRole('button', { name: 'More actions' });
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem').first()).toBeFocused();

    // Escape returns focus to the trigger (menu → button boundary).
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('activates an action from both the inline button and the overflow menu', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 640);

    const lastAction = page.getByTestId('toolbar-last-action');

    await page
      .locator('[data-testid="toolbar"] [data-slot="action"]:has-text("New")')
      .first()
      .click();
    await expect(lastAction).toHaveText('New');

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(lastAction).toHaveText('Settings');
  });
});
