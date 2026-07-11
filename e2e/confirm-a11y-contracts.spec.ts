import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * Loaded CI runners (webkit especially) can deactivate the page long enough for
 * the default 5s focus expectations to flake: a dropped page activation both
 * freezes CSS animation clocks (the dialog enter animation's computed opacity
 * sticks just below 1) and makes toBeFocused report "inactive". Focus
 * predicates therefore get extra headroom, mirroring the dialog focus contract.
 */
const FOCUS_SETTLE_TIMEOUT = 10_000;

test.describe('confirm browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/confirm');
    await expect(page.getByRole('heading', { name: 'Confirm', level: 1 })).toBeVisible();
  });

  test('opens a named dialog, focuses the confirm action, and Escape resolves false', async ({
    page,
  }) => {
    const example = page.locator('app-confirm-basic-example');
    const trigger = example.getByRole('button', { name: 'Publish article' });

    await ensurePageIsActive(page);
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    // Named by its title and described by its description.
    await expect(dialog).toHaveAttribute('aria-describedby', /\S/);
    const describedBy = (await dialog.getAttribute('aria-describedby')) ?? '';
    await expect(page.locator(`#${cssId(describedBy)}`)).toHaveText(
      'Once published, the article is visible to everyone.',
    );

    const confirm = dialog.getByRole('button', { name: 'Publish', exact: true });
    const cancel = dialog.getByRole('button', { name: 'Cancel' });

    // A non-destructive action holds initial focus; both controls are real, un-pruned tab stops.
    await expectFocused(page, confirm, 'a non-destructive action focuses the confirm button');
    await expect(confirm).not.toHaveAttribute('tabindex', '-1');
    await expect(cancel).not.toHaveAttribute('tabindex', '-1');

    // The trap wraps at both edges — focus never escapes to the surrounding document.
    await confirm.focus();
    await page.keyboard.press('Tab');
    await expectFocused(page, cancel, 'forward tab off the last control wraps to the first');
    await page.keyboard.press('Shift+Tab');
    await expectFocused(page, confirm, 'reverse tab off the first control wraps to the last');

    // Escape resolves false and restores focus to the opener.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(trigger).toBeFocused({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Publishing cancelled.')).toBeVisible();
  });

  test('a destructive action uses the danger variant, focuses the cancel override', async ({
    page,
  }) => {
    const example = page.locator('app-confirm-danger-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Delete project' }).click();

    const dialog = page.getByRole('dialog', { name: 'Delete this project?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    const confirm = dialog.getByRole('button', { name: 'Delete project' });
    const cancel = dialog.getByRole('button', { name: 'Keep project' });

    // hellDestructiveAction ⇒ danger variant; the hellSecondaryAction cancel
    // override renders with the default variant and takes initial focus.
    await expect(confirm).toHaveAttribute('data-variant', 'danger');
    await expect(cancel).toHaveAttribute('data-variant', 'default');
    await expectFocused(page, cancel, 'a destructive action focuses the cancel button');

    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Project deleted.')).toBeVisible();
  });

  test('a countdown action gates the confirm button and never auto-confirms', async ({ page }) => {
    const example = page.locator('app-confirm-countdown-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Reset database' }).click();

    const dialog = page.getByRole('dialog', { name: 'Reset the production database?' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    const confirm = dialog.getByRole('button', { name: /Reset now/ });
    await expect(confirm).toBeDisabled();
    await expect(confirm).toContainText('(');

    // The countdown only enables the button; it does not confirm on its own.
    await expect(confirm).toBeEnabled({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(dialog).toBeVisible();
    await expect(example.getByText('Database untouched.')).toBeVisible();

    await confirm.click();
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Database reset.')).toBeVisible();
  });
});

test.describe('popconfirm browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/confirm');
    await expect(page.getByRole('heading', { name: 'Confirm', level: 1 })).toBeVisible();
  });

  test('anchors a named panel, focuses cancel for destructive actions, and Escape resolves false', async ({
    page,
  }) => {
    const example = page.locator('app-popconfirm-row-delete-example');
    const anchor = example.getByRole('button', { name: 'Delete staging-eu-west' });

    await ensurePageIsActive(page);
    await anchor.click();

    const panel = page.getByRole('dialog', { name: 'Delete staging-eu-west?' });
    await expect(panel).toBeVisible();
    await settleDialogAnimations(panel);

    const confirm = panel.getByRole('button', { name: 'Delete', exact: true });
    const cancel = panel.getByRole('button', { name: 'Cancel' });

    // hellDestructiveAction ⇒ danger variant and initial focus on cancel.
    await expect(confirm).toHaveAttribute('data-variant', 'danger');
    await expectFocused(page, cancel, 'a destructive action focuses the cancel button');

    // Escape dismisses through the shared Floating Dismissal rules, resolves
    // the promise false, and restores focus to the anchor.
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(anchor).toBeFocused({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Nothing deleted yet.')).toBeVisible();
  });

  test('confirm runs the delete; an outside click dismisses without deleting', async ({ page }) => {
    const example = page.locator('app-popconfirm-row-delete-example');

    await ensurePageIsActive(page);

    // Outside click dismisses without running the action.
    await example.getByRole('button', { name: 'Delete staging-us-east' }).click();
    const cancelPanel = page.getByRole('dialog', { name: 'Delete staging-us-east?' });
    await expect(cancelPanel).toBeVisible();
    await page.getByRole('heading', { name: 'Confirm', level: 1 }).click();
    await expect(cancelPanel).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Nothing deleted yet.')).toBeVisible();

    // Confirm resolves true, runs the delete, and removes the row.
    await example.getByRole('button', { name: 'Delete staging-eu-west' }).click();
    const panel = page.getByRole('dialog', { name: 'Delete staging-eu-west?' });
    await expect(panel).toBeVisible();
    await settleDialogAnimations(panel);
    await panel.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(panel).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Deleted staging-eu-west.')).toBeVisible();
    await expect(example.getByRole('button', { name: 'Delete staging-eu-west' })).toHaveCount(0);
  });

  test('only one popconfirm is open at a time', async ({ page }) => {
    const example = page.locator('app-popconfirm-row-delete-example');

    await ensurePageIsActive(page);
    await example.getByRole('button', { name: 'Delete staging-eu-west' }).click();
    const first = page.getByRole('dialog', { name: 'Delete staging-eu-west?' });
    await expect(first).toBeVisible();

    await example.getByRole('button', { name: 'Delete staging-us-east' }).click();
    const second = page.getByRole('dialog', { name: 'Delete staging-us-east?' });
    await expect(second).toBeVisible();

    // Arming the second popconfirm closes the first (its promise resolves
    // false) — armed deletes never accumulate.
    await expect(first).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await expect(example.getByText('Nothing deleted yet.')).toBeVisible();
  });
});

test.describe('choice browser accessibility contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/confirm');
    await expect(page.getByRole('heading', { name: 'Confirm', level: 1 })).toBeVisible();
  });

  test('Escape resolves the dismiss-equivalent key; a destructive action resolves its key on click', async ({
    page,
  }) => {
    const example = page.locator('app-confirm-choice-unsaved-changes-example');
    const trigger = example.getByRole('button', { name: 'Close editor' });

    await ensurePageIsActive(page);
    await example.getByRole('textbox', { name: 'Release note' }).fill('Ship dark mode v2');
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'You have unsaved changes' });
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);

    // One button per action, in order, with the composed variants; with a
    // destructive action present, initial focus sits on the safe
    // dismiss-equivalent action.
    const save = dialog.getByRole('button', { name: 'Save and close' });
    const discard = dialog.getByRole('button', { name: 'Discard changes' });
    const stay = dialog.getByRole('button', { name: 'Keep editing' });
    await expect(save).toHaveAttribute('data-variant', 'primary');
    await expect(discard).toHaveAttribute('data-variant', 'danger');
    await expect(stay).toHaveAttribute('data-variant', 'default');
    await expectFocused(page, stay, 'choice focuses the safe dismiss-equivalent action');

    // Escape resolves the dismiss-equivalent key ('stay'), not null.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Still editing.')).toBeVisible();
    await expect(trigger).toBeFocused({ timeout: FOCUS_SETTLE_TIMEOUT });

    // Reopen and pick the destructive action: its key resolves, the draft
    // resets, and focus returns to the trigger.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await settleDialogAnimations(dialog);
    await dialog.getByRole('button', { name: 'Discard changes' }).click();

    await expect(dialog).toBeHidden({ timeout: FOCUS_SETTLE_TIMEOUT });
    await expect(example.getByText('Changes discarded — editor closed.')).toBeVisible();
    await expect(example.getByRole('textbox', { name: 'Release note' })).toHaveValue(
      'Ship dark mode',
    );
    await expect(trigger).toBeFocused({ timeout: FOCUS_SETTLE_TIMEOUT });
  });
});

/**
 * Headless WebKit on a loaded runner can drop page activation, which both
 * freezes CSS animation clocks and makes toBeFocused report "inactive". Bring
 * the page to the front and wait until it is genuinely visible and focused
 * before asserting any focus contract.
 */
async function ensurePageIsActive(page: Page): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.bringToFront();
        return page.evaluate(() => {
          window.focus();
          return document.visibilityState === 'visible' && document.hasFocus();
        });
      },
      {
        message: 'page should be visible and focused before asserting the focus contract',
        timeout: FOCUS_SETTLE_TIMEOUT,
      },
    )
    .toBe(true);
}

/**
 * Assert that `locator` is the document's active element, re-asserting page
 * activation on every poll so the check reflects the real focus state instead
 * of a deactivated one.
 */
async function expectFocused(page: Page, locator: Locator, message: string): Promise<void> {
  await expect
    .poll(
      async () => {
        await page.bringToFront();
        return locator.evaluate((element) => {
          window.focus();
          return element === document.activeElement;
        });
      },
      { message, timeout: FOCUS_SETTLE_TIMEOUT },
    )
    .toBe(true);
}

/**
 * Finish the dialog's enter animation deterministically. A throttled WebKit
 * page can freeze the animation clock just below full opacity, which wedges
 * focus on <body> instead of letting the trap grab the initial control.
 */
async function settleDialogAnimations(dialog: Locator): Promise<void> {
  await dialog.evaluate((element) => {
    for (const animation of element.getAnimations({ subtree: true })) {
      try {
        animation.finish();
      } catch {
        // Infinite animations cannot finish and do not gate settling.
      }
    }
  });
  await expect
    .poll(() => dialog.evaluate((element) => getComputedStyle(element).opacity), {
      timeout: FOCUS_SETTLE_TIMEOUT,
    })
    .toBe('1');
}

function cssId(ids: string): string {
  return ids.trim().split(/\s+/)[0].replace(/([^\w-])/g, '\\$1');
}
