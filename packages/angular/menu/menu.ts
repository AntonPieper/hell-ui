import {
  DestroyRef,
  Directive,
  ElementRef,
  Renderer2,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
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
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';

/** Public parts of the HellSubmenuTrigger module, styleable through its Part Style Map. */
export type HellSubmenuTriggerPart = 'root';
/** Part Style Map accepted by the HellSubmenuTrigger `ui` input. */
export type HellSubmenuTriggerUi = HellUi<HellSubmenuTriggerPart>;

/** Public parts of the HellMenu module, styleable through its Part Style Map. */
export type HellMenuPart = 'root';
/** Part Style Map accepted by the HellMenu `ui` input. */
export type HellMenuUi = HellUi<HellMenuPart>;

/** Public parts of the HellMenuItem module, styleable through its Part Style Map. */
export type HellMenuItemPart = 'root';
/** Part Style Map accepted by the HellMenuItem `ui` input. */
export type HellMenuItemUi = HellUi<HellMenuItemPart>;

/** Public parts of the HellMenuItemCheckbox module, styleable through its Part Style Map. */
export type HellMenuItemCheckboxPart = 'root';
/** Part Style Map accepted by the HellMenuItemCheckbox `ui` input. */
export type HellMenuItemCheckboxUi = HellUi<HellMenuItemCheckboxPart>;

/** Public parts of the HellMenuItemRadio module, styleable through its Part Style Map. */
export type HellMenuItemRadioPart = 'root';
/** Part Style Map accepted by the HellMenuItemRadio `ui` input. */
export type HellMenuItemRadioUi = HellUi<HellMenuItemRadioPart>;

/** Public parts of the HellMenuItemIndicator module, styleable through its Part Style Map. */
export type HellMenuItemIndicatorPart = 'root';
/** Part Style Map accepted by the HellMenuItemIndicator `ui` input. */
export type HellMenuItemIndicatorUi = HellUi<HellMenuItemIndicatorPart>;

/** Public parts of the HellMenuSeparator module, styleable through its Part Style Map. */
export type HellMenuSeparatorPart = 'root';
/** Part Style Map accepted by the HellMenuSeparator `ui` input. */
export type HellMenuSeparatorUi = HellUi<HellMenuSeparatorPart>;

/** Public parts of the HellMenuSection module, styleable through its Part Style Map. */
export type HellMenuSectionPart = 'root';
/** Part Style Map accepted by the HellMenuSection `ui` input. */
export type HellMenuSectionUi = HellUi<HellMenuSectionPart>;

/** Public parts of the HellMenuLabel module, styleable through its Part Style Map. */
export type HellMenuLabelPart = 'root';
/** Part Style Map accepted by the HellMenuLabel `ui` input. */
export type HellMenuLabelUi = HellUi<HellMenuLabelPart>;

/** Public parts of the HellMenuItemIcon module, styleable through its Part Style Map. */
export type HellMenuItemIconPart = 'root';
/** Part Style Map accepted by the HellMenuItemIcon `ui` input. */
export type HellMenuItemIconUi = HellUi<HellMenuItemIconPart>;

/** Public parts of the HellMenuItemTrailing module, styleable through its Part Style Map. */
export type HellMenuItemTrailingPart = 'root';
/** Part Style Map accepted by the HellMenuItemTrailing `ui` input. */
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

const HELL_MENU_ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
const HELL_MENU_TYPEAHEAD_TIMEOUT_MS = 500;

/** Trigger that opens a `[hellMenu]` when activated. Apply to a `<button>` or `<a>`. */
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
  /** Underlying ng-primitives menu trigger state. */
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
    // Static marker: the directive is applied through a property binding, so
    // no selector attribute lands in the DOM for stylesheets to target.
    'data-hell-submenu-trigger': '',
  },
})
export class HellSubmenuTrigger {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSubmenuTriggerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSubmenuTriggerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => ({ root: '' } satisfies HellRecipe<HellSubmenuTriggerPart>),
  });
}

/** Floating menu panel opened by `[hellMenuTrigger]` or `[hellSubmenuTrigger]`. */
@Directive({
  selector: '[hellMenu]',
  hostDirectives: [NgpMenu],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-submenu]': 'submenuTrigger() ? "true" : null',
  },
})
export class HellMenu {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private typeaheadBuffer = '';
  private lastTypeaheadAt = Number.NEGATIVE_INFINITY;

  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_RECIPE,
  });
  /** Submenu trigger state when this menu is nested inside another menu, if any. */
  protected readonly submenuTrigger: Signal<unknown> = injectSubmenuTriggerState({
    optional: true,
  });

  constructor() {
    hellRegisterFloatingHost();

    const stopTypeaheadListener = inject(Renderer2).listen(
      this.host,
      'keydown',
      (event: KeyboardEvent) => this.handleTypeahead(event),
    );
    inject(DestroyRef).onDestroy(stopTypeaheadListener);

    // Overlay panes such as the Omnibar panel render through the browser
    // Popover API, which paints above every z-indexed element. Menus join the
    // same top-most rendering context so a menu opened from inside such a
    // pane still paints above it (later entries win); ng-primitives keeps
    // owning position and dismissal.
    afterNextRender(() => {
      if (typeof this.host.showPopover !== 'function' || !this.host.isConnected) return;
      this.host.setAttribute('popover', 'manual');
      try {
        this.host.showPopover();
      } catch {
        this.host.removeAttribute('popover');
      }
    });
  }

  private handleTypeahead(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.key.length !== 1 ||
      event.key === ' ' ||
      target?.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')
    ) {
      return;
    }

    const items = Array.from(this.host.querySelectorAll<HTMLElement>(HELL_MENU_ITEM_SELECTOR)).filter(
      (item) => !item.matches(':disabled, [aria-disabled="true"], [data-disabled]'),
    );
    if (items.length === 0) return;

    const key = event.key.toLocaleLowerCase();
    const withinTimeout = event.timeStamp - this.lastTypeaheadAt <= HELL_MENU_TYPEAHEAD_TIMEOUT_MS;
    this.typeaheadBuffer = withinTimeout ? `${this.typeaheadBuffer}${key}` : key;
    this.lastTypeaheadAt = event.timeStamp;

    const repeatedKey = [...this.typeaheadBuffer].every((character) => character === key);
    const query = repeatedKey ? key : this.typeaheadBuffer;
    const currentIndex = target ? items.indexOf(target) : -1;
    const firstIndex = query.length > 1 && currentIndex >= 0 ? currentIndex : currentIndex + 1;
    const match = this.findTypeaheadMatch(items, firstIndex, query);

    if (match) {
      event.preventDefault();
      match.focus();
    }
  }

  private findTypeaheadMatch(
    items: readonly HTMLElement[],
    firstIndex: number,
    query: string,
  ): HTMLElement | undefined {
    for (let offset = 0; offset < items.length; offset += 1) {
      const item = items[(firstIndex + offset + items.length) % items.length];
      const label = item.textContent?.trim().replace(/\s+/g, ' ').toLocaleLowerCase() ?? '';
      if (label.startsWith(query)) return item;
    }

    return undefined;
  }
}

/** Selectable menu entry. Apply to a `<button>`, `<a>`, or `<div>` inside a `[hellMenu]`. */
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
export class HellMenuItem {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => ({ root: HELL_MENU_ITEM_RECIPE } satisfies HellRecipe<HellMenuItemPart>),
  });
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly menuItem = inject(NgpMenuItem);

  /** Returns `"button"` for native `<button>` hosts so type defaults to a submit-safe button. */
  protected nativeButtonType(): 'button' | null {
    return this.isButton() ? 'button' : null;
  }

  /** Returns `"true"` when disabled on a non-native (non-`<button>`) host, which lacks the native `disabled` attribute. */
  protected nonNativeAriaDisabled(): 'true' | null {
    return !this.isButton() && this.menuItem.disabled() ? 'true' : null;
  }

  /** Blocks activation on a disabled non-native host, since it has no native `disabled` semantics. */
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
export class HellMenuItemCheckbox {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemCheckboxPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemCheckboxPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => ({
    root: HELL_MENU_ITEM_CHECKABLE_RECIPE,
  } satisfies HellRecipe<HellMenuItemCheckboxPart>),
  });
  /** Underlying ng-primitives checkbox menu item state. */
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
export class HellMenuItemRadio {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemRadioPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemRadioPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => ({
    root: HELL_MENU_ITEM_CHECKABLE_RECIPE,
  } satisfies HellRecipe<HellMenuItemRadioPart>),
  });
  /** Underlying ng-primitives radio menu item state. */
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
export class HellMenuItemIndicator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemIndicatorPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemIndicatorPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_ITEM_INDICATOR_RECIPE,
  });
}

/** Visual divider between groups of menu items. */
@Directive({
  selector: '[hellMenuSeparator]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'separator',
  },
})
export class HellMenuSeparator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuSeparatorPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuSeparatorPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_SEPARATOR_RECIPE,
  });
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
export class HellMenuSection {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuSectionPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuSectionPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_SECTION_RECIPE,
  });
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
export class HellMenuLabel {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuLabelPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuLabelPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_LABEL_RECIPE,
  });
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
export class HellMenuItemIcon {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemIconPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemIconPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_ITEM_ICON_RECIPE,
  });
}

/** Trailing slot — kbd hint, chevron, badge, etc. */
@Directive({
  selector: '[hellMenuItemTrailing]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellMenuItemTrailing {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellMenuItemTrailingPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellMenuItemTrailingPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_MENU_ITEM_TRAILING_RECIPE,
  });
}

/** All directives that make up the menu entry point, for bulk `imports`. */
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
