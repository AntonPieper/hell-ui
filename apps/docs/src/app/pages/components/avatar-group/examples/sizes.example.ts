import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_AVATAR_GROUP_IMPORTS } from '@hell-ui/angular/avatar';
import { HellSize } from '@hell-ui/angular/core';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_AVATAR_GROUP_IMPORTS, HellAvatar],
  template: `
    @for (size of sizes; track size) {
      <hell-avatar-group [size]="size">
        @for (person of team; track person.name) {
          <hell-avatar
            hellAvatarGroupItem
            [size]="size"
            [image]="person.image"
            [fallback]="person.initials"
            [alt]="person.name"
          />
        }
        <span hellAvatarGroupOverflow>+2</span>
      </hell-avatar-group>
    }
  `,
})
export class AvatarGroupSizesExample {
  protected readonly sizes: readonly HellSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
  ];
}
