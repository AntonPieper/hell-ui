import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_CHIP_IMPORTS } from '@hell-ui/angular/chip';
import { HELL_COMBOBOX_IMPORTS } from '@hell-ui/angular/combobox';
import { hellSearchResource, type HellPickValue } from '@hell-ui/angular/core';

interface IssueLabel {
  readonly id: string;
  readonly name: string;
}

const LABELS: readonly IssueLabel[] = [
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
].map((name) => ({ id: name, name }));

@Component({
  selector: 'app-combobox-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_IMPORTS, ...HELL_CHIP_IMPORTS],
  template: `
    <div class="flex max-w-80 flex-col gap-hell-2">
      <div
        hellCombobox
        multiple
        [options]="labelOptions()"
        [value]="selected()"
        [compareWith]="compareLabel"
        (valueChange)="onValueChange($event)"
      >
        <input
          hellComboboxInput
          aria-label="Issue labels"
          placeholder="Add labels…"
          [value]="labelSearch.query()"
          (input)="labelSearch.query.set($any($event.target).value ?? '')"
        />
        <button hellComboboxButton type="button" aria-label="Toggle labels"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (label of labelOptions(); track label.id) {
            <div hellComboboxOption [value]="label">{{ label.name }}</div>
          } @empty {
            <div hellComboboxEmpty>No labels match</div>
          }
        </div>
      </div>

      <div hellChipSet aria-label="Applied labels">
        @for (label of selected(); track label.id) {
          <span hellChip variant="primary">{{ label.name }}</span>
        } @empty {
          <span class="text-xs text-hell-foreground-subtle">No labels applied</span>
        }
      </div>
    </div>
  `,
})
export class ComboboxMultipleExample {
  protected readonly selected = signal<readonly IssueLabel[]>([]);
  protected readonly query = signal('');
  protected readonly labelSearch = hellSearchResource({
    query: this.query,
    items: LABELS,
    fields: [{ get: (label) => label.name }],
  });
  protected readonly labelOptions = computed(() => [...this.labelSearch.items()]);
  protected readonly compareLabel = (left: IssueLabel, right: IssueLabel): boolean =>
    left.id === right.id;

  protected onValueChange(next: HellPickValue<IssueLabel>): void {
    this.selected.set(Array.isArray(next) ? next : []);
    this.query.set('');
  }
}
