import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDatePicker(page: Page): Promise<void> {
  await freezeBrowserDate(page);
  await page.goto('/components/date-picker');
  await expect(page.getByRole('heading', { name: 'Date picker', level: 1 })).toBeVisible();
}

async function freezeBrowserDate(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(2026, 3, 22, 12, 0, 0, 0).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        Object.defineProperty(FixedDate, 'name', { value: 'Date' });
        globalThis.Date = FixedDate;
      })();
    `,
  });
}

test.describe('date picker browser accessibility contract', () => {
  test('single-date picker exposes grid relationships and APG-style keyboard navigation', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-single-date-example');
    const picker = example.locator('hell-date-picker');
    await expect(example).toBeVisible();
    await expect(monthLabel(picker, 'April 2026')).toHaveAttribute('aria-live', 'polite');

    const grid = picker.getByRole('grid', { name: 'April 2026' });
    await expect(grid).toBeVisible();
    await expectPickerLayoutAligned(picker);
    await expect(cellForDay(picker, 22)).toHaveAttribute('aria-selected', 'true');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-selected', '');

    await picker.getByRole('button', { name: 'Next month' }).click();
    await expect(monthLabel(picker, 'May 2026')).toBeVisible();
    await picker.getByRole('button', { name: 'Previous month' }).click();
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();
    await picker.getByRole('button', { name: 'Next year' }).click();
    await expect(monthLabel(picker, 'April 2027')).toBeVisible();
    await picker.getByRole('button', { name: 'Previous year' }).click();
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();

    await dayButton(picker, 22).click();
    await expect(dayButton(picker, 22)).toBeFocused();
    await expect(dayButton(picker, 22)).toHaveAttribute('tabindex', '0');
    await page.keyboard.press('ArrowRight');
    await expect(dayButton(picker, 23)).toBeFocused();
    await expect(dayButton(picker, 23)).toHaveAttribute('tabindex', '0');
    await expect(dayButton(picker, 22)).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowDown');
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(dayButton(picker, 1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(monthLabel(picker, 'May 2026')).toBeVisible();
    await expect(dayButton(picker, 30)).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();
    await expect(dayButton(picker, 30)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 30)).toHaveAttribute('data-selected', '');
    await expect(cellForDay(picker, 30)).toHaveAttribute('aria-selected', 'true');
    await expect(example).toContainText('Selected: Thu Apr 30 2026');
  });

  test('bounded and disabled pickers expose disabled navigation and date states', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const boundedPicker = page
      .locator('app-date-picker-bounded-example')
      .locator('hell-date-picker');
    await expect(monthLabel(boundedPicker, 'April 2026')).toBeVisible();
    await expect(boundedPicker.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Previous year' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    await expect(boundedPicker.getByRole('button', { name: 'Next month' })).toBeEnabled();
    await expect(boundedPicker.getByRole('button', { name: 'Next year' })).toBeDisabled();

    const disabledPicker = page
      .locator('app-date-picker-disabled-example')
      .locator('hell-date-picker')
      .first();
    await expect(disabledPicker.getByRole('grid')).toHaveAttribute('data-disabled', '');
    for (const name of ['Previous year', 'Previous month', 'Next month', 'Next year']) {
      await expect(disabledPicker.getByRole('button', { name })).toBeDisabled();
      await expect(disabledPicker.getByRole('button', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    await expect(dayButton(disabledPicker, 22)).toBeDisabled();
    await expect(cellForDay(disabledPicker, 22)).toHaveAttribute('aria-disabled', 'true');

    const disabledRangePicker = page
      .locator('app-date-picker-disabled-example')
      .locator('hell-date-range-picker');
    await expectRangeDays(disabledRangePicker, {
      start: 5,
      between: [6, 7, 8, 9, 10, 11],
      end: 12,
    });
    await expectRangeRailGeometry(disabledRangePicker);
  });

  test('range picker exposes start, between, end states and keyboard range reselection', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-range-example');
    const picker = example.locator('hell-date-range-picker');
    await expect(picker).toHaveAttribute('data-range', 'true');
    await expectRangeDays(picker, {
      start: 5,
      between: [6, 7, 8, 9, 10, 11],
      end: 12,
    });
    await expectRangeRailGeometry(picker);
    await expect(example).toContainText('Sun Apr 05 2026');
    await expect(example).toContainText('Sun Apr 12 2026');

    await dayButton(picker, 18).focus();
    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 18)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 12)).not.toHaveAttribute('data-range-end');
    await expectStandaloneRangeButton(picker, 18);
    await expect(example).toContainText('Sat Apr 18 2026');
    await expect(example).toContainText(/Sat Apr 18 2026\s*\u2192\s*\u2014/);

    await page.keyboard.press('ArrowRight');
    await expect(dayButton(picker, 19)).toBeFocused();
    await page.keyboard.press('Space');
    await expectRangeDays(picker, {
      start: 18,
      between: [],
      end: 19,
    });
    await expectRangeRailGeometry(picker);
    await expect(example).toContainText('Sun Apr 19 2026');

    await dayButton(picker, 22).focus();
    await page.keyboard.press('Enter');
    await expectStandaloneRangeButton(picker, 22);
    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-range-end', '');
    await expectStandaloneRangeButton(picker, 22);
    await expect(example).toContainText(/Wed Apr 22 2026\s*\u2192\s*Wed Apr 22 2026/);
  });
});

function monthLabel(picker: Locator, name: string): Locator {
  return picker.getByRole('heading', { level: 2, name });
}

function dayButton(picker: Locator, day: number): Locator {
  return picker
    .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
    .filter({ hasText: new RegExp(`^\\s*${day}\\s*$`) })
    .first();
}

function cellForDay(picker: Locator, day: number): Locator {
  return dayButton(picker, day).locator('xpath=ancestor::td[1]');
}

async function expectPickerLayoutAligned(picker: Locator): Promise<void> {
  const header = await requiredBox(picker.locator('.hell-date-picker-header'), 'picker header');
  const grid = await requiredBox(picker.locator('.hell-date-picker-grid'), 'picker grid');
  const label = await requiredBox(picker.locator('.hell-date-picker-label'), 'picker label');
  const previousMonth = await requiredBox(
    picker.getByRole('button', { name: 'Previous month' }),
    'previous month button',
  );
  const nextMonth = await requiredBox(
    picker.getByRole('button', { name: 'Next month' }),
    'next month button',
  );

  expect(Math.abs(header.width - grid.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(centerX(header) - centerX(grid))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerY(label) - centerY(previousMonth))).toBeLessThanOrEqual(1);
  expect(Math.abs(centerY(label) - centerY(nextMonth))).toBeLessThanOrEqual(1);
}

async function expectRangeDays(
  picker: Locator,
  selection: { start: number; between: readonly number[]; end: number },
): Promise<void> {
  await expect(dayButton(picker, selection.start)).toHaveAttribute('data-range-start', '');

  for (const day of selection.between) {
    await expect(dayButton(picker, day)).toHaveAttribute('data-range-between', '');
  }

  await expect(dayButton(picker, selection.end)).toHaveAttribute('data-range-end', '');
}

async function expectRangeRailGeometry(picker: Locator): Promise<void> {
  const geometry = await picker.evaluate((element) => {
    const grid = element.querySelector<HTMLElement>('.hell-date-picker-grid');
    const gridBox = grid?.getBoundingClientRect();
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-hell-primary-soft)';
    element.append(probe);
    const railColor = getComputedStyle(probe).color;
    probe.remove();

    return {
      gridLeft: gridBox?.left ?? 0,
      gridRight: gridBox?.right ?? 0,
      railColor,
      rows: Array.from(element.querySelectorAll('tbody tr'))
        .map((row) => {
          return Array.from(row.querySelectorAll<HTMLTableCellElement>('td')).flatMap((cell) => {
            const button = cell.querySelector<HTMLElement>(
              'button[data-range-start], button[data-range-between], button[data-range-end]',
            );

            if (!button) {
              return [];
            }

            const cellBox = cell.getBoundingClientRect();
            const buttonBox = button.getBoundingClientRect();
            const before = getComputedStyle(cell, '::before');
            const buttonStyle = getComputedStyle(button);
            const starts = button.hasAttribute('data-range-start');
            const ends = button.hasAttribute('data-range-end');
            const kind = starts && ends ? 'single' : starts ? 'start' : ends ? 'end' : 'between';

            return [
              {
                day: button.textContent?.trim() ?? '',
                kind,
                cellLeft: cellBox.left,
                cellRight: cellBox.right,
                cellWidth: cellBox.width,
                buttonCenter: buttonBox.left + buttonBox.width / 2,
                buttonWidth: buttonBox.width,
                cellCenter: cellBox.left + cellBox.width / 2,
                railBackgroundColor: before.backgroundColor,
                railBackgroundImage: before.backgroundImage,
                radiusTopLeft: parseFloat(buttonStyle.borderTopLeftRadius),
                radiusTopRight: parseFloat(buttonStyle.borderTopRightRadius),
                radiusBottomRight: parseFloat(buttonStyle.borderBottomRightRadius),
                radiusBottomLeft: parseFloat(buttonStyle.borderBottomLeftRadius),
              },
            ];
          });
        })
        .filter((row) => row.length > 0),
    };
  });

  const rows = geometry.rows;
  const cells = rows.flat();
  expect(cells.length).toBeGreaterThan(0);

  for (const [rowIndex, row] of rows.entries()) {
    const first = row[0];
    const last = row[row.length - 1];
    const wrapsIn = rowIndex > 0 && first.kind !== 'start' && first.kind !== 'single';
    const wrapsOut = rowIndex < rows.length - 1 && last.kind !== 'end' && last.kind !== 'single';

    if (wrapsIn) {
      expect(
        Math.abs(first.cellLeft - geometry.gridLeft),
        'range rail should enter wrapped row',
      ).toBeLessThanOrEqual(1);
    }

    if (wrapsOut) {
      expect(
        Math.abs(last.cellRight - geometry.gridRight),
        'range rail should leave wrapped row without a missing terminal cell',
      ).toBeLessThanOrEqual(1);
    }

    for (const [index, cell] of row.entries()) {
      expectCompactCenteredRangeButton(cell);

      if (index > 0) {
        const previous = row[index - 1];
        expect(
          Math.abs(cell.cellLeft - previous.cellRight),
          `range rail cells ${previous.day} and ${cell.day} should touch`,
        ).toBeLessThanOrEqual(1);
      }

      if (cell.kind === 'between') {
        expect(hasVisibleRail(cell), `range day ${cell.day} should paint the soft rail`).toBe(true);
        expectNoButtonRadius(cell, `range day ${cell.day}`);
      } else if (cell.kind === 'start') {
        expectOutgoingRail(cell, geometry.railColor);
        expectOutsideLeftRadius(cell, `range start ${cell.day}`);
      } else if (cell.kind === 'end') {
        expectIncomingRail(cell, geometry.railColor);
        expectOutsideRightRadius(cell, `range end ${cell.day}`);
      } else {
        expectStandaloneRangeCell(cell, `single-day range ${cell.day}`);
      }
    }
  }
}

async function expectStandaloneRangeButton(picker: Locator, day: number): Promise<void> {
  const cell = await dayButton(picker, day).evaluate((button) => {
    const tableCell = button.closest<HTMLTableCellElement>('td');
    if (!tableCell) throw new Error('date button should be inside a table cell');

    const cellBox = tableCell.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const before = getComputedStyle(tableCell, '::before');
    const buttonStyle = getComputedStyle(button);

    return {
      day: button.textContent?.trim() ?? '',
      kind: 'single',
      cellLeft: cellBox.left,
      cellRight: cellBox.right,
      cellWidth: cellBox.width,
      buttonCenter: buttonBox.left + buttonBox.width / 2,
      buttonWidth: buttonBox.width,
      cellCenter: cellBox.left + cellBox.width / 2,
      railBackgroundColor: before.backgroundColor,
      railBackgroundImage: before.backgroundImage,
      radiusTopLeft: parseFloat(buttonStyle.borderTopLeftRadius),
      radiusTopRight: parseFloat(buttonStyle.borderTopRightRadius),
      radiusBottomRight: parseFloat(buttonStyle.borderBottomRightRadius),
      radiusBottomLeft: parseFloat(buttonStyle.borderBottomLeftRadius),
    };
  });

  expectCompactCenteredRangeButton(cell);
  expectStandaloneRangeCell(cell, `standalone range day ${day}`);
}

interface RangeCellGeometry {
  readonly day: string;
  readonly kind: string;
  readonly cellLeft: number;
  readonly cellRight: number;
  readonly cellWidth: number;
  readonly buttonCenter: number;
  readonly buttonWidth: number;
  readonly cellCenter: number;
  readonly railBackgroundColor: string;
  readonly railBackgroundImage: string;
  readonly radiusTopLeft: number;
  readonly radiusTopRight: number;
  readonly radiusBottomRight: number;
  readonly radiusBottomLeft: number;
}

function expectCompactCenteredRangeButton(cell: RangeCellGeometry): void {
  expect(
    cell.buttonWidth,
    `range day ${cell.day} should keep the compact button size`,
  ).toBeLessThan(cell.cellWidth - 0.75);
  expect(
    Math.abs(cell.buttonCenter - cell.cellCenter),
    `range day ${cell.day} button should stay centered in its grid cell`,
  ).toBeLessThanOrEqual(1);
}

function expectOutgoingRail(cell: RangeCellGeometry, railColor: string): void {
  expect(
    cell.railBackgroundImage,
    `range start ${cell.day} should extend the rail forward`,
  ).toContain('linear-gradient');
  expect(
    cell.railBackgroundImage,
    `range start ${cell.day} should use the soft rail color`,
  ).toContain(railColor);
  expect(
    firstTransparentStopIndex(cell.railBackgroundImage),
    `range start ${cell.day} should begin transparent before the chip edge`,
  ).toBeLessThan(cell.railBackgroundImage.indexOf(railColor));
}

function expectIncomingRail(cell: RangeCellGeometry, railColor: string): void {
  expect(cell.railBackgroundImage, `range end ${cell.day} should receive the rail`).toContain(
    'linear-gradient',
  );
  expect(
    cell.railBackgroundImage,
    `range end ${cell.day} should use the soft rail color`,
  ).toContain(railColor);
  expect(
    cell.railBackgroundImage.indexOf(railColor),
    `range end ${cell.day} should paint the rail before the end chip`,
  ).toBeLessThan(firstTransparentStopIndex(cell.railBackgroundImage));
}

function expectStandaloneRangeCell(cell: RangeCellGeometry, label: string): void {
  expect(hasVisibleRail(cell), `${label} should not paint a range rail`).toBe(false);
  expect(cell.radiusTopLeft, `${label} should keep the top-left corner`).toBeGreaterThan(0);
  expect(cell.radiusTopRight, `${label} should keep the top-right corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomRight, `${label} should keep the bottom-right corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomLeft, `${label} should keep the bottom-left corner`).toBeGreaterThan(0);
}

function expectNoButtonRadius(cell: RangeCellGeometry, label: string): void {
  expect(cell.radiusTopLeft, `${label} should not have inner chip radius`).toBe(0);
  expect(cell.radiusTopRight, `${label} should not have inner chip radius`).toBe(0);
  expect(cell.radiusBottomRight, `${label} should not have inner chip radius`).toBe(0);
  expect(cell.radiusBottomLeft, `${label} should not have inner chip radius`).toBe(0);
}

function expectOutsideLeftRadius(cell: RangeCellGeometry, label: string): void {
  expect(cell.radiusTopLeft, `${label} should keep the outside corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomLeft, `${label} should keep the outside corner`).toBeGreaterThan(0);
  expect(cell.radiusTopRight, `${label} should remove the inside corner`).toBe(0);
  expect(cell.radiusBottomRight, `${label} should remove the inside corner`).toBe(0);
}

function expectOutsideRightRadius(cell: RangeCellGeometry, label: string): void {
  expect(cell.radiusTopRight, `${label} should keep the outside corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomRight, `${label} should keep the outside corner`).toBeGreaterThan(0);
  expect(cell.radiusTopLeft, `${label} should remove the inside corner`).toBe(0);
  expect(cell.radiusBottomLeft, `${label} should remove the inside corner`).toBe(0);
}

function hasVisibleRail(cell: RangeCellGeometry): boolean {
  return (
    !isTransparentColor(cell.railBackgroundColor) || cell.railBackgroundImage.trim() !== 'none'
  );
}

function isTransparentColor(value: string): boolean {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || /\/\s*0\)?$/.test(value.trim());
}

function firstTransparentStopIndex(backgroundImage: string): number {
  const transparent = backgroundImage.indexOf('transparent');
  if (transparent >= 0) return transparent;

  const rgbaTransparent = backgroundImage.indexOf('rgba(0, 0, 0, 0)');
  if (rgbaTransparent >= 0) return rgbaTransparent;

  return Number.POSITIVE_INFINITY;
}

async function requiredBox(
  locator: Locator,
  label: string,
): Promise<NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>> {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a browser layout box`).not.toBeNull();
  return box!;
}

function centerX(box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>): number {
  return box.x + box.width / 2;
}

function centerY(box: NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>): number {
  return box.y + box.height / 2;
}
