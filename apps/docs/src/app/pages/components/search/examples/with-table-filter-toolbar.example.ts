import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_SEARCH_IMPORTS, HellInput } from '@hell-ui/angular/input';
import { HELL_LISTBOX_IMPORTS } from '@hell-ui/angular/listbox';
import { HELL_TABLE_UTILITIES_IMPORTS } from '@hell-ui/angular/table';
import { HellChip } from '@hell-ui/angular/chip';

type InvoiceStatus = 'Paid' | 'Open' | 'Overdue';

interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly amount: string;
  readonly status: InvoiceStatus;
}

const INVOICES: readonly Invoice[] = [
  { id: 'INV-104', customer: 'Northwind', amount: '€1,280.00', status: 'Paid' },
  { id: 'INV-109', customer: 'Acme Corp', amount: '€430.00', status: 'Open' },
  { id: 'INV-118', customer: 'Globex', amount: '€2,110.50', status: 'Overdue' },
  { id: 'INV-122', customer: 'Initech', amount: '€960.00', status: 'Open' },
  { id: 'INV-127', customer: 'Umbrella Corp', amount: '€75.20', status: 'Overdue' },
];

const STATUS_FILTERS = ['all', 'Paid', 'Open', 'Overdue'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_VARIANT: Record<InvoiceStatus, 'success' | 'info' | 'danger'> = {
  Paid: 'success',
  Open: 'info',
  Overdue: 'danger',
};

@Component({
  selector: 'app-search-with-table-filter-toolbar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellInput,
    HellChip,
    ...HELL_LISTBOX_IMPORTS,
    ...HELL_SEARCH_IMPORTS,
    ...HELL_TABLE_UTILITIES_IMPORTS,
  ],
  template: `
    <div class="grid gap-hell-3">
      <div class="flex flex-wrap items-center gap-hell-3">
        <div hellSearch class="min-w-60 flex-1">
          <input
            hellInput
            type="search"
            placeholder="Search customer or invoice"
            aria-label="Search invoices"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <div
          hellListbox
          ui="w-auto flex-row gap-hell-1 border-0 bg-transparent p-0"
          aria-label="Filter by status"
          [value]="[status()]"
          (valueChange)="status.set($any($event)[0] ?? 'all')"
        >
          @for (filter of statusFilters; track filter) {
            <div hellListboxOption [value]="filter" ui="rounded-hell-pill px-hell-3 py-hell-1">
              {{ filter === 'all' ? 'All' : filter }}
            </div>
          }
        </div>
      </div>

      <div hellTableContainer>
        <table hellTableRoot>
          <thead hellTableHeader>
            <tr hellTableRow>
              <th hellTableHeaderCell>Invoice</th>
              <th hellTableHeaderCell>Customer</th>
              <th hellTableHeaderCell>Amount</th>
              <th hellTableHeaderCell>Status</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (invoice of matches(); track invoice.id) {
              <tr hellTableRow>
                <td hellTableCell>{{ invoice.id }}</td>
                <td hellTableCell>{{ invoice.customer }}</td>
                <td hellTableCell>{{ invoice.amount }}</td>
                <td hellTableCell>
                  <span hellChip [variant]="statusVariant[invoice.status]">
                    {{ invoice.status }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr hellTableRow>
                <td hellTableCell space="empty" class="text-center text-hell-foreground-muted" colspan="4">
                  No invoices match your filters.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SearchWithTableFilterToolbarExample {
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly statusVariant = STATUS_VARIANT;

  protected readonly query = signal('');
  protected readonly status = signal<StatusFilter>('all');

  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.status();
    return INVOICES.filter((invoice) => {
      const matchesQuery =
        !query ||
        invoice.customer.toLowerCase().includes(query) ||
        invoice.id.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || invoice.status === status;
      return matchesQuery && matchesStatus;
    });
  });
}
