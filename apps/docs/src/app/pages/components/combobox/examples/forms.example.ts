import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { hellSearchResource } from 'hell-ui/core';

const REGIONS = ['Berlin', 'Frankfurt', 'Hamburg', 'Munich'];

@Component({
  selector: 'app-combobox-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, ...HELL_COMBOBOX_IMPORTS],
  template: `
    <div
      hellCombobox
      class="max-w-72"
      [options]="regionOptions()"
      [formField]="datacenterForm.region"
      (valueChange)="syncQuery($any($event))"
    >
      <input
        hellComboboxInput
        aria-label="Datacenter region"
        placeholder="Search region…"
        [value]="regionSearch.query()"
        (input)="regionSearch.query.set($any($event.target).value ?? '')"
      />
      <button hellComboboxButton type="button" aria-label="Toggle regions"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        @for (region of regionOptions(); track region) {
          <div hellComboboxOption [value]="region">{{ region }}</div>
        } @empty {
          <div hellComboboxEmpty>No region matches</div>
        }
      </div>
    </div>
    <p class="m-0 mt-hell-3 text-hell-sm text-hell-foreground-muted">
      The committed value is the field's; the search text stays interaction state. Selected:
      <code>{{ datacenterForm.region().value() ?? 'none' }}</code> · Invalid:
      <code>{{ datacenterForm.region().invalid() }}</code> · Touched:
      <code>{{ datacenterForm.region().touched() }}</code>
    </p>
  `,
})
export class ComboboxFormsExample {
  protected readonly datacenter = signal<{ region: string | null }>({ region: null });
  protected readonly datacenterForm = form(this.datacenter, (path) => {
    required(path.region);
  });
  protected readonly query = signal('');
  protected readonly regionSearch = hellSearchResource({
    query: this.query,
    items: REGIONS,
    fields: [{ weight: 1, get: (region) => region }],
  });
  protected readonly regionOptions = computed(() => [...this.regionSearch.items()]);

  protected syncQuery(region: string | null): void {
    this.query.set(region ?? '');
  }
}
