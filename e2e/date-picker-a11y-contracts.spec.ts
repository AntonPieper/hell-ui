import { expect, test, type Locator, type Page } from '@playwright/test';

async function gotoDatePicker(page: Page, today = '2026, 3, 22'): Promise<void> {
  await freezeBrowserDate(page, today);
  await page.goto('/components/date-picker');
  await expect(page.getByRole('heading', { name: 'Date picker', level: 1 })).toBeVisible();
}

async function freezeBrowserDate(page: Page, today: string): Promise<void> {
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(${today}, 12, 0, 0, 0).getTime();

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

    const example = page.locator('app-date-picker-basic-example');
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

  test('header month and year triggers drill into keyboard-operable option grids', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-basic-example');
    const picker = example.locator('hell-date-picker');
    await expect(picker).toHaveAttribute('data-view', 'day');

    const monthTrigger = picker.locator('[data-slot="monthTrigger"]');
    const yearTrigger = picker.locator('[data-slot="yearTrigger"]');
    await expect(monthTrigger).toHaveText('April');
    await expect(monthTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(yearTrigger).toHaveText('2026');
    // Trigger names come from content, so the heading still names the day grid.
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();

    // Plain enabled buttons with no tabindex override: both triggers sit in the
    // natural tab order. (Tab traversal itself is engine policy — WebKit skips
    // buttons by default — so the contract is asserted structurally.)
    for (const control of [monthTrigger, yearTrigger]) {
      await expect(control).toHaveJSProperty('tagName', 'BUTTON');
      await expect(control).toBeEnabled();
      expect(await control.getAttribute('tabindex')).toBeNull();
    }

    await monthTrigger.focus();
    await expect(monthTrigger).toBeFocused();
    await page.keyboard.press('Enter');
    const monthPanel = picker.getByRole('grid', { name: 'Choose a month' });
    await expect(monthPanel).toBeVisible();
    await expect(picker).toHaveAttribute('data-view', 'month');
    await expect(monthTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(monthTrigger).toHaveAttribute(
      'aria-controls',
      (await monthPanel.getAttribute('id')) ?? '',
    );
    // The month step buttons collapse away; the year step keeps paging.
    await expect(picker.getByRole('button', { name: 'Previous month' })).toHaveCount(0);
    await expect(picker.getByRole('button', { name: 'Next year' })).toBeVisible();

    await expect(panelOption(picker, 'Apr')).toBeFocused();
    await expect(panelOption(picker, 'Apr')).toHaveAttribute('data-selected', '');
    await expect(panelCell(picker, 'Apr')).toHaveAttribute('aria-selected', 'true');
    // WCAG 2.5.3: the accessible name extends the visible label, never swaps it.
    await expect(panelOption(picker, 'Apr')).toHaveAttribute('aria-label', 'Apr 2026');

    await page.keyboard.press('ArrowRight');
    await expect(panelOption(picker, 'May')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(panelOption(picker, 'Aug')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(panelOption(picker, 'Jan')).toBeFocused();
    await page.keyboard.press('End');
    await expect(panelOption(picker, 'Dec')).toBeFocused();
    // Rolling off the last month steps the grid onto the next year.
    await page.keyboard.press('ArrowRight');
    await expect(monthLabel(picker, 'April 2027')).toBeVisible();
    await expect(panelOption(picker, 'Jan')).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();

    // Escape leaves the drill-down and restores the trigger, keeping the day grid.
    await page.keyboard.press('Escape');
    await expect(picker).toHaveAttribute('data-view', 'day');
    await expect(monthTrigger).toBeFocused();
    await expect(monthTrigger).toHaveAttribute('aria-expanded', 'false');

    await yearTrigger.click();
    const yearPanel = picker.getByRole('grid', { name: 'Choose a year' });
    await expect(yearPanel).toBeVisible();
    await expect(picker).toHaveAttribute('data-view', 'year');
    // The page is centred on the year in view, so nearby years are one click away.
    await expect(panelOptions(picker).first()).toHaveText('2015');
    await expect(panelOptions(picker).last()).toHaveText('2038');
    await expect(panelOptions(picker)).toHaveCount(24);
    await expect(panelOption(picker, '2026')).toBeFocused();

    await picker.getByRole('button', { name: 'Next years' }).click();
    await expect(panelOptions(picker).first()).toHaveText('2039');
    await picker.getByRole('button', { name: 'Previous years' }).click();
    await expect(panelOptions(picker).first()).toHaveText('2015');
  });

  test('reaches a date five years away in five interactions and restores grid focus', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-basic-example');
    const picker = example.locator('hell-date-picker');
    await expect(monthLabel(picker, 'April 2026')).toBeVisible();

    await picker.locator('[data-slot="yearTrigger"]').click(); // 1
    await panelOption(picker, '2031').click(); // 2
    await expect(monthLabel(picker, 'April 2031')).toBeVisible();
    await expect(picker).toHaveAttribute('data-view', 'day');
    // Focus lands back on the day grid's roving tab stop, ready for arrow keys.
    await expect(dayButton(picker, 22)).toBeFocused();

    await picker.locator('[data-slot="monthTrigger"]').click(); // 3
    await panelOption(picker, 'Sep').click(); // 4
    await expect(monthLabel(picker, 'September 2031')).toBeVisible();

    await dayButton(picker, 15).click(); // 5
    await expect(example).toContainText('Selected: Mon Sep 15 2031');
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
    // ng-primitives >= 0.123 drops redundant aria-disabled from natively
    // disabled buttons; data-disabled is the stable disabled marker.
    for (const name of ['Previous year', 'Previous month', 'Next month', 'Next year']) {
      await expect(disabledPicker.getByRole('button', { name })).toBeDisabled();
      await expect(disabledPicker.getByRole('button', { name })).toHaveAttribute(
        'data-disabled',
        '',
      );
    }
    await expect(dayButton(disabledPicker, 22)).toBeDisabled();
    await expect(cellForDay(disabledPicker, 22)).toHaveAttribute('aria-disabled', 'true');
    await expect(disabledPicker.locator('[data-slot="monthTrigger"]')).toBeDisabled();
    await expect(disabledPicker.locator('[data-slot="yearTrigger"]')).toBeDisabled();

    // Bounds reach the drill-down grids as well as the day grid.
    await boundedPicker.locator('[data-slot="monthTrigger"]').click();
    await expect(panelOption(boundedPicker, 'Mar')).toBeDisabled();
    await expect(panelCell(boundedPicker, 'Mar')).toHaveAttribute('aria-disabled', 'true');
    await expect(panelOption(boundedPicker, 'Apr')).toBeEnabled();

    await boundedPicker.locator('[data-slot="yearTrigger"]').click();
    await expect(panelOption(boundedPicker, '2026')).toBeEnabled();
    await expect(panelOption(boundedPicker, '2027')).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Previous years' })).toBeDisabled();
    await expect(boundedPicker.getByRole('button', { name: 'Next years' })).toBeDisabled();

    const disabledRangePicker = page
      .locator('app-date-picker-disabled-example')
      .locator('hell-date-range-picker');
    await expectRangeDays(disabledRangePicker, {
      start: 5,
      between: [6, 7, 8, 9, 10, 11],
      end: 12,
    });
    await expectSquareRangeButtons(disabledRangePicker);
  });

  test('range picker exposes start, between, end states and keyboard range reselection', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-range-example');
    const picker = example.locator('hell-date-range-picker');
    await expect(picker).toHaveAttribute('data-range', 'true');
    await expectRangeDays(picker, {
      start: 6,
      between: [7, 8, 9, 10, 11, 12],
      end: 13,
    });
    await expectSquareRangeButtons(picker);
    await expect(example).toContainText('Mon Apr 06 2026');
    await expect(example).toContainText('Mon Apr 13 2026');

    await dayButton(picker, 18).focus();
    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 18)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 13)).not.toHaveAttribute('data-range-end');
    await expectStandaloneRangeButton(picker, 18);
    await expect(example).toContainText('Sat Apr 18 2026');
    await expect(example).toContainText(/Sat Apr 18 2026\s+to\s+none/);

    await page.keyboard.press('ArrowRight');
    await expect(dayButton(picker, 19)).toBeFocused();
    await page.keyboard.press('Space');
    await expectRangeDays(picker, {
      start: 18,
      between: [],
      end: 19,
    });
    await expectSquareRangeButtons(picker);
    await expect(example).toContainText('Sun Apr 19 2026');

    await dayButton(picker, 22).focus();
    await page.keyboard.press('Enter');
    await expectStandaloneRangeButton(picker, 22);
    await page.keyboard.press('Enter');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-range-start', '');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-range-end', '');
    await expectStandaloneRangeButton(picker, 22);
    await expect(example).toContainText(/Wed Apr 22 2026\s+to\s+Wed Apr 22 2026/);
  });

  test('drill-down works inside a popover and leaves the popover Escape contract intact', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-with-popover-example');
    await example.scrollIntoViewIfNeeded();
    const trigger = example.getByRole('button', { name: /Apr 6/ });
    await trigger.click();

    const surface = page.getByRole('dialog', { name: 'Choose trip dates' });
    const picker = surface.locator('hell-date-range-picker');
    await expect(picker).toBeVisible();

    await picker.locator('[data-slot="yearTrigger"]').click();
    await expect(picker.getByRole('grid', { name: 'Choose a year' })).toBeVisible();
    await expect(panelOption(picker, '2026')).toBeFocused();
    // The popover's own min keeps past years out of the drill-down.
    await expect(panelOption(picker, '2025')).toBeDisabled();

    await panelOption(picker, '2029').click();
    await expect(picker.getByRole('heading', { level: 2, name: 'April 2029' })).toBeVisible();
    await expect(picker).toBeVisible();

    // Escape keeps closing the popover itself: dismissal stays engine-owned.
    await page.keyboard.press('Escape');
    await expect(surface).toHaveCount(0);
    await expect(trigger).toBeFocused();

    // Reopening starts on the day grid again.
    await trigger.click();
    await expect(picker).toHaveAttribute('data-view', 'day');

    // The riskier ordering: Escape while a drill-down is still open, so the
    // panel's own handler and the overlay's dismissal race over one keypress.
    await picker.locator('[data-slot="monthTrigger"]').click();
    await expect(picker).toHaveAttribute('data-view', 'month');
    await page.keyboard.press('Escape');
    await expect(surface).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('an unavailable month in view never outranks the months that can be chosen', async ({
    page,
  }) => {
    // Today outside the bounded example's window (Apr 6 – May 15 2026).
    // ng-primitives leaves focusedDate on today, so July is the month in view
    // while being unselectable — the state that made it paint as "your month".
    await gotoDatePicker(page, '2026, 6, 22');

    const picker = page.locator('app-date-picker-bounded-example').locator('hell-date-picker');
    await picker.locator('[data-slot="monthTrigger"]').click();
    await expect(picker.getByRole('grid', { name: 'Choose a month' })).toBeVisible();

    await expect(panelOption(picker, 'Jul')).toHaveAttribute('data-selected', '');
    await expect(panelOption(picker, 'Jul')).toBeDisabled();

    const paints = await picker.evaluate((element) =>
      Array.from(element.querySelectorAll<HTMLElement>('[data-slot="panelOption"]')).map(
        (option) => ({
          label: option.textContent?.trim() ?? '',
          disabled: option.hasAttribute('data-disabled'),
          background: getComputedStyle(option).backgroundColor,
        }),
      ),
    );
    const isFilled = (background: string) =>
      background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';

    // Nothing unavailable is painted, so the two selectable months are the
    // only ones that can read as chosen.
    expect(paints.filter((option) => option.disabled && isFilled(option.background))).toEqual([]);
    expect(paints.filter((option) => !option.disabled).map((option) => option.label)).toEqual([
      'Apr',
      'May',
    ]);

    // The roving tab stop lands on a month the user can actually choose.
    await expect(panelOption(picker, 'May')).toHaveAttribute('tabindex', '0');
    await expect(panelOption(picker, 'Jul')).toHaveAttribute('tabindex', '-1');
  });

  test('a day that is both today and selected keeps its number readable', async ({ page }) => {
    await gotoDatePicker(page);

    const picker = page.locator('app-date-picker-basic-example').locator('hell-date-picker');
    // The frozen clock makes 22 April both today and the selected date.
    await expect(dayButton(picker, 22)).toHaveAttribute('data-today', '');
    await expect(dayButton(picker, 22)).toHaveAttribute('data-selected', '');

    const paint = await dayButton(picker, 22).evaluate((button) => {
      const style = getComputedStyle(button);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(paint.color).not.toBe(paint.background);

    // The same clash in the drill-down: April is the month in view and today's.
    await picker.locator('[data-slot="monthTrigger"]').click();
    const option = await panelOption(picker, 'Apr').evaluate((button) => {
      const style = getComputedStyle(button);
      return { color: style.color, background: style.backgroundColor };
    });
    expect(option.color).not.toBe(option.background);
  });

  test('range picker keeps completed ranges visible across month and year views', async ({
    page,
  }) => {
    await gotoDatePicker(page);

    const example = page.locator('app-date-picker-range-example');
    const picker = example.locator('hell-date-range-picker');
    await navigateMonths(picker, 7);
    await expect(monthLabel(picker, 'November 2026')).toBeVisible();

    await dayButton(picker, 24).click();
    await navigateMonths(picker, 2);
    await expect(monthLabel(picker, 'January 2027')).toBeVisible();
    await dayButton(picker, 2).click();

    await expect(picker).toHaveAttribute('data-range-complete', '');
    await expectRangeDays(picker, {
      between: [1],
      end: 2,
    });
    await expectSquareRangeButtons(picker);
    await expect(example).toContainText(/Tue Nov 24 2026\s+to\s+Sat Jan 02 2027/);

    await navigateMonths(picker, -1);
    await expect(monthLabel(picker, 'December 2026')).toBeVisible();
    await expectRangeDays(picker, {
      between: [1, 15, 31],
    });
    await expectSquareRangeButtons(picker);

    await navigateMonths(picker, -1);
    await expect(monthLabel(picker, 'November 2026')).toBeVisible();
    await expectRangeDays(picker, {
      start: 24,
      between: [25, 26, 27, 28, 29, 30],
    });
    await expectSquareRangeButtons(picker);
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

function panelOptions(picker: Locator): Locator {
  return picker.locator('[data-slot="panelOption"]');
}

function panelOption(picker: Locator, label: string): Locator {
  return panelOptions(picker).filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).first();
}

function panelCell(picker: Locator, label: string): Locator {
  return panelOption(picker, label).locator('xpath=ancestor::td[1]');
}

async function expectPickerLayoutAligned(picker: Locator): Promise<void> {
  const header = await requiredBox(picker.locator('[data-slot="header"]'), 'picker header');
  const grid = await requiredBox(picker.locator('[data-slot="grid"]'), 'picker grid');
  const label = await requiredBox(picker.locator('[data-slot="label"]'), 'picker label');
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
  selection: { start?: number; between: readonly number[]; end?: number },
): Promise<void> {
  if (selection.start !== undefined) {
    await expect(dayButton(picker, selection.start)).toHaveAttribute('data-range-start', '');
  }

  for (const day of selection.between) {
    await expect(dayButton(picker, day)).toHaveAttribute('data-range-between', '');
  }

  if (selection.end !== undefined) {
    await expect(dayButton(picker, selection.end)).toHaveAttribute('data-range-end', '');
  }
}

async function expectSquareRangeButtons(picker: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        picker.evaluate((element) => {
          const rangeButtons = Array.from(
            element.querySelectorAll<HTMLElement>(
              '[data-slot="dateButton"][data-range-start], [data-slot="dateButton"][data-range-between], [data-slot="dateButton"][data-range-end]',
            ),
          );

          return (
            rangeButtons.length > 0 &&
            rangeButtons.every((button) => {
              const background = getComputedStyle(button).backgroundColor.trim();

              return (
                background !== 'transparent' &&
                background !== 'rgba(0, 0, 0, 0)' &&
                !/\/\s*0\)?$/.test(background)
              );
            })
          );
        }),
      {
        message:
          'range date buttons should finish painting their selection background before geometry assertions',
      },
    )
    .toBe(true);

  const geometry = await picker.evaluate((element) => {
    const buttons = Array.from(
      element.querySelectorAll<HTMLElement>('[data-slot="grid"] tbody [data-slot="dateButton"]'),
    );
    const referenceButton =
      buttons.find(
        (button) =>
          !button.hasAttribute('data-outside-month') &&
          !button.hasAttribute('data-range-start') &&
          !button.hasAttribute('data-range-between') &&
          !button.hasAttribute('data-range-end'),
      ) ??
      buttons.find((button) => !button.hasAttribute('data-outside-month')) ??
      buttons[0] ??
      null;
    const referenceCell = referenceButton?.closest<HTMLTableCellElement>('td') ?? null;
    const referenceButtonBox = referenceButton?.getBoundingClientRect();
    const referenceCellBox = referenceCell?.getBoundingClientRect();

    return {
      referenceButtonWidth: referenceButtonBox?.width ?? 0,
      referenceCellWidth: referenceCellBox?.width ?? 0,
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
                cellTop: cellBox.top,
                cellBottom: cellBox.bottom,
                cellWidth: cellBox.width,
                buttonLeft: buttonBox.left,
                buttonRight: buttonBox.right,
                buttonTop: buttonBox.top,
                buttonBottom: buttonBox.bottom,
                buttonCenter: buttonBox.left + buttonBox.width / 2,
                buttonWidth: buttonBox.width,
                buttonHeight: buttonBox.height,
                cellCenter: cellBox.left + cellBox.width / 2,
                cellHeight: cellBox.height,
                cellPseudoBackgroundColor: before.backgroundColor,
                cellPseudoBackgroundImage: before.backgroundImage,
                buttonBackgroundColor: buttonStyle.backgroundColor,
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
  expect(geometry.referenceButtonWidth).toBeGreaterThan(0);
  expect(geometry.referenceCellWidth).toBeGreaterThan(0);

  for (const [rowIndex, row] of rows.entries()) {
    if (rowIndex > 0) {
      const previousCell = rows[rowIndex - 1][0];
      const currentCell = row[0];
      expect(
        currentCell.buttonTop - previousCell.buttonBottom,
        `range rows ending at ${previousCell.day} and starting at ${currentCell.day} should keep a vertical gap`,
      ).toBeGreaterThan(1);
    }

    for (const [index, cell] of row.entries()) {
      expectNoCellRail(cell, `range day ${cell.day}`);

      if (index > 0) {
        const previous = row[index - 1];
        expect(
          cell.cellLeft - previous.cellRight,
          `range cells ${previous.day} and ${cell.day} should touch horizontally`,
        ).toBeLessThanOrEqual(1);
        expect(
          cell.buttonLeft - previous.buttonRight,
          `range buttons ${previous.day} and ${cell.day} should touch horizontally`,
        ).toBeLessThanOrEqual(1);
      }

      if (cell.kind === 'between') {
        expectSquareDateButtonGeometry(
          cell,
          geometry.referenceButtonWidth,
          geometry.referenceCellWidth,
          `range day ${cell.day}`,
        );
        expectButtonFill(cell, `range day ${cell.day}`);
        expectNoRadius(cell, `range day ${cell.day}`);
      } else if (cell.kind === 'start') {
        expectSquareDateButtonGeometry(
          cell,
          geometry.referenceButtonWidth,
          geometry.referenceCellWidth,
          `range start ${cell.day}`,
        );
        expectButtonFill(cell, `range start ${cell.day}`);
        expectOutsideLeftRadius(cell, `range start ${cell.day}`);
      } else if (cell.kind === 'end') {
        expectSquareDateButtonGeometry(
          cell,
          geometry.referenceButtonWidth,
          geometry.referenceCellWidth,
          `range end ${cell.day}`,
        );
        expectButtonFill(cell, `range end ${cell.day}`);
        expectOutsideRightRadius(cell, `range end ${cell.day}`);
      } else {
        expectSquareDateButtonGeometry(
          cell,
          geometry.referenceButtonWidth,
          geometry.referenceCellWidth,
          `single-day range ${cell.day}`,
        );
        expectStandaloneRangeCell(cell, `single-day range ${cell.day}`);
      }
    }
  }
}

async function expectStandaloneRangeButton(picker: Locator, day: number): Promise<void> {
  const geometry = await dayButton(picker, day).evaluate((button) => {
    const tableCell = button.closest<HTMLTableCellElement>('td');
    if (!tableCell) throw new Error('date button should be inside a table cell');

    const root = button.closest('hell-date-picker, hell-date-range-picker') ?? button.ownerDocument;
    const referenceButton =
      Array.from(
        root.querySelectorAll<HTMLElement>(
          '[data-slot="grid"] tbody [data-slot="dateButton"]:not([data-range-start]):not([data-range-between]):not([data-range-end])',
        ),
      ).find((candidate) => !candidate.hasAttribute('data-outside-month')) ?? null;
    const referenceCell = referenceButton?.closest<HTMLTableCellElement>('td') ?? null;
    const referenceButtonBox = referenceButton?.getBoundingClientRect();
    const referenceCellBox = referenceCell?.getBoundingClientRect();
    const cellBox = tableCell.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const before = getComputedStyle(tableCell, '::before');
    const buttonStyle = getComputedStyle(button);

    return {
      referenceButtonWidth: referenceButtonBox?.width ?? 0,
      referenceCellWidth: referenceCellBox?.width ?? 0,
      cell: {
        day: button.textContent?.trim() ?? '',
        kind: 'single',
        cellLeft: cellBox.left,
        cellRight: cellBox.right,
        cellTop: cellBox.top,
        cellBottom: cellBox.bottom,
        cellWidth: cellBox.width,
        buttonLeft: buttonBox.left,
        buttonRight: buttonBox.right,
        buttonTop: buttonBox.top,
        buttonBottom: buttonBox.bottom,
        buttonCenter: buttonBox.left + buttonBox.width / 2,
        buttonWidth: buttonBox.width,
        buttonHeight: buttonBox.height,
        cellCenter: cellBox.left + cellBox.width / 2,
        cellHeight: cellBox.height,
        cellPseudoBackgroundColor: before.backgroundColor,
        cellPseudoBackgroundImage: before.backgroundImage,
        buttonBackgroundColor: buttonStyle.backgroundColor,
        radiusTopLeft: parseFloat(buttonStyle.borderTopLeftRadius),
        radiusTopRight: parseFloat(buttonStyle.borderTopRightRadius),
        radiusBottomRight: parseFloat(buttonStyle.borderBottomRightRadius),
        radiusBottomLeft: parseFloat(buttonStyle.borderBottomLeftRadius),
      },
    };
  });

  expect(geometry.referenceButtonWidth).toBeGreaterThan(0);
  expect(geometry.referenceCellWidth).toBeGreaterThan(0);
  expectSquareDateButtonGeometry(
    geometry.cell,
    geometry.referenceButtonWidth,
    geometry.referenceCellWidth,
    `standalone range day ${day}`,
  );
  expectStandaloneRangeCell(geometry.cell, `standalone range day ${day}`);
}

interface RangeCellGeometry {
  readonly day: string;
  readonly kind: string;
  readonly cellLeft: number;
  readonly cellRight: number;
  readonly cellTop: number;
  readonly cellBottom: number;
  readonly cellWidth: number;
  readonly buttonLeft: number;
  readonly buttonRight: number;
  readonly buttonTop: number;
  readonly buttonBottom: number;
  readonly buttonCenter: number;
  readonly buttonWidth: number;
  readonly buttonHeight: number;
  readonly cellCenter: number;
  readonly cellHeight: number;
  readonly cellPseudoBackgroundColor: string;
  readonly cellPseudoBackgroundImage: string;
  readonly buttonBackgroundColor: string;
  readonly radiusTopLeft: number;
  readonly radiusTopRight: number;
  readonly radiusBottomRight: number;
  readonly radiusBottomLeft: number;
}

function expectSquareDateButtonGeometry(
  cell: RangeCellGeometry,
  referenceButtonWidth: number,
  referenceCellWidth: number,
  label: string,
): void {
  expect(
    Math.abs(cell.buttonWidth - referenceButtonWidth),
    `${label} should keep the same button width as a neutral date`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(cell.cellWidth - referenceCellWidth),
    `${label} should not resize its date cell`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(cell.buttonWidth - cell.cellWidth),
    `${label} button should fill its square date cell`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(cell.buttonHeight - cell.buttonWidth),
    `${label} button should be square`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(cell.cellHeight - cell.buttonHeight),
    `${label} cell should not add vertical growth around the square button`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(cell.buttonCenter - cell.cellCenter),
    `${label} button should stay centered in its grid cell`,
  ).toBeLessThanOrEqual(1);
}

function expectButtonFill(cell: RangeCellGeometry, label: string): void {
  expect(
    isTransparentColor(cell.buttonBackgroundColor),
    `${label} should paint selection on the button itself`,
  ).toBe(false);
}

function expectStandaloneRangeCell(cell: RangeCellGeometry, label: string): void {
  expectNoCellRail(cell, label);
  expect(cell.radiusTopLeft, `${label} should keep the top-left corner`).toBeGreaterThan(0);
  expect(cell.radiusTopRight, `${label} should keep the top-right corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomRight, `${label} should keep the bottom-right corner`).toBeGreaterThan(0);
  expect(cell.radiusBottomLeft, `${label} should keep the bottom-left corner`).toBeGreaterThan(0);
}

function expectNoRadius(cell: RangeCellGeometry, label: string): void {
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

function expectNoCellRail(cell: RangeCellGeometry, label: string): void {
  expect(
    !isTransparentColor(cell.cellPseudoBackgroundColor) ||
      cell.cellPseudoBackgroundImage.trim() !== 'none',
    `${label} should not paint a cell pseudo-element rail`,
  ).toBe(false);
}

function isTransparentColor(value: string): boolean {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || /\/\s*0\)?$/.test(value.trim());
}

async function navigateMonths(picker: Locator, delta: number): Promise<void> {
  const direction = delta > 0 ? 'Next month' : 'Previous month';
  for (let index = 0; index < Math.abs(delta); index += 1) {
    await picker.getByRole('button', { name: direction }).click();
  }
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
