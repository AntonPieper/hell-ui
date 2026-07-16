export type HellTimePickerUnit = 'hour' | 'minute' | 'second';

export function hellTimePickerMaxValue(unit: HellTimePickerUnit): 23 | 59 {
  return unit === 'hour' ? 23 : 59;
}

export function hellTimePickerNextValue(
  key: string,
  currentValue: number,
  unit: HellTimePickerUnit,
): number | null {
  const max = hellTimePickerMaxValue(unit);
  const value = clamp(Math.trunc(currentValue), 0, max);
  const largeStep = 5;

  if (key === 'ArrowUp' || key === 'ArrowRight') return clamp(value + 1, 0, max);
  if (key === 'ArrowDown' || key === 'ArrowLeft') return clamp(value - 1, 0, max);
  if (key === 'PageUp') return clamp(value + largeStep, 0, max);
  if (key === 'PageDown') return clamp(value - largeStep, 0, max);
  if (key === 'Home') return 0;
  if (key === 'End') return max;

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
