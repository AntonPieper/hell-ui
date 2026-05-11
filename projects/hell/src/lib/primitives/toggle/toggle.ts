import { Directive, input } from '@angular/core';
import { NgpToggle } from 'ng-primitives/toggle';
import { NgpToggleGroup, NgpToggleGroupItem } from 'ng-primitives/toggle-group';
import { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

/**
 * Single press-toggle button. Pairs with `hell-button`'s utility class for
 * styling but adds the on/off `data-state` from the toggle primitive.
 */
@Directive({
  selector: 'button[hellToggle]',
  hostDirectives: [
    {
      directive: NgpToggle,
      inputs: ['ngpToggleSelected:selected', 'ngpToggleDisabled:disabled'],
      outputs: ['ngpToggleSelectedChange:selectedChange'],
    },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggle extends HellStyleable {
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
export class HellToggleGroup extends HellStyleable {}

@Directive({
  selector: 'button[hellToggleGroupItem]',
  hostDirectives: [
    {
      directive: NgpToggleGroupItem,
      inputs: ['ngpToggleGroupItemValue:value', 'ngpToggleGroupItemDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[class.hell-toggle]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggleGroupItem extends HellStyleable {
  readonly size = input<HellSize>('sm');
}
