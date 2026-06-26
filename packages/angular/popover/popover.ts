import { DestroyRef, Directive, inject } from '@angular/core';
import type { FocusOrigin } from '@angular/cdk/a11y';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { HellStyleable } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';
import { hellConnectNgpPopoverCloseAdapter } from '@hell-ui/angular/internal/ng-primitives';

/**
 * Trigger for an `ng-template` popover. Bind `[hellPopoverTrigger]="template"`
 * and optionally pass placement, offset, flip, shift, disabled, and close policy
 * inputs through to ng-primitives.
 */
@Directive({
  selector: 'button[hellPopoverTrigger], a[hellPopoverTrigger]',
  exportAs: 'hellPopoverTrigger',
  hostDirectives: [
    {
      directive: NgpPopoverTrigger,
      inputs: [
        'ngpPopoverTrigger:hellPopoverTrigger',
        'ngpPopoverTriggerPlacement:placement',
        'ngpPopoverTriggerOffset:offset',
        'ngpPopoverTriggerFlip:flip',
        'ngpPopoverTriggerShift:shift',
        'ngpPopoverTriggerContainer:container',
        'ngpPopoverTriggerDisabled:disabled',
        'ngpPopoverTriggerCloseOnEscape:closeOnEscape',
        'ngpPopoverTriggerCloseOnOutsideClick:closeOnOutsideClick',
      ],
      outputs: ['ngpPopoverTriggerOpenChange:openChange'],
    },
  ],
  host: {
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(trigger.disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(trigger.disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(trigger.disabled())',
    '(click)': 'preventActionAnchorNavigation($event, trigger.disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, trigger.disabled())',
  },
})
export class HellPopoverTrigger extends HellNativeInteractiveDisabledGuard {
  protected readonly trigger = inject(NgpPopoverTrigger);

  constructor() {
    super();
    hellConnectNgpPopoverCloseAdapter(this.trigger, inject(DestroyRef));
  }

  show(): Promise<void> {
    return this.trigger.show();
  }

  hide(origin?: FocusOrigin): Promise<void> {
    return this.trigger.hide(origin);
  }
}

/**
 * Floating popover surface. Place inside the trigger template as
 * `<div hellPopover>...</div>`; it registers with any active Hell Floating
 * Scope so nested menus/popovers count as inside interactions.
 */
@Directive({
  selector: '[hellPopover]',
  hostDirectives: [NgpPopover],
  host: { '[class.hell-popover]': '!unstyled()' },
})
export class HellPopover extends HellStyleable {
  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}
