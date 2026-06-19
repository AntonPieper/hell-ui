import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoTableDocs(page: Page): Promise<void> {
  await page.goto('/components/table');
  await expect(page.getByRole('heading', { name: 'Table', level: 1 })).toBeVisible();
}

async function boxFor(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await locator.scrollIntoViewIfNeeded();
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
    await expect(primitive.getByRole('columnheader', { name: 'Action' })).toBeVisible();

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
        cellIndex: 0,
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
        cellIndex: 0,
      },
    ];

    const baselineHeader = await elementStyle(
      page.locator(examples[0].host).locator(examples[0].header).first(),
    );
    const baselineCell = await elementStyle(
      page.locator(examples[0].host).locator(examples[0].cell).first(),
    );

    for (const example of examples.slice(1)) {
      const host = page.locator(example.host);
      await expect(host).toBeVisible();
      await expect(await elementStyle(host.locator(example.header).first())).toMatchObject(
        baselineHeader,
      );
      await expect(await elementStyle(host.locator(example.cell).nth(example.cellIndex))).toMatchObject(
        baselineCell,
      );
    }
  });

  test('TanStack shell projects toolbar and repeatable footer controls', async ({ page }) => {
    await gotoTableDocs(page);

    const shell = page.locator('app-table-tanstack-shell-example hell-tanstack-table');
    await expect(shell.locator('hell-tanstack-global-filter')).toBeVisible();
    await expect(shell.locator('hell-tanstack-pagination')).toBeVisible();
    await expect(shell.locator('[data-hell-table-shell-footer]')).toContainText('visible');

    await shell.getByRole('searchbox').fill('Grace');

    await expect(shell.getByRole('row', { name: /Grace Hopper/ })).toBeVisible();
    await expect(shell.getByRole('cell', { name: 'Ada Lovelace' })).toHaveCount(0);
  });

  test('TanStack Virtual strategy marks one shell body without a second table root', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoTableDocs(page);

    const virtual = page.locator('app-table-tanstack-virtual-example hell-tanstack-table');
    await expect(virtual).toHaveAttribute('data-hell-tanstack-virtual-rows', 'true');
    await expect(virtual.locator('[data-hell-table-virtual-scrollport="true"]')).toHaveCount(1);
    await expect(virtual.locator('[data-hell-table-virtual-body="true"]')).toHaveCount(1);
    await expect(virtual.locator('[data-hell-table-virtual-row="true"]')).not.toHaveCount(0);
    await expect
      .poll(() =>
        virtual
          .locator('[data-hell-table-shell-expanded-cell]')
          .first()
          .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      )
      .toBe(true);

    const roleHeader = await boxFor(virtual.getByRole('columnheader', { name: 'Role' }));
    const firstRoleCell = await boxFor(virtual.getByRole('cell', { name: 'Admin' }).first());
    expect(Math.abs(firstRoleCell.x - roleHeader.x)).toBeLessThanOrEqual(1);

    const before = await boxFor(virtual.getByRole('columnheader', { name: 'Name' }));
    const scrollport = virtual.locator('[data-hell-table-virtual-scrollport="true"]');
    await scrollport.evaluate((element) => {
      element.scrollTop = 240;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect
      .poll(async () => await scrollport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    const after = await boxFor(virtual.getByRole('columnheader', { name: 'Name' }));

    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  });
});

test.describe('split-view docs regressions', () => {
  test('master/detail list buttons use the compact ghost style from the built-in back button', async ({
    page,
  }) => {
    await page.goto('/components/split-view');
    await expect(page.getByRole('heading', { name: 'Split view', level: 1 })).toBeVisible();

    const ticketButtons = page.locator(
      'app-split-view-master-detail-example [data-pane="primary"] button.hell-button',
    );
    await expect(ticketButtons).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-variant', 'ghost');
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-size', 'sm');
    }
  });
});
