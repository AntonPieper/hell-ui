import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_IMPORTS } from '@hell-ui/angular/combobox';
import { hellSearchResource } from '@hell-ui/angular/core';

interface Priority {
  readonly id: string;
  readonly label: string;
}

const PRIORITIES: readonly Priority[] = (
  ['Blocker', 'Critical', 'High', 'Medium', 'Low'] as const
).map((label) => ({ id: label.toLocaleLowerCase(), label }));

@Component({
  selector: 'app-combobox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_IMPORTS],
  template: `
    <div
      hellCombobox
      class="max-w-72"
      ui="h-hell-control-lg rounded-hell-xl border-hell-primary bg-hell-primary-soft font-medium data-focus:shadow-[0_0_0_3px_var(--color-hell-primary-soft)]"
      [options]="priorityOptions()"
      [value]="value()"
      [compareWith]="comparePriority"
      (valueChange)="select($any($event))"
    >
      <input
        hellComboboxInput
        aria-label="Priority"
        placeholder="Set priority…"
        ui="text-hell-primary-soft-foreground placeholder:text-hell-primary/70"
        [value]="prioritySearch.query()"
        (input)="prioritySearch.query.set($any($event.target).value ?? '')"
      />
      <button
        hellComboboxButton
        type="button"
        aria-label="Toggle priorities"
        ui="w-hell-control-lg text-hell-primary data-hover:text-hell-primary-hover"
      ></button>
      <div
        *hellComboboxPortal
        hellComboboxDropdown
        ui="gap-hell-1 rounded-hell-xl border-hell-primary bg-hell-surface p-hell-2 shadow-hell-lg"
      >
        @for (priority of priorityOptions(); track priority.id) {
          <div
            hellComboboxOption
            ui="rounded-hell-lg data-active:bg-hell-primary-soft data-selected:bg-hell-primary data-selected:text-hell-foreground-inverse"
            [value]="priority"
          >
            {{ priority.label }}
          </div>
        } @empty {
          <div hellComboboxEmpty ui="text-hell-danger">No priority matches</div>
        }
      </div>
    </div>
  `,
})
export class ComboboxStylingExample {
  protected readonly value = signal<Priority | null>(null);
  protected readonly query = signal('');
  protected readonly prioritySearch = hellSearchResource({
    query: this.query,
    items: PRIORITIES,
    fields: [{ get: (priority) => priority.label }],
  });
  protected readonly priorityOptions = computed(() => [...this.prioritySearch.items()]);
  protected readonly comparePriority = (
    left: Priority | null,
    right: Priority | null,
  ): boolean => left?.id === right?.id;

  protected select(priority: Priority | null): void {
    this.value.set(priority);
    this.query.set(priority?.label ?? '');
  }
}
