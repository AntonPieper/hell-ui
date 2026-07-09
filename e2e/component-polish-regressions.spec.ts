import { expect, test, type Locator, type Page } from '@playwright/test';
import { SETTLE_TIMEOUT, ensurePageIsActive, finishAnimations, finishPageAnimations } from './utils';

async function gotoDocsPage(page: Page, path: string, heading: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

async function boxFor(locator: Locator): Promise<{
  x: number;
  y: number;
  width: number;
  height: number;
}> {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  });
  await locator.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
  const box = await locator.boundingBox();
  if (!box) throw new Error('Expected locator to have a bounding box.');
  return box;
}

function centerX(box: { x: number; width: number }): number {
  return box.x + box.width / 2;
}

function centerY(box: { y: number; height: number }): number {
  return box.y + box.height / 2;
}

test.describe('component visual polish regressions', () => {
  test('vertical sliders fit their docs container and keep track, range, and thumb aligned', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/slider', 'Slider');

    const example = page.locator('hd-example-tabs:has(app-slider-orientation-example)');
    await expect(example).toBeVisible();
    await example.scrollIntoViewIfNeeded();

    const verticalSliders = example.locator('hell-slider[data-orientation="vertical"]');
    await expect(verticalSliders).toHaveCount(2);

    for (const slider of await verticalSliders.all()) {
      const thumb = slider.locator('[data-slot="thumb"]');

      await expect(thumb).toHaveAttribute('aria-orientation', 'vertical');

      const { previewBox, rangeBox, sliderBox, thumbBox, trackBox, visualTrack } =
        await verticalSliderGeometry(slider);

      expect(sliderBox.y).toBeGreaterThanOrEqual(previewBox.y);
      expect(sliderBox.y + sliderBox.height).toBeLessThanOrEqual(
        previewBox.y + previewBox.height,
      );
      expect(trackBox.y).toBeGreaterThanOrEqual(sliderBox.y);
      expect(trackBox.y + trackBox.height).toBeLessThanOrEqual(sliderBox.y + sliderBox.height);
      expect(Math.abs(centerX(trackBox) - centerX(thumbBox))).toBeLessThanOrEqual(1);
      expect(Math.abs(centerX(rangeBox) - centerX(trackBox))).toBeLessThanOrEqual(1);
      expect(Math.abs(rangeBox.y - centerY(thumbBox))).toBeLessThanOrEqual(1);
      expect(thumbBox.height).toBeLessThanOrEqual(14.1);
      expect(thumbBox.y).toBeGreaterThanOrEqual(visualTrack.top - 1);
      expect(thumbBox.y + thumbBox.height).toBeLessThanOrEqual(visualTrack.bottom + 1);
      expect(thumbBox.y).toBeGreaterThanOrEqual(previewBox.y);
      expect(thumbBox.y + thumbBox.height).toBeLessThanOrEqual(previewBox.y + previewBox.height);
    }

    const draggableSlider = verticalSliders.first();
    const { trackBox: draggableTrackBox } = await verticalSliderGeometry(draggableSlider);
    await page.mouse.move(
      centerX(draggableTrackBox),
      draggableTrackBox.y + draggableTrackBox.height * 0.82,
    );
    await page.mouse.down();
    await page.mouse.move(
      centerX(draggableTrackBox),
      draggableTrackBox.y + draggableTrackBox.height * 0.18,
      { steps: 8 },
    );
    await expect(draggableSlider).toHaveAttribute('data-active-drag', 'true');

    const { rangeBox: draggedRangeBox, thumbBox: draggedThumbBox } =
      await verticalSliderGeometry(draggableSlider, false);
    await page.mouse.up();
    expect(Math.abs(draggedRangeBox.y - centerY(draggedThumbBox))).toBeLessThanOrEqual(1);

    const firstSlider = verticalSliders.first().getByRole('slider', { name: 'Vertical low' });
    await firstSlider.focus();
    await expect(firstSlider).toBeFocused();
    const focusedValue = Number(await firstSlider.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowUp');
    await expect(firstSlider).toHaveAttribute(
      'aria-valuenow',
      String(Math.min(focusedValue + 1, 100)),
    );

    const horizontal = page
      .locator('app-slider-basic-example hell-slider[data-orientation="horizontal"]')
      .first();
    const horizontalTrack = horizontal.locator('[data-slot="track"]');
    const horizontalThumb = horizontal.locator('[data-slot="thumb"]');
    const horizontalBox = await boxFor(horizontal);
    const horizontalTrackBox = await boxFor(horizontalTrack);
    const horizontalThumbBox = await boxFor(horizontalThumb);
    expect(horizontalBox.width).toBeGreaterThan(250);
    expect(Math.abs(centerY(horizontalTrackBox) - centerY(horizontalThumbBox))).toBeLessThanOrEqual(
      1,
    );
  });

  test('toggle group selected state stays visually distinct in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await gotoDocsPage(page, '/components/toggle', 'Toggle');

    const example = page.locator('app-toggle-group-single-example');
    await expect(example).toBeVisible();
    await example.scrollIntoViewIfNeeded();

    const group = example.locator('[hellToggleGroup][data-slot="root"]');
    const selected = group.locator('button[hellToggleGroupItem][data-slot="root"][data-selected]');
    const unselected = group
      .locator('button[hellToggleGroupItem][data-slot="root"]:not([data-selected])')
      .first();
    await expect(selected).toHaveAttribute('aria-label', 'Align left');

    const colors = await group.evaluate((element) => {
      const groupElement = element as HTMLElement;
      const selectedElement = groupElement.querySelector(
        'button[hellToggleGroupItem][data-slot="root"][data-selected]',
      ) as HTMLElement | null;
      const unselectedElement = groupElement.querySelector(
        'button[hellToggleGroupItem][data-slot="root"]:not([data-selected])',
      ) as HTMLElement | null;
      if (!selectedElement || !unselectedElement) throw new Error('Expected toggle items.');
      const snapshot = (target: HTMLElement) => {
        const styles = getComputedStyle(target);
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          color: styles.color,
          boxShadow: styles.boxShadow,
        };
      };
      return {
        group: snapshot(groupElement),
        selected: snapshot(selectedElement),
        unselected: snapshot(unselectedElement),
      };
    });

    expect(colors.selected.backgroundColor).not.toBe(colors.group.backgroundColor);
    expect(colors.selected.borderColor).toBe(colors.unselected.borderColor);
    expect(colors.selected.color).not.toBe(colors.unselected.color);
    expect(hasNoVisibleShadow(colors.selected.boxShadow)).toBe(true);

    const supportsHoverStyling = await page.evaluate(() =>
      window.matchMedia('(hover: hover)').matches,
    );
    await unselected.hover();
    await expect(unselected).not.toHaveAttribute('data-selected');
    const hoverBackground = await unselected.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    if (supportsHoverStyling) {
      expect(hoverBackground).not.toBe(colors.unselected.backgroundColor);
    }

    await selected.hover();
    const selectedHoverBackground = await selected.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(selectedHoverBackground).toBe(colors.selected.backgroundColor);
  });

  test('disabled standalone toggle does not repaint or press on pointer interaction', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/toggle', 'Toggle');
    // A deactivated headless WebKit page freezes animation clocks and hover
    // repaints, which would make the style snapshots below compare frozen
    // mid-transition frames instead of settled values.
    await ensurePageIsActive(page);

    const example = page.locator('app-toggle-basic-example');
    await expect(example).toBeVisible();
    const disabledToggle = example.getByRole('button', { name: 'Disabled', exact: true });
    await expect(disabledToggle).toBeDisabled();
    await expect(disabledToggle).toHaveAttribute('data-disabled', '');

    await finishAnimations(disabledToggle);
    const idle = await visualState(disabledToggle);

    await disabledToggle.hover();
    // Finishing animations before each snapshot also strengthens the check: a
    // wrongly-started hover/press transition is jumped to its end state and
    // caught, instead of being read mid-flight near the idle value.
    await finishAnimations(disabledToggle);
    const hovered = await visualState(disabledToggle);
    expect(hovered.backgroundColor).toBe(idle.backgroundColor);
    expect(hovered.borderColor).toBe(idle.borderColor);
    expect(hovered.transform).toBe(idle.transform);

    const box = await boxFor(disabledToggle);
    await page.mouse.move(centerX(box), centerY(box));
    await page.mouse.down();
    await finishAnimations(disabledToggle);
    const pressed = await visualState(disabledToggle);
    await page.mouse.up();
    expect(pressed.backgroundColor).toBe(idle.backgroundColor);
    expect(pressed.borderColor).toBe(idle.borderColor);
    expect(pressed.transform).toBe(idle.transform);
  });

  test('avatar overflow trigger behaves like a group member and keeps menu keyboard access', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/avatar-group', 'Avatar group');
    // Hover styling and its transition only progress on an active page; a
    // deactivated headless WebKit page would keep reporting the idle colors.
    await ensurePageIsActive(page);

    const example = page.locator('app-avatar-group-with-tooltip-menu-example');
    const trigger = example.getByRole('button', { name: '2 more assignees' });
    await expect(trigger).toBeVisible();
    await trigger.scrollIntoViewIfNeeded();

    const triggerVisualSnapshot = () =>
      trigger.evaluate((element) => {
        const styles = getComputedStyle(element);
        return {
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow,
          color: styles.color,
          transform: styles.transform,
          zIndex: styles.zIndex,
          opacity: styles.opacity,
        };
      });

    await finishAnimations(trigger);
    const idle = await triggerVisualSnapshot();

    await trigger.hover();
    // Poll the settled hover color instead of one-shot-reading a frame that a
    // frozen transition clock could leave at the idle color; re-hovering and
    // finishing animations each attempt makes the poll self-healing if the
    // runner drops activation mid-test.
    await expect
      .poll(
        async () => {
          await trigger.hover();
          await finishAnimations(trigger);
          return (await triggerVisualSnapshot()).backgroundColor;
        },
        {
          message: 'overflow trigger should repaint its background on hover',
          timeout: SETTLE_TIMEOUT,
        },
      )
      .not.toBe(idle.backgroundColor);
    const hovered = await triggerVisualSnapshot();
    expect(hovered.backgroundColor).not.toBe(idle.backgroundColor);
    expect(hovered.color).not.toBe(idle.color);
    // The overflow badge also draws the shared member hover ring (box-shadow
    // cutting through neighbors), so it stays a peer in the stack instead of
    // lifting out of it (transform, z-index, and opacity all hold).
    expect(hovered.boxShadow).not.toBe(idle.boxShadow);
    expect(hovered.transform).toBe(idle.transform);
    expect(hovered.zIndex).toBe(idle.zIndex);
    expect(hovered.opacity).toBe('1');

    await trigger.focus();
    await expect(trigger).toBeFocused({ timeout: SETTLE_TIMEOUT });

    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'Remaining assignees' });
    await expect(menu).toBeVisible();
    // Settle the menu enter animation and the trigger's open-state transition
    // deterministically before reading styles and geometry.
    await finishAnimations(menu);
    await finishAnimations(trigger);

    const openState = await trigger.evaluate((element) => ({
      ariaExpanded: element.getAttribute('aria-expanded'),
      dataOpen: element.hasAttribute('data-open'),
      backgroundColor: getComputedStyle(element).backgroundColor,
      borderColor: getComputedStyle(element).borderColor,
      boxShadow: getComputedStyle(element).boxShadow,
      opacity: getComputedStyle(element).opacity,
      transform: getComputedStyle(element).transform,
      zIndex: getComputedStyle(element).zIndex,
    }));
    expect(openState.ariaExpanded === 'true' || openState.dataOpen).toBe(true);
    expect(openState.boxShadow).not.toBe(idle.boxShadow);
    expect(openState.boxShadow).not.toBe('none');
    expect(openState.opacity).toBe('1');
    expect(openState.transform).toBe(idle.transform);
    expect(openState.zIndex).toBe(idle.zIndex);

    const triggerBox = await boxFor(trigger);
    const menuBox = await boxFor(menu);
    // The menu opens bottom-end, so its trailing (right) edge aligns with the
    // trigger's trailing edge.
    expect(
      Math.abs(menuBox.x + menuBox.width - (triggerBox.x + triggerBox.width)),
    ).toBeLessThanOrEqual(4);
    expect(
      menuBox.y >= triggerBox.y + triggerBox.height || menuBox.y + menuBox.height <= triggerBox.y,
    ).toBe(true);

    await page.keyboard.press('Escape');
    // Finish the exit animation each attempt so a frozen animation clock
    // cannot keep the closing menu visible past the assertion timeout.
    await expect
      .poll(
        async () => {
          await finishPageAnimations(page);
          return menu.isHidden();
        },
        {
          message: 'menu should close after Escape',
          timeout: SETTLE_TIMEOUT,
        },
      )
      .toBe(true);
    await expect(trigger).toBeFocused({ timeout: SETTLE_TIMEOUT });
  });
});

function hasNoVisibleShadow(boxShadow: string): boolean {
  if (boxShadow === 'none') return true;

  const transparentZeroShadow = 'rgba(0, 0, 0, 0) 0px 0px 0px 0px';
  return boxShadow
    .replaceAll(`${transparentZeroShadow}, `, '')
    .replaceAll(transparentZeroShadow, '')
    .trim() === '';
}

async function verticalSliderGeometry(
  locator: Locator,
  scrollIntoView = true,
): Promise<{
  previewBox: { x: number; y: number; width: number; height: number };
  rangeBox: { x: number; y: number; width: number; height: number };
  sliderBox: { x: number; y: number; width: number; height: number };
  thumbBox: { x: number; y: number; width: number; height: number };
  trackBox: { x: number; y: number; width: number; height: number };
  visualTrack: { top: number; bottom: number };
}> {
  if (scrollIntoView) {
    await locator.evaluate((element) => {
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    });
  }
  await locator.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );

  return locator.evaluate((element) => {
    const preview = element.closest('hd-example-tabs')?.querySelector('.hd-example');
    const track = element.querySelector('[data-slot="track"]');
    const range = element.querySelector('[data-slot="range"]');
    const thumb = element.querySelector('[data-slot="thumb"]');
    if (!preview || !track || !range || !thumb) {
      throw new Error('Expected vertical slider anatomy.');
    }

    const rect = (target: Element) => {
      const box = target.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    };
    const trackBox = rect(track);
    const trackStyles = getComputedStyle(track, '::before');
    const top = Number.parseFloat(trackStyles.top) || 0;
    const bottom = Number.parseFloat(trackStyles.bottom) || 0;

    return {
      previewBox: rect(preview),
      rangeBox: rect(range),
      sliderBox: rect(element),
      thumbBox: rect(thumb),
      trackBox,
      visualTrack: {
        top: trackBox.y + top,
        bottom: trackBox.y + trackBox.height - bottom,
      },
    };
  });
}

async function visualState(locator: Locator): Promise<{
  backgroundColor: string;
  borderColor: string;
  transform: string;
}> {
  return locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor,
      transform: styles.transform,
    };
  });
}
