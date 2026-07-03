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
  /** Size applied to the group and its projected avatars. Defaults to `md`. */
  readonly size = input<HellSize>('md');
}

/** Marks a single projected avatar as a member of the group, applying stacking and selection styling. */
@Directive({
  selector: '[hellAvatarGroupItem]',
  host: {
    '[class.hell-avatar-group-item]': '!unstyled()',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
})
export class HellAvatarGroupItem extends HellStyleable {
  /** Marks the item as selected, applying the selected styling. Defaults to `false`. */
  readonly selected = input(false, { transform: booleanAttribute });
}

/** Marker for the overflow indicator (e.g. "+3") shown at the end of the avatar stack. */
@Directive({
  selector: '[hellAvatarGroupOverflow]',
  host: {
    '[class.hell-avatar-group-overflow]': '!unstyled()',
  },
})
export class HellAvatarGroupOverflow extends HellStyleable {}

/** All directives that make up the avatar-group entry point, for bulk `imports`. */
export const HELL_AVATAR_GROUP_DIRECTIVES = [
  HellAvatarGroup,
  HellAvatarGroupItem,
  HellAvatarGroupOverflow,
] as const;
