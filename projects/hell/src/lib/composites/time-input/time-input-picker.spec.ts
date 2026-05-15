import {
  hellTimeInputNextPickerCellIndex,
  hellTimeInputPickerColumns,
  type HellTimeInputPickerUnit,
} from './time-input-picker';

describe('time input picker navigation', () => {
  it('uses 6 columns for hours and 4 columns for minutes/seconds', () => {
    expect(hellTimeInputPickerColumns('hour')).toBe(6);
    expect(hellTimeInputPickerColumns('minute')).toBe(4);
    expect(hellTimeInputPickerColumns('second')).toBe(4);
  });

  it('maps arrow and Home/End keys with wrapping', () => {
    expect(next('hour', 'ArrowRight', 0, 24)).toBe(1);
    expect(next('hour', 'ArrowLeft', 0, 24)).toBe(23);
    expect(next('hour', 'ArrowDown', 1, 24)).toBe(7);
    expect(next('hour', 'ArrowUp', 7, 24)).toBe(1);
    expect(next('hour', 'Home', 19, 24)).toBe(0);
    expect(next('hour', 'End', 0, 24)).toBe(23);
    expect(next('minute', 'ArrowDown', 1, 60)).toBe(5);
    expect(next('minute', 'ArrowUp', 1, 60)).toBe(57);
    expect(next('minute', 'Home', 15, 60)).toBe(0);
    expect(next('minute', 'End', 15, 60)).toBe(59);
  });

  it('clamps out-of-range source indexes before navigation', () => {
    expect(next('minute', 'ArrowRight', -1, 60)).toBe(1);
    expect(next('minute', 'ArrowLeft', 61, 60)).toBe(58);
  });

  it('returns null for unsupported keys and empty grids', () => {
    expect(next('hour', 'PageDown', 0, 24)).toBeNull();
    expect(next('hour', 'x', 0, 0)).toBeNull();
  });
});

function next(
  unit: HellTimeInputPickerUnit,
  key: string,
  index: number,
  count: number,
): number | null {
  return hellTimeInputNextPickerCellIndex(key, index, unit, count);
}
