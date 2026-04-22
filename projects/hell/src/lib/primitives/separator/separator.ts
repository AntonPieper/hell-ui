import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import { HellOrientation } from '../../core/types';

@Directive({
  selector: '[hellSeparator]',
  hostDirectives: [{ directive: NgpSeparator, inputs: ['ngpSeparatorOrientation'] }],
  host: {
    '[class.hell-separator]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.role]': '"separator"',
  },
})
export class HellSeparator {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
}
