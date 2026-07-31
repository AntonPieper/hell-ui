import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ensurePageIsActive, expectFocused, finishAnimations } from './utils';

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

    // A single mouse press-and-release on a key enters exactly one digit, and
    // native keyboard activation of a focused key still goes through click.
    await display.focus();
    await page.keyboard.press('Delete');
    await five.click();
    await expect(display).toHaveValue('5');
    await five.focus();
    await page.keyboard.press('Space');
    await expect(display).toHaveValue('55');
    await page.keyboard.press('Enter');
    await expect(display).toHaveValue('555');

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

  test('dialpad inserts, deletes, and replaces at the caret', async ({ page }) => {
    await page.goto('/components/dialpad');

    const example = page.locator('app-dialpad-basic-example');
    const dialpad = example.getByRole('group', { name: 'Dial pad' });
    const display = dialpad.getByRole('textbox', { name: 'Number' });
    const caret = async (): Promise<(number | null)[]> =>
      display.evaluate((node) => {
        const input = node as HTMLInputElement;
        return [input.selectionStart, input.selectionEnd];
      });

    await dialpad.getByRole('button', { name: 'Digit 1' }).click();
    await dialpad.getByRole('button', { name: 'Digit 3, DEF' }).click();
    await expect(display).toHaveValue('13');

    // Clicking past the digits puts the caret at the end; arrow-keying moves
    // it, and the next key lands there instead of at the end.
    await display.click();
    expect(await caret()).toEqual([2, 2]);
    await page.keyboard.press('ArrowLeft');
    expect(await caret()).toEqual([1, 1]);

    await dialpad.getByRole('button', { name: 'Digit 2, ABC' }).click();
    await expect(display).toHaveValue('123');
    expect(await caret()).toEqual([2, 2]);

    // Backspace deletes at the caret, even while the tapped key holds focus.
    await page.keyboard.press('Backspace');
    await expect(display).toHaveValue('13');
    expect(await caret()).toEqual([1, 1]);

    // A selected range is replaced by the next press.
    await display.click();
    await page.keyboard.press('ControlOrMeta+a');
    await dialpad.getByRole('button', { name: 'Digit 9, WXYZ' }).click();
    await expect(display).toHaveValue('9');
    expect(await caret()).toEqual([1, 1]);

    // Typing straight into the display inserts at the caret too.
    await display.click();
    await page.keyboard.press('ArrowLeft');
    expect(await caret()).toEqual([0, 0]);
    await page.keyboard.press('4');
    await page.keyboard.press('5');
    await expect(display).toHaveValue('459');
    expect(await caret()).toEqual([2, 2]);

    // Tabbing in selects the whole number the way any text field does, but a
    // keypad key adds a digit rather than replacing all of it. The number
    // input is the tab stop before the clear control.
    await dialpad.getByRole('button', { name: 'Clear' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(display).toBeFocused();
    expect(await caret()).toEqual([0, 3]);

    // The tabbed-in range is ignored, so the key lands on the caret the
    // display already had rather than replacing all of "459".
    await dialpad.getByRole('button', { name: 'Digit 8, TUV' }).click();
    await expect(display).toHaveValue('4589');
    expect(await caret()).toEqual([3, 3]);
  });

  test('dialpad keeps overlapping taps and still cancels a slide-off', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Overlapping multi-touch dialing uses Chromium DevTools Protocol touch input.',
    );

    await page.goto('/components/dialpad');

    const example = page.locator('app-dialpad-basic-example');
    const dialpad = example.getByRole('group', { name: 'Dial pad' });
    const display = dialpad.getByRole('textbox', { name: 'Number' });
    await dialpad.scrollIntoViewIfNeeded();

    const keyCenter = async (name: string) => {
      const box = await dialpad.getByRole('button', { name }).boundingBox();
      if (!box) throw new Error(`Expected a bounding box for the "${name}" key.`);
      return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
    };
    const one = await keyCenter('Digit 1');
    const two = await keyCenter('Digit 2, ABC');

    // A second finger landing before the first lifts makes the browser suppress
    // the compatibility click for both pointers, so a click-only keypad loses
    // the whole sequence.
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 51, ...one }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 51, ...one },
        { id: 52, ...two },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [{ id: 51, ...one }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect(display).toHaveValue('12');

    await display.focus();
    await page.keyboard.press('Delete');
    await expect(display).toHaveValue('');

    // A non-scrollable dialer never gets the scroll-driven `pointercancel`
    // that hides a missing release check: implicit pointer capture retargets
    // the release to the pressed key however far the finger travelled.
    await dialpad.evaluate((node: HTMLElement) => {
      node.style.touchAction = 'none';
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 53, ...one }],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ id: 53, ...two }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(display).toHaveValue('');

    // The same layout still commits a clean tap, so the slide-off above was
    // cancelled rather than the whole sequence being dropped.
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 54, ...two }],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(display).toHaveValue('2');
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

  test('toast placements anchor, stack, and exit toward every documented position', async ({
    page,
  }) => {
    await page.goto('/components/toast');
    await ensurePageIsActive(page);

    const example = page.locator('app-toast-placement-example');
    await example.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    const toaster = example.locator('hell-toaster');
    // Exiting toasts linger for the exit animation with frozen data-front
    // values, so stack assertions target open toasts only.
    const openToasts = toaster.locator('[data-slot="toast"][data-state="open"]');
    const viewportSize = page.viewportSize();
    if (!viewportSize) throw new Error('Expected a page viewport');

    const placements = [
      { name: 'top-left', vertical: 'top', horizontal: 'left' },
      { name: 'top-center', vertical: 'top', horizontal: 'center' },
      { name: 'top-right', vertical: 'top', horizontal: 'right' },
      { name: 'bottom-left', vertical: 'bottom', horizontal: 'left' },
      { name: 'bottom-center', vertical: 'bottom', horizontal: 'center' },
      { name: 'bottom-right', vertical: 'bottom', horizontal: 'right' },
    ] as const;

    for (const placement of placements) {
      await test.step(`${placement.name} placement`, async () => {
        const trigger = example.getByRole('button', { name: placement.name, exact: true });
        await trigger.click();
        await trigger.click();
        await expect(openToasts).toHaveCount(2);
        await expect(toaster).toHaveAttribute('data-position', placement.name);
        await finishAnimations(toaster);

        const rootBox = await toaster.boundingBox();
        if (!rootBox) throw new Error('Expected the toaster to have a box');
        if (placement.vertical === 'top') {
          expect(Math.abs(rootBox.y - 24)).toBeLessThanOrEqual(2);
        } else {
          expect(Math.abs(rootBox.y + rootBox.height - (viewportSize.height - 24))).toBeLessThanOrEqual(2);
        }
        if (placement.horizontal === 'left') {
          expect(Math.abs(rootBox.x - 24)).toBeLessThanOrEqual(2);
        } else if (placement.horizontal === 'right') {
          expect(Math.abs(rootBox.x + rootBox.width - (viewportSize.width - 24))).toBeLessThanOrEqual(2);
        } else {
          expect(
            Math.abs(rootBox.x + rootBox.width / 2 - viewportSize.width / 2),
          ).toBeLessThanOrEqual(2);
        }

        // The collapsed stack peeks behind the front toast away from the
        // anchored edge: downward for top placements, upward for bottom ones.
        const front = toaster.locator('[data-slot="toast"][data-state="open"][data-front="0"]');
        const back = toaster.locator('[data-slot="toast"][data-state="open"][data-front="1"]');
        const frontBox = await front.boundingBox();
        const backBox = await back.boundingBox();
        if (!frontBox || !backBox) throw new Error('Expected stacked toast boxes');
        if (placement.vertical === 'top') {
          expect(backBox.y).toBeGreaterThan(frontBox.y + 4);
        } else {
          expect(backBox.y).toBeLessThan(frontBox.y - 4);
        }

        // Dismissal slides toward the nearest side edge; center placements
        // exit past their anchored top or bottom edge instead.
        const exitDelta = await front.evaluate(async (element) => {
          const close = element.querySelector<HTMLButtonElement>('[data-slot="close"]');
          if (!close) throw new Error('Expected a close button');
          const start = element.getBoundingClientRect();
          close.click();
          const settleAt = performance.now() + 140;
          let last = start;
          await new Promise<void>((resolve) => {
            const sample = () => {
              const rect = element.getBoundingClientRect();
              if (rect.width > 0) last = rect;
              if (performance.now() >= settleAt || rect.width === 0) {
                resolve();
                return;
              }
              requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
          return { x: last.x - start.x, y: last.y - start.y };
        });
        if (placement.horizontal === 'left') {
          expect(exitDelta.x).toBeLessThan(-8);
        } else if (placement.horizontal === 'right') {
          expect(exitDelta.x).toBeGreaterThan(8);
        } else {
          expect(Math.abs(exitDelta.x)).toBeLessThanOrEqual(8);
          if (placement.vertical === 'top') {
            expect(exitDelta.y).toBeLessThan(-8);
          } else {
            expect(exitDelta.y).toBeGreaterThan(8);
          }
        }
        await expect(openToasts).toHaveCount(1);
      });
    }
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
});
