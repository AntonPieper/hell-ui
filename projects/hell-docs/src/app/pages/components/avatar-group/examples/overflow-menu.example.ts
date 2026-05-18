import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChevronDown, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_AVATAR_GROUP_DIRECTIVES } from '@hell-ui/angular/avatar-group';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}
@Component({
  selector: 'app-avatar-group-overflow-menu-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellCheckbox,
    HellIcon,
    ...HELL_AVATAR_GROUP_DIRECTIVES,
    ...HELL_MENU_DIRECTIVES,
    HellAvatar,
  ],
  providers: [provideIcons({ faSolidChevronDown, faSolidUsers })],
  template: `
    <ng-template #overflowMenu>
      <div hellMenu class="hd-avatar-menu">
        <div hellMenuLabel>
          <span class="hd-avatar-menu-label">
            <hell-icon name="faSolidUsers" />
            More people
          </span>
        </div>

        @for (person of overflowPeople(); track person.name) {
          <div
            hellMenuItem
            class="hd-avatar-menu-row"
            role="menuitemcheckbox"
            tabindex="0"
            [closeOnSelect]="false"
            [attr.aria-checked]="isSelected(person)"
            (click)="toggleSelected(person)"
            (keydown.enter)="toggleSelected(person)"
            (keydown.space)="toggleSelected(person); $event.preventDefault()"
          >
            <hell-avatar
              size="sm"
              [image]="person.image"
              [fallback]="person.initials"
              [alt]="person.name"
            />
            <span class="hd-avatar-menu-name">{{ person.name }}</span>
            <button
              hellCheckbox
              [checked]="isSelected(person)"
              tabindex="-1"
              [attr.aria-label]="'Select ' + person.name"
              (click)="toggleSelected(person); $event.stopPropagation()"
            ></button>
          </div>
        }
      </div>
    </ng-template>

    <hell-avatar-group size="lg" class="hd-avatar-group-lg">
      @for (person of visiblePeople(); track person.name) {
        <button
          hellAvatarGroupItem
          type="button"
          class="hd-avatar-group-action"
          [selected]="isSelected(person)"
          [attr.aria-label]="person.name"
          (click)="toggleFromAvatar(person)"
        >
          <hell-avatar
            size="lg"
            [image]="person.image"
            [fallback]="person.initials"
            [alt]="person.name"
          />
        </button>
      }
      <button
        hellAvatarGroupOverflow
        type="button"
        class="hd-avatar-group-action hd-avatar-menu-trigger"
        [hellMenuTrigger]="overflowMenu"
        placement="bottom-start"
        [attr.aria-label]="overflowPeople().length + ' more people'"
      >
        +{{ overflowPeople().length }}
        <hell-icon name="faSolidChevronDown" size="10px" />
      </button>
    </hell-avatar-group>
  `,
})
export class AvatarGroupOverflowMenuExample {
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
