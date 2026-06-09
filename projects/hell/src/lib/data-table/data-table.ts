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
  model,
  output,
  signal,
  type Signal,
} from '@angular/core';

import { HellStyleable } from '../core/styleable';
import { HellColumnVisibilityPanel } from '../table/column-visibility-panel';
import {
  HellTable,
  HellTableBody,
  HellTableCell,
  HellTableHead,
  HellTableHeaderCell,
  HellTableRow,
  HellTableRowAction,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableSelectionCell,
  HellTableSortTrigger,
  type HellTableGridInteractionMode,
  type HellTableSemantics,
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
  hellTableResolveRowEditorRenderer,
} from '../table/table-columns';
import {
  HellCell,
  HellEditField,
  HellHeaderCell,
  HellRowActions,
  HellRowEditor,
  HELL_TABLE_RENDER_DIRECTIVES,
  hellTableCreateProjectedRenderRegistry,
} from '../table/table-render-directives';
import {
  hellTableCreateCommands,
  hellTableCreateState,
  hellTableDefaultRowKey,
  hellTableHeaderGroupsFromColumns,
  hellTableResolveStateUpdater,
  hellTableRowsFromData,
  hellTableVirtualRowPartsFromRows,
  hellTableVisibleColumns,
  type HellColumnDef,
  type HellTableCellRenderContext,
  type HellTableColumn,
  type HellTableHeaderRenderContext,
  type HellTableModelHeader,
  type HellTableModelRow,
  type HellTableResolvedRenderer,
  type HellTableRowKey,
  type HellTableRowKeyAccessor,
  type HellTableRowKeyValue,
  type HellTableColumnVisibilityState,
  type HellTableRowPart,
  type HellTableRowEditorRenderContext,
  type HellTableRowRenderContext,
  type HellTableRowSelectionState,
  type HellTableSelectionColumnConfig,
  type HellTableSignalInput,
  type HellTableSortDirection,
  type HellTableSortingState,
  type HellTableState,
  type HellTableStateUpdater,
} from '../table/table-model';
import { HellRowDraftController } from '../table/row-draft';

/** Visual density for the simple data-table renderer. */
export type HellDataTableDensity = 'compact' | 'default' | 'comfortable';

/** Row-key input accepted by `hell-data-table`. */
export type HellDataTableRowKey<TData> =
  | Extract<keyof TData, string>
  | HellTableRowKeyAccessor<TData>;

type HellDataTableHeaderView<TData> = HellDataTableRenderView<HellTableHeaderRenderContext<TData>>;
type HellDataTableCellView<TData> = HellDataTableRenderView<
  HellTableCellRenderContext<TData, unknown> | HellTableRowRenderContext<TData>
>;
type HellDataTableRowEditorView<TData> = HellDataTableRenderView<
  HellTableRowEditorRenderContext<TData>
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

let nextSelectionRadioGroupId = 0;

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

/** Projected toolbar content shown only when checkbox row selection is non-empty. */
@Directive({
  selector: '[hellDataTableBulkActions]',
  host: {
    '[attr.data-hell-data-table-bulk-actions]': '""',
  },
})
export class HellDataTableBulkActions {}

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
    HellTableSelectionCell,
    HellTableSortTrigger,
    HellTableCell,
    HellTableRowCheckbox,
    HellTableRowRadio,
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
      @if (selectedRowCount()) {
        <ng-content select="[hellDataTableBulkActions]" />
      }
    </div>

    <div data-slot="scroller">
      <table
        hellTable
        [unstyled]="unstyled()"
        [semantics]="semantics()"
        [interactionMode]="interactionMode()"
        [rowCount]="gridRowCount()"
        [colCount]="gridColCount()"
      >
        <thead hellTableHeader [unstyled]="unstyled()">
          @for (headerGroup of headerGroups(); track headerGroup.id; let headerRowIndex = $index) {
            <tr hellTableRow [unstyled]="unstyled()" [rowIndex]="headerRowIndex + 1">
              @for (header of headerGroup.headers; track header.id; let headerColIndex = $index) {
                @if (isSelectionColumn(header.column)) {
                  <th
                    hellTableHeaderCell
                    hellTableSelectionCell
                    scope="col"
                    [unstyled]="unstyled()"
                    [attr.colspan]="header.colSpan ?? null"
                    [attr.rowspan]="header.rowSpan ?? null"
                    [columnId]="header.columnId ?? null"
                    [colIndex]="headerColIndex + 1"
                  >
                    @if (selectionSelectAllEnabled(header.column)) {
                      <input
                        hellTableRowCheckbox
                        type="checkbox"
                        [unstyled]="unstyled()"
                        [attr.aria-label]="selectAllAriaLabel(header.column)"
                        [checked]="allVisibleRowsSelected(header.column)"
                        [indeterminate]="someVisibleRowsSelected(header.column)"
                        [disabled]="!selectableRowsForColumn(header.column).length"
                        (checkedChange)="setVisibleRowsSelected(header.column, $event)"
                      />
                    } @else {
                      <ng-container
                        [ngTemplateOutlet]="headerContent"
                        [ngTemplateOutletContext]="{ $implicit: header }"
                      />
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
                } @else {
                  <th
                    hellTableHeaderCell
                    scope="col"
                    [unstyled]="unstyled()"
                    [attr.colspan]="header.colSpan ?? null"
                    [attr.rowspan]="header.rowSpan ?? null"
                    [columnId]="header.columnId ?? null"
                    [colIndex]="headerColIndex + 1"
                    [sortable]="isSortable(header.column)"
                    [sort]="sortForHeader(header)"
                    (sortToggle)="toggleSort(header.column)"
                  >
                    @if (isSortable(header.column)) {
                      <button hellTableSortTrigger [unstyled]="unstyled()" type="button">
                        <ng-container
                          [ngTemplateOutlet]="headerContent"
                          [ngTemplateOutletContext]="{ $implicit: header }"
                        />
                      </button>
                    } @else {
                      <ng-container
                        [ngTemplateOutlet]="headerContent"
                        [ngTemplateOutletContext]="{ $implicit: header }"
                      />
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
              }
            </tr>
          }
        </thead>

        <tbody hellTableBody [unstyled]="unstyled()">
          @for (part of rowParts(); track part.key; let rowPartIndex = $index) {
            @if (part.kind === 'row') {
              <tr
                hellTableRow
                [unstyled]="unstyled()"
                [rowIndex]="bodyGridRowIndex(rowPartIndex)"
                [active]="commands.isActive(part.row)"
                [selected]="isDataRowSelected(part.row)"
                [attr.data-row-key]="part.row.key"
              >
                @for (column of visibleColumns(); track column.id; let columnIndex = $index) {
                  @if (isSelectionColumn(column)) {
                    <td
                      hellTableCell
                      hellTableSelectionCell
                      [unstyled]="unstyled()"
                      [colIndex]="columnIndex + 1"
                      [attr.data-column-id]="column.id"
                    >
                      @if (selectionMode(column) === 'radio') {
                        <input
                          hellTableRowRadio
                          type="radio"
                          [unstyled]="unstyled()"
                          [name]="selectionRadioName(column)"
                          [attr.aria-label]="selectionControlAriaLabel(part.row, column)"
                          [checked]="isSingleRowSelected(part.row)"
                          [disabled]="isSelectionDisabled(part.row, column)"
                          (checkedChange)="setSingleRowSelected(part.row, column, $event)"
                        />
                      } @else {
                        <input
                          hellTableRowCheckbox
                          type="checkbox"
                          [unstyled]="unstyled()"
                          [attr.aria-label]="selectionControlAriaLabel(part.row, column)"
                          [checked]="commands.isRowSelected(part.row)"
                          [disabled]="isSelectionDisabled(part.row, column)"
                          (checkedChange)="setRowSelected(part.row, column, $event)"
                        />
                      }
                    </td>
                  } @else {
                    <td
                      hellTableCell
                      [unstyled]="unstyled()"
                      [colIndex]="columnIndex + 1"
                      [attr.data-column-id]="column.id"
                    >
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
                }
              </tr>
            } @else if (part.kind === 'editor') {
              @if (rowEditorView(part.row); as editorView) {
                <tr
                  hellTableRow
                  [unstyled]="unstyled()"
                  [rowIndex]="bodyGridRowIndex(rowPartIndex)"
                  data-row-editor
                  [attr.data-row-key]="part.row.key"
                  [attr.data-row-part-key]="part.key"
                >
                  <td
                    hellTableCell
                    [unstyled]="unstyled()"
                    [colIndex]="1"
                    [colSpan]="visibleColumnCount()"
                  >
                    @if (editorView.kind === 'template') {
                      <ng-container
                        [ngTemplateOutlet]="editorView.template"
                        [ngTemplateOutletContext]="editorView.context"
                      />
                    } @else if (editorView.kind === 'component') {
                      <ng-container
                        [ngComponentOutlet]="editorView.component"
                        [ngComponentOutletInputs]="editorView.inputs"
                      />
                    } @else {
                      {{ editorView.value }}
                    }
                  </td>
                </tr>
              }
            } @else if (part.kind === 'loader') {
              <tr
                hellTableRow
                [unstyled]="unstyled()"
                [rowIndex]="bodyGridRowIndex(rowPartIndex)"
                data-status="loading"
              >
                <td
                  hellTableCell
                  [unstyled]="unstyled()"
                  [colIndex]="1"
                  align="center"
                  space="empty"
                  [colSpan]="visibleColumnCount()"
                >
                  {{ loadingText() }}
                </td>
              </tr>
            } @else if (part.kind === 'error') {
              <tr
                hellTableRow
                [unstyled]="unstyled()"
                [rowIndex]="bodyGridRowIndex(rowPartIndex)"
                data-status="error"
              >
                <td
                  hellTableCell
                  [unstyled]="unstyled()"
                  [colIndex]="1"
                  align="center"
                  space="empty"
                  [colSpan]="visibleColumnCount()"
                >
                  {{ errorText(part.error) }}
                </td>
              </tr>
            } @else {
              <tr
                hellTableRow
                [unstyled]="unstyled()"
                [rowIndex]="bodyGridRowIndex(rowPartIndex)"
                data-status="empty"
              >
                <td
                  hellTableCell
                  [unstyled]="unstyled()"
                  [colIndex]="1"
                  align="center"
                  space="empty"
                  [colSpan]="visibleColumnCount()"
                >
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
  readonly columns = input<HellTableSignalInput<readonly HellColumnDef<TData>[]>>([]);

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

  /** Draft lifecycle controller used by active row-editor templates. */
  readonly rowDraftController = input<HellRowDraftController<TData> | null>(null);

  /** Semantic mode. Native table semantics stay the default; grid requires an explicit interaction mode. */
  readonly semantics = input<HellTableSemantics>('table');

  /** Explicit keyboard interaction mode required when `semantics="grid"`. */
  readonly interactionMode = input<HellTableGridInteractionMode | null>(null);

  /** Current sorting state. Use `[(sorting)]` for controlled sorting. */
  readonly sorting = input<readonly HellTableSortingState[]>([]);

  /** Active master/detail row key. Use `[(activeRowKey)]` for controlled row editors. */
  readonly activeRowKey = model<HellTableRowKey | null>(null);

  /** Multi-row checkbox selection keyed by stable row key. Use `[(rowSelection)]` for controlled bulk selection. */
  readonly rowSelection = model<HellTableRowSelectionState>({});

  /** Single radio selection keyed by stable row key. Use `[(selectedRowKey)]` for controlled single selection. */
  readonly selectedRowKey = model<HellTableRowKey | null>(null);

  /** Column visibility keyed by stable column id. Use `[(columnVisibility)]` for app-owned persistence. */
  readonly columnVisibility = model<HellTableColumnVisibilityState>({});

  /** Emits whenever a sortable header cycles sort state. */
  readonly sortingChange = output<readonly HellTableSortingState[]>();

  /** Density hook for styles. */
  readonly density = input<HellDataTableDensity>('default');

  private readonly projectedCells = contentChildren(HellCell<TData, unknown>, {
    descendants: true,
  });
  private readonly projectedHeaders = contentChildren(HellHeaderCell<TData>, { descendants: true });
  private readonly projectedRowActions = contentChildren(HellRowActions<TData>, {
    descendants: true,
  });
  private readonly projectedRowEditors = contentChildren(HellRowEditor<TData>, {
    descendants: true,
  });
  private readonly projectedEditFields = contentChildren(HellEditField<TData, unknown>, {
    descendants: true,
  });

  private readonly internalSorting = signal<readonly HellTableSortingState[]>([]);
  private readonly internalRowDraftController = new HellRowDraftController<TData>();
  private readonly selectionRadioGroupName = `hell-data-table-selection-${nextSelectionRadioGroupId++}`;

  protected readonly state = {
    ...hellTableCreateState(),
    activeRowKey: {
      value: this.activeRowKey,
      set: (next: HellTableRowKey | null) => this.activeRowKey.set(next),
      update: (updater: HellTableStateUpdater<HellTableRowKey | null>) =>
        this.activeRowKey.update((current) => hellTableResolveStateUpdater(current, updater)),
    },
    rowSelection: {
      value: this.rowSelection,
      set: (next: HellTableRowSelectionState) => this.rowSelection.set(next),
      update: (updater: HellTableStateUpdater<HellTableRowSelectionState>) =>
        this.rowSelection.update((current) => hellTableResolveStateUpdater(current, updater)),
    },
    selectedRowKey: {
      value: this.selectedRowKey,
      set: (next: HellTableRowKey | null) => this.selectedRowKey.set(next),
      update: (updater: HellTableStateUpdater<HellTableRowKey | null>) =>
        this.selectedRowKey.update((current) => hellTableResolveStateUpdater(current, updater)),
    },
    columnVisibility: {
      value: this.columnVisibility,
      set: (next: HellTableColumnVisibilityState) => this.columnVisibility.set(next),
      update: (updater: HellTableStateUpdater<HellTableColumnVisibilityState>) =>
        this.columnVisibility.update((current) => hellTableResolveStateUpdater(current, updater)),
    },
  } satisfies HellTableState;
  protected readonly resolvedColumns = computed(() => readSignalInput(this.columns()));
  protected readonly visibleColumns = computed(() =>
    hellTableVisibleColumns(this.resolvedColumns(), this.columnVisibility()),
  );
  protected readonly visibleColumnCount = computed(() => Math.max(this.visibleColumns().length, 1));
  protected readonly headerGroups = computed(() =>
    hellTableHeaderGroupsFromColumns(this.visibleColumns()),
  );
  protected readonly rawRows = computed(() => readSignalInput(this.rows()));
  protected readonly activeSorting = computed(() => this.internalSorting());
  protected readonly sortedRows = computed(() => {
    const rows = this.rawRows();
    const sorting = this.activeSorting();
    return sorting.length ? sortRows(rows, this.visibleColumns(), sorting) : rows;
  });
  protected readonly rowKeyAccessor = computed(() => rowKeyAccessorFor(this.rowKey()));
  protected readonly tableRows = computed(() =>
    hellTableRowsFromData(this.sortedRows(), this.rowKeyAccessor()),
  );
  protected readonly commands = hellTableCreateCommands(this.state, this.tableRows);
  protected readonly draftController = computed(
    () => this.rowDraftController() ?? this.internalRowDraftController,
  );
  protected readonly renderRegistry = computed(() =>
    hellTableCreateProjectedRenderRegistry<TData>({
      cells: this.projectedCells(),
      headers: this.projectedHeaders(),
      rowActions: this.projectedRowActions(),
      rowEditors: this.projectedRowEditors(),
      editFields: this.projectedEditFields(),
    }),
  );
  protected readonly rowEditorSlot = computed(() => {
    const projectedEditorId = this.projectedRowEditors()[0]?.id;
    const editorColumn =
      this.visibleColumns().find((column) => column.id === projectedEditorId) ??
      this.visibleColumns().find((column) => column.rowEditor !== undefined);
    const editorId = projectedEditorId ?? editorColumn?.id ?? 'detail';
    return { editorId, editorColumn };
  });
  protected readonly hasRowEditor = computed(() => {
    const slot = this.rowEditorSlot();
    return (
      hellTableResolveRowEditorRenderer(this.renderRegistry(), slot.editorId, slot.editorColumn) !==
      null
    );
  });
  protected readonly rowParts = computed<readonly HellTableRowPart<TData>[]>(() =>
    hellTableVirtualRowPartsFromRows({
      rows: this.tableRows(),
      loading: this.loading(),
      error: this.error(),
      activeEditorRowKey: this.hasRowEditor() ? this.activeRowKey() : null,
    }),
  );
  protected readonly isEmpty = computed(
    () =>
      !this.loading() &&
      (this.error() === null || this.error() === undefined) &&
      !this.tableRows().length,
  );
  protected readonly selectedRowCount = computed(
    () => Object.values(this.rowSelection()).filter(Boolean).length,
  );
  protected readonly gridRowCount = computed(
    () => this.headerGroups().length + this.rowParts().length,
  );
  protected readonly gridColCount = computed(() => this.visibleColumnCount());

  constructor() {
    super();
    effect(() => {
      const sorting = this.sorting();
      this.internalSorting.set(sorting);
      this.state.sorting.set(sorting);
    });
    effect(() => {
      const key = this.activeRowKey();
      if (key === null) return;
      if (!this.tableRows().some((row) => row.key === key)) this.commands.closeRow(key);
    });
    effect(() => {
      this.draftController().cleanupRows(this.tableRows());
    });
  }

  protected bodyGridRowIndex(rowPartIndex: number): number {
    return this.headerGroups().length + rowPartIndex + 1;
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
    return (
      this.activeSorting().find((sort) => sort.columnId === header.columnId)?.direction ?? null
    );
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

  protected isSelectionColumn(column: HellTableColumn<TData> | undefined): boolean {
    return column?.kind === 'selection';
  }

  protected selectionMode(column: HellTableColumn<TData> | undefined): 'checkbox' | 'radio' {
    return this.selectionConfig(column).mode ?? 'checkbox';
  }

  protected selectionSelectAllEnabled(column: HellTableColumn<TData> | undefined): boolean {
    return (
      this.selectionMode(column) === 'checkbox' && this.selectionConfig(column).selectAll !== false
    );
  }

  protected selectableRowsForColumn(
    column: HellTableColumn<TData> | undefined,
  ): readonly HellTableModelRow<TData>[] {
    return this.tableRows().filter((row) => !this.isSelectionDisabled(row, column));
  }

  protected allVisibleRowsSelected(column: HellTableColumn<TData> | undefined): boolean {
    const rows = this.selectableRowsForColumn(column);
    return rows.length > 0 && rows.every((row) => this.commands.isRowSelected(row));
  }

  protected someVisibleRowsSelected(column: HellTableColumn<TData> | undefined): boolean {
    const rows = this.selectableRowsForColumn(column);
    const selected = rows.filter((row) => this.commands.isRowSelected(row)).length;
    return selected > 0 && selected < rows.length;
  }

  protected setVisibleRowsSelected(
    column: HellTableColumn<TData> | undefined,
    selected: boolean,
  ): void {
    const rows = this.selectableRowsForColumn(column);
    if (!rows.length) return;
    this.rowSelection.update((current) => {
      const next: Record<string, boolean> = { ...current };
      for (const row of rows) next[row.key] = selected;
      return next;
    });
  }

  protected isDataRowSelected(row: HellTableModelRow<TData>): boolean {
    return this.commands.isRowSelected(row) || this.isSingleRowSelected(row);
  }

  protected isSingleRowSelected(row: HellTableModelRow<TData>): boolean {
    return this.selectedRowKey() === row.key;
  }

  protected setRowSelected(
    row: HellTableModelRow<TData>,
    column: HellTableColumn<TData>,
    selected: boolean,
  ): void {
    if (this.isSelectionDisabled(row, column)) return;
    this.commands.setRowSelected(row, selected);
  }

  protected setSingleRowSelected(
    row: HellTableModelRow<TData>,
    column: HellTableColumn<TData>,
    selected: boolean,
  ): void {
    if (this.isSelectionDisabled(row, column)) return;
    if (selected) this.commands.selectSingleRow(row);
    else this.commands.clearSingleRowSelection(row);
  }

  protected isSelectionDisabled(
    row: HellTableModelRow<TData>,
    column: HellTableColumn<TData> | undefined,
  ): boolean {
    const disabled = this.selectionConfig(column).disabled;
    return typeof disabled === 'function' ? disabled(row.original) : disabled === true;
  }

  protected selectionControlAriaLabel(
    row: HellTableModelRow<TData>,
    column: HellTableColumn<TData>,
  ): string {
    const label = this.selectionConfig(column).ariaLabel;
    if (typeof label === 'function') return label(row.original);
    if (typeof label === 'string' && label.trim().length) return label;
    return this.selectionMode(column) === 'radio' ? `Select ${row.key}` : `Select row ${row.key}`;
  }

  protected selectAllAriaLabel(column: HellTableColumn<TData> | undefined): string {
    const label = this.selectionConfig(column).selectAllAriaLabel;
    return label && label.trim().length ? label : 'Select visible rows';
  }

  protected selectionRadioName(column: HellTableColumn<TData>): string {
    return this.selectionConfig(column).radioName ?? `${this.selectionRadioGroupName}-${column.id}`;
  }

  private selectionConfig(
    column: HellTableColumn<TData> | undefined,
  ): HellTableSelectionColumnConfig<TData> {
    return column?.selection ?? {};
  }

  protected headerView(header: HellTableModelHeader<TData>): HellDataTableHeaderView<TData> {
    const context = {
      header,
      headerGroup:
        this.headerGroups().find((group) => group.headers.includes(header)) ??
        this.headerGroups()[0],
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

  protected rowEditorView(row: HellTableModelRow<TData>): HellDataTableRowEditorView<TData> | null {
    const slot = this.rowEditorSlot();
    const resolved = hellTableResolveRowEditorRenderer(
      this.renderRegistry(),
      slot.editorId,
      slot.editorColumn,
    );
    if (!resolved) return null;

    const context = this.draftController().editorContext(row, this.state, this.commands, {
      cancel: () => {
        this.draftController().cancel(row);
        this.commands.closeRow(row);
      },
    });
    return renderView(resolved, context);
  }
}

/** Standalone imports for the simple data-table renderer and projected slots. */
export const HELL_DATA_TABLE_DIRECTIVES = [
  HellDataTable,
  HellColumnVisibilityPanel,
  HellDataTableToolbarStart,
  HellDataTableToolbar,
  HellDataTableToolbarEnd,
  HellDataTableBulkActions,
  HellTableRowAction,
  HellTableSelectionCell,
  HellTableRowCheckbox,
  HellTableRowRadio,
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
    .filter(
      (entry): entry is { sort: HellTableSortingState; column: HellTableColumn<TData> } =>
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
  HellColumnVisibilityMenu,
  HellColumnVisibilityPanel,
  HellColumnVisibilitySelector,
  HellTableRowAction,
  HellTableRowCheckbox,
  HellTableMeasureRow,
  HellTableRowRadio,
  HellTableSelectionCell,
  HellRowDraftController,
  actionColumn,
  booleanColumn,
  hellColumns,
  hellComponentRenderer,
  hellTableColumnCanToggleVisibility,
  hellTableColumnIsVisible,
  hellTableColumnVisibilityMode,
  hellTableInitialColumnVisibility,
  hellTableRowPartsFromRows,
  hellTableVisibleColumns,
  hellTableVirtualRowPartKey,
  hellTableVirtualRowPartsFromRows,
  hellTemplateRenderer,
  selectColumn,
  selectionColumn,
  textColumn,
} from '../table/table';

export type {
  HellColumnDef,
  HellColumnKind,
  HellColumnMeta,
  HellRowDraftControllerOptions,
  HellRowDraftFactory,
  HellRowDraftFieldContext,
  HellRowDraftPatch,
  HellRowDraftSaveHandler,
  HellRowDraftSaveStatus,
  HellRowDraftSnapshot,
  HellRowDraftValidationErrors,
  HellRowDraftValidator,
  HellTableCellRenderContext,
  HellTableColumn,
  HellTableColumnId,
  HellColumnVisibilitySelectorPlacement,
  HellTableColumnVisibilityMode,
  HellTableColumnVisibilityState,
  HellTableEditFieldRenderContext,
  HellTableHeaderRenderContext,
  HellTableRenderer,
  HellTableMeasureRowCallback,
  HellTableRowEditorRenderContext,
  HellTableRowKey,
  HellTableRowMeasurement,
  HellTableRowMeasurementReason,
  HellTableRowPart,
  HellTableRowRenderContext,
  HellTableRowSelectionState,
  HellTableSelectedRowKeyState,
  HellTableSelectionColumnConfig,
  HellTableSortingState,
  HellTableRowPartsFromRowsOptions,
  HellTableVirtualRowPartsOptions,
  HellVirtualDataRowPart,
  HellVirtualDetailRowPart,
  HellVirtualEmptyRowPart,
  HellVirtualErrorRowPart,
  HellVirtualGroupRowPart,
  HellVirtualLoaderRowPart,
  HellVirtualRowEditorPart,
  HellVirtualRowGroup,
  HellVirtualRowPart,
  HellVirtualRowPartKind,
  HellVirtualRowPartKey,
  HellVirtualRowPartMatcher,
} from '../table/table';

export type {
  HellTableGridInteractionMode,
  HellTableSemantics,
} from '../features/table-utilities/table-utilities';
