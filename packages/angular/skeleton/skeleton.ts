import {
  Directive, inject, input } from '@angular/core';
import type { HellSize } from '@hell-ui/angular/core';
import { hellCreateLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import type { InjectionToken, Provider } from '@angular/core';

/** Built-in accessibility labels owned by the skeleton entry point. */
export interface HellSkeletonLabels {
  readonly loading: string;
}

const HELL_SKELETON_LABELS_CONTRACT = hellCreateLabels<HellSkeletonLabels>('HELL_SKELETON_LABELS', {
  loading: 'Loading',
});

/** Injection token resolving to the effective skeleton labels. */
export const HELL_SKELETON_LABELS: InjectionToken<HellSkeletonLabels> = HELL_SKELETON_LABELS_CONTRACT.token;

/** Override any subset of the skeleton labels for an injector scope. */
export function provideHellSkeletonLabels(overrides: Partial<HellSkeletonLabels>): Provider {
  return HELL_SKELETON_LABELS_CONTRACT.provide(overrides);
}

/** Public parts of the HellSkeleton module, styleable through its Part Style Map. */
export type HellSkeletonPart = 'root';
/** Part Style Map accepted by the HellSkeleton `ui` input. */
export type HellSkeletonUi = HellUi<HellSkeletonPart>;

/** Public parts of the HellSpinner module, styleable through its Part Style Map. */
export type HellSpinnerPart = 'root';
/** Part Style Map accepted by the HellSpinner `ui` input. */
export type HellSpinnerUi = HellUi<HellSpinnerPart>;

const HELL_SKELETON_RECIPE = {
  root: 'block animate-[hell-shimmer_1.6s_linear_infinite] rounded-sm bg-hell-surface-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--color-hell-surface)_70%,transparent)_50%,transparent_100%)] bg-[length:200%_100%] bg-no-repeat data-[shape=circle]:rounded-full data-[shape=rect]:rounded-hell-md',
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
export class HellSkeleton {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSkeletonPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSkeletonPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SKELETON_RECIPE,
  });

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
export class HellSpinner {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSpinnerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSpinnerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SPINNER_RECIPE,
  });

  readonly variant = input<HellSpinnerVariant>('ring');
  readonly size = input<HellSize>('md');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly labels = inject(HELL_SKELETON_LABELS);
}
