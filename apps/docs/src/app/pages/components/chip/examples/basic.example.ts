import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellChip,
  HellChipInput,
  HellChipRemove,
  HellChipSet,
} from '@hell-ui/angular/chip';
import { HellControlGroup } from '@hell-ui/angular/control-group';

interface Assignee {
  readonly id: number;
  readonly name: string;
  readonly removable: boolean;
}

@Component({
  selector: 'app-chip-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellControlGroup, HellChipSet, HellChipInput, HellChip, HellChipRemove],
  template: `
    <div class="flex max-w-[32rem] flex-col gap-hell-1">
      <span id="assigned-people-label" class="text-[13px] font-medium text-hell-foreground">
        Assigned people
      </span>
      <div hellControlGroup aria-labelledby="assigned-people-label">
        <div
          hellChipSet
          aria-labelledby="assigned-people-label"
          ui="min-w-0 flex-1 gap-hell-1 px-hell-2 py-hell-1.5"
        >
          @for (assignee of assignees(); track assignee.id) {
            <span hellChip (remove)="remove(assignee.id)">
              {{ assignee.name }}
              @if (assignee.removable) {
                <button hellChipRemove></button>
              }
            </span>
          }
          <input
            hellChipInput
            aria-label="Add assignee"
            placeholder="Add assignee…"
            class="min-w-[8rem] flex-1 border-0 bg-transparent px-hell-1 py-hell-1 font-[family-name:inherit] text-[13px] text-hell-foreground outline-none placeholder:text-hell-foreground-subtle"
            (keydown.enter)="add($event)"
          />
        </div>
      </div>
      <p class="text-xs text-hell-foreground-subtle">
        Type a name and press Enter. On an empty field, Backspace focuses the final removable chip;
        Arrow Left focuses the final enabled chip. Dana is intentionally fixed.
      </p>
    </div>
  `,
})
export class ChipBasicExample {
  protected readonly assignees = signal<readonly Assignee[]>([
    { id: 1, name: 'Anna Fischer', removable: true },
    { id: 2, name: 'Ben Weber', removable: true },
    { id: 3, name: 'Cara Lang', removable: true },
    { id: 4, name: 'Dana Wu', removable: false },
  ]);
  private nextId = 5;

  protected add(event: Event): void {
    const input = event.target as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    event.preventDefault();
    this.assignees.update((people) => [
      ...people,
      { id: this.nextId++, name, removable: true },
    ]);
    input.value = '';
  }

  protected remove(id: number): void {
    this.assignees.update((people) => people.filter((person) => person.id !== id));
  }
}
