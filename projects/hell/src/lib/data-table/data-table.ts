import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  Type,
  computed,
  contentChildren,
  effect,
  input,
  output,
  signal,
  type Signal,
} from '@angular/core';

import { HellStyleable } from '../core/styleable';
import {
  HellTable,
  HellTableBody,
  HellTableCell,
  HellTableHead,
  HellTableHeaderCell,
  HellTableRow,
  HellTableSortTrigger,
} from '../features/table-utilities/table-utilities';
import {
  hellTableColumnValue,
  hellTableComponentRendererInputs,
  hellTableEvaluateRenderer,
  hellTableIsComponentRenderer,
  hellTableIsTemplateRenderer,
  hellTableResolveCellRenderer,
  hellTableResolveHeaderRenderer,
  hellTableResolveRowActionsRenderer,
} from '../table/table-columns';
import {
  HellCell,
  HellHeaderCell,
  HellRowActions,
  HELL_TABLE_RENDER_DIRECTIVES,
  hellTableCreateProjectedRenderRegistry,
} from '../table/table-render-directives';
import {
  hellTableCreateCommands,
  hellTableCreateState,
  hellTableDefaultRowKey,
  hellTableHeaderGroupsFromColumns,
  hellTableRowsFromData,
  hellTableVisibleColumns,
  type HellColumnDef,
  type HellTableCellRenderContext,
  type HellTableColumn,
  type HellTableHeaderRenderContext,
  type HellTableModelHeader,
  type HellTableModelRow,
  type HellTableResolvedRenderer,
  type HellTableRowKeyAccessor,
  type HellTableRowKeyValue,
  type HellTableRowPart,
  type HellTableRowRenderContext,
  type HellTableSignalInput,
  type HellTableSortDirection,
  type HellTableSortingState,
} from '../table/table-model';

/** Visual density for the simple data-table renderer. */
export type HellDataTableDensity = 'compact' | 'default' | 'comfortable';

/** Row-key input accepted by `hell-data-table`. */
export type HellDataTableRowKey<TData> = Extract<keyof TData, string> | HellTableRowKeyAccessor<TData>;

type HellDataTableHeaderView<TData> = HellDataTableRenderView<HellTableHeaderRenderContext<TData>>;
type HellDataTableCellView<TData> = HellDataTableRenderView<
  HellTableCellRenderContext<TData, unknown> | HellTableRowRenderContext<TData>
>;

type HellDataTableRenderView<TContext> =
  | {
      readonly kind: 'template';
      readonly template: TemplateRef<TContext>;
      readonly context: TContext;
    }
  | {
      readonly kind: 'component';
      readonly component: Type<unknown>;
      readonly inputs: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: 'value';
      readonly value: unknown;
    };

/** Projected toolbar content for the leading side of `hell-data-table`. */
@Directive({
  selector: '[hellDataTableToolbarStart]',
  host: {
    '[attr.data-hell-data-table-toolbar-start]': '""',
  },
})
export class HellDataTableToolbarStart {}

/** Projected toolbar content for the center/default slot of `hell-data-table`. */
@Directive({
  selector: '[hellDataTableToolbar]',
  host: {
    '[attr.data-hell-data-table-toolbar]': '""',
  },
})
export class HellDataTableToolbar {}

/** Projected toolbar content for the trailing side of `hell-data-table`. */
@Directive({
  selector: '[hellDataTableToolbarEnd]',
  host: {
    '[attr.data-hell-data-table-toolbar-end]': '""',
  },
})
export class HellDataTableToolbarEnd {}

/**
 * Simple native-table renderer for Hell column definitions.
 *
 * It owns only array/signal row rendering, native table markup, projected render
 * templates, lightweight sorting state, and status rows. TanStack Table,
 * virtual scrolling, CDK table skins, routing, Font Awesome, CodeMirror, and
 * pdf.js stay outside this entry point.
 */
@Component({
  selector: 'hell-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    HellTable,
    HellTableHead,
    HellTableBody,
    HellTableRow,
    HellTableHeaderCell,
    HellTableSortTrigger,
    HellTableCell,
  ],
  host: {
    '[class.hell-data-table]': '!unstyled()',
    '[attr.data-density]': 'density()',
    '[attr.data-loading]': 'loading() ? "true" : null',
    '[attr.data-error]': 'error() !== null && error() !== undefined ? "true" : null',
    '[attr.data-empty]': 'isEmpty() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  template: `
    <div data-slot="toolbar">
      <ng-content select="[hellDataTableToolbarStart]" />
      <ng-content select="[hellDataTableToolbar]" />
      <ng-content select="[hellDataTableToolbarEnd]" />
    </div>

    <div data-slot="scroller">
      <table hellTable [unstyled]="unstyled()">
        <thead hellTableHeader [unstyled]="unstyled()">
          @for (headerGroup of headerGroups(); track headerGroup.id) {
            <tr hellTableRow [unstyled]="unstyled()">
              @for (header of headerGroup.headers; track header.id) {
                <th
                  hellTableHeaderCell
                  scope="col"
                  [unstyled]="unstyled()"
                  [attr.colspan]="header.colSpan ?? null"
                  [attr.rowspan]="header.rowSpan ?? null"
                  [columnId]="header.columnId ?? null"
                  [sortable]="isSortable(header.column)"
                  [sort]="sortForHeader(header)"
                  (sortToggle)="toggleSort(header.column)"
                >
                  @if (isSortable(header.column)) {
                    <button hellTableSortTrigger [unstyled]="unstyled()" type="button">
                      <ng-container [ngTemplateOutlet]="headerContent" [ngTemplateOutletContext]="{ $implicit: header }" />
                    </button>
                  } @else {
                    <ng-container [ngTemplateOutlet]="headerContent" [ngTemplateOutletContext]="{ $implicit: header }" />
                  }

                  <ng-template #headerContent let-currentHeader>
                    @let view = headerView(currentHeader);
                    @if (view.kind === 'template') {
                      <ng-container
                        [ngTemplateOutlet]="view.template"
                        [ngTemplateOutletContext]="view.context"
                      />
                    } @else if (view.kind === 'component') {
                      <ng-container
                        [ngComponentOutlet]="view.component"
                        [ngComponentOutletInputs]="view.inputs"
                      />
                    } @else {
                      {{ view.value }}
                    }
                  </ng-template>
                </th>
              }
            </tr>
          }
        </thead>

        <tbody hellTableBody [unstyled]="unstyled()">
          @for (part of rowParts(); track part.key) {
            @if (part.kind === 'row') {
              <tr hellTableRow [unstyled]="unstyled()" [attr.data-row-key]="part.row.key">
                @for (column of visibleColumns(); track column.id) {
                  <td hellTableCell [unstyled]="unstyled()" [attr.data-column-id]="column.id">
                    @let view = cellView(part.row, column);
                    @if (view.kind === 'template') {
                      <ng-container
                        [ngTemplateOutlet]="view.template"
                        [ngTemplateOutletContext]="view.context"
                      />
                    } @else if (view.kind === 'component') {
                      <ng-container
                        [ngComponentOutlet]="view.component"
                        [ngComponentOutletInputs]="view.inputs"
                      />
                    } @else {
                      {{ view.value }}
                    }
                  </td>
                }
              </tr>
            } @else if (part.kind === 'loader') {
              <tr hellTableRow [unstyled]="unstyled()" data-status="loading">
                <td hellTableCell [unstyled]="unstyled()" align="center" space="empty" [colSpan]="visibleColumnCount()">
                  {{ loadingText() }}
                </td>
              </tr>
            } @else if (part.kind === 'error') {
              <tr hellTableRow [unstyled]="unstyled()" data-status="error">
                <td hellTableCell [unstyled]="unstyled()" align="center" space="empty" [colSpan]="visibleColumnCount()">
                  {{ errorText(part.error) }}
                </td>
              </tr>
            } @else {
              <tr hellTableRow [unstyled]="unstyled()" data-status="empty">
                <td hellTableCell [unstyled]="unstyled()" align="center" space="empty" [colSpan]="visibleColumnCount()">
                  {{ empty() }}
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
})
export class HellDataTable<TData = unknown> extends HellStyleable {
  /** Column definitions from `hellColumns<T>()`, `textColumn`, or compatible objects. */
  readonly columns = input.required<HellTableSignalInput<readonly HellColumnDef<TData>[]>>();

  /** Row data as a static array or Angular signal. */
  readonly rows = input<HellTableSignalInput<readonly TData[]>>([]);

  /** Stable row key accessor or property name. Defaults to `key`, then `id`, then row index. */
  readonly rowKey = input<HellDataTableRowKey<TData> | null>(null);

  /** Loading state. Renders a single native status row. */
  readonly loading = input(false);

  /** Error state. Any non-null/undefined value renders a single native status row. */
  readonly error = input<unknown | null>(null);

  /** Empty-state text for the built-in empty row. */
  readonly empty = input<unknown>('No rows.');

  /** Current sorting state. Use `[(sorting)]` for controlled sorting. */
  readonly sorting = input<readonly HellTableSortingState[]>([]);

  /** Emits whenever a sortable header cycles sort state. */
  readonly sortingChange = output<readonly HellTableSortingState[]>();

  /** Density hook for styles. */
  readonly density = input<HellDataTableDensity>('default');

  private readonly projectedCells = contentChildren(HellCell<TData, unknown>, { descendants: true });
  private readonly projectedHeaders = contentChildren(HellHeaderCell<TData>, { descendants: true });
  private readonly projectedRowActions = contentChildren(HellRowActions<TData>, {
    descendants: true,
  });

  private readonly internalSorting = signal<readonly HellTableSortingState[]>([]);

  protected readonly state = hellTableCreateState();
  protected readonly resolvedColumns = computed(() => readSignalInput(this.columns()));
  protected readonly visibleColumns = computed(() => hellTableVisibleColumns(this.resolvedColumns(), {}));
  protected readonly visibleColumnCount = computed(() => Math.max(this.visibleColumns().length, 1));
  protected readonly headerGroups = computed(() =>
    hellTableHeaderGroupsFromColumns(this.visibleColumns()),
  );
  protected readonly rawRows = computed(() => readSignalInput(this.rows()));
  protected readonly activeSorting = computed(() => this.internalSorting());
  protected readonly sortedRows = computed(() =>
    sortRows(this.rawRows(), this.visibleColumns(), this.activeSorting()),
  );
  protected readonly rowKeyAccessor = computed(() => rowKeyAccessorFor(this.rowKey()));
  protected readonly tableRows = computed(() =>
    hellTableRowsFromData(this.sortedRows(), this.rowKeyAccessor()),
  );
  protected readonly rowParts = computed<readonly HellTableRowPart<TData>[]>(() => {
    if (this.loading()) return [{ kind: 'loader', key: 'loader' }];
    const error = this.error();
    if (error !== null && error !== undefined) return [{ kind: 'error', key: 'error', error }];
    const rows = this.tableRows();
    if (!rows.length) return [{ kind: 'empty', key: 'empty' }];
    return rows.map((row) => ({ kind: 'row', key: `row:${row.key}`, row }));
  });
  protected readonly commands = hellTableCreateCommands(this.state, this.tableRows);
  protected readonly renderRegistry = computed(() =>
    hellTableCreateProjectedRenderRegistry<TData>({
      cells: this.projectedCells(),
      headers: this.projectedHeaders(),
      rowActions: this.projectedRowActions(),
    }),
  );
  protected readonly isEmpty = computed(
    () => !this.loading() && (this.error() === null || this.error() === undefined) && !this.tableRows().length,
  );

  constructor() {
    super();
    effect(() => {
      const sorting = this.sorting();
      this.internalSorting.set(sorting);
      this.state.sorting.set(sorting);
    });
  }

  protected loadingText(): string {
    return 'Loading…';
  }

  protected errorText(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  protected isSortable(column: HellTableColumn<TData> | undefined): boolean {
    return column?.sortable === true;
  }

  protected sortForHeader(header: HellTableModelHeader<TData>): HellTableSortDirection | null {
    if (!header.columnId || !this.isSortable(header.column)) return null;
    return this.activeSorting().find((sort) => sort.columnId === header.columnId)?.direction ?? null;
  }

  protected toggleSort(column: HellTableColumn<TData> | undefined): void {
    if (column === undefined || column.sortable !== true) return;
    const current = this.activeSorting().find((sort) => sort.columnId === column.id);
    const direction: HellTableSortDirection | null =
      current?.direction === 'asc' ? 'desc' : current?.direction === 'desc' ? null : 'asc';
    const next = direction ? [{ columnId: column.id, direction }] : [];
    this.internalSorting.set(next);
    this.state.sorting.set(next);
    this.sortingChange.emit(next);
  }

  protected headerView(header: HellTableModelHeader<TData>): HellDataTableHeaderView<TData> {
    const context = {
      header,
      headerGroup: this.headerGroups().find((group) => group.headers.includes(header)) ?? this.headerGroups()[0],
    } satisfies HellTableHeaderRenderContext<TData>;
    const resolved = hellTableResolveHeaderRenderer(this.renderRegistry(), header);
    return renderView(resolved, context);
  }

  protected cellView(
    row: HellTableModelRow<TData>,
    column: HellTableColumn<TData>,
  ): HellDataTableCellView<TData> {
    if (column.kind === 'action') {
      const resolvedActions = hellTableResolveRowActionsRenderer(
        this.renderRegistry(),
        column.id,
        column,
      );
      if (resolvedActions) {
        return renderView(resolvedActions, {
          row,
          state: this.state,
          commands: this.commands,
        });
      }
    }

    const context = {
      row,
      column,
      value: hellTableColumnValue(column, row.original),
    } satisfies HellTableCellRenderContext<TData, unknown>;
    const resolved = hellTableResolveCellRenderer(this.renderRegistry(), column);
    return renderView(resolved, context);
  }
}

/** Standalone imports for the simple data-table renderer and projected slots. */
export const HELL_DATA_TABLE_DIRECTIVES = [
  HellDataTable,
  HellDataTableToolbarStart,
  HellDataTableToolbar,
  HellDataTableToolbarEnd,
  ...HELL_TABLE_RENDER_DIRECTIVES,
] as const;

function readSignalInput<T>(inputValue: HellTableSignalInput<T>): T {
  return typeof inputValue === 'function' ? (inputValue as Signal<T>)() : inputValue;
}

function rowKeyAccessorFor<TData>(
  rowKey: HellDataTableRowKey<TData> | null,
): HellTableRowKeyAccessor<TData> {
  if (typeof rowKey === 'function') return rowKey;
  if (typeof rowKey === 'string') {
    return (row, index) => {
      const value = (row as Record<string, unknown>)[rowKey];
      if (isRowKeyValue(value)) return value;
      throw new Error(
        `HellDataTable rowKey "${rowKey}" must resolve to a string or finite number at index ${index}.`,
      );
    };
  }
  return hellTableDefaultRowKey;
}

function isRowKeyValue(value: unknown): value is HellTableRowKeyValue {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function sortRows<TData>(
  rows: readonly TData[],
  columns: readonly HellTableColumn<TData>[],
  sorting: readonly HellTableSortingState[],
): readonly TData[] {
  const activeSorts = sorting
    .map((sort) => ({ sort, column: columns.find((column) => column.id === sort.columnId) }))
    .filter((entry): entry is { sort: HellTableSortingState; column: HellTableColumn<TData> } =>
      entry.column?.sortable === true,
    );
  if (!activeSorts.length) return rows;

  return [...rows].sort((a, b) => {
    for (const { sort, column } of activeSorts) {
      const result = compareValues(column.accessor?.(a), column.accessor?.(b));
      if (result) return sort.direction === 'asc' ? result : -result;
    }
    return 0;
  });
}

function compareValues(a: unknown, b: unknown): number {
  if (Object.is(a, b)) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function renderView<TContext>(
  resolved: HellTableResolvedRenderer<TContext>,
  context: TContext,
): HellDataTableRenderView<TContext> {
  if (hellTableIsTemplateRenderer(resolved.renderer)) {
    return { kind: 'template', template: resolved.renderer.template, context };
  }
  if (hellTableIsComponentRenderer(resolved.renderer)) {
    return {
      kind: 'component',
      component: resolved.renderer.component,
      inputs: hellTableComponentRendererInputs(resolved.renderer, context),
    };
  }
  return { kind: 'value', value: hellTableEvaluateRenderer(resolved, context) };
}

export {
  HELL_TABLE_RENDER_DIRECTIVES,
  HellCell,
  HellEditField,
  HellHeaderCell,
  HellRowActions,
  HellRowEditor,
  actionColumn,
  booleanColumn,
  hellColumns,
  hellComponentRenderer,
  hellTemplateRenderer,
  selectColumn,
  selectionColumn,
  textColumn,
} from '../table/table';

export type {
  HellColumnDef,
  HellColumnKind,
  HellColumnMeta,
  HellTableCellRenderContext,
  HellTableColumn,
  HellTableColumnId,
  HellTableHeaderRenderContext,
  HellTableRenderer,
  HellTableRowKey,
  HellTableRowRenderContext,
  HellTableSortingState,
} from '../table/table';
