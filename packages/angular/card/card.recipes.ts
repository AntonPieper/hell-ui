import type { HellRecipe } from 'hell-ui/internal/core';

/**
 * Package-internal Part Recipes for the card entry point. The entrypoint
 * stylesheet `@source`s this module so consumer Tailwind builds generate the
 * recipe classes; the public consumer styling contract is the `ui` Part
 * Style Map, not these defaults.
 */

/** Default part recipe for `hellCard`; pinned by the card recipe snapshot. */
export const HELL_CARD_RECIPE: HellRecipe<'root'> = {
  root: 'flex min-w-0 max-w-full flex-col overflow-clip rounded-hell-lg border border-solid border-hell-border bg-hell-surface-elevated shadow-hell-xs data-[elevation=0]:shadow-none data-[elevation=2]:shadow-hell-md data-[elevation=3]:shadow-hell-lg',
};

/** Default part recipe for `hellCardHeader`; pinned by the card recipe snapshot. */
export const HELL_CARD_HEADER_RECIPE: HellRecipe<'root'> = {
  root: 'flex items-center justify-between gap-hell-4 border-b border-hell-border px-hell-6 py-hell-5 text-sm font-semibold text-hell-foreground',
};

/** Default part recipe for `hellCardBody`; pinned by the card recipe snapshot. */
export const HELL_CARD_BODY_RECIPE: HellRecipe<'root'> = {
  root: 'min-h-0 min-w-0 flex-auto p-hell-6',
};

/** Default part recipe for `hellCardFooter`; pinned by the card recipe snapshot. */
export const HELL_CARD_FOOTER_RECIPE: HellRecipe<'root'> = {
  root: 'flex justify-end gap-hell-3 border-t border-hell-border px-hell-6 py-hell-4',
};
