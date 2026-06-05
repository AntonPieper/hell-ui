import { HELL_LABELS } from '../../core/labels';
import { hellFloatingTargetNode } from '../../core/floating-scope';
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
  OnInit,
  Renderer2,
  booleanAttribute,
  computed,
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

const HELL_TABLE_ROOT_NATIVE_ELEMENTS = ['TABLE'] as const;
const HELL_TABLE_HEADER_NATIVE_ELEMENTS = ['THEAD'] as const;
const HELL_TABLE_BODY_NATIVE_ELEMENTS = ['TBODY'] as const;
const HELL_TABLE_ROW_NATIVE_ELEMENTS = ['TR'] as const;
const HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS = ['TH'] as const;
const HELL_TABLE_CELL_NATIVE_ELEMENTS = ['TD'] as const;

@Directive()
abstract class HellTableRoleDirective extends HellStyleable implements OnInit {
  private readonly roleHost = inject(ElementRef<unknown>).nativeElement;
  private readonly renderer = inject(Renderer2);

  protected readonly nativeElementNames: readonly string[] = [];
  protected readonly inferredRole: HellTableInferredRole | null = null;

  ngOnInit(): void {
    if (this.inferredRole === null) return;
    const role = hellTableInferredRoleForHost(
      this.roleHost,
      this.nativeElementNames,
      this.inferredRole,
    );
    if (role !== null) this.renderer.setAttribute(this.roleHost, 'role', role);
  }
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
  },
})
export class HellTable extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_ROOT_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'table';

  readonly contentWidth = input(false, { transform: booleanAttribute });
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
  },
})
export class HellTableHead extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_HEADER_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'rowgroup';

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
  selector: '[hellTableBody]',
  host: {
    '[class.hell-table-body]': '!unstyled()',
    '[attr.data-hell-table-body]': '""',
  },
})
export class HellTableBody extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_BODY_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'rowgroup';
}

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
 * the row host markup and its children. Prefer real buttons or links inside
 * cells for row actions. Use Hell row activation only for an explicit
 * row-selection model, not as a generic clickable-row shortcut.
 *
 * - `[selected]` -> `data-selected="true"` for row highlight styles.
 * - `[selectable]` -> `tabindex="0"`, `aria-selected`, and click/Enter/Space
 *   binding that emits `(rowSelect)` for a row-selection model.
 * - Nested buttons, links, inputs, ARIA widgets, `[contenteditable]`, and
 *   `[data-hell-row-ignore]`/`[hellTableRowIgnore]` opt out so row selection
 *   does not double-activate.
 */
@Directive({
  selector: '[hellTableRow]',
  exportAs: 'hellTableRow',
  host: {
    '[class.hell-table-row]': '!unstyled()',
    '[attr.data-hell-table-row]': '""',
    '[attr.data-selected]': 'selected() ? "true" : null',
    '[attr.data-interactive]': 'rowActivates() ? "true" : null',
    '[attr.aria-selected]': 'rowActivates() ? (selected() ? "true" : "false") : null',
    '[attr.tabindex]': 'rowActivates() ? "0" : null',
    '(click)': 'onClick($event)',
    '(keydown.enter)': 'onKey($event)',
    '(keydown.space)': 'onKey($event)',
  },
})
export class HellTableRow extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_ROW_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'row';

  readonly selected = input(false, { transform: booleanAttribute });
  /** Preferred explicit row-selection activation API. Prefer cell buttons/links for row actions. */
  readonly selectable = input(false, { transform: booleanAttribute });

  readonly rowSelect = output<MouseEvent | KeyboardEvent>();

  protected readonly rowActivates = computed(() => this.selectable());

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
  },
})
export class HellTableHeaderCell extends HellTableRoleDirective implements OnDestroy {
  protected override readonly nativeElementNames = HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'columnheader';

  readonly sort = input<'asc' | 'desc' | null>(null);
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly columnId = input<string | null>(null);

  readonly sortToggle = output<MouseEvent | KeyboardEvent>();

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly head = inject(HellTableHead, { optional: true });

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
    '[disabled]': 'disabled()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableSortTrigger extends HellStyleable {
  readonly sortToggle = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly header = inject(HellTableHeaderCell, { optional: true });

  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
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
 * Body/data cell directive. Adds the host class and emits `(cellSelect)` on
 * click. Use the output if you need to react to a specific cell rather
 * than the whole row.
 */
@Directive({
  selector: '[hellTableCell]',
  host: {
    '[class.hell-table-cell]': '!unstyled()',
    '[attr.data-hell-table-cell]': '""',
    '[attr.data-align]': 'align()',
    '[attr.data-space]': 'space()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableCell extends HellTableRoleDirective {
  protected override readonly nativeElementNames = HELL_TABLE_CELL_NATIVE_ELEMENTS;
  protected override readonly inferredRole = 'cell';

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
    '[attr.tabindex]': 'isDisabled() ? -1 : 0',
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
 * row/cell directives, sortable header cell, and resize handle.
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
  HellTableSortTrigger,
  HellTableCell,
  HellTableResizeHandle,
] as const;
