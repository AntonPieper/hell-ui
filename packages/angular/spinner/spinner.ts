import { Directive, inject, input } from '@angular/core';
import type { HellSize } from 'hell-ui/core';
import { hellCreateLabels, type HellLabels } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from 'hell-ui/core';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the spinner entry point. */
export interface HellSpinnerLabels {
  /** Accessible label announced while `hellSpinner` is loading. */
  readonly loading: string;
}

/** Injection token resolving to the effective spinner labels. */
export const HELL_SPINNER_LABELS: InjectionToken<HellLabels<HellSpinnerLabels>> = hellCreateLabels<HellSpinnerLabels>('HELL_SPINNER_LABELS', {
  loading: 'Loading',
});

const HELL_SPINNER_RECIPE = {
  root: 'inline-block flex-none text-current leading-[0] [--_hell-spinner-track:color-mix(in_oklab,currentColor_18%,transparent)] data-[size=xs]:text-[12px] data-[size=sm]:text-[16px] data-[size=md]:text-[20px] data-[size=lg]:text-[28px] data-[size=xl]:text-[40px]',
} satisfies HellRecipe<'root'>;

/** Visual style of the `hellSpinner` indicator. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SPINNER_RECIPE,
  });

  /** Visual style of the spinner. Defaults to `ring`. */
  readonly variant = input<HellSpinnerVariant>('ring');
  /** Size of the spinner. Defaults to `md`. */
  readonly size = input<HellSize>('md');
  /** Overrides the accessible label. Defaults to `null`, falling back to the injected loading label. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Effective spinner labels resolved from `HELL_SPINNER_LABELS`. */
  protected readonly labels = inject(HELL_SPINNER_LABELS);
}
