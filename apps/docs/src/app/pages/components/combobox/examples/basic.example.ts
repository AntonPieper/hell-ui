import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';
import { HELL_CONTROL_GROUP_DIRECTIVES } from '@hell-ui/angular/control-group';
import { hellSearchResource } from '@hell-ui/angular/core';

interface Currency {
  readonly code: string;
  readonly name: string;
  readonly disabled?: boolean;
}

const CURRENCIES: readonly Currency[] = [
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar', disabled: true },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Pound Sterling' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'USD', name: 'US Dollar' },
];

@Component({
  selector: 'app-combobox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_DIRECTIVES, ...HELL_CONTROL_GROUP_DIRECTIVES],
  template: `
    <div hellControlGroup class="max-w-72">
      <div
        hellCombobox
        allowDeselect
        ui="h-auto min-h-hell-control-md flex-1 rounded-none border-0 bg-transparent ps-hell-4 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
        [options]="currencyOptions()"
        [value]="value()"
        [compareWith]="compareCurrency"
        (valueChange)="select($any($event))"
      >
        <input
          hellComboboxInput
          aria-label="Settlement currency"
          placeholder="Search currency…"
          [value]="currencySearch.query()"
          (input)="currencySearch.query.set($any($event.target).value ?? '')"
        />
        <button hellComboboxButton type="button" aria-label="Toggle currencies"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (currency of currencyOptions(); track currency.code) {
            <div
              hellComboboxOption
              [value]="currency"
              [disabled]="currency.disabled ?? false"
            >
              <strong>{{ currency.code }}</strong>
              <span> — {{ currency.name }}</span>
            </div>
          } @empty {
            <div hellComboboxEmpty>No currency matches</div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ComboboxBasicExample {
  protected readonly value = signal<Currency | null>(null);
  protected readonly query = signal('');
  protected readonly currencySearch = hellSearchResource({
    query: this.query,
    items: CURRENCIES,
    fields: [
      { weight: 3, get: (currency) => currency.code },
      { weight: 1, get: (currency) => currency.name },
    ],
  });
  protected readonly currencyOptions = computed(() => [...this.currencySearch.items()]);
  protected readonly compareCurrency = (
    left: Currency | null,
    right: Currency | null,
  ): boolean => left?.code === right?.code;

  protected select(currency: Currency | null): void {
    this.value.set(currency);
    this.query.set(currency ? `${currency.code} — ${currency.name}` : '');
  }
}
