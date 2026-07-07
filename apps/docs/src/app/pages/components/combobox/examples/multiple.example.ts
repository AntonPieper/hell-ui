import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES, type HellComboboxValue } from '@hell-ui/angular/combobox';
import { HellTag } from '@hell-ui/angular/tag';

const LABELS = [
  'billing',
  'bug',
  'compliance',
  'design',
  'docs',
  'infra',
  'onboarding',
  'performance',
  'security',
  'support',
];

@Component({
  selector: 'app-combobox-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES, HellTag],
  template: `
    <div class="flex max-w-80 flex-col gap-hell-2">
      <div hellCombobox multiple [value]="selected()" (valueChange)="onValueChange($event)">
        <input
          hellComboboxInput
          aria-label="Issue labels"
          placeholder="Add labels…"
          (input)="filter.set(($any($event.target).value ?? '').toLowerCase())"
        />
        <button hellComboboxButton type="button" aria-label="Toggle labels"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (option of filtered(); track option) {
            <div hellComboboxOption [value]="option">{{ option }}</div>
          } @empty {
            <div hellComboboxEmpty>No labels match</div>
          }
        </div>
      </div>

      <div class="flex flex-wrap gap-hell-1">
        @for (label of selected(); track label) {
          <span hellTag variant="primary">{{ label }}</span>
        } @empty {
          <span class="text-xs text-hell-foreground-subtle">No labels applied</span>
        }
      </div>
    </div>
  `,
})
export class ComboboxMultipleExample {
  protected readonly selected = signal<readonly string[]>([]);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter().trim();
    return q ? LABELS.filter((l) => l.includes(q)) : LABELS;
  });

  protected onValueChange(next: HellComboboxValue<string>): void {
    this.selected.set(Array.isArray(next) ? next : []);
  }
}
