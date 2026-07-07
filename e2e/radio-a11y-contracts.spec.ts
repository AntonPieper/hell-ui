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
  test('custom vertical group exposes required state and moves selection with roving keyboard', async ({
    page,
  }) => {
    await gotoRadio(page);

    const example = page.locator('app-radio-plan-picker-example');
    const group = example.getByRole('radiogroup', { name: 'Plan' });
    const starter = group.getByRole('radio', { name: 'Starter' });
    const team = group.getByRole('radio', { name: 'Team' });
    const enterprise = group.getByRole('radio', { name: 'Enterprise' });

    await expect(group).toHaveAttribute('aria-orientation', 'vertical');
    await expect(group).toHaveAttribute('aria-required', 'true');
    await expect(group).toHaveAttribute('data-required', 'true');
    await expect(team).toHaveAttribute('aria-checked', 'true');
    await expect(starter).toHaveAttribute('aria-checked', 'false');
    await expect(enterprise).toHaveAttribute('aria-checked', 'false');

    await team.focus();
    await expect(team).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(enterprise).toBeFocused();
    await expect(enterprise).toHaveAttribute('aria-checked', 'true');
    await expect(team).toHaveAttribute('aria-checked', 'false');
    await expect(example).toContainText('Selected: enterprise');

    await page.keyboard.press('ArrowLeft');
    await expect(team).toBeFocused();
    await expect(team).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: team');

    await page.keyboard.press('ArrowDown');
    await expect(enterprise).toBeFocused();
    await expect(enterprise).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: enterprise');

    await page.keyboard.press('ArrowUp');
    await expect(team).toBeFocused();
    await expect(team).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: team');

    await page.keyboard.press('ArrowDown');
    await expect(enterprise).toBeFocused();
    await expect(enterprise).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: enterprise');

    await page.keyboard.press('End');
    await expect(enterprise).toBeFocused();
    await expect(enterprise).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: enterprise');

    await page.keyboard.press('Home');
    await expect(starter).toBeFocused();
    await expect(starter).toHaveAttribute('aria-checked', 'true');
    await expect(example).toContainText('Selected: starter');
  });

  test('custom horizontal group follows horizontal arrow key traversal', async ({ page }) => {
    await gotoRadio(page);

    const example = page.locator('app-radio-horizontal-example');
    const group = example.getByRole('radiogroup', { name: 'T-shirt size' });
    const small = group.getByRole('radio', { name: 'Small', exact: true });
    const medium = group.getByRole('radio', { name: 'Medium', exact: true });
    const large = group.getByRole('radio', { name: 'Large', exact: true });
    const xLarge = group.getByRole('radio', { name: 'X-Large', exact: true });

    await expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(small).toHaveAttribute('tabindex', '-1');
    await expect(medium).toHaveAttribute('aria-checked', 'true');
    await expect(medium).toHaveAttribute('tabindex', '0');

    // The X-Large option is individually disabled: it exposes native + ARIA
    // disabled state, stays unchecked, and is removed from the roving tab order.
    await expect(xLarge).toBeDisabled();
    await expect(xLarge).toHaveAttribute('aria-disabled', 'true');
    await expect(xLarge).toHaveAttribute('aria-checked', 'false');
    await expect(xLarge).toHaveAttribute('tabindex', '-1');

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

    // Arrowing forward past the last enabled item wraps to the first item and
    // skips the disabled X-Large entirely: X-Large is never focused or checked.
    await page.keyboard.press('ArrowRight');
    await expect(small).toBeFocused();
    await expect(small).toHaveAttribute('aria-checked', 'true');
    await expect(xLarge).not.toBeFocused();
    await expect(xLarge).toHaveAttribute('aria-checked', 'false');
    await expect(example).toContainText('Selected size: sm');
  });
});
