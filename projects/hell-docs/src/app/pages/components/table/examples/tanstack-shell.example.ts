import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
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
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly status: 'active' | 'away';
}

@Component({
  selector: 'app-table-tanstack-shell-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
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
      <hell-tanstack-global-filter hellTableShellToolbar [table]="table" placeholder="Filter people" />

      <ng-template hellTableShellCell="actions" let-row="row">
        <button hellButton size="sm" variant="ghost" type="button">Edit {{ row.original.name }}</button>
      </ng-template>

      <ng-template hellTableShellEmpty>No people found.</ng-template>

      <span hellTableShellFooter>{{ table.getFilteredRowModel().rows.length }} visible</span>
      <hell-tanstack-pagination hellTableShellFooter [table]="table" [pageSizeOptions]="[2, 5]" />
    </hell-tanstack-table>
  `,
})
export class TableTanStackShellExample {
  protected readonly HellTableStatus = HellTableStatus;
  protected readonly rows = signal<Person[]>([
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin', status: 'active' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor', status: 'away' },
    { id: 'katherine', name: 'Katherine Johnson', role: 'Analyst', status: 'active' },
  ]);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 2 });
  protected readonly globalFilter = signal('');
  protected readonly columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (context) => context.getValue(),
      meta: { hell: { cellClass: 'font-medium', headerClass: 'w-56' } },
    },
    { accessorKey: 'role', header: 'Role' },
    { accessorKey: 'status', header: 'Status' },
    { id: 'actions', header: 'Actions', meta: { hell: { cellClass: 'text-right' } } },
  ];

  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    state: {
      sorting: this.sorting(),
      pagination: this.pagination(),
      globalFilter: this.globalFilter(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onPaginationChange: (updater) => applyUpdater(this.pagination, updater),
    onGlobalFilterChange: (updater) => applyUpdater(this.globalFilter, updater),
  }));
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
