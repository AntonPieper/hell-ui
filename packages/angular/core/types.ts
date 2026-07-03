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
