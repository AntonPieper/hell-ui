import { expect, test, type Page } from '@playwright/test';

const TOOLBAR_HARNESS_PATH = '/components/toolbar?toolbarHarness=1';

const ALL_ACTIONS = ['New', 'Edit', 'Duplicate', 'Share', 'Download', 'Locked', 'Settings'];
const INLINABLE_ACTIONS = ['New', 'Edit', 'Duplicate', 'Share', 'Download', 'Locked'];

async function gotoToolbarHarness(page: Page): Promise<void> {
  await page.goto(TOOLBAR_HARNESS_PATH);
  await expect(
    page.getByRole('heading', { name: 'Toolbar contract harness', level: 1 }),
  ).toBeVisible();
}

async function setWidth(page: Page, width: 960 | 640 | 420 | 220): Promise<void> {
  await page.getByTestId(`toolbar-width-${width}`).click();
  // Let the ResizeObserver commit the new overflow membership.
  await expect.poll(() => inlineLabels(page)).not.toHaveLength(0);
}

/**
 * Settles a wide layout: membership transitions in single commits (there are no
 * incremental states), so once more than the collapsed-to-never first paint is
 * inline, the measured membership for the current width has committed. Needed
 * before using the inline row as a baseline (counts, "last inline action") —
 * on slow renderers the ResizeObserver commit can lag the width change.
 */
async function settleWide(page: Page): Promise<void> {
  await expect
    .poll(() => inlineLabels(page).then((labels) => labels.length))
    .toBeGreaterThanOrEqual(2);
}

/**
 * Settles a narrow layout: the stale wider membership overflows the clipped
 * row, while a committed narrow membership fits by construction of the policy.
 */
async function settleNarrow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const row = document.querySelector(
          '[data-testid="toolbar"] [data-hell-overflow-toolbar-actions]',
        );
        return row ? row.scrollWidth <= row.clientWidth : false;
      }),
    )
    .toBe(true);
}

/** Resizes without moving focus, so a focused action can be observed collapsing. */
async function setWidthKeepingFocus(page: Page, width: 960 | 640 | 420 | 220): Promise<void> {
  await page.evaluate((testId) => {
    (document.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null)?.click();
  }, `toolbar-width-${width}`);
}

async function setCapWidth(page: Page, width: 720 | 420 | 240): Promise<void> {
  await page.getByTestId(`toolbar-cap-width-${width}`).click();
  await expect(page.getByTestId('toolbar-cap-search')).toBeVisible();
}

async function inlineLabels(page: Page): Promise<string[]> {
  return page
    .locator('[data-testid="toolbar"] [data-slot="action"] .hell-overflow-toolbar-action-label')
    .allInnerTexts()
    .then((texts) => texts.map((text) => text.trim()).filter(Boolean));
}

interface MembershipSnapshot {
  readonly inline: string[];
  readonly overflow: string[];
}

/**
 * Opens the overflow menu and reads the inline row and the menu items in ONE
 * page evaluation — an atomic, same-tick snapshot. Sequential sampling (read
 * inline, then open the menu and read it) can straddle a membership commit on
 * slow renderers: the inline read sees the stale membership and the menu read
 * sees the fresh one, producing phantom duplicates in the union. A single-tick
 * snapshot is consistent at every moment because each commit renders the row
 * and the (reactive) open menu in the same change-detection pass.
 */
async function openOverflowSnapshot(page: Page): Promise<MembershipSnapshot> {
  const trigger = page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]');
  if ((await trigger.count()) === 0) return { inline: await inlineLabels(page), overflow: [] };
  await trigger.click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  const snapshot = await page.evaluate<MembershipSnapshot>(() => ({
    inline: Array.from(
      document.querySelectorAll(
        '[data-testid="toolbar"] [data-slot="action"] .hell-overflow-toolbar-action-label',
      ),
    ).map((el) => el.textContent?.trim() ?? ''),
    overflow: Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map(
      (el) => el.textContent?.trim() ?? '',
    ),
  }));
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  return snapshot;
}

test.describe('plain toolbar APG contracts', () => {
  test('owns the toolbar semantics, one tab stop, consumer activation, and Tooltip composition', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    const toolbar = page.getByTestId('plain-toolbar');
    await expect(toolbar).toHaveRole('toolbar');
    await expect(toolbar).toHaveAttribute('aria-label', 'Formatting actions');
    await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(toolbar.locator('[hellToolbarItem][tabindex="0"]')).toHaveCount(1);

    const bold = page.getByTestId('plain-toolbar-bold');
    const disabled = page.getByTestId('plain-toolbar-disabled');
    const share = page.getByTestId('plain-toolbar-share');
    await bold.focus();
    await page.keyboard.press('ArrowRight');
    await expect(share).toBeFocused();
    await expect(disabled).not.toBeFocused();
    await page.keyboard.press('Home');
    await expect(bold).toBeFocused();
    await page.keyboard.press('End');
    await expect(share).toBeFocused();

    await share.click();
    await expect(page.getByTestId('toolbar-last-action')).toHaveText('Share');
    await share.hover();
    await expect(page.getByRole('tooltip', { name: 'Share formatting' })).toBeVisible();
  });

  test('uses vertical arrows and skips disabled items without measurement or duplicate DOM', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    const toolbar = page.getByTestId('plain-toolbar-vertical');
    await expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    const left = toolbar.getByRole('button', { name: 'Align left' });
    const center = toolbar.getByRole('button', { name: 'Align center' });
    const right = toolbar.getByRole('button', { name: 'Align right' });
    await left.focus();
    await page.keyboard.press('ArrowDown');
    await expect(right).toBeFocused();
    await expect(center).not.toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(left).toBeFocused();

    await expect(toolbar.locator('button')).toHaveCount(3);
    await expect(toolbar.locator('[data-slot="overflowTrigger"]')).toHaveCount(0);
    await expect(toolbar.locator('[class*="measure"]')).toHaveCount(0);
    await expect(toolbar.locator('hell-overflow-toolbar')).toHaveCount(0);
  });
});

test.describe('overflow toolbar measurement + APG keyboard contracts', () => {
  test('collapses auto actions into the overflow menu as the container narrows, losing none, and recomputes on widen', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    await setWidth(page, 640);
    await settleWide(page);
    const wide = await openOverflowSnapshot(page);
    // The never-overflow action stays visible; the always-overflow action never renders inline.
    expect(wide.inline).toContain('New');
    expect(wide.inline).not.toContain('Settings');
    expect(wide.overflow).toContain('Settings');
    // No action is unreachable: inline ∪ overflow covers every declared action.
    expect([...wide.inline, ...wide.overflow].sort()).toEqual([...ALL_ACTIONS].sort());

    await setWidth(page, 220);
    await settleNarrow(page);
    const narrow = await openOverflowSnapshot(page);
    expect(narrow.inline).toContain('New');
    expect(narrow.inline.length).toBeLessThanOrEqual(wide.inline.length);
    await expect(
      page.getByTestId('toolbar').getByRole('button', { name: 'More actions' }),
    ).toBeVisible();
    expect([...narrow.inline, ...narrow.overflow].sort()).toEqual([...ALL_ACTIONS].sort());

    // Widen-then-recompute: growing the container must bring every collapsed
    // action back inline (cached widths, so no width-0 oscillation loses one).
    await setWidth(page, 960);
    await expect
      .poll(() => inlineLabels(page).then((labels) => labels.slice().sort()))
      .toEqual([...INLINABLE_ACTIONS].sort());
    const rewide = await openOverflowSnapshot(page);
    expect(rewide.overflow).toEqual(['Settings']);
  });

  test('keeps disabled parity for an action across the inline and menu renderings', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 640);
    // Settle before branching on inline membership, so the branch decision and
    // the sampled rendering come from the same committed state.
    await settleWide(page);

    const inlineLocked = page.locator(
      '[data-testid="toolbar"] [data-slot="action"]:has(.hell-overflow-toolbar-action-label:text-is("Locked"))',
    );
    if ((await inlineLocked.count()) > 0) {
      await expect(inlineLocked).toBeDisabled();
    } else {
      await page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]').click();
      await expect(page.getByRole('menuitem', { name: 'Locked' })).toBeDisabled();
      await page.keyboard.press('Escape');
    }
  });

  test('exposes one tab stop and roves focus across the button↔menu boundary', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 220);
    // Settle before opening the menu: a commit landing between Enter and the
    // focus assertion would insert items above the focused one.
    await settleNarrow(page);

    const firstControl = page
      .locator('[data-testid="toolbar"] [data-hell-overflow-toolbar-control]')
      .first();
    await firstControl.focus();
    await expect(firstControl).toHaveAttribute('tabindex', '0');

    // Exactly one control is the tab stop.
    await expect(
      page.locator(
        '[data-testid="toolbar"] [data-hell-overflow-toolbar-control][tabindex="0"]',
      ),
    ).toHaveCount(1);

    // End jumps to the trailing overflow trigger; Enter opens the menu and
    // focus crosses into the menu (button → menu boundary).
    await page.keyboard.press('End');
    const trigger = page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem').first()).toBeFocused();

    // Escape returns focus to the trigger (menu → button boundary).
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('moves focus to the overflow trigger when the focused action collapses out of the row', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 640);
    // Settle so "last inline action" is a collapsible auto action, not the
    // collapsed-to-never first paint (where only "New" would be focusable).
    await settleWide(page);

    // Focus the last enabled inline action (the first to collapse as we narrow).
    const lastInline = page
      .locator('[data-testid="toolbar"] [data-slot="action"]:not([disabled])')
      .last();
    await lastInline.focus();
    await expect(lastInline).toBeFocused();

    // Narrow without moving focus off the action; it collapses out of the DOM.
    await setWidthKeepingFocus(page, 220);

    const trigger = page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]');
    await expect(trigger).toBeFocused();
  });

  test('keeps an open overflow menu in sync while the container resizes under it', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setWidth(page, 220);
    await settleNarrow(page);

    // Open the menu on the settled narrow membership.
    await page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]').click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const menuItems = () =>
      menu.getByRole('menuitem').allInnerTexts().then((texts) => texts.map((t) => t.trim()));
    expect(await menuItems()).toContain('Duplicate');

    // Grow the container underneath the OPEN menu (no click, so it stays open).
    await page.evaluate(() => {
      const container = document.querySelector<HTMLElement>('[data-testid="toolbar-container"]');
      if (container) container.style.width = '960px';
    });

    // The open menu re-renders reactively: collapsed actions move back inline
    // and drop out of the menu, leaving only the always-overflow action — no
    // action is ever rendered in both places at once.
    await expect.poll(menuItems).toEqual(['Settings']);
    await expect(menu).toBeVisible();
    await expect
      .poll(() => inlineLabels(page).then((labels) => labels.slice().sort()))
      .toEqual([...INLINABLE_ACTIONS].sort());

    const atomic = await page.evaluate(() => ({
      inline: Array.from(
        document.querySelectorAll(
          '[data-testid="toolbar"] [data-slot="action"] .hell-overflow-toolbar-action-label',
        ),
      ).map((el) => el.textContent?.trim() ?? ''),
      overflow: Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map(
        (el) => el.textContent?.trim() ?? '',
      ),
    }));
    expect([...atomic.inline, ...atomic.overflow].sort()).toEqual([...ALL_ACTIONS].sort());

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
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

    await page.locator('[data-testid="toolbar"] [data-slot="overflowTrigger"]').click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await expect(lastAction).toHaveText('Settings');
  });
});

test.describe('toolbar capabilities: icon-only actions, separators, widgets', () => {
  const capToolbar = '[data-testid="toolbar-cap"]';

  test('renders icon-only actions with a label-derived accessible name and no visible text', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);
    await setCapWidth(page, 720);

    const bold = page.locator(`${capToolbar} [data-slot="action"][aria-label="Bold"]`);
    await expect(bold).toBeVisible();
    await expect(bold).toHaveAttribute('data-icon-only', '');
    await expect(bold).toHaveAttribute('title', 'Bold');
    // Reachable by its accessible name, with no visible label text node.
    await expect(page.locator(capToolbar).getByRole('button', { name: 'Bold' })).toBeVisible();
    await expect(bold.locator('.hell-overflow-toolbar-action-label')).toHaveCount(0);
  });

  test('renders an inline separator between groups and a menu separator when collapsed', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    await setCapWidth(page, 720);
    await expect(
      page.locator(`${capToolbar} [data-slot="separator"]`).first(),
    ).toBeVisible();

    await setCapWidth(page, 240);
    await page.locator(`${capToolbar} [data-slot="overflowTrigger"]`).click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('[role="separator"]').first()).toBeAttached();
    await page.keyboard.press('Escape');
  });

  test('keeps the search-field widget visible at every width and in the roving order', async ({
    page,
  }) => {
    await gotoToolbarHarness(page);

    const search = page.getByTestId('toolbar-cap-search');

    await setCapWidth(page, 720);
    await expect(search).toBeVisible();

    // Narrow enough to collapse the icon actions: the widget never menu-ifies.
    await setCapWidth(page, 240);
    await expect(search).toBeVisible();
    await expect(page.locator(`${capToolbar} [data-slot="overflowTrigger"]`)).toBeVisible();

    // The widget's input participates in the single roving tab order.
    await search.focus();
    await expect(search).toBeFocused();
    await expect(search).toHaveAttribute('tabindex', '0');
    await expect(
      page.locator(`${capToolbar} [data-hell-overflow-toolbar-actions] [tabindex="0"]`),
    ).toHaveCount(1);
  });
});
