import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';

@Directive({
  selector: '[hellPopoverTrigger]',
  hostDirectives: [
    {
      directive: NgpPopoverTrigger,
      inputs: [
        'ngpPopoverTrigger:hellPopoverTrigger',
        'ngpPopoverTriggerPlacement:placement',
        'ngpPopoverTriggerOffset:offset',
        'ngpPopoverTriggerFlip:flip',
        'ngpPopoverTriggerDisabled:disabled',
        'ngpPopoverTriggerCloseOnEscape:closeOnEscape',
        'ngpPopoverTriggerCloseOnOutsideClick:closeOnOutsideClick',
      ],
      outputs: ['ngpPopoverTriggerOpenChange:openChange'],
    },
  ],
})
export class HellPopoverTrigger {}

@Directive({
  selector: '[hellPopover]',
  hostDirectives: [NgpPopover],
  host: { '[class.hell-popover]': '!unstyled()' },
})
export class HellPopover {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
