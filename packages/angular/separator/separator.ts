import { Directive, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import type { HellOrientation, HellSize } from 'hell-ui/core';
import type { HellUiInput } from 'hell-ui/core';
import { hellPartStyler } from 'hell-ui/internal/core';

import { HELL_SEPARATOR_RECIPE } from './separator.recipes';

/** Visual or semantic divider between sections of content. */
@Directive({
  selector: '[hellSeparator]',
  hostDirectives: [{ directive: NgpSeparator, inputs: ['ngpSeparatorOrientation:orientation'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-spacing]': 'spacing()',
    '[attr.role]': '"separator"',
  },
})
export class HellSeparator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEPARATOR_RECIPE,
  });

  /** Axis the separator lies on. Defaults to `horizontal`. */
  readonly orientation = input<HellOrientation>('horizontal');
  /**
   * Symmetric margin around the separator on its main axis.
   * - horizontal → vertical margin (block)
   * - vertical   → horizontal margin (inline)
   * Defaults to `md`. Use `none` for flush dividers (e.g. inside cards).
   */
  readonly spacing = input<HellSize | 'none'>('md');
}
