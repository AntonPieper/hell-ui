export type HellTimeInputPickerUnit = 'hour' | 'minute' | 'second';

export function hellTimeInputPickerColumns(unit: HellTimeInputPickerUnit): 4 | 6 {
  return unit === 'hour' ? 6 : 4;
}

export function hellTimeInputNextPickerCellIndex(
  key: string,
  currentIndex: number,
  unit: HellTimeInputPickerUnit,
  count: number,
): number | null {
  if (!count) return null;

  const index = Math.min(Math.max(currentIndex, 0), count - 1);
  const columns = hellTimeInputPickerColumns(unit);

  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowUp') return (index - columns + count) % count;
  if (key === 'ArrowDown') return (index + columns) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;

  return null;
}
