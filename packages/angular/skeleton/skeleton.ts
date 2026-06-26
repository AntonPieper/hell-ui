import {
  Directive, inject, input } from '@angular/core';
import type { HellSize } from '@hell-ui/angular/core';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';

/** Loading shape placeholder. Pure visual — no semantics. */
@Directive({
  selector: '[hellSkeleton]',
  host: {
    '[class.hell-skeleton]': '!unstyled()',
    '[attr.data-shape]': 'shape()',
    '[style.--_hell-skeleton-width]': 'width()',
    '[style.--_hell-skeleton-height]': 'height()',
    'aria-hidden': 'true',
  },
})
export class HellSkeleton extends HellStyleable {
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
    '[class.hell-spinner]': '!unstyled()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.aria-label]': 'ariaLabel() ?? labels.loading',
    role: 'status',
  },
})
export class HellSpinner extends HellStyleable {
  readonly variant = input<HellSpinnerVariant>('ring');
  readonly size = input<HellSize>('md');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  protected readonly labels = inject<HellLabels>(HELL_LABELS);
}
