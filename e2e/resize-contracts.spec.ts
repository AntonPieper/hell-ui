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

  test('TanStack shell column resize keeps header and virtual body on one grid in both width regimes', async ({
    page,
  }) => {
    for (const viewport of [
      // Wider than the TanStack total size, so the header grid stretches and a
      // pointer delta is larger than the size delta TanStack records...
      { width: 1280, height: 900, stretched: true },
      // ...and narrower, where the table sits at its total size instead.
      { width: 900, height: 900, stretched: false },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const shell = await gotoResizableTableExample(page);

      expect(await shellStretch(shell)).toBeGreaterThan(viewport.stretched ? 8 : -1);
      if (!viewport.stretched) expect(await shellStretch(shell)).toBeLessThanOrEqual(1);

      const totalBefore = await shellTotalSize(shell);
      const serviceBefore = await columnHeaderWidth(shell, 'service');
      const ownerBefore = await columnHeaderWidth(shell, 'owner');

      await dragResizeHandle(page, shell, 'service', 70);

      const serviceAfter = await columnHeaderWidth(shell, 'service');
      const ownerAfter = await columnHeaderWidth(shell, 'owner');
      expect(serviceAfter).toBeGreaterThan(serviceBefore + 40);
      expect(ownerAfter).toBeLessThan(ownerBefore - 40);
      // The pair transacts against itself, so the rest of the grid is untouched
      // and the regression precondition the #352 alignment test relies on holds.
      expect(Math.abs(serviceAfter + ownerAfter - (serviceBefore + ownerBefore))).toBeLessThanOrEqual(
        1,
      );
      expect(Math.abs((await shellTotalSize(shell)) - totalBefore)).toBeLessThanOrEqual(0.5);

      await expect.poll(() => columnGridDrift(shell)).toBeLessThanOrEqual(1);
      // One committed width, not two channels: the colgroup the header grid
      // resolves from and the variables the virtual body row grows by agree.
      await expect.poll(() => sizeChannelDrift(shell)).toBeLessThanOrEqual(0.5);

      const scrollport = shell.locator('[data-hell-table-virtual-scrollport="true"]');
      await scrollport.evaluate((element) => {
        element.scrollTop = 620;
        element.dispatchEvent(new Event('scroll'));
      });
      await expect
        .poll(() => scrollport.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(400);
      await expect.poll(() => columnGridDrift(shell)).toBeLessThanOrEqual(1);
      await expect.poll(() => sizeChannelDrift(shell)).toBeLessThanOrEqual(0.5);
    }
  });

  test('TanStack shell resize separators are keyboard operable, bounded by TanStack minSize, and resettable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const shell = await gotoResizableTableExample(page);

    // Only columns with a resizable trailing neighbour carry a separator.
    await expect(shell.locator('[hellTableResizeHandle]')).toHaveCount(3);
    await expect(
      shell.locator('th[data-column-id="uptime"] [hellTableResizeHandle]'),
    ).toHaveCount(0);

    const handle = shell.locator('th[data-column-id="service"] [hellTableResizeHandle]');
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute('aria-label', 'Resize column service');

    await handle.focus();
    const valueBefore = await numericAriaValue(handle);
    const widthBefore = await columnHeaderWidth(shell, 'service');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => columnHeaderWidth(shell, 'service')).toBeLessThan(widthBefore - 8);
    await expect.poll(() => numericAriaValue(handle)).toBeLessThan(valueBefore);
    // Resize is a separator interaction, not grid navigation or a sort.
    await expect(handle).toBeFocused();
    await expect(shell.locator('thead th[aria-sort]')).toHaveCount(0);

    // Home and End run to the pair bounds, which are TanStack's own minSize
    // values (service 120, owner 96) rather than a sizing model Hell invented.
    await page.keyboard.press('Home');
    await expect.poll(() => columnSizeText(shell)).toContain('service 120px');
    await page.keyboard.press('End');
    await expect.poll(() => columnSizeText(shell)).toContain('owner 96px');
    await expect.poll(() => columnGridDrift(shell)).toBeLessThanOrEqual(1);

    // Sizing lives in TanStack state, so an outside control can reset it and
    // the rendered grid has to follow.
    await page.getByRole('button', { name: 'Reset widths' }).click();
    await expect
      .poll(() => columnSizeText(shell))
      .toBe('service 200px · owner 160px · region 176px · uptime 120px');
    await expect
      .poll(() => shell.locator('colgroup col').first().evaluate((col) => col.style.width))
      .toBe('200px');
    await expect.poll(() => columnGridDrift(shell)).toBeLessThanOrEqual(1);
  });

  test('pinned shell header cells stay on their body cells when the shell is resizable', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoTableHarness(page);

    const shell = page.getByTestId('pinned-resize-section').locator('hell-tanstack-table');
    await shell.scrollIntoViewIfNeeded();
    // The regime the positioning rules have to survive together: separators on,
    // columns pinned, and no sticky header row to position the cells already.
    await expect(shell).toHaveAttribute('data-hell-tanstack-resizable-columns', 'true');
    await expect(shell).not.toHaveAttribute('data-sticky-header', 'true');
    // Pinning is logical: TanStack v9 pins to 'start'/'end', not 'left'/'right'.
    await expect(shell.locator('thead th[data-pinned="start"]')).toHaveCount(2);

    // `position: relative` here would turn `--hell-table-pinned-start` into a
    // plain displacement, sliding the header off the column it heads.
    for (const columnId of ['name', 'role']) {
      expect(await headerPosition(shell, columnId)).toBe('sticky');
    }

    // The separator is absolutely positioned, so it only lands on the column
    // edge while its own header cell is the containing block.
    await expect(shell.locator('th[data-column-id="name"] [hellTableResizeHandle]')).toHaveCount(1);
    expect(await handleOverhang(shell, 'name')).toBeLessThanOrEqual(1);

    expect(await pinnedGridDrift(shell)).toBeLessThanOrEqual(1);

    const scrollport = shell.locator('[data-hell-table-shell-scrollport]');
    await scrollport.evaluate((element) => {
      element.scrollLeft = 260;
    });
    await expect.poll(() => scrollport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(
      100,
    );
    // Pinned header and body cells travel together, so they still share a column.
    await expect.poll(() => pinnedGridDrift(shell)).toBeLessThanOrEqual(1);

    await dragResizeHandle(page, shell, 'name', 40);
    await expect.poll(() => pinnedGridDrift(shell)).toBeLessThanOrEqual(1);
    expect(await handleOverhang(shell, 'name')).toBeLessThanOrEqual(1);
  });
});

async function headerPosition(shell: Locator, columnId: string): Promise<string> {
  return shell
    .locator(`th[data-column-id="${columnId}"]`)
    .evaluate((element) => getComputedStyle(element).position);
}

/** Worst header-to-body-cell offset or width difference across the pinned columns. */
async function pinnedGridDrift(shell: Locator): Promise<number> {
  return shell.evaluate((element) => {
    const headers = [...element.querySelectorAll('thead th[data-pinned]')];
    const row = element.querySelector('tbody tr');
    if (!headers.length || !row) throw new Error('Expected pinned headers and a body row.');
    return Math.max(
      ...headers.map((header) => {
        const columnId = header.getAttribute('data-column-id');
        const cell = row.querySelector(`td[data-column-id="${columnId}"]`);
        if (!cell) throw new Error(`Expected a body cell for column ${columnId}.`);
        const headerBox = header.getBoundingClientRect();
        const cellBox = cell.getBoundingClientRect();
        return Math.max(
          Math.abs(cellBox.x - headerBox.x),
          Math.abs(cellBox.width - headerBox.width),
        );
      }),
    );
  });
}

/** How far a separator escapes its header cell, which is zero while that cell positions it. */
async function handleOverhang(shell: Locator, columnId: string): Promise<number> {
  return shell.evaluate((element, id) => {
    const header = element.querySelector(`th[data-column-id="${id}"]`);
    const handle = header?.querySelector('[hellTableResizeHandle]');
    if (!header || !handle) throw new Error(`Expected a separator on column ${id}.`);
    const headerBox = header.getBoundingClientRect();
    const handleBox = handle.getBoundingClientRect();
    return Math.max(headerBox.left - handleBox.left, handleBox.right - headerBox.right, 0);
  }, columnId);
}

async function gotoResizableTableExample(page: Page): Promise<Locator> {
  await page.goto('/components/table');
  await expect(page.getByRole('heading', { name: 'Table', level: 1 })).toBeVisible();
  const shell = page.locator('app-table-tanstack-resizable-example hell-tanstack-table');
  await expect(shell).toHaveAttribute('data-hell-tanstack-resizable-columns', 'true');
  await shell.scrollIntoViewIfNeeded();
  await expect(shell.locator('[data-hell-table-virtual-row-kind="row"]').first()).toBeVisible();
  return shell;
}

async function shellTotalSize(shell: Locator): Promise<number> {
  return shell.evaluate((element) => {
    const table = element.querySelector('[data-hell-table-shell-table]') as HTMLElement;
    return Number.parseFloat(getComputedStyle(table).getPropertyValue('--hell-table-total-size'));
  });
}

async function shellStretch(shell: Locator): Promise<number> {
  return shell.evaluate((element) => {
    const table = element.querySelector('[data-hell-table-shell-table]') as HTMLElement;
    const totalSize = Number.parseFloat(
      getComputedStyle(table).getPropertyValue('--hell-table-total-size'),
    );
    return table.getBoundingClientRect().width - totalSize;
  });
}

async function columnHeaderWidth(shell: Locator, columnId: string): Promise<number> {
  return widthOf(shell.locator(`th[data-column-id="${columnId}"]`));
}

async function columnSizeText(shell: Locator): Promise<string> {
  const readout = shell.getByTestId('resizable-width-readout');
  return (await readout.textContent())?.trim() ?? '';
}

/** Worst header-to-body-cell offset or width difference across the grid. */
async function columnGridDrift(shell: Locator): Promise<number> {
  return shell.evaluate((element) => {
    const headers = [...element.querySelectorAll('thead th')];
    const row = element.querySelector('[data-hell-table-virtual-row-kind="row"]');
    const cells = row ? [...row.querySelectorAll('td')] : [];
    if (cells.length !== headers.length) {
      throw new Error(
        `Expected one virtual body cell per header, got ${cells.length} cells for ${headers.length} headers.`,
      );
    }
    return Math.max(
      ...headers.map((header, index) => {
        const headerBox = header.getBoundingClientRect();
        const cellBox = cells[index].getBoundingClientRect();
        return Math.max(Math.abs(cellBox.x - headerBox.x), Math.abs(cellBox.width - headerBox.width));
      }),
    );
  });
}

/**
 * Worst disagreement between the three places one committed width lands: the
 * `<colgroup>` the header grid resolves from, and the size and grow variables
 * the virtual body row reproduces that grid with.
 */
async function sizeChannelDrift(shell: Locator): Promise<number> {
  return shell.evaluate((element) => {
    const cols = [...element.querySelectorAll('colgroup col')] as HTMLElement[];
    const row = element.querySelector('[data-hell-table-virtual-row-kind="row"]');
    const cells = row ? ([...row.querySelectorAll('td')] as HTMLElement[]) : [];
    if (!cols.length || cells.length !== cols.length) {
      throw new Error(`Expected one col per body cell, got ${cols.length} and ${cells.length}.`);
    }
    return Math.max(
      ...cols.map((col, index) => {
        const colWidth = Number.parseFloat(col.style.width);
        const size = Number.parseFloat(cells[index].style.getPropertyValue('--hell-table-column-size'));
        const grow = Number.parseFloat(cells[index].style.getPropertyValue('--hell-table-column-grow'));
        return Math.max(Math.abs(size - colWidth), Math.abs(grow - colWidth));
      }),
    );
  });
}

async function dragResizeHandle(
  page: Page,
  shell: Locator,
  columnId: string,
  deltaX: number,
): Promise<void> {
  const box = await boxFor(shell.locator(`th[data-column-id="${columnId}"] [hellTableResizeHandle]`));
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + deltaX / 2, y, { steps: 5 });
  await page.mouse.move(x + deltaX, y, { steps: 5 });
  await page.mouse.up();
}
