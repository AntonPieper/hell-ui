import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HELL_AVATAR_GROUP_DIRECTIVES } from '@hell-ui/angular/avatar-group';

interface TeamMember {
  name: string;
  initials: string;
  image: string;
}

@Component({
  selector: 'app-avatar-group-selection-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_AVATAR_GROUP_DIRECTIVES, HellAvatar],
  template: `
    <hell-avatar-group>
      @for (person of team; track person.name) {
        <button
          hellAvatarGroupItem
          type="button"
          [selected]="isSelected(person)"
          [attr.aria-pressed]="isSelected(person)"
          [attr.aria-label]="person.name"
          (click)="toggle(person)"
        >
          <hell-avatar [image]="person.image" [fallback]="person.initials" [alt]="person.name" />
        </button>
      }
    </hell-avatar-group>
    <p class="hd-note">{{ selected().size }} of {{ team.length }} filters active.</p>
  `,
})
export class AvatarGroupSelectionExample {
  protected readonly team: readonly TeamMember[] = [
    { name: 'Hana Kim', initials: 'HK', image: 'https://i.pravatar.cc/96?img=11' },
    { name: 'Ari Patel', initials: 'AP', image: 'https://i.pravatar.cc/96?img=12' },
    { name: 'Bea Santos', initials: 'BS', image: 'https://i.pravatar.cc/96?img=13' },
    { name: 'Jules Duran', initials: 'JD', image: 'https://i.pravatar.cc/96?img=14' },
  ];

  protected readonly selected = signal(new Set(['Hana Kim']));

  protected isSelected(person: TeamMember): boolean {
    return this.selected().has(person.name);
  }

  protected toggle(person: TeamMember): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (next.has(person.name)) {
        next.delete(person.name);
      } else {
        next.add(person.name);
      }
      return next;
    });
  }
}
