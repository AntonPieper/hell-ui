import { signal } from '@angular/core';

import {
  hellTableColumnIsVisible,
  hellTableColumnVisibilityMode,
  hellTableCreateModel,
  hellTableCreateState,
  hellTableInitialColumnVisibility,
  hellTableResolveStateUpdater,
  hellTableRowsFromData,
  hellTableStateChannel,
  hellTableVisibleColumns,
  type HellTableColumn,
  type HellTableSortingState,
} from './table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly age?: number;
}

describe('HellTableModel normalized state', () => {
  it('normalizes stable row keys independently of row order', () => {
    const firstRows = hellTableRowsFromData<Person>([
      { id: 'ada', name: 'Ada' },
      { id: 'grace', name: 'Grace' },
    ]);
    const reorderedRows = hellTableRowsFromData<Person>([
      { id: 'grace', name: 'Grace' },
      { id: 'ada', name: 'Ada' },
    ]);
    const customKeyRows = hellTableRowsFromData(
      [{ slug: 'ada-lovelace', name: 'Ada' }],
      (row) => row.slug,
    );

    expect(firstRows.map((row) => row.key)).toEqual(['ada', 'grace']);
    expect(reorderedRows.map((row) => row.key)).toEqual(['grace', 'ada']);
    expect(customKeyRows.map((row) => row.key)).toEqual(['ada-lovelace']);
    expect(firstRows.map((row) => `row:${row.key}`)).toEqual(['row:ada', 'row:grace']);
    expect(() =>
      hellTableRowsFromData<Person>([
        { id: 'ada', name: 'Ada' },
        { id: 'ada', name: 'Duplicate Ada' },
      ]),
    ).toThrow(/duplicate key "ada"/);
  });

  it('applies state updaters without conflating channels', () => {
    const selection = hellTableStateChannel({} as Record<string, boolean>);
    const state = hellTableCreateState({
      activeRowKey: 'ada',
      rowSelection: { ada: true },
      selectedRowKey: 'grace',
      sorting: [{ columnId: 'name', direction: 'asc' }],
      loading: true,
      error: 'failed',
    });

    selection.update((current) => ({ ...current, ada: true }));
    selection.update({ ada: true, grace: false });
    state.activeRowKey.update(() => null);
    state.sorting.update((current) => [
      ...current,
      { columnId: 'age', direction: 'desc' } satisfies HellTableSortingState,
    ]);
    state.loading.update((current) => !current);
    state.error.set(null);

    expect(hellTableResolveStateUpdater(1, (value) => value + 1)).toBe(2);
    expect(hellTableResolveStateUpdater('old', 'new')).toBe('new');
    expect(selection.value()).toEqual({ ada: true, grace: false });
    expect(state.activeRowKey.value()).toBeNull();
    expect(state.rowSelection.value()).toEqual({ ada: true });
    expect(state.selectedRowKey.value()).toBe('grace');
    expect(state.sorting.value()).toEqual([
      { columnId: 'name', direction: 'asc' },
      { columnId: 'age', direction: 'desc' },
    ]);
    expect(state.loading.value()).toBe(false);
    expect(state.error.value()).toBeNull();
  });

  it('derives visible columns from required columns, definition defaults, and state', () => {
    const columns: readonly HellTableColumn<Person>[] = [
      { id: 'select', header: 'Select', visibility: 'always' },
      { id: 'name', header: 'Name', visibility: 'user-toggleable' },
      { id: 'age', header: 'Age', visibility: 'initially-hidden' },
      { id: 'role', header: 'Role', hideable: true },
    ];
    const model = hellTableCreateModel({ columns, rows: [] });
    const defaultVisibility = hellTableInitialColumnVisibility(columns);
    const initiallyHiddenModel = hellTableCreateModel({
      columns,
      rows: [],
      initialState: { columnVisibility: defaultVisibility },
    });

    expect(hellTableColumnVisibilityMode(columns[0])).toBe('always');
    expect(hellTableColumnVisibilityMode({ visible: false })).toBe('initially-hidden');
    expect(defaultVisibility).toEqual({ age: false });
    expect(hellTableColumnIsVisible(columns[1], {})).toBe(true);
    expect(hellTableColumnIsVisible(columns[1], { name: false })).toBe(false);
    expect(hellTableColumnIsVisible(columns[2], {})).toBe(true);
    expect(hellTableColumnIsVisible(columns[2], { age: true })).toBe(true);
    expect(hellTableColumnIsVisible(columns[0], { select: false })).toBe(true);

    expect(hellTableVisibleColumns(columns, {}).map((column) => column.id)).toEqual([
      'select',
      'name',
      'age',
      'role',
    ]);
    expect(hellTableVisibleColumns(columns, defaultVisibility).map((column) => column.id)).toEqual([
      'select',
      'name',
      'role',
    ]);
    expect(initiallyHiddenModel.visibleColumns().map((column) => column.id)).toEqual([
      'select',
      'name',
      'role',
    ]);

    model.state.columnVisibility.set({ select: false, name: false, age: true });

    expect(model.visibleColumns().map((column) => column.id)).toEqual(['select', 'age', 'role']);
    expect(model.headerGroups()).toEqual([
      {
        id: 'default',
        depth: 0,
        headers: [
          {
            id: 'header:select',
            columnId: 'select',
            column: columns[0],
            label: 'Select',
            colSpan: 1,
          },
          {
            id: 'header:age',
            columnId: 'age',
            column: columns[2],
            label: 'Age',
            colSpan: 1,
          },
          {
            id: 'header:role',
            columnId: 'role',
            column: columns[3],
            label: 'Role',
            colSpan: 1,
          },
        ],
      },
    ]);
  });

  it('clears single selection only when the targeted row key is selected', () => {
    const model = hellTableCreateModel<Person>({
      columns: [{ id: 'name', header: 'Name' }],
      rows: [
        { id: 'ada', name: 'Ada' },
        { id: 'grace', name: 'Grace' },
      ],
    });

    model.commands.selectSingleRow('ada');
    model.commands.toggleSingleRowSelected('grace', false);
    model.commands.clearSingleRowSelection('grace');

    expect(model.state.selectedRowKey.value()).toBe('ada');
    expect(model.commands.selectedRow()?.key).toBe('ada');

    model.commands.toggleSingleRowSelected('ada', false);
    expect(model.state.selectedRowKey.value()).toBeNull();

    model.commands.toggleSingleRowSelected('grace');
    expect(model.state.selectedRowKey.value()).toBe('grace');

    model.commands.toggleSingleRowSelected('grace');
    expect(model.state.selectedRowKey.value()).toBeNull();
  });

  it('keeps adapter-free commands separate for active rows, selection, visibility, and status', () => {
    const rows = signal<readonly Person[]>([
      { id: 'ada', name: 'Ada', age: 36 },
      { id: 'grace', name: 'Grace', age: 85 },
    ]);
    const model = hellTableCreateModel({
      columns: [
        { id: 'select', header: 'Select', hideable: false },
        { id: 'name', header: 'Name' },
      ],
      rows,
      render: {
        cells: {
          name: ({ row }) => row.original.name,
        },
      },
    });

    expect(model.rowParts()).toEqual([
      { kind: 'row', key: 'row:ada', row: model.rows()[0] },
      { kind: 'row', key: 'row:grace', row: model.rows()[1] },
    ]);
    const nameRenderer = model.render.cells['name'];
    if (typeof nameRenderer !== 'function') throw new Error('Expected function cell renderer.');
    expect(
      nameRenderer({
        row: model.rows()[0],
        column: model.columns()[1],
        value: 'Ada',
      }),
    ).toBe('Ada');

    model.commands.openRow(model.rows()[0]);
    model.commands.toggleRowSelected('grace');
    model.commands.setRowSelected('ada', true);
    model.commands.toggleRowSelected('grace', false);
    model.commands.selectSingleRow('grace');
    model.commands.closeRow('grace');

    expect(model.state.activeRowKey.value()).toBe('ada');
    expect(model.commands.activeRow()?.original).toEqual({ id: 'ada', name: 'Ada', age: 36 });
    expect(model.commands.selectedRow()?.original).toEqual({ id: 'grace', name: 'Grace', age: 85 });
    expect(model.commands.isActive('grace')).toBe(false);
    expect(model.commands.isSingleRowSelected(model.rows()[1])).toBe(true);
    expect(model.state.rowSelection.value()).toEqual({ grace: false, ada: true });
    expect(model.commands.isRowSelected(model.rows()[1])).toBe(false);
    expect(model.state.selectedRowKey.value()).toBe('grace');

    model.commands.closeRow('ada');
    model.commands.clearSingleRowSelection('ada');
    model.commands.setColumnVisible('name', false);
    model.commands.setSorting([{ columnId: 'name', direction: 'asc' }]);
    model.commands.setColumnSize('name', 240);

    expect(model.state.activeRowKey.value()).toBeNull();
    expect(model.state.rowSelection.value()).toEqual({ grace: false, ada: true });
    expect(model.state.selectedRowKey.value()).toBe('grace');
    expect(model.visibleColumns().map((column) => column.id)).toEqual(['select']);
    expect(model.state.sorting.value()).toEqual([{ columnId: 'name', direction: 'asc' }]);
    expect(model.state.columnSizing.value()).toEqual({ name: 240 });

    model.commands.setLoading(true);
    expect(model.rowParts()).toEqual([{ kind: 'loader', key: 'loader' }]);

    model.commands.setLoading(false);
    model.commands.setError('boom');
    expect(model.rowParts()).toEqual([{ kind: 'error', key: 'error', error: 'boom' }]);

    model.commands.setError(null);
    rows.set([]);
    expect(model.rowParts()).toEqual([{ kind: 'empty', key: 'empty' }]);
  });
});
