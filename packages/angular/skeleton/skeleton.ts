import {
  Directive, inject, input } from '@angular/core';
import type { HellSize } from '@hell-ui/angular/core';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellSkeletonPart = 'root';
export type HellSkeletonUi = HellUi<HellSkeletonPart>;

export type HellSpinnerPart = 'root';
export type HellSpinnerUi = HellUi<HellSpinnerPart>;

const HELL_SKELETON_RECIPE = {
  root: 'block h-[var(--_hell-skeleton-height,14px)] min-h-hell-3 w-[var(--_hell-skeleton-width,100%)] animate-[hell-shimmer_1.6s_linear_infinite] rounded-sm bg-hell-surface-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--color-hell-surface)_70%,transparent)_50%,transparent_100%)] bg-[length:200%_100%] bg-no-repeat data-[shape=circle]:rounded-full data-[shape=rect]:rounded-hell-md',
} satisfies HellRecipe<HellSkeletonPart>;

const HELL_SPINNER_RECIPE = {
  root: 'inline-block flex-none text-current leading-[0] [--_hell-spinner-track:color-mix(in_oklab,currentColor_18%,transparent)] data-[size=xs]:text-[12px] data-[size=sm]:text-[16px] data-[size=md]:text-[20px] data-[size=lg]:text-[28px] data-[size=xl]:text-[40px]',
} satisfies HellRecipe<HellSpinnerPart>;

/** Loading shape placeholder. Pure visual — no semantics. */
@Directive({
  selector: '[hellSkeleton]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-shape]': 'shape()',
    '[style.--_hell-skeleton-width]': 'width()',
    '[style.--_hell-skeleton-height]': 'height()',
    'aria-hidden': 'true',
  },
})
export class HellSkeleton extends HellPartStyleable<HellSkeletonPart> {
  protected readonly recipe = HELL_SKELETON_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly width = input<string>('100%');
  readonly height = input<string>('14px');
  /** Built-in shapes. `text` (default), `circle`, `rect`. */
  readonly shape = input<'text' | 'circle' | 'rect'>('text');
}

export type HellSpinnerVariant = 'ring' | 'dots' | 'bars' | 'pulse';

/**
 * Indeterminate loading indicator. Inherits color from `currentColor` and
 * scales with `size` (or any `font-size`). Variants: ring, dots, bars, pulse.
 */
@Directive({
  selector: '[hellSpinner]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-label]': 'ariaLabel() ?? labels.loading',
    role: 'status',
  },
})
export class HellSpinner extends HellPartStyleable<HellSpinnerPart> {
  protected readonly recipe = HELL_SPINNER_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly variant = input<HellSpinnerVariant>('ring');
  readonly size = input<HellSize>('md');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly labels = inject<HellLabels>(HELL_LABELS);
}
