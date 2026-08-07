import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type WritableSignal,
} from '@angular/core';
import { HellButton } from 'hell-ui/button';
import {
  HellTableShellEmpty,
  HellTableShellFooter,
  HellTableShellToolbar,
  HellTanStackResizableColumns,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
import { HellTanStackVirtualRows } from 'hell-ui/table-tanstack/virtual';
import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  injectTable,
  rowExpandingFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type ColumnSizingState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

// v9 requires explicit feature registration; the Hell shell reads pinning,
// sizing, visibility, expanding and sorting, and the resizable-columns opt-in
// adds resizing. Hoisted out of the injectTable initializer so it is not
// rebuilt on every signal change.
const features = tableFeatures({
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  // v9 resolves `auto` sort functions by name out of this registry rather than
  // bundling the built-ins: the numbered service and uptime columns resolve to
  // `alphanumeric`, the plain-word owner and region columns to `text`.
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

interface Service {
  readonly id: string;
  readonly service: string;
  readonly owner: string;
  readonly region: string;
  readonly uptime: string;
}

const OWNERS = ['Platform', 'Compiler', 'Flight', 'Operations'] as const;
const REGIONS = ['eu-central-1', 'us-east-1', 'ap-south-1'] as const;

@Component({
  selector: 'app-table-tanstack-resizable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellTanStackTable,
    HellTanStackResizableColumns,
    HellTanStackVirtualRows,
    HellTableShellEmpty,
    HellTableShellFooter,
    HellTableShellToolbar,
  ],
  template: `
    <hell-tanstack-table
      [table]="table"
      stickyHeader
      hellTanStackResizableColumns
      hellTanStackVirtualRows
      [virtualEstimateRowSize]="44"
    >
      <span hellTableShellToolbar>
        Drag a header divider, or focus one and press Arrow, Home, or End.
      </span>
      <button
        hellTableShellToolbar
        hellButton
        size="sm"
        variant="ghost"
        type="button"
        class="ms-auto"
        [disabled]="!hasCustomWidths()"
        (click)="resetWidths()"
      >
        Reset widths
      </button>

      <ng-template hellTableShellEmpty>No services.</ng-template>

      <span hellTableShellFooter data-testid="resizable-width-readout">
        {{ widthSummary() }}
      </span>
    </hell-tanstack-table>
  `,
})
export class TableTanStackResizableExample {
  protected readonly rows = signal<Service[]>(
    Array.from({ length: 40 }, (_, index) => ({
      id: `service-${index + 1}`,
      service: `service-${String(index + 1).padStart(2, '0')}`,
      owner: OWNERS[index % OWNERS.length],
      region: REGIONS[index % REGIONS.length],
      uptime: `${(99 + (index % 10) / 10).toFixed(2)}%`,
    })),
  );

  // Column widths are TanStack state. The shell writes into it and reads back
  // out of it; nothing in Hell keeps a second copy.
  protected readonly columnSizing = signal<ColumnSizingState>({});
  protected readonly sorting = signal<SortingState>([]);

  protected readonly columns: ColumnDef<typeof features, Service>[] = [
    { accessorKey: 'service', header: 'Service', size: 200, minSize: 120 },
    { accessorKey: 'owner', header: 'Owner', size: 160, minSize: 96 },
    { accessorKey: 'region', header: 'Region', size: 176, minSize: 96 },
    // The trailing column has no adjacent neighbour, so it renders no handle.
    { accessorKey: 'uptime', header: 'Uptime', size: 120, meta: { hell: { cellClass: 'text-end' } } },
  ];

  protected readonly table = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.columns,
    // The `hellTanStackResizableColumns` directive is what makes the shell
    // render separators; `enableResizing: false` on a column opts that one out.
    getRowId: (row) => row.id,
    state: { columnSizing: this.columnSizing(), sorting: this.sorting() },
    onColumnSizingChange: (updater: Updater<ColumnSizingState>) =>
      applyUpdater(this.columnSizing, updater),
    // Sorting shares the header cell with the separator: the separator stops
    // its own pointer and key events, so dragging never sorts.
    onSortingChange: (updater: Updater<SortingState>) => applyUpdater(this.sorting, updater),
  }));

  protected readonly hasCustomWidths = computed(
    () => Object.keys(this.columnSizing()).length > 0,
  );

  protected readonly widthSummary = computed(() => {
    // Read through the signal so the readout tracks every committed resize.
    this.columnSizing();
    return this.table
      .getVisibleLeafColumns()
      .map((column) => `${column.id} ${Math.round(column.getSize())}px`)
      .join(' · ');
  });

  protected resetWidths(): void {
    this.table.resetColumnSizing(true);
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
