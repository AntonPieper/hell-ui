import { Component, signal, type WritableSignal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
import { HellTanStackVirtualRows } from 'hell-ui/table-tanstack/virtual';
import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  injectTable,
  rowExpandingFeature,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type ExpandedState,
  type Updater,
} from '@tanstack/angular-table';

// v9 requires every feature a table uses to be registered explicitly, and the
// Hell shell reads pinning, sizing, resizing, visibility, expanding and sorting.
// Kept at module scope: injectTable re-runs its options initializer whenever a
// signal it reads changes, so rebuilding features there would discard
// TanStack's memoized work.
const features = tableFeatures({
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
  expandedRowModel: createExpandedRowModel(),
});

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
  protected readonly columns: ColumnDef<typeof features, Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: (context) => String(context.getValue<boolean>()),
    },
  ];
  protected readonly table = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.columns,
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
