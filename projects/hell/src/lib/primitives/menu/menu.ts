import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import type { Signal } from '@angular/core';
import {
  NgpMenu,
  NgpMenuItem,
  NgpMenuTrigger,
  NgpSubmenuTrigger,
  injectSubmenuTriggerState,
} from 'ng-primitives/menu';
import { HELL_OVERLAY_SCOPE } from '../../core/overlay-scope';

@Directive({
  selector: '[hellMenuTrigger]',
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
})
export class HellMenuTrigger {}

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
export class HellSubmenuTrigger {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellMenu]',
  hostDirectives: [NgpMenu],
  host: {
    '[class.hell-menu]': '!unstyled()',
    '[attr.data-submenu]': 'submenuTrigger() ? "true" : null',
  },
})
export class HellMenu {
  readonly unstyled = input(false, { transform: booleanAttribute });
  protected readonly submenuTrigger: Signal<unknown> = injectSubmenuTriggerState({
    optional: true,
  });

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly overlayScope = inject(HELL_OVERLAY_SCOPE, { optional: true });

  constructor() {
    const scope = this.overlayScope;
    if (!scope) return;
    const element = this.host.nativeElement;
    scope.registerOverlayElement(element);
    inject(DestroyRef).onDestroy(() => scope.unregisterOverlayElement(element));
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
  host: { '[class.hell-menu-item]': '!unstyled()' },
})
export class HellMenuItem {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellMenuSeparator]',
  host: {
    '[class.hell-menu-separator]': '!unstyled()',
    role: 'separator',
  },
})
export class HellMenuSeparator {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

/** Section grouping wrapper. Use with `[hellMenuLabel]` for an optional header. */
@Directive({
  selector: '[hellMenuSection]',
  host: {
    '[class.hell-menu-section]': '!unstyled()',
    role: 'group',
  },
})
export class HellMenuSection {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

/** Section / group label rendered above a section's items. */
@Directive({
  selector: '[hellMenuLabel]',
  host: {
    '[class.hell-menu-label]': '!unstyled()',
    role: 'presentation',
  },
})
export class HellMenuLabel {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

/** Optional leading-icon slot inside a `[hellMenuItem]`. */
@Directive({
  selector: '[hellMenuItemIcon]',
  host: {
    '[class.hell-menu-item-icon]': '!unstyled()',
    'aria-hidden': 'true',
  },
})
export class HellMenuItemIcon {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

/** Trailing slot — kbd hint, chevron, badge, etc. */
@Directive({
  selector: '[hellMenuItemTrailing]',
  host: { '[class.hell-menu-item-trailing]': '!unstyled()' },
})
export class HellMenuItemTrailing {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

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
