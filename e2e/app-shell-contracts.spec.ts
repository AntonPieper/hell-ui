import { expect, test, type Locator, type Page } from '@playwright/test';
import { SETTLE_TIMEOUT, ensurePageIsActive, finishAnimations } from './utils';

interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

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

async function boundingBoxOf(locator: Locator, label: string): Promise<Rect> {
  const box = await locator.boundingBox();
  expect(box, `${label} needs a rendered box`).not.toBeNull();
  return box!;
}

/**
 * The shell must reserve the secondary rail's width instead of letting main
 * content run underneath it, so the content box always ends at or before the
 * rail's leading edge.
 */
async function expectContentClearOfRailEdge(
  parts: AppShellParts,
  railLeadingEdge: number,
  label: string,
): Promise<void> {
  const content = await boundingBoxOf(parts.content, `${label} content`);
  expect(
    Math.round(content.x + content.width),
    `${label}: main content must stay clear of the secondary rail`,
  ).toBeLessThanOrEqual(Math.round(railLeadingEdge) + 1);
}

/**
 * Every duration in the shell and in its navigation recipe reads
 * `--hell-duration-base`, so stretching that one token stretches the whole
 * transition coherently. Frame sampling then resolves the motion even when a
 * loaded runner starves `requestAnimationFrame`, and the geometry under test is
 * duration-independent. An inline custom property outranks the theme rules that
 * would otherwise supply it.
 */
const SAMPLED_RAIL_DURATION_MS = 1_200;

async function stretchRailDuration(page: Page): Promise<void> {
  await page.evaluate((duration) => {
    document.documentElement.style.setProperty('--hell-duration-base', `${duration}ms`);
    document.documentElement.style.setProperty('--hell-duration-fast', `${duration}ms`);
  }, SAMPLED_RAIL_DURATION_MS);
}

interface RailMotionSamples {
  readonly frames: number;
  /** Distinct rail widths seen. A low count means the sample missed the animation. */
  readonly trackWidths: number;
  /** How far the rail actually travelled over the sample. */
  readonly trackTravel: number;
  /** Spread of a nav row's width across the transition; 0 means it never re-laid-out. */
  readonly rowWidthSpread: number;
  readonly labelWidthSpread: number;
  /** Frames where a label's own text was being clipped or ellipsised. */
  readonly labelClipFrames: number;
  /** Frames where a label left layout outright instead of fading. */
  readonly labelDisplayNoneFrames: number;
  readonly labelOpacityLevels: number;
  /** Largest single-frame move of a rail icon — a jump shows up here. */
  readonly worstIconStep: number;
  readonly finalIconOffCenter: number;
  /** Frames where a section heading grew past the single line it rests at. */
  readonly headingOverflowFrames: number;
}

/** Height of an expanded section heading — one line, by the recipe's contract. */
async function singleLineHeadingHeight(page: Page): Promise<number> {
  return page
    .locator('hd-root [hellAppSidenav] .hd-nav-section-toggle')
    .first()
    .evaluate((heading) => heading.getBoundingClientRect().height);
}

/**
 * Sample every animation frame of one sidenav collapse or expand.
 *
 * The click is dispatched from inside the frame loop: driving it from the test
 * process races the recorder and loses the opening frames of an ease-out,
 * which is exactly where a mid-transition jump would hide.
 */
async function recordRailMotion(
  page: Page,
  options: { readonly sampleMs?: number; readonly singleLineHeading: number },
): Promise<RailMotionSamples> {
  return page.evaluate(async ({ sampleMs, singleLineHeading }) => {
    const ms = sampleMs ?? 1_700;
    const shell = document.querySelector('hd-root > [hellAppShell][data-slot="root"]')!;
    const nav = shell.querySelector(':scope > [hellAppSidenav][data-slot="root"]')!;
    const toggle = shell.querySelector<HTMLElement>(
      ':scope > [hellAppTopbar] > button[hellSidenavToggle]',
    )!;
    const rows = [...nav.querySelectorAll<HTMLElement>('.hd-nav-item')];
    const headings = [...nav.querySelectorAll<HTMLElement>('.hd-nav-section-toggle')];

    const sample = () => {
      const navBox = nav.getBoundingClientRect();
      return {
        navWidth: navBox.width,
        navCenter: navBox.x + navBox.width / 2,
        rows: rows.map((row) => {
          const label = row.querySelector<HTMLElement>('.hd-nav-item-label')!;
          const icon = row.querySelector<HTMLElement>('.hd-nav-item-icon')!;
          const iconBox = icon.getBoundingClientRect();
          const labelStyle = getComputedStyle(label);
          return {
            width: row.getBoundingClientRect().width,
            labelWidth: label.getBoundingClientRect().width,
            labelClipped: label.scrollWidth > label.clientWidth,
            labelDisplayNone: labelStyle.display === 'none',
            labelOpacity: Number(labelStyle.opacity),
            iconX: iconBox.x,
            iconCenter: iconBox.x + iconBox.width / 2,
          };
        }),
        headings: headings.map((heading) => heading.getBoundingClientRect().height),
      };
    };

    const captured: (ReturnType<typeof sample>)[] = [];
    await new Promise<void>((resolve) => {
      let started = 0;
      const step = () => {
        captured.push(sample());
        if (!started) {
          started = performance.now();
          toggle.click();
        }
        if (performance.now() - started < ms) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });

    const distinct = (values: number[], epsilon: number) =>
      values.reduce<number[]>((seen, value) => {
        if (!seen.some((other) => Math.abs(other - value) <= epsilon)) seen.push(value);
        return seen;
      }, []).length;
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    const worstStep = (values: number[]) =>
      values.reduce((worst, value, index) =>
        index === 0 ? worst : Math.max(worst, Math.abs(value - values[index - 1])), 0);

    const perRow = rows.map((_, index) => captured.map((frame) => frame.rows[index]));
    return {
      frames: captured.length,
      trackWidths: distinct(captured.map((frame) => frame.navWidth), 0.5),
      trackTravel: spread(captured.map((frame) => frame.navWidth)),
      rowWidthSpread: Math.max(...perRow.map((row) => spread(row.map((f) => f.width)))),
      labelWidthSpread: Math.max(...perRow.map((row) => spread(row.map((f) => f.labelWidth)))),
      labelClipFrames: perRow.reduce(
        (total, row) => total + row.filter((f) => f.labelClipped).length,
        0,
      ),
      labelDisplayNoneFrames: perRow.reduce(
        (total, row) => total + row.filter((f) => f.labelDisplayNone).length,
        0,
      ),
      labelOpacityLevels: Math.max(
        ...perRow.map((row) => distinct(row.map((f) => f.labelOpacity), 0.001)),
      ),
      worstIconStep: Math.max(...perRow.map((row) => worstStep(row.map((f) => f.iconX)))),
      finalIconOffCenter: Math.max(
        ...perRow.map((row) => Math.abs(row.at(-1)!.iconCenter - captured.at(-1)!.navCenter)),
      ),
      headingOverflowFrames: captured.filter((frame) =>
        frame.headings.some((height) => height > singleLineHeading + 1),
      ).length,
    };
  }, options);
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

  test('the shell reserves the secondary rail so main content is never overlapped', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const shell = page
      .locator('app-app-shell-secondary-panel-example')
      .locator('> [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);

    await expect(shell).toBeVisible();
    await finishAnimations(shell);
    await expectContentClearOfRailEdge(
      parts,
      (await boundingBoxOf(parts.secondary, 'desktop open secondary')).x,
      'desktop, secondary open',
    );

    await parts.headerToggle.click();
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await finishAnimations(shell);
    const collapsedRail = await boundingBoxOf(parts.secondary, 'desktop collapsed rail');
    await expectContentClearOfRailEdge(parts, collapsedRail.x, 'desktop, secondary collapsed');

    // Both rails collapsed at once has no declaration of its own — it is
    // reconstructed from the shared track — so it needs its own measurement.
    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await finishAnimations(shell);
    const bothCollapsedRail = await boundingBoxOf(parts.secondary, 'desktop both rails collapsed');
    await expectContentClearOfRailEdge(
      parts,
      bothCollapsedRail.x,
      'desktop, sidenav and secondary collapsed',
    );
    expect(
      Math.round(bothCollapsedRail.width),
      'collapsing the sidenav as well must not change the secondary track',
    ).toBe(Math.round(collapsedRail.width));
    await parts.sidenavToggle.click();
    await expect(shell).not.toHaveAttribute('data-sidenav-collapsed', 'true');
    await finishAnimations(shell);

    // A shell without a secondary panel must not reserve a dead rail column.
    const bareShell = page
      .locator('app-app-shell-basic-example')
      .locator('> [hellAppShell][data-slot="root"]');
    const bareParts = appShellParts(bareShell);
    await expect(bareParts.secondary).toHaveCount(0);
    await finishAnimations(bareShell);
    const [bareShellBox, bareContentBox] = await Promise.all([
      boundingBoxOf(bareShell, 'bare shell'),
      boundingBoxOf(bareParts.content, 'bare shell content'),
    ]);
    expect(
      Math.round(bareShellBox.x + bareShellBox.width - (bareContentBox.x + bareContentBox.width)),
      'a shell with no secondary panel must give the trailing width to content',
      // The docs example draws a 1px border around the shell.
    ).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(shell).toHaveAttribute('data-mobile-layout', 'true');
    await expect(shell).toHaveAttribute('data-secondary-hidden', 'true');
    await finishAnimations(shell);
    const mobileRail = await boundingBoxOf(parts.railToggle, 'mobile collapsed rail');
    expect(mobileRail.width, 'the mobile rail stays an operable click target').toBeGreaterThan(0);
    await expectContentClearOfRailEdge(parts, mobileRail.x, 'mobile, secondary collapsed');

    // The mobile rail reservation is guarded by the projected aside, so a shell
    // without one must not grow a phantom gutter there either.
    await finishAnimations(bareShell);
    const [mobileBareShellBox, mobileBareContentBox] = await Promise.all([
      boundingBoxOf(bareShell, 'mobile bare shell'),
      boundingBoxOf(bareParts.content, 'mobile bare shell content'),
    ]);
    expect(
      Math.round(
        mobileBareShellBox.x +
          mobileBareShellBox.width -
          (mobileBareContentBox.x + mobileBareContentBox.width),
      ),
      'a mobile shell with no secondary panel must not reserve the rail strip',
    ).toBeLessThanOrEqual(1);

    // The expanded mobile panel is a deliberate drawer overlay, but the rail
    // strip it collapses back into must stay reserved underneath it.
    await parts.railToggle.click();
    await expect(shell).toHaveAttribute('data-mobile-secondary-open', 'true');
    await finishAnimations(shell);
    await expectContentClearOfRailEdge(parts, mobileRail.x, 'mobile, secondary open');
    await expectNoHorizontalOverflow(page);
  });

  test('the rail transition animates without re-laying out the navigation it carries', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);
    await expect(parts.sidenav).toBeVisible();
    await finishAnimations(shell);
    const singleLineHeading = await singleLineHeadingHeight(page);
    await stretchRailDuration(page);

    for (const phase of ['collapse', 'expand'] as const) {
      const motion = await recordRailMotion(page, { singleLineHeading });
      const at = (message: string) => `${phase}: ${message}`;

      // Without a real interpolation the stability assertions below are vacuous.
      expect(motion.trackTravel, at('the rail must cross most of its range')).toBeGreaterThan(150);
      expect(
        motion.trackWidths,
        at('the rail width must be sampled while it interpolates'),
      ).toBeGreaterThan(3);

      // Rows are sized from the rail's resting content width, so the box the
      // shell is interpolating never re-lays-out what the rows carry.
      expect(motion.rowWidthSpread, at('nav rows must keep one width')).toBeLessThanOrEqual(1);
      expect(motion.labelWidthSpread, at('labels must keep one width')).toBeLessThanOrEqual(1);
      expect(motion.labelClipFrames, at('no label may re-ellipsise mid transition')).toBe(0);
      expect(
        motion.headingOverflowFrames,
        at('no section heading may wrap to a second line mid transition'),
      ).toBe(0);

      // Labels fade rather than leaving layout outright.
      expect(motion.labelDisplayNoneFrames, at('labels must fade, not disappear')).toBe(0);
      expect(motion.labelOpacityLevels, at('the label fade must be interpolated')).toBeGreaterThan(
        2,
      );

      // Icons travel continuously between their row and rail positions.
      expect(motion.worstIconStep, at('rail icons must not jump between positions')).toBeLessThan(
        4,
      );
    }

    // The row stays anchored to the rail's leading edge, so the glyph itself has
    // to land centered once the collapse settles.
    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await finishAnimations(shell);
    const [railBox, iconBox] = await Promise.all([
      boundingBoxOf(parts.sidenav, 'collapsed rail'),
      boundingBoxOf(page.locator('hd-root [hellAppSidenav] .hd-nav-item-icon').first(), 'rail icon'),
    ]);
    expect(
      Math.abs(iconBox.x + iconBox.width / 2 - (railBox.x + railBox.width / 2)),
      'a collapsed rail icon ends up centered in the rail',
    ).toBeLessThanOrEqual(1);
  });

  test('the rail recipe takes its motion from the shell duration tokens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const label = page.locator('hd-root [hellAppSidenav] .hd-nav-item-label').first();
    const icon = page.locator('hd-root [hellAppSidenav] .hd-nav-item-icon').first();
    await expect(label).toBeVisible();

    const durations = () =>
      Promise.all([
        label.evaluate((element) => getComputedStyle(element).transitionDuration),
        icon.evaluate((element) => getComputedStyle(element).transitionDuration),
      ]);

    // `--hell-duration-base` is 180ms by default and 1ms under reduced motion;
    // hardcoded recipe durations would survive the preference unchanged.
    expect(await durations()).toEqual(['0.18s, 0.18s', '0.18s']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await durations()).toEqual(['0.001s, 0.001s', '0.001s']);

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    await appShellParts(shell).sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(label).toBeHidden();
  });

  test('collapsed docs navigation links keep stable accessible names', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/components/app-shell');

    const shell = page.locator('hd-root > [hellAppShell][data-slot="root"]');
    const parts = appShellParts(shell);
    const appShellLink = parts.sidenav.getByRole('link', { name: 'App shell', exact: true });

    await parts.sidenavToggle.click();
    await expect(shell).toHaveAttribute('data-sidenav-collapsed', 'true');
    await expect(appShellLink.locator('.hd-nav-item-label')).toBeHidden();
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
    await expect(dashboardLink.locator('span')).toBeHidden();
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
