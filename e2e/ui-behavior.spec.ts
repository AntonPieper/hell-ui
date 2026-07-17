import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { SETTLE_TIMEOUT, ensurePageIsActive, finishAnimations } from './utils';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoSeriousA11yIssues(
  page: Page,
  include: string,
  disabledRules: string[] = [],
) {
  const builder = new AxeBuilder({ page }).include(include).withTags(WCAG_SMOKE_TAGS);
  if (disabledRules.length) builder.disableRules(disabledRules);

  const results = await builder.analyze();

  const serious = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  );
  expect(serious).toEqual([]);
}

interface DialogFocusContract {
  label: string;
  triggerName: string | RegExp;
  dialogName: string | RegExp;
  description?: string | RegExp;
  initialFocusName: string | RegExp;
  nextFocusName: string | RegExp;
}

async function expectDialogFocusContract(page: Page, contract: DialogFocusContract): Promise<void> {
  try {
    await test.step(`${contract.label} focus trap`, async () => {
      await ensurePageIsActive(page);

      const trigger = page.getByRole('button', { name: contract.triggerName }).first();
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await expectFocused(page, trigger, `${contract.label} trigger before open`);

      await trigger.click();

      const dialog = page.getByRole('dialog', { name: contract.dialogName });
      const initialFocus = dialog.getByRole('button', { name: contract.initialFocusName });
      const nextFocus = dialog.getByRole('button', { name: contract.nextFocusName });

      await expect(dialog).toBeVisible();
      if (contract.description) {
        await expect(
          dialog.getByText(
            contract.description,
            typeof contract.description === 'string' ? { exact: true } : undefined,
          ),
        ).toBeVisible();
      }
      // A throttled WebKit page can freeze the enter animation's clock just
      // below full opacity, so finish it deterministically instead of waiting
      // for the frozen timeline to reach the final frame on its own.
      await finishAnimations(dialog);
      await expect
        .poll(() => dialog.evaluate((element) => getComputedStyle(element).opacity), {
          timeout: SETTLE_TIMEOUT,
        })
        .toBe('1');

      await expectFocused(page, initialFocus, `${contract.label} initial focus`);
      await page.keyboard.press('Tab');
      await expectFocused(page, nextFocus, `${contract.label} forward tab stays inside`);
      await page.keyboard.press('Tab');
      await expectFocused(page, initialFocus, `${contract.label} forward tab wraps inside`);
      await page.keyboard.press('Shift+Tab');
      await expectFocused(page, nextFocus, `${contract.label} reverse tab wraps inside`);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden({ timeout: SETTLE_TIMEOUT });
      await expectFocused(page, trigger, `${contract.label} trigger restore`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${contract.label} focus contract failed.\n${message}\n\n${await collectFocusDiagnostics(page)}`,
      { cause: error },
    );
  }
}

async function expectFocused(page: Page, locator: Locator, label: string): Promise<void> {
  try {
    await expect(locator, label).toBeFocused({ timeout: SETTLE_TIMEOUT });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\n\n${await collectFocusDiagnostics(page)}`, { cause: error });
  }
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <=
          window.innerWidth,
      ),
    )
    .toBe(true);
}

async function collectFocusDiagnostics(page: Page): Promise<string> {
  const [documentState, focusedPath, ariaSnapshot] = await Promise.all([
    page
      .evaluate(
        () => `visibilityState=${document.visibilityState} hasFocus=${document.hasFocus()}`,
      )
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
    focusedElementPath(page),
    page
      .locator('body')
      .ariaSnapshot()
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
  ]);

  return `Document state: ${documentState}\n\nFocused element path:\n${focusedPath}\n\nAccessibility tree:\n${ariaSnapshot}`;
}

async function focusedElementPath(page: Page): Promise<string> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!active) return '<none>';

    const parts: string[] = [];
    let current: Element | null = active;

    while (current) {
      const element = current;
      const tag = element.tagName.toLowerCase();
      const attributes = ['id', 'role', 'aria-label', 'data-hell-dialog-trigger']
        .map((name) => [name, element.getAttribute(name)] as const)
        .filter(([, value]) => value !== null && value !== '')
        .map(([name, value]) => `[${name}="${value}"]`)
        .join('');
      const text = ['button', 'a'].includes(tag)
        ? (element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80)
        : '';
      parts.unshift(`${tag}${attributes}${text ? ` "${text}"` : ''}`);
      current = element.parentElement;
    }

    return parts.join(' > ');
  });
}

interface LayoutBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly right: number;
  readonly bottom: number;
}

async function audioLayoutMetrics(player: Locator): Promise<{
  readonly controls: LayoutBox;
  readonly transport: LayoutBox;
  readonly actions: LayoutBox;
  readonly overflowing: readonly string[];
}> {
  return player.evaluate((element) => {
    const controls = element.querySelector<HTMLElement>('[data-slot="controls"]');
    const transport = element.querySelector<HTMLElement>('[data-slot="transport"]');
    const actions = element.querySelector<HTMLElement>('[data-slot="actions"]');
    if (!controls || !transport || !actions) {
      throw new Error('Expected audio player controls, transport, and actions slots.');
    }

    const box = (target: Element): LayoutBox => {
      const rect = target.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    };

    const controlsBox = box(controls);
    const overflowing = [
      ...controls.querySelectorAll<HTMLElement>(
        '[data-slot="transport"] > *, [data-slot="actions"] > *',
      ),
    ]
      .filter((child) => {
        const childBox = child.getBoundingClientRect();
        return childBox.left < controlsBox.x - 1 || childBox.right > controlsBox.right + 1;
      })
      .map(
        (child) =>
          child.getAttribute('aria-label') ?? child.getAttribute('data-slot') ?? child.tagName,
      );

    return {
      controls: controlsBox,
      transport: box(transport),
      actions: box(actions),
      overflowing,
    };
  });
}

test.describe('Hell UI browser behavior', () => {
  test('dialog focus trap and restore covers styled and scoped modes', async ({ page }) => {
    await page.goto('/components/dialog');

    await expectDialogFocusContract(page, {
      label: 'styled dialog',
      triggerName: 'Publish article',
      dialogName: 'Publish this article?',
      description: 'Once published, the article is visible to everyone.',
      initialFocusName: 'Cancel',
      nextFocusName: 'Publish',
    });

    await expectDialogFocusContract(page, {
      label: 'scoped dialog',
      triggerName: 'Block this panel',
      dialogName: 'Scoped to this region',
      initialFocusName: 'Close',
      nextFocusName: 'Close',
    });
  });

  test('dialpad supports keyboard entry, focus order, and state attributes', async ({ page }) => {
    await page.goto('/components/dialpad');

    // The basic example is an uncontrolled dialpad that surfaces (valueChange)
    // through its display input and (call) through a "Calling …" status line.
    const example = page.locator('app-dialpad-basic-example');
    const dialpad = example.getByRole('group', { name: 'Dial pad' });
    const display = dialpad.getByRole('textbox', { name: 'Number' });
    const lastCall = example.locator('p');

    await expect(dialpad).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Digit 1' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Digit 2, ABC' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Star' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Digit 0, plus' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Pound' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Backspace' })).toHaveAttribute(
      'data-icon-only',
      '',
    );

    await display.click();
    await expectFocused(page, display, 'dialpad number input focus');
    await page.keyboard.press('2');
    await expect(display).toHaveValue('2');

    const five = dialpad.getByRole('button', { name: 'Digit 5, JKL' });
    await five.focus();
    await expectFocused(page, five, 'dialpad child key focus');
    await page.keyboard.press('6');
    await expect(display).toHaveValue('26');

    await page.keyboard.press('Backspace');
    await expect(display).toHaveValue('2');
    await page.keyboard.press('Delete');
    await expect(display).toHaveValue('');

    const zero = dialpad.getByRole('button', { name: 'Digit 0, plus' });
    await zero.hover();
    await page.mouse.down();
    await page.waitForTimeout(560);
    await page.mouse.up();
    await expect(display).toHaveValue('+');

    await display.focus();
    await page.keyboard.press('Delete');
    await page.keyboard.press('3');
    await page.keyboard.press('Enter');
    await expect(lastCall).toHaveText('Calling 3…');

    await display.focus();
    await page.keyboard.press('Tab');
    await expectFocused(
      page,
      dialpad.getByRole('button', { name: 'Clear' }),
      'dialpad clear focus',
    );
    await page.keyboard.press('Tab');
    await expectFocused(
      page,
      dialpad.getByRole('button', { name: 'Backspace' }),
      'dialpad backspace focus',
    );
    await page.keyboard.press('Tab');
    await expectFocused(
      page,
      dialpad.getByRole('button', { name: 'Digit 1' }),
      'dialpad first key focus',
    );

    // The states example toggles disabled/readOnly/invalid through a
    // multiple-select toggle group, so its items are aria-pressed toggle
    // buttons rather than radios.
    const statesExample = page.locator('app-dialpad-states-example');
    const statesDialpad = statesExample.getByRole('group', { name: 'Dial pad' });
    const statesDisplay = statesDialpad.getByRole('textbox', { name: 'Number' });
    await statesExample.getByRole('button', { name: 'Invalid' }).click();
    await expect(statesDialpad).toHaveAttribute('aria-invalid', 'true');
    await statesExample.getByRole('button', { name: 'Read-only' }).click();
    await expect(statesDialpad).toHaveAttribute('data-readonly', '');
    await expect(statesDialpad.getByRole('button', { name: 'Digit 1' })).toBeDisabled();
    await expect(statesDialpad.getByRole('button', { name: 'Call' })).toBeEnabled();
    await statesExample.getByRole('button', { name: 'Disabled' }).click();
    await expect(statesDialpad).toHaveAttribute('aria-disabled', 'true');
    await expect(statesDisplay).toBeDisabled();
    await expect(statesDialpad.getByRole('button', { name: 'Call' })).toBeDisabled();
  });

  test('toast renders in the notification region and passes axe smoke', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Success' }).first().click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toHaveAttribute('role', 'region');
    await expect(notifications).toHaveAttribute('aria-label', 'Notifications');
    await expect(notifications).not.toHaveAttribute('aria-live');
    await expect(notifications).not.toHaveAttribute('aria-atomic');
    await expect(notifications.getByText('Invoice sent', { exact: true })).toBeVisible();
    await expectNoSeriousA11yIssues(page, '[role="region"][aria-label="Notifications"]');
  });

  test('toast reference updates content, variant, and duration in place', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Upload report' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    const toasts = notifications.locator('[data-slot="toast"]');
    await expect(toasts).toHaveCount(1);
    await expect(notifications.getByText('Uploading report.pdf', { exact: true })).toBeVisible();

    await expect(notifications.getByText('Upload complete', { exact: true })).toBeVisible();
    await expect(toasts).toHaveCount(1);
    await expect(toasts).toHaveAttribute('data-variant', 'success');
    await expect(notifications.getByText('report.pdf is ready to share.', { exact: true })).toBeVisible();

    await notifications.getByRole('button', { name: 'Dismiss' }).click();
    await expect(toasts).toHaveCount(0);
  });

  test('toast template references and actions retain scoped dismissal behavior', async ({ page }) => {
    await page.goto('/components/toast');

    await page.getByRole('button', { name: 'New comment' }).click();
    const notifications = page.getByRole('region', { name: 'Notifications' });
    const toasts = notifications.locator('[data-slot="toast"]');
    await expect(toasts).toHaveCount(1);
    await notifications.getByRole('button', { name: 'View' }).click();
    await expect(toasts).toHaveCount(0);

    await page.getByRole('button', { name: 'Move to trash' }).click();
    await notifications.getByRole('button', { name: 'Undo' }).click();
    await expect(notifications.getByText('Restored', { exact: true })).toBeVisible();
    await expect(notifications.getByText('Moved to trash', { exact: true })).toHaveCount(0);
  });

  test('toast stack scrolls long bursts and exposes dismiss all', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Run deploy' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    const viewport = notifications.locator('[data-slot="viewport"]');
    const toasts = notifications.locator('[data-slot="toast"]');
    const frontToast = toasts.last();

    await expect(toasts).toHaveCount(6);
    await expect(frontToast).toBeVisible();
    await expect
      .poll(() =>
        viewport.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingInlineEnd),
        ),
      )
      .toBeGreaterThanOrEqual(9);
    await expect
      .poll(() =>
        viewport.evaluate((element) => {
          const style = getComputedStyle(element);
          const nativeScrollbarWidth = Number.parseFloat(
            style.getPropertyValue('--hell-toast-scrollbar-w'),
          );
          const reservedContentWidth =
            element.clientWidth -
            Number.parseFloat(style.paddingInlineEnd) -
            (Number.isFinite(nativeScrollbarWidth) ? nativeScrollbarWidth : 0);
          const toast = element.querySelector<HTMLElement>('[data-slot="toast"]:last-child');
          return toast ? Math.abs(toast.offsetWidth - reservedContentWidth) : Infinity;
        }),
      )
      .toBeLessThanOrEqual(1);
    const collapsedFrontWidth = await frontToast.evaluate((element) => element.offsetWidth);

    await notifications.hover();
    await expect(notifications.locator('[data-slot="dismissAll"]')).toBeVisible();
    await expect(notifications.locator('[data-slot="dismissAll"] svg path')).toHaveCount(1);
    await expect(viewport).toHaveAttribute('aria-label', 'Notification stack');
    await expect
      .poll(() =>
        frontToast.evaluate(
          (element, width) => Math.abs(element.offsetWidth - width),
          collapsedFrontWidth,
        ),
      )
      .toBeLessThanOrEqual(1);

    await expect
      .poll(() =>
        viewport.evaluate((element) => {
          const rects = [...element.querySelectorAll<HTMLElement>('[data-slot="toast"]')]
            .filter((toast) => toast.getAttribute('data-state') === 'open')
            .map((toast) => {
              const rect = toast.getBoundingClientRect();
              return {
                top: rect.top,
                bottom: rect.bottom,
              };
            })
            .sort((a, b) => a.top - b.top);
          const gaps = rects.slice(1).map((rect, index) => rect.top - rects[index].bottom);
          const minGap = gaps.length ? Math.min(...gaps) : 0;

          return (
            rects.length >= 6 &&
            element.scrollHeight > element.clientHeight &&
            element.scrollTop > 0 &&
            minGap >= 8
          );
        }),
        { timeout: 10_000 },
      )
      .toBe(true);

    await viewport.evaluate((element) => {
      element.scrollTop = 0;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });

    await expect
      .poll(() =>
        toasts.last().evaluate((element) => {
          const progress = getComputedStyle(element)
            .getPropertyValue('--hell-toast-edge-progress')
            .trim();
          return Number(progress) > 0;
        }),
      )
      .toBe(true);

    await viewport.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      element.dispatchEvent(new Event('scroll', { bubbles: true }));
    });
    await page.waitForTimeout(240);
    const expandedFrontTop = await frontToast.evaluate((element) =>
      element.getBoundingClientRect().top,
    );

    await page.mouse.move(10, 10);
    const collapseTops = await frontToast.evaluate(
      (element) =>
        new Promise<number[]>((resolve) => {
          const tops: number[] = [];
          const start = performance.now();
          const sample = () => {
            tops.push(element.getBoundingClientRect().top);
            if (performance.now() - start >= 520) {
              resolve(tops);
              return;
            }
            requestAnimationFrame(sample);
          };
          sample();
        }),
    );

    expect(Math.min(...collapseTops)).toBeGreaterThanOrEqual(expandedFrontTop - 1);
    await expect(notifications).not.toHaveAttribute('data-expanded', 'true');
    await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBe(0);
    await notifications.hover();

    await notifications.locator('[data-slot="dismissAll"]').click();
    await expect(toasts).toHaveCount(0);
  });

  test('menu submenu opens, returns focus, and can be dismissed', async ({ page }) => {
    await page.goto('/components/menu');

    const trigger = page.getByRole('button', { name: 'File' }).first();
    await trigger.click();

    const openRecent = page.getByRole('menuitem', { name: 'Open recent' }).first();
    await expect(openRecent).toBeVisible();
    await openRecent.hover();
    const nested = page.getByRole('menuitem', { name: 'Project Atlas' }).first();
    if (!(await nested.isVisible())) {
      await openRecent.click();
    }
    await expect(nested).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('audio player controls keep reachable rows without narrow overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/audio-player');

    const player = page.locator('hell-audio-player').first();
    await expect(player).toBeVisible();
    await player.scrollIntoViewIfNeeded();

    const mobile = await audioLayoutMetrics(player);
    expect(mobile.overflowing).toEqual([]);
    expect(mobile.transport.y).toBeLessThan(mobile.actions.y);
    expect(mobile.transport.width).toBeLessThanOrEqual(mobile.controls.width + 1);
    expect(mobile.actions.width).toBeLessThanOrEqual(mobile.controls.width + 1);
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/audio-player');
    const desktopPlayer = page.locator('hell-audio-player').first();
    await expect(desktopPlayer).toBeVisible();
    const desktop = await audioLayoutMetrics(desktopPlayer);
    expect(desktop.overflowing).toEqual([]);
    expect(Math.abs(desktop.transport.y - desktop.actions.y)).toBeLessThanOrEqual(2);
    expect(desktop.actions.x).toBeGreaterThan(desktop.transport.x);
    await expectNoHorizontalOverflow(page);
  });

  test('shared docs code tabs use the read-only Hell code viewer with copy and focus semantics', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let copiedText = '';
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: async () => copiedText,
          writeText: async (value: string) => {
            copiedText = value;
          },
        },
      });
    });

    await page.goto('/components/table');

    const firstExample = page.locator('hd-example-tabs').first();
    await firstExample.getByRole('tab', { name: 'Code' }).click();

    await expect(firstExample.locator('pre.hd-example-code')).toHaveCount(0);
    const viewer = firstExample.locator('hell-code-editor.hd-code-viewer[data-slot="root"]');
    await expect(viewer).toBeVisible();

    const source = firstExample.getByRole('textbox', { name: 'Example source code' });
    await expect(source).toBeVisible();
    await expect(source).toHaveAttribute('aria-readonly', 'true');

    const copy = firstExample.locator('.hd-example-code-toolbar button').first();
    await expect(copy).toHaveAttribute('aria-label', 'Copy code');
    await copy.click();
    await expect(copy).toHaveAttribute('aria-label', 'Copied');
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain('hellTableRoot');

    await copy.focus();
    await page.keyboard.press('Tab');
    await expect(source).toBeFocused();
  });

  test('pdf viewer keyboard controls and overview thumbnail smoke path remain stable', async ({
    page,
  }) => {
    await page.goto('/components/pdf-viewer');

    // The docs page now hosts several PDF-viewer examples; scope the smoke path
    // to the basic example so the viewer locator stays unambiguous. The Preview
    // tab lives on the enclosing hd-example-tabs, not inside the example.
    const example = page.locator('app-pdf-viewer-basic-example');
    const exampleTabs = page.locator('hd-example-tabs', { has: example });
    await exampleTabs.getByRole('tab', { name: 'Preview' }).click();

    const viewer = example.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.focus();

    const findInput = example.getByRole('searchbox', { name: /find/i });
    const findShortcutButton = example.getByRole('button', { name: /Find in document/i });

    await viewer.dispatchEvent('keydown', {
      key: 'f',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    if (!(await findInput.isVisible())) {
      await findShortcutButton.click();
    }
    await expect(findInput).toBeVisible();
    await findInput.focus();

    await page.keyboard.press('Escape');
    await expect(findInput).not.toBeVisible();

    const overviewButton = example.getByRole('button', { name: /Page overview/i }).first();
    await overviewButton.click();
    await expect(overviewButton).toHaveAttribute('aria-pressed', 'true');

    const overviewPane = example.locator('aside[data-slot="sidebar"]');
    await expect(overviewPane).toBeVisible();

    const thumbnails = example.locator('button[aria-label^="Go to page"]');
    if ((await thumbnails.count()) > 0) {
      await expect(thumbnails.first()).toBeVisible();
      await thumbnails.first().click();
      await expect(example.getByRole('spinbutton', { name: /page/i })).toHaveValue(/\d+/);
    }
  });

  test('pdf viewer mobile pinch zoom scales the document', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Mobile pinch regression uses Chromium DevTools Protocol touch input.',
    );

    await page.goto('/components/pdf-viewer');

    // Scope to the basic example so the viewer locator resolves to one node.
    // The Preview tab lives on the enclosing hd-example-tabs, not the example.
    const example = page.locator('app-pdf-viewer-basic-example');
    const exampleTabs = page.locator('hd-example-tabs', { has: example });
    await exampleTabs.getByRole('tab', { name: 'Preview' }).click();

    const viewer = example.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.scrollIntoViewIfNeeded();

    const scrollContainer = viewer.locator('[data-slot="pageArea"]');
    const firstPdfPage = viewer.locator('.pdfViewer .page').first();
    await expect(firstPdfPage).toBeVisible();
    const beforePinchBox = await firstPdfPage.boundingBox();
    const scrollBox = await scrollContainer.boundingBox();
    if (!beforePinchBox || !scrollBox) {
      throw new Error('Expected PDF viewer page and scroll container boxes for pinch test.');
    }

    const pinchCenterX = Math.round(scrollBox.x + scrollBox.width / 2);
    const pinchY = Math.round(
      scrollBox.y + Math.min(scrollBox.height * 0.45, scrollBox.height - 20),
    );
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 41, x: pinchCenterX - 45, y: pinchY },
        { id: 42, x: pinchCenterX + 45, y: pinchY },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 41, x: pinchCenterX - 95, y: pinchY },
        { id: 42, x: pinchCenterX + 95, y: pinchY },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect
      .poll(async () => (await firstPdfPage.boundingBox())?.width ?? 0)
      .toBeGreaterThan(beforePinchBox.width * 1.2);
  });
});
