import type { HellRecipe } from '@hell-ui/angular/core';

/**
 * Shared option-surface presentation for Hell's list modules.
 *
 * The select and combobox option rows consume `hellOptionSurfaceRecipe()`
 * whole; the listbox recomposes the same atoms with its own layout and
 * native-semantics mirrors. Menu items deliberately stay local (full-bleed
 * rows with indicator gutters and no selection surface); omnibar items
 * compose the metrics and selected-state atoms with their own button-host
 * specifics.
 */

/** Box metrics and typography shared by every option row. */
export const HELL_OPTION_SURFACE_METRICS =
  'cursor-pointer rounded-hell-sm bg-transparent px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*1.5)] text-[13px] text-hell-foreground outline-none';

/** Active/selected state treatment shared by selection surfaces. */
export const HELL_OPTION_SURFACE_SELECTED_STATES =
  'data-active:bg-hell-surface-muted data-selected:bg-hell-primary-soft data-selected:font-medium data-selected:text-hell-primary-soft-foreground [&[data-selected][data-active]]:bg-[color-mix(in_oklab,var(--color-hell-primary)_18%,var(--color-hell-surface-muted))]';

/** Disabled treatment for form-control option rows (select, combobox). */
export const HELL_OPTION_SURFACE_DISABLED =
  'data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted';

/** @internal Complete recipe for a flex option row (select, combobox). */
export function hellOptionSurfaceRecipe(): HellRecipe<'root'> {
  return {
    root: `flex items-center gap-hell-3 ${HELL_OPTION_SURFACE_METRICS} ${HELL_OPTION_SURFACE_SELECTED_STATES} ${HELL_OPTION_SURFACE_DISABLED}`,
  };
}
