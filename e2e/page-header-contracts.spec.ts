import { expect, test, type Page } from '@playwright/test';

async function gotoPageHeader(page: Page): Promise<void> {
  await page.goto('/components/page-header');
  await expect(page.getByRole('heading', { name: 'Page header', level: 1 })).toBeVisible();
}

test.describe('page header browser contract', () => {
  test('exposes the list-screen title as the page-level main heading with its meta and toolbar slots', async ({
    page,
  }) => {
    await gotoPageHeader(page);

    const example = page.locator('app-page-header-list-example');
    await expect(example).toBeVisible();

    // The projected title reads as a level-1 heading in the accessibility tree.
    const heading = example.getByRole('heading', { name: 'Team members', level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveAttribute('data-slot', 'title');

    // Meta and toolbar slots render their projected content.
    await expect(example.locator('[data-slot="meta"]')).toContainText('24 seats');
    await expect(example.locator('[data-slot="toolbar"]')).toBeVisible();
    await expect(example.getByRole('button', { name: 'Invite' })).toBeVisible();

    // No back affordance or breadcrumbs on a list screen, so no leading region.
    await expect(example.locator('[data-slot="leading"]')).toHaveCount(0);
  });

  test('detail screen renders the leading back + breadcrumbs, and the back affordance emits without navigating', async ({
    page,
  }) => {
    await gotoPageHeader(page);

    const example = page.locator('app-page-header-detail-example');
    await expect(example).toBeVisible();

    // Leading region holds the back affordance and the breadcrumb trail.
    const leading = example.locator('[data-slot="leading"]');
    await expect(leading).toBeVisible();
    await expect(leading.locator('nav[aria-label]')).toBeVisible();
    await expect(leading.getByText('Team', { exact: true })).toBeVisible();

    // The title is still the level-1 main heading.
    await expect(example.getByRole('heading', { name: 'Ada Lovelace', level: 1 })).toBeVisible();

    // The back affordance is a real button named from the Label Contract.
    const back = example.getByRole('button', { name: 'Go back' });
    await expect(back).toBeVisible();

    // Activating it emits an event only; the docs example records it and the URL
    // never changes (no routing performed by the header itself).
    const urlBefore = page.url();
    await back.click();
    await expect(example.getByTestId('page-header-last-event')).toHaveText('back');
    expect(page.url()).toBe(urlBefore);
  });

  test('the toolbar in the header slot collapses into the overflow menu when the header narrows and recomputes inline when it widens', async ({
    page,
  }) => {
    await gotoPageHeader(page);

    const example = page.locator('app-page-header-list-example');
    const header = example.locator('hell-page-header');
    const toolbar = example.locator('[data-slot="toolbar"] hell-overflow-toolbar');
    const overflowTrigger = toolbar.getByRole('button', { name: 'More actions' });

    const inlineLabels = (): Promise<string[]> =>
      toolbar
        .locator(
          '.hell-overflow-toolbar-actions [data-slot="action"] .hell-overflow-toolbar-action-label',
        )
        .allInnerTexts()
        .then((texts) => texts.map((text) => text.trim()).filter(Boolean));

    // Baseline at the natural docs width: the never-overflow and both auto actions
    // render inline (polled, because the toolbar starts collapsed-to-never and
    // only expands after its first measurement commits — first paint never
    // flashes a clipped row). "Settings" is always-overflow, so the trigger shows.
    await expect.poll(inlineLabels).toEqual(['Invite', 'Filter', 'Export']);
    await expect(overflowTrigger).toBeVisible();

    // Narrow the header container: the flex-1 toolbar slot shrinks, so the two
    // auto actions collapse into the overflow menu while the never-overflow action stays
    // pinned inline. Driven through the container width the toolbar's
    // ResizeObserver watches — the same lever the toolbar's own contract uses.
    await header.evaluate((element: HTMLElement) => {
      element.style.width = '240px';
    });
    await expect.poll(inlineLabels).toEqual(['Invite']);

    // No action is unreachable while collapsed: the auto actions and the
    // always-overflow action are all in the menu.
    await overflowTrigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Filter' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Export' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    // Widen again: the auto actions recompute back inline (widen-then-recompute),
    // so no action is stranded in the menu once the room returns.
    await header.evaluate((element: HTMLElement) => {
      element.style.width = '900px';
    });
    await expect.poll(inlineLabels).toEqual(['Invite', 'Filter', 'Export']);
  });
});
