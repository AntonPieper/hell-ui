import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { NgpTextarea } from 'ng-primitives/textarea';
import { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: 'input[hellInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled'] }],
  host: {
    '[class.hell-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellInput extends HellStyleable {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}

@Directive({
  selector: 'select[hellNativeSelect]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled'] }],
  host: {
    '[class.hell-native-select]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellNativeSelect extends HellStyleable {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}

@Directive({
  selector: 'textarea[hellTextarea]',
  hostDirectives: [{ directive: NgpTextarea, inputs: ['disabled'] }],
  host: {
    '[class.hell-textarea]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellTextarea extends HellStyleable {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}
