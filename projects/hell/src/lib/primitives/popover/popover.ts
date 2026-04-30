import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { HellStyleable } from '../../core/styleable';
import { HELL_OVERLAY_SCOPE, hellRegisterOverlayElement } from '../../core/overlay-scope';

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
export class HellPopover extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly overlayScope = inject(HELL_OVERLAY_SCOPE, { optional: true });

  constructor() {
    super();
    hellRegisterOverlayElement(this.overlayScope, this.host, inject(DestroyRef));
  }
}
