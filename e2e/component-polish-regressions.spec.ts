import { expect, test, type Locator, type Page } from '@playwright/test';

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

    const example = page.locator('hd-example-tabs:has(app-slider-vertical-example)');
    await expect(example).toBeVisible();
    await example.scrollIntoViewIfNeeded();

    const preview = example.locator('.hd-example');
    const previewBox = await boxFor(preview);
    const verticalSliders = example.locator('hell-slider[data-orientation="vertical"]');
    await expect(verticalSliders).toHaveCount(2);

    for (const slider of await verticalSliders.all()) {
      const track = slider.locator('[data-slot="track"]');
      const range = slider.locator('[data-slot="range"]');
      const thumb = slider.locator('[data-slot="thumb"]');

      await expect(thumb).toHaveAttribute('aria-orientation', 'vertical');

      const sliderBox = await boxFor(slider);
      const trackBox = await boxFor(track);
      const rangeBox = await boxFor(range);
      const thumbBox = await boxFor(thumb);
      const visualTrack = await track.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const trackStyles = getComputedStyle(element, '::before');
        const top = Number.parseFloat(trackStyles.top) || 0;
        const bottom = Number.parseFloat(trackStyles.bottom) || 0;
        return {
          top: box.top + top,
          bottom: box.bottom - bottom,
        };
      });

      expect(sliderBox.y).toBeGreaterThanOrEqual(previewBox.y);
      expect(sliderBox.y + sliderBox.height).toBeLessThanOrEqual(previewBox.y + previewBox.height);
      expect(trackBox.y).toBeGreaterThan(sliderBox.y);
      expect(trackBox.y + trackBox.height).toBeLessThan(sliderBox.y + sliderBox.height);
      expect(Math.abs(centerX(trackBox) - centerX(thumbBox))).toBeLessThanOrEqual(1);
      expect(Math.abs(centerX(rangeBox) - centerX(trackBox))).toBeLessThanOrEqual(1);
      expect(thumbBox.height).toBeLessThanOrEqual(14.1);
      expect(thumbBox.y).toBeGreaterThanOrEqual(visualTrack.top - 1);
      expect(thumbBox.y + thumbBox.height).toBeLessThanOrEqual(visualTrack.bottom + 1);
      expect(thumbBox.y).toBeGreaterThanOrEqual(previewBox.y);
      expect(thumbBox.y + thumbBox.height).toBeLessThanOrEqual(previewBox.y + previewBox.height);
    }

    const firstSlider = verticalSliders.first().getByRole('slider', { name: 'Vertical low' });
    await firstSlider.focus();
    await expect(firstSlider).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(firstSlider).toHaveAttribute('aria-valuenow', '31');

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

    const example = page.locator('app-toggle-toggle-group-single-example');
    await expect(example).toBeVisible();
    await example.scrollIntoViewIfNeeded();

    const group = example.locator('[hellToggleGroup][data-slot="root"]');
    const selected = group.locator('button[hellToggleGroupItem][data-slot="root"][data-selected]');
    const unselected = group
      .locator('button[hellToggleGroupItem][data-slot="root"]:not([data-selected])')
      .first();
    await expect(selected).toHaveText('Left');

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

  test('switch thumbs animate with interpolable position properties', async ({ page }) => {
    await gotoDocsPage(page, '/components/switch', 'Switch');

    const customSwitch = page.locator('#email-notifications-switch');
    const customThumb = customSwitch.locator('[data-slot="thumb"]');
    await expect(customSwitch).toHaveAttribute('aria-checked', 'true');

    const customMotion = await switchThumbMotion(customThumb);
    expect(customMotion.transitionProperties).toContain('left');
    expect(customMotion.transitionProperties).toContain('transform');
    expect(customMotion.transitionProperties).not.toContain('right');

    await page.getByText('Email notifications', { exact: true }).click();
    await expect(customSwitch).toHaveAttribute('aria-checked', 'false');
    const customUncheckedMotion = await switchThumbMotion(customThumb);
    expect(customUncheckedMotion.transitionProperties).toEqual(customMotion.transitionProperties);

    const nativeSwitch = page.locator('app-switch-native-example input[hellNativeSwitch]');
    await expect(nativeSwitch).not.toBeChecked();
    const nativeMotion = await nativeSwitchPseudoMotion(nativeSwitch);
    expect(nativeMotion.transitionProperties).toContain('left');
    expect(nativeMotion.transitionProperties).toContain('transform');
    expect(nativeMotion.transitionProperties).not.toContain('right');

    await page.getByText('Auto updates', { exact: true }).click();
    await expect(nativeSwitch).toBeChecked();
    const nativeCheckedMotion = await nativeSwitchPseudoMotion(nativeSwitch);
    expect(nativeCheckedMotion.transitionProperties).toEqual(nativeMotion.transitionProperties);
  });

  test('disabled standalone toggle does not repaint or press on pointer interaction', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/toggle', 'Toggle');

    const example = page.locator('app-toggle-disabled-example');
    await expect(example).toBeVisible();
    const disabledToggle = example.getByRole('button', { name: 'Disabled', exact: true });
    await expect(disabledToggle).toBeDisabled();
    await expect(disabledToggle).toHaveAttribute('data-disabled', '');

    const idle = await visualState(disabledToggle);

    await disabledToggle.hover();
    const hovered = await visualState(disabledToggle);
    expect(hovered.backgroundColor).toBe(idle.backgroundColor);
    expect(hovered.borderColor).toBe(idle.borderColor);
    expect(hovered.transform).toBe(idle.transform);

    const box = await boxFor(disabledToggle);
    await page.mouse.move(centerX(box), centerY(box));
    await page.mouse.down();
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

    const example = page.locator('app-avatar-group-overflow-menu-example');
    const trigger = example.getByRole('button', { name: '3 more people' });
    await expect(trigger).toBeVisible();
    await trigger.scrollIntoViewIfNeeded();

    const idle = await trigger.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        transform: styles.transform,
        zIndex: styles.zIndex,
        opacity: styles.opacity,
      };
    });

    await trigger.hover();
    const hovered = await trigger.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        transform: styles.transform,
        zIndex: styles.zIndex,
        opacity: styles.opacity,
      };
    });
    expect(hovered.backgroundColor).not.toBe(idle.backgroundColor);
    expect(hovered.color).not.toBe(idle.color);
    expect(hovered.transform).toBe(idle.transform);
    expect(hovered.zIndex).toBe(idle.zIndex);
    expect(hovered.opacity).toBe('1');

    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'More people' });
    await expect(menu).toBeVisible();

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
    expect(openState.backgroundColor).not.toBe(idle.backgroundColor);
    expect(openState.boxShadow).not.toBe('none');
    expect(openState.opacity).toBe('1');
    expect(openState.transform).toBe(idle.transform);
    expect(openState.zIndex).toBe(idle.zIndex);

    const triggerBox = await boxFor(trigger);
    const menuBox = await boxFor(menu);
    expect(Math.abs(menuBox.x - triggerBox.x)).toBeLessThanOrEqual(4);
    expect(
      menuBox.y >= triggerBox.y + triggerBox.height || menuBox.y + menuBox.height <= triggerBox.y,
    ).toBe(true);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
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

async function switchThumbMotion(locator: Locator): Promise<{
  transitionProperties: string[];
}> {
  const transitionProperty = await locator.evaluate(
    (element) => getComputedStyle(element).transitionProperty,
  );

  return { transitionProperties: parseTransitionProperties(transitionProperty) };
}

async function nativeSwitchPseudoMotion(locator: Locator): Promise<{
  transitionProperties: string[];
}> {
  const transitionProperty = await locator.evaluate(
    (element) => getComputedStyle(element, '::before').transitionProperty,
  );

  return { transitionProperties: parseTransitionProperties(transitionProperty) };
}

function parseTransitionProperties(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
