import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger } from 'ng-primitives/tooltip';
import { HellStyleable } from '../../core/styleable';
import { HELL_OVERLAY_SCOPE } from '../../core/overlay-scope';

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
export class HellTooltip extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly overlayScope = inject(HELL_OVERLAY_SCOPE, { optional: true });

  constructor() {
    super();
    this.overlayScope?.registerOverlayElement(this.host);
    inject(DestroyRef).onDestroy(() => this.overlayScope?.unregisterOverlayElement(this.host));
  }
}
