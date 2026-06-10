import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoRadio(page: Page): Promise<void> {
  await page.goto('/components/radio');
  await expect(page.getByRole('heading', { name: 'Radio', level: 1 })).toBeVisible();
}

async function pressTabUntilFocused(page: Page, target: Locator, maxTabs = 8): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');

    const isFocused = await target.evaluate(
      (element) => element === element.ownerDocument.activeElement,
    );

    if (isFocused) {
      return;
    }
  }

  await expect(target).toBeFocused();
}

test.describe('radio browser accessibility contract', () => {
  test('custom vertical group exposes required state and skips disabled radios with keyboard', async ({
    page,
  }) => {
    await gotoRadio(page);

    const example = page.locator('app-radio-example-example');
    const group = example.getByRole('radiogroup', { name: 'Plan' });
    const free = group.getByRole('radio', { name: 'Free' });
    const legacy = group.getByRole('radio', { name: 'Legacy' });
    const pro = group.getByRole('radio', { name: 'Pro' });
    const enterprise = group.getByRole('radio', { name: 'Enterprise' });

    await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    await expect(group).toHaveAttribute('aria-required', 'true');
    await expect(group).toHaveAttribute('data-required', 'true');
    await expect(free).toHaveAttribute('aria-checked', 'true');
    await expect(legacy).toBeDisabled();
    await expect(legacy).toHaveAttribute('aria-disabled', 'true');
    await expect(legacy).toHaveAttribute('aria-checked', 'false');
    await expect(pro).toHaveAttribute('aria-checked', 'false');
    await expect(enterprise).toHaveAttribute('aria-checked', 'false');

    await free.focus();
    await expect(free).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(pro).toBeFocused();
    await expect(pro).toHaveAttribute('aria-checked', 'true');
    await expect(legacy).toHaveAttribute('aria-checked', 'false');
    await expect(example).toContainText('Selected: pro');

    await page.keyboard.press('ArrowLeft');
    await expect(free).toBeFocused();
    await expect(free).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: free');

    await page.keyboard.press('ArrowDown');
    await expect(pro).toBeFocused();
    await expect(pro).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: pro');

    await page.keyboard.press('ArrowUp');
    await expect(free).toBeFocused();
    await expect(free).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: free');

    await page.keyboard.press('ArrowDown');
    await expect(pro).toBeFocused();
    await expect(pro).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: pro');

    await page.keyboard.press('End');
    await expect(enterprise).toBeFocused();
    await expect(enterprise).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: enterprise');

    await page.keyboard.press('Home');
    await expect(free).toBeFocused();
    await expect(free).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: free');
  });

  test('custom horizontal group follows horizontal arrow key traversal', async ({ page }) => {
    await gotoRadio(page);

    const example = page.locator('app-radio-horizontal-example');
    const group = example.getByRole('radiogroup', { name: 'T-shirt size' });
    const small = group.getByRole('radio', { name: 'Small' });
    const medium = group.getByRole('radio', { name: 'Medium' });
    const large = group.getByRole('radio', { name: 'Large' });

    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(small).toHaveAttribute('tabindex', '-1');
    await expect(medium).toHaveAttribute('aria-checked', 'true');
    await expect(medium).toHaveAttribute('tabindex', '0');

    const tabs = page.locator('hd-example-tabs').nth(1);
    await tabs.getByRole('tab', { name: 'Preview' }).focus();
    await pressTabUntilFocused(page, medium);
    await expect(medium).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(large).toBeFocused();
    await expect(large).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: lg');

    await page.keyboard.press('ArrowUp');
    await expect(medium).toBeFocused();
    await expect(medium).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: md');

    await page.keyboard.press('ArrowRight');
    await expect(large).toBeFocused();
    await expect(large).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: lg');

    await page.keyboard.press('ArrowLeft');
    await expect(medium).toBeFocused();
    await expect(medium).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: md');

    await page.keyboard.press('Home');
    await expect(small).toBeFocused();
    await expect(small).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: sm');

    await page.keyboard.press('End');
    await expect(large).toBeFocused();
    await expect(large).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected size: lg');
  });
});
