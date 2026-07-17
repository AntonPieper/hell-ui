import { expect, test, type Locator, type Page } from '@playwright/test';
import { SETTLE_TIMEOUT, ensurePageIsActive, finishAnimations } from './utils';

interface AppShellParts {
  readonly topbar: Locator;
  readonly sidenavToggle: Locator;
  readonly sidenav: Locator;
  readonly content: Locator;
  readonly secondary: Locator;
  readonly railToggle: Locator;
  readonly secondaryBody: Locator;
  readonly headerToggle: Locator;
}

function appShellParts(shell: Locator): AppShellParts {
  const topbar = shell.locator('> [hellAppTopbar][data-slot="root"]');
  const secondary = shell.locator('> [hellAppSecondary][data-slot="root"]');
  const secondaryBody = secondary.locator('> [hellAppSecondaryBody][data-slot="root"]');

  return {
    topbar,
    sidenavToggle: topbar.locator('> button[hellSidenavToggle][data-slot="root"]'),
    sidenav: shell.locator('> [hellAppSidenav][data-slot="root"]'),
    content: shell.locator('> [hellAppContent][data-slot="root"]'),
    secondary,
    railToggle: secondary.locator('> button[hellSecondaryToggle][data-slot="root"]'),
    secondaryBody,
    headerToggle: secondaryBody.locator('> button[hellSecondaryToggle][data-slot="root"]'),
  };
}

async function expectControlRelationship(toggle: Locator, panel: Locator): Promise<void> {
  const panelId = await panel.getAttribute('id');
  expect(panelId, 'the controlled panel needs a native id for aria-controls').toBeTruthy();
  await expect(toggle).toHaveAttribute('aria-controls', panelId!);
}

async function expectFocused(locator: Locator, label: string): Promise<void> {
  await expect
    .poll(() => locator.evaluate((element) => document.activeElement === element), {
      message: label,
      timeout: SETTLE_TIMEOUT,
    })
    .toBe(true);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <=
          window.innerWidth,
      ),
    )
    .toBe(true);
}

test.describe('App Shell responsive contracts', () => {
  test('desktop placement recipes preserve deliberate sidenav and secondary actions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const example = page.locator('app-app-shell-secondary-panel-example');
    const shell = example.locator('> [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);

    await expect(shell).toBeVisible();
    await expect(shell).not.toHaveAttribute('data-mobile-layout', 'true');
    await expect(parts.sidenavToggle).toHaveCount(1);
    await expect(parts.railToggle).toHaveCount(1);
    await expect(parts.headerToggle).toHaveCount(1);
    await expect(parts.sidenavToggle).not.toHaveAttribute('appearance');
    await expect(parts.railToggle).not.toHaveAttribute('appearance');
    await expect(parts.headerToggle).not.toHaveAttribute('appearance');
    await expectControlRelationship(parts.sidenavToggle, parts.sidenav);
    await expectControlRelationship(parts.railToggle, parts.secondary);
    await expectControlRelationship(parts.headerToggle, parts.secondary);

    // A flex item computes an authored `inline-flex` placement recipe to
    // `flex` after blockification.
    await expect(parts.sidenavToggle).toHaveCSS('display', 'flex');
    await expect(parts.sidenavToggle).toHaveCSS('flex-basis', '56px');
    await expect(parts.headerToggle).toHaveCSS('display', 'flex');
    await expect(parts.headerToggle).toHaveCSS('text-transform', 'uppercase');

    await expect(parts.sidenavToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(parts.sidenavToggle).toHaveAttribute('aria-label', 'Collapse sidebar');
    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(parts.sidenav).toHaveAttribute('data-collapsed', 'true');
    await expect(parts.sidenavToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(parts.sidenavToggle).toHaveAttribute('aria-label', 'Expand sidebar');
    await parts.sidenavToggle.click();
    await expect(shell).not.toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(parts.sidenavToggle).toHaveAttribute('aria-expanded', 'true');

    await expect(parts.headerToggle).toBeVisible();
    await expect(parts.railToggle).toBeHidden();
    await expect(parts.headerToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(parts.headerToggle).toHaveAttribute('aria-label', 'Hide secondary panel');
    await parts.headerToggle.click();
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expect(parts.secondary).toHaveAttribute('data-hidden', 'true');
    await expect(parts.secondaryBody).toHaveAttribute('aria-hidden', 'true');
    await expect(parts.secondaryBody).toHaveAttribute('inert', '');
    await expect(parts.railToggle).toBeVisible();
    await expect(parts.railToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(parts.railToggle).toHaveAttribute('aria-label', 'Show secondary panel');
    // Absolutely positioned flex children are blockified in computed styles.
    await expect(parts.railToggle).toHaveCSS('display', 'flex');
    await expect(parts.railToggle).toHaveCSS('position', 'absolute');
    await finishAnimations(shell);

    const [secondaryBox, railBox] = await Promise.all([
      parts.secondary.boundingBox(),
      parts.railToggle.boundingBox(),
    ]);
    expect(secondaryBox).not.toBeNull();
    expect(railBox).not.toBeNull();
    expect(Math.abs(secondaryBox!.width - railBox!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(secondaryBox!.height - railBox!.height)).toBeLessThanOrEqual(1);

    await parts.railToggle.click();
    await expect(shell).not.toHaveAttribute('data-secondary-hidden', 'true');
    await expect(parts.secondary).not.toHaveAttribute('data-hidden', 'true');
    await expect(parts.secondaryBody).not.toHaveAttribute('aria-hidden', 'true');
    await expect(parts.secondaryBody).not.toHaveAttribute('inert', '');
    await expect(parts.headerToggle).toBeVisible();
    await expect(parts.headerToggle).toHaveAttribute('aria-expanded', 'true');
    await expectNoHorizontalOverflow(page);
  });

  test('collapsed docs navigation links keep stable accessible names', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);
    const appShellLink = parts.sidenav.getByRole('link', { name: 'App shell', exact: true });

    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(appShellLink.locator('[hellNavItemLabel]')).toBeHidden();
    await expect(appShellLink).toHaveAttribute('aria-label', 'App shell');

    const exampleShell = page
      .locator('app-app-shell-secondary-panel-example')
      .locator('> [hellAppShell][data-slot="root"]');
    const exampleParts = appShellParts(exampleShell);
    const dashboardLink = exampleParts.sidenav.getByRole('link', {
      name: 'Dashboard',
      exact: true,
    });

    await exampleParts.sidenavToggle.click();
    await expect(exampleShell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(dashboardLink.locator('[hellNavItemLabel]')).toBeHidden();
    await expect(dashboardLink).toHaveAttribute('aria-label', 'Dashboard');
  });

  test('mobile secondary traps and restores focus across Escape and outside dismissal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/app-shell');
    await ensurePageIsActive(page);

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);
    const secondaryLastLink = parts.secondary.getByRole('link', { name: 'Guide' });

    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expect(parts.secondary).toHaveAttribute('data-mobile-hidden', 'true');
    await expect(parts.secondary).not.toHaveAttribute('aria-hidden', 'true');
    await expect(parts.secondary).not.toHaveAttribute('inert', '');
    await expect(parts.secondaryBody).toHaveAttribute('aria-hidden', 'true');
    await expect(parts.secondaryBody).toHaveAttribute('inert', '');
    await expect(parts.railToggle).toBeVisible();
    await expectControlRelationship(parts.sidenavToggle, parts.sidenav);
    await expectControlRelationship(parts.railToggle, parts.secondary);
    await expectControlRelationship(parts.headerToggle, parts.secondary);
    await expectNoHorizontalOverflow(page);

    await parts.railToggle.focus();
    await expectFocused(parts.railToggle, 'mobile secondary rail before open');
    await parts.railToggle.press('Enter');
    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await expect(shell).not.toHaveAttribute('data-mobile-sidenav-open', 'true');
    await expect(parts.secondary).not.toHaveAttribute('data-mobile-hidden', 'true');
    await expect(parts.secondaryBody).not.toHaveAttribute('aria-hidden', 'true');
    await expect(parts.secondaryBody).not.toHaveAttribute('inert', '');
    await expect(parts.headerToggle).toHaveAttribute('aria-label', 'Hide secondary panel');
    await expectFocused(parts.headerToggle, 'mobile secondary initial focus');

    await parts.headerToggle.press('Shift+Tab');
    await expectFocused(secondaryLastLink, 'mobile secondary reverse focus wrap');
    await secondaryLastLink.press('Tab');
    await expectFocused(parts.headerToggle, 'mobile secondary forward focus wrap');
    await expectNoHorizontalOverflow(page);

    await page.keyboard.press('Escape');
    await expect(shell).not.toHaveAttribute('data-mobile-secondary-open', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await expect(parts.secondaryBody).toHaveAttribute('inert', '');
    await expectFocused(parts.railToggle, 'mobile secondary rail after Escape');

    await parts.railToggle.press('Enter');
    await expectFocused(parts.headerToggle, 'mobile secondary before outside dismissal');
    await parts.content.dispatchEvent('pointerdown', {
      button: 0,
      bubbles: true,
      composed: true,
    });
    await expect(shell).not.toHaveAttribute('data-mobile-secondary-open', 'true');
    await expectFocused(parts.railToggle, 'mobile secondary rail after outside dismissal');
    await expectNoHorizontalOverflow(page);
  });

  test('mobile panel switching stays atomic and navigation deliberately closes the sidenav', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/components/app-shell');
    await ensurePageIsActive(page);

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);

    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');

    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-mobile-sidenav-open', 'true');
    await expect
      .poll(() => parts.sidenav.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
    await parts.railToggle.click();
    await expect(shell).not.toHaveAttribute('data-mobile-sidenav-open', 'true');
    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await expectFocused(parts.headerToggle, 'mobile secondary focus after atomic panel switch');
    await page.keyboard.press('Escape');
    await expectFocused(parts.railToggle, 'mobile secondary rail after switched panel closes');

    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-mobile-sidenav-open', 'true');
    await parts.sidenav.getByRole('link', { name: 'App shell', exact: true }).click();
    await expect(shell).not.toHaveAttribute('data-mobile-sidenav-open', 'true');
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await ensurePageIsActive(page);
    await expectFocused(
      parts.sidenavToggle,
      'mobile sidenav toggle should regain DOM focus after navigation action',
    );
    await expectNoHorizontalOverflow(page);
  });
});
