import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function gotoControlGroup(page: Page): Promise<void> {
  await page.goto('/components/control-group', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Control Group', level: 1 })).toBeVisible();
}

test.describe('Control Group browser contract', () => {
  test('keeps focus-within across the input and action, then clears it on exit', async ({ page }) => {
    await gotoControlGroup(page);

    const example = page.locator('app-control-group-basic-example');
    const group = example.getByRole('group', { name: 'Workspace URL controls' });
    const input = example.getByRole('textbox', { name: 'Workspace URL' });
    const action = example.getByRole('button', { name: 'Copy' });

    await expect(group).toHaveAttribute('data-slot', 'root');
    await expect(group).toHaveAttribute('data-size', 'md');
    await expect(group).not.toHaveAttribute('data-focus-within');

    await input.focus();
    await expect(group).toHaveAttribute('data-focus-within', 'true');

    await action.focus();
    await expect(action).toBeFocused();
    await expect(group).toHaveAttribute('data-focus-within', 'true');

    await action.click();
    await expect(example.getByRole('button', { name: 'Copied' })).toBeFocused();
    await expect(group).toHaveAttribute('data-focus-within', 'true');

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(group).not.toHaveAttribute('data-focus-within');
  });

  test('reflects shared size, invalid, and disabled state with native control behavior', async ({
    page,
  }) => {
    await gotoControlGroup(page);

    const example = page.locator('app-control-group-states-example');
    const small = example.getByRole('group', { name: 'Small identifier' });
    const invalid = example.getByRole('group', { name: 'Amount in US dollars' });
    const disabled = example.getByRole('group', { name: 'Provisioning host' });

    await expect(small).toHaveAttribute('data-size', 'sm');
    await expect(small.locator('[hellControlGroupPrefix]')).toHaveAttribute('data-size', 'sm');

    await expect(invalid).toHaveAttribute('data-invalid', 'true');
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid.getByRole('textbox', { name: 'Amount in US dollars' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    await expect(disabled).toHaveAttribute('data-size', 'lg');
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled.getByRole('textbox', { name: 'Provisioning host' })).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Test' })).toBeDisabled();
  });

  test('keeps the documented composition axe-clean', async ({ page }) => {
    await gotoControlGroup(page);

    const results = await new AxeBuilder({ page })
      .include('app-control-group-basic-example')
      .withTags(WCAG_SMOKE_TAGS)
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
