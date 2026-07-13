import { Directive, inject, input } from '@angular/core';
import type { FocusOrigin } from '@angular/cdk/a11y';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

const HELL_POPOVER_RECIPE = {
  root: 'absolute z-[var(--hell-z-popover,60)] max-w-[320px] rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-4 text-[13px] text-hell-foreground shadow-hell-lg outline-none animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

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
  /** Underlying ng-primitives popover trigger state. */
  protected readonly trigger = inject(NgpPopoverTrigger);

  /** Opens the popover. */
  show(): Promise<void> {
    return this.trigger.show();
  }

  /** Closes the popover, optionally restoring focus to the given origin. */
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
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellPopover {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_POPOVER_RECIPE,
  });

  constructor() {
    hellRegisterFloatingHost();
  }
}
