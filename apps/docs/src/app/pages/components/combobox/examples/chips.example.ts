import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES, type HellComboboxValue } from '@hell-ui/angular/combobox';

const GROUPS = [
  'Administrators',
  'Billing',
  'Dispatch',
  'Engineering',
  'On-call',
  'Reporting',
  'Supervisors',
  'Support',
];

@Component({
  selector: 'app-combobox-chips-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div class="flex max-w-96 flex-col gap-hell-1">
      <span id="assign-groups-label" class="text-[13px] font-medium text-hell-foreground">
        Assign groups
      </span>
      <div
        hellCombobox
        multiple
        [value]="selected()"
        (valueChange)="onValueChange($event)"
        [ui]="{ root: 'h-auto min-h-hell-control-md flex-wrap gap-hell-1 py-hell-1' }"
      >
        <div hellComboboxChips></div>
        <input
          hellComboboxInput
          class="min-w-[6rem]"
          aria-label="Assign groups"
          placeholder="Add a group…"
          (input)="filter.set(($any($event.target).value ?? '').toLowerCase())"
        />
        <button hellComboboxButton type="button" aria-label="Toggle groups"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (group of filtered(); track group) {
            <div hellComboboxOption [value]="group">{{ group }}</div>
          } @empty {
            <div hellComboboxEmpty>No groups match</div>
          }
        </div>
      </div>
      <p class="text-xs text-hell-foreground-subtle">
        Shift+Tab into the chips, move with Arrow keys, and press Delete or Backspace to remove the
        focused group. Backspace in the empty field removes the last group; each × removes just that
        group.
      </p>
    </div>
  `,
})
export class ComboboxChipsExample {
  protected readonly selected = signal<readonly string[]>(['Dispatch', 'On-call']);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const query = this.filter().trim();
    return query ? GROUPS.filter((group) => group.toLowerCase().includes(query)) : GROUPS;
  });

  protected onValueChange(next: HellComboboxValue<string>): void {
    this.selected.set(Array.isArray(next) ? next : []);
  }
}
