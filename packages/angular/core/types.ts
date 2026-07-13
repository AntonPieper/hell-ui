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

/** Visual variants supported by `HellTag`. */
export type HellTagVariant = 'default' | 'primary' | 'success' | 'info' | 'danger' | 'warning';

/** Layout axis shared by orientable Hell modules such as separators and toggle groups. */
export type HellOrientation = 'horizontal' | 'vertical';

/**
 * One pickable option shared by Hell's data-driven list composites (select,
 * combobox, menu). Composites render `label` for display, emit `value` as the
 * form value, and skip `disabled` options during selection.
 */
export interface HellOption<T = string> {
  /** Form value the option contributes when picked. */
  readonly value: T;
  /** Display text; composites render it unless `displayWith` overrides. */
  readonly label: string;
  /** Disabled options render but cannot be picked. */
  readonly disabled?: boolean;
}

/** Maps a picked value to display text, overriding option labels. */
export type HellOptionDisplayWith<T = unknown> = (value: T) => string;

/** Compares two option values for identity when values are not reference-equal. */
export type HellOptionCompareWith<T = unknown> = (a: T, b: T) => boolean;
