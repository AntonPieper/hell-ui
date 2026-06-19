import { expect, test, type Locator, type Page } from '@playwright/test';

const RESIZABLE_HARNESS_PATH = '/components/resizable?resizeHarness=1';
const TABLE_A11Y_HARNESS_PATH = '/components/table?tableA11yHarness=1';

async function gotoResizableHarness(page: Page): Promise<void> {
  await page.goto(RESIZABLE_HARNESS_PATH);
  await expect(
    page.getByRole('heading', { name: 'Resizable contract harness', level: 1 }),
  ).toBeVisible();
}

async function gotoTableHarness(page: Page): Promise<void> {
  await page.goto(TABLE_A11Y_HARNESS_PATH);
  await expect(
    page.getByRole('heading', { name: 'Table accessibility harness', level: 1 }),
  ).toBeVisible();
}

async function numericAriaValue(locator: Locator): Promise<number> {
  await expect(locator).toHaveAttribute('aria-valuenow', /^\d+$/);
  const value = await locator.getAttribute('aria-valuenow');
  if (value === null) throw new Error('Expected numeric aria-valuenow.');
  return Number(value);
}

async function boxFor(
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected locator to have a bounding box.');
  return box;
}

async function widthOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

async function expectNoTextSelection(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => document.getSelection()?.toString() ?? '')).toBe('');
}

async function outputNumber(locator: Locator): Promise<number> {
  const text = await locator.textContent();
  return Number(text?.trim() ?? '0');
}

interface PointerDragState {
  readonly pointerId: number;
  readonly endX: number;
  readonly y: number;
}

async function dispatchPointerDrag(
  page: Page,
  handle: Locator,
  deltaX: number,
): Promise<PointerDragState> {
  const box = await boxFor(handle);
  const pointerId = 21;
  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  await page.evaluate(() => document.getSelection()?.removeAllRanges());
  const pointerDownPrevented = await handle.evaluate(
    (element, eventInit) => {
      const event = new PointerEvent('pointerdown', {
        button: 0,
        pointerId: eventInit.pointerId,
        clientX: eventInit.startX,
        clientY: eventInit.startY,
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    },
    { pointerId, startX, startY },
  );
  expect(pointerDownPrevented).toBe(true);
  await expect(handle).toHaveAttribute('data-active', 'true');
  await page.evaluate(
    (eventInit) => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerId: eventInit.pointerId,
          clientX: eventInit.endX,
          clientY: eventInit.y,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    { pointerId, endX: startX + deltaX, y: startY },
  );
  return { pointerId, endX: startX + deltaX, y: startY };
}

async function finishPointerDrag(page: Page, state: PointerDragState): Promise<void> {
  const pointerUpPrevented = await page.evaluate((eventInit) => {
    const event = new PointerEvent('pointerup', {
      pointerId: eventInit.pointerId,
      clientX: eventInit.endX,
      clientY: eventInit.y,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }, state);
  expect(pointerUpPrevented).toBe(true);
}

async function dispatchPointerMove(
  page: Page,
  state: PointerDragState,
  deltaX: number,
): Promise<void> {
  await page.evaluate(
    (eventInit) => {
      window.dispatchEvent(
        new PointerEvent('pointermove', {
          pointerId: eventInit.pointerId,
          clientX: eventInit.endX + eventInit.deltaX,
          clientY: eventInit.y,
          bubbles: true,
          cancelable: true,
        }),
      );
    },
    { ...state, deltaX },
  );
}

test.describe('modern resize handle browser contracts', () => {
  test('hellResizableHandle supports separator semantics, keyboard, pointer min-size clamp, cleanup, and RTL intent', async ({
    page,
  }) => {
    await gotoResizableHarness(page);

    const ltrHandle = page.getByTestId('resizable-ltr-handle');
    const beforePane = page.getByTestId('resizable-ltr-before');
    const afterPane = page.getByTestId('resizable-ltr-after');

    await expect(ltrHandle).toHaveAttribute('role', 'separator');
    await expect(ltrHandle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(ltrHandle).toHaveAttribute(
      'aria-controls',
      'resizable-ltr-before resizable-ltr-after',
    );
    await expect(ltrHandle).toHaveAttribute('aria-valuemin', '0');
    await expect(ltrHandle).toHaveAttribute('aria-valuemax', '100');

    const keyboardStart = await numericAriaValue(ltrHandle);
    const beforeWidthStart = await widthOf(beforePane);
    await ltrHandle.press('ArrowRight');
    const keyboardEnd = await numericAriaValue(ltrHandle);
    expect(keyboardEnd).toBeGreaterThan(keyboardStart);
    await expect.poll(() => widthOf(beforePane)).toBeGreaterThan(beforeWidthStart);

    const ltrDrag = await dispatchPointerDrag(page, ltrHandle, 500);
    await expect.poll(() => widthOf(afterPane)).toBeGreaterThanOrEqual(119);
    await finishPointerDrag(page, ltrDrag);
    await expect(ltrHandle).not.toHaveAttribute('data-active', 'true');
    const afterReleaseValue = await numericAriaValue(ltrHandle);
    await dispatchPointerMove(page, ltrDrag, 200);
    await expect.poll(() => numericAriaValue(ltrHandle)).toBe(afterReleaseValue);
    await expectNoTextSelection(page);

    const rtlHandle = page.getByTestId('resizable-rtl-handle');
    const rtlStart = await numericAriaValue(rtlHandle);
    await rtlHandle.press('ArrowRight');
    await expect.poll(() => numericAriaValue(rtlHandle)).toBeLessThan(rtlStart);
  });

  test('hellTableResizeHandle resizes semantic table markup without sort, row action, or text selection leakage', async ({
    page,
  }) => {
    await gotoTableHarness(page);

    const section = page.getByTestId('table-resize-semantic-section');
    const table = page.getByTestId('semantic-resize-table');
    const handle = page.getByTestId('semantic-resize-handle');
    const commitCount = section.getByTestId('semantic-resize-commit-count');

    await expect(table).toBeVisible();
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute(
      'aria-controls',
      'semantic-resize-name semantic-resize-role',
    );
    await expect(handle).toHaveAttribute('aria-valuemin', '0');
    await expect(handle).toHaveAttribute('aria-valuemax', '100');

    const start = await numericAriaValue(handle);
    await handle.press('ArrowRight');
    const afterKey = await numericAriaValue(handle);
    expect(afterKey).toBeGreaterThanOrEqual(start);
    await expect.poll(() => outputNumber(commitCount)).toBeGreaterThan(0);
    const commitsAfterKey = await outputNumber(commitCount);
    await expect(section.getByTestId('semantic-resize-sort-count')).toHaveText('0');
    await expect(section.getByTestId('semantic-resize-action-count')).toHaveText('0');

    const semanticDrag = await dispatchPointerDrag(page, handle, 500);
    await finishPointerDrag(page, semanticDrag);
    await expect(handle).not.toHaveAttribute('data-active', 'true');
    await expect.poll(() => outputNumber(commitCount)).toBeGreaterThan(commitsAfterKey);
    await expect(section.getByTestId('semantic-resize-sort-count')).toHaveText('0');
    await expect(section.getByTestId('semantic-resize-action-count')).toHaveText('0');
    await expectNoTextSelection(page);
  });

});
