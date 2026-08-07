import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import {
  HELL_TABLE_UTILITIES_IMPORTS,
  type HellTableResizeAdapter,
  type HellTableResizeEvent,
  type HellTableResizeItem,
} from 'hell-ui/table';
import {
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTanStackResizableColumns,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
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

// v9 requires explicit feature registration; the Hell shell reads pinning,
// sizing, visibility, expanding and sorting, and the pinned table's
// resizable-columns opt-in adds resizing. Hoisted out of the injectTable
// initializer so it is not rebuilt on every signal change.
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
  readonly role: string;
}

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
];

@Component({
  selector: 'hd-table-a11y-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    ...HELL_TABLE_UTILITIES_IMPORTS,
    HellTanStackTable,
    HellTanStackResizableColumns,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellExpandedRow,
  ],
  template: `
    <article class="hd-doc-page">
      <div class="hd-prose">
        <h1>Table accessibility harness</h1>
      </div>

      <section aria-labelledby="native-heading" data-testid="native-table-section">
        <h2 id="native-heading">Native table primitives</h2>
        <table hellTableRoot data-testid="native-table">
          <thead hellTableHeader>
            <tr hellTableRow>
              <th hellTableHeaderCell columnId="name">Name</th>
              <th hellTableHeaderCell columnId="role">Role</th>
              <th hellTableHeaderCell>Actions</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (person of people; track person.id) {
              <tr hellTableRow [active]="activeId() === person.id" [selected]="selectedId() === person.id">
                <td hellTableCell>{{ person.name }}</td>
                <td hellTableCell>{{ person.role }}</td>
                <td hellTableCell>
                  <button
                    hellTableRowAction
                    hellButton
                    size="sm"
                    variant="ghost"
                    type="button"
                    [attr.aria-label]="'View ' + person.name"
                    (click)="activeId.set(person.id)"
                  >
                    View
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section aria-labelledby="selection-heading" data-testid="selection-table-section">
        <h2 id="selection-heading">Native selection controls</h2>
        <table hellTableRoot>
          <tbody hellTableBody>
            @for (person of people; track person.id) {
              <tr hellTableRow [selected]="selectedId() === person.id">
                <td hellTableCell>{{ person.name }}</td>
                <td hellTableCell hellTableSelectionCell>
                  <input
                    hellTableRowRadio
                    type="radio"
                    name="harness-primary"
                    [attr.aria-label]="'Choose ' + person.name + ' as primary'"
                    [checked]="selectedId() === person.id"
                    (change)="selectedId.set(person.id)"
                  />
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section aria-labelledby="sortable-heading" data-testid="sortable-table-section">
        <h2 id="sortable-heading">Sortable native header</h2>
        <table hellTableRoot data-testid="sortable-table">
          <thead hellTableHeader>
            <tr hellTableRow>
              <th
                hellTableHeaderCell
                columnId="name"
                sortable
                [sort]="sort()"
                (sortToggle)="toggleSort()"
              >
                <button hellTableSortTrigger type="button">Name</button>
              </th>
              <th hellTableHeaderCell columnId="role">Role</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (person of sortedPeople(); track person.id) {
              <tr hellTableRow>
                <td hellTableCell>{{ person.name }}</td>
                <td hellTableCell>{{ person.role }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section aria-labelledby="resize-heading" data-testid="table-resize-semantic-section">
        <h2 id="resize-heading">Resizable native table</h2>
        <p>
          Commits:
          <output data-testid="semantic-resize-commit-count">{{ resizeCommitCount() }}</output>
          Sorts:
          <output data-testid="semantic-resize-sort-count">{{ resizeSortCount() }}</output>
          Actions:
          <output data-testid="semantic-resize-action-count">{{ resizeActionCount() }}</output>
        </p>
        <table hellTableRoot data-testid="semantic-resize-table">
          <thead hellTableHeader>
            <tr hellTableRow>
              <th
                id="semantic-resize-name"
                hellTableHeaderCell
                columnId="name"
                sortable
                [sort]="resizeSort()"
                (sortToggle)="incrementResizeSort()"
              >
                <button hellTableSortTrigger type="button">Name</button>
                <button
                  hellTableResizeHandle
                  type="button"
                  data-testid="semantic-resize-handle"
                  aria-controls="semantic-resize-name semantic-resize-role"
                  [resizeAdapter]="resizeAdapter"
                  (resizeCommit)="onResizeCommit($event)"
                ></button>
              </th>
              <th id="semantic-resize-role" hellTableHeaderCell columnId="role">
                Role
              </th>
              <th hellTableHeaderCell>Actions</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (person of people; track person.id) {
              <tr hellTableRow>
                <td hellTableCell>{{ person.name }}</td>
                <td hellTableCell>{{ person.role }}</td>
                <td hellTableCell>
                  <button
                    hellTableRowAction
                    hellButton
                    type="button"
                    size="sm"
                    variant="ghost"
                    (click)="incrementResizeAction()"
                  >
                    Open
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <!--
        Pinned columns, resizable separators, and no sticky header row: the one
        combination where the header cell's positioning has to serve the pinned
        offsets and the separator's containing block at the same time. The frame
        is narrow enough that the scrollport actually scrolls sideways.
      -->
      <section aria-labelledby="pinned-resize-heading" data-testid="pinned-resize-section">
        <h2 id="pinned-resize-heading">Pinned columns with resizing</h2>
        <div style="max-width: 420px">
          <hell-tanstack-table [table]="pinnedTable" hellTanStackResizableColumns>
            <ng-template hellTableShellEmpty>No people found.</ng-template>
          </hell-tanstack-table>
        </div>
      </section>

      <section aria-labelledby="shell-heading" data-testid="tanstack-shell-section">
        <h2 id="shell-heading">TanStack shell</h2>
        <hell-tanstack-table [table]="table">
          <ng-template hellTableShellEmpty>No people found.</ng-template>
          <ng-template hellTableShellCell="actions" let-row="row">
            <button
              hellButton
              size="sm"
              variant="ghost"
              type="button"
              [disabled]="!row.getCanExpand()"
              [attr.aria-expanded]="row.getIsExpanded()"
              (click)="row.getToggleExpandedHandler()($event)"
            >
              Details
            </button>
          </ng-template>
          <ng-template hellTableShellExpandedRow let-row="row">
            {{ row.original.name }} expanded.
          </ng-template>
        </hell-tanstack-table>
      </section>
    </article>
  `,
})
export class TableA11yHarnessPage {
  protected readonly people = people;
  protected readonly activeId = signal('ada');
  protected readonly selectedId = signal('grace');
  protected readonly sort = signal<'asc' | 'desc' | null>(null);
  protected readonly resizeSort = signal<'asc' | 'desc' | null>(null);
  protected readonly resizeCommitCount = signal(0);
  protected readonly resizeSortCount = signal(0);
  protected readonly resizeActionCount = signal(0);
  protected readonly resizeWidths = signal<Record<'name' | 'role', number>>({
    name: 160,
    role: 120,
  });
  protected readonly resizeAdapter: HellTableResizeAdapter = {
    before: this.resizeItem('name'),
    after: this.resizeItem('role'),
  };
  protected readonly rows = signal<Person[]>([...people]);
  protected readonly expanded = signal<ExpandedState>({ ada: true });
  protected readonly columns: ColumnDef<typeof features, Person>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'role', header: 'Role' },
    { id: 'actions', header: 'Actions' },
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

  protected readonly pinnedColumns: ColumnDef<typeof features, Person>[] = [
    { accessorKey: 'name', header: 'Name', size: 160 },
    { accessorKey: 'role', header: 'Role', size: 160 },
    { id: 'team', header: 'Team', accessorFn: (row) => row.id, size: 160 },
    { id: 'region', header: 'Region', accessorFn: () => 'eu-central-1', size: 160 },
    { id: 'status', header: 'Status', accessorFn: () => 'Active', size: 160 },
    { id: 'updated', header: 'Updated', accessorFn: () => '2 days ago', size: 160 },
  ];
  protected readonly pinnedTable = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.pinnedColumns,
    getRowId: (row) => row.id,
    // Pinning is logical in v9: 'left'/'right' became 'start'/'end'.
    initialState: { columnPinning: { start: ['name', 'role'], end: [] } },
  }));

  protected sortedPeople(): readonly Person[] {
    const direction = this.sort();
    if (!direction) return people;
    return [...people].sort((a, b) =>
      direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }

  protected toggleSort(): void {
    this.sort.update((current) => (current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'));
  }

  protected onResizeCommit(_event: HellTableResizeEvent): void {
    this.resizeCommitCount.update((count) => count + 1);
  }

  protected incrementResizeSort(): void {
    this.resizeSortCount.update((count) => count + 1);
  }

  protected incrementResizeAction(): void {
    this.resizeActionCount.update((count) => count + 1);
  }

  private resizeItem(columnId: 'name' | 'role'): HellTableResizeItem {
    return {
      columnId,
      measure: () => this.resizeWidths()[columnId],
      minSize: () => 72,
      setSize: (px) => this.setResizeWidth(columnId, px),
      commitSize: (px) => this.setResizeWidth(columnId, px),
    };
  }

  private setResizeWidth(columnId: 'name' | 'role', px: number): void {
    this.resizeWidths.update((current) => ({ ...current, [columnId]: px }));
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
