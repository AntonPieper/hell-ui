/**
 * Shared floating-panel presentation for Hell's elevated overlay surfaces.
 *
 * Popover, menu, select, and combobox dropdowns consume `HELL_FLOATING_SURFACE`
 * (the full elevated-panel look) and `HELL_FLOATING_POP_IN` verbatim; popover
 * and the select dropdown also share `HELL_FLOATING_Z_POPOVER`. The flyout is
 * elevated too but deliberately differs, so it composes the border-agnostic
 * `HELL_FLOATING_SURFACE_SHELL` and keeps its own hairline border, `hell-flyout-in`
 * animation, and higher z fallback local. Menu keeps its `--hell-z-menu` variable
 * local for the same reason. Every per-module recipe stays local so positioning
 * mode, sizes, padding, flip origins, and scroll behavior can diverge while the
 * surface treatment cannot drift.
 *
 * Two surfaces intentionally do NOT compose these atoms: the tooltip is an
 * inverse mini-surface (dark fill, tiny radius, `shadow-hell-md`, no border) and
 * the dialog is a modal card (`rounded-hell-lg`, overlay shadow, `hell-dialog-in`).
 * Both are visually distinct from the elevated dropdown look and stay local.
 */

/**
 * Border-agnostic core of the elevated floating surface: rounded corners,
 * elevated background, large shadow, and no focus outline. Shared by every
 * floating panel — including the flyout, which supplies its own border.
 */
export const HELL_FLOATING_SURFACE_SHELL =
  'rounded-hell-md bg-hell-surface-elevated shadow-hell-lg outline-none';

/**
 * The complete elevated floating-panel surface: the shell plus a solid hairline
 * border. Consumed verbatim by popover, menu, select, and combobox dropdowns.
 */
export const HELL_FLOATING_SURFACE = `${HELL_FLOATING_SURFACE_SHELL} border border-solid border-hell-border`;

/**
 * Pop-in entrance animation shared by popover, menu, select, and combobox
 * panels. The flyout uses a distinct `hell-flyout-in` keyframe of its own.
 */
export const HELL_FLOATING_POP_IN =
  'animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]';

/**
 * Default popover stacking level (`--hell-z-popover`, fallback `60`). Shared by
 * the popover and the select dropdown. The menu (`--hell-z-menu`) and flyout
 * (fallback `1000`) build their own z classes from different variables.
 */
export const HELL_FLOATING_Z_POPOVER = 'z-[var(--hell-z-popover,60)]';
