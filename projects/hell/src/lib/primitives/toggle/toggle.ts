import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpToggle } from 'ng-primitives/toggle';
import { NgpToggleGroup, NgpToggleGroupItem } from 'ng-primitives/toggle-group';
import { HellSize } from '../../core/types';

/**
 * Single press-toggle button. Pairs with `hell-button`'s utility class for
 * styling but adds the on/off `data-state` from the toggle primitive.
 */
@Directive({
  selector: 'button[hellToggle]',
  hostDirectives: [{ directive: NgpToggle, inputs: ['ngpToggleSelected:selected', 'ngpToggleDisabled:disabled'], outputs: ['ngpToggleSelectedChange:selectedChange'] }],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
  },
})
export class HellToggle {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellToggleGroup]',
  hostDirectives: [
    {
      directive: NgpToggleGroup,
      inputs: [
        'ngpToggleGroupValue:value',
        'ngpToggleGroupType:type',
        'ngpToggleGroupDisabled:disabled',
      ],
      outputs: ['ngpToggleGroupValueChange:valueChange'],
    },
  ],
  host: {
    '[class.hell-toggle-group]': '!unstyled()',
    role: 'group',
  },
})
export class HellToggleGroup {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellToggleGroupItem]',
  hostDirectives: [{ directive: NgpToggleGroupItem, inputs: ['ngpToggleGroupItemValue:value', 'ngpToggleGroupItemDisabled:disabled'] }],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggleGroupItem {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('sm');
}
