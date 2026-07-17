import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_CHIP_IMPORTS } from '@hell-ui/angular/chip';
import { HELL_COMBOBOX_IMPORTS } from '@hell-ui/angular/combobox';
import { hellSearchResource, type HellPickValue } from '@hell-ui/angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

interface Reviewer {
  readonly id: string;
  readonly name: string;
  readonly team: string;
}

const REVIEWERS: readonly Reviewer[] = [
  { id: 'ada', name: 'Ada Lovelace', team: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', team: 'Compiler' },
  { id: 'katherine', name: 'Katherine Johnson', team: 'Flight' },
  { id: 'margaret', name: 'Margaret Hamilton', team: 'Flight' },
  { id: 'radia', name: 'Radia Perlman', team: 'Network' },
  { id: 'barbara', name: 'Barbara Liskov', team: 'Platform' },
];

@Component({
  selector: 'app-combobox-with-field-tag-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_IMPORTS, ...HELL_FIELD_IMPORTS, ...HELL_CHIP_IMPORTS],
  template: `
    <div hellField class="max-w-96">
      <label hellFieldLabel for="mr-reviewers">Reviewers</label>

      <div
        hellCombobox
        multiple
        [options]="reviewerOptions()"
        [value]="selected()"
        [compareWith]="compareReviewer"
        (valueChange)="onValueChange($event)"
      >
        <input
          id="mr-reviewers"
          hellComboboxInput
          placeholder="Search teammates…"
          [value]="reviewerSearch.query()"
          (input)="reviewerSearch.query.set($any($event.target).value ?? '')"
        />
        <button hellComboboxButton type="button" aria-label="Toggle reviewers"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (reviewer of reviewerOptions(); track reviewer.id) {
            <div hellComboboxOption [value]="reviewer">
              <strong>{{ reviewer.name }}</strong>
              <span class="ms-auto text-xs text-hell-foreground-subtle">{{ reviewer.team }}</span>
            </div>
          } @empty {
            <div hellComboboxEmpty>No teammates match</div>
          }
        </div>
      </div>

      <div hellFieldDescription>At least one reviewer must approve before merge.</div>

      @if (selected().length) {
        <div hellChipSet class="mt-hell-2" aria-label="Selected reviewers">
          @for (reviewer of selected(); track reviewer.id) {
            <span hellChip variant="info" [label]="reviewer.name" (remove)="remove(reviewer)">
              {{ reviewer.name }}<button hellChipRemove></button>
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class ComboboxWithFieldTagExample {
  protected readonly selected = signal<readonly Reviewer[]>([REVIEWERS[1]]);
  protected readonly query = signal('');
  protected readonly reviewerSearch = hellSearchResource({
    query: this.query,
    items: REVIEWERS,
    fields: [
      { weight: 3, get: (reviewer) => reviewer.name },
      { weight: 1, get: (reviewer) => reviewer.team },
    ],
  });
  protected readonly reviewerOptions = computed(() => [...this.reviewerSearch.items()]);
  protected readonly compareReviewer = (left: Reviewer, right: Reviewer): boolean =>
    left.id === right.id;

  protected onValueChange(next: HellPickValue<Reviewer>): void {
    this.selected.set(Array.isArray(next) ? next : []);
    this.query.set('');
  }

  protected remove(reviewer: Reviewer): void {
    this.selected.update((selected) => selected.filter((item) => item.id !== reviewer.id));
  }
}
