import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { HellSize } from '../../core/types';

/**
 * Native HTML time input styled to match the rest of the system. Wraps
 * `NgpInput` for consistent state attributes. Use
 * `<input hellTimeInput type="time">`. Pass `step="1"` to enable seconds.
 */
@Directive({
  selector: 'input[hellTimeInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled'] }],
  host: {
    type: 'time',
    '[class.hell-input]': '!unstyled()',
    '[class.hell-time-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellTimeInput {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
}
