import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoTabs(page: Page): Promise<void> {
  await page.goto('/components/tabs');
  await expect(page.getByRole('heading', { name: 'Tabs', level: 1 })).toBeVisible();
}

async function expectLinkedTabPanel(tab: Locator, panel: Locator): Promise<void> {
  await expect(tab).toHaveAttribute('role', 'tab');
  await expect(panel).toHaveAttribute('role', 'tabpanel');
  await expect(tab).toHaveAttribute('id', /.+/);
  await expect(panel).toHaveAttribute('id', /.+/);

  const tabId = await tab.getAttribute('id');
  const panelId = await panel.getAttribute('id');
  if (!tabId || !panelId) {
    throw new Error('Tabs must expose non-empty tab and panel ids.');
  }

  await expect(tab).toHaveAttribute('aria-controls', panelId);
  await expect(panel).toHaveAttribute('aria-labelledby', tabId);
}

test.describe('tabs browser accessibility contract', () => {
  test('horizontal tabs expose names, relationships, and automatic keyboard activation', async ({
    page,
  }) => {
    await gotoTabs(page);

    const example = page.locator('app-tabs-basic-example');
    const tablist = example.getByRole('tablist', { name: 'Account sections' });
    const general = tablist.getByRole('tab', { name: 'General' });
    const security = tablist.getByRole('tab', { name: 'Security' });
    const billing = tablist.getByRole('tab', { name: 'Billing' });
    const generalPanel = example.locator('[helltabpanel][value="general"]');
    const securityPanel = example.locator('[helltabpanel][value="security"]');
    const billingPanel = example.locator('[helltabpanel][value="billing"]');

    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(general).toHaveAttribute('aria-selected', 'true');
    await expect(generalPanel).not.toHaveAttribute('aria-hidden', 'true');
    await expect(generalPanel).toHaveAttribute('tabindex', '0');
    await expectLinkedTabPanel(general, generalPanel);
    await expectLinkedTabPanel(security, securityPanel);
    await expectLinkedTabPanel(billing, billingPanel);

    await general.focus();
    await expect(general).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(security).toBeFocused();
    await expect(security).toHaveAttribute('aria-selected', 'true');
    await expect(securityPanel).not.toHaveAttribute('aria-hidden', 'true');
    await expect(general).toHaveAttribute('aria-selected', 'false');
    await expect(generalPanel).toHaveAttribute('aria-hidden', 'true');

    await page.keyboard.press('End');
    await expect(billing).toBeFocused();
    await expect(billing).toHaveAttribute('aria-selected', 'true');
    await expect(billingPanel).not.toHaveAttribute('aria-hidden', 'true');
    await expect(billingPanel).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('ArrowLeft');
    await expect(security).toBeFocused();
    await expect(security).toHaveAttribute('aria-selected', 'true');
    await expect(securityPanel).not.toHaveAttribute('aria-hidden', 'true');

    await page.keyboard.press('Home');
    await expect(general).toBeFocused();
    await expect(general).toHaveAttribute('aria-selected', 'true');
    await expect(generalPanel).not.toHaveAttribute('aria-hidden', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(general).toBeFocused();
    await expect(general).toHaveAttribute('aria-selected', 'true');
  });

  test('vertical manual tabs move focus with arrows and activate with Enter or Space', async ({
    page,
  }) => {
    await gotoTabs(page);

    const example = page.locator('app-tabs-vertical-example');
    const tablist = example.getByRole('tablist', { name: 'Settings sections' });
    const profile = tablist.getByRole('tab', { name: 'Profile' });
    const notifications = tablist.getByRole('tab', { name: 'Notifications' });
    const integrations = tablist.getByRole('tab', { name: 'Integrations' });
    const profilePanel = example.locator('[helltabpanel][value="profile"]');
    const notificationsPanel = example.locator('[helltabpanel][value="notifications"]');
    const integrationsPanel = example.locator('[helltabpanel][value="integrations"]');

    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');
    await expect(profile).toHaveAttribute('aria-selected', 'true');
    await expect(profilePanel).not.toHaveAttribute('aria-hidden', 'true');
    await expectLinkedTabPanel(profile, profilePanel);
    await expectLinkedTabPanel(notifications, notificationsPanel);
    await expectLinkedTabPanel(integrations, integrationsPanel);

    await profile.focus();
    await expect(profile).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(notifications).toBeFocused();
    await expect(profile).toHaveAttribute('aria-selected', 'true');
    await expect(notifications).toHaveAttribute('aria-selected', 'false');
    await expect(profilePanel).not.toHaveAttribute('aria-hidden', 'true');
    await expect(notificationsPanel).toHaveAttribute('aria-hidden', 'true');

    await page.keyboard.press('Enter');
    await expect(notifications).toBeFocused();
    await expect(notifications).toHaveAttribute('aria-selected', 'true');
    await expect(notificationsPanel).not.toHaveAttribute('aria-hidden', 'true');
    await expect(notificationsPanel).toHaveAttribute('tabindex', '0');

    await page.keyboard.press('End');
    await expect(integrations).toBeFocused();
    await expect(notifications).toHaveAttribute('aria-selected', 'true');
    await expect(integrations).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('Space');
    await expect(integrations).toBeFocused();
    await expect(integrations).toHaveAttribute('aria-selected', 'true');
    await expect(integrationsPanel).not.toHaveAttribute('aria-hidden', 'true');

    await page.keyboard.press('Home');
    await expect(profile).toBeFocused();
    await expect(integrations).toHaveAttribute('aria-selected', 'true');
    await expect(profile).toHaveAttribute('aria-selected', 'false');
  });
});
