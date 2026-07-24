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

  test('keeps a very long unbroken value inside the frame with inner scroll', async ({ page }) => {
    await gotoControlGroup(page);

    const example = page.locator('app-control-group-overflow-example');
    const group = example.getByRole('group', { name: 'Webhook endpoint controls' });
    const input = group.getByRole('textbox');
    const suffix = group.locator('[hellControlGroupSuffix]');
    const action = group.getByRole('button', { name: 'Copy' });

    const groupBox = await group.boundingBox();
    const parentBox = await group.locator('..').boundingBox();
    if (!groupBox || !parentBox) throw new Error('Expected rendered group geometry.');

    // The frame never grows for content: it stays bounded by its container.
    expect(groupBox.width).toBeLessThanOrEqual(parentBox.width + 1);

    // The long unbroken value scrolls inside the control instead of pushing the frame.
    const overflow = await input.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);

    // Static affixes and the action survive the long value untouched.
    for (const surface of [suffix, action]) {
      const box = await surface.boundingBox();
      if (!box) throw new Error('Expected rendered surface geometry.');
      expect(box.x).toBeGreaterThanOrEqual(groupBox.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(groupBox.x + groupBox.width + 1);
    }
    await expect(suffix).toHaveText('.hell.app');

    // Growing the value further never widens the frame.
    await input.fill(`${'workspace-'.repeat(40)}end`);
    const grownBox = await group.boundingBox();
    if (!grownBox) throw new Error('Expected rendered group geometry.');
    expect(Math.abs(grownBox.width - groupBox.width)).toBeLessThanOrEqual(1);
  });

  test('truncates static affixes with an ellipsis in an over-constrained frame', async ({
    page,
  }) => {
    await gotoControlGroup(page);

    const example = page.locator('app-control-group-overflow-example');
    const group = example.getByRole('group', { name: 'Cluster endpoint controls' });
    const prefix = group.locator('[hellControlGroupPrefix]');
    const suffix = group.locator('[hellControlGroupSuffix]');

    // The pinned prefix keeps its full text.
    const prefixOverflow = await prefix.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(prefixOverflow.scrollWidth).toBeLessThanOrEqual(prefixOverflow.clientWidth);

    // The long static suffix gives way with an ellipsis instead of clipping the frame.
    const suffixOverflow = await suffix.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      textOverflow: getComputedStyle(element).textOverflow,
    }));
    expect(suffixOverflow.scrollWidth).toBeGreaterThan(suffixOverflow.clientWidth);
    expect(suffixOverflow.textOverflow).toBe('ellipsis');

    // The control keeps a readable floor instead of collapsing to nothing.
    const input = group.getByRole('textbox');
    const inputBox = await input.boundingBox();
    if (!inputBox) throw new Error('Expected rendered input geometry.');
    expect(inputBox.width).toBeGreaterThanOrEqual(48);
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
