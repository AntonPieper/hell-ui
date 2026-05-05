import { Directive } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger } from 'ng-primitives/tooltip';
import { HellStyleable } from '../../core/styleable';
import { hellRegisterFloatingHost } from '../../core/floating-scope';

/**
 * Trigger for an `ng-template` tooltip. Bind `[hellTooltipTrigger]` to the
 * template and pass placement, delay, overflow, disabled, and hoverable-content
 * options through to ng-primitives.
 */
@Directive({
  selector: 'button[hellTooltipTrigger], a[hellTooltipTrigger]',
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

/**
 * Tooltip surface rendered by the trigger template. Registers with any active
 * Hell Floating Scope so hoverable tooltip content counts as an inside target.
 */
@Directive({
  selector: '[hellTooltip]',
  hostDirectives: [NgpTooltip],
  host: {
    '[class.hell-tooltip]': '!unstyled()',
    role: 'tooltip',
  },
})
export class HellTooltip extends HellStyleable {
  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}
