import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoAccordion(page: Page): Promise<void> {
  await page.goto('/components/accordion');
  await expect(page.getByRole('heading', { name: 'Accordion', level: 1 })).toBeVisible();
}

async function expectTriggerControlsPanel(trigger: Locator, panel: Locator): Promise<void> {
  const [triggerId, controls, panelId, labelledBy] = await Promise.all([
    trigger.getAttribute('id'),
    trigger.getAttribute('aria-controls'),
    panel.getAttribute('id'),
    panel.getAttribute('aria-labelledby'),
  ]);

  expect(triggerId).toBeTruthy();
  expect(controls).toBeTruthy();
  expect(panelId).toBe(controls);
  expect(labelledBy).toBe(triggerId);
  await expect(panel).toHaveAttribute('role', 'region');
}

async function expectPanelAccessibilityState(panel: Locator, open: boolean): Promise<void> {
  if (open) {
    await expect(panel).not.toHaveAttribute('aria-hidden');
    await expect(panel).not.toHaveAttribute('inert');
    return;
  }

  await expect(panel).toHaveAttribute('aria-hidden', 'true');
  await expect(panel).toHaveAttribute('inert', '');
}

test.describe('accordion browser accessibility contract', () => {
  test('single accordion exposes heading/button/panel relationships and native keyboard behavior', async ({
    page,
  }) => {
    await gotoAccordion(page);

    const single = page.locator('app-accordion-single-collapsible-example');
    await expect(single).toBeVisible();

    await expect(single.getByRole('heading', { name: 'Installation', level: 3 })).toBeVisible();
    await expect(single.getByRole('heading', { name: 'Theming', level: 3 })).toBeVisible();
    await expect(single.getByRole('heading', { name: 'SSR', level: 3 })).toBeVisible();

    const installation = single.getByRole('button', { name: 'Installation' });
    const theming = single.getByRole('button', { name: 'Theming' });
    const ssr = single.getByRole('button', { name: 'SSR' });
    const installationPanel = single.locator('[hellAccordionContent]').nth(0);
    const themingPanel = single.locator('[hellAccordionContent]').nth(1);
    const ssrPanel = single.locator('[hellAccordionContent]').nth(2);

    await expect(installation).toHaveAttribute('type', 'button');
    await expect(theming).toHaveAttribute('type', 'button');
    await expect(ssr).toHaveAttribute('type', 'button');
    await expect(installation).toHaveAttribute('aria-expanded', 'true');
    await expect(theming).toHaveAttribute('aria-expanded', 'false');
    await expect(ssr).toHaveAttribute('aria-expanded', 'false');
    await expect(installationPanel).toBeVisible();
    await expectTriggerControlsPanel(installation, installationPanel);
    await expectTriggerControlsPanel(theming, themingPanel);
    await expectTriggerControlsPanel(ssr, ssrPanel);
    await expectPanelAccessibilityState(installationPanel, true);
    await expectPanelAccessibilityState(themingPanel, false);
    await expectPanelAccessibilityState(ssrPanel, false);

    await theming.focus();
    await page.keyboard.press('Enter');
    await expect(theming).toHaveAttribute('aria-expanded', 'true');
    await expect(installation).toHaveAttribute('aria-expanded', 'false');
    await expect(themingPanel).toBeVisible();
    await expect(installationPanel).toBeHidden();
    await expectPanelAccessibilityState(installationPanel, false);
    await expectPanelAccessibilityState(themingPanel, true);

    await page.keyboard.press('Space');
    await expect(theming).toHaveAttribute('aria-expanded', 'false');
    await expect(themingPanel).toBeHidden();
    await expectPanelAccessibilityState(themingPanel, false);

    await installation.focus();
    await page.keyboard.press('Tab');
    await expect(theming).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(ssr).toBeFocused();
  });

  test('multiple accordion keeps independent expanded state for keyboard users', async ({
    page,
  }) => {
    await gotoAccordion(page);

    const multiple = page.locator('app-accordion-multiple-example');
    await expect(multiple).toBeVisible();

    const first = multiple.getByRole('button', { name: 'First' });
    const second = multiple.getByRole('button', { name: 'Second' });
    const firstPanel = multiple.locator('[hellAccordionContent]').first();
    const secondPanel = multiple.locator('[hellAccordionContent]').nth(1);

    await expect(multiple.getByRole('heading', { name: 'First', level: 3 })).toBeVisible();
    await expect(multiple.getByRole('heading', { name: 'Second', level: 3 })).toBeVisible();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    await expectTriggerControlsPanel(first, firstPanel);
    await expectTriggerControlsPanel(second, secondPanel);
    await expectPanelAccessibilityState(firstPanel, false);
    await expectPanelAccessibilityState(secondPanel, false);

    await first.focus();
    await page.keyboard.press('Enter');
    await second.focus();
    await page.keyboard.press('Space');

    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(firstPanel).toBeVisible();
    await expect(secondPanel).toBeVisible();
    await expectPanelAccessibilityState(firstPanel, true);
    await expectPanelAccessibilityState(secondPanel, true);
  });
});
