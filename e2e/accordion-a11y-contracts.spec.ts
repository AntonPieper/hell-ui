import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoAccordion(page: Page): Promise<void> {
  // Wait only for the initial document, not the full `load` event: under
  // concurrent load the production docs build can take 25-30s to fire `load`
  // (every lazy chunk/font/subresource), which alone exhausts the 30s test
  // budget. The heading assertion below still gates on Angular having
  // bootstrapped and rendered the page, so readiness coverage is unchanged.
  await page.goto('/components/accordion', { waitUntil: 'domcontentloaded' });
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

/**
 * Assert the accordion triggers form a native, sequential, non-roving Tab
 * order: each trigger is independently keyboard-focusable, none carries a
 * roving `tabindex="-1"`, and they participate in document order (earlier
 * trigger first). On engines whose platform includes plain `<button>`s in the
 * synthetic-Tab loop (Chromium, Firefox) this also drives the real `Tab` key
 * to confirm focus advances from one trigger to the next. WebKit mirrors
 * Safari's default keyboard-access policy, which omits tabindex-less buttons
 * from synthetic Tab traversal, so there the same "native, non-roving,
 * document-order tab stop" guarantee is verified via focusability plus the
 * absence of a roving tabindex — the property the traversal stands in for.
 */
async function expectSequentialTriggerTabOrder(
  page: Page,
  browserName: string,
  triggers: readonly Locator[],
): Promise<void> {
  for (const trigger of triggers) {
    await expect(trigger).not.toHaveAttribute('tabindex', '-1');
    await trigger.focus();
    await expect(trigger).toBeFocused();
  }

  const supportsSyntheticButtonTab = browserName !== 'webkit';
  if (supportsSyntheticButtonTab) {
    for (let index = 0; index < triggers.length - 1; index += 1) {
      await triggers[index].focus();
      await expect(triggers[index]).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(triggers[index + 1]).toBeFocused();
    }
  }
}

test.describe('accordion browser accessibility contract', () => {
  test('single accordion exposes heading/button/panel relationships and native keyboard behavior', async ({
    page,
    browserName,
  }) => {
    await gotoAccordion(page);

    const single = page.locator('app-accordion-basic-example');
    await expect(single).toBeVisible();

    await expect(
      single.getByRole('heading', { name: 'When will my order ship?', level: 3 }),
    ).toBeVisible();
    await expect(
      single.getByRole('heading', { name: 'What is your return policy?', level: 3 }),
    ).toBeVisible();

    const shipping = single.getByRole('button', { name: 'When will my order ship?' });
    const returns = single.getByRole('button', { name: 'What is your return policy?' });
    const shippingPanel = single.locator('[hellAccordionContent]').nth(0);
    const returnsPanel = single.locator('[hellAccordionContent]').nth(1);

    await expect(shipping).toHaveAttribute('type', 'button');
    await expect(returns).toHaveAttribute('type', 'button');
    await expect(shipping).toHaveAttribute('aria-expanded', 'true');
    await expect(returns).toHaveAttribute('aria-expanded', 'false');
    await expect(shippingPanel).toBeVisible();
    await expectTriggerControlsPanel(shipping, shippingPanel);
    await expectTriggerControlsPanel(returns, returnsPanel);
    await expectPanelAccessibilityState(shippingPanel, true);
    await expectPanelAccessibilityState(returnsPanel, false);

    await returns.focus();
    await page.keyboard.press('Enter');
    await expect(returns).toHaveAttribute('aria-expanded', 'true');
    await expect(shipping).toHaveAttribute('aria-expanded', 'false');
    await expect(returnsPanel).toBeVisible();
    await expectPanelAccessibilityState(shippingPanel, false);
    await expectPanelAccessibilityState(returnsPanel, true);

    await page.keyboard.press('Space');
    await expect(returns).toHaveAttribute('aria-expanded', 'false');
    await expectPanelAccessibilityState(returnsPanel, false);

    await expectSequentialTriggerTabOrder(page, browserName, [shipping, returns]);
  });

  test('multiple accordion keeps independent expanded state for keyboard users', async ({
    page,
  }) => {
    await gotoAccordion(page);

    const multiple = page.locator('app-accordion-multiple-example');
    await expect(multiple).toBeVisible();

    const preOpen = multiple.getByRole('button', { name: 'Permissions' });
    const first = multiple.getByRole('button', { name: 'Integrations' });
    const second = multiple.getByRole('button', { name: 'Audit log' });
    const preOpenPanel = multiple.locator('[hellAccordionContent]').first();
    const firstPanel = multiple.locator('[hellAccordionContent]').nth(1);
    const secondPanel = multiple.locator('[hellAccordionContent]').nth(2);

    await expect(multiple.getByRole('heading', { name: 'Permissions', level: 3 })).toBeVisible();
    await expect(multiple.getByRole('heading', { name: 'Integrations', level: 3 })).toBeVisible();
    await expect(multiple.getByRole('heading', { name: 'Audit log', level: 3 })).toBeVisible();
    await expect(preOpen).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(second).toHaveAttribute('aria-expanded', 'false');
    await expectTriggerControlsPanel(preOpen, preOpenPanel);
    await expectTriggerControlsPanel(first, firstPanel);
    await expectTriggerControlsPanel(second, secondPanel);
    await expectPanelAccessibilityState(preOpenPanel, true);
    await expectPanelAccessibilityState(firstPanel, false);
    await expectPanelAccessibilityState(secondPanel, false);

    await first.focus();
    await page.keyboard.press('Enter');
    await second.focus();
    await page.keyboard.press('Space');

    await expect(preOpen).toHaveAttribute('aria-expanded', 'true');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    await expect(preOpenPanel).toBeVisible();
    await expect(firstPanel).toBeVisible();
    await expect(secondPanel).toBeVisible();
    await expectPanelAccessibilityState(preOpenPanel, true);
    await expectPanelAccessibilityState(firstPanel, true);
    await expectPanelAccessibilityState(secondPanel, true);
  });
});
