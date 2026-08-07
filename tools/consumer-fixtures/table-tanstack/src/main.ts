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
  HellTanStackResizableColumns,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
import {
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  injectTable,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type ColumnSizingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

// v9 requires every feature a table uses to be registered explicitly. Kept at
// module scope because injectTable re-runs its options initializer whenever a
// signal it reads changes, and rebuilding features there would throw away
// TanStack's memoized work.
const features = tableFeatures({
  columnFilteringFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  // v9 resolves `auto` sort and filter functions by name out of these
  // registries and no longer bundles the built-ins. The name column resolves to
  // `text`, and the global filter to `includesString`.
  sortFns: { text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
});

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

/**
 * Column resizing is opt-in: only this table registers TanStack's resizing
 * feature and applies `hellTanStackResizableColumns`, while the main shell
 * below compiles from the packed artifact without either — the two halves of
 * the split contract.
 */
const resizableFeatures = tableFeatures({
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
});

interface Service {
  readonly id: string;
  readonly name: string;
  readonly region: string;
}

const services: readonly Service[] = [
  { id: 'gateway', name: 'gateway', region: 'eu-central-1' },
  { id: 'metrics', name: 'metrics', region: 'us-east-1' },
];

@Component({
  selector: 'app-resizable-table',
  imports: [HellTanStackTable, HellTanStackResizableColumns, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table" hellTanStackResizableColumns>
      <ng-template hellTableShellEmpty>No services.</ng-template>
    </hell-tanstack-table>
  `,
})
class ResizableTable {
  protected readonly columnSizing = signal<ColumnSizingState>({});
  protected readonly columns: ColumnDef<typeof resizableFeatures, Service>[] = [
    { accessorKey: 'name', header: 'Service', size: 200, minSize: 120 },
    { accessorKey: 'region', header: 'Region', size: 160 },
  ];
  protected readonly table = injectTable(() => ({
    features: resizableFeatures,
    data: services,
    columns: this.columns,
    getRowId: (row) => row.id,
    state: { columnSizing: this.columnSizing() },
    onColumnSizingChange: (updater) => applyUpdater(this.columnSizing, updater),
  }));
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
    ResizableTable,
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

    <app-resizable-table />
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
  protected readonly columns: ColumnDef<typeof features, Person>[] = [
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
  protected readonly table = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.columns,
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
