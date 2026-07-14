import { expect, test, type Locator, type Page } from '@playwright/test';

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
  const pointerId = 91;
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
}

test.describe('pagination navigation controls', () => {
  test('previous-next and page-jump recipes remain keyboard and screen-reader reachable', async ({
    page,
  }) => {
    await page.goto('/components/pagination');
    await expect(page.getByRole('heading', { name: 'Pagination', level: 1 })).toBeVisible();

    const previousNext = page.locator('app-pagination-previous-next-example');
    await expect(previousNext.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(previousNext.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(previousNext.getByText('Page 1 of 9')).toBeVisible();

    await previousNext.getByRole('button', { name: 'Next page' }).focus();
    await page.keyboard.press('Enter');
    await expect(previousNext.getByText('Page 2 of 9')).toBeVisible();

    const jump = page.locator('app-pagination-jump-example');
    const select = jump.getByRole('combobox', { name: 'Page' });
    await expect(jump.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(jump.getByText('of 40')).toBeVisible();
    await expect(select).toHaveValue('6');

    await jump.getByRole('button', { name: 'Previous page' }).focus();
    await page.keyboard.press('Tab');
    await expect(select).toBeFocused();

    await select.selectOption('12');
    await expect(select).toHaveValue('12');
  });
});

test.describe('split-view item navigation', () => {
  test('moves between items by keyboard after pane resize and disables boundaries', async ({
    page,
  }) => {
    await page.goto('/components/split-view');
    await expect(page.getByRole('heading', { name: 'Split view', level: 1 })).toBeVisible();

    const example = page.locator('app-split-view-master-detail-example');
    const primaryPane = example.locator('[data-pane="primary"]');
    const detailTitle = example.locator('[data-pane="detail"] strong');
    const handle = example.locator('[hellResizableHandle]');
    const previous = example.getByRole('button', { name: 'Previous ticket' });
    const next = example.getByRole('button', { name: 'Next ticket' });

    await expect(handle).toBeVisible();
    const startWidth = (await boxFor(primaryPane)).width;
    await dispatchPointerResize(page, handle, -64);
    await expect.poll(async () => (await boxFor(primaryPane)).width).toBeLessThan(startWidth - 24);

    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    await expect(example.getByText('Ticket 1 of 4')).toBeVisible();

    await next.focus();
    await page.keyboard.press('Enter');
    await expect(detailTitle).toHaveText('Review staged rollout');
    await expect(example.getByText('Ticket 2 of 4')).toBeVisible();
    await expect(previous).toBeEnabled();

    await page.keyboard.press(' ');
    await expect(detailTitle).toHaveText('Update role access');
    await expect(example.getByText('Ticket 3 of 4')).toBeVisible();
    await expect(next).toBeEnabled();

    await page.keyboard.press('Enter');
    await expect(detailTitle).toHaveText('Close billing dispute');
    await expect(example.getByText('Ticket 4 of 4')).toBeVisible();
    await expect(next).toBeDisabled();
    await expect(handle).toBeVisible();
  });
});
