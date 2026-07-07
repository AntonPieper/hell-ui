import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import {
  HELL_AVATAR_GROUP_DIRECTIVES,
  type HellAvatarGroupItemUi,
  type HellAvatarGroupOverflowUi,
  type HellAvatarGroupUi,
} from '@hell-ui/angular/avatar-group';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES, HellAvatar],
  template: `
    <hell-avatar-group [ui]="groupUi">
      @for (person of team; track person.name) {
        <hell-avatar
          hellAvatarGroupItem
          [ui]="itemUi"
          [image]="person.image"
          [fallback]="person.initials"
          [alt]="person.name"
        />
      }
      <span hellAvatarGroupOverflow [ui]="overflowUi">+2</span>
    </hell-avatar-group>
  `,
})
export class AvatarGroupStylingExample {
  protected readonly groupUi: HellAvatarGroupUi = {
    root: 'rounded-hell-md bg-hell-surface-subtle p-hell-2',
  };

  protected readonly itemUi: HellAvatarGroupItemUi = {
    root: 'rounded-hell-md',
  };

  protected readonly overflowUi: HellAvatarGroupOverflowUi = {
    root: 'rounded-hell-md border-hell-primary bg-hell-primary text-hell-foreground-inverse',
  };

  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
  ];
}
