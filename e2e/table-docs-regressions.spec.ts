import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDataTableDocs(page: Page): Promise<void> {
  await page.goto('/components/data-table');
  await expect(page.getByRole('heading', { name: 'Table utilities', level: 1 })).toBeVisible();
}

async function boxFor(locator: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
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

test.describe('data table docs regressions', () => {
  test('master/detail table columns resize on the visible docs example', async ({ page }) => {
    await gotoDataTableDocs(page);

    const example = page.locator('app-data-table-example-example');
    const nameHeader = example.locator('th[data-column-id="name"]').first();
    const handle = nameHeader.locator('.hell-table-resize-handle');

    await expect(handle).toHaveAttribute('role', 'separator');
    const startWidth = (await boxFor(nameHeader)).width;

    await dispatchPointerResize(page, handle, 96);

    await expect.poll(async () => (await boxFor(nameHeader)).width).toBeGreaterThan(startWidth + 48);
  });

  test('column selector triggers share one compact soft button style', async ({ page }) => {
    await gotoDataTableDocs(page);

    const triggers = page.getByRole('button', { name: 'Columns' });
    await expect(triggers).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await expect(triggers.nth(index)).toHaveAttribute('data-size', 'sm');
      await expect(triggers.nth(index)).toHaveAttribute('data-variant', 'soft');
    }
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
});

test.describe('split-view docs regressions', () => {
  test('master/detail list buttons use the compact ghost style from the built-in back button', async ({
    page,
  }) => {
    await page.goto('/components/split-view');
    await expect(page.getByRole('heading', { name: 'Split view', level: 1 })).toBeVisible();

    const ticketButtons = page.locator('app-split-view-master-detail-example [data-pane="primary"] button.hell-button');
    await expect(ticketButtons).toHaveCount(3);

    for (let index = 0; index < 3; index += 1) {
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-variant', 'ghost');
      await expect(ticketButtons.nth(index)).toHaveAttribute('data-size', 'sm');
    }
  });
});
