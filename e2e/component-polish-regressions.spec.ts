import { mkdirSync } from 'node:fs';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

const VISUAL_EVIDENCE_DIR = process.env['HELL_VISUAL_EVIDENCE_DIR'];

test.describe('component polish regressions', () => {
  test('keeps the current date centered in the date picker cell', async ({ page }, testInfo) => {
    await freezeBrowserDate(page);
    await gotoDocsPage(page, '/components/date-picker', 'Date picker');

    const picker = page.locator('app-date-picker-single-date-example hell-date-picker');
    const today = dayButton(picker, 22);
    const cell = today.locator('xpath=ancestor::td[1]');

    await expect(today).toHaveAttribute('data-today', '');
    await expect(today).toHaveAttribute('data-selected', '');

    const todayBox = await requiredBox(today, 'current date button');
    const cellBox = await requiredBox(cell, 'current date cell');

    expect(Math.abs(centerX(todayBox) - centerX(cellBox))).toBeLessThanOrEqual(1);
    expect(Math.abs(centerY(todayBox) - centerY(cellBox))).toBeLessThanOrEqual(1);

    await captureLocator(picker, testInfo, 'date-picker-centered-current-date');
  });

  test('renders pagination status, page select, and previous-next mode', async ({
    page,
  }, testInfo) => {
    await gotoDocsPage(page, '/components/pagination', 'Pagination');

    const example = page.locator('app-pagination-basic-example');
    const defaultPagination = example.locator('hell-pagination').first();
    const previousNext = example.locator('hell-pagination').nth(1);

    await expect(defaultPagination.locator('select[aria-label="Select page"]')).toHaveValue('3');
    await expect(defaultPagination).toContainText('/12');
    await expect(previousNext).toHaveAttribute('data-mode', 'previous-next');
    await expect(previousNext.getByRole('button')).toHaveCount(2);
    await expect(previousNext.getByRole('button', { name: /^Page \d+$/ })).toHaveCount(0);
    await expect(previousNext).toContainText('/12');

    await capturePage(page, testInfo, 'pagination-status-select-previous-next');
  });

  test('opens the flyout example without shifting the outside action', async ({
    page,
  }, testInfo) => {
    await gotoDocsPage(page, '/components/flyout', 'Flyout');

    const example = page.locator('app-flyout-example-boundary-keeps-siblings-interactive-example');
    const trigger = example.getByRole('button', { name: 'Show flyout' });
    const outsideAction = example.getByRole('button', { name: 'Outside boundary action' });
    const before = await requiredBox(outsideAction, 'outside flyout action');

    await trigger.click();
    await expect(page.getByRole('dialog', { name: 'Anchored, non-modal' })).toBeVisible();
    const after = await requiredBox(outsideAction, 'outside flyout action');

    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);

    await capturePage(page, testInfo, 'flyout-no-layout-shift');
  });

  test('contains vertical sliders inside the example frame', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoDocsPage(page, '/components/slider', 'Slider');

    const example = page.locator('app-slider-vertical-example');
    const container = example.locator('> div');
    const sliders = example.locator('hell-slider[data-orientation="vertical"]');
    await expect(sliders).toHaveCount(2);

    const containerBox = await requiredBox(container, 'vertical slider container');
    for (let index = 0; index < 2; index += 1) {
      const slider = sliders.nth(index);
      const sliderBox = await requiredBox(slider, `vertical slider ${index + 1}`);
      const trackBox = await requiredBox(
        slider.locator('.hell-slider-track'),
        'vertical slider track',
      );

      expect(sliderBox.y).toBeGreaterThanOrEqual(containerBox.y - 1);
      expect(sliderBox.y + sliderBox.height).toBeLessThanOrEqual(
        containerBox.y + containerBox.height + 1,
      );
      expect(trackBox.height).toBeGreaterThan(100);
    }

    await capturePage(page, testInfo, 'vertical-slider-contained-mobile');
  });

  test('keeps selected toggle group contrast in dark mode', async ({ page }, testInfo) => {
    await forceDocsTheme(page, 'dark');
    await gotoDocsPage(page, '/components/toggle', 'Toggle');

    const example = page.locator('app-toggle-toggle-group-single-example');
    const selected = example.locator('button[data-selected]').first();
    await expect(selected).toBeVisible();

    const colors = await selected.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
      };
    });
    const contrast = contrastRatio(parseRgb(colors.color), parseRgb(colors.backgroundColor));

    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await capturePage(page, testInfo, 'toggle-group-dark-selected-contrast');
  });

  test('keeps the mobile app-shell secondary rail interactive', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoDocsPage(page, '/components/app-shell', 'App shell');

    const example = page.locator('app-app-shell-live-miniature-example');
    const shell = example.locator('.hell-shell');
    const secondary = example.locator('[data-hell-app-shell-panel="secondary"]');
    const secondaryBody = secondary.locator('.hell-secondary-body');

    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(secondary).toHaveAttribute('data-mobile-hidden', 'true');
    await expect(secondaryBody).toHaveAttribute('aria-hidden', 'true');
    await expect
      .poll(() => secondary.evaluate((element) => element.hasAttribute('inert')))
      .toBe(false);

    await secondary.getByRole('button', { name: 'Show secondary panel' }).click();
    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await expect(secondaryBody).not.toHaveAttribute('aria-hidden');
    await expect
      .poll(() => secondaryBody.evaluate((element) => element.hasAttribute('inert')))
      .toBe(false);

    await capturePage(page, testInfo, 'app-shell-mobile-secondary-open');
  });

  test('keeps the docs-site secondary sidebar reachable on mobile', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await gotoDocsPage(page, '/', 'hell — Heinrich Element Library');

    const shell = page.locator('body > hd-root > div[hellAppShell]');
    const main = page.locator('main[hellAppContent]');
    const secondary = page.locator('aside.hd-docs-secondary');
    const secondaryBody = secondary.locator('.hell-secondary-body');
    const topbarToggle = page.locator('.hd-docs-secondary-toggle');

    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expect(topbarToggle).toBeVisible();
    await expect(topbarToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(secondaryBody).toHaveAttribute('aria-hidden', 'true');

    const mainBox = await requiredBox(main, 'docs mobile main content');
    expect(mainBox.width).toBeGreaterThanOrEqual(360);

    await topbarToggle.click();
    await expect(shell).not.toHaveAttribute('data-secondary-hidden');
    await expect(topbarToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(secondary).toBeVisible();
    await expect(secondaryBody).not.toHaveAttribute('aria-hidden');
    await expect
      .poll(() => secondaryBody.evaluate((element) => element.hasAttribute('inert')))
      .toBe(false);

    await capturePage(page, testInfo, 'docs-site-mobile-secondary-open');
  });

  test('wraps audio-player controls on smaller screens without horizontal overflow', async ({
    page,
  }, testInfo) => {
    for (const viewport of [
      { width: 390, height: 760, label: 'mobile' },
      { width: 640, height: 760, label: 'small-tablet' },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await gotoDocsPage(page, '/components/audio-player', 'Audio player');

      const player = page.locator('app-audio-player-with-title-and-date-example hell-audio-player');
      const controls = player.locator('[data-slot="controls"]');
      const seek = player.locator('[data-slot="seek"]');
      const volume = player.locator('[data-slot="volume"]');
      const play = player.getByRole('button', { name: 'Play' });
      const mute = player.getByRole('button', { name: 'Mute' });
      const download = player.getByRole('link', { name: 'Download' });

      await expect(controls).toBeVisible();
      await expect.poll(() => hasHorizontalChildOverflow(controls)).toBe(false);

      const gaps = await gridGaps(controls);
      expect(gaps.column).toBeLessThanOrEqual(12);
      expect(gaps.row).toBeLessThanOrEqual(12);

      const playBox = await requiredBox(play, 'audio play button');
      const muteBox = await requiredBox(mute, 'audio mute button');
      const downloadBox = await requiredBox(download, 'audio download action');
      const seekBox = await requiredBox(seek, 'audio seek slider');
      const volumeBox = await requiredBox(volume, 'audio volume slider');

      expect(Math.abs(centerY(muteBox) - centerY(playBox))).toBeLessThanOrEqual(1);
      expect(Math.abs(centerY(downloadBox) - centerY(playBox))).toBeLessThanOrEqual(1);
      expect(seekBox.y).toBeGreaterThan(playBox.y + playBox.height - 1);
      expect(volumeBox.y).toBeGreaterThan(seekBox.y + seekBox.height - 1);
      expect(seekBox.width).toBeGreaterThan(180);
      expect(volumeBox.width).toBeGreaterThan(90);

      await captureLocator(player, testInfo, `audio-player-${viewport.label}-wrapping`);
    }
  });

  test('matches avatar overflow hover affordance to avatar items', async ({ page }, testInfo) => {
    await gotoDocsPage(page, '/components/avatar-group', 'Avatar group');

    const example = page.locator('app-avatar-group-overflow-menu-example');
    const overflow = example.getByRole('button', { name: '3 more people' });
    const borderColorBeforeHover = await overflow.evaluate(
      (element) => getComputedStyle(element).borderColor,
    );
    await overflow.hover();
    await expect
      .poll(() => overflow.evaluate((element) => getComputedStyle(element).transform !== 'none'))
      .toBe(true);
    await expect
      .poll(() => overflow.evaluate((element) => getComputedStyle(element).boxShadow))
      .toBe('none');
    await expect
      .poll(() => overflow.evaluate((element) => getComputedStyle(element).borderColor))
      .toBe(borderColorBeforeHover);

    await overflow.click();
    await expect(page.getByRole('menu').first()).toBeVisible();

    await capturePage(page, testInfo, 'avatar-group-overflow-menu-hover');
  });

  test('opens date input picker without a padded outer popover box', async ({ page }, testInfo) => {
    await freezeBrowserDate(page);
    await gotoDocsPage(page, '/components/date-input', 'Date input');

    const example = page.locator('app-date-input-text-input-calendar-popover-example');
    const input = example.getByRole('textbox', { name: 'Departure' });
    const trigger = dateInputHost(input).getByRole('button', { name: 'Choose date' });
    const triggerBox = await requiredBox(trigger, 'date input picker trigger');
    await trigger.click();

    const popover = page.locator('[data-slot="picker-popover"]');
    await expect(popover).toBeVisible();
    await expect(popover).not.toHaveClass(/hell-popover/);
    await expect(popover.locator('hell-date-picker')).toBeVisible();
    await expect(popover).toHaveCSS('padding-top', '0px');
    await expect(popover).toHaveCSS('border-top-width', '0px');

    const popoverBox = await requiredBox(popover, 'date input picker popover');
    expect(Math.abs(popoverBox.x + popoverBox.width - (triggerBox.x + triggerBox.width))).toBeLessThanOrEqual(4);
    expect(popoverBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height - 1);
    expect(popoverBox.y).toBeLessThanOrEqual(triggerBox.y + triggerBox.height + 12);

    await capturePage(page, testInfo, 'date-input-unstyled-picker-popover');
  });

  test('supports dialpad keyboard entry, call, clear, and letter labels', async ({
    page,
  }, testInfo) => {
    await gotoDocsPage(page, '/components/dialpad', 'Dialpad');

    const example = page.locator('app-dialpad-example-example');
    const dialpad = example.locator('hell-dialpad');
    await expect(dialpad.getByRole('button', { name: '2, ABC' })).toBeVisible();

    await dialpad.focus();
    await page.keyboard.press('2');
    await expect(example).toContainText('Current number: 2');

    await page.keyboard.press('Enter');
    await expect(example).toContainText('Last call: 2');

    await page.keyboard.press('Escape');
    await expect(example).toContainText(/Current number:\s*\u2014/);

    await capturePage(page, testInfo, 'dialpad-keyboard-call-clear');
  });

  test('renders omnibar menu buttons with icons above the omnibar panel', async ({
    page,
  }, testInfo) => {
    await gotoDocsPage(page, '/components/omnibar', 'Omnibar');

    const docsSearch = page.getByRole('combobox', { name: 'Search docs' });
    await docsSearch.fill('date');

    const toolbar = page.getByRole('toolbar', { name: 'Docs search controls' });
    await expect(toolbar.locator('hell-icon')).toHaveCount(3);

    await toolbar.getByRole('button', { name: 'Docs search controls' }).click();
    const menu = page.getByRole('menu').first();
    await expect(menu).toBeVisible();

    const [menuZ, paneZ] = await Promise.all([
      zIndex(menu),
      zIndex(page.locator('.hell-omnibar-overlay-pane').first()),
    ]);
    expect(menuZ).toBeGreaterThan(paneZ);
    await expect.poll(() => menuOwnsHitTarget(menu)).toBe(true);

    await capturePage(page, testInfo, 'omnibar-menu-icons-z-order');
  });

  test('adds previous-next pagination to split-view detail', async ({ page }, testInfo) => {
    await gotoDocsPage(page, '/components/split-view', 'Split view');

    const example = page.locator('app-split-view-master-detail-example');
    const pagination = example.locator('hell-pagination[data-mode="previous-next"]');
    await expect(pagination).toBeVisible();
    await expect(pagination).toContainText('/3');

    await pagination.getByRole('button', { name: 'Next page' }).click();
    await expect(example).toContainText('Review rollout');

    await capturePage(page, testInfo, 'split-view-detail-pagination');
  });

  test('supports efficient time-input field stepping and mobile picker layout', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await gotoDocsPage(page, '/components/time-input', 'Time input');

    const input = page.getByRole('textbox', { name: 'Reminder time' }).first();
    await expect(input).toHaveValue('14:30');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('14:35');

    await page.getByRole('button', { name: 'Choose time for Reminder time' }).first().click();
    await expect(page.getByRole('spinbutton', { name: 'Hours' })).toBeVisible();

    await capturePage(page, testInfo, 'time-input-mobile-picker-layout');
  });

  test('measures all expanded toast items immediately after expansion', async ({
    page,
  }, testInfo) => {
    await gotoDocsPage(page, '/components/toast', 'Toast');
    await page.getByRole('button', { name: 'Send 8 toasts' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    const toaster = page.locator('hell-toaster');
    const viewport = notifications.locator('[data-slot="viewport"]');
    const toasts = notifications.locator('[data-slot="toast"]');

    await expect(toasts).toHaveCount(8);
    await notifications.hover();
    await expect(toaster).toHaveAttribute('data-expanded', 'true');
    await expect.poll(() => visibleMeasuredToastCount(toasts)).toBe(8);
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollHeight > element.clientHeight))
      .toBe(true);

    await capturePage(page, testInfo, 'toast-expanded-immediate-measurement');
  });
});

async function gotoDocsPage(page: Page, path: string, heading: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible({
    timeout: 15_000,
  });
}

async function freezeBrowserDate(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(2026, 3, 22, 12, 0, 0, 0).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        Object.defineProperty(FixedDate, 'name', { value: 'Date' });
        globalThis.Date = FixedDate;
      })();
    `,
  });
}

async function forceDocsTheme(page: Page, theme: 'light' | 'dark'): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('hell-docs-theme', value);
  }, theme);
}

function dayButton(picker: Locator, day: number): Locator {
  return picker
    .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
    .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) })
    .first();
}

function dateInputHost(input: Locator): Locator {
  return input.locator('xpath=..');
}

async function captureLocator(locator: Locator, testInfo: TestInfo, name: string): Promise<void> {
  if (VISUAL_EVIDENCE_DIR) {
    mkdirSync(VISUAL_EVIDENCE_DIR, { recursive: true });
    await locator.screenshot({ path: `${VISUAL_EVIDENCE_DIR}/${screenshotName(testInfo, name)}` });
    return;
  }

  await testInfo.attach(`${name}.png`, {
    body: await locator.screenshot(),
    contentType: 'image/png',
  });
}

async function capturePage(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  if (VISUAL_EVIDENCE_DIR) {
    mkdirSync(VISUAL_EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: `${VISUAL_EVIDENCE_DIR}/${screenshotName(testInfo, name)}` });
    return;
  }

  await testInfo.attach(`${name}.png`, {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
}

function screenshotName(testInfo: TestInfo, name: string): string {
  return `${testInfo.project.name.replace(/\W+/g, '-').toLowerCase()}-${name}.png`;
}

async function requiredBox(locator: Locator, label: string): Promise<RequiredBox> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Expected ${label} to have a bounding box.`);
  return box;
}

function centerX(box: RequiredBox): number {
  return box.x + box.width / 2;
}

function centerY(box: RequiredBox): number {
  return box.y + box.height / 2;
}

async function hasHorizontalChildOverflow(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return [...element.children].some((child) => {
      const childRect = child.getBoundingClientRect();
      return childRect.left < rect.left - 1 || childRect.right > rect.right + 1;
    });
  });
}

async function gridGaps(locator: Locator): Promise<{ column: number; row: number }> {
  return locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      column: Number.parseFloat(styles.columnGap) || 0,
      row: Number.parseFloat(styles.rowGap) || 0,
    };
  });
}

async function visibleMeasuredToastCount(locator: Locator): Promise<number> {
  return locator.evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const rect = element.getBoundingClientRect();
        return element.getAttribute('aria-hidden') !== 'true' && rect.width > 0 && rect.height > 0;
      }).length,
  );
}

async function zIndex(locator: Locator): Promise<number> {
  return locator.evaluate((element) => Number(getComputedStyle(element).zIndex) || 0);
}

async function menuOwnsHitTarget(locator: Locator): Promise<boolean> {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(24, rect.height / 2));
    return !!target && (target === element || !!target.closest('[role="menu"], [role^="menuitem"]'));
  });
}

interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface RequiredBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function parseRgb(color: string): RgbColor {
  const match = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (!match) throw new Error(`Expected an RGB color, got ${color}.`);
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
}

function contrastRatio(a: RgbColor, b: RgbColor): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: RgbColor): number {
  const [r, g, b] = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
