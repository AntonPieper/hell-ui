import { DestroyRef, Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import type { Signal } from '@angular/core';
import {
  NgpMenu,
  NgpMenuItem,
  NgpMenuTrigger,
  NgpSubmenuTrigger,
  injectSubmenuTriggerState,
} from 'ng-primitives/menu';
import { HELL_FLOATING_SCOPE, hellRegisterFloatingElement } from '../../core/overlay-scope';
import { HellStyleable } from '../../core/styleable';

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

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly floatingScope = inject(HELL_FLOATING_SCOPE, { optional: true });

  constructor() {
    super();
    hellRegisterFloatingElement(this.floatingScope, this.host.nativeElement, inject(DestroyRef));
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
export class HellMenuItem extends HellStyleable {}

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
