import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpRadioGroup, NgpRadioItem, NgpRadioIndicator } from 'ng-primitives/radio';
import { HellOrientation } from '../../core/types';

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
    style: 'display:inline-flex; gap: 0.75rem; flex-direction: var(--hell-rg-dir, row);',
    '[style.--hell-rg-dir]': 'orientation() === "vertical" ? "column" : "row"',
  },
})
export class HellRadioGroup {
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
export class HellRadio {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export { NgpRadioIndicator as HellRadioIndicator };
