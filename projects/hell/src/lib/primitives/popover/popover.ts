import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { HellStyleable } from '../../core/styleable';
import { HELL_FLOATING_SCOPE, hellRegisterFloatingElement } from '../../core/overlay-scope';

/**
 * Trigger for an `ng-template` popover. Bind `[hellPopoverTrigger]="template"`
 * and optionally pass placement, offset, flip, disabled, and close policy
 * inputs through to ng-primitives.
 */
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

/**
 * Floating popover surface. Place inside the trigger template as
 * `<div hellPopover>...</div>`; it registers with any active Hell overlay
 * scope so nested menus/popovers count as inside interactions.
 */
@Directive({
  selector: '[hellPopover]',
  hostDirectives: [NgpPopover],
  host: { '[class.hell-popover]': '!unstyled()' },
})
export class HellPopover extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly floatingScope = inject(HELL_FLOATING_SCOPE, { optional: true });

  constructor() {
    super();
    hellRegisterFloatingElement(this.floatingScope, this.host, inject(DestroyRef));
  }
}
