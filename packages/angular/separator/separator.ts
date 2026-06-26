import { Directive, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import type { HellOrientation, HellSize } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';

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
export class HellSeparator extends HellStyleable {
  readonly orientation = input<HellOrientation>('horizontal');
  /**
   * Symmetric margin around the separator on its main axis.
   * - horizontal → vertical margin (block)
   * - vertical   → horizontal margin (inline)
   * Defaults to `md`. Use `none` for flush dividers (e.g. inside cards).
   */
  readonly spacing = input<HellSize | 'none'>('md');
}
