import { HELL_LABELS } from '../../core/labels';
import { hellFloatingTargetNode } from '../../core/floating-scope';
import { HellStyleable } from '../../core/styleable';
import {
  HellResizePairInteractionController,
  hellResizePairAriaValue,
  type HellResizeDirection,
} from '../../core/resize-behavior';
import {
  HellTableColumnResizeRuntime,
  type HellTableColumnResizeEvent,
  type HellTableColumnResizePair as HellTableColumnResizeRuntimePair,
} from './data-table-column-resize.runtime';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

export type {
  HellTableColumnResizeEvent,
  HellTableColumnResizeSide,
} from './data-table-column-resize.runtime';

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

const HELL_TABLE_INTERACTIVE_TARGET_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  'summary',
  'label',
  '[contenteditable]:not([contenteditable="false"])',
  '[data-hell-row-ignore]',
  '[data-hell-table-ignore]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="option"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function hellEventFromInteractiveTarget(event: Event, host: HTMLElement): boolean {
  const target = hellAsElement(hellFloatingTargetNode(event.target));
  if (!target || target === host) return false;

  const interactive = target.closest(HELL_TABLE_INTERACTIVE_TARGET_SELECTOR);
  return !!interactive && interactive !== host && hostContains(host, interactive);
}

function hellAsElement(target: EventTarget | Node | null): Element | null {
  return target != null &&
    typeof target === 'object' &&
    (target as { nodeType?: number }).nodeType === 1 &&
    typeof (target as Element).matches === 'function' &&
    typeof (target as Element).closest === 'function'
    ? (target as Element)
    : null;
}

function hostContains(host: HTMLElement, node: Node): boolean {
  try {
    return host.contains(node);
  } catch {
    return false;
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
 * Marks a `<table>` for table utilities. Applies the host class with the
 * shared dense typography and border treatment, and switches the table to
 * a fixed layout so column resize CSS custom properties can be mapped by
 * the stylesheet. Pass `unstyled` to opt out of all class-based styling.
 */
@Directive({
  selector: 'table[hellTable]',
  host: {
    '[class.hell-table]': '!unstyled()',
    '[attr.data-content-width]': 'contentWidth() ? "true" : null',
  },
})
export class HellTable extends HellStyleable {
  readonly contentWidth = input(false, { transform: booleanAttribute });
}

/** Header-cell pair adjacent to a column resizer. */
export type HellTableColumnResizePair = HellTableColumnResizeRuntimePair<HellTableHeaderCell>;

/**
 * Header section. Tracks its child header cells so the Table Column Resize
 * Runtime can find the cell immediately to the right of the one being dragged
 * and resize them as a pair (sum of the two widths is conserved).
 */
@Directive({
  selector: 'thead[hellTableHead]',
  exportAs: 'hellTableHead',
  host: {
    '[class.hell-table-head]': '!unstyled()',
  },
})
export class HellTableHead extends HellStyleable {
  private readonly resizeRuntime = new HellTableColumnResizeRuntime();

  private readonly cells = new Set<HellTableHeaderCell>();

  register(c: HellTableHeaderCell) {
    this.cells.add(c);
  }
  unregister(c: HellTableHeaderCell) {
    this.cells.delete(c);
  }

  widthFor(columnId: string | null): number | null {
    return this.resizeRuntime.widthFor(columnId);
  }

  setColumnWidth(columnId: string, px: number): void {
    this.resizeRuntime.setWidth(columnId, px);
  }

  columnResizeEvent(
    pair: HellTableColumnResizePair,
    beforePx: number,
    afterPx: number,
  ): HellTableColumnResizeEvent | null {
    return this.resizeRuntime.transactionEvent(pair, beforePx, afterPx);
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
  selector: 'tbody[hellTableBody]',
  host: {
    '[class.hell-table-body]': '!unstyled()',
  },
})
export class HellTableBody extends HellStyleable {}

/**
 * Marks nested content as exempt from row activation. Use this on custom control
 * hosts that should keep their own keyboard and click behavior.
 */
@Directive({
  selector: '[data-hell-row-ignore], [hellTableRowIgnore]',
  host: {
    '[attr.data-hell-row-ignore]': '""',
  },
})
export class HellTableRowIgnore {}

/**
 * Behavioral row directive. Renders nothing of its own — consumers own
 * the `<tr>` markup and its children. Prefer real buttons or links inside
 * cells for row actions. Use Hell row activation only for an explicit
 * row-selection model, not as a generic clickable-row shortcut.
 *
 * - `[selected]` -> `data-selected="true"` for row highlight styles.
 * - `[selectable]` -> `tabindex="0"`, `aria-selected`, and click/Enter/Space
 *   binding that emits `(rowSelect)` for a row-selection model.
 * - `[interactive]` is the legacy alias; it only activates the row when
 *   `[selectionSemantics]` is also enabled.
 * - `[selectionSemantics]` defaults to `false` so action-only rows are not
 *   silently exposed as focusable generic table rows.
 * - Nested buttons, links, inputs, ARIA widgets, `[contenteditable]`, and
 *   `[data-hell-row-ignore]`/`[hellTableRowIgnore]` opt out so row selection
 *   does not double-activate.
 */
@Directive({
  selector: 'tr[hellTableRow]',
  exportAs: 'hellTableRow',
  host: {
    '[class.hell-table-row]': '!unstyled()',
    '[attr.data-selected]': 'selected() ? "true" : null',
    '[attr.data-interactive]': 'rowActivates() ? "true" : null',
    '[attr.aria-selected]': 'rowActivates() ? (selected() ? "true" : "false") : null',
    '[attr.tabindex]': 'rowActivates() ? "0" : null',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class HellTableRow extends HellStyleable {
  readonly selected = input(false, { transform: booleanAttribute });
  /** Preferred explicit row-selection activation API. Prefer cell buttons/links for row actions. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** @deprecated Use `selectable` for row selection or real buttons/links inside cells for actions. */
  readonly interactive = input(false, { transform: booleanAttribute });
  /** Legacy opt-in that lets `[interactive]` expose a selectable row. */
  readonly selectionSemantics = input(false, { transform: booleanAttribute });

  readonly rowSelect = output<MouseEvent | KeyboardEvent>();

  protected readonly rowActivates = computed(
    () => this.selectable() || (this.interactive() && this.selectionSemantics()),
  );

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  protected onClick(e: MouseEvent) {
    if (!this.rowActivates() || hellEventFromInteractiveTarget(e, this.host)) return;
    this.rowSelect.emit(e);
  }

  protected onKey(e: Event) {
    if (!this.rowActivates() || hellEventFromInteractiveTarget(e, this.host)) return;
    e.preventDefault();
    this.rowSelect.emit(e as KeyboardEvent);
  }
}

/**
 * Header cell directive. Owns optional sort state and acts as the parent
 * for `hellTableColumnResizer`. The directive does not sort — it surfaces the
 * current sort state through `data-sort` / `aria-sort` on the `<th>`, while a
 * nested `button[hellTableSortButton]` owns keyboard focus and activation.
 * Sorting logic stays with the consumer.
 *
 * Initial column sizing belongs to consumer CSS/Tailwind. During resize, the
 * Table Column Resize Runtime exposes `--hell-table-col-width` as a CSS custom
 * property; the stylesheet decides how that variable affects layout.
 */
@Directive({
  selector: 'th[hellTableHeaderCell]',
  exportAs: 'hellTableHeaderCell',
  host: {
    '[class.hell-table-header-cell]': '!unstyled()',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-column-id]': 'columnId()',
    '[attr.data-sort]': 'sort()',
    '[attr.data-sortable]': 'sortable() ? "true" : null',
    '[style.--hell-table-col-width]': 'widthVar()',
  },
})
export class HellTableHeaderCell extends HellStyleable implements OnDestroy {
  readonly sort = input<'asc' | 'desc' | null>(null);
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly columnId = input<string | null>(null);

  readonly sortToggle = output<MouseEvent | KeyboardEvent>();

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly head = inject(HellTableHead, { optional: true });

  protected readonly widthVar = computed(() => {
    const w = this.head?.widthFor(this.columnId()) ?? null;
    return w == null ? null : `${w}px`;
  });

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
  }

  ngOnDestroy() {
    this.head?.unregister(this);
  }

  toggleSortFrom(e: MouseEvent | KeyboardEvent): void {
    if (!this.sortable()) return;
    this.sortToggle.emit(e);
  }

  columnKey(): string | null {
    return this.columnId();
  }

  /** Called by `HellTableColumnResizer` while the user is dragging. */
  setLiveWidth(px: number) {
    const id = this.columnId();
    if (id) this.head?.setColumnWidth(id, px);
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
 * Sort button placed inside a sortable table header cell. The header keeps
 * `aria-sort`; the native button owns focus and activation per APG sortable
 * table guidance.
 */
@Directive({
  selector: 'button[hellTableSortButton]',
  exportAs: 'hellTableSortButton',
  host: {
    '[class.hell-table-sort-button]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[disabled]': 'disabled()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableSortButton extends HellStyleable {
  readonly sortToggle = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly header = inject(HellTableHeaderCell, { optional: true });

  protected nativeButtonType(): 'button' | null {
    return this.host.tagName.toLowerCase() === 'button' ? 'button' : null;
  }

  protected disabled(): boolean {
    return this.header ? !this.header.sortable() : false;
  }

  protected onClick(e: MouseEvent): void {
    if (this.disabled()) return;
    this.header?.toggleSortFrom(e);
    this.sortToggle.emit(e);
  }
}

/**
 * Body cell directive. Adds the host class and emits `(cellSelect)` on
 * click. Use the output if you need to react to a specific cell rather
 * than the whole row.
 */
@Directive({
  selector: 'td[hellTableCell]',
  host: {
    '[class.hell-table-cell]': '!unstyled()',
    '[attr.data-align]': 'align()',
    '[attr.data-space]': 'space()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableCell extends HellStyleable {
  readonly align = input<'start' | 'center' | 'end'>('start');
  readonly space = input<'normal' | 'empty'>('normal');
  readonly cellSelect = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  protected onClick(e: MouseEvent) {
    if (hellEventFromInteractiveTarget(e, this.host)) return;
    this.cellSelect.emit(e);
  }
}

/**
 * Resize grip placed inside `<th hellTableHeaderCell>` at the trailing
 * edge. Resizes the host cell and its right-hand neighbor as a pair so
 * the sum of their widths stays constant — the table never grows or
 * shrinks during a drag, the space is just redistributed.
 *
 * Note: `HellResizable` is intentionally not reused. That composite
 * relies on a flex container with flex children and a handle that lives
 * as a sibling between the panes. Table cells live inside a
 * `display: table` row, are sized by table-layout instead of flexbox,
 * and cannot be siblings of an arbitrary handle element. The semantics
 * line up but the layout machinery is incompatible.
 */
@Component({
  selector: '[hellTableColumnResizer]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-table-column-resizer]': '!unstyled()',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-label]': 'ariaLabel() ?? labels.tableUtilities?.resizeColumn ?? labels.dataTable.resizeColumn',
    '[attr.aria-controls]': 'ariaControlsValue()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[attr.tabindex]': 'isDisabled() ? -1 : 0',
    role: 'separator',
    'aria-orientation': 'vertical',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKey($event)',
  },
  template: '<span data-slot="grip" aria-hidden="true"></span>',
})
export class HellTableColumnResizer extends HellStyleable implements AfterViewInit, OnDestroy {
  readonly minWidth = input(40, { transform: numberAttribute });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaControls = input<string | readonly string[] | null>(null, {
    alias: 'aria-controls',
  });

  protected readonly ariaControlsValue = computed(() => hellAriaControlsValue(this.ariaControls()));

  readonly columnResize = output<HellTableColumnResizeEvent>();

  protected readonly dragging = signal(false);
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly cell = inject(HellTableHeaderCell);
  protected readonly labels = inject(HELL_LABELS);
  private readonly resizeInteraction = new HellResizePairInteractionController<HellTableHeaderCell>(
    {
      handle: this.host,
      ownerWindow: () => this.host.ownerDocument.defaultView,
      onActiveChange: (active) => this.dragging.set(active),
      onValueChange: (result) => this.ariaValueNow.set(result.ariaValueNow),
      onCommit: (result) => this.emitResize(result.a, result.b),
      orientation: () => 'horizontal',
      direction: () => hellElementDirection(this.host),
      stopPropagation: true,
      pair: () => this.adjacentPair(),
      itemAdapter: () => {
        const min = this.minWidth();
        return {
          measure: (cell) => cell.measure(),
          minSize: () => min,
          setSize: (cell, size) => cell.setLiveWidth(size),
          commitSize: (cell, size) => cell.commit(size),
        };
      },
    },
  );

  private adjacentPair(): HellTableColumnResizePair | null {
    const cell = this.cell;
    const next = cell.head?.nextSibling(cell) ?? null;
    if (!next || !cell.columnKey() || !next.columnKey()) return null;
    return { before: cell, after: next };
  }

  private emitResize(beforePx: number, afterPx: number): void {
    const pair = this.adjacentPair();
    if (!pair) return;
    const event = this.cell.head?.columnResizeEvent(pair, beforePx, afterPx);
    if (event) this.columnResize.emit(event);
  }

  protected isDisabled(): boolean {
    return this.adjacentPair() === null;
  }

  protected nativeButtonType(): 'button' | null {
    return this.host.tagName.toLowerCase() === 'button' ? 'button' : null;
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
    const pair = this.adjacentPair();
    if (!pair) {
      this.ariaValueNow.set(null);
      return;
    }

    this.ariaValueNow.set(
      hellResizePairAriaValue(
        pair.before.measure(),
        pair.after.measure(),
        this.minWidth(),
        this.minWidth(),
      ),
    );
  }

  ngOnDestroy(): void {
    this.resizeInteraction.destroy();
  }
}

/**
 * Standalone imports for the table utilities feature: container, table sections,
 * row/cell directives, sortable header cell, and column resizer.
 */
/** Preferred plural alias for the table utility directives. */
export const HELL_TABLE_UTILITIES_DIRECTIVES = [
  HellTableContainer,
  HellTable,
  HellTableHead,
  HellTableBody,
  HellTableRow,
  HellTableRowIgnore,
  HellTableHeaderCell,
  HellTableSortButton,
  HellTableCell,
  HellTableColumnResizer,
] as const;

/**
 * @deprecated Use `HELL_TABLE_UTILITIES_DIRECTIVES`.
 */
export const HELL_TABLE_UTILITY_DIRECTIVES = HELL_TABLE_UTILITIES_DIRECTIVES;

/**
 * @deprecated Use `HELL_TABLE_UTILITIES_DIRECTIVES`.
 * The entry point remains `@hell-ui/angular/features/data-table` for compatibility,
 * but the module is table utilities rather than a full data grid/data-source abstraction.
 */
export const HELL_TABLE_DIRECTIVES = HELL_TABLE_UTILITIES_DIRECTIVES;
