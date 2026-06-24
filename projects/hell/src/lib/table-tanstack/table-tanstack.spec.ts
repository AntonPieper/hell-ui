import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createAngularTable,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type ExpandedState,
  type PaginationState,
  type Row,
  type RowSelectionState,
} from '@tanstack/angular-table';

import {
  HellTableStatus,
  HellTanStackGlobalFilter,
  HellTanStackPagination,
  HellTanStackTable,
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellError,
  HellTableShellExpandedRow,
  HellTableShellFooter,
  HellTableShellLoading,
} from './table-tanstack';
import { HellButton } from '../primitives/button/button';
import { HellTanStackVirtualRows } from './virtual/virtual-rows';

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
  protected readonly selectedRowClass = (row: Row<Person>) =>
    row.getIsSelected() ? 'bg-hell-primary-soft' : null;

  readonly columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: (context) => `Person ${context.getValue<string>()}`,
      meta: { hell: { cellClass: 'name-cell', headerClass: 'name-header' } },
    },
    { accessorKey: 'role', header: 'Role' },
    { id: 'actions', header: 'Actions' },
  ];

  readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  readonly columns: ColumnDef<Person>[] = [{ accessorKey: 'name', header: 'Name' }];

  readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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

describe('Hell TanStack table shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellHost, ConflictHost, MissingStatusHost, VirtualRowsHost, FilterHost],
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
    expect(input?.classList.contains('hell-tanstack-filter')).toBe(false);
    expect(input?.classList.contains('inline-flex')).toBe(true);
    expect(input?.classList.contains('min-w-[calc(var(--spacing)*44)]')).toBe(true);
    expect(input?.classList.contains('rounded-hell-sm')).toBe(true);
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
});

function text(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}
