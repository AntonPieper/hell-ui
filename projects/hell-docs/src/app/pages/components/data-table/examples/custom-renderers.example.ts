import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  HELL_DATA_TABLE_DIRECTIVES,
  actionColumn,
  hellColumns,
  textColumn,
} from '@hell-ui/angular/data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const columns = hellColumns<Person>();

@Component({
  selector: 'app-data-table-custom-renderers-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table [rows]="rows" [columns]="tableColumns" rowKey="id">
      <strong hellDataTableToolbarStart>Custom renderers</strong>
      <span hellDataTableToolbarEnd>{{ rows.length }} rows</span>

      <ng-template [hellHeaderCell]="'name'" let-header="header">
        {{ header.label }} / team member
      </ng-template>

      <ng-template [hellCell]="'role'" let-value="value">
        <span class="rounded-full bg-hell-primary-soft px-2 py-0.5 text-xs text-hell-primary">
          {{ value }}
        </span>
      </ng-template>

      <ng-template [hellRowActions]="'actions'" let-row="row">
        <button type="button" class="text-xs font-medium text-hell-primary">
          Open {{ row.original.name }}
        </button>
      </ng-template>
    </hell-data-table>
  `,
})
export class DataTableCustomRenderersExample {
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  ];

  protected readonly tableColumns = columns.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    textColumn<Person, string>('role', { header: 'Role', accessor: 'role' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
}
