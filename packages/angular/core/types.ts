/** Shared control size scale used by sized Hell modules. */
export type HellSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Visual variants supported by `HellButton`. */
export type HellButtonVariant =
  | 'default'
  | 'primary'
  | 'soft'
  | 'ghost'
  | 'link'
  | 'danger'
  | 'success';

/** Visual variants supported by `HellChip`. */
export type HellChipVariant = 'default' | 'primary' | 'success' | 'info' | 'danger' | 'warning';

/** Layout axis shared by orientable Hell modules such as separators and toggle groups. */
export type HellOrientation = 'horizontal' | 'vertical';

/** Structured time value shared by time behaviors and picker compositions. */
export interface HellTimeValue {
  /** Hour of day, from 0 to 23. */
  readonly hour: number;
  /** Minute of hour, from 0 to 59. */
  readonly minute: number;
  /** Second of minute, from 0 to 59. */
  readonly second: number;
}
