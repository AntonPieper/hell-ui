import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES, HellTag } from 'hell';

const TAGS = [
  'angular',
  'cdk',
  'tailwind',
  'typescript',
  'rxjs',
  'signals',
  'forms',
  'a11y',
  'router',
  'ssr',
];

@Component({
  selector: 'app-combobox-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES, HellTag],
  template: `
    <div style="display:flex; flex-direction:column; gap: 8px; max-width: 320px">
      <div
        hellCombobox
        multiple
        [value]="selected()"
        (valueChange)="selected.set($event)"
      >
        <input
          hellComboboxInput
          placeholder="Add tags…"
          (input)="filter.set(($any($event.target).value ?? '').toLowerCase())"
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

      <div style="display:flex; gap: 4px; flex-wrap: wrap">
        @for (tag of selected(); track tag) {
          <span hellTag variant="primary">{{ tag }}</span>
        }
      </div>
    </div>
  `,
})
export class ComboboxMultipleExample {
  protected readonly selected = signal<string[]>([]);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter();
    return q ? TAGS.filter((t) => t.toLowerCase().includes(q)) : TAGS;
  });
}
