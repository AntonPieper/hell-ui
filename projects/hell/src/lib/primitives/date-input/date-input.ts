import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { HellSize } from '../../core/types';

/**
 * Native HTML date input styled to match the rest of the system. Wraps
 * `NgpInput` for consistent state attributes (`data-hover`, `data-focus`,
 * `data-disabled`). Use `<input hellDateInput type="date">`.
 *
 * For a calendar surface (popover-style picker), see `<hell-date-picker>`
 * which wraps the `ng-primitives` date-picker primitives.
 */
@Directive({
  selector: 'input[hellDateInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled'] }],
  host: {
    type: 'date',
    '[class.hell-input]': '!unstyled()',
    '[class.hell-date-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellDateInput {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
}
