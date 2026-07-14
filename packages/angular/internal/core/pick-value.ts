/** Single-pick value shape: the picked value, or `null` when nothing is picked. */
export type HellPickSingleValue<T = unknown> = T | null;

/** Multi-pick value shape: the picked values in selection order. */
export type HellPickMultipleValue<T = unknown> = readonly T[];

/**
 * Value shape shared by Hell's option-driven pickers (select, combobox):
 * `T | null` in single mode, `readonly T[]` in multiple mode.
 */
export type HellPickValue<T = unknown> = HellPickSingleValue<T> | HellPickMultipleValue<T>;
