import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger } from 'ng-primitives/tooltip';
import { HellStyleable } from '../../core/styleable';
import { HELL_OVERLAY_SCOPE } from '../../core/overlay-scope';

/**
 * Trigger for an `ng-template` tooltip. Bind `[hellTooltipTrigger]` to the
 * template and pass placement, delay, overflow, disabled, and hoverable-content
 * options through to ng-primitives.
 */
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

/**
 * Tooltip surface rendered by the trigger template. Registers with any active
 * Hell overlay scope so hoverable tooltip content counts as an inside target.
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
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly overlayScope = inject(HELL_OVERLAY_SCOPE, { optional: true });

  constructor() {
    super();
    this.overlayScope?.registerOverlayElement(this.host);
    inject(DestroyRef).onDestroy(() => this.overlayScope?.unregisterOverlayElement(this.host));
  }
}
