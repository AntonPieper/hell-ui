import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_CHIP_IMPORTS } from 'hell-ui/chip';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { hellSearchResource, type HellPickValue } from 'hell-ui/core';

interface Group {
  readonly id: string;
  readonly name: string;
}

const GROUPS: readonly Group[] = [
  { id: 'administrators', name: 'Administrators' },
  { id: 'billing', name: 'Billing' },
  { id: 'dispatch', name: 'Dispatch' },
  { id: 'engineering', name: 'Engineering' },
  { id: 'on-call', name: 'On-call' },
  { id: 'reporting', name: 'Reporting' },
  { id: 'supervisors', name: 'Supervisors' },
  { id: 'support', name: 'Support' },
];

@Component({
  selector: 'app-combobox-chips-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_COMBOBOX_IMPORTS,
    ...HELL_CHIP_IMPORTS,
    ...HELL_CONTROL_GROUP_IMPORTS,
  ],
  template: `
    <div class="flex max-w-96 flex-col gap-hell-1">
      <span id="assign-groups-label" class="text-[13px] font-medium text-hell-foreground">
        Assign groups
      </span>
      <div hellControlGroup>
        <div
          hellCombobox
          multiple
          ui="h-auto min-h-hell-control-md flex-1 flex-wrap gap-hell-1 rounded-none border-0 bg-transparent py-hell-1 ps-hell-2 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
          [options]="groupOptions()"
          [value]="selected()"
          [compareWith]="compareGroup"
          (valueChange)="onValueChange($event)"
        >
          <div hellChipSet ui="contents" aria-label="Assigned groups">
            @for (group of selected(); track group.id) {
              <span hellChip size="sm" (remove)="remove(group)">
                {{ group.name }}<button hellChipRemove></button>
              </span>
            }
            <input
              hellComboboxInput
              hellChipInput
              class="min-w-[6rem]"
              aria-label="Assign groups"
              placeholder="Add a group…"
              [value]="groupSearch.query()"
              (input)="groupSearch.query.set($any($event.target).value ?? '')"
            />
            <button hellComboboxButton type="button" aria-label="Toggle groups"></button>
            <div *hellComboboxPortal hellComboboxDropdown>
              @for (group of groupOptions(); track group.id) {
                <div hellComboboxOption [value]="group">{{ group.name }}</div>
              } @empty {
                <div hellComboboxEmpty>No groups match</div>
              }
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs text-hell-foreground-subtle">
        Backspace in the empty field focuses the last removable chip; press it again to remove.
        Arrow keys move chip focus, and each × removes only its own group.
      </p>
    </div>
  `,
})
export class ComboboxChipsExample {
  protected readonly selected = signal<readonly Group[]>([GROUPS[2], GROUPS[4]]);
  protected readonly query = signal('');
  protected readonly groupSearch = hellSearchResource({
    query: this.query,
    items: GROUPS,
    fields: [{ get: (group) => group.name }],
  });
  protected readonly groupOptions = computed(() => [...this.groupSearch.items()]);
  protected readonly compareGroup = (left: Group, right: Group): boolean => left.id === right.id;

  protected onValueChange(next: HellPickValue<Group>): void {
    this.selected.set(Array.isArray(next) ? next : []);
    this.query.set('');
  }

  protected remove(group: Group): void {
    this.selected.update((selected) => selected.filter((item) => item.id !== group.id));
  }
}
