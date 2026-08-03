import { expect, test, type Page } from '@playwright/test';
import {
  SETTLE_TIMEOUT,
  collectFocusDiagnostics,
  ensurePageIsActive,
  expectFocused,
  finishAnimations,
} from './utils';

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

/**
 * Focus a shell control and report where focus settles. `contained` asserts the
 * delegated focus trap pulled it back into a dialog, which is what a
 * page-blocking dialog must still do even when a scoped one is open underneath.
 */
async function expectShellFocusIsContained(
  page: Page,
  contained: boolean,
  label: string,
): Promise<void> {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const shellControl = document.querySelector<HTMLElement>(
            'app-dialog-app-shell-scoped-example [hellAppSidenav] button',
          );
          shellControl?.focus();
          await new Promise((resolve) => setTimeout(resolve, 250));
          return document.activeElement?.closest('[role="dialog"]') !== null;
        }),
      { message: `${label}: shell focus containment`, timeout: SETTLE_TIMEOUT },
    )
    .toBe(contained);
}

test.describe('Dialog modality contracts', () => {
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

  test('scoped dialog modality blocks the content region and spares the app shell', async ({
    page,
  }) => {
    await page.goto('/components/dialog');
    await ensurePageIsActive(page);

    const example = page.locator('app-dialog-app-shell-scoped-example');
    const content = example.locator('[hellAppContent][data-slot="root"]');
    const trigger = example.getByRole('button', { name: 'Approve invoice' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Approve invoice 4021?' });
    await expect(dialog).toBeVisible();
    await finishAnimations(dialog);

    // Only the Dialog Scope root is blocked, and nothing outside it is hidden
    // from assistive technology while it still holds focusable controls.
    await expect(content).toHaveAttribute('inert', '');
    // `aria-modal="true"` would tell assistive technology the shell is
    // unavailable, which is exactly the claim scoped modality retracts.
    await expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(
      await page.evaluate(() =>
        [...document.body.children].some((child) => child.getAttribute('aria-hidden') === 'true'),
      ),
    ).toBe(false);
    expect(
      await content.evaluate((element) => {
        const button = element.querySelector('button');
        button?.focus();
        return document.activeElement === button;
      }),
    ).toBe(false);

    // The shell keeps working: a sidenav press activates and keeps focus
    // outside the dialog rather than being pulled back into it.
    const projects = example.locator('[hellAppSidenav] button', { hasText: 'Projects' });
    await projects.click();
    await expect(content.locator('strong')).toHaveText('Projects');
    await expect
      .poll(
        () =>
          page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null),
        { message: 'shell activation must not pull focus back into the scoped dialog' },
      )
      .toBe(false);
    await expect(dialog).toBeVisible();

    // A shell overlay opens over the dialog region and dismisses on its own,
    // one layer at a time.
    const account = example.getByRole('button', { name: 'Account' });
    await account.scrollIntoViewIfNeeded();
    await account.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    expect(
      await page.evaluate(() => {
        const overlay = document.querySelector('[hellDialogOverlay][data-scoped="true"]');
        const panel = document.querySelector('[hellMenu][data-slot="root"]');
        if (!overlay || !panel) return null;
        const overlayRect = overlay.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const overlaps =
          panelRect.left < overlayRect.right &&
          panelRect.right > overlayRect.left &&
          panelRect.top < overlayRect.bottom &&
          panelRect.bottom > overlayRect.top;
        if (!overlaps) return 'no-overlap';
        const shared = document.elementFromPoint(
          panelRect.left + 8,
          Math.min(panelRect.bottom, overlayRect.bottom) - 8,
        );
        return shared?.closest('[hellMenu]') ? 'menu-on-top' : 'overlay-on-top';
      }),
    ).toBe('menu-on-top');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(dialog).toBeVisible();

    // A surface opened from inside the dialog nests the other way: it layers
    // above the panel and Escape closes it before the dialog.
    await dialog.getByRole('combobox', { name: 'Cost centre' }).click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    expect(
      await page.evaluate(() => {
        const panel = document.querySelector('[hellDialog][data-slot="root"]');
        const dropdown = document.querySelector('[hellSelectDropdown][data-slot="root"]');
        if (!panel || !dropdown) return null;
        const dropdownRect = dropdown.getBoundingClientRect();
        const shared = document.elementFromPoint(
          dropdownRect.left + 8,
          dropdownRect.top + 8,
        );
        return shared?.closest('[hellSelectDropdown]') ? 'dropdown-on-top' : 'panel-on-top';
      }),
    ).toBe('dropdown-on-top');
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(dialog).toBeVisible();
    await expect(content).toHaveAttribute('inert', '');

    // A page-blocking dialog stacked on the scoped one does mean to block the
    // shell, so the document-wide focus-trap release comes off and the
    // delegated trap contains focus again for as long as it is open.
    await dialog.getByRole('button', { name: 'Approve' }).click();
    const confirm = page.getByRole('dialog', { name: 'Release this payment?' });
    await expect(confirm).toBeVisible();
    await expect(confirm).toHaveAttribute('aria-modal', 'true');
    await expectShellFocusIsContained(page, true, 'stacked page-modal dialog');

    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(dialog).toBeVisible();
    await expectShellFocusIsContained(page, false, 'scoped dialog after the stacked one closed');

    // Closing releases the blocked region before focus returns to a trigger
    // that lived inside it.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(content).not.toHaveAttribute('inert', '');
    await expectFocused(page, trigger, 'scoped dialog trigger restore inside the released scope');
  });

  test('a scoped dialog left open by a closing page-modal one frees the shell', async ({ page }) => {
    await page.goto('/components/dialog');
    await ensurePageIsActive(page);

    const example = page.locator('app-dialog-app-shell-scoped-example');
    const content = example.locator('[hellAppContent][data-slot="root"]');
    const anyPageHidden = () =>
      page.evaluate(() =>
        [...document.body.children].some((child) => child.getAttribute('aria-hidden') === 'true'),
      );

    // The reverse of the stacked case: the page-modal dialog opens first, so it
    // is the one whose open ran the manager's page-wide assistive-technology
    // pass, and the manager restores that pass only when its last dialog goes.
    await page.locator('app-dialog-basic-example').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Publish article' }).click();
    const pageModal = page.getByRole('dialog', { name: 'Publish this article?' });
    await expect(pageModal).toBeVisible();
    expect(await anyPageHidden()).toBe(true);

    // Opening the scoped dialog underneath is a programmatic activation: the
    // page-modal dialog is blocking the page, which is the point.
    await example.evaluate((host) => {
      const trigger = [...host.querySelectorAll<HTMLElement>('button')].find(
        (button) => button.textContent?.trim() === 'Approve invoice',
      );
      trigger?.click();
    });
    const scoped = page.getByRole('dialog', { name: 'Approve invoice 4021?' });
    await expect(scoped).toBeVisible();
    await expect(content).toHaveAttribute('inert', '');
    // While the page-modal dialog is open it still blocks everything.
    expect(await anyPageHidden()).toBe(true);
    await expectShellFocusIsContained(page, true, 'page-modal dialog open over a scoped one');

    await pageModal.getByRole('button', { name: 'Cancel' }).click();
    await expect(pageModal).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(scoped).toBeVisible();

    // Only the scoped dialog is left, so the shell has to be reachable again —
    // by assistive technology as well as by focus.
    await expect.poll(anyPageHidden, {
      message: 'a remaining scoped dialog must not leave the page aria-hidden',
      timeout: SETTLE_TIMEOUT,
    }).toBe(false);
    await expect(content).toHaveAttribute('inert', '');
    await expectShellFocusIsContained(page, false, 'scoped dialog left alone by the page-modal one');

    await page.keyboard.press('Escape');
    await expect(scoped).toBeHidden({ timeout: SETTLE_TIMEOUT });
    await expect(content).not.toHaveAttribute('inert', '');
    expect(await anyPageHidden()).toBe(false);
  });

  test('every scoped and page-blocking dialog interleaving holds the modality contract', async ({
    page,
  }) => {
    await page.goto('/components/dialog');
    await ensurePageIsActive(page);

    const example = page.locator('app-dialog-app-shell-scoped-example');
    const content = example.locator('[hellAppContent][data-slot="root"]');

    // Two page-blocking dialogs and one scoped dialog, all on this page. Every
    // sequence below is driven programmatically because a blocking dialog is,
    // by design, in the way of the next trigger.
    const click = (label: string) =>
      page.evaluate((text) => {
        [...document.querySelectorAll<HTMLElement>('button')]
          .find((button) => button.textContent?.trim() === text)
          ?.click();
      }, label);
    const dismiss = (title: string) =>
      page.evaluate((text) => {
        const panel = [...document.querySelectorAll('[role="dialog"]')].find((dialog) =>
          dialog.querySelector('h2')?.textContent?.includes(text),
        );
        [...(panel?.querySelectorAll<HTMLElement>('button') ?? [])]
          .find((button) => ['Cancel', 'Got it'].includes(button.textContent?.trim() ?? ''))
          ?.click();
      }, title);

    const OPEN: Record<string, () => Promise<void>> = {
      s: () => click('Approve invoice'),
      p1: () => click('Publish article'),
      p2: () => click('Casual dialog'),
    };
    const CLOSE: Record<string, () => Promise<void>> = {
      s: () => dismiss('Approve invoice 4021?'),
      p1: () => dismiss('Publish this article?'),
      p2: () => dismiss('Dismiss me freely'),
    };

    const sequences: readonly (readonly string[])[] = [
      ['+s', '-s'],
      ['+p1', '-p1'],
      ['+p1', '+p2', '-p2', '-p1'],
      ['+p1', '+s', '-p1', '-s'],
      ['+p1', '+s', '-s', '-p1'],
      ['+s', '+p1', '-s', '-p1'],
      ['+s', '+p1', '-p1', '-s'],
    ];

    for (const sequence of sequences) {
      const label = sequence.join(' ');
      await test.step(label, async () => {
        const open = new Set<string>();
        for (const step of sequence) {
          const id = step.slice(1);
          if (step.startsWith('+')) {
            await OPEN[id]();
            open.add(id);
          } else {
            await CLOSE[id]();
            open.delete(id);
          }
          const scoped = [...open].filter((entry) => entry.startsWith('s')).length;
          const blocking = [...open].filter((entry) => entry.startsWith('p')).length;
          const where = `${label} @ ${step}`;

          // Settle the open set first: the invariant below can be satisfied by
          // a close that has not finished, which would let the next step run
          // against the wrong stack.
          await expect
            .poll(() => page.locator('[role="dialog"]').count(), {
              message: `${where}: open dialogs`,
              timeout: SETTLE_TIMEOUT,
            })
            .toBe(open.size);

          await expect
            .poll(
              () =>
                page.evaluate(() => ({
                  hidden: [...document.body.children].some(
                    (child) => child.getAttribute('aria-hidden') === 'true',
                  ),
                  released: document.body.hasAttribute('data-focus-trap'),
                  blocked:
                    document
                      .querySelector('app-dialog-app-shell-scoped-example [hellAppContent]')
                      ?.hasAttribute('inert') ?? false,
                })),
              { message: where, timeout: SETTLE_TIMEOUT },
            )
            .toEqual({
              hidden: blocking > 0,
              released: scoped > 0 && blocking === 0,
              blocked: scoped > 0,
            });
        }
        await expect(content).not.toHaveAttribute('inert', '');
      });
    }
  });
});
