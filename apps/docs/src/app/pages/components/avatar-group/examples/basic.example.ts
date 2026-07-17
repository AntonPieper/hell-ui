import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_AVATAR_GROUP_IMPORTS } from '@hell-ui/angular/avatar';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_AVATAR_GROUP_IMPORTS, HellAvatar],
  template: `
    <hell-avatar-group>
      @for (person of team; track person.name) {
        <hell-avatar
          hellAvatarGroupItem
          [image]="person.image"
          [fallback]="person.initials"
          [alt]="person.name"
        />
      }
      <span hellAvatarGroupOverflow>+3</span>
    </hell-avatar-group>
  `,
})
export class AvatarGroupBasicExample {
  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
  ];
}
