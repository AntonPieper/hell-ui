import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChevronDown } from '@ng-icons/font-awesome/solid';
import { HellAvatar } from 'hell-ui/avatar';
import { HELL_AVATAR_GROUP_IMPORTS } from 'hell-ui/avatar';
import { HellIcon } from 'hell-ui/icon';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';
import { HellTooltip } from 'hell-ui/tooltip';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group-with-tooltip-menu-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidChevronDown })],
  imports: [
    ...HELL_AVATAR_GROUP_IMPORTS,
    ...HELL_MENU_IMPORTS,
    HellAvatar,
    HellIcon,
    HellTooltip,
  ],
  template: `
    <ng-template #overflowMenu>
      <div hellMenu aria-label="More team members">
        <div hellMenuLabel>More people</div>
        @for (person of overflowMembers(); track person.name) {
          <button
            hellMenuItemCheckbox
            [checked]="isAssigned(person)"
            (checkedChange)="setAssigned(person, $event)"
            [attr.aria-label]="person.name"
          >
            <hell-avatar
              size="xs"
              [image]="person.image"
              [fallback]="person.initials"
              [alt]="person.name"
            />
            <span>{{ person.name }}</span>
            <span hellMenuItemIndicator class="ms-auto"></span>
          </button>
        }
      </div>
    </ng-template>

    <hell-avatar-group>
      @for (person of visibleMembers(); track person.name) {
        <button
          hellAvatarGroupItem
          type="button"
          [selected]="isAssigned(person)"
          [attr.aria-pressed]="isAssigned(person)"
          [hellTooltip]="person.name"
          placement="top"
          [attr.aria-label]="person.name"
          (click)="toggleAssigned(person)"
        >
          <hell-avatar [image]="person.image" [fallback]="person.initials" [alt]="person.name" />
        </button>
      }
      <button
        hellAvatarGroupOverflow
        type="button"
        [hellMenuTrigger]="overflowMenu"
        placement="bottom-end"
        [attr.aria-label]="overflowMembers().length + ' more team members'"
      >
        +{{ overflowMembers().length }}
        <hell-icon name="faSolidChevronDown" size="10px" />
      </button>
    </hell-avatar-group>
  `,
})
export class AvatarGroupWithTooltipMenuExample {
  private readonly max = 4;

  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
    { name: 'Jules Duran', initials: 'JD', image: 'https://i.pravatar.cc/96?img=14' },
    { name: 'Mina Ortiz', initials: 'MO', image: 'https://i.pravatar.cc/96?img=15' },
    { name: 'Samir Khan', initials: 'SK', image: 'https://i.pravatar.cc/96?img=16' },
  ];

  protected readonly visibleMembers = computed(() => this.team.slice(0, this.max));
  protected readonly overflowMembers = computed(() => this.team.slice(this.max));

  // One assigned set drives both surfaces: the selection ring on visible
  // avatars and the checkmark on overflow menu rows.
  protected readonly assigned = signal<ReadonlySet<string>>(new Set(['Hana Kim', 'Mina Ortiz']));

  protected isAssigned(person: TeamMember): boolean {
    return this.assigned().has(person.name);
  }

  protected setAssigned(person: TeamMember, assigned: boolean): void {
    this.assigned.update((current) => {
      const next = new Set(current);
      if (assigned) {
        next.add(person.name);
      } else {
        next.delete(person.name);
      }
      return next;
    });
  }

  protected toggleAssigned(person: TeamMember): void {
    this.setAssigned(person, !this.isAssigned(person));
  }
}
