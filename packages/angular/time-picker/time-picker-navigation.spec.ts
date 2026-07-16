import {
  hellTimePickerMaxValue,
  hellTimePickerNextValue,
  type HellTimePickerUnit,
} from './time-picker-navigation';

describe('time picker navigation', () => {
  it('uses bounded hour/minute/second spinbutton ranges', () => {
    expect(hellTimePickerMaxValue('hour')).toBe(23);
    expect(hellTimePickerMaxValue('minute')).toBe(59);
    expect(hellTimePickerMaxValue('second')).toBe(59);
  });

  it('maps arrow, PageUp/PageDown, and Home/End keys without wrapping', () => {
    expect(next('hour', 'ArrowUp', 14)).toBe(15);
    expect(next('hour', 'ArrowRight', 14)).toBe(15);
    expect(next('hour', 'ArrowDown', 14)).toBe(13);
    expect(next('hour', 'ArrowLeft', 14)).toBe(13);
    expect(next('hour', 'PageUp', 14)).toBe(19);
    expect(next('hour', 'PageDown', 14)).toBe(9);
    expect(next('hour', 'Home', 19)).toBe(0);
    expect(next('hour', 'End', 0)).toBe(23);

    expect(next('minute', 'ArrowUp', 30)).toBe(31);
    expect(next('minute', 'ArrowDown', 30)).toBe(29);
    expect(next('minute', 'PageUp', 30)).toBe(35);
    expect(next('minute', 'PageDown', 30)).toBe(25);
    expect(next('minute', 'Home', 15)).toBe(0);
    expect(next('minute', 'End', 15)).toBe(59);
  });

  it('clamps source and target values to the unit range', () => {
    expect(next('minute', 'ArrowUp', -1)).toBe(1);
    expect(next('minute', 'ArrowDown', 61)).toBe(58);
    expect(next('hour', 'PageUp', 22)).toBe(23);
    expect(next('hour', 'PageDown', 2)).toBe(0);
  });

  it('returns null for unsupported keys', () => {
    expect(next('hour', 'x', 0)).toBeNull();
  });
});

function next(unit: HellTimePickerUnit, key: string, value: number): number | null {
  return hellTimePickerNextValue(key, value, unit);
}
