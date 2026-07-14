import { Directive, computed, effect, inject, input, output } from '@angular/core';
import { NgpTooltip, NgpTooltipTrigger, injectTooltipTriggerState } from 'ng-primitives/tooltip';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

const HELL_TOOLTIP_RECIPE = {
  root: 'pointer-events-none absolute max-w-[min(240px,calc(100vw_-_var(--spacing-hell-8)))] rounded-hell-sm bg-[#1c222a] px-2 py-1 text-xs font-medium leading-[var(--text-xs--line-height)] text-white shadow-hell-md [overflow-wrap:anywhere] data-hoverable:pointer-events-auto animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

/**
 * Trigger for an `ng-template` tooltip. Bind `[hellTooltipTrigger]` to the
 * template and pass placement, delay, overflow, disabled, and hoverable-content
 * options through to ng-primitives.
 */
@Directive({
  selector: 'button[hellTooltipTrigger], a[hellTooltipTrigger]',
  exportAs: 'hellTooltipTrigger',
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
  /** Underlying ng-primitives tooltip trigger state. */
  protected readonly trigger = inject(NgpTooltipTrigger);
  private readonly triggerState = injectTooltipTriggerState();

  /** Whether the tooltip is currently open (Anchored Surface Contract). */
  readonly open = computed(() => this.triggerState().open());
  /** Emits the new open state whenever the tooltip shows or hides. */
  readonly openChange = output<boolean>();

  constructor() {
    super();
    let previousOpen = false;
    effect(() => {
      const open = this.open();
      if (open !== previousOpen) {
        previousOpen = open;
        this.openChange.emit(open);
      }
    });
  }

  /** Shows the tooltip. */
  show(): void {
    this.triggerState().show();
  }

  /** Hides the tooltip. */
  hide(): void {
    this.triggerState().hide();
  }
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOOLTIP_RECIPE,
  });
  /** Trigger state of the associated `hellTooltipTrigger`. */
  protected readonly tooltipTrigger = injectTooltipTriggerState();

  constructor() {
    hellRegisterFloatingHost();
  }
}
