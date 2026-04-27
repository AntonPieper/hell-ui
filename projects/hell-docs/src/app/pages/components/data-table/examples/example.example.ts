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
  selector: 'app-data-table-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [data]="rows()"
      [columns]="columns"
      [total]="total()"
      [pageSize]="10"
      [pageSizeOptions]="pageSizeOptions"
      (queryChange)="load($event)"
    />
  `,
})
export class DataTableExampleExample {
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
