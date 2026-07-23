import { Component, signal, type WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
import { HellTanStackVirtualRows } from 'hell-ui/table-tanstack/virtual';
import {
  createAngularTable,
  getCoreRowModel,
  getExpandedRowModel,
  type ColumnDef,
  type ExpandedState,
  type Updater,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

// TanStack virtual boundary: the optional virtual row strategy mounts on the
// shell without creating a second table engine or root component.
@Component({
  selector: 'app-root',
  imports: [HellTanStackTable, HellTanStackVirtualRows, HellTableShellEmpty, HellTableShellExpandedRow],
  template: `
    <hell-tanstack-table
      [table]="table"
      hellTanStackVirtualRows
      [virtualEstimateRowSize]="44"
      [virtualOverscan]="2"
    >
      <ng-template hellTableShellEmpty>No people.</ng-template>
      <ng-template hellTableShellExpandedRow let-row="row">
        <p>{{ row.original.name }} details</p>
      </ng-template>
    </hell-tanstack-table>
  `,
})
class App {
  protected readonly rows = signal<Person[]>([
    { id: 'ada', name: 'Ada Lovelace', active: true },
    { id: 'grace', name: 'Grace Hopper', active: false },
  ]);
  protected readonly expanded = signal<ExpandedState>({ ada: true });
  protected readonly columns: ColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: (context) => String(context.getValue<boolean>()),
    },
  ];
  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
    state: { expanded: this.expanded() },
    onExpandedChange: (updater) => applyUpdater(this.expanded, updater),
  }));
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
