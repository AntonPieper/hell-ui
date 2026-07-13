import type {
  HellOption,
  HellOptionCompareWith,
  HellOptionDisplayWith,
} from '@hell-ui/angular/core';

/** Display text for one option row: the `displayWith` override, else its label. */
export function hellOptionRowLabel<T>(
  option: HellOption<T>,
  displayWith: HellOptionDisplayWith<T> | null,
): string {
  return displayWith?.(option.value) ?? option.label;
}

/**
 * Display text for a picked value: `displayWith`, else the matching option's
 * label, else the value's string form (a selected value may be missing from
 * `options`, e.g. an initial form value outside the offered list).
 */
export function hellPickedValueLabel<T>(
  value: T,
  options: readonly HellOption<T>[],
  displayWith: HellOptionDisplayWith<T> | null,
  compareWith: HellOptionCompareWith<T>,
): string {
  const override = displayWith;
  if (override) return override(value);
  return options.find((option) => compareWith(option.value, value))?.label ?? String(value);
}
