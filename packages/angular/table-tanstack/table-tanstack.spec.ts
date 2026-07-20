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
import { HellButton } from '@hell-ui/angular/button';
import { HellTanStackVirtualRows } from '@hell-ui/angular/table-tanstack/virtual';

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

@Component({
  selector: 'hell-test-column-filter-host',
  standalone: true,
  imports: [HellTanStackColumnFilter],
  template: `<hell-tanstack-column-filter [table]="table" columnId="name" />`,
})
class ColumnFilterHost {
  readonly table = createAngularTable<Person>(() => ({
    data: people,
    columns: [{ accessorKey: 'name', header: 'Name' }],
    getCoreRowModel: getCoreRowModel(),
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

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
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

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}

function text(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}
