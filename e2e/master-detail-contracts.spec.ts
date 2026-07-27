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

/**
 * How far the visible panes stick out of the Master Detail frame, and how far
 * the document scrolls sideways, read together so the two cannot be measured
 * at different reflow states. The frame clips its overflow, so a pane pinned
 * wider than its container is invisible to a document-level check alone.
 */
async function overflowOf(example: Locator): Promise<{ pane: number; document: number }> {
  return example.evaluate((element) => {
    const frame = element as HTMLElement;
    const panes = [...frame.querySelectorAll('[hellMasterPane]')] as HTMLElement[];
    const visible = panes.filter((pane) => pane.getClientRects().length > 0);
    if (!visible.length) throw new Error('Expected at least one visible pane.');
    const widest = Math.max(...visible.map((pane) => pane.getBoundingClientRect().width));
    return {
      pane: Math.round(widest - frame.clientWidth),
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
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
    // The pinned width is wider than the compact frame, so the pane must be
    // refitted rather than clipped by the frame's own `overflow-hidden`.
    expect(pinned).toBeGreaterThan(390);
    await expect.poll(() => overflowOf(example)).toEqual({ pane: 0, document: 0 });

    await page.setViewportSize({ width: 1440, height: 1000 });

    await expect(example).not.toHaveAttribute('data-compact', 'true');
    await expect(primary).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect.poll(() => overflowOf(example)).toEqual({ pane: 0, document: 0 });

    // The resize transaction has to survive both reflows, not just look right.
    const restored = await widthOf(primary);
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => widthOf(primary)).toBeLessThan(restored);
    await expect(handle).toBeFocused();

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
