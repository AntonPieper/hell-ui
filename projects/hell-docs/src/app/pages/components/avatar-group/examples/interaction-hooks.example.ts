import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChevronDown, faSolidUsers } from '@ng-icons/font-awesome/solid';
import {
  HELL_MENU_DIRECTIVES,
  HellAvatar,
  HellCheckbox,
  HellIcon,
} from 'hell/primitives';
import { HELL_AVATAR_GROUP_DIRECTIVES } from 'hell/composites';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}
@Component({
  selector: 'app-avatar-group-interaction-hooks-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES, HellAvatar],
  providers: [provideIcons({ faSolidChevronDown, faSolidUsers })],
  template: `
    <hell-avatar-group class="hd-avatar-group-pad">
      @for (person of team.slice(0, 3); track person.name) {
        <button
          hellAvatarGroupItem
          type="button"
          class="hd-avatar-group-action"
          [selected]="isSelected(person)"
          [attr.aria-label]="person.name"
          (click)="toggleFromAvatar(person)"
        >
          <hell-avatar [image]="person.image" [fallback]="person.initials" [alt]="person.name" />
        </button>
      }
      <button
        hellAvatarGroupOverflow
        type="button"
        class="hd-avatar-group-action"
        aria-label="Show overflow count"
        (click)="lastAction.set('2 overflow avatars available.')"
      >
        +2
      </button>
    </hell-avatar-group>
    <p class="hd-note">{{ lastAction() }}</p>
  `,
})
export class AvatarGroupInteractionHooksExample {
  protected readonly max = 4;

  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
    { name: 'Jules Duran', initials: 'JD', image: 'https://i.pravatar.cc/96?img=14' },
    { name: 'Mina Ortiz', initials: 'MO', image: 'https://i.pravatar.cc/96?img=15' },
    { name: 'Samir Khan', initials: 'SK', image: 'https://i.pravatar.cc/96?img=16' },
    { name: 'Riley Green', initials: 'RG', image: 'https://i.pravatar.cc/96?img=17' },
  ];

  protected readonly visiblePeople = computed(() => this.team.slice(0, this.max));
  protected readonly overflowPeople = computed(() => this.team.slice(this.max));
  protected readonly selected = signal(new Set(['Hana Kim']));
  protected readonly lastAction = signal('Click an avatar or the overflow badge.');

  protected isSelected(person: TeamMember): boolean {
    return this.selected().has(person.name);
  }

  protected toggleFromAvatar(person: TeamMember): void {
    this.toggleSelected(person);
    this.lastAction.set(`${person.name} selection toggled.`);
  }

  protected toggleSelected(person: TeamMember): void {
    this.selected.update((selected) => {
      const next = new Set(selected);
      if (next.has(person.name)) {
        next.delete(person.name);
      } else {
        next.add(person.name);
      }
      return next;
    });
  }
}
