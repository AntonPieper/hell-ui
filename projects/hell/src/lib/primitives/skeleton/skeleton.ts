import { Directive, booleanAttribute, input } from '@angular/core';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

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
    role: 'status',
    'aria-label': 'Loading',
  },
})
export class HellSpinner extends HellStyleable {
  readonly variant = input<HellSpinnerVariant>('ring');
  readonly size = input<HellSize>('md');
}
