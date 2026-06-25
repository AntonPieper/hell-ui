import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoTableDocs(page: Page): Promise<void> {
  await page.goto('/components/table');
  await expect(page.getByRole('heading', { name: 'Table', level: 1 })).toBeVisible();
}

async function boxFor(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await locator.scrollIntoViewIfNeeded();
  return rawBoxFor(locator);
}

async function rawBoxFor(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected locator to have a bounding box.');
  return box;
}

async function elementStyle(locator: Locator): Promise<Record<string, string>> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderBottomColor: style.borderBottomColor,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      paddingBlockStart: style.paddingBlockStart,
      paddingInlineStart: style.paddingInlineStart,
      letterSpacing: style.letterSpacing,
      textTransform: style.textTransform,
    };
  });
}

test.describe('table docs regressions', () => {
  test('all table example previews keep the shared docs frame padding', async ({ page }) => {
    await gotoTableDocs(page);

    const previews = page.locator('hd-table-page hd-example-tabs .hd-example');
    await expect(previews).toHaveCount(3);

    const paddingTopValues = await previews.evaluateAll((elements) =>
      elements.map((element) => Number.parseFloat(getComputedStyle(element).paddingTop)),
    );
    expect(Math.min(...paddingTopValues)).toBeGreaterThan(0);
    expect(new Set(paddingTopValues).size).toBe(1);
  });

  test('desktop primitive table example keeps row actions inside the table frame', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTableDocs(page);

    const primitive = page.locator('app-table-primitive-example');
    const frame = primitive.locator('.hell-table-container');
    const action = primitive.getByRole('button', { name: 'Open Ada Lovelace' });
    await expect(action).toBeVisible();
    await expect(action).toContainText('Open');
    await expect(primitive.getByRole('columnheader', { name: 'Action' })).toBeVisible();
    await expect(primitive.locator('tbody tr').first()).toHaveAttribute('data-selected', 'true');

    await primitive.getByRole('radio', { name: 'Select Grace Hopper' }).check();
    await expect(primitive.getByRole('row', { name: /Grace Hopper/ })).toHaveAttribute(
      'data-selected',
      'true',
    );

    const frameBox = await boxFor(frame);
    const actionBox = await boxFor(action);

    expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width);
  });

  test('mobile table examples keep shared header and row styling without page overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoTableDocs(page);

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    const examples: readonly {
      readonly host: string;
      readonly header: string;
      readonly cell: string;
      readonly cellIndex: number;
    }[] = [
      {
        host: 'app-table-primitive-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
        cellIndex: 1,
      },
      {
        host: 'app-table-tanstack-shell-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
        cellIndex: 1,
      },
      {
        host: 'app-table-tanstack-virtual-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
        cellIndex: 1,
      },
    ];

    const baselineHeader = await elementStyle(
      page.locator(examples[0].host).getByRole('columnheader', { name: 'Name' }),
    );
    const baselineCell = await elementStyle(
      page.locator(examples[0].host).locator(examples[0].cell).nth(examples[0].cellIndex),
    );
    const baselineCellChrome = omitStyleKeys(baselineCell, ['fontWeight']);

    for (const example of examples.slice(1)) {
      const host = page.locator(example.host);
      await expect(host).toBeVisible();
      await expect(
        await elementStyle(host.getByRole('columnheader', { name: 'Name' })),
      ).toMatchObject(baselineHeader);
      await expect(
        omitStyleKeys(await elementStyle(host.locator(example.cell).nth(example.cellIndex)), [
          'fontWeight',
        ]),
      ).toMatchObject(baselineCellChrome);
    }
  });

  test('TanStack shell projects toolbar and repeatable footer controls', async ({ page }) => {
    await gotoTableDocs(page);

    const example = page.locator('app-table-tanstack-shell-example');
    const shell = example.locator('hell-tanstack-table');
    const search = shell.getByRole('combobox', { name: 'Search people' });
    const nameHeader = shell.locator('th[data-column-id="name"]');

    await expect(search).toBeVisible();
    await expect(shell.locator('hell-omnibar')).toBeVisible();
    await expect(shell.locator('hell-tanstack-pagination hell-pagination')).toBeVisible();
    await expect(shell.locator('[data-hell-table-shell-footer]')).toContainText('server rows');
    await expect(shell.getByRole('button', { name: 'Filters' }).first()).toBeVisible();
    await expect(shell.getByRole('button', { name: 'More table actions' })).toBeVisible();
    await expect(shell.locator('button.hell-table-sort-trigger')).not.toHaveCount(0);
    await expect(shell.getByRole('row', { name: /Ada Lovelace/ })).toHaveClass(
      /bg-hell-primary-soft/,
    );
    await expect(shell.getByRole('row', { name: /Ada Lovelace/ })).not.toHaveAttribute(
      'data-selected',
    );

    await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    await expect(nameHeader).toHaveAttribute('data-sort', 'asc');
    await expect(nameHeader.getByRole('button', { name: /Sort name descending/ })).toHaveText(
      'Name',
    );
    await expect(nameHeader).not.toContainText(/\basc\b/i);
    await nameHeader.getByRole('button', { name: /Sort name descending/ }).click();
    await expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    await expect(nameHeader).toHaveAttribute('data-sort', 'desc');
    await expect(nameHeader.getByRole('button', { name: /Sort name clear sorting/ })).toHaveText(
      'Name',
    );
    await expect(nameHeader).not.toContainText(/\bdesc\b/i);
    await nameHeader.getByRole('button', { name: /Sort name clear sorting/ }).click();
    await expect.poll(async () => nameHeader.getAttribute('aria-sort')).toBeNull();
    await expect.poll(async () => nameHeader.getAttribute('data-sort')).toBeNull();

    await search.click();
    await page
      .locator('.cdk-overlay-pane [hellOmnibarAction]')
      .filter({ hasText: 'Filters' })
      .click();
    await expect(page.getByRole('menu').filter({ hasText: 'Any status' })).toBeVisible();
    await page.keyboard.press('Escape');

    await shell
      .locator('[data-hell-table-shell-toolbar-item]')
      .filter({ hasText: 'Filters' })
      .click();
    await expect(page.getByRole('menu').filter({ hasText: 'Any role' })).toBeVisible();
    await page.getByRole('menuitemradio', { name: 'Editor' }).click();
    await expect(shell.getByRole('row', { name: /Grace Hopper/ })).toBeVisible();
    await expect(shell.getByRole('cell', { name: 'Katherine Johnson' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await search.fill('Grace');

    await expect(shell.getByRole('row', { name: /Grace Hopper/ })).toBeVisible();
    await expect(shell.getByRole('cell', { name: 'Ada Lovelace' })).toHaveCount(0);

    await shell.getByRole('button', { name: 'Open Grace Hopper' }).click();
    await expect(shell.getByRole('button', { name: 'Open Grace Hopper' })).toContainText('Open');
    await expect(shell.getByRole('row', { name: /Grace Hopper/ })).toHaveClass(
      /bg-hell-primary-soft/,
    );
    await expect(shell.getByRole('row', { name: /Grace Hopper/ })).not.toHaveAttribute(
      'data-selected',
    );
    await expect(example.getByTestId('table-detail-pane')).toContainText('Grace Hopper');

    await search.fill('nobody');
    await expect(shell.getByTestId('table-server-empty')).toBeVisible();

    await shell.getByRole('button', { name: 'More table actions' }).click();
    await page.getByRole('menuitem', { name: 'Simulate server error' }).click();
    await expect(shell.getByTestId('table-server-error')).toContainText('Server query failed.');
  });

  test('omnibar panel stays anchored while the page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 620 });
    await gotoTableDocs(page);

    const shell = page.locator('app-table-tanstack-shell-example hell-tanstack-table');
    const omnibar = shell.locator('hell-omnibar');
    const control = omnibar.locator('[data-slot="control"]');
    const search = omnibar.getByRole('combobox', { name: 'Search people' });
    const panel = page.locator('.cdk-overlay-pane .hell-omnibar-panel-surface').first();
    const content = page.locator('.hell-content');

    await control.scrollIntoViewIfNeeded();
    await search.click();
    await expect(panel).toBeVisible();

    const beforeControl = await rawBoxFor(control);
    const beforePanel = await rawBoxFor(panel);
    const beforeOffset = omnibarPanelAnchorOffset(beforeControl, beforePanel);
    expect(beforeOffset).toBeLessThanOrEqual(12);
    expect(beforePanel.width).toBeGreaterThanOrEqual(beforeControl.width - 2);

    const beforeScrollTop = await content.evaluate((element) => element.scrollTop);
    await content.evaluate((element) => {
      element.scrollTop += 260;
    });
    await expect
      .poll(() => content.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(beforeScrollTop + 100);

    await expect(panel).toBeVisible();
    await expect
      .poll(async () => {
        const afterControl = await rawBoxFor(control);
        const afterPanel = await rawBoxFor(panel);
        return omnibarPanelAnchorOffset(afterControl, afterPanel);
      })
      .toBeLessThanOrEqual(12);
    const afterControl = await rawBoxFor(control);
    const afterPanel = await rawBoxFor(panel);
    expect(afterPanel.width).toBeGreaterThanOrEqual(afterControl.width - 2);
  });

  test('TanStack Virtual strategy marks one shell body without a second table root', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoTableDocs(page);

    const virtual = page.locator('app-table-tanstack-virtual-example hell-tanstack-table');
    await expect(virtual).toHaveAttribute('data-hell-tanstack-virtual-rows', 'true');
    await expect(virtual.getByRole('combobox', { name: 'Search virtual rows' })).toBeVisible();
    await expect(virtual.locator('hell-tanstack-pagination')).toHaveCount(0);
    await expect(virtual.getByRole('button', { name: 'More virtual table actions' })).toBeVisible();
    await expect(virtual.locator('[data-hell-table-virtual-scrollport="true"]')).toHaveCount(1);
    await expect(virtual.locator('[data-hell-table-virtual-body="true"]')).toHaveCount(1);
    await expect(virtual.locator('[data-hell-table-virtual-row="true"]')).not.toHaveCount(0);
    await expect(virtual.locator('[data-hell-table-shell-footer]')).toContainText('36 visible');
    await expect(virtual.getByRole('row', { name: /Person 1 Admin/ }).first()).toHaveClass(
      /bg-hell-primary-soft/,
    );
    await expect(virtual.getByRole('row', { name: /Person 1 Admin/ }).first()).not.toHaveAttribute(
      'data-selected',
    );
    expect(await virtual.locator('[data-hell-table-virtual-row-kind="row"]').count()).toBeLessThan(
      36,
    );

    await virtual.getByRole('combobox', { name: 'Search virtual rows' }).click();
    await page
      .locator('.cdk-overlay-pane [hellOmnibarAction]')
      .filter({ hasText: 'Filters' })
      .click();
    await expect(page.getByRole('menu').filter({ hasText: 'Any status' })).toBeVisible();
    await page.keyboard.press('Escape');

    await virtual.getByRole('button', { name: 'Toggle details for Person 1', exact: true }).click();
    await expect(
      virtual.getByRole('button', { name: 'Toggle details for Person 1', exact: true }),
    ).toContainText('Details');
    await expect(virtual.locator('[data-hell-table-shell-expanded-cell]')).toHaveCount(1);
    await expect
      .poll(() =>
        virtual
          .locator('[data-hell-table-shell-expanded-cell]')
          .first()
          .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      )
      .toBe(true);

    const roleHeader = await boxFor(virtual.locator('th[data-column-id="role"]'));
    const personOneRow = virtual.getByRole('row', { name: /Person 1 Admin/ }).first();
    const firstRoleCell = await boxFor(personOneRow.locator('td[data-column-id="role"]'));
    expect(Math.abs(firstRoleCell.x - roleHeader.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(firstRoleCell.width - roleHeader.width)).toBeLessThanOrEqual(1);

    const before = await boxFor(virtual.locator('th[data-column-id="name"]'));
    const scrollport = virtual.locator('[data-hell-table-virtual-scrollport="true"]');
    await scrollport.evaluate((element) => {
      element.scrollTop = 240;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect
      .poll(async () => await scrollport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    const after = await boxFor(virtual.locator('th[data-column-id="name"]'));

    expect(Math.abs(after.y - before.y)).toBeLessThan(1);

    await page.setViewportSize({ width: 760, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);
    await page.setViewportSize({ width: 390, height: 900 });
    const resizedRoleHeader = await boxFor(virtual.locator('th[data-column-id="role"]'));
    const resizedRoleCell = await boxFor(personOneRow.locator('td[data-column-id="role"]'));
    expect(Math.abs(resizedRoleCell.x - resizedRoleHeader.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(resizedRoleCell.width - resizedRoleHeader.width)).toBeLessThanOrEqual(1);
  });

  test('TanStack shell preserves pagination controls after compact split-view back', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoTableDocs(page);

    const example = page.locator('app-table-tanstack-shell-example');
    const shell = example.locator('hell-tanstack-table');
    const pageSize = shell.locator('hell-tanstack-pagination select[data-slot="page-size-select"]');

    await pageSize.selectOption('5');
    await expect(pageSize).toHaveValue('5');
    await expect(shell.locator('tbody tr[data-hell-table-shell-row]')).toHaveCount(5);

    await shell.getByRole('button', { name: 'Open Ada Lovelace' }).click();
    const previous = example.getByRole('button', { name: 'Previous person' });
    const next = example.getByRole('button', { name: 'Next person' });
    await expect(previous).toHaveClass(/hell-pagination-item/);
    await expect(next).toHaveClass(/hell-pagination-item/);
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();

    await next.click();
    await expect(example.getByTestId('table-detail-pane')).toContainText('Dorothy Vaughan');
    await example.getByRole('button', { name: 'Back' }).click();

    await expect(pageSize).toHaveValue('5');
    await expect(shell.locator('tbody tr[data-hell-table-shell-row]')).toHaveCount(5);
  });

  test('TanStack shell split navigation waits for async page-boundary rows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoTableDocs(page);

    const example = page.locator('app-table-tanstack-shell-example');
    const shell = example.locator('hell-tanstack-table');
    const detailPane = example.getByTestId('table-detail-pane');

    await expect(shell.locator('tbody tr[data-hell-table-shell-row]')).toHaveCount(2);
    await shell.getByRole('button', { name: 'Open Dorothy Vaughan' }).click();
    await expect(detailPane).toContainText('Dorothy Vaughan');

    await example.getByRole('button', { name: 'Next person' }).click();
    await expect(detailPane).toContainText('Grace Hopper');

    await example.getByRole('button', { name: 'Previous person' }).click();
    await expect(detailPane).toContainText('Dorothy Vaughan');
  });
});

function omitStyleKeys(
  style: Record<string, string>,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(Object.entries(style).filter(([key]) => !keys.includes(key)));
}

function omnibarPanelAnchorOffset(
  control: { x: number; y: number; width: number; height: number },
  panel: { x: number; y: number; width: number; height: number },
): number {
  const inlineOffset = Math.abs(panel.x - control.x);
  const belowOffset = Math.abs(panel.y - (control.y + control.height + 4));
  const aboveOffset = Math.abs(panel.y + panel.height - (control.y - 4));
  return Math.max(inlineOffset, Math.min(belowOffset, aboveOffset));
}

test.describe('split-view docs regressions', () => {
  test('master/detail list buttons use the compact ghost Button root recipe', async ({ page }) => {
    await page.goto('/components/split-view');
    await expect(page.getByRole('heading', { name: 'Split view', level: 1 })).toBeVisible();

    const ticketButtons = page.locator(
      'app-split-view-master-detail-example [data-pane="primary"] button[hellbutton][data-slot="master-item"]',
    );
    await expect(ticketButtons).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-variant', 'ghost');
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-size', 'sm');
      await expect(ticketButtons.nth(index)).not.toHaveClass(/(^|\s)hell-button(\s|$)/);
      await expect(ticketButtons.nth(index)).toHaveClass(/(^|\s)bg-transparent(\s|$)/);
      await expect(ticketButtons.nth(index)).toHaveClass(
        /(^|\s)data-hover:bg-hell-surface-muted(\s|$)/,
      );
      await expect(ticketButtons.nth(index)).toHaveClass(
        /(^|\s)data-press:bg-hell-surface-muted(\s|$)/,
      );
      await expect(ticketButtons.nth(index)).toHaveClass(/(^|\s)shadow-none(\s|$)/);
    }
  });
});
