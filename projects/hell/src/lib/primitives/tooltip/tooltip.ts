import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger } from 'ng-primitives/tooltip';

@Directive({
  selector: '[hellTooltipTrigger]',
  hostDirectives: [
    {
      directive: NgpTooltipTrigger,
      inputs: [
        'ngpTooltipTrigger:hellTooltipTrigger',
        'ngpTooltipTriggerPlacement:placement',
        'ngpTooltipTriggerOffset:offset',
        'ngpTooltipTriggerShowDelay:showDelay',
        'ngpTooltipTriggerHideDelay:hideDelay',
        'ngpTooltipTriggerDisabled:disabled',
        'ngpTooltipTriggerShowOnOverflow:showOnOverflow',
        'ngpTooltipTriggerHoverableContent:hoverableContent',
      ],
    },
  ],
})
export class HellTooltipTrigger {}

@Directive({
  selector: '[hellTooltip]',
  hostDirectives: [NgpTooltip],
  host: {
    '[class.hell-tooltip]': '!unstyled()',
    role: 'tooltip',
  },
})
export class HellTooltip {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
