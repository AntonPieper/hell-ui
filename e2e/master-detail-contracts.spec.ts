import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const MASTER_DETAIL_PATH = '/components/master-detail';
const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function gotoMasterDetail(page: Page): Promise<void> {
  await page.goto(MASTER_DETAIL_PATH);
  await expect(page.getByRole('heading', { name: 'Master Detail', level: 1 })).toBeVisible();
}

async function widthOf(locator: Locator): Promise<number> {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

const FITS_INSIDE_FRAME = { paneEscapesFrame: false, documentScrollsSideways: false };
const FILLS_FRAME = { deadStrip: 0, paneEscapesFrame: false };

/**
 * How much of the frame's content box no rendered pane covers, read together
 * with whether a pane runs past it, in one evaluate so the two cannot come from
 * different reflow states.
 *
 * Measured against the frame rather than document scroll for the reason
 * `escapesFrame` gives: the frame clips its own overflow, so neither a pane
 * that overruns it nor a strip it leaves empty moves the document at all.
 */
async function fillsFrame(
  example: Locator,
): Promise<{ deadStrip: number; paneEscapesFrame: boolean } | string> {
  return example.evaluate((element) => {
    const frame = element as HTMLElement;
    const boxes = [
      ...frame.querySelectorAll('[hellMasterPane], [hellResizableHandle]'),
    ] as HTMLElement[];
    const rendered = boxes.filter((box) => box.getClientRects().length > 0);
    // Returned rather than thrown, so `expect.poll` waits out a mid-reflow read
    // instead of failing on the first attempt.
    if (!rendered.some((box) => box.matches('[hellMasterPane]'))) return 'no visible pane';
    const covered = rendered.reduce((sum, box) => sum + box.getBoundingClientRect().width, 0);
    const panes = rendered.filter((box) => box.matches('[hellMasterPane]'));
    const widest = Math.max(...panes.map((pane) => pane.getBoundingClientRect().width));
    return {
      // Signed, so boxes that together overrun the frame fail as loudly as ones
      // that leave it short. Sub-pixel layout rounds either way, so only a whole
      // pixel counts, and `+ 0` keeps a rounded-down overrun from reporting -0.
      deadStrip: Math.round(frame.clientWidth - covered) + 0,
      paneEscapesFrame: Math.round(widest - frame.clientWidth) > 0,
    };
  });
}

/**
 * Whether any visible pane is sized wider than the frame that holds it, and
 * whether the document scrolls sideways — read in one evaluate so the two
 * cannot come from different reflow states.
 *
 * Both are needed. The frame clips its own overflow, so a pane sized past it
 * hides its own content while the document stays exactly as wide as before;
 * a document-level scroll check alone reports that as healthy.
 */
async function escapesFrame(
  example: Locator,
): Promise<{ paneEscapesFrame: boolean; documentScrollsSideways: boolean } | string> {
  return example.evaluate((element) => {
    const frame = element as HTMLElement;
    const panes = [...frame.querySelectorAll('[hellMasterPane]')] as HTMLElement[];
    const visible = panes.filter((pane) => pane.getClientRects().length > 0);
    // Returned rather than thrown: `expect.poll` retries a mismatch but not an
    // exception, so throwing mid-reflow would fail on the first attempt instead
    // of waiting for the panes to settle.
    if (!visible.length) return 'no visible pane';
    const widest = Math.max(...visible.map((pane) => pane.getBoundingClientRect().width));
    return {
      // Sub-pixel layout rounds either way, so only a whole pixel past the
      // frame counts as escaping it.
      paneEscapesFrame: Math.round(widest - frame.clientWidth) > 0,
      documentScrollsSideways:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

test.describe('Master Detail responsive, focus, keyboard, and axe contracts', () => {
  test('wide mode keeps both consumer panes available and external Resizable owns keyboard sizing', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-resizable');
    const primary = example.locator('[hellMasterPane="primary"]');
    const detail = example.locator('[hellMasterPane="detail"]');
    const handle = example.getByTestId('master-detail-resizable-handle');

    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(primary).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(primary).not.toHaveAttribute('aria-hidden', 'true');
    await expect(detail).not.toHaveAttribute('aria-hidden', 'true');
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('role', 'separator');

    const before = await widthOf(primary);
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => widthOf(primary)).toBeGreaterThan(before);
    await expect(handle).toBeFocused();

    const violations = (
      await new AxeBuilder({ page })
        .include('[data-testid="master-detail-resizable"]')
        .withTags(WCAG_SMOKE_TAGS)
        .analyze()
    ).violations;
    expect(violations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('a pane pinned by keyboard resize refits when the viewport crosses the breakpoint', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-resizable');
    const primary = example.locator('[hellMasterPane="primary"]');
    const detail = example.locator('[hellMasterPane="detail"]');
    const handle = example.getByTestId('master-detail-resizable-handle');

    await expect(example).not.toHaveAttribute('data-compact', 'true');

    // A resized pane stops flexing: `resizable.ts` swaps `<initialFlex> 1 0`
    // for a rigid `0 0 <px>px` on first commit. Everything below asks what
    // happens to that pinned pixel width when the frame later becomes far
    // narrower than it — the case a viewport set before navigation never
    // reaches, because the pane is still flexible at first paint.
    const relaxed = await widthOf(primary);
    await handle.focus();
    for (let step = 0; step < 12; step += 1) await page.keyboard.press('ArrowRight');
    await expect.poll(() => widthOf(primary)).toBeGreaterThan(relaxed);
    const pinned = await widthOf(primary);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(handle).toBeHidden();
    await expect(detail).toBeHidden();
    await expect(detail).toHaveAttribute('aria-hidden', 'true');

    // The pinned width is far wider than the compact frame, so it has to be
    // refitted rather than left to be clipped by the frame's `overflow-hidden`.
    // Overflow is the hazard: a clipped pane hides its own content and the
    // frame swallows the evidence, which is why this is measured against the
    // frame rather than against document scroll.
    expect(pinned).toBeGreaterThan(390);
    await expect.poll(() => escapesFrame(example)).toEqual(FITS_INSIDE_FRAME);
    await expect.poll(() => widthOf(primary)).toBeLessThan(pinned);

    await page.setViewportSize({ width: 1440, height: 1000 });

    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(primary).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect.poll(() => escapesFrame(example)).toEqual(FITS_INSIDE_FRAME);

    // The resize transaction has to survive both reflows, not just look right.
    const restored = await widthOf(primary);
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => widthOf(primary)).toBeLessThan(restored);
    await expect(handle).toBeFocused();

    expect(consoleErrors).toEqual([]);
  });

  test('a pane hidden by the compact frame reserves no width in it, resized or not', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    // Wide first, narrow afterwards. A viewport set before navigation leaves
    // the panes flexible at first paint, so the committed widths this measures
    // never exist — which is how the strip stayed out of every earlier E2E.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-resizable');
    const primary = example.locator('[hellMasterPane="primary"]');
    const detail = example.locator('[hellMasterPane="detail"]');
    const handle = example.getByTestId('master-detail-resizable-handle');
    const open = page.getByTestId('master-detail-resizable-open');
    const back = page.getByTestId('master-detail-resizable-back');

    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);

    // Never resized: the panes have only ever flexed.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(detail).toBeHidden();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);

    // The pane that is hidden swaps, and the frame is still fully covered.
    await open.click();
    await expect(primary).toBeHidden();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);
    await back.click();
    await expect(detail).toBeHidden();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);

    // After a resize: the panes now hold committed pixel widths, measured in a
    // frame more than four times wider than the compact one.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await handle.focus();
    const relaxed = await widthOf(primary);
    for (let step = 0; step < 12; step += 1) await page.keyboard.press('ArrowRight');
    await expect.poll(() => widthOf(primary)).toBeGreaterThan(relaxed);
    const pinned = await widthOf(primary);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(detail).toBeHidden();
    expect(pinned).toBeGreaterThan(390);
    await expect.poll(() => widthOf(primary)).toBeLessThan(pinned);
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);

    await open.click();
    await expect(primary).toBeHidden();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);
    await back.click();
    await expect(detail).toBeHidden();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);

    // Filling the compact frame must not cost the split: the pane widths the
    // wide frame was left with are the ones it gets back.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(detail).toBeVisible();
    await expect.poll(() => fillsFrame(example)).toEqual(FILLS_FRAME);
    await expect
      .poll(async () => Math.abs((await widthOf(primary)) - pinned) < 1)
      .toBe(true);

    expect(consoleErrors).toEqual([]);
  });

  test('compact open and Back transfer focus while preserving consumer DOM state', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-basic');
    const primary = example.locator('[hellMasterPane="primary"]');
    const detail = example.locator('[hellMasterPane="detail"]');
    const opener = page.getByTestId('master-detail-basic-open');
    const back = page.getByTestId('master-detail-basic-back');
    const draft = page.getByTestId('master-detail-basic-draft');

    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(primary).toBeVisible();
    await expect(detail).toBeHidden();
    await expect(detail).toHaveAttribute('aria-hidden', 'true');
    await expect(detail).toHaveAttribute('inert', '');

    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(primary).toBeHidden();
    await expect(detail).toBeVisible();
    await expect(back).toBeFocused();
    await draft.fill('Edited while compact');

    await back.focus();
    await page.keyboard.press('Enter');
    await expect(primary).toBeVisible();
    await expect(detail).toBeHidden();
    await expect(opener).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(detail).toBeVisible();
    await expect(draft).toHaveValue('Edited while compact');
    await expect(back).toBeFocused();

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      )
      .toBe(true);

    const violations = (
      await new AxeBuilder({ page })
        .include('[data-testid="master-detail-basic"]')
        .withTags(WCAG_SMOKE_TAGS)
        .analyze()
    ).violations;
    expect(violations).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('viewport transitions move focus out of Back and the pane that becomes hidden', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-basic');
    const primary = example.locator('[hellMasterPane="primary"]');
    const detail = example.locator('[hellMasterPane="detail"]');
    const opener = page.getByTestId('master-detail-basic-open');
    const back = page.getByTestId('master-detail-basic-back');
    const draft = page.getByTestId('master-detail-basic-draft');

    await opener.click();
    await expect(back).toBeFocused();

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(primary).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(back).toBeHidden();
    await expect(draft).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(back).toBeVisible();
    await back.click();
    await expect(example).not.toHaveAttribute('data-detail-open', 'true');
    await expect(opener).toBeFocused();

    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(example).not.toHaveAttribute('data-detail-open', 'true');
    await draft.focus();
    await expect(draft).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(example).toHaveAttribute('data-compact', 'true');
    await expect(detail).toBeHidden();
    await expect(detail).toHaveAttribute('aria-hidden', 'true');
    await expect(opener).toBeFocused();
    expect(consoleErrors).toEqual([]);
  });

  test('external Pagination navigation remains keyboard reachable in compact detail', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoMasterDetail(page);

    const example = page.getByTestId('master-detail-navigation');
    await page.getByTestId('master-detail-message-0').click();
    await expect(page.getByTestId('master-detail-navigation-back')).toBeFocused();

    const previous = example.getByRole('button', { name: 'Previous message' });
    const next = example.getByRole('button', { name: 'Next message' });
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();

    await next.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('master-detail-navigation-title')).toHaveText(
      'Rollout window moved',
    );
    await expect(previous).toBeEnabled();
    await expect(next).toBeEnabled();
  });
});
