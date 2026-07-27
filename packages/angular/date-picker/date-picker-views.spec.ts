import {
  HELL_DATE_PICKER_MONTH_COLUMNS,
  HELL_DATE_PICKER_MONTH_COUNT,
  HELL_DATE_PICKER_YEAR_COLUMNS,
  HELL_DATE_PICKER_YEAR_COUNT,
  hellDatePickerClosestEnabledIndex,
  hellDatePickerMonthSpan,
  hellDatePickerNextEnabledIndex,
  hellDatePickerPanelMove,
  hellDatePickerPanelRows,
  hellDatePickerSpanOutsideBounds,
  hellDatePickerWithYearMonth,
  hellDatePickerYearPageStart,
  hellDatePickerYearSpan,
} from './date-picker-views';

const months = HELL_DATE_PICKER_MONTH_COUNT;
const monthColumns = HELL_DATE_PICKER_MONTH_COLUMNS;
const years = HELL_DATE_PICKER_YEAR_COUNT;
const yearColumns = HELL_DATE_PICKER_YEAR_COLUMNS;

function move(key: string, index: number) {
  return hellDatePickerPanelMove(key, index, months, monthColumns);
}

describe('hellDatePickerPanelMove', () => {
  it('walks the visual grid with the arrow keys', () => {
    expect(move('ArrowRight', 3)).toEqual({ index: 4, pageDelta: 0, step: 1 });
    expect(move('ArrowLeft', 3)).toEqual({ index: 2, pageDelta: 0, step: -1 });
    expect(move('ArrowDown', 3)).toEqual({ index: 6, pageDelta: 0, step: 1 });
    expect(move('ArrowUp', 3)).toEqual({ index: 0, pageDelta: 0, step: -1 });
  });

  it('rolls onto the neighbouring page at the grid edges', () => {
    expect(move('ArrowRight', months - 1)).toEqual({ index: 0, pageDelta: 1, step: 1 });
    expect(move('ArrowLeft', 0)).toEqual({ index: months - 1, pageDelta: -1, step: -1 });
    expect(move('ArrowDown', months - 1)).toEqual({
      index: monthColumns - 1,
      pageDelta: 1,
      step: 1,
    });
    expect(move('ArrowUp', 0)).toEqual({ index: months - monthColumns, pageDelta: -1, step: -1 });
  });

  it('jumps within the page with Home and End, and pages with PageUp and PageDown', () => {
    expect(move('Home', 7)).toEqual({ index: 0, pageDelta: 0, step: 1 });
    expect(move('End', 7)).toEqual({ index: months - 1, pageDelta: 0, step: -1 });
    expect(move('PageUp', 7)).toEqual({ index: 7, pageDelta: -1, step: -1 });
    expect(move('PageDown', 7)).toEqual({ index: 7, pageDelta: 1, step: 1 });
  });

  it('uses the same vocabulary on the wider year grid', () => {
    expect(hellDatePickerPanelMove('ArrowDown', 20, years, yearColumns)).toEqual({
      index: 0,
      pageDelta: 1,
      step: 1,
    });
    expect(hellDatePickerPanelMove('End', 0, years, yearColumns)).toEqual({
      index: years - 1,
      pageDelta: 0,
      step: -1,
    });
  });

  it('ignores keys the panel does not own', () => {
    expect(move('Enter', 3)).toBeNull();
    expect(move('a', 3)).toBeNull();
    expect(move('Escape', 3)).toBeNull();
  });
});

describe('panel option scanning', () => {
  const disabled = [true, true, false, true, false, true];

  it('finds the next selectable option in the requested direction', () => {
    expect(hellDatePickerNextEnabledIndex(disabled, 0, 1)).toBe(2);
    expect(hellDatePickerNextEnabledIndex(disabled, 3, -1)).toBe(2);
    expect(hellDatePickerNextEnabledIndex(disabled, 5, 1)).toBeNull();
    expect(hellDatePickerNextEnabledIndex(disabled, 1, -1)).toBeNull();
  });

  it('searches forwards first and then backwards for the closest option', () => {
    expect(hellDatePickerClosestEnabledIndex(disabled, 0)).toBe(2);
    expect(hellDatePickerClosestEnabledIndex(disabled, 5)).toBe(4);
    expect(hellDatePickerClosestEnabledIndex([true, true], 0)).toBeNull();
  });
});

describe('panel geometry and bounds', () => {
  it('splits options into fixed-column rows', () => {
    expect(hellDatePickerPanelRows([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    expect(hellDatePickerPanelRows([], 3)).toEqual([]);
  });

  it('centres the year page on the year in view and keeps pages contiguous', () => {
    expect(hellDatePickerYearPageStart(2026)).toBe(2015);
    expect(hellDatePickerYearPageStart(2026) + years - 1).toBe(2038);
    expect(hellDatePickerYearPageStart(2026) + years).toBe(2039);
  });

  it('spans whole months and years inclusively', () => {
    const february = hellDatePickerMonthSpan(2024, 1);
    expect(february.start).toEqual(new Date(2024, 1, 1, 0, 0, 0, 0));
    expect(february.end).toEqual(new Date(2024, 1, 29, 23, 59, 59, 999));

    const year = hellDatePickerYearSpan(2026);
    expect(year.start).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(year.end).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });

  it('reports only spans that fall entirely outside the bounds', () => {
    const { start, end } = hellDatePickerMonthSpan(2026, 3);
    expect(hellDatePickerSpanOutsideBounds(start, end, new Date(2026, 4, 1), undefined)).toBe(true);
    expect(hellDatePickerSpanOutsideBounds(start, end, undefined, new Date(2026, 2, 31))).toBe(true);
    expect(hellDatePickerSpanOutsideBounds(start, end, new Date(2026, 3, 15), undefined)).toBe(
      false,
    );
    expect(hellDatePickerSpanOutsideBounds(start, end, undefined, undefined)).toBe(false);
  });

  it('clamps the day of month when jumping into a shorter month', () => {
    const source = new Date(2026, 0, 31, 9, 30, 15, 250);

    expect(hellDatePickerWithYearMonth(source, 2026, 1)).toEqual(
      new Date(2026, 1, 28, 9, 30, 15, 250),
    );
    expect(hellDatePickerWithYearMonth(source, 2031, 0)).toEqual(
      new Date(2031, 0, 31, 9, 30, 15, 250),
    );
  });
});
