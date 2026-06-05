import { computed, signal, type Signal } from '@angular/core';

/** Stable string key used by Hell table rows and row-derived parts. */
export type HellTableRowKey = string;

/** Consumer or adapter row-key input before Hell normalizes it to a string key. */
export type HellTableRowKeyValue = string | number;

/** Stable string id used by Hell table columns. */
export type HellTableColumnId = string;

/** Table-state updater shape shared by simple tables and adapter layers. */
export type HellTableStateUpdater<T> = T | ((current: T) => T);

/** One independent table-state channel. */
export interface HellTableStateChannel<T> {
  readonly value: Signal<T>;
  set(next: T): void;
  update(updater: HellTableStateUpdater<T>): void;
}

/** Direction for one sorted column. */
export type HellTableSortDirection = 'asc' | 'desc';

/** Adapter-free sort state owned by the simple table, an adapter, or the app. */
export interface HellTableSortingState {
  readonly columnId: HellTableColumnId;
  readonly direction: HellTableSortDirection;
}

/** Selection state keyed by stable row key. Active rows live in a separate channel. */
export type HellTableRowSelectionState = Readonly<Record<HellTableRowKey, boolean>>;

/** Column visibility keyed by stable column id. `false` hides; missing or `true` shows. */
export type HellTableColumnVisibilityState = Readonly<Record<HellTableColumnId, boolean>>;

/** Column sizing state keyed by stable column id, in CSS pixels. */
export type HellTableColumnSizingState = Readonly<Record<HellTableColumnId, number>>;

/** Independent state channels shared by first-party and adapter-backed table models. */
export interface HellTableState {
  readonly activeRowKey: HellTableStateChannel<HellTableRowKey | null>;
  readonly rowSelection: HellTableStateChannel<HellTableRowSelectionState>;
  readonly columnVisibility: HellTableStateChannel<HellTableColumnVisibilityState>;
  readonly sorting: HellTableStateChannel<readonly HellTableSortingState[]>;
  readonly columnSizing: HellTableStateChannel<HellTableColumnSizingState>;
  readonly loading: HellTableStateChannel<boolean>;
  readonly error: HellTableStateChannel<unknown | null>;
}

/** Initial values for Hell's adapter-free table state channels. */
export interface HellTableInitialState {
  readonly activeRowKey?: HellTableRowKey | null;
  readonly rowSelection?: HellTableRowSelectionState;
  readonly columnVisibility?: HellTableColumnVisibilityState;
  readonly sorting?: readonly HellTableSortingState[];
  readonly columnSizing?: HellTableColumnSizingState;
  readonly loading?: boolean;
  readonly error?: unknown | null;
}

/** Minimal normalized column contract shared before HELL-070 adds the column DSL. */
export interface HellTableColumn<TData = unknown, TValue = unknown> {
  readonly id: HellTableColumnId;
  readonly header?: unknown;
  readonly accessor?: (row: TData) => TValue;
  /** Default visibility before user/app columnVisibility overrides. */
  readonly visible?: boolean;
  /** `false` keeps required action/selection columns visible regardless of visibility state. */
  readonly hideable?: boolean;
  readonly sortable?: boolean;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Normalized header cell. Header groups can come from simple, TanStack, or CDK adapters. */
export interface HellTableModelHeader<TData = unknown> {
  readonly id: string;
  readonly columnId?: HellTableColumnId;
  readonly column?: HellTableColumn<TData>;
  readonly label?: unknown;
  readonly colSpan?: number;
  readonly rowSpan?: number;
  readonly placeholder?: boolean;
}

/** Normalized header row/group. */
export interface HellTableHeaderGroup<TData = unknown> {
  readonly id: string;
  readonly depth: number;
  readonly headers: readonly HellTableModelHeader<TData>[];
}

/** Normalized data row independent of a concrete table engine. */
export interface HellTableModelRow<TData = unknown> {
  readonly key: HellTableRowKey;
  readonly original: TData;
  readonly index: number;
}

/** Row-key accessor used by simple data sources and adapters. */
export type HellTableRowKeyAccessor<TData> = (row: TData, index: number) => HellTableRowKeyValue;

/** Stable row-key input accepted by adapter-free commands. */
export type HellTableRowKeyInput<TData = unknown> = HellTableRowKeyValue | HellTableModelRow<TData>;

/** Data row part. Its key is stable across virtual/render adapters. */
export interface HellTableDataRowPart<TData = unknown> {
  readonly kind: 'row';
  readonly key: string;
  readonly row: HellTableModelRow<TData>;
}

/** Loading row part for engines that render loading inline. */
export interface HellTableLoaderRowPart {
  readonly kind: 'loader';
  readonly key: string;
}

/** Error row part for engines that render errors inline. */
export interface HellTableErrorRowPart {
  readonly kind: 'error';
  readonly key: string;
  readonly error: unknown;
}

/** Empty-state row part. */
export interface HellTableEmptyRowPart {
  readonly kind: 'empty';
  readonly key: string;
}

/** Flattened row-part primitive consumed by renderers and future virtualization helpers. */
export type HellTableRowPart<TData = unknown> =
  | HellTableDataRowPart<TData>
  | HellTableLoaderRowPart
  | HellTableErrorRowPart
  | HellTableEmptyRowPart;

/** Context passed to header renderers. */
export interface HellTableHeaderRenderContext<TData = unknown> {
  readonly header: HellTableModelHeader<TData>;
  readonly headerGroup: HellTableHeaderGroup<TData>;
}

/** Context passed to cell renderers. */
export interface HellTableCellRenderContext<TData = unknown> {
  readonly row: HellTableModelRow<TData>;
  readonly column: HellTableColumn<TData>;
  readonly value: unknown;
}

/** Context passed to row action/editor renderers. */
export interface HellTableRowRenderContext<TData = unknown> {
  readonly row: HellTableModelRow<TData>;
  readonly state: HellTableState;
  readonly commands: HellTableCommands<TData>;
}

/** Renderer value kept intentionally generic until HELL-070 wires TemplateRef/component renderers. */
export type HellTableRenderer<TContext = unknown> = (context: TContext) => unknown;

/** Normalized render slots shared by simple and adapter-backed table engines. */
export interface HellTableRenderRegistry<TData = unknown> {
  readonly headers: Readonly<
    Record<HellTableColumnId, HellTableRenderer<HellTableHeaderRenderContext<TData>>>
  >;
  readonly cells: Readonly<
    Record<HellTableColumnId, HellTableRenderer<HellTableCellRenderContext<TData>>>
  >;
  readonly rowActions: Readonly<
    Record<string, HellTableRenderer<HellTableRowRenderContext<TData>>>
  >;
  readonly rowEditors: Readonly<
    Record<string, HellTableRenderer<HellTableRowRenderContext<TData>>>
  >;
}

/** Partial renderer input accepted by `hellTableCreateRenderRegistry`. */
export type HellTableRenderRegistryInput<TData = unknown> = Partial<HellTableRenderRegistry<TData>>;

/** Adapter-free commands that mutate only HellTableState channels. */
export interface HellTableCommands<TData = unknown> {
  activeRow(): HellTableModelRow<TData> | null;
  isActive(row: HellTableRowKeyInput<TData>): boolean;
  setActiveRowKey(key: HellTableRowKey | null): void;
  openRow(row: HellTableRowKeyInput<TData>): void;
  closeRow(row?: HellTableRowKeyInput<TData>): void;
  isRowSelected(row: HellTableRowKeyInput<TData>): boolean;
  setRowSelected(row: HellTableRowKeyInput<TData>, selected: boolean): void;
  toggleRowSelected(row: HellTableRowKeyInput<TData>, selected?: boolean): void;
  clearRowSelection(): void;
  setColumnVisible(columnId: HellTableColumnId, visible: boolean): void;
  toggleColumnVisible(columnId: HellTableColumnId, visible?: boolean): void;
  setSorting(updater: HellTableStateUpdater<readonly HellTableSortingState[]>): void;
  setColumnSize(columnId: HellTableColumnId, px: number): void;
  setLoading(loading: boolean): void;
  setError(error: unknown | null): void;
}

/** Normalized model consumed by simple, TanStack, CDK, and future virtual renderers. */
export interface HellTableModel<TData = unknown> {
  readonly columns: Signal<readonly HellTableColumn<TData>[]>;
  readonly rows: Signal<readonly HellTableModelRow<TData>[]>;
  readonly headerGroups: Signal<readonly HellTableHeaderGroup<TData>[]>;
  readonly visibleColumns: Signal<readonly HellTableColumn<TData>[]>;
  readonly rowParts: Signal<readonly HellTableRowPart<TData>[]>;
  readonly render: HellTableRenderRegistry<TData>;
  readonly state: HellTableState;
  readonly commands: HellTableCommands<TData>;
}

/** Static value or Angular Signal accepted by the table model factory. */
export type HellTableSignalInput<T> = T | Signal<T>;

/** Options for building an adapter-free normalized table model. */
export interface HellTableModelOptions<TData> {
  readonly columns: HellTableSignalInput<readonly HellTableColumn<TData>[]>;
  readonly rows?: HellTableSignalInput<readonly TData[]>;
  readonly rowKey?: HellTableRowKeyAccessor<TData>;
  readonly headerGroups?: HellTableSignalInput<readonly HellTableHeaderGroup<TData>[]>;
  readonly rowParts?: HellTableSignalInput<readonly HellTableRowPart<TData>[]>;
  readonly state?: HellTableState;
  readonly initialState?: HellTableInitialState;
  readonly render?: HellTableRenderRegistryInput<TData>;
}

/** Resolves value-or-function state updaters without coupling to a specific table engine. */
export function hellTableResolveStateUpdater<T>(current: T, updater: HellTableStateUpdater<T>): T {
  return typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater;
}

/** Creates a writable state channel backed by an Angular signal. */
export function hellTableStateChannel<T>(initialValue: T): HellTableStateChannel<T> {
  const value = signal(initialValue);
  return {
    value,
    set: (next) => value.set(next),
    update: (updater) => value.set(hellTableResolveStateUpdater(value(), updater)),
  };
}

/** Creates all independent state channels with safe defaults. */
export function hellTableCreateState(initial: HellTableInitialState = {}): HellTableState {
  return {
    activeRowKey: hellTableStateChannel(initial.activeRowKey ?? null),
    rowSelection: hellTableStateChannel(initial.rowSelection ?? {}),
    columnVisibility: hellTableStateChannel(initial.columnVisibility ?? {}),
    sorting: hellTableStateChannel(initial.sorting ?? []),
    columnSizing: hellTableStateChannel(initial.columnSizing ?? {}),
    loading: hellTableStateChannel(initial.loading ?? false),
    error: hellTableStateChannel<unknown | null>(initial.error ?? null),
  };
}

/** Creates an empty render registry while preserving typed slot maps. */
export function hellTableCreateRenderRegistry<TData>(
  registry: HellTableRenderRegistryInput<TData> = {},
): HellTableRenderRegistry<TData> {
  return {
    headers: registry.headers ?? {},
    cells: registry.cells ?? {},
    rowActions: registry.rowActions ?? {},
    rowEditors: registry.rowEditors ?? {},
  };
}

/** Normalizes a consumer/adapter row-key value into Hell's stable string-key shape. */
export function hellTableNormalizeRowKey(key: HellTableRowKeyValue): HellTableRowKey {
  const normalized = String(key);
  if (!normalized.length) throw new Error('HellTableModel row keys must not be empty.');
  return normalized;
}

/** Default row key accessor: prefer `key`, then `id`, then the current index. */
export function hellTableDefaultRowKey<TData>(row: TData, index: number): HellTableRowKeyValue {
  if (row !== null && typeof row === 'object') {
    const record = row as Record<string, unknown>;
    const key = record['key'];
    if (hellTableCanUseValueAsKey(key)) return key;
    const id = record['id'];
    if (hellTableCanUseValueAsKey(id)) return id;
  }
  return index;
}

/** Normalizes raw rows and rejects duplicate keys before adapters/renderers consume them. */
export function hellTableRowsFromData<TData>(
  rows: readonly TData[],
  rowKey: HellTableRowKeyAccessor<TData> = hellTableDefaultRowKey,
): readonly HellTableModelRow<TData>[] {
  const seen = new Set<HellTableRowKey>();
  return rows.map((original, index) => {
    const key = hellTableNormalizeRowKey(rowKey(original, index));
    if (seen.has(key)) {
      throw new Error(
        `HellTableModel requires unique row keys; duplicate key "${key}" at index ${index}.`,
      );
    }
    seen.add(key);
    return { key, original, index };
  });
}

/** Derives visible columns from default column visibility plus the columnVisibility state channel. */
export function hellTableVisibleColumns<TData>(
  columns: readonly HellTableColumn<TData>[],
  columnVisibility: HellTableColumnVisibilityState,
): readonly HellTableColumn<TData>[] {
  return columns.filter((column) => {
    if (column.hideable === false) return true;
    const stateValue = columnVisibility[column.id];
    if (stateValue !== undefined) return stateValue;
    return column.visible !== false;
  });
}

/** Builds a single normalized header group from the current visible columns. */
export function hellTableHeaderGroupsFromColumns<TData>(
  columns: readonly HellTableColumn<TData>[],
): readonly HellTableHeaderGroup<TData>[] {
  return [
    {
      id: 'default',
      depth: 0,
      headers: columns.map((column) => ({
        id: `header:${column.id}`,
        columnId: column.id,
        column,
        label: column.header ?? column.id,
        colSpan: 1,
      })),
    },
  ];
}

/** Builds stable row parts from normalized rows and loading/error state. */
export function hellTableRowPartsFromRows<TData>(
  rows: readonly HellTableModelRow<TData>[],
  state: Pick<HellTableState, 'loading' | 'error'>,
): readonly HellTableRowPart<TData>[] {
  if (state.loading.value()) return [{ kind: 'loader', key: 'loader' }];
  const error = state.error.value();
  if (error !== null && error !== undefined) return [{ kind: 'error', key: 'error', error }];
  if (!rows.length) return [{ kind: 'empty', key: 'empty' }];
  return rows.map((row) => ({ kind: 'row', key: `row:${row.key}`, row }));
}

/** Creates adapter-free commands over the supplied state channels and optional row signal. */
export function hellTableCreateCommands<TData>(
  state: HellTableState,
  rows: Signal<readonly HellTableModelRow<TData>[]> = signal<readonly HellTableModelRow<TData>[]>(
    [],
  ),
): HellTableCommands<TData> {
  return {
    activeRow: () => activeRow(state, rows),
    isActive: (row) => state.activeRowKey.value() === hellTableRowKeyFromInput(row),
    setActiveRowKey: (key) => state.activeRowKey.set(key),
    openRow: (row) => state.activeRowKey.set(hellTableRowKeyFromInput(row)),
    closeRow: (row) => {
      if (row === undefined || state.activeRowKey.value() === hellTableRowKeyFromInput(row)) {
        state.activeRowKey.set(null);
      }
    },
    isRowSelected: (row) => state.rowSelection.value()[hellTableRowKeyFromInput(row)] === true,
    setRowSelected: (row, selected) =>
      updateBooleanRecord(state.rowSelection, hellTableRowKeyFromInput(row), selected),
    toggleRowSelected: (row, selected) => {
      const key = hellTableRowKeyFromInput(row);
      const next = selected ?? state.rowSelection.value()[key] !== true;
      updateBooleanRecord(state.rowSelection, key, next);
    },
    clearRowSelection: () => state.rowSelection.set({}),
    setColumnVisible: (columnId, visible) =>
      updateBooleanRecord(state.columnVisibility, columnId, visible),
    toggleColumnVisible: (columnId, visible) => {
      const next = visible ?? state.columnVisibility.value()[columnId] === false;
      updateBooleanRecord(state.columnVisibility, columnId, next);
    },
    setSorting: (updater) => state.sorting.update(updater),
    setColumnSize: (columnId, px) => {
      if (!Number.isFinite(px) || px < 0) {
        throw new Error(
          `HellTableModel column size for "${columnId}" must be a non-negative finite number.`,
        );
      }
      state.columnSizing.update((current) => ({ ...current, [columnId]: px }));
    },
    setLoading: (loading) => state.loading.set(loading),
    setError: (error) => state.error.set(error),
  };
}

/** Creates a normalized table model without coupling to simple, TanStack, or CDK engines. */
export function hellTableCreateModel<TData>(
  options: HellTableModelOptions<TData>,
): HellTableModel<TData> {
  const state = options.state ?? hellTableCreateState(options.initialState);
  const columns = hellTableToSignal(options.columns);
  const sourceRows = hellTableToSignal(options.rows ?? []);
  const rows = computed(() => hellTableRowsFromData(sourceRows(), options.rowKey));
  const visibleColumns = computed(() =>
    hellTableVisibleColumns(columns(), state.columnVisibility.value()),
  );
  const headerGroups = options.headerGroups
    ? hellTableToSignal(options.headerGroups)
    : computed(() => hellTableHeaderGroupsFromColumns(visibleColumns()));
  const rowParts = options.rowParts
    ? hellTableToSignal(options.rowParts)
    : computed(() => hellTableRowPartsFromRows(rows(), state));
  const render = hellTableCreateRenderRegistry(options.render);
  const commands = hellTableCreateCommands(state, rows);

  return {
    columns,
    rows,
    headerGroups,
    visibleColumns,
    rowParts,
    render,
    state,
    commands,
  };
}

function hellTableCanUseValueAsKey(value: unknown): value is HellTableRowKeyValue {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function hellTableRowKeyFromInput<TData>(row: HellTableRowKeyInput<TData>): HellTableRowKey {
  return typeof row === 'object' ? row.key : hellTableNormalizeRowKey(row);
}

function hellTableToSignal<T>(input: HellTableSignalInput<T>): Signal<T> {
  return typeof input === 'function' ? (input as Signal<T>) : signal(input);
}

function activeRow<TData>(
  state: Pick<HellTableState, 'activeRowKey'>,
  rows: Signal<readonly HellTableModelRow<TData>[]>,
): HellTableModelRow<TData> | null {
  const key = state.activeRowKey.value();
  if (key === null) return null;
  return rows().find((row) => row.key === key) ?? null;
}

function updateBooleanRecord(
  channel: HellTableStateChannel<Readonly<Record<string, boolean>>>,
  key: string,
  value: boolean,
): void {
  channel.update((current) => ({ ...current, [key]: value }));
}
