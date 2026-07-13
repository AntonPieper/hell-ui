import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellNativeSelect } from '@hell-ui/angular/select';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';

interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly amount: string;
  readonly status: string;
}

const INVOICES: readonly Invoice[] = [
  { id: 'INV-104', customer: 'Northwind', amount: '€1,280.00', status: 'Paid' },
  { id: 'INV-109', customer: 'Acme Corp', amount: '€430.00', status: 'Open' },
  { id: 'INV-118', customer: 'Globex', amount: '€2,110.50', status: 'Overdue' },
  { id: 'INV-121', customer: 'Initech', amount: '€960.00', status: 'Paid' },
  { id: 'INV-133', customer: 'Umbrella', amount: '€75.20', status: 'Open' },
];

@Component({
  selector: 'app-pagination-with-table-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES, HellNativeSelect, HellPaginationStrip],
  template: `
    <div class="flex flex-col gap-hell-3">
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
            @for (invoice of pageRows(); track invoice.id) {
              <tr hellTableRow>
                <td hellTableCell>{{ invoice.id }}</td>
                <td hellTableCell>{{ invoice.customer }}</td>
                <td hellTableCell>{{ invoice.amount }}</td>
                <td hellTableCell>{{ invoice.status }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-hell-3">
        <label class="flex items-center gap-hell-2 text-xs text-hell-foreground-muted">
          Rows per page
          <select
            hellNativeSelect
            size="sm"
            class="w-auto"
            [value]="pageSize()"
            (change)="onPageSizeChange($event)"
          >
            <option [value]="2">2</option>
            <option [value]="3">3</option>
            <option [value]="5">5</option>
          </select>
        </label>
        <hell-pagination
          mode="previous-next"
          [page]="page()"
          [pageCount]="pageCount()"
          (pageChange)="page.set($event)"
        />
      </div>
    </div>
  `,
})
export class PaginationWithTableExample {
  protected readonly page = signal(1);
  protected readonly pageSize = signal(2);

  protected readonly pageCount = computed(() => Math.ceil(INVOICES.length / this.pageSize()));

  protected readonly pageRows = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return INVOICES.slice(start, start + this.pageSize());
  });

  protected onPageSizeChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;

    this.pageSize.set(Number.parseInt(target.value, 10));
    this.page.set(1);
  }
}
