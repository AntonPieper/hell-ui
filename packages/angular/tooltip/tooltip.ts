import { Directive, inject } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger, injectTooltipTriggerState } from 'ng-primitives/tooltip';
import { HellStyleable } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

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
  host: {
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(trigger.disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(trigger.disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(trigger.disabled())',
    '(click)': 'preventDisabledAnchor($event, trigger.disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, trigger.disabled())',
  },
})
export class HellTooltipTrigger extends HellNativeInteractiveDisabledGuard {
  protected readonly trigger = inject(NgpTooltipTrigger);
}

/**
 * Tooltip surface rendered by the trigger template. Registers with any active
 * Hell Floating Scope so hoverable tooltip content counts as an inside target.
 */
@Directive({
  selector: '[hellTooltip]',
  hostDirectives: [NgpTooltip],
  host: {
    '[class.hell-tooltip]': '!unstyled()',
    '[attr.data-hoverable]': 'tooltipTrigger().hoverableContent() ? "" : null',
    role: 'tooltip',
  },
})
export class HellTooltip extends HellStyleable {
  protected readonly tooltipTrigger = injectTooltipTriggerState();

  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}
