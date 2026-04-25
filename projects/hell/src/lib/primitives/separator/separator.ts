import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import type { HellOrientation, HellSize } from '../../core/types';

@Directive({
  selector: '[hellSeparator]',
  hostDirectives: [{ directive: NgpSeparator, inputs: ['ngpSeparatorOrientation:orientation'] }],
  host: {
    '[class.hell-separator]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-spacing]': 'spacing()',
    '[attr.role]': '"separator"',
  },
})
export class HellSeparator {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
  /**
   * Symmetric margin around the separator on its main axis.
   * - horizontal → vertical margin (block)
   * - vertical   → horizontal margin (inline)
   * Defaults to `md`. Use `none` for flush dividers (e.g. inside cards).
   */
  readonly spacing = input<HellSize | 'none'>('md');
}
