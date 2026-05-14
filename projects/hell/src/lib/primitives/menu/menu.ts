import { Directive, ElementRef, inject } from '@angular/core';
import type { Signal } from '@angular/core';
import {
  NgpMenu,
  NgpMenuItem,
  NgpMenuTrigger,
  NgpSubmenuTrigger,
  injectSubmenuTriggerState,
} from 'ng-primitives/menu';
import { hellRegisterFloatingHost } from '../../core/floating-scope';
import { HellStyleable } from '../../core/styleable';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';

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
  host: { '[class.hell-menu-item-submenu]': '!unstyled()' },
})
export class HellSubmenuTrigger extends HellStyleable {}

@Directive({
  selector: '[hellMenu]',
  hostDirectives: [NgpMenu],
  host: {
    '[class.hell-menu]': '!unstyled()',
    '[attr.data-submenu]': 'submenuTrigger() ? "true" : null',
  },
})
export class HellMenu extends HellStyleable {
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
    '[class.hell-menu-item]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-disabled]': 'nonNativeAriaDisabled()',
    '(click)': 'preventDisabledNonNative($event)',
    '(keydown.enter)': 'preventDisabledNonNative($event)',
    '(keydown.space)': 'preventDisabledNonNative($event)',
  },
})
export class HellMenuItem extends HellStyleable {
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

@Directive({
  selector: '[hellMenuSeparator]',
  host: {
    '[class.hell-menu-separator]': '!unstyled()',
    role: 'separator',
  },
})
export class HellMenuSeparator extends HellStyleable {}

/** Section grouping wrapper. Use with `[hellMenuLabel]` for an optional header. */
@Directive({
  selector: '[hellMenuSection]',
  host: {
    '[class.hell-menu-section]': '!unstyled()',
    role: 'group',
  },
})
export class HellMenuSection extends HellStyleable {}

/** Section / group label rendered above a section's items. */
@Directive({
  selector: '[hellMenuLabel]',
  host: {
    '[class.hell-menu-label]': '!unstyled()',
    role: 'presentation',
  },
})
export class HellMenuLabel extends HellStyleable {}

/** Optional leading-icon slot inside a `[hellMenuItem]`. */
@Directive({
  selector: '[hellMenuItemIcon]',
  host: {
    '[class.hell-menu-item-icon]': '!unstyled()',
    'aria-hidden': 'true',
  },
})
export class HellMenuItemIcon extends HellStyleable {}

/** Trailing slot — kbd hint, chevron, badge, etc. */
@Directive({
  selector: '[hellMenuItemTrailing]',
  host: { '[class.hell-menu-item-trailing]': '!unstyled()' },
})
export class HellMenuItemTrailing extends HellStyleable {}

export const HELL_MENU_DIRECTIVES = [
  HellMenuTrigger,
  HellSubmenuTrigger,
  HellMenu,
  HellMenuItem,
  HellMenuSeparator,
  HellMenuSection,
  HellMenuLabel,
  HellMenuItemIcon,
  HellMenuItemTrailing,
] as const;
