/**
 * Pure navigation maths for the date picker's month and year drill-down
 * panels. Kept free of Angular and DOM so the grid geometry, paging, and
 * keyboard vocabulary are unit-testable on their own.
 */

/** Month options rendered on one month panel page (one calendar year). */
export const HELL_DATE_PICKER_MONTH_COUNT = 12;

/** Columns in the month panel grid. */
export const HELL_DATE_PICKER_MONTH_COLUMNS = 3;

/** Year options rendered on one year panel page. */
export const HELL_DATE_PICKER_YEAR_COUNT = 24;

/** Columns in the year panel grid. */
export const HELL_DATE_PICKER_YEAR_COLUMNS = 4;

/**
 * First year of the page that shows `year`. Pages are centred on the year in
 * view so the nearby years a user is most likely to want are one click away,
 * and consecutive pages stay contiguous when stepped by the page size.
 */
export function hellDatePickerYearPageStart(year: number): number {
  return year - (HELL_DATE_PICKER_YEAR_COUNT / 2 - 1);
}

/**
 * Resolves one panel keystroke into a target option index, a page delta, and
 * the direction to keep searching in when the target option is unavailable.
 * Arrow keys move within the visual grid and roll onto the neighbouring page
 * at the edges; Home/End jump within the page; PageUp/PageDown page directly.
 * Returns `null` for keys the panel does not own.
 */
export function hellDatePickerPanelMove(
  key: string,
  index: number,
  count: number,
  columns: number,
): { readonly index: number; readonly pageDelta: number; readonly step: 1 | -1 } | null {
  const move = panelTarget(key, index, count, columns);
  if (!move) return null;

  let target = move.index;
  let pageDelta = move.pageDelta;

  while (target < 0) {
    target += count;
    pageDelta -= 1;
  }
  while (target >= count) {
    target -= count;
    pageDelta += 1;
  }

  return { index: target, pageDelta, step: move.step };
}

function panelTarget(
  key: string,
  index: number,
  count: number,
  columns: number,
): { readonly index: number; readonly pageDelta: number; readonly step: 1 | -1 } | null {
  switch (key) {
    case 'ArrowLeft':
      return { index: index - 1, pageDelta: 0, step: -1 };
    case 'ArrowRight':
      return { index: index + 1, pageDelta: 0, step: 1 };
    case 'ArrowUp':
      return { index: index - columns, pageDelta: 0, step: -1 };
    case 'ArrowDown':
      return { index: index + columns, pageDelta: 0, step: 1 };
    case 'Home':
      return { index: 0, pageDelta: 0, step: 1 };
    case 'End':
      return { index: count - 1, pageDelta: 0, step: -1 };
    case 'PageUp':
      return { index, pageDelta: -1, step: -1 };
    case 'PageDown':
      return { index, pageDelta: 1, step: 1 };
    default:
      return null;
  }
}

/**
 * First selectable index at or after `from`, walking in `step` direction.
 * Returns `null` when the page offers no selectable option that way, which
 * lets the caller leave the roving tab stop where it was.
 */
export function hellDatePickerNextEnabledIndex(
  disabled: readonly boolean[],
  from: number,
  step: 1 | -1,
): number | null {
  for (let index = from; index >= 0 && index < disabled.length; index += step) {
    if (!disabled[index]) return index;
  }
  return null;
}

/**
 * First selectable index searching outwards from `from`, preferring later
 * options. Used when a panel opens on a month or year that bounds exclude.
 */
export function hellDatePickerClosestEnabledIndex(
  disabled: readonly boolean[],
  from: number,
): number | null {
  const forward = hellDatePickerNextEnabledIndex(disabled, from, 1);
  if (forward !== null) return forward;
  return hellDatePickerNextEnabledIndex(disabled, from, -1);
}

/** Splits a flat option list into the panel's fixed-column grid rows. */
export function hellDatePickerPanelRows<T>(options: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < options.length; index += columns) {
    rows.push(options.slice(index, index + columns));
  }
  return rows;
}

/** Whether a whole calendar span falls outside the picker's `min`/`max`. */
export function hellDatePickerSpanOutsideBounds(
  start: Date,
  end: Date,
  min: Date | undefined,
  max: Date | undefined,
): boolean {
  return Boolean((min && end < min) || (max && start > max));
}

/** Inclusive instant range covered by one calendar month. */
export function hellDatePickerMonthSpan(
  year: number,
  month: number,
): { readonly start: Date; readonly end: Date } {
  return {
    start: new Date(year, month, 1, 0, 0, 0, 0),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

/** Inclusive instant range covered by one calendar year. */
export function hellDatePickerYearSpan(year: number): {
  readonly start: Date;
  readonly end: Date;
} {
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

/**
 * Moves a date onto another year and month, clamping the day of month so a
 * jump from the 31st into a shorter month stays inside that month.
 */
export function hellDatePickerWithYearMonth(date: Date, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(
    year,
    month,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}
