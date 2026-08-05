import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
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
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/angular-table';

import {
  HellTableStatus,
  HellTanStackColumnFilter,
  HellTanStackGlobalFilter,
  HellTanStackPagination,
  HellTanStackTable,
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellError,
  HellTableShellExpandedRow,
  HellTableShellFooter,
  HellTableShellLoading,
  HellTableShellToolbar,
} from './table-tanstack';
import { HellButton } from 'hell-ui/button';
import { HellTanStackVirtualRows } from 'hell-ui/table-tanstack/virtual';
import { expectUiRouting, sortClasses } from '../spec-helpers';

// Every feature the shell classes under test require, registered once for all
// hosts. v9 gates feature APIs on registration, so a host that skipped one would
// fail to type-check against the shell rather than fail at runtime.
const features = tableFeatures({
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  expandedRowModel: createExpandedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});

/**
 * A client-side feature set: sorted and filtered row models plus the function
 * registries `auto` resolves through. v9 stopped bundling the built-ins, so a
 * table that installs the row models without the registries silently sorts
 * lexically and drops column filters instead of failing.
 */
const clientFeatures = tableFeatures({
  columnFilteringFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
});

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const people: Person[] = [
  { id: 'ada', name: 'Ada', role: 'Engineer' },
  { id: 'grace', name: 'Grace', role: 'Admiral' },
];

@Component({
  selector: 'hell-test-shell-host',
  standalone: true,
  imports: [
    HellTanStackTable,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellError,
    HellTableShellLoading,
    HellTableShellToolbar,
    HellTableShellFooter,
    HellTanStackPagination,
    HellButton,
  ],
  template: `
    <hell-tanstack-table [table]="table" [status]="status()" [rowClass]="selectedRowClass">
      <ng-template hellTableShellCell="actions" let-row="row" let-cell>
        <button hellButton type="button" data-action>
          {{ row.original.name }} {{ cell.column.id }}
        </button>
      </ng-template>

      <ng-template hellTableShellLoading>Loading rows</ng-template>
      <ng-template hellTableShellEmpty>No rows</ng-template>
      <ng-template hellTableShellError let-error>{{ error }}</ng-template>

      <span hellTableShellToolbar data-testid="plain-toolbar">Tools</span>
      <span hellTableShellFooter data-testid="selected-summary">2 selected</span>
      <hell-tanstack-pagination hellTableShellFooter [table]="table" [pageSizeOptions]="[1, 2]" />
    </hell-tanstack-table>
  `,
})
class ShellHost {
  readonly rows = signal<Person[]>(people);
  readonly status = signal(HellTableStatus.READY);
  readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 1 });
  readonly rowSelection = signal<RowSelectionState>({ ada: true });
  protected readonly selectedRowClass = (row: Row<typeof features, Person>) =>
    row.getIsSelected() ? 'bg-hell-primary-soft' : null;

  readonly columns: ColumnDef<typeof features, Person>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (context) => `Person ${context.getValue<string>()}`,
      meta: { hell: { cellClass: 'name-cell', headerClass: 'name-header' } },
    },
    { accessorKey: 'role', header: 'Role' },
    { id: 'actions', header: 'Actions' },
  ];

  readonly table = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: { pagination: this.pagination(), rowSelection: this.rowSelection() },
    onPaginationChange: (updater) =>
      this.pagination.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
    onRowSelectionChange: (updater) =>
      this.rowSelection.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
  }));
}

@Component({
  selector: 'hell-test-conflict-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellCell, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table">
      <ng-template hellTableShellCell="name" let-cell>{{ cell.getValue() }}</ng-template>
      <ng-template hellTableShellEmpty>Empty</ng-template>
    </hell-tanstack-table>
  `,
})
class ConflictHost extends ShellHost {}

@Component({
  selector: 'hell-test-missing-status-host',
  standalone: true,
  imports: [HellTanStackTable],
  template: `<hell-tanstack-table [table]="table" [status]="status()" />`,
})
class MissingStatusHost extends ShellHost {}

@Component({
  selector: 'hell-test-virtual-host',
  standalone: true,
  imports: [
    HellTanStackTable,
    HellTanStackVirtualRows,
    HellTableShellEmpty,
    HellTableShellExpandedRow,
  ],
  template: `
    <hell-tanstack-table [table]="table" hellTanStackVirtualRows>
      <ng-template hellTableShellEmpty>No rows</ng-template>
      <ng-template hellTableShellExpandedRow let-row="row">
        <span data-expanded>{{ row.original.name }} details</span>
      </ng-template>
    </hell-tanstack-table>
  `,
})
class VirtualRowsHost {
  readonly rows = signal<Person[]>(people);
  readonly expanded = signal<ExpandedState>({ ada: true });
  readonly columns: ColumnDef<typeof features, Person>[] = [{ accessorKey: 'name', header: 'Name' }];

  readonly table = injectTable(() => ({
    features,
    data: this.rows(),
    columns: this.columns,
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
    state: { expanded: this.expanded() },
    onExpandedChange: (updater) =>
      this.expanded.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
  }));
}

@Component({
  selector: 'hell-test-filter-host',
  standalone: true,
  imports: [HellTanStackGlobalFilter],
  template: `<hell-tanstack-global-filter [table]="table" />`,
})
class FilterHost extends ShellHost {}

@Component({
  selector: 'hell-test-column-filter-host',
  standalone: true,
  imports: [HellTanStackColumnFilter],
  template: `<hell-tanstack-column-filter [table]="table" columnId="name" />`,
})
class ColumnFilterHost {
  readonly table = injectTable(() => ({
    features,
    data: people,
    columns: [{ accessorKey: 'name', header: 'Name' }],
    initialState: {
      columnFilters: [{ id: 'name', value: { term: 'Ada' } }],
    },
  }));
}

@Component({
  selector: 'hell-test-styled-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellToolbar, HellTableShellFooter, HellTanStackPagination],
  template: `
    <hell-tanstack-table
      id="styled-shell"
      [table]="table"
      [ui]="{
        root: 'rounded-none border-hell-danger',
        toolbar: 'bg-hell-danger justify-end',
        footer: 'bg-hell-danger justify-start',
        scrollport: 'overflow-hidden',
      }"
    >
      <span hellTableShellToolbar>Toolbar</span>
      <hell-tanstack-pagination
        hellTableShellFooter
        id="styled-pagination"
        [table]="table"
        [pageSizeOptions]="[1, 2]"
        [ui]="{ root: 'gap-hell-6', pageSize: 'bg-hell-danger whitespace-normal' }"
      />
    </hell-tanstack-table>
  `,
})
class StyledShellHost extends ShellHost {}

@Component({
  selector: 'hell-test-resizable-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table">
      <ng-template hellTableShellEmpty>No rows</ng-template>
    </hell-tanstack-table>
  `,
})
class ResizableShellHost {
  readonly resizingEnabled = signal(true);
  readonly columnSizing = signal<ColumnSizingState>({});
  readonly columns: ColumnDef<typeof features, Person>[] = [
    { id: 'a', header: 'A', size: 200, minSize: 120 },
    { id: 'b', header: 'B', size: 160 },
    { id: 'c', header: 'C', size: 140 },
    // Opted out of resizing, so neither it nor its leading neighbour pairs up.
    { id: 'd', header: 'D', size: 120, enableResizing: false },
  ];

  readonly table = injectTable(() => ({
    features,
    data: people,
    columns: this.columns,
    enableColumnResizing: this.resizingEnabled(),
    getRowId: (row) => row.id,
    state: { columnSizing: this.columnSizing() },
    onColumnSizingChange: (updater) =>
      this.columnSizing.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
  }));
}

/**
 * The same table with column sizing left to TanStack: no `state.columnSizing`,
 * no `onColumnSizingChange`. Sizing then lives in the adapter's own state, which
 * does not refresh between two synchronous writes.
 */
@Component({
  selector: 'hell-test-uncontrolled-resizable-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table">
      <ng-template hellTableShellEmpty>No rows</ng-template>
    </hell-tanstack-table>
  `,
})
class UncontrolledResizableShellHost {
  readonly columns: ColumnDef<typeof features, Person>[] = [
    { id: 'a', header: 'A', size: 200, minSize: 120 },
    { id: 'b', header: 'B', size: 160 },
  ];

  readonly table = injectTable(() => ({
    features,
    data: people,
    columns: this.columns,
    enableColumnResizing: true,
    getRowId: (row) => row.id,
  }));
}

/**
 * Pins columns that are not already leading, so the rendered order differs from
 * the declared leaf order. Every column carries a distinct size, which is what
 * makes a `<colgroup>` built in the wrong order detectable.
 */
@Component({
  selector: 'hell-test-nonleading-pinned-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table">
      <ng-template hellTableShellEmpty>No rows</ng-template>
    </hell-tanstack-table>
  `,
})
class NonLeadingPinnedShellHost {
  readonly columns: ColumnDef<typeof features, Person>[] = [
    { id: 'a', header: 'A', size: 200 },
    { id: 'b', header: 'B', size: 160 },
    { id: 'c', header: 'C', size: 140 },
    { id: 'd', header: 'D', size: 120 },
  ];

  readonly table = injectTable(() => ({
    features,
    data: people,
    columns: this.columns,
    enableColumnResizing: true,
    getRowId: (row) => row.id,
    // 'c' pinned to start and 'a' to end, so the table renders c, b, d, a.
    initialState: { columnPinning: { start: ['c'], end: ['a'] } },
  }));
}

interface StatusPerson {
  readonly id: string;
  readonly name: string;
  readonly status: 'active' | 'away';
}

/** Numbered names and a status column, the two shapes `auto` resolution decides. */
const statusPeople: StatusPerson[] = Array.from({ length: 12 }, (_, index) => ({
  id: `person-${index + 1}`,
  name: `Person ${index + 1}`,
  status: index % 4 === 0 ? 'away' : 'active',
}));

@Component({
  selector: 'hell-test-client-sorted-host',
  standalone: true,
  imports: [HellTanStackTable, HellTableShellEmpty],
  template: `
    <hell-tanstack-table [table]="table">
      <ng-template hellTableShellEmpty>No rows</ng-template>
    </hell-tanstack-table>
  `,
})
class ClientSortedShellHost {
  readonly sorting = signal<SortingState>([{ id: 'name', desc: false }]);
  readonly columnFilters = signal<ColumnFiltersState>([]);
  readonly columns: ColumnDef<typeof clientFeatures, StatusPerson>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
  ];

  readonly table = injectTable(() => ({
    features: clientFeatures,
    data: statusPeople,
    columns: this.columns,
    getRowId: (row) => row.id,
    state: { sorting: this.sorting(), columnFilters: this.columnFilters() },
    onSortingChange: (updater) =>
      this.sorting.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
    onColumnFiltersChange: (updater) =>
      this.columnFilters.update((current) =>
        typeof updater === 'function' ? updater(current) : updater,
      ),
  }));
}

describe('Hell TanStack table shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ShellHost,
        ConflictHost,
        MissingStatusHost,
        VirtualRowsHost,
        FilterHost,
        ColumnFilterHost,
        StyledShellHost,
        ResizableShellHost,
        UncontrolledResizableShellHost,
        NonLeadingPinnedShellHost,
        ClientSortedShellHost,
      ],
    }).compileComponents();
  });

  it('renders a caller-owned TanStack table with FlexRender and projected native cell context', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(text(root)).toContain('Person Ada');
    expect(text(root)).toContain('Engineer');
    expect(text(root)).toContain('Ada actions');
    expect(root.querySelector('td.name-cell')?.textContent).toContain('Person Ada');
    expect(root.querySelector('th.name-header')?.textContent).toContain('Name');
    expect(root.querySelector('tr[data-hell-table-shell-row]')?.hasAttribute('data-selected')).toBe(
      false,
    );
  });

  it('lets callers map TanStack row selection to a rowClass visual', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.componentInstance.pagination.set({ pageIndex: 0, pageSize: 2 });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const [selectedRow, idleRow] = root.querySelectorAll('tr[data-hell-table-shell-row]');

    // The rowClass value is the caller's own fixture; the shell only reflects it.
    expect(selectedRow?.classList.contains('bg-hell-primary-soft')).toBe(true);
    expect(idleRow?.classList.contains('bg-hell-primary-soft')).toBe(false);
  });

  it('infers empty from the ready row model and keeps footer projection repeatable', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.componentInstance.rows.set([]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(text(root)).toContain('No rows');
    expect(root.querySelector('[data-testid="selected-summary"]')?.textContent).toContain(
      '2 selected',
    );
    expect(root.querySelector('hell-tanstack-pagination')).not.toBeNull();
    expect(root.querySelector('hell-tanstack-pagination hell-pagination')).not.toBeNull();
    expect(root.querySelectorAll('hell-tanstack-pagination [role="navigation"]')).toHaveLength(1);
    expect(root.querySelector('hell-tanstack-pagination nav')).toBeNull();
  });

  it('adapts the reusable Hell pagination strip to TanStack pagination APIs', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const nextPage = root.querySelector(
      'hell-tanstack-pagination hell-pagination button[aria-label="Page 2"]',
    ) as HTMLButtonElement | null;

    expect(nextPage).not.toBeNull();
    nextPage?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.pagination().pageIndex).toBe(1);
    expect(text(root)).toContain('Person Grace');
  });

  it('styles TanStack filter inputs through the HellInput ui pipeline', () => {
    const fixture = TestBed.createComponent(FilterHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[hellInput]') as HTMLInputElement | null;

    expect(input).not.toBeNull();
    expect(input?.getAttribute('data-slot')).toBe('root');
    // The filter control's composed input surface is pinned by snapshot below.
    expect({ filterInput: sortClasses(input?.className ?? '') }).toMatchSnapshot(
      'tanstackFilterInput',
    );
  });

  it('does not expose object-valued column filters as "[object Object]" text', () => {
    const fixture = TestBed.createComponent(ColumnFilterHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[hellInput]') as HTMLInputElement | null;

    expect(input?.value).toBe('');
  });

  it('renders loading and error states from the single status value', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.componentInstance.status.set(HellTableStatus.LOADING);
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Loading rows');

    fixture.componentInstance.status.set(HellTableStatus.error('Nope'));
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Nope');
  });

  it('throws a clear dev error when projected cells conflict with TanStack renderers', () => {
    const fixture = TestBed.createComponent(ConflictHost);
    expect(() => fixture.detectChanges()).toThrow(/cell template for column "name" conflicts/);
  });

  it('throws in dev mode when a required status view has no local template or provider', () => {
    const fixture = TestBed.createComponent(MissingStatusHost);
    fixture.componentInstance.rows.set([]);
    expect(() => fixture.detectChanges()).toThrow(/needs a empty state template/);
  });

  it('lets the optional virtual body strategy render expanded shell rows', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(
      root.querySelector('hell-tanstack-table')?.getAttribute('data-hell-tanstack-virtual-rows'),
    ).toBe('true');
    expect(root.querySelectorAll('[data-hell-table-virtual-row]')).toHaveLength(3);
    expect(
      root.querySelector('[data-hell-table-virtual-row-kind="expanded"]')?.textContent,
    ).toContain('Ada details');
    expect(
      (
        root.querySelector('[data-hell-table-virtual-body]') as HTMLElement | null
      )?.style.getPropertyValue('--hell-table-virtual-total-size'),
    ).toBe('');
  });

  it('publishes the TanStack column size and matching grow factor on body cells', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const cell = query(root, 'td[data-column-id="name"]');
    const size = fixture.componentInstance.table.getColumn('name')?.getSize();

    // The header keeps the native table grid, which stretches columns
    // proportionally when the shell table is wider than the TanStack total
    // size. The grow factor lets the flex body row reproduce that same grid.
    expect(cell.style.getPropertyValue('--hell-table-column-size')).toBe(`${size}px`);
    expect(cell.style.getPropertyValue('--hell-table-column-grow')).toBe(`${size}`);
  });

  it('renders no resize separators until TanStack column resizing is turned on', () => {
    const fixture = TestBed.createComponent(ShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    // TanStack treats an unset `enableColumnResizing` as enabled, so the shell
    // requires an explicit opt-in rather than growing handles on every table.
    expect(
      root
        .querySelector('hell-tanstack-table')
        ?.getAttribute('data-hell-tanstack-resizable-columns'),
    ).toBeNull();
    expect(root.querySelectorAll('[hellTableResizeHandle]')).toHaveLength(0);
  });

  it('renders a separator per header cell that has a resizable trailing neighbour', () => {
    const fixture = TestBed.createComponent(ResizableShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(
      root
        .querySelector('hell-tanstack-table')
        ?.getAttribute('data-hell-tanstack-resizable-columns'),
    ).toBe('true');

    const withHandle = [...root.querySelectorAll('th[data-column-id]')]
      .filter((header) => header.querySelector('[hellTableResizeHandle]'))
      .map((header) => header.getAttribute('data-column-id'));
    // "c" pairs with the opted-out "d", and "d" is trailing, so neither pairs up.
    expect(withHandle).toEqual(['a', 'b']);

    const handle = query(root, 'th[data-column-id="a"] [hellTableResizeHandle]');
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    expect(handle.getAttribute('aria-label')).toBe('Resize column a');
  });

  it('follows the live TanStack resizing option instead of a cached copy of it', () => {
    const fixture = TestBed.createComponent(ResizableShellHost);
    // Rendered once with resizing off, so a snapshot of the option taken on the
    // first read would keep the separators hidden after the caller turns it on.
    fixture.componentInstance.resizingEnabled.set(false);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const handles = () => root.querySelectorAll('[hellTableResizeHandle]').length;

    expect(handles()).toBe(0);

    fixture.componentInstance.resizingEnabled.set(true);
    fixture.detectChanges();
    expect(handles()).toBe(2);

    fixture.componentInstance.resizingEnabled.set(false);
    fixture.detectChanges();
    expect(handles()).toBe(0);
  });

  it('commits a keyboard resize into TanStack column sizing without changing the total', () => {
    const fixture = TestBed.createComponent(ResizableShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const handle = query(root, 'th[data-column-id="a"] [hellTableResizeHandle]');
    const totalBefore = fixture.componentInstance.table.getTotalSize();

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    // The pair transacts against itself: "a" grows by the key step and "b"
    // gives up exactly that much, so the table's total size is untouched.
    expect(fixture.componentInstance.columnSizing()).toEqual({ a: 216, b: 144 });
    expect(fixture.componentInstance.table.getTotalSize()).toBe(totalBefore);
  });

  it('commits both sides of a resize when TanStack owns the column sizing state', () => {
    const fixture = TestBed.createComponent(UncontrolledResizableShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const { table } = fixture.componentInstance;
    const handle = query(root, 'th[data-column-id="a"] [hellTableResizeHandle]');
    const totalBefore = table.getTotalSize();

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    // Both sides are written back to back with no render in between, and
    // uncontrolled sizing state does not refresh across them. Writing one
    // column per updater would compute the second from the same state as the
    // first, dropping "a" and growing the table by the whole key step.
    expect(table.atoms.columnSizing.get()).toEqual({ a: 216, b: 144 });
    expect(table.getTotalSize()).toBe(totalBefore);

    const col = query(root, 'colgroup col:first-child') as HTMLTableColElement;
    expect(col.style.width).toBe('216px');
  });

  it('flows a committed width into the colgroup and both body cell size variables', () => {
    const fixture = TestBed.createComponent(ResizableShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const handle = query(root, 'th[data-column-id="a"] [hellTableResizeHandle]');

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    // One committed width, three consumers: the native header grid reads the
    // colgroup, and virtual body rows reproduce it from size plus grow.
    const col = query(root, 'colgroup col:first-child') as HTMLTableColElement;
    expect(col.style.width).toBe('216px');

    const cell = query(root, 'td[data-column-id="a"]');
    expect(cell.style.getPropertyValue('--hell-table-column-size')).toBe('216px');
    expect(cell.style.getPropertyValue('--hell-table-column-grow')).toBe('216');
  });

  it('clamps a resize at the TanStack minSize of the shrinking column', () => {
    const fixture = TestBed.createComponent(ResizableShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const handle = query(root, 'th[data-column-id="a"] [hellTableResizeHandle]');

    // Home drives the leading column to its minimum, which is TanStack's own
    // `minSize` rather than a sizing bound the shell invented.
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.columnSizing()).toEqual({ a: 120, b: 240 });
  });

  it('exposes the shell chrome parts through public data-slot markers', () => {
    const fixture = TestBed.createComponent(StyledShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const shell = query(root, '#styled-shell');
    const toolbar = query(root, '#styled-shell [data-slot="toolbar"]');
    const scrollport = query(root, '#styled-shell [data-slot="scrollport"]');
    const footer = query(root, '#styled-shell [data-slot="footer"]');

    expect(shell.getAttribute('data-slot')).toBe('root');
    expect(toolbar.getAttribute('data-slot')).toBe('toolbar');
    expect(scrollport.getAttribute('data-slot')).toBe('scrollport');
    expect(footer.getAttribute('data-slot')).toBe('footer');

    // Behavior/measurement markers are preserved alongside the public parts.
    expect(toolbar.hasAttribute('data-hell-table-shell-toolbar')).toBe(true);
    expect(scrollport.hasAttribute('data-hell-table-shell-scrollport')).toBe(true);
    expect(footer.hasAttribute('data-hell-table-shell-footer')).toBe(true);
  });

  it('merges shell ui part maps and lets them win over recipe classes per part', () => {
    const fixture = TestBed.createComponent(StyledShellHost);
    const defaultsFixture = TestBed.createComponent(ShellHost);
    fixture.detectChanges();
    defaultsFixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const defaults = defaultsFixture.nativeElement as HTMLElement;
    const shell = query(root, '#styled-shell');
    const toolbar = query(root, '#styled-shell [data-slot="toolbar"]');
    const scrollport = query(root, '#styled-shell [data-slot="scrollport"]');
    const footer = query(root, '#styled-shell [data-slot="footer"]');

    expectUiRouting(
      query(defaults, 'hell-tanstack-table').className,
      shell.className,
      'rounded-none border-hell-danger',
    );
    expectUiRouting(
      query(defaults, '[data-slot="toolbar"]').className,
      toolbar.className,
      'bg-hell-danger justify-end',
    );
    expectUiRouting(
      query(defaults, '[data-slot="footer"]').className,
      footer.className,
      'bg-hell-danger justify-start',
    );
    expectUiRouting(
      query(defaults, '[data-slot="scrollport"]').className,
      scrollport.className,
      'overflow-hidden',
    );
  });

  it('exposes pagination parts and lets ui maps win over recipe classes', () => {
    const fixture = TestBed.createComponent(StyledShellHost);
    const defaultsFixture = TestBed.createComponent(ShellHost);
    fixture.detectChanges();
    defaultsFixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const defaults = defaultsFixture.nativeElement as HTMLElement;
    const pagination = query(root, '#styled-pagination');
    const pageSize = query(root, '#styled-pagination [data-slot="pageSize"]');

    expect(pagination.getAttribute('data-slot')).toBe('root');
    expect(pageSize.getAttribute('data-slot')).toBe('pageSize');

    expectUiRouting(
      query(defaults, 'hell-tanstack-pagination').className,
      pagination.className,
      'gap-hell-6',
    );
    expectUiRouting(
      query(defaults, 'hell-tanstack-pagination [data-slot="pageSize"]').className,
      pageSize.className,
      'bg-hell-danger whitespace-normal',
    );

    // The rows-per-page select delegates to the nested hellNativeSelect root part.
    const select = query(root, '#styled-pagination select[hellNativeSelect]');
    expect(select.getAttribute('data-slot')).toBe('root');
  });

  it('lays the colgroup out in pinned render order, not declared column order', () => {
    const fixture = TestBed.createComponent(NonLeadingPinnedShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    // TanStack renders start-pinned, then centre, then end-pinned. Reading the
    // flat leaf list instead would emit the declared a, b, c, d order and hand
    // every column the wrong width.
    const headerIds = [...root.querySelectorAll('thead th')].map((cell) =>
      cell.getAttribute('data-column-id'),
    );
    const bodyIds = [...root.querySelectorAll('tbody tr:first-child td')].map((cell) =>
      cell.getAttribute('data-column-id'),
    );
    const colWidths = [...root.querySelectorAll('colgroup col')].map(
      (col) => (col as HTMLTableColElement).style.width,
    );

    expect(headerIds).toEqual(['c', 'b', 'd', 'a']);
    expect(bodyIds).toEqual(['c', 'b', 'd', 'a']);
    expect(colWidths).toEqual(['140px', '160px', '120px', '200px']);
  });

  it('pairs each resize separator with its rendered neighbour when pinning reorders columns', () => {
    const fixture = TestBed.createComponent(NonLeadingPinnedShellHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    const handled = [...root.querySelectorAll('thead th')]
      .filter((cell) => cell.querySelector('[data-hell-table-shell-resize-handle]'))
      .map((cell) => cell.getAttribute('data-column-id'));

    // 'a' renders last, so it has no trailing neighbour to transact against.
    // Against the declared order it would be 'd' that lost its separator.
    expect(handled).toEqual(['c', 'b', 'd']);
  });

  it('sorts a numbered column naturally and applies a column filter through the registries', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const fixture = TestBed.createComponent(ClientSortedShellHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;

      // `auto` resolves to `alphanumeric` here. Unregistered it falls back to
      // `sortFn_basic`, which orders lexically as Person 1, Person 10, Person 11.
      expect(host.table.getRowModel().rows.map((row) => row.original.name)).toEqual([
        'Person 1',
        'Person 2',
        'Person 3',
        'Person 4',
        'Person 5',
        'Person 6',
        'Person 7',
        'Person 8',
        'Person 9',
        'Person 10',
        'Person 11',
        'Person 12',
      ]);

      // `auto` resolves to `includesString`. Unregistered it returns undefined
      // and the filter is skipped, leaving all 12 rows visible.
      host.columnFilters.set([{ id: 'status', value: 'away' }]);
      fixture.detectChanges();
      const filtered = host.table.getFilteredRowModel().rows;
      expect(filtered.map((row) => row.original.name)).toEqual([
        'Person 1',
        'Person 5',
        'Person 9',
      ]);

      // The registration warnings are the loud half of the same defect.
      const messages = warn.mock.calls.map((call) => String(call[0]));
      expect(messages.filter((message) => message.includes('is not registered'))).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(ShellHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;

      expect({
        shell: sortClasses(query(root, 'hell-tanstack-table').className),
        toolbar: sortClasses(query(root, '[data-slot="toolbar"]').className),
        scrollport: sortClasses(query(root, '[data-slot="scrollport"]').className),
        footer: sortClasses(query(root, '[data-slot="footer"]').className),
        pagination: sortClasses(query(root, 'hell-tanstack-pagination').className),
        pageSize: sortClasses(
          query(root, 'hell-tanstack-pagination [data-slot="pageSize"]').className,
        ),
      }).toMatchSnapshot('tanstackTableShell');
    });
  });
});

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}

function text(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}
