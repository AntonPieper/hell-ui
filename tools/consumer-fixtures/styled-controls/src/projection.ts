import { Component, computed, signal } from '@angular/core';
import { HELL_CHIP_IMPORTS } from 'hell-ui/chip';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { hellSearchResource, type HellPickValue } from 'hell-ui/core';

interface Group {
  readonly id: string;
  readonly name: string;
}

const GROUPS: readonly Group[] = [
  { id: 'dispatch', name: 'Dispatch' },
  { id: 'on-call', name: 'On-call' },
  { id: 'support', name: 'Support' },
];

// Combobox projects domain options and composes the public Search Resource,
// Control Group, and Chip Input contracts from the packed tarball.
@Component({
  selector: 'app-combobox-projection',
  imports: [...HELL_CHIP_IMPORTS, ...HELL_COMBOBOX_IMPORTS, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div hellControlGroup data-test-id="combobox-projection">
      <div
        hellCombobox
        multiple
        ui="h-auto min-h-hell-control-md flex-1 flex-wrap gap-hell-1 rounded-none border-0 bg-transparent py-hell-1 ps-hell-2 pe-0 shadow-none"
        [options]="options()"
        [value]="selected()"
        [compareWith]="compareGroup"
        (valueChange)="onValueChange($event)"
      >
        <div hellChipSet ui="contents" aria-label="Assigned groups">
          @for (group of selected(); track group.id) {
            <span hellChip (remove)="remove(group)">
              {{ group.name }}<button hellChipRemove></button>
            </span>
          }
          <input
            hellComboboxInput
            hellChipInput
            aria-label="Assign groups"
            [value]="search.query()"
            (input)="search.query.set($any($event.target).value ?? '')"
          />
          <button hellComboboxButton type="button" aria-label="Toggle groups"></button>
          <div *hellComboboxPortal hellComboboxDropdown>
            @for (group of options(); track group.id) {
              <div hellComboboxOption [value]="group">{{ group.name }}</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ComboboxProjection {
  protected readonly selected = signal<readonly Group[]>([GROUPS[0]!, GROUPS[1]!]);
  protected readonly query = signal('');
  protected readonly search = hellSearchResource({
    query: this.query,
    items: GROUPS,
    fields: [{ get: (group) => group.name }],
  });
  protected readonly options = computed(() => [...this.search.items()]);
  protected readonly compareGroup = (left: Group, right: Group): boolean => left.id === right.id;

  protected onValueChange(next: HellPickValue<Group>): void {
    this.selected.set(Array.isArray(next) ? next : []);
    this.query.set('');
  }

  protected remove(group: Group): void {
    this.selected.update((selected) => selected.filter((item) => item.id !== group.id));
  }
}
