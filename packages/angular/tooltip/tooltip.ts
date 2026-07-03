import { Directive, inject, input } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger, injectTooltipTriggerState } from 'ng-primitives/tooltip';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

/** Public parts of the HellTooltip module, styleable through its Part Style Map. */
export type HellTooltipPart = 'root';
/** Part Style Map accepted by the HellTooltip `ui` input. */
export type HellTooltipUi = HellUi<HellTooltipPart>;

const HELL_TOOLTIP_RECIPE = {
  root: 'pointer-events-none absolute max-w-[min(240px,calc(100vw_-_var(--spacing-hell-8)))] rounded-hell-sm bg-[#1c222a] px-2 py-1 text-xs font-medium leading-[var(--text-xs--line-height)] text-white shadow-hell-md [overflow-wrap:anywhere] data-hoverable:pointer-events-auto animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<HellTooltipPart>;

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
        'ngpTooltipTriggerContainer:container',
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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-hoverable]': 'tooltipTrigger().hoverableContent() ? "" : null',
    role: 'tooltip',
  },
})
export class HellTooltip {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTooltipPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTooltipPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOOLTIP_RECIPE,
  });
  protected readonly tooltipTrigger = injectTooltipTriggerState();

  constructor() {
    hellRegisterFloatingHost();
  }
}
