import {
  type HellColumnDef,
  type HellColumnKind,
  type HellColumnMeta,
  type HellSelectColumnOption,
  type HellTableCellRenderContext,
  type HellTableColumn,
  type HellTableColumnId,
  type HellTableComponentRenderer,
  type HellTableHeaderRenderContext,
  type HellTableRenderFunction,
  type HellTableRenderRegistry,
  type HellTableRenderer,
  type HellTableResolvedRenderer,
  type HellTableRowRenderContext,
  type HellTableTemplateRenderer,
} from './table-model';
import { type TemplateRef, type Type } from '@angular/core';

/** Field key or value function accepted by the column-definition DSL. */
export type HellColumnAccessor<TData, TValue = unknown> =
  | (Extract<keyof TData, string>)
  | ((row: TData) => TValue);

/** Infers the cell value produced by a key or function accessor. */
export type HellColumnAccessorValue<TData, TAccessor> = TAccessor extends keyof TData
  ? TData[TAccessor]
  : TAccessor extends (row: TData) => infer TValue
    ? TValue
    : unknown;

/** Column visibility options before table state overrides are applied. */
export interface HellColumnVisibilityOptions {
  readonly visible?: boolean;
  readonly hideable?: boolean;
}

/** Column sizing hints used by simple renderers and adapter layers. */
export interface HellColumnSizingOptions {
  readonly size?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
}

/** Shared options accepted by data-bearing column helpers. */
export interface HellColumnOptions<TData, TValue = unknown> {
  readonly header?: unknown;
  readonly accessor?: HellColumnAccessor<TData, TValue>;
  readonly visible?: boolean;
  readonly hideable?: boolean;
  readonly visibility?: HellColumnVisibilityOptions;
  readonly sortable?: boolean;
  readonly size?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly sizing?: HellColumnSizingOptions;
  readonly meta?: HellColumnMeta;
  readonly renderer?: HellTableRenderer<HellTableCellRenderContext<TData, TValue>>;
  readonly cell?: HellTableRenderer<HellTableCellRenderContext<TData, TValue>>;
  readonly headerCell?: HellTableRenderer<HellTableHeaderRenderContext<TData>>;
  readonly rowActions?: HellTableRenderer<HellTableRowRenderContext<TData>>;
  readonly rowEditor?: HellTableRenderer<HellTableRowRenderContext<TData>>;
}

/** Options for select-style column definitions. */
export interface HellSelectColumnOptions<TData, TValue = unknown>
  extends HellColumnOptions<TData, TValue> {
  readonly options?: readonly HellSelectColumnOption<TValue>[];
}

/** Options for action columns. Action columns intentionally do not infer row values. */
export type HellActionColumnOptions<TData> = Omit<
  HellColumnOptions<TData, never>,
  'accessor' | 'sortable'
> & {
  readonly sortable?: false;
};

/** Options for row-selection columns. Selection columns intentionally remain required by default. */
export type HellSelectionColumnOptions<TData> = Omit<
  HellColumnOptions<TData, never>,
  'accessor' | 'sortable' | 'hideable'
> & {
  readonly sortable?: false;
  readonly hideable?: false;
  readonly mode?: 'checkbox' | 'radio';
};

/** Builder returned by `hellColumns<TData>()` for strongly typed column creation. */
export interface HellColumnsBuilder<TData> {
  define<const TColumns extends readonly HellColumnDef<TData, unknown>[]>(columns: TColumns): TColumns;

  text<TValue = unknown>(
    id: HellTableColumnId,
    options?: HellColumnOptions<TData, TValue>,
  ): HellColumnDef<TData, TValue>;

  boolean<TValue = boolean>(
    id: HellTableColumnId,
    options?: HellColumnOptions<TData, TValue>,
  ): HellColumnDef<TData, TValue>;

  select<TValue = unknown>(
    id: HellTableColumnId,
    options?: HellSelectColumnOptions<TData, TValue>,
  ): HellColumnDef<TData, TValue>;

  action(
    idOrOptions?: HellTableColumnId | HellActionColumnOptions<TData>,
    options?: HellActionColumnOptions<TData>,
  ): HellColumnDef<TData, never>;

  selection(
    idOrOptions?: HellTableColumnId | HellSelectionColumnOptions<TData>,
    options?: HellSelectionColumnOptions<TData>,
  ): HellColumnDef<TData, never>;
}

interface HellCreateColumnDefaults {
  readonly kind: HellColumnKind;
  readonly sortable: boolean;
  readonly hideable?: boolean;
  readonly visible?: boolean;
  readonly accessorFromId: boolean;
}

/** Creates a typed column builder for one row-data shape. */
export function hellColumns<TData>(): HellColumnsBuilder<TData> {
  return {
    define: (columns) => columns,
    text<TValue = unknown>(id: HellTableColumnId, options?: HellColumnOptions<TData, TValue>) {
      return textColumn<TData, TValue>(id, options);
    },
    boolean<TValue = boolean>(id: HellTableColumnId, options?: HellColumnOptions<TData, TValue>) {
      return booleanColumn<TData, TValue>(id, options);
    },
    select<TValue = unknown>(
      id: HellTableColumnId,
      options?: HellSelectColumnOptions<TData, TValue>,
    ) {
      return selectColumn<TData, TValue>(id, options);
    },
    action(idOrOptions?: HellTableColumnId | HellActionColumnOptions<TData>, options = {}) {
      return actionColumn<TData>(idOrOptions, options);
    },
    selection(idOrOptions?: HellTableColumnId | HellSelectionColumnOptions<TData>, options = {}) {
      return selectionColumn<TData>(idOrOptions, options);
    },
  };
}

/** Creates a text column definition. */
export function textColumn<TData, TValue = unknown>(
  id: HellTableColumnId,
  options: HellColumnOptions<TData, TValue> = {},
): HellColumnDef<TData, TValue> {
  return createColumn(id, options, {
    kind: 'text',
    sortable: true,
    accessorFromId: true,
  });
}

/** Creates a boolean column definition. */
export function booleanColumn<TData, TValue = boolean>(
  id: HellTableColumnId,
  options: HellColumnOptions<TData, TValue> = {},
): HellColumnDef<TData, TValue> {
  return createColumn(id, options, {
    kind: 'boolean',
    sortable: true,
    accessorFromId: true,
  });
}

/** Creates a select/dropdown-style column definition. */
export function selectColumn<TData, TValue = unknown>(
  id: HellTableColumnId,
  options: HellSelectColumnOptions<TData, TValue> = {},
): HellColumnDef<TData, TValue> {
  return {
    ...createColumn(id, options, {
      kind: 'select',
      sortable: true,
      accessorFromId: true,
    }),
    options: options.options,
  };
}

/** Creates an action column definition. */
export function actionColumn<TData>(
  idOrOptions: HellTableColumnId | HellActionColumnOptions<TData> = 'actions',
  options: HellActionColumnOptions<TData> = {},
): HellColumnDef<TData, never> {
  const [id, resolvedOptions] = resolveSpecialColumnArgs(idOrOptions, options, 'actions');
  return createColumn(id, resolvedOptions, {
    kind: 'action',
    sortable: false,
    hideable: false,
    accessorFromId: false,
  });
}

/** Creates a row-selection column definition. */
export function selectionColumn<TData>(
  idOrOptions: HellTableColumnId | HellSelectionColumnOptions<TData> = 'selection',
  options: HellSelectionColumnOptions<TData> = {},
): HellColumnDef<TData, never> {
  const [id, resolvedOptions] = resolveSpecialColumnArgs(idOrOptions, options, 'selection');
  return {
    ...createColumn(id, resolvedOptions, {
      kind: 'selection',
      sortable: false,
      hideable: false,
      accessorFromId: false,
    }),
    meta: { mode: resolvedOptions.mode ?? 'checkbox', ...(resolvedOptions.meta ?? {}) },
  };
}

/** Wraps an Angular TemplateRef as a table renderer descriptor. */
export function hellTemplateRenderer<TContext>(
  template: TemplateRef<TContext>,
): HellTableTemplateRenderer<TContext> {
  return { kind: 'template', template };
}

/** Wraps an Angular component type as a table renderer descriptor. */
export function hellComponentRenderer<TContext, TComponent>(
  component: Type<TComponent>,
  inputs?: HellTableComponentRenderer<TContext, TComponent>['inputs'],
): HellTableComponentRenderer<TContext, TComponent> {
  return { kind: 'component', component, inputs };
}

/** Resolves component-renderer inputs for a specific render context. */
export function hellTableComponentRendererInputs<TContext>(
  renderer: HellTableComponentRenderer<TContext>,
  context: TContext,
): Readonly<Record<string, unknown>> {
  if (!renderer.inputs) return {};
  return typeof renderer.inputs === 'function' ? renderer.inputs(context) : renderer.inputs;
}

/** True when the renderer descriptor targets an Angular TemplateRef. */
export function hellTableIsTemplateRenderer<TContext>(
  renderer: HellTableRenderer<TContext>,
): renderer is HellTableTemplateRenderer<TContext> {
  return typeof renderer !== 'function' && renderer.kind === 'template';
}

/** True when the renderer descriptor targets an Angular component. */
export function hellTableIsComponentRenderer<TContext>(
  renderer: HellTableRenderer<TContext>,
): renderer is HellTableComponentRenderer<TContext> {
  return typeof renderer !== 'function' && renderer.kind === 'component';
}

/** Evaluates function renderers; TemplateRef/component descriptors pass through unchanged. */
export function hellTableEvaluateRenderer<TContext>(
  resolved: HellTableResolvedRenderer<TContext>,
  context: TContext,
): unknown {
  return typeof resolved.renderer === 'function' ? resolved.renderer(context) : resolved.renderer;
}

/** Reads the cell value for a row from a normalized column accessor. */
export function hellTableColumnValue<TData, TValue>(
  column: Pick<HellTableColumn<TData, TValue>, 'accessor'>,
  row: TData,
): TValue | undefined {
  return column.accessor?.(row);
}

/** Resolves cell rendering in projected-template, column, built-in, raw-value order. */
export function hellTableResolveCellRenderer<TData, TValue>(
  registry: Pick<HellTableRenderRegistry<TData>, 'cells'>,
  column: HellTableColumn<TData, TValue>,
): HellTableResolvedRenderer<HellTableCellRenderContext<TData, TValue>> {
  const projected = registry.cells[column.id] as
    | HellTableRenderer<HellTableCellRenderContext<TData, TValue>>
    | undefined;
  if (projected) return { source: 'projected', renderer: projected };

  const columnRenderer = column.cell ?? column.renderer;
  if (columnRenderer) return { source: 'column', renderer: columnRenderer };

  const builtIn = builtInCellRenderer(column);
  if (builtIn) return { source: 'built-in', renderer: builtIn };

  return { source: 'accessor', renderer: ({ value }) => value };
}

/** Resolves header rendering in projected-template, column, built-in order. */
export function hellTableResolveHeaderRenderer<TData>(
  registry: Pick<HellTableRenderRegistry<TData>, 'headers'>,
  header: HellTableHeaderRenderContext<TData>['header'],
): HellTableResolvedRenderer<HellTableHeaderRenderContext<TData>> {
  const columnId = header.columnId ?? header.column?.id;
  const projected = columnId ? registry.headers[columnId] : undefined;
  if (projected) return { source: 'projected', renderer: projected };
  if (header.column?.headerCell) return { source: 'column', renderer: header.column.headerCell };
  return { source: 'built-in', renderer: ({ header: h }) => h.label ?? h.column?.header ?? h.columnId };
}

/** Resolves row-action rendering in projected-template, column, built-in order. */
export function hellTableResolveRowActionsRenderer<TData>(
  registry: Pick<HellTableRenderRegistry<TData>, 'rowActions'>,
  id: string,
  column?: HellTableColumn<TData>,
): HellTableResolvedRenderer<HellTableRowRenderContext<TData>> | null {
  const projected = registry.rowActions[id];
  if (projected) return { source: 'projected', renderer: projected };
  if (column?.rowActions) return { source: 'column', renderer: column.rowActions };
  if (column?.kind === 'action') return { source: 'built-in', renderer: () => null };
  return null;
}

/** Resolves row-editor rendering in projected-template, column order. */
export function hellTableResolveRowEditorRenderer<TData>(
  registry: Pick<HellTableRenderRegistry<TData>, 'rowEditors'>,
  id: string,
  column?: HellTableColumn<TData>,
): HellTableResolvedRenderer<HellTableRowRenderContext<TData>> | null {
  const projected = registry.rowEditors[id];
  if (projected) return { source: 'projected', renderer: projected };
  if (column?.rowEditor) return { source: 'column', renderer: column.rowEditor };
  return null;
}

function createColumn<TData, TValue, TOptions extends HellColumnOptions<TData, TValue>>(
  id: HellTableColumnId,
  options: TOptions,
  defaults: HellCreateColumnDefaults,
): HellColumnDef<TData, TValue> {
  const accessor = resolveAccessor<TData, TValue>(id, options.accessor, defaults.accessorFromId);
  return {
    id,
    kind: defaults.kind,
    header: options.header ?? id,
    accessor,
    accessorKey:
      typeof options.accessor === 'string'
        ? options.accessor
        : options.accessor === undefined && defaults.accessorFromId
          ? id
          : undefined,
    visible: options.visible ?? options.visibility?.visible ?? defaults.visible,
    hideable: options.hideable ?? options.visibility?.hideable ?? defaults.hideable,
    sortable: options.sortable ?? defaults.sortable,
    size: options.size ?? options.sizing?.size,
    minSize: options.minSize ?? options.sizing?.minSize,
    maxSize: options.maxSize ?? options.sizing?.maxSize,
    meta: options.meta,
    renderer: options.renderer ?? options.cell,
    cell: options.cell ?? options.renderer,
    headerCell: options.headerCell,
    rowActions: options.rowActions,
    rowEditor: options.rowEditor,
  };
}

function resolveSpecialColumnArgs<TOptions extends object>(
  idOrOptions: HellTableColumnId | TOptions,
  options: TOptions,
  fallbackId: HellTableColumnId,
): [HellTableColumnId, TOptions] {
  return typeof idOrOptions === 'string' ? [idOrOptions, options] : [fallbackId, idOrOptions];
}

function resolveAccessor<TData, TValue>(
  id: HellTableColumnId,
  accessor: HellColumnAccessor<TData, TValue> | undefined,
  accessorFromId: boolean,
): ((row: TData) => TValue) | undefined {
  if (typeof accessor === 'function') return accessor;
  const key = accessor ?? (accessorFromId ? id : undefined);
  if (!key) return undefined;
  return (row) => (row as Record<string, TValue>)[key];
}

function builtInCellRenderer<TData, TValue>(
  column: HellTableColumn<TData, TValue>,
): HellTableRenderFunction<HellTableCellRenderContext<TData, TValue>> | null {
  switch (column.kind) {
    case 'text':
      return ({ value }) => (value === null || value === undefined ? '' : String(value));
    case 'boolean':
      return ({ value }) => (value === true ? 'true' : value === false ? 'false' : '');
    case 'select':
      return ({ value }) => selectLabel(column.options, value);
    case 'action':
    case 'selection':
      return () => null;
    case 'custom':
    case undefined:
      return null;
  }
}

function selectLabel<TValue>(
  options: readonly HellSelectColumnOption<TValue>[] | undefined,
  value: TValue,
): unknown {
  const option = options?.find((candidate) => Object.is(candidate.value, value));
  return option ? option.label : value;
}
