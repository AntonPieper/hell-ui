import type { HellRecipe } from 'hell-ui/core';

import type { HellPageHeaderPart } from './page-header';

/**
 * Shipped recipe module for the page-header Composite.
 *
 * This file is the entry point's only Tailwind scan source: the entrypoint
 * stylesheet registers it through `@source "./page-header.recipes.ts"`, and the
 * package ships it (ng-package assets + package.json files) instead of the
 * component implementation. Every Tailwind class the composite renders — Part
 * Recipes and private structural wrappers alike — must live in this file, or
 * consumer Tailwind builds will not generate it.
 *
 * The type-only import from the component module is erased at compile time,
 * so the runtime dependency stays one-directional: component → recipes.
 */

/** Default Part Recipe of the `hell-page-header-back` affordance. */
export const HELL_PAGE_HEADER_BACK_RECIPE = {
  root: 'inline-flex flex-none items-center',
} satisfies HellRecipe<'root'>;

/** Default Part Recipe of `hell-page-header`. */
export const HELL_PAGE_HEADER_RECIPE = {
  root: 'flex w-full min-w-0 flex-col gap-hell-3',
  leading: 'flex min-w-0 flex-wrap items-center gap-hell-3',
  titleGroup: 'flex min-w-0 flex-col gap-hell-1 sm:flex-1',
  title: 'm-0 text-xl font-semibold leading-tight text-hell-foreground',
  meta: 'flex flex-wrap items-center gap-hell-2',
  description: 'm-0 max-w-prose text-sm text-hell-foreground-muted',
  // The projected toolbar is `w-full` and measures its own available width to
  // decide overflow, so the slot must hand it a width that does not depend on
  // its (possibly collapsed) content. `sm:flex-1` grows the slot from a zero
  // basis to a share of the row, giving a stable available width; a
  // content-sized slot (`flex-none`/`auto`) would deadlock a toolbar that
  // starts collapsed-to-pinned on first paint. `justify-end` keeps the actions
  // trailing.
  toolbar: 'flex min-w-0 items-center sm:flex-1 sm:justify-end',
} satisfies HellRecipe<HellPageHeaderPart>;

/**
 * Structural classes of the page header's private row wrappers. The wrappers
 * are layout scaffolding, not Public Parts, so they stay outside the Part
 * Style Map — but their classes must live in this shipped module so consumer
 * Tailwind builds generate them.
 */
export const HELL_PAGE_HEADER_LAYOUT_CLASSES: Readonly<Record<'body' | 'titleRow', string>> = {
  /** Row that lays out the title group against the trailing toolbar. */
  body: 'flex min-w-0 flex-col gap-hell-3 sm:flex-row sm:items-start sm:justify-between',
  /** Row that lays out the heading beside its meta badges. */
  titleRow: 'flex min-w-0 flex-wrap items-center gap-hell-3',
};
