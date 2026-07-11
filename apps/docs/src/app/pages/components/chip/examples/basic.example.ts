import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellChip, HellChipRemove, HellChipSet } from '@hell-ui/angular/chip';

interface Assignee {
  readonly id: number;
  readonly name: string;
}

@Component({
  selector: 'app-chip-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellChipSet, HellChip, HellChipRemove],
  template: `
    <div hellChipSet aria-label="Assigned people">
      @for (assignee of assignees(); track assignee.id) {
        <span hellChip (remove)="remove(assignee.id)">
          {{ assignee.name }}
          <button hellChipRemove></button>
        </span>
      } @empty {
        <span class="text-hell-foreground-muted text-[13px]">No one assigned.</span>
      }
    </div>
  `,
})
export class ChipBasicExample {
  protected readonly assignees = signal<readonly Assignee[]>([
    { id: 1, name: 'Anna Fischer' },
    { id: 2, name: 'Ben Weber' },
    { id: 3, name: 'Cara Lang' },
  ]);

  protected remove(id: number): void {
    this.assignees.update((people) => people.filter((person) => person.id !== id));
  }
}
