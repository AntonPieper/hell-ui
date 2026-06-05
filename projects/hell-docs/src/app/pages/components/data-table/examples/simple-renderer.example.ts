import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellDataTable, hellColumns, textColumn } from '@hell-ui/angular/data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const columns = hellColumns<Person>();

@Component({
  selector: 'app-data-table-simple-renderer-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="tableColumns"
      rowKey="id"
      density="compact"
      empty="No people yet."
    />
  `,
})
export class DataTableSimpleRendererExample {
  protected readonly rows = signal<readonly Person[]>([
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
    { id: 'margaret', name: 'Margaret Hamilton', role: 'Viewer' },
  ]);

  protected readonly tableColumns = columns.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    textColumn<Person, string>('role', { header: 'Role', accessor: 'role' }),
  ]);
}
