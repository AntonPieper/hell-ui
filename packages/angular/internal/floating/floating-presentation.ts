/**
 * Shared floating-panel presentation for Hell's elevated overlay surfaces.
 *
 * Popover, menu, select, and combobox dropdowns consume `HELL_FLOATING_SURFACE`
 * (the full elevated-panel look) and `HELL_FLOATING_POP_IN` verbatim; popover
 * and the select dropdown also share `HELL_FLOATING_Z_POPOVER`. Menu keeps its
 * `--hell-z-menu` variable local. Every per-module recipe stays local so
 * positioning mode, sizes, padding, flip origins, and scroll behavior can
 * diverge while the surface treatment cannot drift.
 *
 * Two surfaces intentionally do NOT compose these atoms: the tooltip is an
 * inverse mini-surface (dark fill, tiny radius, `shadow-hell-md`, no border) and
 * the dialog is a modal card (`rounded-hell-lg`, overlay shadow, `hell-dialog-in`).
 * Both are visually distinct from the elevated dropdown look and stay local.
 */

/**
 * The complete elevated floating-panel surface: rounded corners, elevated
 * background, large shadow, no focus outline, and a solid hairline border.
 * Consumed verbatim by popover, menu, select, and combobox dropdowns.
 */
export const HELL_FLOATING_SURFACE =
  'rounded-hell-md bg-hell-surface-elevated shadow-hell-lg outline-none border border-solid border-hell-border';

/**
 * Pop-in entrance animation shared by popover, menu, select, and combobox
 * panels.
 */
export const HELL_FLOATING_POP_IN =
  'animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]';

/**
 * Default popover stacking level (`--hell-z-popover`, fallback `60`). Shared by
 * the popover and the select dropdown. The menu (`--hell-z-menu`) builds its
 * own z class from a different variable.
 */
export const HELL_FLOATING_Z_POPOVER = 'z-[var(--hell-z-popover,60)]';
