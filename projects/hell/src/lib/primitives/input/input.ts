import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { NgpTextarea } from 'ng-primitives/textarea';
import { HellSize } from '../../core/types';

@Directive({
  selector: 'input[hellInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled'] }],
  host: {
    '[class.hell-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellInput {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'textarea[hellTextarea]',
  hostDirectives: [{ directive: NgpTextarea, inputs: ['disabled'] }],
  host: {
    '[class.hell-textarea]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellTextarea {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
}
