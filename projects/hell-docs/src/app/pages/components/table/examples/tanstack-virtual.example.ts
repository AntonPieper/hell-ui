import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import {
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTanStackTable,
} from '@hell-ui/angular/table-tanstack';
import { HellTanStackVirtualRows } from '@hell-ui/angular/table-tanstack/virtual';
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
  readonly role: string;
}

@Component({
  selector: 'app-table-tanstack-virtual-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTanStackTable, HellTanStackVirtualRows, HellTableShellEmpty, HellTableShellExpandedRow],
  template: `
    <hell-tanstack-table
      [table]="table"
      stickyHeader
      hellTanStackVirtualRows
      [virtualEstimateRowSize]="44"
      [virtualOverscan]="4"
    >
      <ng-template hellTableShellEmpty>No people found.</ng-template>
      <ng-template hellTableShellExpandedRow let-row="row">
        <p class="text-sm text-muted-foreground">
          {{ row.original.name }} owns expansion state through TanStack Table.
        </p>
      </ng-template>
    </hell-tanstack-table>
  `,
})
export class TableTanStackVirtualExample {
  protected readonly rows = signal<Person[]>(
    Array.from({ length: 28 }, (_, index) => ({
      id: `person-${index + 1}`,
      name: `Person ${index + 1}`,
      role: index % 3 === 0 ? 'Admin' : index % 3 === 1 ? 'Editor' : 'Viewer',
    })),
  );
  protected readonly expanded = signal<ExpandedState>({ 'person-2': true, 'person-7': true });
  protected readonly columns: ColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'role', header: 'Role' },
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
