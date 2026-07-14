import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoPagination(page: Page): Promise<void> {
  await page.goto('/components/pagination');
  await expect(page.getByRole('heading', { name: 'Pagination', level: 1 })).toBeVisible();
}

test.describe('pagination browser accessibility contract', () => {
  test('the numbered strip exposes labelled controls, current-page announcement, and disabled range edges', async ({
    page,
  }) => {
    await gotoPagination(page);

    const example = page.locator('app-pagination-basic-example');
    const nav = example.locator('hell-pagination');
    const first = example.getByRole('button', { name: 'First page' });
    const previous = example.getByRole('button', { name: 'Previous page' });
    const next = example.getByRole('button', { name: 'Next page' });
    const last = example.getByRole('button', { name: 'Last page' });

    await expect(nav).toHaveAttribute('role', 'navigation');
    await expect(nav).toHaveAttribute('aria-label', 'Pagination');

    const currentPage = example.getByRole('button', { name: 'Page 3' });
    await expect(currentPage).toHaveAttribute('aria-current', 'true');
    await expect(example.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'false',
    );
    await expect(example.getByRole('button', { name: 'Page 4' })).toHaveAttribute(
      'aria-current',
      'false',
    );

    // Page 3 of 12 sits away from both range edges, so every control is reachable.
    await expect(first).toBeEnabled();
    await expect(previous).toBeEnabled();
    await expect(next).toBeEnabled();
    await expect(last).toBeEnabled();

    await first.click();
    await expect(example.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(first).toBeDisabled();
    await expect(previous).toBeDisabled();
    await expectDisabledEdge(first);
    await expectDisabledEdge(previous);
    await expect(next).toBeEnabled();
    await expect(last).toBeEnabled();

    await last.click();
    await expect(example.getByRole('button', { name: 'Page 12' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(next).toBeDisabled();
    await expect(last).toBeDisabled();
    await expectDisabledEdge(next);
    await expectDisabledEdge(last);
    await expect(first).toBeEnabled();
    await expect(previous).toBeEnabled();
  });

  test('numbered controls stay Enter/Space activatable through the keyboard workaround', async ({
    page,
  }) => {
    await gotoPagination(page);

    const example = page.locator('app-pagination-basic-example');
    const first = example.getByRole('button', { name: 'First page' });
    const next = example.getByRole('button', { name: 'Next page' });

    await first.click();
    await expect(example.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await next.focus();
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(example.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    await next.focus();
    await page.keyboard.press('Space');
    await expect(example.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );

    // A numbered page button is reachable and activatable by keyboard alone.
    const pageFive = example.getByRole('button', { name: 'Page 5' });
    await pageFive.focus();
    await page.keyboard.press('Enter');
    await expect(pageFive).toHaveAttribute('aria-current', 'true');
    await expect(example.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'false',
    );
  });

  test('previous-next recipe names its controls and disables the previous boundary', async ({
    page,
  }) => {
    await gotoPagination(page);

    const example = page.locator('app-pagination-previous-next-example');
    const nav = example.getByRole('navigation', { name: 'Pagination' });
    const previous = example.getByRole('button', { name: 'Previous page' });
    const next = example.getByRole('button', { name: 'Next page' });

    await expect(nav).toBeVisible();
    await expect(example.getByText('Page 1 of 9')).toBeVisible();

    await expect(previous).toBeDisabled();
    await expectDisabledEdge(previous);
    await expect(next).toBeEnabled();

    await next.focus();
    await page.keyboard.press('Enter');
    await expect(example.getByText('Page 2 of 9')).toBeVisible();
    await expect(previous).toBeEnabled();
  });
});

async function expectDisabledEdge(control: Locator): Promise<void> {
  await expect(control).toBeDisabled();
  await expect(control).toHaveAttribute('tabindex', '-1');
  await expect(control).toHaveAttribute('data-disabled', '');
}
