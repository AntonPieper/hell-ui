import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpMenu, NgpMenuItem, NgpMenuTrigger } from 'ng-primitives/menu';

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
      ],
    },
  ],
})
export class HellMenuTrigger {}

@Directive({
  selector: '[hellMenu]',
  hostDirectives: [NgpMenu],
  host: {
    '[class.hell-menu]': '!unstyled()',
  },
})
export class HellMenu {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'button[hellMenuItem], a[hellMenuItem]',
  hostDirectives: [{ directive: NgpMenuItem, inputs: ['ngpMenuItemDisabled:disabled'] }],
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

export const HELL_MENU_DIRECTIVES = [
  HellMenuTrigger,
  HellMenu,
  HellMenuItem,
  HellMenuSeparator,
] as const;
