import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { HellButton } from '@hell-ui/angular/button';
import { HellTag } from '@hell-ui/angular/tag';
import {
  HellCell,
  HellDataTable,
  HellDataTableToolbarEnd,
  HellDataTableToolbarStart,
  HellHeaderCell,
  HellRowActions,
  HellTableRowAction,
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
  imports: [
    HellButton,
    HellTag,
    HellDataTable,
    HellDataTableToolbarStart,
    HellDataTableToolbarEnd,
    HellHeaderCell,
    HellCell,
    HellRowActions,
    HellTableRowAction,
  ],
  template: `
    <div class="grid gap-3">
      <hell-data-table [rows]="rows" [columns]="tableColumns" rowKey="id" [(activeRowKey)]="activeRowKey">
        <strong hellDataTableToolbarStart>Custom renderers</strong>
        <span hellDataTableToolbarEnd>{{ rows.length }} rows</span>

        <ng-template [hellHeaderCell]="'name'" let-header="header">
          {{ header.label }} / team member
        </ng-template>

        <ng-template [hellCell]="'role'" let-value="value">
          <span hellTag variant="primary">{{ value }}</span>
        </ng-template>

        <ng-template [hellRowActions]="'actions'" let-row="row" let-commands="commands">
          <button
            hellButton
            hellTableRowAction
            type="button"
            size="xs"
            variant="ghost"
            [attr.aria-controls]="editorId"
            [attr.aria-expanded]="commands.isActive(row) ? 'true' : 'false'"
            (click)="commands.isActive(row) ? commands.closeRow(row) : commands.openRow(row)"
          >
            {{ commands.isActive(row) ? 'Close' : 'Open' }} {{ row.original.name }}
          </button>
        </ng-template>
      </hell-data-table>

      <aside [id]="editorId" class="rounded-md border border-hell-border bg-hell-surface-subtle p-3 text-sm">
        @if (activeRow(); as row) {
          <div class="flex items-center justify-between gap-3">
            <strong>{{ row.name }}</strong>
            <button hellButton type="button" variant="ghost" size="xs" (click)="activeRowKey.set(null)">
              Close editor
            </button>
          </div>
          <p class="mt-2 text-hell-foreground-muted">{{ row.name }} is a {{ row.role }}.</p>
        } @else {
          <p class="text-hell-foreground-muted">Open a row to show the external editor pane.</p>
        }
      </aside>
    </div>
  `,
})
export class DataTableCustomRenderersExample {
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  ];

  protected readonly editorId = 'data-table-custom-renderers-editor';
  protected readonly activeRowKey = signal<string | null>(null);
  protected readonly activeRow = computed(
    () => this.rows.find((row) => row.id === this.activeRowKey()) ?? null,
  );

  protected readonly tableColumns = columns.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    textColumn<Person, string>('role', { header: 'Role', accessor: 'role' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
}
