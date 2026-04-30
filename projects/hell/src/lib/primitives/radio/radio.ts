import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpRadioGroup, NgpRadioItem, NgpRadioIndicator } from 'ng-primitives/radio';
import { HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: '[hellRadioGroup]',
  hostDirectives: [
    {
      directive: NgpRadioGroup,
      inputs: [
        'ngpRadioGroupValue:value',
        'ngpRadioGroupDisabled:disabled',
        'ngpRadioGroupOrientation:orientation',
      ],
      outputs: ['ngpRadioGroupValueChange:valueChange'],
    },
  ],
  host: {
    '[class.hell-radio-group]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellRadioGroup extends HellStyleable {
  readonly orientation = input<HellOrientation>('vertical');
}

@Directive({
  selector: 'button[hellRadio]',
  hostDirectives: [
    {
      directive: NgpRadioItem,
      inputs: ['ngpRadioItemValue:value', 'ngpRadioItemDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-radio]': '!unstyled()',
    type: 'button',
  },
})
export class HellRadio extends HellStyleable {}

export { NgpRadioIndicator as HellRadioIndicator };
