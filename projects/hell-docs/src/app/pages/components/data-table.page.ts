import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import type { ColumnDef } from '@tanstack/angular-table';
import { HellDataTable, HellDataTableQuery } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ALL: Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: 'User ' + (i + 1),
  email: 'user' + (i + 1) + '@example.com',
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
}));

@Component({
  selector: 'hd-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellDataTable],
  template: `
    <article class="hd-prose">
      <h1>Data table</h1>
      <p>
        Wraps <code>&#64;tanstack/angular-table</code>. Server-side pagination, sorting and
        filtering are all delegated to the consumer via the <code>(queryChange)</code> output.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="exampleCodes[0]" flush>
        <hell-data-table
          [data]="rows()"
          [columns]="columns"
          [total]="total()"
          [pageSize]="10"
          [pageSizeOptions]="pageSizeOptions"
          (queryChange)="load($event)"
        />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>data</code>: current page rows.</li>
        <li><code>columns</code>: TanStack <code>ColumnDef&lt;T&gt;[]</code>.</li>
        <li><code>total</code>: total rows across all pages.</li>
        <li><code>pageSize</code>: initial rows per page.</li>
        <li><code>pageSizeOptions</code>: selectable page sizes.</li>
        <li>
          <code>(queryChange)</code>: emits <code>pageIndex</code>, <code>pageSize</code>,
          <code>sorting</code>, and <code>filter</code>; fetch or derive rows from this.
        </li>
        <li><code>unstyled</code>: opt out of shell styling.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Treat <code>(queryChange)</code> as the source for server fetches.</li>
        <li>Keep column headers concise and sortable only when supported.</li>
        <li>Pass the real <code>total</code> for correct pagination.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't mutate row arrays in place and expect sorting state to reset.</li>
        <li>Don't use a data table for small static definition lists.</li>
      </ul>
    </article>
  `,
})
export class DataTablePage {
  protected readonly exampleCodes = [
    "<hell-data-table\n  [data]=\"[\n    { id: 1, name: 'Ada King', email: 'ada@example.com', role: 'Admin' },\n    { id: 2, name: 'Ben Shaw', email: 'ben@example.com', role: 'Editor' }\n  ]\"\n  [columns]=\"[\n    { accessorKey: 'id', header: 'ID' },\n    { accessorKey: 'name', header: 'Name' },\n    { accessorKey: 'email', header: 'Email' },\n    { accessorKey: 'role', header: 'Role' }\n  ]\"\n  [total]=\"2\"\n  [pageSize]=\"10\"\n  [pageSizeOptions]=\"[5, 10, 25]\"\n/>\n",
  ] as const;
  protected readonly rows = signal<Row[]>([]);
  protected readonly total = signal(0);

  protected readonly pageSizeOptions = [5, 10, 25] as const;

  protected readonly columns: ColumnDef<Row, any>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Role' },
  ];

  constructor() {
    this.load({ pageIndex: 0, pageSize: 10, sorting: [], filter: '' });
  }

  protected load(q: HellDataTableQuery) {
    let data = ALL;
    if (q.filter) {
      const f = q.filter.toLowerCase();
      data = data.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(f)));
    }
    if (q.sorting[0]) {
      const { id, desc } = q.sorting[0];
      data = [...data].sort((a, b) => {
        const av = (a as any)[id];
        const bv = (b as any)[id];
        return (av > bv ? 1 : av < bv ? -1 : 0) * (desc ? -1 : 1);
      });
    }
    this.total.set(data.length);
    const start = q.pageIndex * q.pageSize;
    this.rows.set(data.slice(start, start + q.pageSize));
  }
}
