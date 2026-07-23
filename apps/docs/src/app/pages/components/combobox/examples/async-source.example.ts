import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_COMBOBOX_IMPORTS } from 'hell-ui/combobox';
import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { hellSearchResource } from 'hell-ui/core';

interface Customer {
  readonly id: string;
  readonly name: string;
  readonly city: string;
}

/** Stand-in for a backend directory; only the Search Resource source sees it. */
const CUSTOMERS: readonly Customer[] = [
  { id: 'cus-1041', name: 'Aldona Logistics GmbH', city: 'Berlin' },
  { id: 'cus-1042', name: 'Bernward & Söhne KG', city: 'Dortmund' },
  { id: 'cus-1043', name: 'Cetus Marine Services', city: 'Hamburg' },
  { id: 'cus-1044', name: 'Dorstfeld Stahlhandel', city: 'Essen' },
  { id: 'cus-1045', name: 'Elbe Kontor AG', city: 'Bremen' },
  { id: 'cus-1046', name: 'Falkenrath Spedition', city: 'Leipzig' },
];

@Component({
  selector: 'app-combobox-async-source-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_IMPORTS, ...HELL_CONTROL_GROUP_IMPORTS],
  template: `
    <div hellControlGroup class="max-w-80">
      <div
        hellCombobox
        ui="h-auto min-h-hell-control-md flex-1 rounded-none border-0 bg-transparent ps-hell-4 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
        [options]="customerOptions()"
        [value]="value()"
        [compareWith]="compareCustomer"
        (valueChange)="select($any($event))"
      >
        <input
          hellComboboxInput
          aria-label="Customer account"
          placeholder="Search customers… (try “fail”)"
          [value]="customerSearch.query()"
          (input)="customerSearch.query.set($any($event.target).value ?? '')"
        />
        <button hellComboboxButton type="button" aria-label="Toggle customers"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @if (customerSearch.status() === 'loading') {
            <div class="px-hell-3 py-hell-2 text-xs text-hell-foreground-subtle" role="status">
              Loading customers…
            </div>
          } @else if (customerSearch.status() === 'error') {
            <div class="px-hell-3 py-hell-2 text-xs text-hell-danger" role="alert">
              Customer directory unavailable. Try another query.
            </div>
          } @else {
            @for (customer of customerOptions(); track customer.id) {
              <div hellComboboxOption [value]="customer">
                <strong>{{ customer.name }}</strong>
                <span class="ms-auto text-xs text-hell-foreground-subtle">
                  {{ customer.city }}
                </span>
              </div>
            } @empty {
              <div hellComboboxEmpty>No customers match</div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ComboboxAsyncSourceExample {
  protected readonly value = signal<Customer | null>(null);
  protected readonly query = signal('');
  protected readonly customerSearch = hellSearchResource<Customer>({
    query: this.query,
    source: async ({ query, signal: abortSignal }) => {
      await waitForNetwork(abortSignal);
      if (abortSignal.aborted) return [];
      if (query.trim().toLocaleLowerCase() === 'fail') {
        throw new Error('customer directory unavailable');
      }
      const normalized = query.trim().toLocaleLowerCase();
      return normalized
        ? CUSTOMERS.filter((customer) =>
            `${customer.name} ${customer.city}`.toLocaleLowerCase().includes(normalized),
          )
        : CUSTOMERS;
    },
    fields: [
      { weight: 3, get: (customer) => customer.name },
      { weight: 1, get: (customer) => customer.city },
    ],
    debounce: 120,
  });
  protected readonly customerOptions = computed(() => [...this.customerSearch.items()]);
  protected readonly compareCustomer = (
    left: Customer | null,
    right: Customer | null,
  ): boolean => left?.id === right?.id;

  protected select(customer: Customer | null): void {
    this.value.set(customer);
    this.query.set(customer?.name ?? '');
  }
}

function waitForNetwork(abortSignal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 600);
    abortSignal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}
