import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChevronDown } from '@ng-icons/font-awesome/solid';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_AVATAR_GROUP_IMPORTS } from '@hell-ui/angular/avatar';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HellTooltip, HellTooltipTrigger } from '@hell-ui/angular/tooltip';

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
    HellTooltipTrigger,
  ],
  template: `
    <ng-template #overflowMenu>
      <div hellMenu aria-label="Remaining assignees">
        <div hellMenuLabel>Also assigned</div>
        @for (person of overflowAssignees(); track person.name) {
          <button hellMenuItem type="button" (click)="focused.set(person.name)">
            {{ person.name }}
          </button>
        }
      </div>
    </ng-template>

    <hell-avatar-group>
      @for (person of visibleAssignees(); track person.name) {
        <ng-template #assigneeHint>
          <span hellTooltip>{{ person.name }}</span>
        </ng-template>
        <button
          hellAvatarGroupItem
          type="button"
          [selected]="focused() === person.name"
          [hellTooltipTrigger]="assigneeHint"
          placement="top"
          [attr.aria-label]="person.name"
          (click)="focused.set(person.name)"
        >
          <hell-avatar [image]="person.image" [fallback]="person.initials" [alt]="person.name" />
        </button>
      }
      <button
        hellAvatarGroupOverflow
        type="button"
        [hellMenuTrigger]="overflowMenu"
        placement="bottom-end"
        [attr.aria-label]="overflowAssignees().length + ' more assignees'"
      >
        +{{ overflowAssignees().length }}
        <hell-icon name="faSolidChevronDown" size="10px" />
      </button>
    </hell-avatar-group>
  `,
})
export class AvatarGroupWithTooltipMenuExample {
  private readonly max = 4;

  protected readonly assignees: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
    { name: 'Jules Duran', initials: 'JD', image: 'https://i.pravatar.cc/96?img=14' },
    { name: 'Mina Ortiz', initials: 'MO', image: 'https://i.pravatar.cc/96?img=15' },
    { name: 'Samir Khan', initials: 'SK', image: 'https://i.pravatar.cc/96?img=16' },
  ];

  protected readonly visibleAssignees = computed(() => this.assignees.slice(0, this.max));
  protected readonly overflowAssignees = computed(() => this.assignees.slice(this.max));
  protected readonly focused = signal(this.assignees[0].name);
}
