import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDataTableDocs(page: Page): Promise<void> {
  await page.goto('/components/data-table');
  await expect(page.getByRole('heading', { name: 'Table utilities', level: 1 })).toBeVisible();
}

async function boxFor(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected locator to have a bounding box.');
  return box;
}

async function dispatchPointerResize(page: Page, handle: Locator, deltaX: number): Promise<void> {
  const box = await boxFor(handle);
  const pointerId = 77;
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await handle.evaluate(
    (element, eventInit) => {
      element.dispatchEvent(
        new PointerEvent('pointerdown', {
          button: 0,
          bubbles: true,
          cancelable: true,
          clientX: eventInit.startX,
          clientY: eventInit.y,
          pointerId: eventInit.pointerId,
        }),
      );
    },
    { pointerId, startX, y },
  );
  await expect(handle).toHaveAttribute('data-active', 'true');
  await page.evaluate(
    (eventInit) => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          bubbles: true,
          cancelable: true,
          clientX: eventInit.startX + eventInit.deltaX,
          clientY: eventInit.y,
          pointerId: eventInit.pointerId,
        }),
      );
      window.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          cancelable: true,
          clientX: eventInit.startX + eventInit.deltaX,
          clientY: eventInit.y,
          pointerId: eventInit.pointerId,
        }),
      );
    },
    { pointerId, startX, y, deltaX },
  );
  await expect(handle).not.toHaveAttribute('data-active', 'true');
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

test.describe('data table docs regressions', () => {
  test('master/detail table columns resize on the visible docs example', async ({ page }) => {
    await gotoDataTableDocs(page);

    const example = page.locator('app-data-table-example-example');
    const nameHeader = example.locator('th[data-column-id="name"]').first();
    const handle = nameHeader.locator('.hell-table-resize-handle');

    await expect(handle).toHaveAttribute('role', 'separator');
    const startWidth = (await boxFor(nameHeader)).width;

    await dispatchPointerResize(page, handle, 96);

    await expect
      .poll(async () => (await boxFor(nameHeader)).width)
      .toBeGreaterThan(startWidth + 48);
  });

  test('column selector triggers use the same inactive and active variants as table filters', async ({
    page,
  }) => {
    await gotoDataTableDocs(page);

    const triggers = page.getByRole('button', { name: 'Columns' });
    await expect(triggers).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await expect(triggers.nth(index)).toHaveAttribute('data-size', 'sm');
    }

    const masterDetail = page.locator('app-data-table-example-example');
    const filterButton = masterDetail.getByRole('button', { name: 'Filters' });
    const sortButton = masterDetail.getByRole('button', { name: 'Best match' });
    const columnsButton = masterDetail.getByRole('button', { name: 'Columns' });

    await expect(filterButton).toHaveAttribute('data-variant', 'default');
    await expect(sortButton).toHaveAttribute('data-variant', 'default');
    await expect(columnsButton).toHaveAttribute('data-variant', 'default');

    await columnsButton.click();
    await page.getByRole('menuitemcheckbox', { name: 'Email' }).last().click();
    await expect(columnsButton).toHaveAttribute('data-variant', 'soft');
  });

  test('all data-table example previews keep the shared docs frame padding', async ({ page }) => {
    await gotoDataTableDocs(page);

    const previews = page.locator('hd-data-table hd-example-tabs .hd-example');
    await expect(previews).toHaveCount(9);

    const paddingTopValues = await previews.evaluateAll((elements) =>
      elements.map((element) => Number.parseFloat(getComputedStyle(element).paddingTop)),
    );
    expect(Math.min(...paddingTopValues)).toBeGreaterThan(0);
    expect(new Set(paddingTopValues).size).toBe(1);
  });

  test('mobile table examples keep shared header and row styling without page overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoDataTableDocs(page);

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
    }[] = [
      {
        host: 'app-data-table-simple-renderer-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
      },
      {
        host: 'app-data-table-tanstack-table-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
      },
      {
        host: 'app-data-table-virtual-example',
        header: '.hell-table-virtual-header-cell',
        cell: '.hell-table-virtual-cell',
      },
      {
        host: 'app-data-table-cdk-skin-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
      },
      {
        host: 'app-data-table-grid-mode-example',
        header: '.hell-table-header-cell',
        cell: '.hell-table-cell',
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
      await expect(await elementStyle(host.locator(example.cell).first())).toMatchObject(
        baselineCell,
      );
    }
  });

  test('TanStack Virtual keeps its header fixed while the mobile row body scrolls', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoDataTableDocs(page);

    const virtual = page.locator('app-data-table-virtual-example');
    const header = virtual.getByTestId('tanstack-virtual-header');
    const scroller = virtual.getByTestId('tanstack-virtual-scroll');
    await header.scrollIntoViewIfNeeded();

    const before = await boxFor(header);
    await scroller.evaluate((element) => {
      element.scrollTop = 260;
      element.dispatchEvent(new Event('scroll'));
    });
    await expect
      .poll(async () => await scroller.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    const after = await boxFor(header);

    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  });

  test('Angular CDK table sorting works for non-name columns', async ({ page }) => {
    await gotoDataTableDocs(page);

    const cdk = page.locator('app-data-table-cdk-skin-example');
    await cdk.getByRole('button', { name: 'Role' }).click();
    await expect(cdk.locator('tr[cdk-row]').first().locator('td[cdk-cell]').nth(2)).toHaveText(
      'Admin',
    );

    await cdk.getByRole('button', { name: 'Role' }).click();
    await expect(cdk.locator('tr[cdk-row]').first().locator('td[cdk-cell]').nth(2)).toHaveText(
      'Viewer',
    );
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
