import { Directive, ElementRef, inject } from '@angular/core';
import type { Signal } from '@angular/core';
import {
  NgpMenu,
  NgpMenuItem,
  NgpMenuItemCheckbox,
  NgpMenuItemIndicator,
  NgpMenuItemRadio,
  NgpMenuItemRadioGroup,
  NgpMenuTrigger,
  NgpSubmenuTrigger,
  injectSubmenuTriggerState,
} from 'ng-primitives/menu';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

export type HellSubmenuTriggerPart = 'root';
export type HellSubmenuTriggerUi = HellUi<HellSubmenuTriggerPart>;

export type HellMenuPart = 'root';
export type HellMenuUi = HellUi<HellMenuPart>;

export type HellMenuItemPart = 'root';
export type HellMenuItemUi = HellUi<HellMenuItemPart>;

export type HellMenuItemCheckboxPart = 'root';
export type HellMenuItemCheckboxUi = HellUi<HellMenuItemCheckboxPart>;

export type HellMenuItemRadioPart = 'root';
export type HellMenuItemRadioUi = HellUi<HellMenuItemRadioPart>;

export type HellMenuItemIndicatorPart = 'root';
export type HellMenuItemIndicatorUi = HellUi<HellMenuItemIndicatorPart>;

export type HellMenuSeparatorPart = 'root';
export type HellMenuSeparatorUi = HellUi<HellMenuSeparatorPart>;

export type HellMenuSectionPart = 'root';
export type HellMenuSectionUi = HellUi<HellMenuSectionPart>;

export type HellMenuLabelPart = 'root';
export type HellMenuLabelUi = HellUi<HellMenuLabelPart>;

export type HellMenuItemIconPart = 'root';
export type HellMenuItemIconUi = HellUi<HellMenuItemIconPart>;

export type HellMenuItemTrailingPart = 'root';
export type HellMenuItemTrailingUi = HellUi<HellMenuItemTrailingPart>;

const HELL_MENU_RECIPE = {
  root: 'fixed z-[var(--hell-z-menu,var(--hell-z-popover,60))] flex min-w-[200px] flex-col gap-px rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-2 shadow-hell-lg outline-none animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<HellMenuPart>;

const HELL_MENU_ITEM_RECIPE =
  'relative isolate flex cursor-pointer items-center gap-hell-3 border-0 bg-transparent py-[calc(var(--spacing)*1.5)] pe-[calc(var(--spacing)*2.5+var(--spacing-hell-2)+1px)] ps-[calc(var(--spacing)*2.5+var(--spacing-hell-2)+1px)] text-start font-[inherit] text-[13px] text-hell-foreground outline-none disabled:cursor-not-allowed data-disabled:cursor-not-allowed data-disabled:opacity-50';

const HELL_MENU_ITEM_CHECKABLE_RECIPE = `${HELL_MENU_ITEM_RECIPE} data-[checked]:text-hell-foreground aria-checked:text-hell-foreground`;

const HELL_MENU_ITEM_INDICATOR_RECIPE = {
  root: 'inline-flex w-4 shrink-0 items-center justify-center text-hell-primary opacity-0 data-[checked]:opacity-100',
} satisfies HellRecipe<HellMenuItemIndicatorPart>;

const HELL_MENU_SEPARATOR_RECIPE = {
  root: 'my-[calc(var(--spacing)*1)] h-px bg-hell-border mx-0.5',
} satisfies HellRecipe<HellMenuSeparatorPart>;

const HELL_MENU_SECTION_RECIPE = {
  root: 'flex flex-col gap-px [&+&]:mt-hell-2',
} satisfies HellRecipe<HellMenuSectionPart>;

const HELL_MENU_LABEL_RECIPE = {
  root: 'px-[calc(var(--spacing)*2.5)] pb-0.5 pt-[calc(var(--spacing)*1.5)] text-[10px] font-semibold uppercase tracking-[0.08em] text-hell-foreground-subtle',
} satisfies HellRecipe<HellMenuLabelPart>;

const HELL_MENU_ITEM_ICON_RECIPE = {
  root: 'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle',
} satisfies HellRecipe<HellMenuItemIconPart>;

const HELL_MENU_ITEM_TRAILING_RECIPE = {
  root: 'ms-auto inline-flex items-center gap-1 text-[11px] text-hell-foreground-subtle tabular-nums',
} satisfies HellRecipe<HellMenuItemTrailingPart>;

@Directive({
  selector: 'button[hellMenuTrigger], a[hellMenuTrigger]',
  hostDirectives: [
    {
      directive: NgpMenuTrigger,
      inputs: [
        'ngpMenuTrigger:hellMenuTrigger',
        'ngpMenuTriggerPlacement:placement',
        'ngpMenuTriggerOffset:offset',
        'ngpMenuTriggerDisabled:disabled',
        'ngpMenuTriggerContainer:container',
        'ngpMenuTriggerFlip:flip',
        'ngpMenuTriggerShift:shift',
        'ngpMenuTriggerScrollBehavior:scrollBehavior',
        'ngpMenuTriggerCooldown:cooldown',
        'ngpMenuTriggerContext:context',
        'ngpMenuTriggerOpenTriggers:openTriggers',
        'ngpMenuTriggerShowDelay:showDelay',
        'ngpMenuTriggerHideDelay:hideDelay',
      ],
    },
  ],
  host: {
    'data-hell-menu-trigger': '',
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(trigger.disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(trigger.disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(trigger.disabled())',
    '(click)': 'preventActionAnchorNavigation($event, trigger.disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, trigger.disabled())',
  },
})
export class HellMenuTrigger extends HellNativeInteractiveDisabledGuard {
  protected readonly trigger = inject(NgpMenuTrigger);
}

/** Submenu trigger for nested menus. Apply to a `[hellMenuItem]` whose
 *  `[hellSubmenuTrigger]` points at the child menu template. */
@Directive({
  selector: '[hellSubmenuTrigger]',
  hostDirectives: [
    {
      directive: NgpSubmenuTrigger,
      inputs: [
        'ngpSubmenuTrigger:hellSubmenuTrigger',
        'ngpSubmenuTriggerPlacement:placement',
        'ngpSubmenuTriggerOffset:offset',
        'ngpSubmenuTriggerDisabled:disabled',
        'ngpSubmenuTriggerFlip:flip',
      ],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSubmenuTrigger extends HellPartStyleable<HellSubmenuTriggerPart> {
  protected readonly recipe = { root: '' } satisfies HellRecipe<HellSubmenuTriggerPart>;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellMenu]',
  hostDirectives: [NgpMenu],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-submenu]': 'submenuTrigger() ? "true" : null',
  },
})
export class HellMenu extends HellPartStyleable<HellMenuPart> {
  protected readonly recipe = HELL_MENU_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly submenuTrigger: Signal<unknown> = injectSubmenuTriggerState({
    optional: true,
  });

  constructor() {
    super();
    hellRegisterFloatingHost();
  }
}

@Directive({
  selector: 'button[hellMenuItem], a[hellMenuItem], div[hellMenuItem]',
  hostDirectives: [
    {
      directive: NgpMenuItem,
      inputs: ['ngpMenuItemDisabled:disabled', 'ngpMenuItemCloseOnSelect:closeOnSelect'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-disabled]': 'nonNativeAriaDisabled()',
    '(click)': 'preventDisabledNonNative($event)',
    '(keydown.enter)': 'preventDisabledNonNative($event)',
    '(keydown.space)': 'preventDisabledNonNative($event)',
  },
})
export class HellMenuItem extends HellPartStyleable<HellMenuItemPart> {
  protected readonly recipe = { root: HELL_MENU_ITEM_RECIPE } satisfies HellRecipe<HellMenuItemPart>;
  protected readonly defaultUiPart = 'root';
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly menuItem = inject(NgpMenuItem);

  protected nativeButtonType(): 'button' | null {
    return this.isButton() ? 'button' : null;
  }

  protected nonNativeAriaDisabled(): 'true' | null {
    return !this.isButton() && this.menuItem.disabled() ? 'true' : null;
  }

  protected preventDisabledNonNative(event: Event): void {
    if (this.isButton() || !this.menuItem.disabled()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  private isButton(): boolean {
    return this.host.tagName.toLowerCase() === 'button';
  }
}

/** Checkable menu item. Does not close its owning menu when toggled. */
@Directive({
  selector: 'button[hellMenuItemCheckbox]',
  hostDirectives: [
    {
      directive: NgpMenuItemCheckbox,
      inputs: ['ngpMenuItemCheckboxChecked:checked', 'ngpMenuItemCheckboxDisabled:disabled'],
      outputs: ['ngpMenuItemCheckboxCheckedChange:checkedChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '[attr.disabled]': 'menuItem.disabled() ? "" : null',
  },
})
export class HellMenuItemCheckbox extends HellPartStyleable<HellMenuItemCheckboxPart> {
  protected readonly recipe = {
    root: HELL_MENU_ITEM_CHECKABLE_RECIPE,
  } satisfies HellRecipe<HellMenuItemCheckboxPart>;
  protected readonly defaultUiPart = 'root';
  protected readonly menuItem = inject(NgpMenuItemCheckbox);
}

/** Radio-style menu item. Use inside `[hellMenuItemRadioGroup]`. */
@Directive({
  selector: 'button[hellMenuItemRadio]',
  hostDirectives: [
    {
      directive: NgpMenuItemRadio,
      inputs: ['ngpMenuItemRadioValue:value', 'ngpMenuItemRadioDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '[attr.disabled]': 'menuItem.disabled() ? "" : null',
  },
})
export class HellMenuItemRadio extends HellPartStyleable<HellMenuItemRadioPart> {
  protected readonly recipe = {
    root: HELL_MENU_ITEM_CHECKABLE_RECIPE,
  } satisfies HellRecipe<HellMenuItemRadioPart>;
  protected readonly defaultUiPart = 'root';
  protected readonly menuItem = inject(NgpMenuItemRadio);
}

/** Group wrapper for radio menu items. */
@Directive({
  selector: '[hellMenuItemRadioGroup]',
  hostDirectives: [
    {
      directive: NgpMenuItemRadioGroup,
      inputs: ['ngpMenuItemRadioGroupValue:value'],
      outputs: ['ngpMenuItemRadioGroupValueChange:valueChange'],
    },
  ],
})
export class HellMenuItemRadioGroup {}

/** Indicator slot inside checkbox or radio menu items. */
@Directive({
  selector: '[hellMenuItemIndicator]',
  hostDirectives: [NgpMenuItemIndicator],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    'aria-hidden': 'true',
  },
})
export class HellMenuItemIndicator extends HellPartStyleable<HellMenuItemIndicatorPart> {
  protected readonly recipe = HELL_MENU_ITEM_INDICATOR_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellMenuSeparator]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'separator',
  },
})
export class HellMenuSeparator extends HellPartStyleable<HellMenuSeparatorPart> {
  protected readonly recipe = HELL_MENU_SEPARATOR_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Section grouping wrapper. Use with `[hellMenuLabel]` for an optional header. */
@Directive({
  selector: '[hellMenuSection]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'group',
  },
})
export class HellMenuSection extends HellPartStyleable<HellMenuSectionPart> {
  protected readonly recipe = HELL_MENU_SECTION_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Section / group label rendered above a section's items. */
@Directive({
  selector: '[hellMenuLabel]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'presentation',
  },
})
export class HellMenuLabel extends HellPartStyleable<HellMenuLabelPart> {
  protected readonly recipe = HELL_MENU_LABEL_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Optional leading-icon slot inside a `[hellMenuItem]`. */
@Directive({
  selector: '[hellMenuItemIcon]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    'aria-hidden': 'true',
  },
})
export class HellMenuItemIcon extends HellPartStyleable<HellMenuItemIconPart> {
  protected readonly recipe = HELL_MENU_ITEM_ICON_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Trailing slot — kbd hint, chevron, badge, etc. */
@Directive({
  selector: '[hellMenuItemTrailing]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellMenuItemTrailing extends HellPartStyleable<HellMenuItemTrailingPart> {
  protected readonly recipe = HELL_MENU_ITEM_TRAILING_RECIPE;
  protected readonly defaultUiPart = 'root';
}

export const HELL_MENU_DIRECTIVES = [
  HellMenuTrigger,
  HellSubmenuTrigger,
  HellMenu,
  HellMenuItem,
  HellMenuItemCheckbox,
  HellMenuItemRadio,
  HellMenuItemRadioGroup,
  HellMenuItemIndicator,
  HellMenuSeparator,
  HellMenuSection,
  HellMenuLabel,
  HellMenuItemIcon,
  HellMenuItemTrailing,
] as const;
