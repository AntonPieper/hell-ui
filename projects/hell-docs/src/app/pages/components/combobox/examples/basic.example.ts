import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/primitives';

const FRUITS = [
  'Apple',
  'Apricot',
  'Banana',
  'Blackberry',
  'Blueberry',
  'Cherry',
  'Date',
  'Fig',
  'Grape',
  'Lemon',
  'Mango',
  'Orange',
  'Peach',
  'Pear',
  'Pineapple',
  'Plum',
  'Raspberry',
  'Strawberry',
];

@Component({
  selector: 'app-combobox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      hellCombobox
      [value]="value()"
      (valueChange)="onValueChange($event)"
      (openChange)="onOpenChange($event)"
      style="max-width: 240px"
    >
      <input
        hellComboboxInput
        placeholder="Search fruit…"
        [value]="filter()"
        (input)="filter.set($any($event.target).value ?? '')"
      />
      <button hellComboboxButton type="button" aria-label="Toggle options"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        @for (option of filtered(); track option) {
          <div hellComboboxOption [value]="option">{{ option }}</div>
        } @empty {
          <div hellComboboxEmpty>No matches</div>
        }
      </div>
    </div>
  `,
})
export class ComboboxBasicExample {
  protected readonly value = signal<string | null>(null);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter().toLowerCase();
    return q ? FRUITS.filter((f) => f.toLowerCase().includes(q)) : FRUITS;
  });

  protected onValueChange(next: string | null) {
    this.value.set(next);
    this.filter.set(next ?? '');
  }

  protected onOpenChange(open: boolean) {
    if (open) return;
    this.filter.set(this.value() ?? '');
  }
}
