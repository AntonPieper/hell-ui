import { ChangeDetectionStrategy, Component, Injector, computed, inject, input, signal, type Signal } from '@angular/core';
import {
  FlexRenderDirective,
  type Cell,
  type CellContext,
  type Column,
  type FlexRenderContent,
  type Header,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table,
  type Updater,
} from '@tanstack/angular-table';
export {
  FlexRenderDirective,
  FlexRenderDirective as FlexRender,
  type FlexRenderContent,
  FlexRenderComponent,
  flexRenderComponent,
  injectFlexRenderContext,
  type FlexRenderComponentProps,
} from '@tanstack/angular-table';

import {
  hellTableCreateCommands,
  hellTableCreateRenderRegistry,
  hellTableCreateState,
  hellTableNormalizeRowKey,
  hellTableResolveStateUpdater,
  hellTableVirtualRowPartsFromRows,
  type HellColumnMeta,
  type HellTableCellRenderContext,
  type HellTableColumn,
  type HellTableColumnId,
  type HellTableHeaderGroup,
  type HellTableHeaderRenderContext,
  type HellTableInitialState,
  type HellTableModel,
  type HellTableModelHeader,
  type HellTableModelRow,
  type HellTableRenderRegistryInput,
  type HellTableRenderer,
  type HellTableRowKey,
  type HellTableRowKeyValue,
  type HellTableRowPart,
  type HellTableRowSelectionState,
  type HellTableSortingState,
  type HellTableState,
  type HellTableStateChannel,
} from '../table/table';

/** Static table instance or Angular signal returned by `createAngularTable`. */
export type HellTanStackTableInput<TData extends RowData> = Table<TData> | Signal<Table<TData>>;

/** Stable key callback for TanStack rows before Hell normalizes keys to strings. */
export type HellTanStackRowKey<TData extends RowData> = (
  row: Row<TData>,
  index: number,
) => HellTableRowKeyValue;

/** Options for adapting an app-owned TanStack Table into a HellTableModel. */
export interface HellTanStackTableModelOptions<TData extends RowData> {
  readonly table: HellTanStackTableInput<TData>;
  readonly rowKey?: HellTanStackRowKey<TData>;
  /** Local Hell-only channels for active row, single selection, loading, and error. */
  readonly state?: HellTableState;
  /** Initial values for Hell-only channels when `state` is not supplied. */
  readonly initialState?: HellTableInitialState;
  /** Additional render slots layered under TanStack header/cell FlexRender slots. */
  readonly render?: HellTableRenderRegistryInput<TData>;
}

/** Hell column with the owning TanStack column preserved for adapter renderers. */
export interface HellTanStackTableColumn<TData extends RowData = unknown, TValue = unknown>
  extends HellTableColumn<TData, TValue> {
  readonly tanStackColumn: Column<TData, TValue>;
}

/** Hell header with the owning TanStack header preserved for adapter renderers. */
export interface HellTanStackTableModelHeader<TData extends RowData = unknown, TValue = unknown>
  extends HellTableModelHeader<TData> {
  readonly column?: HellTanStackTableColumn<TData, TValue>;
  readonly tanStackHeader: Header<TData, TValue>;
}

/** Hell row with the owning TanStack row preserved for adapter renderers. */
export interface HellTanStackTableModelRow<TData extends RowData = unknown>
  extends HellTableModelRow<TData> {
  readonly tanStackRow: Row<TData>;
}

/** One visible TanStack cell normalized for Hell renderers. */
export interface HellTanStackTableModelCell<TData extends RowData = unknown, TValue = unknown>
  extends HellTableCellRenderContext<TData, TValue> {
  readonly id: string;
  readonly row: HellTanStackTableModelRow<TData>;
  readonly column: HellTanStackTableColumn<TData, TValue>;
  readonly renderValue: TValue | null;
  readonly render: HellTanStackFlexRenderValue<CellContext<TData, TValue>>;
  readonly tanStackCell: Cell<TData, TValue>;
}

/** FlexRender descriptor carried through Hell render registries without reimplementing TanStack rendering. */
export interface HellTanStackFlexRenderValue<TProps extends NonNullable<unknown> = NonNullable<unknown>> {
  readonly kind: 'tanstack-flex-render';
  readonly content: unknown;
  readonly props: TProps;
  readonly fallback?: unknown;
}

/** HellTableModel extended with TanStack table/cell accessors. */
export interface HellTanStackTableModel<TData extends RowData = unknown> extends HellTableModel<TData> {
  readonly table: Signal<Table<TData>>;
  readonly columns: Signal<readonly HellTanStackTableColumn<TData>[]>;
  readonly rows: Signal<readonly HellTanStackTableModelRow<TData>[]>;
  readonly headerGroups: Signal<readonly HellTableHeaderGroup<TData>[]>;
  readonly visibleColumns: Signal<readonly HellTanStackTableColumn<TData>[]>;
  readonly tanStackRows: Signal<readonly Row<TData>[]>;
  cellsForRow(row: HellTableModelRow<TData> | Row<TData> | HellTableRowKey): readonly HellTanStackTableModelCell<TData>[];
}

/** Standalone renderer for values produced by `hellTanStackFlexRenderValue`. */
@Component({
  selector: 'hell-tanstack-flex-render',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexRenderDirective],
  template: `
    <ng-template
      [flexRender]="directiveContent()"
      [flexRenderProps]="value().props"
      [flexRenderInjector]="injector"
      let-rendered
    >
      {{ rendered }}
    </ng-template>
  `,
})
export class HellTanStackFlexRenderOutlet {
  readonly value = input.required<HellTanStackFlexRenderValue>();

  protected readonly injector = inject(Injector);

  protected directiveContent(): HellTanStackDirectiveContent {
    return hellTanStackDirectiveContent(this.value());
  }
}

/** Standalone import set for the TanStack adapter and its FlexRender outlet. */
export const HELL_TANSTACK_TABLE_DIRECTIVES = [HellTanStackFlexRenderOutlet, FlexRenderDirective] as const;

/** Creates a FlexRender descriptor for TanStack Angular's `FlexRenderDirective`. */
export function hellTanStackFlexRenderValue<TProps extends NonNullable<unknown>>(
  content: unknown,
  props: TProps,
  fallback?: unknown,
): HellTanStackFlexRenderValue<TProps> {
  return { kind: 'tanstack-flex-render', content, props, fallback };
}

/** True when a Hell render result is a TanStack FlexRender descriptor. */
export function hellTanStackIsFlexRenderValue(
  value: unknown,
): value is HellTanStackFlexRenderValue {
  return isRecord(value) && value['kind'] === 'tanstack-flex-render';
}

/** Resolves primitive/function FlexRender content for tests, strings, and non-Angular fallbacks. */
export function hellTanStackResolveFlexRenderValue(value: unknown): unknown {
  if (!hellTanStackIsFlexRenderValue(value)) return value;
  const content = value.content;
  if (typeof content === 'function' && !isAngularDeclarable(content)) {
    const rendered = (content as (props: NonNullable<unknown>) => unknown)(value.props);
    return rendered ?? value.fallback ?? null;
  }
  return content ?? value.fallback ?? null;
}

/** Converts TanStack sorting state into Hell's adapter-free sort channel shape. */
export function hellTanStackSortingToHell(
  sorting: readonly { readonly id: string; readonly desc: boolean }[],
): readonly HellTableSortingState[] {
  return sorting.map((sort) => ({
    columnId: sort.id,
    direction: sort.desc ? 'desc' : 'asc',
  }));
}

/** Converts Hell sorting state back into TanStack's controlled table shape. */
export function hellTanStackSortingFromHell(
  sorting: readonly HellTableSortingState[],
): SortingState {
  return sorting.map((sort) => ({ id: sort.columnId, desc: sort.direction === 'desc' }));
}

/** Adapts a TanStack Table instance into Hell's normalized table model without owning TanStack state. */
export function hellTanStackTableModel<TData extends RowData>(
  options: HellTanStackTableModelOptions<TData>,
): HellTanStackTableModel<TData> {
  const table = toTableSignal(options.table);
  const localState = options.state ?? hellTableCreateState(options.initialState);

  const columns = computed<readonly HellTanStackTableColumn<TData>[]>(() =>
    table()
      .getAllLeafColumns()
      .map((column) => hellTanStackColumn(column)),
  );
  const visibleColumns = computed<readonly HellTanStackTableColumn<TData>[]>(() =>
    table()
      .getVisibleLeafColumns()
      .map((column) => hellTanStackColumn(column)),
  );
  const tanStackRows = computed<readonly Row<TData>[]>(() => table().getRowModel().rows);
  const rows = computed<readonly HellTanStackTableModelRow<TData>[]>(() =>
    hellTanStackRows(tanStackRows(), options.rowKey),
  );
  const state = hellTanStackState(table, localState, rows);
  const headerGroups = computed<readonly HellTableHeaderGroup<TData>[]>(() =>
    hellTanStackHeaderGroups(table().getHeaderGroups(), columns()),
  );
  const rowParts = computed<readonly HellTableRowPart<TData>[]>(() =>
    hellTableVirtualRowPartsFromRows({
      rows: rows(),
      loading: state.loading.value(),
      error: state.error.value(),
      activeEditorRowKey: state.activeRowKey.value(),
    }),
  );
  const commands = hellTableCreateCommands(state, rows);
  const render = computed(() => hellTanStackRenderRegistry(table(), options.render));

  return {
    table,
    tanStackRows,
    columns,
    rows,
    headerGroups,
    visibleColumns,
    rowParts,
    get render() {
      return render();
    },
    state,
    commands,
    cellsForRow: (row) => hellTanStackCellsForRow(row, rows(), visibleColumns()),
  };
}

function hellTanStackState<TData extends RowData>(
  table: Signal<Table<TData>>,
  localState: HellTableState,
  rows: Signal<readonly HellTanStackTableModelRow<TData>[]>,
): HellTableState {
  return {
    ...localState,
    rowSelection: tanStackRowSelectionStateChannel(table, rows),
    columnVisibility: tanStackStateChannel(
      table,
      (current) => current.columnVisibility,
      (current) => current,
      (current) => current,
      (target, updater) => target.setColumnVisibility(updater),
    ),
    sorting: tanStackStateChannel(
      table,
      (current) => current.sorting,
      hellTanStackSortingToHell,
      hellTanStackSortingFromHell,
      (target, updater) => target.setSorting(updater),
    ),
    columnSizing: tanStackStateChannel(
      table,
      (current) => current.columnSizing,
      (current) => current,
      (current) => current,
      (target, updater) => target.setColumnSizing(updater),
    ),
  };
}

function tanStackRowSelectionStateChannel<TData extends RowData>(
  table: Signal<Table<TData>>,
  rows: Signal<readonly HellTanStackTableModelRow<TData>[]>,
): HellTableStateChannel<HellTableRowSelectionState> {
  const value = computed(() => hellTanStackRowSelectionToHell(table().getState().rowSelection, rows()));
  return {
    value,
    set: (next) => table().setRowSelection(hellTanStackRowSelectionFromHell(next, rows())),
    update: (updater) => {
      const next = hellTableResolveStateUpdater(value(), updater);
      table().setRowSelection((current) => hellTanStackRowSelectionFromHell(next, rows(), current));
    },
  };
}

function hellTanStackRowSelectionToHell<TData extends RowData>(
  selection: RowSelectionState,
  rows: readonly HellTanStackTableModelRow<TData>[],
): HellTableRowSelectionState {
  const keyByTanStackId = new Map(rows.map((row) => [row.tanStackRow.id, row.key]));
  const next: Record<HellTableRowKey, boolean> = {};
  for (const [tanStackRowId, selected] of Object.entries(selection)) {
    const key = keyByTanStackId.get(tanStackRowId);
    if (key !== undefined) next[key] = selected;
  }
  return next;
}

function hellTanStackRowSelectionFromHell<TData extends RowData>(
  selection: HellTableRowSelectionState,
  rows: readonly HellTanStackTableModelRow<TData>[],
  current?: RowSelectionState,
): RowSelectionState {
  const tanStackIdByKey = new Map(rows.map((row) => [row.key, row.tanStackRow.id]));
  const mappedTanStackIds = new Set(rows.map((row) => row.tanStackRow.id));
  const next: RowSelectionState = {};

  if (current) {
    for (const [tanStackRowId, selected] of Object.entries(current)) {
      if (!mappedTanStackIds.has(tanStackRowId)) next[tanStackRowId] = selected;
    }
  }

  for (const [key, selected] of Object.entries(selection)) {
    next[tanStackIdByKey.get(key) ?? key] = selected;
  }

  return next;
}

function tanStackStateChannel<TData extends RowData, TTanStack, THell>(
  table: Signal<Table<TData>>,
  read: (state: ReturnType<Table<TData>['getState']>) => TTanStack,
  toHell: (value: TTanStack) => THell,
  toTanStack: (value: THell) => TTanStack,
  write: (table: Table<TData>, updater: Updater<TTanStack>) => void,
): HellTableStateChannel<THell> {
  const value = computed(() => toHell(read(table().getState())));
  return {
    value,
    set: (next) => write(table(), toTanStack(next)),
    update: (updater) => {
      const next = hellTableResolveStateUpdater(value(), updater);
      write(table(), toTanStack(next));
    },
  };
}

function hellTanStackColumn<TData extends RowData, TValue = unknown>(
  column: Column<TData, TValue>,
): HellTanStackTableColumn<TData, TValue> {
  return {
    id: column.id,
    kind: 'custom',
    header: column.columnDef.header ?? column.id,
    accessorKey: accessorKeyFromColumnDef(column.columnDef),
    visibility: column.getCanHide() ? 'user-toggleable' : 'always',
    visible: column.getIsVisible(),
    hideable: column.getCanHide(),
    sortable: column.getCanSort(),
    size: column.getSize(),
    minSize: column.columnDef.minSize,
    maxSize: column.columnDef.maxSize,
    meta: hellTanStackColumnMeta(column.columnDef.meta),
    tanStackColumn: column,
  };
}

function hellTanStackRows<TData extends RowData>(
  rows: readonly Row<TData>[],
  rowKey: HellTanStackRowKey<TData> | undefined,
): readonly HellTanStackTableModelRow<TData>[] {
  const seen = new Set<HellTableRowKey>();
  return rows.map((row, index) => {
    const key = hellTableNormalizeRowKey(rowKey ? rowKey(row, index) : row.id);
    if (seen.has(key)) {
      throw new Error(`Hell TanStack Table adapter requires unique row keys; duplicate key "${key}".`);
    }
    seen.add(key);
    return { key, original: row.original, index, tanStackRow: row };
  });
}

function hellTanStackHeaderGroups<TData extends RowData>(
  groups: readonly { readonly id: string; readonly depth: number; readonly headers: readonly Header<TData, unknown>[] }[],
  columns: readonly HellTanStackTableColumn<TData>[],
): readonly HellTableHeaderGroup<TData>[] {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  return groups.map((group) => ({
    id: group.id,
    depth: group.depth,
    headers: group.headers.map((header) => {
      const column = columnById.get(header.column.id);
      return {
        id: header.id,
        columnId: header.column.id,
        column,
        label: header.isPlaceholder
          ? null
          : hellTanStackFlexRenderValue(header.column.columnDef.header, header.getContext(), header.column.id),
        colSpan: header.colSpan,
        rowSpan: header.rowSpan,
        placeholder: header.isPlaceholder,
        tanStackHeader: header,
      } satisfies HellTanStackTableModelHeader<TData>;
    }),
  }));
}

function hellTanStackRenderRegistry<TData extends RowData>(
  table: Table<TData>,
  base: HellTableRenderRegistryInput<TData> = {},
) {
  const headers: Record<HellTableColumnId, HellTableRenderer<HellTableHeaderRenderContext<TData>>> = {
    ...(base.headers ?? {}),
  };
  const cells: Record<HellTableColumnId, HellTableRenderer<HellTableCellRenderContext<TData, unknown>>> = {
    ...(base.cells ?? {}),
  };

  for (const column of table.getAllLeafColumns()) {
    headers[column.id] ??= (context) => {
      const header = tanStackHeaderFromHellContext(context, table, column.id);
      return hellTanStackFlexRenderValue(header.column.columnDef.header, header.getContext(), column.id);
    };
    cells[column.id] ??= (context) => {
      const row = tanStackRowFromHellContext(context.row, table);
      const cell = tanStackCellForColumn(row, column.id);
      return hellTanStackFlexRenderValue(
        cell.column.columnDef.cell,
        cell.getContext(),
        cell.renderValue(),
      );
    };
  }

  return hellTableCreateRenderRegistry({
    ...base,
    headers,
    cells,
  });
}

function hellTanStackCellsForRow<TData extends RowData>(
  rowInput: HellTableModelRow<TData> | Row<TData> | HellTableRowKey,
  rows: readonly HellTanStackTableModelRow<TData>[],
  columns: readonly HellTanStackTableColumn<TData>[],
): readonly HellTanStackTableModelCell<TData>[] {
  const row = tanStackRowFromInput(rowInput, rows);
  const hellRow = rows.find((candidate) => candidate.tanStackRow.id === row.id || candidate.key === row.id);
  if (!hellRow) throw new Error(`Hell TanStack Table adapter could not find row "${row.id}".`);
  const columnById = new Map(columns.map((column) => [column.id, column]));
  return row.getVisibleCells().map((cell) => {
    const column = columnById.get(cell.column.id) ?? hellTanStackColumn(cell.column);
    return {
      id: cell.id,
      row: hellRow,
      column,
      value: cell.getValue(),
      renderValue: cell.renderValue(),
      render: hellTanStackFlexRenderValue(cell.column.columnDef.cell, cell.getContext(), cell.renderValue()),
      tanStackCell: cell,
    } satisfies HellTanStackTableModelCell<TData>;
  });
}

function tanStackHeaderFromHellContext<TData extends RowData>(
  context: HellTableHeaderRenderContext<TData>,
  table: Table<TData>,
  columnId: HellTableColumnId,
): Header<TData, unknown> {
  const header = context.header as Partial<HellTanStackTableModelHeader<TData>>;
  if (header.tanStackHeader) return header.tanStackHeader;
  const found = table
    .getFlatHeaders()
    .find((candidate) => candidate.id === context.header.id || candidate.column.id === columnId);
  if (!found) throw new Error(`Hell TanStack Table adapter could not find header "${context.header.id}".`);
  return found;
}

function tanStackRowFromHellContext<TData extends RowData>(
  row: HellTableModelRow<TData>,
  table: Table<TData>,
): Row<TData> {
  const adapterRow = row as Partial<HellTanStackTableModelRow<TData>>;
  if (adapterRow.tanStackRow) return adapterRow.tanStackRow;
  const found = table.getRowModel().rows.find((candidate) => candidate.id === row.key);
  if (!found) throw new Error(`Hell TanStack Table adapter could not find row "${row.key}".`);
  return found;
}

function tanStackRowFromInput<TData extends RowData>(
  rowInput: HellTableModelRow<TData> | Row<TData> | HellTableRowKey,
  rows: readonly HellTanStackTableModelRow<TData>[],
): Row<TData> {
  if (typeof rowInput === 'string') {
    const row = rows.find((candidate) => candidate.key === rowInput || candidate.tanStackRow.id === rowInput);
    if (!row) throw new Error(`Hell TanStack Table adapter could not find row "${rowInput}".`);
    return row.tanStackRow;
  }

  const maybeTanStackRow = rowInput as Partial<Row<TData>>;
  if (maybeTanStackRow.getVisibleCells && maybeTanStackRow.id) return maybeTanStackRow as Row<TData>;

  const maybeHellRow = rowInput as Partial<HellTanStackTableModelRow<TData>>;
  if (maybeHellRow.tanStackRow) return maybeHellRow.tanStackRow;

  if (isRecord(rowInput) && typeof rowInput['key'] === 'string') {
    const key = rowInput['key'];
    const row = rows.find((candidate) => candidate.key === key);
    if (!row) throw new Error(`Hell TanStack Table adapter could not find row "${key}".`);
    return row.tanStackRow;
  }

  throw new Error('Hell TanStack Table adapter could not resolve the provided row input.');
}

function tanStackCellForColumn<TData extends RowData>(
  row: Row<TData>,
  columnId: HellTableColumnId,
): Cell<TData, unknown> {
  const cell = row.getAllCells().find((candidate) => candidate.column.id === columnId);
  if (!cell) throw new Error(`Hell TanStack Table adapter could not find cell for column "${columnId}".`);
  return cell;
}

function toTableSignal<TData extends RowData>(inputValue: HellTanStackTableInput<TData>): Signal<Table<TData>> {
  return typeof inputValue === 'function' ? (inputValue as Signal<Table<TData>>) : signal(inputValue);
}

function accessorKeyFromColumnDef(columnDef: object): string | undefined {
  const value = (columnDef as Partial<Record<'accessorKey', unknown>>).accessorKey;
  return typeof value === 'string' ? value : undefined;
}

function hellTanStackColumnMeta(meta: unknown): HellColumnMeta | undefined {
  return isRecord(meta) ? meta : undefined;
}

function hellTanStackDirectiveContent(value: HellTanStackFlexRenderValue): HellTanStackDirectiveContent {
  const content = value.content ?? value.fallback;
  if (content === null || content === undefined || typeof content === 'string' || typeof content === 'number') {
    return content;
  }
  if (typeof content === 'function' && !isAngularDeclarable(content)) {
    return (props) =>
      ((content as (props: NonNullable<unknown>) => FlexRenderContent<NonNullable<unknown>>)(props) ??
        value.fallback) as FlexRenderContent<NonNullable<unknown>>;
  }
  return () => content as FlexRenderContent<NonNullable<unknown>>;
}

type HellTanStackDirectiveContent =
  | string
  | number
  | ((props: NonNullable<unknown>) => FlexRenderContent<NonNullable<unknown>>)
  | null
  | undefined;

function isAngularDeclarable(value: unknown): boolean {
  return typeof value === 'function' && ('ɵcmp' in value || 'ɵdir' in value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}
