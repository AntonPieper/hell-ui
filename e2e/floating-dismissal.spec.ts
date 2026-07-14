import { expect, test, type Page } from '@playwright/test';

declare global {
  interface Window {
    __hellFloatingEventOrder?: string[];
    __hellFloatingHarnessLog?: string[];
    __hellFloatingRecorderInstalled?: boolean;
  }
}

type HarnessLayer = 'primary' | 'parent' | 'child' | 'omnibar';

const HARNESS_PATH = '/components/popover?floatingDismissalHarness=1';

const PANEL_NAMES = {
  primary: 'Primary floating panel',
  parent: 'Parent floating panel',
  child: 'Child floating panel',
} as const;

test.describe('floating dismissal browser contracts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(HARNESS_PATH);
    await expect(page.getByTestId('floating-dismissal-harness')).toBeVisible();
    await installEventOrderRecorder(page);
  });

  test('guards pointerdown-inside focus races and closes once on the outside click', async ({
    page,
  }) => {
    const { panel, trigger } = await openPrimaryPopover(page);
    await page.getByTestId('inside-action').focus();
    const before = await closeCount(page, 'primary');

    await withEventOrder(page, 'pointerdown inside then focusout/click ordering', async () => {
      await page.evaluate(() => {
        const inside = requiredElement('[data-testid="inside-action"]');
        const outside = requiredElement('[data-testid="outside-focus-target"]');
        const pointerInit: PointerEventInit = {
          bubbles: true,
          button: 0,
          composed: true,
          pointerId: 1,
          pointerType: 'mouse',
        };

        inside.dispatchEvent(new PointerEvent('pointerdown', pointerInit));
        outside.focus();
        outside.dispatchEvent(new PointerEvent('pointerup', pointerInit));
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, composed: true }));

        function requiredElement(selector: string): HTMLElement {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          return element;
        }
      });

      await expect(panel).toBeHidden();
      await expect(page.getByTestId('outside-focus-target')).toBeFocused();
      await expect(trigger).not.toBeFocused();
      await expectCloseCount(page, 'primary', before + 1);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="inside-action"]',
        'focusout:capture:target=[data-testid="inside-action"]',
        'focusin:capture:target=[data-testid="outside-focus-target"]',
        'click:capture:target=[data-testid="outside-focus-target"]',
        'harness:primary:closed',
      ]);
    });
  });

  test('keeps delayed focus/click races to one close after an inside pointer guard expires', async ({
    page,
  }) => {
    const { panel, trigger } = await openPrimaryPopover(page);
    await page.getByTestId('inside-action').focus();
    const before = await closeCount(page, 'primary');

    await withEventOrder(page, 'delayed pointerdown-inside focus/click ordering', async () => {
      await page.evaluate(() => {
        const inside = document.querySelector<HTMLElement>('[data-testid="inside-action"]');
        if (!inside) throw new Error('Missing inside action');
        inside.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            button: 0,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
          }),
        );
      });
      await page.waitForTimeout(20);
      await page.getByTestId('outside-focus-target').focus();
      await expect(panel).toBeHidden();
      await expectCloseCount(page, 'primary', before + 1);

      await page.evaluate(() => {
        const outside = document.querySelector<HTMLElement>('[data-testid="outside-focus-target"]');
        if (!outside) throw new Error('Missing outside focus target');
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, composed: true }));
      });

      await expect(panel).toBeHidden();
      await expect(page.getByTestId('outside-focus-target')).toBeFocused();
      await expect(trigger).not.toBeFocused();
      await expectCloseCount(page, 'primary', before + 1);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="inside-action"]',
        'focusin:capture:target=[data-testid="outside-focus-target"]',
        'harness:primary:closed',
        'click:capture:target=[data-testid="outside-focus-target"]',
      ]);
    });
  });

  test('dismisses outside pointer clicks once without restoring focus to the trigger', async ({
    page,
  }) => {
    const { panel, trigger } = await openPrimaryPopover(page);
    await page.getByTestId('inside-action').focus();
    const before = await closeCount(page, 'primary');

    await withEventOrder(page, 'outside pointer dismissal', async () => {
      await page.getByTestId('outside-pointer-target').click();

      await expect(panel).toBeHidden();
      await expect(trigger).not.toBeFocused();
      await expectCloseCount(page, 'primary', before + 1);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="outside-pointer-target"]',
        'click:capture:target=[data-testid="outside-pointer-target"]',
        'harness:primary:closed',
      ]);
    });
  });

  test('dismisses outside focus once and leaves focus on the outside target', async ({ page }) => {
    const { panel, trigger } = await openPrimaryPopover(page);
    await page.getByTestId('inside-action').focus();
    const before = await closeCount(page, 'primary');

    await withEventOrder(page, 'outside focus dismissal', async () => {
      await page.getByTestId('outside-focus-target').focus();

      await expect(panel).toBeHidden();
      await expect(page.getByTestId('outside-focus-target')).toBeFocused();
      await expect(trigger).not.toBeFocused();
      await expectCloseCount(page, 'primary', before + 1);

      expectOrderedEvents(await eventOrder(page), [
        'focusout:capture:target=[data-testid="inside-action"]',
        'focusin:capture:target=[data-testid="outside-focus-target"]',
        'harness:primary:closed',
      ]);
    });
  });

  test('Escape closes once and skips unsafe focus restoration targets', async ({ page }) => {
    const { panel, trigger } = await openPrimaryPopover(page);
    await page.getByTestId('inside-action').focus();
    const beforeSafeEscape = await closeCount(page, 'primary');

    await withEventOrder(page, 'Escape safe focus restoration', async () => {
      await page.keyboard.press('Escape');

      await expect(panel).toBeHidden();
      await expect(trigger).toBeFocused();
      await expectCloseCount(page, 'primary', beforeSafeEscape + 1);

      expectOrderedEvents(await eventOrder(page), [
        'keydown:Escape:capture:target=[data-testid="inside-action"]',
        'harness:primary:closed',
      ]);
    });

    await trigger.click();
    await expect(panel).toBeVisible();
    const disableTrigger = page.getByTestId('disable-primary-trigger');
    await disableTrigger.click();
    await expect(trigger).toBeDisabled();
    await expect(panel).toBeVisible();
    await disableTrigger.focus();
    await expect(disableTrigger).toBeFocused();
    const beforeUnsafeEscape = await closeCount(page, 'primary');

    await withEventOrder(page, 'Escape unsafe focus restoration guard', async () => {
      await page.keyboard.press('Escape');

      await expect(panel).toBeHidden();
      await expect(trigger).not.toBeFocused();
      await expectCloseCount(page, 'primary', beforeUnsafeEscape + 1);

      expectOrderedEvents(await eventOrder(page), [
        'keydown:Escape:capture:target=[data-testid="disable-primary-trigger"]',
        'harness:primary:closed',
      ]);
    });
  });

  test('nested floating surfaces keep child interactions inside and close only the layer that exits', async ({
    page,
  }) => {
    await openNestedPopovers(page);
    const parentPanel = panel(page, 'parent');
    const childPanel = panel(page, 'child');
    const parentBefore = await closeCount(page, 'parent');
    const childBefore = await closeCount(page, 'child');

    await withEventOrder(page, 'nested child inside interaction', async () => {
      await page.getByTestId('child-inside-action').click();

      await expect(parentPanel).toBeVisible();
      await expect(childPanel).toBeVisible();
      await expectCloseCount(page, 'parent', parentBefore);
      await expectCloseCount(page, 'child', childBefore);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="child-inside-action"]',
        'click:capture:target=[data-testid="child-inside-action"]',
      ]);
    });

    await withEventOrder(page, 'nested child outside but parent inside interaction', async () => {
      await page.getByTestId('parent-inside-action').click();

      await expect(parentPanel).toBeVisible();
      await expect(childPanel).toBeHidden();
      await expectCloseCount(page, 'parent', parentBefore);
      await expectCloseCount(page, 'child', childBefore + 1);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="parent-inside-action"]',
        'harness:child:closed',
      ]);
    });

    await withEventOrder(page, 'nested outside interaction', async () => {
      await page.getByTestId('nested-outside-target').click();

      await expect(parentPanel).toBeHidden();
      await expectCloseCount(page, 'parent', parentBefore + 1);
      await expectCloseCount(page, 'child', childBefore + 1);

      expectOrderedEvents(await eventOrder(page), [
        'pointerdown:capture:target=[data-testid="nested-outside-target"]',
        'click:capture:target=[data-testid="nested-outside-target"]',
        'harness:parent:closed',
      ]);
    });
  });

  test('portaled floating scopes keep panel focus inside before outside focus dismisses', async ({
    page,
  }) => {
    const input = page.getByRole('combobox', { name: 'Scoped command search' });
    const action = page.getByTestId('omnibar-panel-action');
    await input.focus();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(action).toBeVisible();
    const beforePanelFocus = await closeCount(page, 'omnibar');

    await withEventOrder(page, 'portaled panel focus stays inside scope', async () => {
      await page.keyboard.press('F6');

      await expect(action).toBeFocused();
      await expect(input).toHaveAttribute('aria-expanded', 'true');
      await expectCloseCount(page, 'omnibar', beforePanelFocus);

      expectOrderedEvents(await eventOrder(page), [
        'keydown:F6:capture:target=input[aria-label="Scoped command search"]',
        'focusout:capture:target=input[aria-label="Scoped command search"]',
        'focusin:capture:target=[data-testid="omnibar-panel-action"]',
      ]);
    });

    const beforeOutsideFocus = await closeCount(page, 'omnibar');
    await withEventOrder(page, 'portaled scope outside focus dismissal', async () => {
      await page.getByTestId('outside-focus-target').focus();

      await expect(input).toHaveAttribute('aria-expanded', 'false');
      await expect(page.getByTestId('outside-focus-target')).toBeFocused();
      await expectCloseCount(page, 'omnibar', beforeOutsideFocus + 1);

      expectOrderedEvents(await eventOrder(page), [
        'focusout:capture:target=[data-testid="omnibar-panel-action"]',
        'focusin:capture:target=[data-testid="outside-focus-target"]',
        'harness:omnibar:closed',
      ]);
    });
  });
});

async function openPrimaryPopover(page: Page) {
  const trigger = page.getByTestId('primary-trigger');
  const primaryPanel = panel(page, 'primary');

  await trigger.click();
  await expect(primaryPanel).toBeVisible();

  return { trigger, panel: primaryPanel };
}

async function openNestedPopovers(page: Page): Promise<void> {
  await page.getByTestId('parent-trigger').click();
  await expect(panel(page, 'parent')).toBeVisible();

  await page.getByTestId('child-trigger').click();
  await expect(panel(page, 'child')).toBeVisible();
}

function panel(page: Page, layer: keyof typeof PANEL_NAMES) {
  return page.getByRole('dialog', { name: PANEL_NAMES[layer] });
}

async function closeCount(page: Page, layer: HarnessLayer): Promise<number> {
  const text = await page.getByTestId(`${layer}-close-count`).textContent();
  return Number(text?.trim() ?? Number.NaN);
}

async function expectCloseCount(page: Page, layer: HarnessLayer, expected: number): Promise<void> {
  await expect
    .poll(() => closeCount(page, layer), { message: `${layer} close count` })
    .toBe(expected);
}

async function installEventOrderRecorder(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__hellFloatingEventOrder = [];
    window.__hellFloatingHarnessLog = window.__hellFloatingEventOrder;

    if (window.__hellFloatingRecorderInstalled) return;
    window.__hellFloatingRecorderInstalled = true;

    const describeTarget = (target: EventTarget | null): string => {
      if (!(target instanceof Element)) return String(target);

      const testId = target.getAttribute('data-testid');
      if (testId) return `[data-testid="${testId}"]`;

      const tag = target.tagName.toLowerCase();
      const ariaLabel = target.getAttribute('aria-label');
      if (ariaLabel) return `${tag}[aria-label="${ariaLabel}"]`;

      const role = target.getAttribute('role');
      if (role) return `${tag}[role="${role}"]`;

      if (target.id) return `#${target.id}`;

      const text = (target.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return text ? `${tag}:"${text}"` : tag;
    };

    const record = (phase: 'capture' | 'bubble', event: Event): void => {
      const key = event instanceof KeyboardEvent ? `:${event.key}` : '';
      window.__hellFloatingEventOrder?.push(
        `${event.type}${key}:${phase}:target=${describeTarget(event.target)}:active=${describeTarget(
          document.activeElement,
        )}`,
      );
    };

    const eventTypes = ['pointerdown', 'pointerup', 'click', 'focusout', 'focusin', 'keydown'];
    for (const type of eventTypes) {
      document.addEventListener(type, (event) => record('capture', event), true);
      document.addEventListener(type, (event) => record('bubble', event));
    }
  });
}

async function resetEventOrder(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__hellFloatingEventOrder = [];
    window.__hellFloatingHarnessLog = window.__hellFloatingEventOrder;
  });
}

async function eventOrder(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => window.__hellFloatingEventOrder ?? []);
}

async function withEventOrder(
  page: Page,
  label: string,
  action: () => Promise<void>,
): Promise<void> {
  await resetEventOrder(page);
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} failed.\n${message}\n\nEvent order:\n${formatEventOrder(await eventOrder(page))}`, {
      cause: error,
    });
  }
}

function expectOrderedEvents(order: readonly string[], needles: readonly string[]): void {
  let cursor = -1;
  for (const needle of needles) {
    const next = order.findIndex((entry, index) => index > cursor && entry.includes(needle));
    expect(
      next,
      `Expected event matching ${needle} after index ${cursor}.\n\nEvent order:\n${formatEventOrder(order)}`,
    ).toBeGreaterThan(cursor);
    cursor = next;
  }
}

function formatEventOrder(order: readonly string[]): string {
  return order.map((entry, index) => `${index + 1}. ${entry}`).join('\n');
}

export {};
