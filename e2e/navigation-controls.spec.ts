import { expect, test } from '@playwright/test';

test.describe('pagination navigation controls', () => {
  test('previous-next and page-jump recipes remain keyboard and screen-reader reachable', async ({
    page,
  }) => {
    await page.goto('/components/pagination');
    await expect(page.getByRole('heading', { name: 'Pagination', level: 1 })).toBeVisible();

    const previousNext = page.locator('app-pagination-previous-next-example');
    await expect(previousNext.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(previousNext.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await expect(previousNext.getByText('Page 1 of 9')).toBeVisible();

    await previousNext.getByRole('button', { name: 'Next page' }).focus();
    await page.keyboard.press('Enter');
    await expect(previousNext.getByText('Page 2 of 9')).toBeVisible();

    const jump = page.locator('app-pagination-jump-example');
    const select = jump.getByRole('combobox', { name: 'Page' });
    await expect(jump.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(jump.getByText('of 40')).toBeVisible();
    await expect(select).toHaveValue('6');

    await jump.getByRole('button', { name: 'Previous page' }).focus();
    await page.keyboard.press('Tab');
    await expect(select).toBeFocused();

    await select.selectOption('12');
    await expect(select).toHaveValue('12');
  });
});
