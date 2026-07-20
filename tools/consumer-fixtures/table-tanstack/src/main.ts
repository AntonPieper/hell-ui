import { Component, signal, type WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellFooter,
  HellTableShellToolbar,
  HellTableStatus,
  HellTanStackGlobalFilter,
  HellTanStackPagination,
  HellTanStackTable,
} from '@hell-ui/angular/table-tanstack';
import {
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

// TanStack table boundary: the Hell-styled shell composes a caller-owned
// TanStack Table engine behind the strict optional table peer.
@Component({
  selector: 'app-root',
  imports: [
    HellTanStackTable,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellFooter,
    HellTableShellToolbar,
    HellTanStackGlobalFilter,
    HellTanStackPagination,
  ],
  template: `
    <hell-tanstack-table [table]="table" [status]="HellTableStatus.READY" stickyHeader>
      <hell-tanstack-global-filter hellTableShellToolbar [table]="table" />

      <ng-template hellTableShellCell="actions" let-row="row">
        <button type="button">Edit {{ row.original.name }}</button>
      </ng-template>

      <ng-template hellTableShellEmpty>No people.</ng-template>

      <span hellTableShellFooter>{{ table.getRowModel().rows.length }} visible</span>
      <hell-tanstack-pagination hellTableShellFooter [table]="table" [pageSizeOptions]="[1, 2]" />
    </hell-tanstack-table>
  `,
})
class App {
  protected readonly HellTableStatus = HellTableStatus;
  protected readonly rows = signal<Person[]>([
    { id: 'ada', name: 'Ada Lovelace', active: true },
    { id: 'grace', name: 'Grace Hopper', active: false },
  ]);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly rowSelection = signal<RowSelectionState>({});
  protected readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 1 });
  protected readonly globalFilter = signal('');
  protected readonly columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (context) => `Person ${context.getValue<string>()}`,
      enableSorting: true,
      meta: { hell: { headerClass: 'w-56', cellClass: 'font-medium' } },
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: (context) => (context.getValue<boolean>() ? 'Active' : 'Inactive'),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Actions',
    },
  ];
  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: {
      sorting: this.sorting(),
      rowSelection: this.rowSelection(),
      pagination: this.pagination(),
      globalFilter: this.globalFilter(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onRowSelectionChange: (updater) => applyUpdater(this.rowSelection, updater),
    onPaginationChange: (updater) => applyUpdater(this.pagination, updater),
    onGlobalFilterChange: (updater) => applyUpdater(this.globalFilter, updater),
  }));
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
