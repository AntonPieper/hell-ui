import { Component, TemplateRef, ViewChild, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  createAngularTable,
  flexRenderComponent,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnSizingState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/angular-table';

import {
  HellTanStackFlexRenderOutlet,
  hellTanStackFlexRenderValue,
  hellTanStackIsFlexRenderValue,
  hellTanStackResolveFlexRenderValue,
  hellTanStackTableModel,
  injectFlexRenderContext,
  type HellTanStackFlexRenderValue,
  type HellTanStackRowKey,
} from './table-tanstack';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada', active: true },
  { id: 'grace', name: 'Grace', active: false },
];

@Component({
  selector: 'hell-test-tanstack-renderer',
  template: `Component {{ context.name }}`,
})
class ComponentFlexRenderer {
  readonly context = injectFlexRenderContext<{ readonly name: string }>();
}

@Component({
  selector: 'hell-test-function-flex-render-host',
  imports: [HellTanStackFlexRenderOutlet],
  template: `<hell-tanstack-flex-render [value]="value" />`,
})
class FunctionFlexRenderHost {
  readonly value = hellTanStackFlexRenderValue(
    (context: { readonly name: string }) => `Hello ${context.name}`,
    { name: 'Ada' },
  );
}

@Component({
  selector: 'hell-test-template-flex-render-host',
  imports: [HellTanStackFlexRenderOutlet],
  template: `
    <ng-template #nameTemplate let-context>{{ context.name }}</ng-template>
    @if (value(); as render) {
      <hell-tanstack-flex-render [value]="render" />
    }
  `,
})
class TemplateFlexRenderHost {
  @ViewChild('nameTemplate') template?: TemplateRef<{ $implicit: { readonly name: string } }>;
  readonly value = signal<HellTanStackFlexRenderValue<{ readonly name: string }> | null>(null);

  useTemplate(): void {
    if (!this.template) throw new Error('Expected template.');
    this.value.set(hellTanStackFlexRenderValue(this.template, { name: 'Grace' }));
  }
}

@Component({
  selector: 'hell-test-component-flex-render-host',
  imports: [HellTanStackFlexRenderOutlet],
  template: `<hell-tanstack-flex-render [value]="value" />`,
})
class ComponentFlexRenderHost {
  readonly value = hellTanStackFlexRenderValue(
    flexRenderComponent(ComponentFlexRenderer),
    { name: 'Linus' },
  );
}

describe('Hell TanStack Table adapter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FunctionFlexRenderHost,
        TemplateFlexRenderHost,
        ComponentFlexRenderHost,
        ComponentFlexRenderer,
      ],
    }).compileComponents();
  });

  it('adapts TanStack header groups, rows, visible cells, and render values into HellTableModel', () => {
    const { model } = createAdapterFixture();

    expect(model.headerGroups().map((group) => group.headers.length)).toEqual([1, 2]);
    const groupHeader = expectDefined(model.headerGroups()[0]?.headers[0]);
    expect(groupHeader.colSpan).toBe(2);
    expect(hellTanStackResolveFlexRenderValue(groupHeader.label)).toBe('Identity');

    const nameHeader = expectDefined(
      model.headerGroups()[1]?.headers.find((header) => header.columnId === 'name'),
    );
    expect(nameHeader.rowSpan).toBe(0);
    expect(hellTanStackResolveFlexRenderValue(nameHeader.label)).toBe('Name');

    expect(model.columns().map((column) => column.id)).toEqual(['name', 'active']);
    expect(model.visibleColumns().map((column) => column.id)).toEqual(['name', 'active']);
    expect(model.columns()[0]).toEqual(
      expect.objectContaining({
        id: 'name',
        accessorKey: 'name',
        sortable: true,
        size: 180,
        minSize: 120,
        maxSize: 320,
      }),
    );
    expect(model.rows().map((row) => row.key)).toEqual(['ada', 'grace']);

    const cells = model.cellsForRow('ada');
    expect(cells.map((cell) => cell.column.id)).toEqual(['name', 'active']);
    expect(cells[0]?.value).toBe('Ada');
    expect(cells[0]?.renderValue).toBe('Ada');
    expect(hellTanStackResolveFlexRenderValue(cells[0]?.render)).toBe('Person Ada');

    const row = expectDefined(model.rows()[0]);
    const column = expectDefined(model.visibleColumns()[0]);
    const renderer = model.render.cells['name'];
    if (typeof renderer !== 'function') throw new Error('Expected TanStack cell renderer.');
    const rendered = renderer({ row, column, value: 'Ada' });
    expect(hellTanStackIsFlexRenderValue(rendered)).toBe(true);
    expect(hellTanStackResolveFlexRenderValue(rendered)).toBe('Person Ada');
  });

  it('delegates sorting, selection, visibility, and sizing commands to TanStack state', () => {
    const { model, sorting, rowSelection, columnVisibility, columnSizing } = createAdapterFixture();

    model.commands.setSorting([{ columnId: 'name', direction: 'desc' }]);
    expect(sorting()).toEqual([{ id: 'name', desc: true }]);
    expect(model.state.sorting.value()).toEqual([{ columnId: 'name', direction: 'desc' }]);
    expect(model.rows().map((row) => row.key)).toEqual(['grace', 'ada']);
    expect(model.rows().map((row) => row.index)).toEqual([0, 1]);
    expect(model.rows()[0]?.tanStackRow.index).toBe(1);

    model.commands.setRowSelected('ada', true);
    expect(rowSelection()).toEqual({ ada: true });
    expect(model.state.rowSelection.value()).toEqual({ ada: true });

    const customKeys = createAdapterFixture({ rowKey: (row) => `person:${row.original.id}` });
    customKeys.model.commands.setRowSelected('person:ada', true);
    expect(customKeys.rowSelection()).toEqual({ ada: true });
    expect(customKeys.model.state.rowSelection.value()).toEqual({ 'person:ada': true });
    customKeys.rowSelection.set({ grace: true });
    expect(customKeys.model.state.rowSelection.value()).toEqual({ 'person:grace': true });
    customKeys.model.commands.clearRowSelection();
    expect(customKeys.rowSelection()).toEqual({});

    model.commands.setColumnVisible('active', false);
    expect(columnVisibility()).toEqual({ active: false });
    expect(model.visibleColumns().map((column) => column.id)).toEqual(['name']);
    expect(model.cellsForRow('ada').map((cell) => cell.column.id)).toEqual(['name']);

    model.commands.setColumnSize('name', 240);
    expect(columnSizing()).toEqual({ name: 240 });
    expect(model.state.columnSizing.value()).toEqual({ name: 240 });
    expect(model.columns()[0]?.size).toBe(240);
  });

  it('keeps TanStack accessorFn columns engine-owned instead of exposing a wrong Hell accessor', () => {
    const { model } = createAdapterFixture({
      columns: [
        {
          id: 'displayName',
          header: 'Display name',
          accessorFn: (row, index) => `${index}:${row.name}`,
          cell: (context) => context.getValue<string>(),
        },
      ],
    });

    const column = expectDefined(model.columns()[0]);
    expect(column.accessorKey).toBeUndefined();
    expect(column.accessor).toBeUndefined();
    expect(model.cellsForRow('ada')[0]?.value).toBe('0:Ada');
  });

  it('renders TanStack function, TemplateRef, and component FlexRender content without duplicating rendering state', () => {
    const functionFixture = TestBed.createComponent(FunctionFlexRenderHost);
    functionFixture.detectChanges();
    expect(text(functionFixture.nativeElement)).toContain('Hello Ada');

    const templateFixture = TestBed.createComponent(TemplateFlexRenderHost);
    templateFixture.detectChanges();
    templateFixture.componentInstance.useTemplate();
    templateFixture.detectChanges();
    expect(text(templateFixture.nativeElement)).toContain('Grace');

    const componentFixture = TestBed.createComponent(ComponentFlexRenderHost);
    componentFixture.detectChanges();
    expect(text(componentFixture.nativeElement)).toContain('Component Linus');
  });
});

function createAdapterFixture(options: {
  readonly rowKey?: HellTanStackRowKey<Person>;
  readonly columns?: ColumnDef<Person>[];
} = {}) {
  const rows = signal<Person[]>([...people]);
  const sorting = signal<SortingState>([]);
  const rowSelection = signal<RowSelectionState>({});
  const columnVisibility = signal<VisibilityState>({});
  const columnSizing = signal<ColumnSizingState>({ name: 180 });
  const columns: ColumnDef<Person>[] = options.columns ?? [
    {
      id: 'identity',
      header: 'Identity',
      columns: [
        {
          accessorKey: 'name',
          header: () => 'Name',
          cell: (context) => `Person ${context.getValue<string>()}`,
          enableSorting: true,
          size: 180,
          minSize: 120,
          maxSize: 320,
        },
        {
          accessorKey: 'active',
          header: 'Active',
          cell: (context) => (context.getValue<boolean>() ? 'Active' : 'Inactive'),
          enableSorting: false,
        },
      ],
    },
  ];

  const table = createAngularTable<Person>(() => ({
    data: rows(),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnResizing: true,
    state: {
      sorting: sorting(),
      rowSelection: rowSelection(),
      columnVisibility: columnVisibility(),
      columnSizing: columnSizing(),
    },
    onSortingChange: (updater) => applyUpdater(sorting, updater),
    onRowSelectionChange: (updater) => applyUpdater(rowSelection, updater),
    onColumnVisibilityChange: (updater) => applyUpdater(columnVisibility, updater),
    onColumnSizingChange: (updater) => applyUpdater(columnSizing, updater),
  }));

  const model = hellTanStackTableModel({ table, rowKey: options.rowKey });
  return { model, rows, sorting, rowSelection, columnVisibility, columnSizing };
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}

function expectDefined<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected value.');
  return value;
}

function text(root: Element): string {
  return root.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
