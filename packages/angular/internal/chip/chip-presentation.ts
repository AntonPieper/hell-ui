import { type HellRecipe, type HellSize } from '@hell-ui/angular/core';

type HellChipPresentationPart = 'root';

const HELL_CHIP_BASE_RECIPE =
  'inline-flex max-w-full items-center gap-hell-1 whitespace-nowrap rounded-hell-pill border border-transparent bg-[var(--_hell-chip-bg)] font-medium leading-tight text-[var(--_hell-chip-fg)] no-underline transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] outline-none [--_hell-chip-bg:var(--color-hell-surface-muted)] [--_hell-chip-fg:var(--color-hell-foreground-muted)] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 data-[interactive]:cursor-pointer data-[interactive]:hover:brightness-[0.97] data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[variant=primary]:[--_hell-chip-bg:var(--color-hell-primary-soft)] data-[variant=primary]:[--_hell-chip-fg:var(--color-hell-primary)] data-[variant=success]:[--_hell-chip-bg:var(--color-hell-success-soft)] data-[variant=success]:[--_hell-chip-fg:var(--color-hell-success-strong)] data-[variant=info]:[--_hell-chip-bg:var(--color-hell-info-soft)] data-[variant=info]:[--_hell-chip-fg:var(--color-hell-info-strong)] data-[variant=danger]:[--_hell-chip-bg:var(--color-hell-danger-soft)] data-[variant=danger]:[--_hell-chip-fg:var(--color-hell-danger-strong)] data-[variant=warning]:[--_hell-chip-bg:var(--color-hell-warning-soft)] data-[variant=warning]:[--_hell-chip-fg:var(--color-hell-warning-strong)]';

const HELL_CHIP_SIZE_RECIPE: Record<HellSize, string> = {
  xs: 'h-[18px] gap-hell-1 px-hell-2 text-[11px]',
  sm: 'h-[22px] gap-hell-1 px-hell-2 text-[12px]',
  md: 'h-[26px] gap-hell-1 px-hell-3 text-[13px]',
  lg: 'h-[30px] gap-hell-2 px-hell-3 text-sm',
  xl: 'h-[34px] gap-hell-2 px-hell-4 text-[15px]',
};

const HELL_CHIP_REMOVE_RECIPE = {
  root: 'inline-flex aspect-square h-[1.15em] shrink-0 cursor-pointer items-center justify-center rounded-hell-pill border-0 bg-transparent p-0 text-current opacity-70 transition-[background-color,opacity] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] outline-none hover:bg-hell-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:bg-transparent',
} satisfies HellRecipe<HellChipPresentationPart>;

/** @internal Shared recipe for public and composed chip surfaces. */
export function hellChipPresentationRecipe(
  size: HellSize,
): HellRecipe<HellChipPresentationPart> {
  return {
    root: `${HELL_CHIP_BASE_RECIPE} ${HELL_CHIP_SIZE_RECIPE[size]}`,
  };
}

/** @internal Shared recipe for public and composed chip remove buttons. */
export function hellChipRemovePresentationRecipe(): HellRecipe<HellChipPresentationPart> {
  return HELL_CHIP_REMOVE_RECIPE;
}
