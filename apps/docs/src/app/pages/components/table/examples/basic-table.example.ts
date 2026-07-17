import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_TABLE_UTILITIES_IMPORTS } from '@hell-ui/angular/table';

interface Invoice {
  readonly id: string;
  readonly customer: string;
  readonly amount: string;
  readonly status: string;
}

const invoices: readonly Invoice[] = [
  { id: 'INV-104', customer: 'Northwind', amount: '€1,280.00', status: 'Paid' },
  { id: 'INV-109', customer: 'Acme Corp', amount: '€430.00', status: 'Open' },
  { id: 'INV-118', customer: 'Globex', amount: '€2,110.50', status: 'Overdue' },
];

@Component({
  selector: 'app-table-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_TABLE_UTILITIES_IMPORTS],
  template: `
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
          @for (invoice of invoices; track invoice.id) {
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
  `,
})
export class TableBasicExample {
  protected readonly invoices = invoices;
}
