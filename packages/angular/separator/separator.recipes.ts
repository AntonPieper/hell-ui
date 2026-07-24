import type { HellRecipe } from 'hell-ui/internal/core';

/**
 * Package-internal Part Recipe for the separator entry point. The entrypoint
 * stylesheet `@source`s this module so consumer Tailwind builds generate the
 * recipe classes; the public consumer styling contract is the `ui` Part
 * Style Map, not these defaults.
 */

/** Default part recipe for `hellSeparator`; pinned by the separator recipe snapshot. */
export const HELL_SEPARATOR_RECIPE: HellRecipe<'root'> = {
  root: 'block shrink-0 border-0 bg-hell-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch data-[spacing=none]:m-0 data-[orientation=horizontal]:data-[spacing=xs]:my-hell-1 data-[orientation=horizontal]:data-[spacing=sm]:my-hell-2 data-[orientation=horizontal]:data-[spacing=md]:my-hell-4 data-[orientation=horizontal]:data-[spacing=lg]:my-hell-6 data-[orientation=horizontal]:data-[spacing=xl]:my-hell-8 data-[orientation=vertical]:data-[spacing=xs]:mx-hell-1 data-[orientation=vertical]:data-[spacing=sm]:mx-hell-2 data-[orientation=vertical]:data-[spacing=md]:mx-hell-4 data-[orientation=vertical]:data-[spacing=lg]:mx-hell-6 data-[orientation=vertical]:data-[spacing=xl]:mx-hell-8',
};
