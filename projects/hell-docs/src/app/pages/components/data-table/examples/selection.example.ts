import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { HellButton } from '@hell-ui/angular/button';
import {
  HellDataTable,
  HellDataTableBulkActions,
  HellDataTableToolbarEnd,
  HellDataTableToolbarStart,
  hellColumns,
  selectionColumn,
  textColumn,
} from '@hell-ui/angular/data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const columns = hellColumns<Person>();

@Component({
  selector: 'app-data-table-selection-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellDataTable,
    HellDataTableToolbarStart,
    HellDataTableToolbarEnd,
    HellDataTableBulkActions,
  ],
  template: `
    <div class="grid gap-3">
      <hell-data-table
        [rows]="rows"
        [columns]="tableColumns"
        rowKey="id"
        density="compact"
        [(rowSelection)]="rowSelection"
      >
        <strong hellDataTableToolbarStart>Selectable rows</strong>
        <span hellDataTableToolbarEnd>{{ selectedCount() }} selected</span>

        <button
          hellDataTableBulkActions
          hellButton
          type="button"
          variant="primary"
          size="sm"
          (click)="clearSelection()"
        >
          Clear {{ selectedCount() }} selected rows
        </button>
      </hell-data-table>

      <p class="text-xs text-hell-foreground-muted">
        Selection is exposed by native checkbox controls. The row highlight mirrors
        <code>rowSelection</code>; it is not the active editor row.
      </p>
    </div>
  `,
})
export class DataTableSelectionExample {
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
    { id: 'margaret', name: 'Margaret Hamilton', role: 'Viewer' },
  ];

  protected readonly rowSelection = signal<Readonly<Record<string, boolean>>>({});
  protected readonly selectedCount = computed(
    () => Object.values(this.rowSelection()).filter(Boolean).length,
  );

  protected readonly tableColumns = columns.define([
    selectionColumn<Person>('selection', {
      header: 'Select',
      selectAll: true,
      ariaLabel: (row) => `Select ${row.name} for bulk actions`,
    }),
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    textColumn<Person, string>('role', { header: 'Role', accessor: 'role' }),
  ]);

  protected clearSelection(): void {
    this.rowSelection.set({});
  }
}
