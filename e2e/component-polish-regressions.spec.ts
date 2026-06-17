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
  await locator.scrollIntoViewIfNeeded();
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
      const track = slider.locator('.hell-slider-track');
      const range = slider.locator('.hell-slider-range');
      const thumb = slider.locator('.hell-slider-thumb');

      await expect(thumb).toHaveAttribute('aria-orientation', 'vertical');

      const sliderBox = await boxFor(slider);
      const trackBox = await boxFor(track);
      const rangeBox = await boxFor(range);
      const thumbBox = await boxFor(thumb);

      expect(sliderBox.y).toBeGreaterThanOrEqual(previewBox.y);
      expect(sliderBox.y + sliderBox.height).toBeLessThanOrEqual(previewBox.y + previewBox.height);
      expect(trackBox.y).toBeGreaterThan(sliderBox.y);
      expect(trackBox.y + trackBox.height).toBeLessThan(sliderBox.y + sliderBox.height);
      expect(Math.abs(centerX(trackBox) - centerX(thumbBox))).toBeLessThanOrEqual(1);
      expect(Math.abs(centerX(rangeBox) - centerX(trackBox))).toBeLessThanOrEqual(1);
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
    const horizontalTrack = horizontal.locator('.hell-slider-track');
    const horizontalThumb = horizontal.locator('.hell-slider-thumb');
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

    const group = example.locator('.hell-toggle-group');
    const selected = group.locator('.hell-toggle[data-selected]');
    const unselected = group.locator('.hell-toggle:not([data-selected])').first();
    await expect(selected).toHaveText('Left');

    const colors = await group.evaluate((element) => {
      const groupElement = element as HTMLElement;
      const selectedElement = groupElement.querySelector(
        '.hell-toggle[data-selected]',
      ) as HTMLElement | null;
      const unselectedElement = groupElement.querySelector(
        '.hell-toggle:not([data-selected])',
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
    expect(colors.selected.borderColor).not.toBe(colors.unselected.borderColor);
    expect(colors.selected.color).not.toBe(colors.unselected.color);
    expect(colors.selected.boxShadow).not.toBe('none');

    await unselected.hover();
    await expect(unselected).not.toHaveAttribute('data-selected');
    const hoverBackground = await unselected.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(hoverBackground).not.toBe(colors.unselected.backgroundColor);
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
      };
    });

    await trigger.hover();
    const hovered = await trigger.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        transform: styles.transform,
      };
    });
    expect(hovered.backgroundColor).not.toBe(idle.backgroundColor);
    expect(hovered.color).not.toBe(idle.color);
    expect(hovered.transform).not.toBe(idle.transform);

    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu', { name: 'More people' });
    await expect(menu).toBeVisible();

    const openState = await trigger.evaluate((element) => ({
      ariaExpanded: element.getAttribute('aria-expanded'),
      dataOpen: element.hasAttribute('data-open'),
      borderColor: getComputedStyle(element).borderColor,
      boxShadow: getComputedStyle(element).boxShadow,
    }));
    expect(openState.ariaExpanded === 'true' || openState.dataOpen).toBe(true);
    expect(openState.boxShadow).not.toBe('none');

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
