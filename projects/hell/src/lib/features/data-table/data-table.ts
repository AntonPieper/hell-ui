import { HellStyleable } from '../../core/styleable';
import { HellResizePairInteractionController } from '../../core/resize-behavior';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

/**
 * Optional shell for a data table. Frames the table with the standard
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
 * Marks a `<table>` as a hell data table. Applies the host class with the
 * shared dense typography and border treatment, and switches the table to
 * a fixed layout so column widths from `[width]` on header cells are
 * honored. Pass `unstyled` to opt out of all class-based styling.
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

/**
 * Header section. Tracks its child header cells so the column resizer
 * can find the cell immediately to the right of the one being dragged
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
  private readonly cells = new Set<HellTableHeaderCell>();

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
  selector: 'tbody[hellTableBody]',
  host: {
    '[class.hell-table-body]': '!unstyled()',
  },
})
export class HellTableBody extends HellStyleable {}

/**
 * Behavioral row directive. Renders nothing of its own — consumers own
 * the `<tr>` markup and its children. Provides:
 *
 * - `[selected]` -> `data-selected="true"` and `aria-selected="true"`,
 *   so consumers can highlight via CSS attribute selectors.
 * - `[interactive]` -> `tabindex="0"` and click/Enter/Space binding
 *   that emits `(rowSelect)`. Use this to drive selection from the row
 *   without writing your own click handler on every cell.
 */
@Directive({
  selector: 'tr[hellTableRow]',
  exportAs: 'hellTableRow',
  host: {
    '[class.hell-table-row]': '!unstyled()',
    '[attr.data-selected]': 'selected() ? "true" : null',
    '[attr.data-interactive]': 'interactive() ? "true" : null',
    '[attr.aria-selected]': 'interactive() ? (selected() ? "true" : "false") : null',
    '[attr.tabindex]': 'interactive() ? "0" : null',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class HellTableRow extends HellStyleable {
  readonly selected = input(false, { transform: booleanAttribute });
  readonly interactive = input(false, { transform: booleanAttribute });

  readonly rowSelect = output<MouseEvent | KeyboardEvent>();

  protected onClick(e: MouseEvent) {
    if (!this.interactive()) return;
    this.rowSelect.emit(e);
  }

  protected onKey(e: Event) {
    if (!this.interactive()) return;
    e.preventDefault();
    this.rowSelect.emit(e as KeyboardEvent);
  }
}

/**
 * Header cell directive. Owns optional sort affordance, optional column
 * width, and acts as the parent for `hellTableColumnResizer`. The
 * directive does not sort — it surfaces the current sort state through
 * `data-sort` / `aria-sort` and emits `(sortToggle)` when the cell is
 * activated. Sorting logic stays with the consumer.
 *
 * Column width is applied through the `--hell-table-col-width` custom
 * property; the stylesheet maps that to the cell's `width`. Avoiding a
 * direct width style binding keeps the surface area limited to CSS
 * variables, which makes overrides composable with the rest of the
 * theme tokens.
 */
@Directive({
  selector: 'th[hellTableHeaderCell]',
  exportAs: 'hellTableHeaderCell',
  host: {
    '[class.hell-table-header-cell]': '!unstyled()',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-sort]': 'sort()',
    '[attr.data-sortable]': 'sortable() ? "true" : null',
    '[attr.tabindex]': 'sortable() ? "0" : null',
    '[style.--hell-table-col-width]': 'widthVar()',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class HellTableHeaderCell extends HellStyleable {
  readonly sort = input<'asc' | 'desc' | null>(null);
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly width = input<number | null>(null);

  readonly sortToggle = output<MouseEvent | KeyboardEvent>();
  readonly widthChange = output<number>();

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly head = inject(HellTableHead, { optional: true });

  private readonly _liveWidth = signal<number | null>(null);

  protected readonly effectiveWidth = computed(() => this._liveWidth() ?? this.width());

  protected readonly widthVar = computed(() => {
    const w = this.effectiveWidth();
    return w == null ? null : `${w}px`;
  });

  protected readonly ariaSort = computed<'ascending' | 'descending' | 'none' | null>(() => {
    if (!this.sortable()) return null;
    const s = this.sort();
    if (s === 'asc') return 'ascending';
    if (s === 'desc') return 'descending';
    return 'none';
  });

  constructor() {
    super();
    this.head?.register(this);
  }

  ngOnDestroy() {
    this.head?.unregister(this);
  }

  protected onClick(e: MouseEvent) {
    if (!this.sortable()) return;
    if ((e.target as HTMLElement).closest('[hellTableColumnResizer]')) return;
    this.sortToggle.emit(e);
  }

  protected onKey(e: Event) {
    if (!this.sortable()) return;
    e.preventDefault();
    this.sortToggle.emit(e as KeyboardEvent);
  }

  /** Called by `HellTableColumnResizer` while the user is dragging. */
  setLiveWidth(px: number) {
    this._liveWidth.set(px);
    this.writeWidthVar(px);
  }

  /** Current measured width — used as the drag start anchor. */
  measure(): number {
    return this.host.getBoundingClientRect().width;
  }

  /** Final commit after pointerup or key step. */
  commit(px: number) {
    this._liveWidth.set(px);
    this.writeWidthVar(px);
    this.widthChange.emit(px);
  }

  private writeWidthVar(px: number): void {
    this.host.style.setProperty('--hell-table-col-width', `${px}px`);
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

  protected onClick(e: MouseEvent) {
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
    role: 'separator',
    'aria-orientation': 'vertical',
    tabindex: '0',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKey($event)',
  },
  template: '<span data-slot="grip" aria-hidden="true"></span>',
})
export class HellTableColumnResizer extends HellStyleable {
  readonly minWidth = input(40, { transform: numberAttribute });

  protected readonly dragging = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly cell = inject(HellTableHeaderCell);
  private readonly resizeInteraction = new HellResizePairInteractionController<HellTableHeaderCell>(
    {
      handle: this.host,
      ownerWindow: () => this.host.ownerDocument.defaultView,
      onActiveChange: (active) => this.dragging.set(active),
      orientation: () => 'horizontal',
      stopPropagation: true,
      pair: () => this.adjacentPair(),
      adapters: (pair) => {
        const min = this.minWidth();
        return {
          before: {
            measure: () => pair.before.measure(),
            minSize: () => min,
            setSize: (size) => pair.before.setLiveWidth(size),
            commitSize: (size) => pair.before.commit(size),
          },
          after: {
            measure: () => pair.after.measure(),
            minSize: () => min,
            setSize: (size) => pair.after.setLiveWidth(size),
            commitSize: (size) => pair.after.commit(size),
          },
        };
      },
    },
  );

  private adjacentPair(): { before: HellTableHeaderCell; after: HellTableHeaderCell } | null {
    const cell = this.cell;
    const next = cell.head?.nextSibling(cell) ?? null;
    return next ? { before: cell, after: next } : null;
  }

  protected onPointerDown(e: PointerEvent) {
    this.resizeInteraction.startPointer(e);
  }

  protected onKey(e: KeyboardEvent) {
    this.resizeInteraction.applyKey(e);
  }

  ngOnDestroy(): void {
    this.resizeInteraction.destroy();
  }
}

/**
 * Standalone imports for the data-table feature: container, table sections,
 * row/cell directives, sortable header cell, and column resizer.
 */
export const HELL_TABLE_DIRECTIVES = [
  HellTableContainer,
  HellTable,
  HellTableHead,
  HellTableBody,
  HellTableRow,
  HellTableHeaderCell,
  HellTableCell,
  HellTableColumnResizer,
] as const;
