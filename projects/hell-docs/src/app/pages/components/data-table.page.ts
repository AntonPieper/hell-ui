import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import type { ColumnDef } from '@tanstack/angular-table';
import { HellDataTable, HellDataTableQuery } from 'hell';

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
  imports: [HellDataTable],
  template: `
    <article class="hd-prose">
      <h1>Data table</h1>
      <p>
        Wraps <code>&#64;tanstack/angular-table</code>. Server-side pagination,
        sorting and filtering are all delegated to the consumer via the
        <code>(queryChange)</code> output.
      </p>

      <h2>Example</h2>
      <div class="hd-example" style="padding:0">
        <hell-data-table
          [data]="rows()"
          [columns]="columns"
          [total]="total()"
          [pageSize]="10"
          (queryChange)="load($event)"
        />
      </div>
    </article>
  `,
})
export class DataTablePage {
  protected readonly rows = signal<Row[]>([]);
  protected readonly total = signal(0);

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
      data = data.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(f)),
      );
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
