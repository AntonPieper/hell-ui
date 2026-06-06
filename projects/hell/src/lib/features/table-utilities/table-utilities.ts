import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';
import {
  HellResizePairInteractionController,
  hellResizePairAriaValue,
  type HellResizeDirection,
} from '../../core/resize-behavior';
import {
  hellTableResizeAdapterCanResize,
  hellTableResizeEvent,
  type HellTableResizeAdapter,
  type HellTableResizeEvent,
  type HellTableResizeItem,
} from './table-resize-adapter';
import {
  hellHostElementName,
  hellHostExplicitRole,
  hellTableInferredRoleForHost,
  type HellTableInferredRole,
} from './table-role-inference';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

export type {
  HellTableResizeAdapter,
  HellTableResizeEvent,
  HellTableResizeItem,
  HellTableResizeSide,
} from './table-resize-adapter';

function hellElementDirection(element: HTMLElement): HellResizeDirection {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr';
}

function hellAriaControlsValue(
  value: string | readonly string[] | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  const ids = value.map((id) => id.trim()).filter(Boolean);
  return ids.length ? ids.join(' ') : null;
}

function hellNullablePositiveIntegerAttribute(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function hellClampedIndex(value: number | null): number | null {
  return value !== null && Number.isInteger(value) && value > 0 ? value : null;
}

export type HellTableSemantics = 'table' | 'grid';

export type HellTableGridInteractionMode = 'row-selection' | 'cell-navigation' | 'editing';

const HELL_TABLE_GRID_INTERACTION_MODES = ['row-selection', 'cell-navigation', 'editing'] as const;

function hellTableGridInteractionModeValid(
  mode: string | null,
): mode is HellTableGridInteractionMode {
  return HELL_TABLE_GRID_INTERACTION_MODES.some((candidate) => candidate === mode);
}

const HELL_TABLE_GRID_CELL_WIDGET_SELECTOR = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
].join(',');

interface HellTableGridCellRegistration {
  readonly host: HTMLElement;
  gridCellId(): string;
  gridRowIndex(): number | null;
  gridColIndex(): number | null;
}

let nextGridCellId = 0;

const HELL_TABLE_ROOT_NATIVE_ELEMENTS = ['TABLE'] as const;
const HELL_TABLE_HEADER_NATIVE_ELEMENTS = ['THEAD'] as const;
const HELL_TABLE_BODY_NATIVE_ELEMENTS = ['TBODY'] as const;
const HELL_TABLE_ROW_NATIVE_ELEMENTS = ['TR'] as const;
const HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS = ['TH'] as const;
const HELL_TABLE_CELL_NATIVE_ELEMENTS = ['TD'] as const;

@Directive()
abstract class HellTableRoleDirective extends HellStyleable {
  private readonly roleHost = inject(ElementRef<unknown>).nativeElement;
  private readonly explicitRole = hellHostExplicitRole(this.roleHost);

  protected readonly nativeElementNames: readonly string[] = [];
  protected readonly inferredRole: HellTableInferredRole | null = null;

  protected role(): string | null {
    if (this.explicitRole !== null) return this.explicitRole;

    const gridRole = this.gridRole();
    if (gridRole !== null) return gridRole;

    if (this.inferredRole === null) return null;
    return hellTableInferredRoleForHost(
      this.roleHost,
      this.nativeElementNames,
      this.inferredRole,
      this.explicitRole,
    );
  }

  protected gridRole(): HellTableInferredRole | null {
    return null;
  }
}

/**
 * Optional shell for table utilities. Frames the table with the standard
 * elevated surface, border, radius, and overflow clipping. Place the
 * scroll container or the table directly inside.
 */
@Directive({
  selector: '[hellTableContainer]',
  host: {
    '[class.hell-table-container]': '!unstyled()',
    '[attr.data-loading]': 'busy() ? "true" : null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class HellTableContainer extends HellStyleable {
  readonly busy = input(false, { transform: booleanAttribute });
}

/**
 * Marks a table root host for table utilities. Applies the host class with the
 * shared dense typography and border treatment, and uses fixed table layout so
 * column resize CSS custom properties can be mapped by the stylesheet. Pass
 * `unstyled` to opt out of all class-based styling.
 */
@Directive({
  selector: '[hellTableRoot], table[hellTable]',
  exportAs: 'hellTableRoot',
  host: {
    '[class.hell-table]': '!unstyled()',
    '[attr.data-hell-table-root]': '""',
    '[attr.data-content-width]': 'contentWidth() ? "true" : null',
    '[attr.role]': 'role()',
    '[attr.tabindex]': 'gridTabIndex()',
    '[attr.aria-rowcount]': 'gridRowCount()',
    '[attr.aria-colcount]': 'gridColCount()',
    '[attr.aria-activedescendant]': 'gridActiveDescendant()',
    '(keydown)': 'onGridKeydown($event)',
  },
})
export class HellTable extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_ROOT_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'table';

  readonly contentWidth = input(false, { transform: booleanAttribute });
  readonly semantics = input<HellTableSemantics>('table');
  readonly interactionMode = input<HellTableGridInteractionMode | null>(null);
  readonly rowCount = input<number | null>(null, { transform: hellNullablePositiveIntegerAttribute });
  readonly colCount = input<number | null>(null, { transform: hellNullablePositiveIntegerAttribute });

  private readonly registeredRows = signal<readonly HellTableRow[]>([]);
  private readonly registeredCells = signal<readonly HellTableGridCellRegistration[]>([]);
  private readonly activeGridCell = signal({ rowIndex: 1, colIndex: 1 });

  constructor() {
    super();
    effect(() => this.assertGridInteractionMode());
  }

  isGridMode(): boolean {
    return this.semantics() === 'grid' && hellTableGridInteractionModeValid(this.interactionMode());
  }

  registerRow(row: HellTableRow): void {
    this.registeredRows.update((rows) => (rows.includes(row) ? rows : [...rows, row]));
  }

  unregisterRow(row: HellTableRow): void {
    this.registeredRows.update((rows) => rows.filter((candidate) => candidate !== row));
  }

  registerCell(cell: HellTableGridCellRegistration): void {
    this.registeredCells.update((cells) => (cells.includes(cell) ? cells : [...cells, cell]));
  }

  unregisterCell(cell: HellTableGridCellRegistration): void {
    this.registeredCells.update((cells) => cells.filter((candidate) => candidate !== cell));
  }

  rowIndexFor(row: HellTableRow): number | null {
    return this.indexFor(this.registeredRows(), row);
  }

  colIndexFor(cell: HellTableGridCellRegistration): number | null {
    const rowIndex = cell.gridRowIndex();
    if (rowIndex === null) return this.indexFor(this.registeredCells(), cell);
    const rowCells = this.registeredCells().filter((candidate) => candidate.gridRowIndex() === rowIndex);
    return this.indexFor(rowCells, cell);
  }

  protected override gridRole(): HellTableInferredRole | null {
    return this.isGridMode() ? 'grid' : null;
  }

  protected gridTabIndex(): 0 | null {
    return this.isGridMode() ? 0 : null;
  }

  protected gridRowCount(): number | null {
    if (!this.isGridMode()) return null;
    return this.rowCount() ?? (this.registeredRows().length || null);
  }

  protected gridColCount(): number | null {
    if (!this.isGridMode()) return null;
    return this.colCount() ?? this.inferredColCount();
  }

  protected gridActiveDescendant(): string | null {
    if (!this.isGridMode()) return null;
    return this.activeCell()?.gridCellId() ?? this.firstCell()?.gridCellId() ?? null;
  }

  protected onGridKeydown(event: KeyboardEvent): void {
    if (!this.isGridMode()) return;
    const current = this.activeCell() ?? this.firstCell();
    if (!current) return;

    const rowIndex = current.gridRowIndex() ?? 1;
    const colIndex = current.gridColIndex() ?? 1;
    let nextRow = rowIndex;
    let nextCol = colIndex;

    switch (event.key) {
      case 'ArrowRight':
        nextCol += 1;
        break;
      case 'ArrowLeft':
        nextCol -= 1;
        break;
      case 'ArrowDown':
        nextRow += 1;
        break;
      case 'ArrowUp':
        nextRow -= 1;
        break;
      case 'Home':
        nextCol = 1;
        break;
      case 'End':
        nextCol = this.gridColCount() ?? colIndex;
        break;
      case 'Enter':
      case ' ':
        if (this.activateCurrentGridCellWidget(event.key)) event.preventDefault();
        return;
      case 'F2':
        if (this.focusCurrentGridCellWidget()) event.preventDefault();
        return;
      default:
        return;
    }

    if (this.activateGridCell(nextRow, nextCol)) event.preventDefault();
  }

  private assertGridInteractionMode(): void {
    if (this.semantics() !== 'grid') return;
    if (hellTableGridInteractionModeValid(this.interactionMode())) return;
    throw new Error(
      'HellTable semantics="grid" requires interactionMode="row-selection", "cell-navigation", or "editing".',
    );
  }

  private indexFor<T>(items: readonly T[], item: T): number | null {
    const index = items.indexOf(item);
    return index >= 0 ? index + 1 : null;
  }

  private inferredColCount(): number | null {
    const indexes = this.registeredCells()
      .map((cell) => cell.gridColIndex())
      .filter((index): index is number => index !== null);
    return indexes.length ? Math.max(...indexes) : null;
  }

  private firstCell(): HellTableGridCellRegistration | null {
    return this.registeredCells()[0] ?? null;
  }

  private activeCell(): HellTableGridCellRegistration | null {
    const active = this.activeGridCell();
    return (
      this.registeredCells().find(
        (cell) => cell.gridRowIndex() === active.rowIndex && cell.gridColIndex() === active.colIndex,
      ) ?? null
    );
  }

  private activateCurrentGridCellWidget(key: string): boolean {
    if (this.interactionMode() === 'editing' && key === 'Enter') return this.focusCurrentGridCellWidget();
    const widget = this.currentGridCellWidget();
    if (!widget) return false;
    widget.click();
    return true;
  }

  private focusCurrentGridCellWidget(): boolean {
    const widget = this.currentGridCellWidget();
    if (!widget) return false;
    widget.focus();
    return true;
  }

  private currentGridCellWidget(): HTMLElement | null {
    const cell = this.activeCell() ?? this.firstCell();
    return cell?.host.querySelector<HTMLElement>(HELL_TABLE_GRID_CELL_WIDGET_SELECTOR) ?? null;
  }

  private activateGridCell(rowIndex: number, colIndex: number): boolean {
    const rowCount = this.gridRowCount() ?? rowIndex;
    const colCount = this.gridColCount() ?? colIndex;
    const nextRow = Math.min(Math.max(rowIndex, 1), rowCount);
    const nextCol = Math.min(Math.max(colIndex, 1), colCount);
    const nextCell = this.cellAt(nextRow, nextCol) ?? this.cellInRow(nextRow) ?? this.activeCell();
    if (!nextCell) return false;
    const resolvedRow = nextCell.gridRowIndex() ?? nextRow;
    const resolvedCol = nextCell.gridColIndex() ?? nextCol;
    this.activeGridCell.set({ rowIndex: resolvedRow, colIndex: resolvedCol });
    return true;
  }

  private cellAt(rowIndex: number, colIndex: number): HellTableGridCellRegistration | null {
    return (
      this.registeredCells().find(
        (cell) => cell.gridRowIndex() === rowIndex && cell.gridColIndex() === colIndex,
      ) ?? null
    );
  }

  private cellInRow(rowIndex: number): HellTableGridCellRegistration | null {
    return this.registeredCells().find((cell) => cell.gridRowIndex() === rowIndex) ?? null;
  }
}

/**
 * Header section. Tracks child header cells only so the default table resize
 * handle can discover its adjacent neighbor. Sizing state stays behind the
 * handle adapter instead of living on the primitive header section.
 */
@Directive({
  selector: '[hellTableHeader], thead[hellTableHead]',
  exportAs: 'hellTableHeader, hellTableHead',
  host: {
    '[class.hell-table-head]': '!unstyled()',
    '[attr.data-hell-table-header]': '""',
    '[attr.role]': 'role()',
  },
})
export class HellTableHead extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_HEADER_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'rowgroup';

  private readonly table = inject(HellTable, { optional: true, skipSelf: true });
  private readonly cells = new Set<HellTableHeaderCell>();

  protected override gridRole(): HellTableInferredRole | null {
    return this.table?.isGridMode() ? 'rowgroup' : null;
  }

  register(c: HellTableHeaderCell) {
    this.cells.add(c);
  }
  unregister(c: HellTableHeaderCell) {
    this.cells.delete(c);
  }

  /** Find the cell immediately following `cell` within the same row. */
  nextSibling(cell: HellTableHeaderCell): HellTableHeaderCell | null {
    const sib = cell.host.nextElementSibling;
    if (!sib) return null;
    for (const c of this.cells) if (c.host === sib) return c;
    return null;
  }
}

@Directive({
  selector: '[hellTableBody]',
  host: {
    '[class.hell-table-body]': '!unstyled()',
    '[attr.data-hell-table-body]': '""',
    '[attr.role]': 'role()',
  },
})
export class HellTableBody extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_BODY_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'rowgroup';

  private readonly table = inject(HellTable, { optional: true, skipSelf: true });

  protected override gridRole(): HellTableInferredRole | null {
    return this.table?.isGridMode() ? 'rowgroup' : null;
  }
}

/**
 * Compatibility marker for custom row content that wants a stable data hook.
 * Hell rows no longer use it for activation because rows are static in native
 * table mode.
 */
@Directive({
  selector: '[data-hell-row-ignore], [hellTableRowIgnore]',
  host: {
    '[attr.data-hell-row-ignore]': '""',
  },
})
export class HellTableRowIgnore {}

/**
 * Visual row state only. Native table rows stay static: no tabindex,
 * aria-selected, click, or keydown handlers are installed by this directive.
 *
 * - `[active]` -> `data-active="true"` for a master/detail or editor row.
 * - `[selected]` -> `data-selected="true"` for a bulk-selection highlight.
 *
 * Use `button[hellTableRowAction]`, `a[hellTableRowAction]`,
 * `input[hellTableRowCheckbox]`, or `input[hellTableRowRadio]` inside cells
 * for built-in row interactions.
 */
@Directive({
  selector: '[hellTableRow]',
  exportAs: 'hellTableRow',
  host: {
    '[class.hell-table-row]': '!unstyled()',
    '[attr.data-hell-table-row]': '""',
    '[attr.data-active]': 'active() ? "true" : null',
    '[attr.data-selected]': 'selected() ? "true" : null',
    '[attr.role]': 'role()',
    '[attr.aria-rowindex]': 'gridRowIndex()',
    '[attr.aria-selected]': 'gridSelected()',
  },
})
export class HellTableRow extends HellTableRoleDirective implements OnDestroy {
  protected override readonly nativeElementNames = HELL_TABLE_ROW_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'row';

  readonly active = input(false, { transform: booleanAttribute });
  readonly selected = input(false, { transform: booleanAttribute });
  readonly rowIndex = input<number | null>(null, { transform: hellNullablePositiveIntegerAttribute });

  private readonly table = inject(HellTable, { optional: true, skipSelf: true });
  private readonly cells = signal<readonly HellTableGridCellRegistration[]>([]);

  constructor() {
    super();
    this.table?.registerRow(this);
  }

  registerCell(cell: HellTableGridCellRegistration): void {
    this.cells.update((cells) => (cells.includes(cell) ? cells : [...cells, cell]));
  }

  unregisterCell(cell: HellTableGridCellRegistration): void {
    this.cells.update((cells) => cells.filter((candidate) => candidate !== cell));
  }

  colIndexFor(cell: HellTableGridCellRegistration): number | null {
    const index = this.cells().indexOf(cell);
    return index >= 0 ? index + 1 : null;
  }

  protected override gridRole(): HellTableInferredRole | null {
    return this.table?.isGridMode() ? 'row' : null;
  }

  gridRowIndex(): number | null {
    if (!this.table?.isGridMode()) return null;
    return hellClampedIndex(this.rowIndex()) ?? this.table.rowIndexFor(this);
  }

  protected gridSelected(): 'true' | 'false' | null {
    if (!this.table?.isGridMode()) return null;
    return this.selected() ? 'true' : 'false';
  }

  ngOnDestroy(): void {
    this.table?.unregisterRow(this);
  }
}

/**
 * Native row action. The host button or link owns focus, click, and keyboard
 * activation; Hell adds only table-specific styling hooks.
 */
@Directive({
  selector: 'button[hellTableRowAction], a[hellTableRowAction]',
  exportAs: 'hellTableRowAction',
  host: {
    '[class.hell-table-row-action]': '!unstyled()',
    '[attr.data-hell-table-row-action]': '""',
    '[attr.type]': 'nativeButtonType()',
    '[attr.tabindex]': 'gridTabIndex()',
  },
})
export class HellTableRowAction extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });

  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
  }

  protected gridTabIndex(): -1 | null {
    return this.table?.isGridMode() ? -1 : null;
  }
}

/**
 * Marks the narrow cell that contains row checkbox/radio controls. Combine it
 * with `hellTableCell` or `hellTableHeaderCell` so table semantics stay native.
 */
@Directive({
  selector: '[hellTableSelectionCell]',
  exportAs: 'hellTableSelectionCell',
  host: {
    '[class.hell-table-selection-cell]': '!unstyled()',
    '[attr.data-hell-table-selection-cell]': '""',
  },
})
export class HellTableSelectionCell extends HellStyleable {}

/** Native checkbox for row-selection columns. */
@Directive({
  selector: 'input[type="checkbox"][hellTableRowCheckbox]',
  exportAs: 'hellTableRowCheckbox',
  host: {
    '[class.hell-table-row-checkbox]': '!unstyled()',
    '[attr.data-hell-table-row-checkbox]': '""',
    '[attr.type]': '"checkbox"',
    '[attr.data-indeterminate]': 'indeterminate() ? "true" : null',
    '[attr.tabindex]': 'gridTabIndex()',
    '(change)': 'onChange()',
  },
})
export class HellTableRowCheckbox extends HellStyleable {
  readonly indeterminate = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>).nativeElement;
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });

  constructor() {
    super();
    effect(() => {
      this.host.indeterminate = this.indeterminate();
    });
  }

  protected onChange(): void {
    this.checkedChange.emit(this.host.checked);
    this.indeterminateChange.emit(this.host.indeterminate);
  }

  protected gridTabIndex(): -1 | null {
    return this.table?.isGridMode() ? -1 : null;
  }
}

/** Native radio for single row-selection columns. */
@Directive({
  selector: 'input[type="radio"][hellTableRowRadio]',
  exportAs: 'hellTableRowRadio',
  host: {
    '[class.hell-table-row-radio]': '!unstyled()',
    '[attr.data-hell-table-row-radio]': '""',
    '[attr.type]': '"radio"',
    '[attr.tabindex]': 'gridTabIndex()',
    '(change)': 'onChange()',
  },
})
export class HellTableRowRadio extends HellStyleable {
  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>).nativeElement;
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });

  protected onChange(): void {
    this.checkedChange.emit(this.host.checked);
  }

  protected gridTabIndex(): -1 | null {
    return this.table?.isGridMode() ? -1 : null;
  }
}

/**
 * Header cell directive. Owns optional sort state and can provide the default
 * adjacent item for `hellTableResizeHandle`. The directive does not sort — it
 * surfaces the current sort state through `data-sort` / `aria-sort` on the
 * header-cell host, while a nested `button[hellTableSortTrigger]` owns keyboard
 * focus and activation. Sorting logic stays with the consumer.
 *
 * Initial column sizing belongs to consumer CSS/Tailwind. The default resize
 * adapter writes `--hell-table-col-width` on the affected cells, while custom
 * adapters may own sizing through TanStack, CDK, or simple table state instead.
 */
@Directive({
  selector: '[hellTableHeaderCell]',
  exportAs: 'hellTableHeaderCell',
  host: {
    '[class.hell-table-header-cell]': '!unstyled()',
    '[attr.data-hell-table-header-cell]': '""',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-column-id]': 'columnId()',
    '[attr.data-sort]': 'sort()',
    '[attr.data-sortable]': 'sortable() ? "true" : null',
    '[attr.role]': 'role()',
    '[attr.aria-colindex]': 'gridColIndex()',
  },
})
export class HellTableHeaderCell extends HellTableRoleDirective implements HellTableGridCellRegistration, OnDestroy {
  protected override readonly nativeElementNames = HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'columnheader';

  readonly sort = input<'asc' | 'desc' | null>(null);
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly columnId = input<string | null>(null);
  readonly colIndex = input<number | null>(null, { transform: hellNullablePositiveIntegerAttribute });

  readonly sortToggle = output<MouseEvent | KeyboardEvent>();

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly head = inject(HellTableHead, { optional: true });
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });
  private readonly row = inject(HellTableRow, { optional: true, skipSelf: true });
  private readonly generatedGridCellId = `hell-table-grid-cell-${nextGridCellId++}`;

  protected readonly ariaSort = computed<'ascending' | 'descending' | null>(() => {
    if (!this.sortable()) return null;
    const s = this.sort();
    if (s === 'asc') return 'ascending';
    if (s === 'desc') return 'descending';
    return null;
  });

  constructor() {
    super();
    this.head?.register(this);
    this.table?.registerCell(this);
    this.row?.registerCell(this);
    effect(() => this.syncGeneratedGridCellId());
  }

  gridCellId(): string {
    return this.host.id || this.generatedGridCellId;
  }

  protected override gridRole(): HellTableInferredRole | null {
    return this.table?.isGridMode() ? 'columnheader' : null;
  }

  gridRowIndex(): number | null {
    return this.table?.isGridMode() ? (this.row?.gridRowIndex() ?? null) : null;
  }

  gridColIndex(): number | null {
    if (!this.table?.isGridMode()) return null;
    return hellClampedIndex(this.colIndex()) ?? this.row?.colIndexFor(this) ?? this.table.colIndexFor(this);
  }

  private syncGeneratedGridCellId(): void {
    if (!this.table?.isGridMode()) {
      if (this.host.id === this.generatedGridCellId) this.host.removeAttribute('id');
      return;
    }
    if (!this.host.id) this.host.id = this.generatedGridCellId;
  }

  ngOnDestroy() {
    this.head?.unregister(this);
    this.table?.unregisterCell(this);
    this.row?.unregisterCell(this);
  }

  toggleSortFrom(e: MouseEvent | KeyboardEvent): void {
    if (!this.sortable()) return;
    this.sortToggle.emit(e);
  }

  /** Default DOM-backed resize item used when the handle does not receive an adapter input. */
  resizeItem(minSize: number): HellTableResizeItem | null {
    const columnId = this.columnId();
    if (!columnId) return null;
    return {
      columnId,
      ariaControls: this.host.id || null,
      measure: () => this.measure(),
      minSize: () => minSize,
      setSize: (px) => this.setLiveWidth(px),
      commitSize: (px) => this.commit(px),
    };
  }

  /** Called by the default resize adapter while the user is dragging. */
  setLiveWidth(px: number) {
    this.host.style.setProperty('--hell-table-col-width', `${px}px`);
  }

  /** Current measured width — used as the drag start anchor. */
  measure(): number {
    return this.host.getBoundingClientRect().width;
  }

  /** Final commit after pointerup or key step. */
  commit(px: number) {
    this.setLiveWidth(px);
  }
}

/**
 * Sort trigger placed inside a sortable table header cell. The header keeps
 * `aria-sort`; the native button owns focus and activation per APG sortable
 * table guidance. The selector intentionally accepts only native button hosts.
 */
@Directive({
  selector: 'button[hellTableSortTrigger]',
  exportAs: 'hellTableSortTrigger',
  host: {
    '[class.hell-table-sort-trigger]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.tabindex]': 'gridTabIndex()',
    '[disabled]': 'disabled()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableSortTrigger extends HellStyleable {
  readonly sortToggle = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly header = inject(HellTableHeaderCell, { optional: true });
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });

  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
  }

  protected disabled(): boolean {
    return this.header ? !this.header.sortable() : false;
  }

  protected gridTabIndex(): -1 | null {
    return this.table?.isGridMode() ? -1 : null;
  }

  protected onClick(e: MouseEvent): void {
    if (this.disabled()) return;
    this.header?.toggleSortFrom(e);
    this.sortToggle.emit(e);
  }
}

/**
 * Body/data cell directive. Adds the host class and optional alignment/empty
 * state hooks. Cells stay passive; use a nested row action or selection control
 * for interaction.
 */
@Directive({
  selector: '[hellTableCell]',
  host: {
    '[class.hell-table-cell]': '!unstyled()',
    '[attr.data-hell-table-cell]': '""',
    '[attr.data-align]': 'align()',
    '[attr.data-space]': 'space()',
    '[attr.role]': 'role()',
    '[attr.aria-colindex]': 'gridColIndex()',
  },
})
export class HellTableCell extends HellTableRoleDirective implements HellTableGridCellRegistration, OnDestroy {
  protected override readonly nativeElementNames = HELL_TABLE_CELL_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'cell';

  readonly align = input<'start' | 'center' | 'end'>('start');
  readonly space = input<'normal' | 'empty'>('normal');
  readonly colIndex = input<number | null>(null, { transform: hellNullablePositiveIntegerAttribute });

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });
  private readonly row = inject(HellTableRow, { optional: true, skipSelf: true });
  private readonly generatedGridCellId = `hell-table-grid-cell-${nextGridCellId++}`;

  constructor() {
    super();
    this.table?.registerCell(this);
    this.row?.registerCell(this);
    effect(() => this.syncGeneratedGridCellId());
  }

  gridCellId(): string {
    return this.host.id || this.generatedGridCellId;
  }

  protected override gridRole(): HellTableInferredRole | null {
    return this.table?.isGridMode() ? 'gridcell' : null;
  }

  gridRowIndex(): number | null {
    return this.table?.isGridMode() ? (this.row?.gridRowIndex() ?? null) : null;
  }

  gridColIndex(): number | null {
    if (!this.table?.isGridMode()) return null;
    return hellClampedIndex(this.colIndex()) ?? this.row?.colIndexFor(this) ?? this.table.colIndexFor(this);
  }

  private syncGeneratedGridCellId(): void {
    if (!this.table?.isGridMode()) {
      if (this.host.id === this.generatedGridCellId) this.host.removeAttribute('id');
      return;
    }
    if (!this.host.id) this.host.id = this.generatedGridCellId;
  }

  ngOnDestroy(): void {
    this.table?.unregisterCell(this);
    this.row?.unregisterCell(this);
  }
}

/**
 * Resize handle placed inside a table header or adapter-rendered header edge.
 * The handle owns separator pointer/keyboard semantics only; sizing storage is
 * delegated to a narrow `HellTableResizeAdapter` so simple, TanStack, and CDK
 * table layers can own their own column sizing state.
 *
 * Note: `HellResizable` is intentionally not reused. That composite relies on
 * sibling flex panes. Table headers and adapter renderers need adjacent item
 * adapters instead of flex-pane DOM assumptions.
 */
@Component({
  selector: '[hellTableResizeHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-table-resize-handle]': '!unstyled()',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-label]': 'isDisabled() && nativeButtonType() === null ? null : (ariaLabel() ?? labels.tableUtilities?.resizeColumn ?? labels.dataTable.resizeColumn)',
    '[attr.aria-controls]': 'isDisabled() ? null : ariaControlsValue()',
    '[attr.aria-valuemin]': 'isDisabled() ? null : 0',
    '[attr.aria-valuemax]': 'isDisabled() ? null : 100',
    '[attr.aria-valuenow]': 'isDisabled() ? null : ariaValueNow()',
    '[attr.aria-disabled]': 'isDisabled() && nativeButtonType() !== null ? "true" : null',
    '[attr.tabindex]': 'resizeTabIndex()',
    '[attr.role]': 'isDisabled() ? null : "separator"',
    '[attr.aria-orientation]': 'isDisabled() ? null : "vertical"',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKey($event)',
  },
  template: '<span data-slot="grip" aria-hidden="true"></span>',
})
export class HellTableResizeHandle extends HellStyleable implements AfterViewInit, OnDestroy {
  readonly minWidth = input(40, { transform: numberAttribute });
  readonly resizeAdapter = input<HellTableResizeAdapter | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaControls = input<string | readonly string[] | null>(null, {
    alias: 'aria-controls',
  });

  protected readonly ariaControlsValue = computed(() =>
    hellAriaControlsValue(this.ariaControls() ?? this.adapterAriaControls()),
  );

  readonly resizeCommit = output<HellTableResizeEvent>();

  protected readonly dragging = signal(false);
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly cell = inject(HellTableHeaderCell, { optional: true });
  private readonly table = inject(HellTable, { optional: true, skipSelf: true });
  protected readonly labels = inject(HELL_LABELS);
  private readonly resizeInteraction = new HellResizePairInteractionController<HellTableResizeItem>({
    handle: this.host,
    ownerWindow: () => this.host.ownerDocument.defaultView,
    onActiveChange: (active) => this.dragging.set(active),
    onValueChange: (result) => this.ariaValueNow.set(result.ariaValueNow),
    onCommit: (result) => this.emitResize(result.a, result.b),
    orientation: () => 'horizontal',
    direction: () => hellElementDirection(this.host),
    stopPropagation: true,
    pair: () => this.resizePair(),
    itemAdapter: () => ({
      measure: (item) => item.measure(),
      minSize: (item) => this.itemMinSize(item),
      setSize: (item, size) => item.setSize(size),
      commitSize: (item, size) => {
        if (item.commitSize) item.commitSize(size);
        else item.setSize(size);
      },
    }),
  });

  private resizePair(): HellTableResizeAdapter | null {
    return this.providedPair() ?? this.defaultHeaderPair();
  }

  private providedPair(): HellTableResizeAdapter | null {
    const adapter = this.resizeAdapter();
    return hellTableResizeAdapterCanResize(adapter) ? adapter : null;
  }

  private defaultHeaderPair(): HellTableResizeAdapter | null {
    const beforeCell = this.cell;
    const afterCell = beforeCell?.head?.nextSibling(beforeCell) ?? null;
    if (!beforeCell || !afterCell) return null;

    const min = this.minWidth();
    const before = beforeCell.resizeItem(min);
    const after = afterCell.resizeItem(min);
    const adapter = before && after ? { before, after } : null;
    return hellTableResizeAdapterCanResize(adapter) ? adapter : null;
  }

  private emitResize(beforePx: number, afterPx: number): void {
    const pair = this.resizePair();
    if (!pair) return;
    this.resizeCommit.emit(hellTableResizeEvent(pair, beforePx, afterPx));
  }

  protected isDisabled(): boolean {
    return this.resizePair() === null;
  }

  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
  }

  protected resizeTabIndex(): -1 | 0 {
    if (this.table?.isGridMode()) return -1;
    return this.isDisabled() ? -1 : 0;
  }

  ngAfterViewInit(): void {
    this.refreshAriaValueNow();
  }

  protected onPointerDown(e: PointerEvent) {
    if (this.isDisabled()) return;
    this.refreshAriaValueNow();
    this.resizeInteraction.startPointer(e);
  }

  protected onKey(e: KeyboardEvent) {
    if (this.isDisabled()) return;
    this.refreshAriaValueNow();
    this.resizeInteraction.applyKey(e);
  }

  private refreshAriaValueNow(): void {
    const pair = this.resizePair();
    if (!pair) {
      this.ariaValueNow.set(null);
      return;
    }

    this.ariaValueNow.set(
      hellResizePairAriaValue(
        pair.before.measure(),
        pair.after.measure(),
        this.itemMinSize(pair.before),
        this.itemMinSize(pair.after),
      ),
    );
  }

  private itemMinSize(item: HellTableResizeItem): number {
    return item.minSize?.() ?? this.minWidth();
  }

  private adapterAriaControls(): readonly string[] | null {
    const pair = this.resizePair();
    if (!pair) return null;
    const ids: string[] = [];
    this.collectAriaControls(pair.before.ariaControls, ids);
    this.collectAriaControls(pair.after.ariaControls, ids);
    return ids.length ? ids : null;
  }

  private collectAriaControls(
    value: string | readonly string[] | null | undefined,
    ids: string[],
  ): void {
    if (!value) return;
    if (typeof value === 'string') ids.push(value);
    else ids.push(...value);
  }

  ngOnDestroy(): void {
    this.resizeInteraction.destroy();
  }
}

export { HellTable as HellTableRoot, HellTableHead as HellTableHeader };

/**
 * Standalone imports for the table utilities feature: container, table sections,
 * row/cell directives, row action/selection controls, sortable header cell, and
 * resize handle.
 */
/** Preferred plural alias for the table utility directives. */
export const HELL_TABLE_UTILITIES_DIRECTIVES = [
  HellTableContainer,
  HellTable,
  HellTableHead,
  HellTableBody,
  HellTableRow,
  HellTableRowIgnore,
  HellTableRowAction,
  HellTableSelectionCell,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableHeaderCell,
  HellTableSortTrigger,
  HellTableCell,
  HellTableResizeHandle,
] as const;
