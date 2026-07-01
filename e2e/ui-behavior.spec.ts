import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

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
      await expect
        .poll(() => dialog.evaluate((element) => getComputedStyle(element).opacity))
        .toBe('1');

      await expectFocused(page, initialFocus, `${contract.label} initial focus`);
      await page.keyboard.press('Tab');
      await expectFocused(page, nextFocus, `${contract.label} forward tab stays inside`);
      await page.keyboard.press('Tab');
      await expectFocused(page, initialFocus, `${contract.label} forward tab wraps inside`);
      await page.keyboard.press('Shift+Tab');
      await expectFocused(page, nextFocus, `${contract.label} reverse tab wraps inside`);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
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
    await expect(locator, label).toBeFocused();
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
  const [focusedPath, ariaSnapshot] = await Promise.all([
    focusedElementPath(page),
    page
      .locator('body')
      .ariaSnapshot()
      .catch((error: unknown) => `Unavailable: ${error instanceof Error ? error.message : error}`),
  ]);

  return `Focused element path:\n${focusedPath}\n\nAccessibility tree:\n${ariaSnapshot}`;
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
      description: 'Once published, the article will be visible to everyone.',
      initialFocusName: 'Cancel',
      nextFocusName: 'Publish',
    });

    await expectDialogFocusContract(page, {
      label: 'scoped dialog',
      triggerName: 'Open content-scoped dialog',
      dialogName: 'Only docs content is blocked',
      initialFocusName: 'Close',
      nextFocusName: 'Close',
    });
  });

  test('dialpad supports keyboard entry, focus order, and state attributes', async ({ page }) => {
    await page.goto('/components/dialpad');

    const example = page.locator('app-dialpad-example-example');
    const dialpad = example.getByRole('group', { name: 'Dial pad' });
    const display = dialpad.getByRole('textbox', { name: 'Number' });
    const currentNumber = example.locator('dd code').nth(1);
    const lastCall = example.locator('dd code').nth(2);

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
    await expect(currentNumber).toHaveText('2');

    const five = dialpad.getByRole('button', { name: 'Digit 5, JKL' });
    await five.focus();
    await expectFocused(page, five, 'dialpad child key focus');
    await page.keyboard.press('6');
    await expect(display).toHaveValue('26');

    await page.keyboard.press('Backspace');
    await expect(display).toHaveValue('2');
    await page.keyboard.press('Delete');
    await expect(display).toHaveValue('');
    await expect(currentNumber).toHaveText('—');

    const zero = dialpad.getByRole('button', { name: 'Digit 0, plus' });
    await zero.hover();
    await page.mouse.down();
    await page.waitForTimeout(560);
    await page.mouse.up();
    await expect(display).toHaveValue('+');
    await expect(currentNumber).toHaveText('+');

    await display.focus();
    await page.keyboard.press('Delete');
    await page.keyboard.press('3');
    await page.keyboard.press('Enter');
    await expect(lastCall).toHaveText('3');

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

    await example.getByRole('radio', { name: 'Invalid' }).click();
    await expect(dialpad).toHaveAttribute('aria-invalid', 'true');
    await example.getByRole('radio', { name: 'Readonly' }).click();
    await expect(dialpad).toHaveAttribute('data-readonly', '');
    await expect(dialpad.getByRole('button', { name: 'Digit 1' })).toBeDisabled();
    await expect(dialpad.getByRole('button', { name: 'Call' })).toBeEnabled();
    await example.getByRole('radio', { name: 'Disabled' }).click();
    await expect(dialpad).toHaveAttribute('aria-disabled', 'true');
    await expect(display).toBeDisabled();
    await expect(dialpad.getByRole('button', { name: 'Call' })).toBeDisabled();

    await expectNoSeriousA11yIssues(page, 'app-dialpad-example-example');
  });

  test('toast renders in the notification region and passes axe smoke', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Success' }).first().click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    await expect(notifications).toHaveAttribute('role', 'region');
    await expect(notifications).toHaveAttribute('aria-label', 'Notifications');
    await expect(notifications).not.toHaveAttribute('aria-live');
    await expect(notifications).not.toHaveAttribute('aria-atomic');
    await expect(notifications.getByText('Article published', { exact: true })).toBeVisible();
    await expectNoSeriousA11yIssues(page, '[role="region"][aria-label="Notifications"]');
  });

  test('toast stack scrolls long bursts and exposes dismiss all', async ({ page }) => {
    await page.goto('/components/toast');
    await page.getByRole('button', { name: 'Send 8 toasts' }).click();

    const notifications = page.getByRole('region', { name: 'Notifications' });
    const viewport = notifications.locator('[data-slot="viewport"]');
    const toasts = notifications.locator('[data-slot="toast"]');
    const frontToast = toasts.last();

    await expect(toasts).toHaveCount(8);
    await expect(frontToast).toBeVisible();
    const collapsedFrontWidth = await frontToast.evaluate(
      (element) => element.getBoundingClientRect().width,
    );

    await notifications.hover();
    await expect(notifications.locator('[data-slot="dismissAll"]')).toBeVisible();
    await expect(notifications.locator('[data-slot="dismissAll"] svg path')).toHaveCount(1);
    await expect(viewport).toHaveAttribute('aria-label', 'Notification stack');
    await expect
      .poll(() =>
        frontToast.evaluate(
          (element, width) => Math.abs(element.getBoundingClientRect().width - width),
          collapsedFrontWidth,
        ),
      )
      .toBeLessThanOrEqual(1);

    const renderedToastCount = () =>
      viewport.evaluate((element) => {
        const viewportRect = element.getBoundingClientRect();
        return [...element.querySelectorAll<HTMLElement>('[data-slot="toast"]')].filter((toast) => {
          if (toast.getAttribute('data-state') !== 'open') return false;
          const rect = toast.getBoundingClientRect();
          const opacity = Number(getComputedStyle(toast).opacity);
          return rect.bottom > viewportRect.top && rect.top < viewportRect.bottom && opacity > 0.45;
        }).length;
      });

    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(await renderedToastCount()).toBeGreaterThanOrEqual(3);

    await expect
      .poll(() =>
        viewport.evaluate(
          (element) => element.scrollHeight > element.clientHeight && element.scrollTop > 0,
        ),
      )
      .toBe(true);
    await expect.poll(renderedToastCount).toBeGreaterThanOrEqual(5);

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
          if (rects.length < 8 || gaps.length === 0) return -Infinity;
          return Math.min(...gaps);
        }),
      )
      .toBeGreaterThanOrEqual(8);

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

  test('resizable handles support keyboard resizing semantics', async ({ page }) => {
    await page.goto('/components/resizable');

    const handle = page.getByRole('separator', { name: 'Resize panels' }).first();
    await expect(handle).toHaveAttribute('aria-valuemin', '0');
    await expect(handle).toHaveAttribute('aria-valuemax', '100');

    await handle.focus();
    const before = await handle.getAttribute('aria-valuenow');
    await expect(handle).toHaveAttribute('aria-valuenow', /^\d+$/);
    if (before === null) throw new Error('Expected initial aria-valuenow.');

    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', /^\d+$/);
    await expect(handle).not.toHaveAttribute('aria-valuenow', before);
  });

  test('select opens, supports keyboard selection, and updates selected value', async ({
    page,
  }) => {
    await page.goto('/components/select');

    const select = page.getByRole('combobox', { name: 'Select priority' }).first();
    await expect(select).toHaveAttribute('aria-expanded', 'false');

    await select.focus();
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveAttribute('aria-expanded', 'true');

    const option = page.getByRole('option', { name: 'Lowest' });
    await expect(option).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(select).toContainText('Lowest');
    await expect(select).toHaveAttribute('aria-expanded', 'false');

    await select.click();
    await expect(page.getByRole('option', { name: 'Lowest' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('Escape');
  });

  test('combobox filters options and selects with keyboard focus', async ({ page }) => {
    await page.goto('/components/combobox');

    const input = page.getByRole('combobox', { name: 'Search fruit…' }).first();
    await input.click();
    await input.fill('Blue');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Blueberry' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Apple' })).not.toBeVisible();

    await page.keyboard.press('Enter');

    await expect(input).toHaveValue('Blueberry');
    await expect(input).toBeFocused();
  });

  test('checkbox page contrasts native and custom semantics', async ({ page }) => {
    await page.goto('/components/checkbox');

    const custom = page.getByRole('checkbox', { name: 'I agree to the terms' }).first();
    const native = page.getByRole('checkbox', { name: 'Accept terms' }).first();

    await expect(custom).toHaveAttribute('type', 'button');
    await expect(custom).toHaveAttribute('role', 'checkbox');
    await expect(native).toHaveAttribute('type', 'checkbox');
    const nativeTag = await native.evaluate((node) => node.tagName.toLowerCase());
    expect(nativeTag).toBe('input');

    await custom.click();
    await expect(custom).toHaveAttribute('aria-checked', 'true');
    await native.click();
    await expect(native).toBeChecked();
  });

  test('listbox supports keyboard traversal and selection', async ({ page }) => {
    await page.goto('/components/listbox');

    const listbox = page.getByRole('listbox', { name: 'Choose a reviewer' });
    await expect(listbox).toBeVisible();

    await listbox.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('option', { name: 'Katherine Johnson' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('menu supports arrow navigation and focus restoration', async ({ page }) => {
    await page.goto('/components/menu');

    const trigger = page.getByRole('button', { name: 'Actions' }).first();
    await trigger.click();

    const rename = page.getByRole('menuitem', { name: 'Rename' }).first();
    const duplicate = page.getByRole('menuitem', { name: 'Duplicate' }).first();
    await expect(rename).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(duplicate).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
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

  test('table primitives allow keyboard resize and keep native rows passive', async ({ page }) => {
    await page.goto('/components/table?tableA11yHarness=1');
    await expect(
      page.getByRole('heading', { name: 'Table accessibility harness', level: 1 }),
    ).toBeVisible();

    const section = page.getByTestId('table-resize-semantic-section');
    const separator = section.getByRole('separator', { name: 'Resize column' }).first();
    const before = await separator.getAttribute('aria-valuenow');
    if (before === null) throw new Error('Expected initial column resize value.');

    await separator.press('ArrowRight');
    await expect(separator).not.toHaveAttribute('aria-valuenow', before);

    const table = page.getByTestId('native-table');
    const adaRow = table.getByRole('row', { name: /Ada Lovelace/ }).first();
    const graceRow = table.getByRole('row', { name: /Grace Hopper/ }).first();

    await expect(adaRow).toHaveAttribute('data-active', 'true');
    await expect(adaRow).not.toHaveAttribute('tabindex');
    await expect(adaRow).not.toHaveAttribute('aria-selected');
    await expect(graceRow).toHaveAttribute('data-selected', 'true');
    await expect(graceRow).not.toHaveAttribute('tabindex');
    await expect(graceRow).not.toHaveAttribute('aria-selected');

    await graceRow.click();
    await expect(graceRow).not.toHaveAttribute('data-active', 'true');

    const graceAction = graceRow.getByRole('button', { name: 'View Grace Hopper' }).first();
    await graceAction.click();

    await expect(graceRow).toHaveAttribute('data-active', 'true');
  });

  test('app shell secondary drawer opens, closes, and does not fight mobile sidenav', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/app-shell');

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const secondary = shell.locator('> [hellAppSecondary][data-slot="root"]');
    const rail = secondary.locator('[data-hell-secondary-toggle="rail"]');
    const header = secondary.locator('[data-hell-secondary-toggle="header"]');

    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expect(secondary).toHaveAttribute('data-mobile-hidden', 'true');
    await expect(secondary).not.toHaveAttribute('inert', '');
    await expect(secondary).not.toHaveAttribute('aria-hidden', 'true');
    await expect(rail).toBeVisible();
    await expect(rail).toHaveAttribute('aria-label', 'Show secondary panel');
    await expectNoHorizontalOverflow(page);

    await rail.focus();
    await expectFocused(page, rail, 'mobile secondary rail before open');
    await rail.press('Enter');

    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await expect.poll(async () => shell.getAttribute('data-mobile-sidenav-open')).not.toBe('true');
    await expect(secondary).not.toHaveAttribute('data-hidden', 'true');
    await expect(header).toHaveAttribute('aria-label', 'Hide secondary panel');
    await expectFocused(page, header, 'mobile secondary initial focus');
    await expectNoHorizontalOverflow(page);

    await page.keyboard.press('Escape');
    await expect(shell).not.toHaveAttribute('data-mobile-secondary-open', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expectFocused(page, rail, 'mobile secondary rail after close');

    await page.getByRole('button', { name: 'Expand sidebar' }).first().click();
    await expect(shell).toHaveAttribute('data-mobile-sidenav-open', 'true');
    await rail.focus();
    await rail.press('Enter');
    await expect(shell).not.toHaveAttribute('data-mobile-sidenav-open', 'true');
    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await expectNoHorizontalOverflow(page);
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

  test('docs visual regression smoke covers shell, table surfaces, and vertical sliders', async ({
    page,
  }) => {
    await page.goto('/');

    const brandTag = page.locator('.hd-brand-tag');
    await expect(brandTag).toHaveCSS('white-space', 'nowrap');

    const themeSelect = page.getByRole('combobox', { name: 'Theme' });
    await themeSelect.click();
    const themeDropdown = page.locator('.hd-palette-dropdown');
    await expect(themeDropdown).toBeVisible();
    await expect(themeDropdown).toHaveCSS('z-index', '1000');

    await page.goto('/components/table');
    const firstExample = page.locator('hd-example-tabs').first();
    await firstExample.getByRole('tab', { name: 'Code' }).click();
    await expect(firstExample.locator('pre.hd-example-code')).toHaveCount(0);
    await expect(
      firstExample.locator('hell-code-editor.hd-code-viewer[data-slot="root"]'),
    ).toBeVisible();

    await firstExample.getByRole('tab', { name: 'Preview' }).click();
    const primitiveTable = page
      .locator('app-table-primitive-example [hellTableContainer][data-slot="root"]')
      .first();
    await expect(primitiveTable).toBeVisible();
    await expect(primitiveTable).toHaveCSS('display', 'flex');
    await expect(primitiveTable).toHaveCSS('border-top-width', '1px');
    await expect(
      page.locator('app-table-primitive-example table[data-hell-table-root][data-slot="root"]').first(),
    ).toBeVisible();

    const tanstackShell = page.locator('app-table-tanstack-shell-example hell-tanstack-table').first();
    await expect(tanstackShell).toBeVisible();
    await expect(tanstackShell).toHaveCSS('display', 'block');
    await expect(tanstackShell.locator('hell-tanstack-pagination')).toBeVisible();

    await page.goto('/components/slider');
    const verticalSlider = page.locator('hell-slider[data-orientation="vertical"]').first();
    const verticalTrack = verticalSlider.locator('[data-slot="track"]');
    const verticalThumb = verticalSlider.locator('[data-slot="thumb"]');
    await expect(verticalThumb).toBeVisible();
    const trackBox = await verticalTrack.boundingBox();
    const thumbBox = await verticalThumb.boundingBox();
    if (!trackBox || !thumbBox) throw new Error('Expected vertical slider track and thumb boxes.');
    const trackCenterX = trackBox.x + trackBox.width / 2;
    const thumbCenterX = thumbBox.x + thumbBox.width / 2;
    expect(Math.abs(thumbCenterX - trackCenterX)).toBeLessThanOrEqual(1);

    await page.goto('/accessibility');
    await expect(page.locator('.hd-a11y-table-wrap[hellTableContainer][data-slot="root"]')).toBeVisible();
    await expect(page.locator('table.hd-a11y-table[data-hell-table-root][data-slot="root"]')).toBeVisible();
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

  test('drop zone keeps nested drag state stable and accepts files', async ({ page }) => {
    await page.goto('/components/drop-zone');

    const dropzone = page.getByRole('button', { name: /Drop files here/ });
    await expect(dropzone).toHaveAttribute('role', 'button');

    const chooserPromise = page.waitForEvent('filechooser');
    await dropzone.click();
    const chooser = await chooserPromise;
    await chooser.setFiles({
      name: 'browser-smoke.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hell ui'),
    });

    await expect(page.getByText('browser-smoke.txt')).toBeVisible();
  });

  test('pdf viewer keyboard controls and overview thumbnail smoke path remain stable', async ({
    page,
  }) => {
    await page.goto('/components/pdf-viewer');

    const previewTabs = page.getByRole('tab', { name: 'Preview' });
    await previewTabs.nth(1).click();

    const viewer = page.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.focus();

    const findInput = page.getByRole('searchbox', { name: /find/i });
    const findShortcutButton = page.getByRole('button', { name: /Find in document/i });

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

    const overviewButton = page.getByRole('button', { name: /Page overview/i }).first();
    await overviewButton.click();
    await expect(overviewButton).toHaveAttribute('aria-pressed', 'true');

    const overviewPane = page.locator('aside.hell-pdf-overview');
    await expect(overviewPane).toBeVisible();

    const thumbnails = page.locator('button[aria-label^="Go to page"]');
    if ((await thumbnails.count()) > 0) {
      await expect(thumbnails.first()).toBeVisible();
      await thumbnails.first().click();
      await expect(page.getByRole('spinbutton', { name: /page/i })).toHaveValue(/\d+/);
    }
  });

  test('pdf viewer mobile pinch zoom scales the document', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Mobile pinch regression uses Chromium DevTools Protocol touch input.',
    );

    await page.goto('/components/pdf-viewer');

    const previewTabs = page.getByRole('tab', { name: 'Preview' });
    await previewTabs.nth(1).click();

    const viewer = page.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.scrollIntoViewIfNeeded();

    const scrollContainer = viewer.locator('.hell-pdf-scroll');
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
