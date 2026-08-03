import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoSeriousA11yIssues(
  page: Page,
  include: string,
  disabledRules: string[] = [],
) {
  const builder = new AxeBuilder({ page }).include(include).withTags(WCAG_SMOKE_TAGS);
  if (disabledRules.length) builder.disableRules(disabledRules);

  const results = await builder.analyze();

  const serious = results.violations.filter((violation) =>
    ['critical', 'serious'].includes(violation.impact ?? ''),
  );
  expect(serious).toEqual([]);
}

test.describe('PDF viewer runtime behavior', () => {
  test('pdf viewer keyboard controls and overview thumbnail smoke path remain stable', async ({
    page,
  }) => {
    await page.goto('/components/pdf-viewer');

    // The docs page now hosts several PDF-viewer examples; scope the smoke path
    // to the basic example so the viewer locator stays unambiguous. The Preview
    // tab lives on the enclosing hd-example-tabs, not inside the example.
    const example = page.locator('app-pdf-viewer-basic-example');
    const exampleTabs = page.locator('hd-example-tabs', { has: example });
    await exampleTabs.getByRole('tab', { name: 'Preview' }).click();

    const viewer = example.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.focus();

    const findInput = example.getByRole('searchbox', { name: /find/i });
    const findShortcutButton = example.getByRole('button', { name: /Find in document/i });

    await viewer.dispatchEvent('keydown', {
      key: 'f',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    if (!(await findInput.isVisible())) {
      await findShortcutButton.click();
    }
    await expect(findInput).toBeVisible();
    await findInput.focus();

    await page.keyboard.press('Escape');
    await expect(findInput).not.toBeVisible();

    const overviewButton = example.getByRole('button', { name: /Page overview/i }).first();
    await overviewButton.click();
    await expect(overviewButton).toHaveAttribute('aria-pressed', 'true');

    const overviewPane = example.locator('aside[data-slot="sidebar"]');
    await expect(overviewPane).toBeVisible();

    const thumbnails = example.locator('button[aria-label^="Go to page"]');
    if ((await thumbnails.count()) > 0) {
      await expect(thumbnails.first()).toBeVisible();
      await thumbnails.first().click();
      await expect(example.getByRole('spinbutton', { name: /page/i })).toHaveValue(/\d+/);
    }
  });

  test('pdf viewer page overview mounts a window and paints thumbnails on reveal', async ({
    page,
  }) => {
    const viewer = await openBasicPdfViewer(page);

    await viewer.getByRole('button', { name: /Toggle page overview/i }).click();
    const rail = viewer.locator('aside[data-slot="sidebar"]');
    await expect(rail).toBeVisible();

    const cells = rail.locator('[role="listitem"]');
    await expect(cells.first()).toBeVisible();
    const totalPages = Number(await cells.first().getAttribute('aria-setsize'));
    expect(totalPages).toBeGreaterThan(10);
    // The rail mounts the window it can show, not one button per page, and it
    // says how many pages there really are while doing it.
    expect(await cells.count()).toBeLessThan(totalPages);

    const canvasWidth = (n: number) =>
      rail.locator(`canvas[data-page="${n}"]`).evaluate((el) => (el as HTMLCanvasElement).width);
    await expect.poll(() => canvasWidth(1)).toBeGreaterThan(0);

    const lastCell = rail.locator(`[role="listitem"][data-page="${totalPages}"]`);
    await expect(lastCell).toHaveCount(0);

    await rail.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(lastCell).toHaveCount(1);
    await expect.poll(() => canvasWidth(totalPages)).toBeGreaterThan(0);

    // Clicking a revealed thumbnail still navigates the document.
    await lastCell.getByRole('button').click();
    await expect(viewer.getByRole('spinbutton', { name: /page/i })).toHaveValue(String(totalPages));

    // …and jumping back scrolls the rail to the current page rather than
    // leaving it stranded at the far end of a document it no longer shows.
    await viewer.focus();
    await page.keyboard.press('Home');
    await expect
      .poll(() => rail.evaluate((el) => el.scrollTop))
      .toBeLessThan(50);
    await expect(rail.locator('[aria-current="page"]')).toHaveAttribute(
      'aria-label',
      'Go to page 1',
    );

    // Tab traversal survives the window: focusing the last mounted button
    // scrolls the rail, which advances the window and mounts the page after it,
    // so walking does not dead-end at the edge of what is mounted.
    const mountedAtTop = await cells.count();
    await rail.locator('[data-slot="thumb"]').first().focus();
    let walkedTo = 1;
    for (let step = 0; step < mountedAtTop + 4; step++) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(
        () => document.activeElement?.getAttribute('aria-label') ?? '',
      );
      const onPage = /^Go to page (\d+)$/.exec(label);
      if (!onPage) break;
      walkedTo = Number(onPage[1]);
    }
    expect(walkedTo).toBeGreaterThan(mountedAtTop);
  });

  test('pdf viewer mobile pinch zoom scales the document', async ({ page, browserName }) => {
    test.skip(
      browserName !== 'chromium',
      'Mobile pinch regression uses Chromium DevTools Protocol touch input.',
    );

    await page.goto('/components/pdf-viewer');

    // Scope to the basic example so the viewer locator resolves to one node.
    // The Preview tab lives on the enclosing hd-example-tabs, not the example.
    const example = page.locator('app-pdf-viewer-basic-example');
    const exampleTabs = page.locator('hd-example-tabs', { has: example });
    await exampleTabs.getByRole('tab', { name: 'Preview' }).click();

    const viewer = example.locator('hell-pdf-viewer');
    await expect(viewer).toBeVisible();
    await viewer.scrollIntoViewIfNeeded();

    const scrollContainer = viewer.locator('[data-slot="pageArea"]');
    const firstPdfPage = viewer.locator('.pdfViewer .page').first();
    await expect(firstPdfPage).toBeVisible();
    const beforePinchBox = await firstPdfPage.boundingBox();
    const scrollBox = await scrollContainer.boundingBox();
    if (!beforePinchBox || !scrollBox) {
      throw new Error('Expected PDF viewer page and scroll container boxes for pinch test.');
    }

    const pinchCenterX = Math.round(scrollBox.x + scrollBox.width / 2);
    const pinchY = Math.round(
      scrollBox.y + Math.min(scrollBox.height * 0.45, scrollBox.height - 20),
    );
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { id: 41, x: pinchCenterX - 45, y: pinchY },
        { id: 42, x: pinchCenterX + 45, y: pinchY },
      ],
    });
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { id: 41, x: pinchCenterX - 95, y: pinchY },
        { id: 42, x: pinchCenterX + 95, y: pinchY },
      ],
    });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    await expect
      .poll(async () => (await firstPdfPage.boundingBox())?.width ?? 0)
      .toBeGreaterThan(beforePinchBox.width * 1.2);
  });

  test.describe('pdf viewer on a phone-sized touch viewport', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test('toolbar controls stay finger-sized and inside the viewer box', async ({ page }) => {
      const viewer = await openBasicPdfViewer(page);

      const viewerBox = await viewer.boundingBox();
      const toolbar = viewer.locator('[data-slot="toolbar"]');
      const toolbarBox = await toolbar.boundingBox();
      if (!viewerBox || !toolbarBox) {
        throw new Error('Expected viewer and toolbar boxes on the phone viewport.');
      }

      // A wrapped toolbar is fine; one that overflows its own viewer is not.
      expect(toolbarBox.width).toBeLessThanOrEqual(viewerBox.width + 1);
      expect(
        await toolbar.evaluate((el) => el.scrollWidth - el.clientWidth),
      ).toBeLessThanOrEqual(1);

      const controls = toolbar.locator('button, input, select');
      const controlCount = await controls.count();
      expect(controlCount).toBeGreaterThan(0);

      // 40px is `--spacing-hell-control-lg` in the default skin the docs use.
      // The stylesheet asks for the token, not for a number, so a denser skin
      // (`compact` resolves it to 32px) legitimately lands lower — read this as
      // "the coarse-pointer sizing applies", not as a floor Hell guarantees.
      for (let index = 0; index < controlCount; index++) {
        const control = controls.nth(index);
        const box = await control.boundingBox();
        const label = await control.getAttribute('aria-label');
        if (!box) throw new Error(`Expected a box for toolbar control ${label ?? index}.`);
        // Rounded: engines disagree on the last subpixel of a token-sized box.
        expect(Math.round(box.height), `height of ${label ?? index}`).toBeGreaterThanOrEqual(40);
        if ((await control.evaluate((el) => el.tagName)) === 'BUTTON') {
          expect(Math.round(box.width), `width of ${label ?? index}`).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('the phone layout reports no axe WCAG smoke violations', async ({ page }) => {
      // Two axe passes over a live pdf.js document is the slowest test in this
      // file: ~10s alone, ~24s on firefox under parallel load. That is inside
      // the 30s default, but with no headroom worth relying on, so it gets its
      // own budget rather than leaning on a CI retry to absorb the variance.
      test.setTimeout(90_000);

      // The docs axe smoke only ever sees this viewer at desktop width, so the
      // coarse-pointer sizing and the floating overview would otherwise ship
      // with no accessibility scan at all.
      const viewer = await openBasicPdfViewer(page);
      await expectNoSeriousA11yIssues(page, 'app-pdf-viewer-basic-example hell-pdf-viewer');

      await viewer.getByRole('button', { name: /Toggle page overview/i }).click();
      await expect(viewer.locator('aside[data-slot="sidebar"]')).toBeVisible();
      await expectNoSeriousA11yIssues(page, 'app-pdf-viewer-basic-example hell-pdf-viewer');
    });

    test('the page overview floats over the document instead of squeezing it', async ({ page }) => {
      const viewer = await openBasicPdfViewer(page);

      const pageArea = viewer.locator('[data-slot="pageArea"]');
      const beforeBox = await pageArea.boundingBox();

      await viewer.getByRole('button', { name: /Toggle page overview/i }).click();
      const sidebar = viewer.locator('aside[data-slot="sidebar"]');
      await expect(sidebar).toBeVisible();

      const afterBox = await pageArea.boundingBox();
      const sidebarBox = await sidebar.boundingBox();
      if (!beforeBox || !afterBox || !sidebarBox) {
        throw new Error('Expected page area and sidebar boxes with the overview open.');
      }

      expect(afterBox.width).toBeCloseTo(beforeBox.width, 0);
      // Overlapping is the point: the rail sits on top of the page area.
      expect(sidebarBox.x).toBeLessThan(afterBox.x + afterBox.width);
      expect(sidebarBox.height).toBeCloseTo(afterBox.height, 0);
    });

    test('double tap toggles between the fitted preset and a magnified view', async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'Double-tap zoom regression uses Chromium DevTools Protocol touch input.',
      );

      const viewer = await openBasicPdfViewer(page);
      const zoomSelect = viewer.getByRole('combobox', { name: /zoom/i });
      await expect(zoomSelect).toHaveValue('auto');

      const scrollContainer = viewer.locator('[data-slot="pageArea"]');
      const firstPdfPage = viewer.locator('.pdfViewer .page').first();
      await expect(firstPdfPage).toBeVisible();
      const fittedBox = await firstPdfPage.boundingBox();
      if (!fittedBox) throw new Error('Expected a PDF page box for the double-tap test.');

      const doubleTap = await doubleTapper(page, scrollContainer);

      await doubleTap();

      await expect
        .poll(async () => (await firstPdfPage.boundingBox())?.width ?? 0)
        .toBeGreaterThan(fittedBox.width * 1.5);
      await expect(zoomSelect).not.toHaveValue('auto');

      await doubleTap();

      // Back to the preset itself, not to the number it happened to produce, so
      // the document keeps re-fitting when the viewport changes.
      await expect(zoomSelect).toHaveValue('auto');
      await expect
        .poll(async () => (await firstPdfPage.boundingBox())?.width ?? 0)
        .toBeLessThan(fittedBox.width * 1.2);
    });

    test('rotation keeps a magnified view and re-fits a restored preset', async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName !== 'chromium',
        'Rotation regression uses Chromium DevTools Protocol touch input.',
      );

      const viewer = await openBasicPdfViewer(page);
      const zoomSelect = viewer.getByRole('combobox', { name: /zoom/i });
      const firstPdfPage = viewer.locator('.pdfViewer .page').first();
      const pageWidth = async () => (await firstPdfPage.boundingBox())?.width ?? 0;

      const doubleTap = await doubleTapper(page, viewer.locator('[data-slot="pageArea"]'));
      await doubleTap();
      await expect(zoomSelect).not.toHaveValue('auto');
      const magnified = await pageWidth();

      // Landscape. A magnified view is a fixed scale, so the resize refit must
      // leave it alone rather than re-fitting the user's zoom away.
      await page.setViewportSize({ width: 844, height: 390 });
      await expect(zoomSelect).not.toHaveValue('auto');
      await expect.poll(pageWidth).toBeCloseTo(magnified, 0);

      // Back to the preset, which does re-fit — to the landscape box first.
      await doubleTap();
      await expect(zoomSelect).toHaveValue('auto');
      const landscapeFit = await pageWidth();
      expect(landscapeFit).toBeLessThan(magnified);

      await page.setViewportSize({ width: 390, height: 844 });
      await expect(zoomSelect).toHaveValue('auto');
      await expect.poll(pageWidth).toBeLessThan(landscapeFit);
    });
  });
});

/**
 * Dispatch a double tap inside a target through CDP touch input. The box is
 * measured per call so the tap follows the target across a rotation. All
 * four messages are queued on the session before any is awaited: the taps
 * must reach the input pipeline back-to-back, not spaced by round-trips.
 */
async function doubleTapper(page: Page, target: Locator): Promise<() => Promise<void>> {
  const client = await page.context().newCDPSession(page);

  return async () => {
    const box = await target.boundingBox();
    if (!box) throw new Error('Expected a box for the double-tap target.');
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + Math.min(box.height * 0.4, box.height - 20));

    const tap = () => [
      client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ id: 51, x, y }],
      }),
      client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
    ];
    await Promise.all([...tap(), ...tap()]);
  };
}

/** Open the docs page's basic PDF example and return its viewer. */
async function openBasicPdfViewer(page: Page): Promise<Locator> {
  await page.goto('/components/pdf-viewer');

  const example = page.locator('app-pdf-viewer-basic-example');
  const exampleTabs = page.locator('hd-example-tabs', { has: example });
  await exampleTabs.getByRole('tab', { name: 'Preview' }).click();

  const viewer = example.locator('hell-pdf-viewer');
  await expect(viewer).toBeVisible();
  await viewer.scrollIntoViewIfNeeded();
  await expect(viewer.locator('.pdfViewer .page').first()).toBeVisible();
  return viewer;
}
