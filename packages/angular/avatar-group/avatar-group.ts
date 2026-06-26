import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  input,
} from '@angular/core';
import { HellSize } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';

/**
 * Stacked avatar container.
 *
 * This component owns only layout and shared styling variables. Consumers
 * project `hell-avatar`, buttons, menu triggers, or any other avatar-like
 * content and wire interactions where they are used.
 */
@Component({
  selector: 'hell-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-avatar-group]': '!unstyled()',
    '[attr.data-size]': 'size()',
  },
  template: `<ng-content />`,
})
export class HellAvatarGroup extends HellStyleable {
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellAvatarGroupItem]',
  host: {
    '[class.hell-avatar-group-item]': '!unstyled()',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
})
export class HellAvatarGroupItem extends HellStyleable {
  readonly selected = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellAvatarGroupOverflow]',
  host: {
    '[class.hell-avatar-group-overflow]': '!unstyled()',
  },
})
export class HellAvatarGroupOverflow extends HellStyleable {}

export const HELL_AVATAR_GROUP_DIRECTIVES = [
  HellAvatarGroup,
  HellAvatarGroupItem,
  HellAvatarGroupOverflow,
] as const;
