import { DestroyRef, Directive, effect, inject } from '@angular/core';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { HellStyleable } from '../../core/styleable';
import { hellRegisterFloatingHost } from '../../core/floating-scope';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';

/**
 * Trigger for an `ng-template` popover. Bind `[hellPopoverTrigger]="template"`
 * and optionally pass placement, offset, flip, shift, disabled, and close policy
 * inputs through to ng-primitives.
 */
@Directive({
  selector: 'button[hellPopoverTrigger], a[hellPopoverTrigger]',
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
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;

  constructor() {
    super();

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });

    effect(() => this.configureOverlayClose(this.trigger.overlay()));
  }

  private configureOverlayClose(overlay: unknown): void {
    if (!hasPopoverOverlayConfigUpdater(overlay)) return;

    overlay.updateConfig({
      onClose: () => {
        if (!this.destroyed) {
          this.trigger.openChange.emit(false);
        }
      },
    });
  }
}

interface HellPopoverOverlayConfig {
  onClose?: () => void;
}

interface HellPopoverOverlayConfigUpdater {
  updateConfig(config: HellPopoverOverlayConfig): void;
}

function hasPopoverOverlayConfigUpdater(overlay: unknown): overlay is HellPopoverOverlayConfigUpdater {
  return (
    !!overlay &&
    (typeof overlay === 'object' || typeof overlay === 'function') &&
    typeof (overlay as { updateConfig?: unknown }).updateConfig === 'function'
  );
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
