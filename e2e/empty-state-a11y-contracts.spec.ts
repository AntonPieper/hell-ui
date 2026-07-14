import { expect, test, type Page } from '@playwright/test';

async function gotoEmptyState(page: Page): Promise<void> {
  await page.goto('/components/empty-state');
  await expect(page.getByRole('heading', { name: 'Empty state', level: 1 })).toBeVisible();
}

test.describe('empty state browser accessibility contract', () => {
  test('empty states read as plain content with a keyboard-reachable actions slot', async ({
    page,
  }) => {
    await gotoEmptyState(page);

    const noResults = page.locator('app-empty-state-no-results-example hell-empty-state');
    await expect(noResults).toBeVisible();

    // Preset copy renders as plain content — no live region announces it.
    await expect(noResults).toContainText('No matches');
    await expect(noResults.locator('[data-slot="media"] svg')).toHaveCount(1);
    await expect(noResults.locator('[aria-live]')).toHaveCount(0);

    // The projected action lives in the actions slot and is reachable and operable by keyboard.
    const clear = noResults.getByRole('button', { name: 'Clear filters' });
    await expect(noResults.locator('[data-slot="actions"]')).toContainText('Clear filters');
    await clear.focus();
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(noResults).toContainText('No customers match ""');
  });

  test('a projected real heading owns the outline entry without doubled heading roles', async ({
    page,
  }) => {
    await gotoEmptyState(page);

    const custom = page.locator('app-empty-state-custom-content-example hell-empty-state');
    await expect(custom).toBeVisible();

    // The projected <h2> is the one heading — native semantics, no promotion.
    const heading = custom.getByRole('heading', { name: 'Upload your first document', level: 2 });
    await expect(heading).toBeVisible();

    // The title wrapper stays semantically inert so the heading is not nested
    // inside a second role="heading" element.
    const titleSlot = custom.locator('[data-slot="title"]');
    await expect(titleSlot).not.toHaveAttribute('role', /.+/);
    await expect(titleSlot).not.toHaveAttribute('aria-level', /.+/);
    await expect(custom.getByRole('heading')).toHaveCount(1);

    // Both projected actions are reachable buttons.
    await expect(custom.getByRole('button', { name: 'Browse files' })).toBeVisible();
    await expect(custom.getByRole('button', { name: 'Upload' })).toBeVisible();
  });
});
