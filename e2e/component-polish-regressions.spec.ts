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

  test('listbox secondary muted text rethemes with the color scheme and keeps AA contrast', async ({
    page,
  }) => {
    // The muted foreground Semantic Theme Token is scheme-owned: the dark
    // theme re-tunes it while palettes deliberately leave neutral text alone
    // (#344). Pin both halves — the token reacts to `data-hell-theme`, and the
    // Listbox secondary line keeps WCAG AA contrast in each scheme.
    await page.emulateMedia({ colorScheme: 'light' });
    await gotoDocsPage(page, '/components/listbox', 'Listbox');

    const example = page.locator('app-listbox-basic-example');
    const listbox = example.getByRole('listbox', { name: 'Assign owner' });
    await expect(listbox).toBeVisible();
    await listbox.scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-hell-theme', 'light');

    const light = await listboxOptionTextColors(example);
    expect(light.mutedColor).not.toBe(light.primaryColor);
    expect(contrastRatio(light.mutedColor, light.surfaceColor)).toBeGreaterThanOrEqual(4.5);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-hell-theme', 'dark');

    const dark = await listboxOptionTextColors(example);
    expect(dark.surfaceColor).not.toBe(light.surfaceColor);
    expect(dark.mutedColor).not.toBe(light.mutedColor);
    expect(dark.mutedColor).not.toBe(dark.primaryColor);
    expect(contrastRatio(dark.mutedColor, dark.surfaceColor)).toBeGreaterThanOrEqual(4.5);
  });

  test('avatar overflow trigger behaves like a group member and keeps menu keyboard access', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/avatar-group', 'Avatar group');
    // Hover styling and its transition only progress on an active page; a
    // deactivated headless WebKit page would keep reporting the idle colors.
    await ensurePageIsActive(page);

    const example = page.locator('app-avatar-group-with-tooltip-menu-example');
    const trigger = example.getByRole('button', { name: '2 more team members' });
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
    const menu = page.getByRole('menu', { name: 'More team members' });
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

  test('avatar overflow menu renders checkbox rows with avatar left and checkmark right', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/avatar-group', 'Avatar group');
    await ensurePageIsActive(page);

    const example = page.locator('app-avatar-group-with-tooltip-menu-example');
    const trigger = example.getByRole('button', { name: '2 more team members' });
    await expect(trigger).toBeVisible();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.keyboard.press('Enter');

    const menu = page.getByRole('menu', { name: 'More team members' });
    await expect(menu).toBeVisible();
    await finishAnimations(menu);

    // Rows follow the menu's checkbox-item contract: role, accessible name, and
    // aria-checked reflecting the example's assigned set.
    const rows = menu.getByRole('menuitemcheckbox');
    await expect(rows).toHaveCount(2);
    const assignedRow = menu.getByRole('menuitemcheckbox', { name: 'Mina Ortiz' });
    const unassignedRow = menu.getByRole('menuitemcheckbox', { name: 'Samir Khan' });
    await expect(assignedRow).toHaveAttribute('aria-checked', 'true');
    await expect(unassignedRow).toHaveAttribute('aria-checked', 'false');

    // Row anatomy: avatar leading, name after it, checkmark indicator trailing.
    const avatarBox = await boxFor(assignedRow.locator('hell-avatar'));
    const nameBox = await boxFor(assignedRow.getByText('Mina Ortiz', { exact: true }));
    const indicatorBox = await boxFor(assignedRow.locator('[hellMenuItemIndicator]'));
    expect(avatarBox.x + avatarBox.width).toBeLessThanOrEqual(nameBox.x + 1);
    expect(indicatorBox.x).toBeGreaterThanOrEqual(nameBox.x + nameBox.width - 1);

    // The checkmark mirrors checked state: painted for assigned, hidden otherwise.
    const indicatorOpacity = (row: Locator) =>
      row
        .locator('[hellMenuItemIndicator]')
        .evaluate((element) => getComputedStyle(element).opacity);
    expect(await indicatorOpacity(assignedRow)).toBe('1');
    expect(await indicatorOpacity(unassignedRow)).toBe('0');

    // Keyboard toggle on the focused first row: state flips, menu stays open.
    await expect(assignedRow).toBeFocused();
    await page.keyboard.press('Space');
    await expect(assignedRow).toHaveAttribute('aria-checked', 'false');
    await expect(menu).toBeVisible();
    expect(await indicatorOpacity(assignedRow)).toBe('0');

    // Pointer toggle on the other row: checkmark appears, menu still open.
    await unassignedRow.click();
    await expect(unassignedRow).toHaveAttribute('aria-checked', 'true');
    await expect(menu).toBeVisible();
    expect(await indicatorOpacity(unassignedRow)).toBe('1');
  });

  test('radio plan picker aligns control, label, chip, and description in every option', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/radio', 'Radio');

    const example = page.locator('app-radio-plan-picker-example');
    await expect(example).toBeVisible();
    await example.scrollIntoViewIfNeeded();

    const fields = example.locator('[hellField]');
    await expect(fields).toHaveCount(3);

    let chipRows = 0;
    for (const field of await fields.all()) {
      const { chipBox, descriptionBox, labelBox, radioBox } = await planFieldGeometry(field);

      // Control and label share one row, centered on the same horizontal axis.
      expect(Math.abs(centerY(radioBox) - centerY(labelBox))).toBeLessThanOrEqual(1);
      // The description starts under the label, not under the radio control.
      expect(Math.abs(descriptionBox.x - labelBox.x)).toBeLessThanOrEqual(1);
      expect(descriptionBox.x).toBeGreaterThanOrEqual(radioBox.x + radioBox.width);
      // And sits on its own row below the control/label row.
      expect(descriptionBox.y).toBeGreaterThanOrEqual(
        Math.max(labelBox.y + labelBox.height, radioBox.y + radioBox.height) - 1,
      );

      // The inline chip stays on the control row's axis without pushing the
      // control or label off it; rows without a chip hold the same alignment.
      if (chipBox) {
        chipRows += 1;
        expect(Math.abs(centerY(chipBox) - centerY(radioBox))).toBeLessThanOrEqual(1);
      }
    }
    expect(chipRows).toBe(1);
  });
});

/**
 * Reads the settled text colors of an unselected listbox option (primary line
 * and muted secondary line) plus the opaque listbox surface behind them.
 */
async function listboxOptionTextColors(example: Locator): Promise<{
  surfaceColor: string;
  primaryColor: string;
  mutedColor: string;
}> {
  return example.evaluate((element) => {
    const listbox = element.querySelector('[hellListbox]');
    const option = element.querySelector('[hellListboxOption][aria-selected="false"]');
    const [name, team] = Array.from(option?.querySelectorAll('span') ?? []);
    if (!listbox || !option || !name || !team) {
      throw new Error('Expected a listbox with an unselected two-line option.');
    }
    return {
      surfaceColor: getComputedStyle(listbox).backgroundColor,
      primaryColor: getComputedStyle(name).color,
      mutedColor: getComputedStyle(team).color,
    };
  });
}

/** Parses an opaque `rgb()`/`rgba()` computed color into its channels. */
function parseOpaqueRgb(color: string): [number, number, number] {
  const match = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(color);
  if (!match || (match[4] !== undefined && Number(match[4]) < 1)) {
    throw new Error(`Expected an opaque rgb color, got "${color}".`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** WCAG 2.x contrast ratio between two opaque computed colors. */
function contrastRatio(foreground: string, background: string): number {
  const luminance = (channels: [number, number, number]): number => {
    const [r, g, b] = channels.map((value) => {
      const scaled = value / 255;
      return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const first = luminance(parseOpaqueRgb(foreground));
  const second = luminance(parseOpaqueRgb(background));
  const [lighter, darker] = first > second ? [first, second] : [second, first];
  return (lighter + 0.05) / (darker + 0.05);
}

function hasNoVisibleShadow(boxShadow: string): boolean {
  if (boxShadow === 'none') return true;

  const transparentZeroShadow = 'rgba(0, 0, 0, 0) 0px 0px 0px 0px';
  return boxShadow
    .replaceAll(`${transparentZeroShadow}, `, '')
    .replaceAll(transparentZeroShadow, '')
    .trim() === '';
}

type Box = { x: number; y: number; width: number; height: number };

/**
 * Measure one plan-picker field's anatomy in a single evaluate, so every box
 * shares the same scroll position and the cross-element comparisons hold.
 */
async function planFieldGeometry(field: Locator): Promise<{
  chipBox: Box | null;
  descriptionBox: Box;
  labelBox: Box;
  radioBox: Box;
}> {
  await field.evaluate((element) => {
    element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
  });
  await field.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );

  return field.evaluate((element) => {
    const radio = element.querySelector('button[hellRadio]');
    const label = element.querySelector('label[hellFieldLabel]');
    const description = element.querySelector('[hellFieldDescription]');
    const chip = element.querySelector('[hellChip]');
    if (!radio || !label || !description) {
      throw new Error('Expected plan picker field anatomy.');
    }

    const rect = (target: Element) => {
      const box = target.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };

    return {
      chipBox: chip ? rect(chip) : null,
      descriptionBox: rect(description),
      labelBox: rect(label),
      radioBox: rect(radio),
    };
  });
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
