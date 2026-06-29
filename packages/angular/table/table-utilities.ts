import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  HellResizePairInteractionController,
  hellResizePairAriaValue,
  type HellResizeDirection,
} from '@hell-ui/angular/internal/core';
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
  Input,
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

const HELL_TABLE_ROOT_NATIVE_ELEMENTS = ['TABLE'] as const;
const HELL_TABLE_HEADER_NATIVE_ELEMENTS = ['THEAD'] as const;
const HELL_TABLE_BODY_NATIVE_ELEMENTS = ['TBODY'] as const;
const HELL_TABLE_ROW_NATIVE_ELEMENTS = ['TR'] as const;
const HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS = ['TH'] as const;
const HELL_TABLE_CELL_NATIVE_ELEMENTS = ['TD'] as const;

export type HellTableContainerPart = 'root';
export type HellTableContainerUi = HellUi<HellTableContainerPart>;

export type HellTablePart = 'root';
export type HellTableUi = HellUi<HellTablePart>;

export type HellTableHeadPart = 'root';
export type HellTableHeadUi = HellUi<HellTableHeadPart>;

export type HellTableBodyPart = 'root';
export type HellTableBodyUi = HellUi<HellTableBodyPart>;

export type HellTableRowPart = 'root';
export type HellTableRowUi = HellUi<HellTableRowPart>;

export type HellTableRowActionPart = 'root';
export type HellTableRowActionUi = HellUi<HellTableRowActionPart>;

export type HellTableSelectionCellPart = 'root';
export type HellTableSelectionCellUi = HellUi<HellTableSelectionCellPart>;

export type HellTableRowCheckboxPart = 'root';
export type HellTableRowCheckboxUi = HellUi<HellTableRowCheckboxPart>;

export type HellTableRowRadioPart = 'root';
export type HellTableRowRadioUi = HellUi<HellTableRowRadioPart>;

export type HellTableHeaderCellPart = 'root';
export type HellTableHeaderCellUi = HellUi<HellTableHeaderCellPart>;

export type HellTableSortTriggerPart = 'root';
export type HellTableSortTriggerUi = HellUi<HellTableSortTriggerPart>;

export type HellTableCellPart = 'root';
export type HellTableCellUi = HellUi<HellTableCellPart>;

export type HellTableResizeHandlePart = 'root' | 'grip';
export type HellTableResizeHandleUi = HellUi<HellTableResizeHandlePart>;

const HELL_TABLE_CONTAINER_RECIPE = {
  root: 'flex min-w-0 flex-col overflow-clip rounded-hell-md border border-hell-border bg-hell-surface-elevated',
} satisfies HellRecipe<HellTableContainerPart>;

const HELL_TABLE_RECIPE = {
  root: 'table w-full table-fixed border-separate border-spacing-0 text-[13px] text-hell-foreground data-[content-width=true]:w-max data-[content-width=true]:min-w-full',
} satisfies HellRecipe<HellTablePart>;

const HELL_TABLE_HEAD_RECIPE = {
  root: 'table-header-group bg-hell-surface-subtle',
} satisfies HellRecipe<HellTableHeadPart>;

const HELL_TABLE_BODY_RECIPE = {
  root: '',
} satisfies HellRecipe<HellTableBodyPart>;

const HELL_TABLE_ROW_RECIPE = {
  root: 'transition-colors duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-[active=true]:bg-hell-surface-subtle data-[selected=true]:bg-hell-primary-soft',
} satisfies HellRecipe<HellTableRowPart>;

const HELL_TABLE_ROW_ACTION_RECIPE = {
  root: 'inline-flex h-hell-control-xs cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-sm border border-transparent bg-transparent px-hell-2 font-[inherit] text-xs font-medium leading-none text-hell-foreground shadow-none transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-muted focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<HellTableRowActionPart>;

const HELL_TABLE_SELECTION_CELL_RECIPE = {
  root: 'box-border w-[44px] min-w-[44px] whitespace-nowrap px-hell-3 text-center',
} satisfies HellRecipe<HellTableSelectionCellPart>;

const HELL_TABLE_ROW_CHECKBOX_RECIPE = {
  root: 'relative inline-flex h-[calc(var(--spacing)*4)] w-[calc(var(--spacing)*4)] cursor-pointer appearance-none items-center justify-center rounded-hell-sm border border-hell-border-strong bg-hell-surface-elevated p-0 text-hell-foreground transition-[background-color,border-color,color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] checked:border-hell-primary checked:bg-hell-primary checked:text-hell-primary-foreground indeterminate:border-hell-primary indeterminate:bg-hell-primary indeterminate:text-hell-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2',
} satisfies HellRecipe<HellTableRowCheckboxPart>;

const HELL_TABLE_ROW_RADIO_RECIPE = {
  root: 'relative inline-flex h-[calc(var(--spacing)*4)] w-[calc(var(--spacing)*4)] cursor-pointer appearance-none items-center justify-center rounded-hell-pill border border-hell-border-strong bg-hell-surface-elevated p-0 transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] checked:border-hell-primary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2',
} satisfies HellRecipe<HellTableRowRadioPart>;

const HELL_TABLE_HEADER_CELL_RECIPE = {
  root: 'sticky top-0 z-[1] table-cell select-none whitespace-nowrap border-b border-hell-border bg-hell-surface-subtle px-hell-3 py-hell-2 text-start align-middle text-[11px] font-semibold uppercase text-hell-foreground-muted data-[sortable=true]:pe-hell-8',
} satisfies HellRecipe<HellTableHeaderCellPart>;

const HELL_TABLE_SORT_TRIGGER_RECIPE = {
  root: 'inline-flex items-center gap-[calc(var(--spacing)*1.5)] rounded-hell-sm border-0 bg-transparent p-0 font-[inherit] text-inherit shadow-none disabled:cursor-default enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2',
} satisfies HellRecipe<HellTableSortTriggerPart>;

const HELL_TABLE_CELL_RECIPE = {
  root: 'overflow-hidden text-ellipsis whitespace-nowrap border-b border-hell-border px-hell-3 py-hell-2 text-start align-middle data-[align=center]:text-center data-[align=end]:text-end data-[space=empty]:py-hell-8',
} satisfies HellRecipe<HellTableCellPart>;

const HELL_TABLE_RESIZE_HANDLE_RECIPE = {
  root: 'absolute inset-y-0 end-0 z-[2] inline-flex w-hell-2 cursor-col-resize touch-none select-none items-stretch justify-end focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-[-2px]',
  grip: 'w-px bg-hell-border transition-[background-color,width] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<HellTableResizeHandlePart>;

class HellTablePartClassSync {
  private readonly applied = new Set<string>();
  private readonly registry: HellTablePartClassRegistry;

  constructor(host: HTMLElement) {
    this.registry = hellTablePartClassRegistryFor(host);
  }

  apply(className: string): void {
    this.registry.apply(this, this.applied, className);
  }
}

class HellTablePartClassRegistry {
  private readonly preserved: Set<string>;
  private readonly ownersByToken = new Map<string, Set<HellTablePartClassSync>>();

  constructor(private readonly host: HTMLElement) {
    this.preserved = new Set(host.className.split(/\s+/).filter(Boolean));
  }

  apply(owner: HellTablePartClassSync, applied: Set<string>, className: string): void {
    const next = new Set(className.split(/\s+/).filter(Boolean));
    for (const token of applied) {
      if (!next.has(token)) this.remove(owner, token);
    }
    for (const token of next) {
      if (!applied.has(token)) this.add(owner, token);
    }
    applied.clear();
    for (const token of next) applied.add(token);
  }

  private add(owner: HellTablePartClassSync, token: string): void {
    const owners = this.ownersByToken.get(token) ?? new Set<HellTablePartClassSync>();
    owners.add(owner);
    this.ownersByToken.set(token, owners);
    this.host.classList.add(token);
  }

  private remove(owner: HellTablePartClassSync, token: string): void {
    const owners = this.ownersByToken.get(token);
    if (!owners) return;
    owners.delete(owner);
    if (owners.size > 0) return;

    this.ownersByToken.delete(token);
    if (!this.preserved.has(token)) this.host.classList.remove(token);
  }
}

const HELL_TABLE_PART_CLASS_REGISTRIES = new WeakMap<HTMLElement, HellTablePartClassRegistry>();

function hellTablePartClassRegistryFor(host: HTMLElement): HellTablePartClassRegistry {
  const existing = HELL_TABLE_PART_CLASS_REGISTRIES.get(host);
  if (existing) return existing;

  const registry = new HellTablePartClassRegistry(host);
  HELL_TABLE_PART_CLASS_REGISTRIES.set(host, registry);
  return registry;
}

function injectHellTablePartClassSync(): HellTablePartClassSync {
  return new HellTablePartClassSync(inject(ElementRef<HTMLElement>).nativeElement);
}

class HellTableRoleSupport {
  private readonly explicitRole: string | null;

  constructor(
    private readonly roleHost: unknown,
    private readonly nativeElementNames: readonly string[],
    private readonly inferredRole: HellTableInferredRole | null,
  ) {
    this.explicitRole = hellHostExplicitRole(roleHost);
  }

  role(): string | null {
    if (this.explicitRole !== null) return this.explicitRole;

    if (this.inferredRole === null) return null;
    return hellTableInferredRoleForHost(
      this.roleHost,
      this.nativeElementNames,
      this.inferredRole,
      this.explicitRole,
    );
  }
}

function injectHellTableRoleSupport(
  nativeElementNames: readonly string[],
  inferredRole: HellTableInferredRole | null,
): HellTableRoleSupport {
  return new HellTableRoleSupport(
    inject(ElementRef<unknown>).nativeElement,
    nativeElementNames,
    inferredRole,
  );
}

/**
 * Optional shell for table utilities. Frames the table with the standard
 * elevated surface, border, radius, and overflow clipping. Place the
 * scroll container or the table directly inside.
 */
@Directive({
  selector: '[hellTableContainer]',
  host: {
    'data-slot': 'root',
    '[attr.data-loading]': 'busy() ? "true" : null',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class HellTableContainer extends HellPartStyleable<HellTableContainerPart> {
  protected readonly recipe = HELL_TABLE_CONTAINER_RECIPE;
  protected readonly defaultUiPart = 'root';
  readonly busy = input(false, { transform: booleanAttribute });

  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }
}

/**
 * Marks a table root host for table utilities. Applies the host class with the
 * shared dense typography and border treatment, and uses fixed table layout so
 * column resize CSS custom properties can be mapped by the stylesheet.
 */
@Directive({
  selector: '[hellTableRoot], table[hellTable]',
  exportAs: 'hellTableRoot',
  host: {
    'data-slot': 'root',
    '[attr.data-hell-table-root]': '""',
    '[attr.data-content-width]': 'contentWidth() ? "true" : null',
    '[attr.role]': 'role()',
  },
})
export class HellTable extends HellPartStyleable<HellTablePart> {
  protected readonly recipe = HELL_TABLE_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly contentWidth = signal(false);

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_ROOT_NATIVE_ELEMENTS,
    'table',
  );

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected role(): string | null {
    return this.roleSupport.role();
  }

  @Input({ alias: 'contentWidth', transform: booleanAttribute })
  set contentWidthInput(value: boolean) {
    this.contentWidth.set(value);
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
    'data-slot': 'root',
    '[attr.data-hell-table-header]': '""',
    '[attr.role]': 'role()',
  },
})
export class HellTableHead extends HellPartStyleable<HellTableHeadPart> {
  protected readonly recipe = HELL_TABLE_HEAD_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly cells = new Set<HellTableHeaderCell>();
  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_HEADER_NATIVE_ELEMENTS,
    'rowgroup',
  );

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected role(): string | null {
    return this.roleSupport.role();
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
    'data-slot': 'root',
    '[attr.data-hell-table-body]': '""',
    '[attr.role]': 'role()',
  },
})
export class HellTableBody extends HellPartStyleable<HellTableBodyPart> {
  protected readonly recipe = HELL_TABLE_BODY_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_BODY_NATIVE_ELEMENTS,
    'rowgroup',
  );

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected role(): string | null {
    return this.roleSupport.role();
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
    'data-slot': 'root',
    '[attr.data-hell-table-row]': '""',
    '[attr.data-active]': 'active() ? "true" : null',
    '[attr.data-selected]': 'selected() ? "true" : null',
    '[attr.role]': 'role()',
  },
})
export class HellTableRow extends HellPartStyleable<HellTableRowPart> {
  protected readonly recipe = HELL_TABLE_ROW_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly active = signal(false);
  readonly selected = signal(false);

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(HELL_TABLE_ROW_NATIVE_ELEMENTS, 'row');

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected role(): string | null {
    return this.roleSupport.role();
  }

  @Input({ alias: 'active', transform: booleanAttribute })
  set activeInput(value: boolean) {
    this.active.set(value);
  }

  @Input({ alias: 'selected', transform: booleanAttribute })
  set selectedInput(value: boolean) {
    this.selected.set(value);
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
    'data-slot': 'root',
    '[attr.data-hell-table-row-action]': '""',
    '[attr.type]': 'nativeButtonType()',
  },
})
export class HellTableRowAction extends HellPartStyleable<HellTableRowActionPart> {
  protected readonly recipe = HELL_TABLE_ROW_ACTION_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
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
    'data-slot': 'root',
    '[attr.data-hell-table-selection-cell]': '""',
  },
})
export class HellTableSelectionCell extends HellPartStyleable<HellTableSelectionCellPart> {
  protected readonly recipe = HELL_TABLE_SELECTION_CELL_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }
}

/** Native checkbox primitive for row-selection columns with table-specific styling hooks. */
@Directive({
  selector: 'input[type="checkbox"][hellTableRowCheckbox]',
  exportAs: 'hellTableRowCheckbox',
  host: {
    'data-slot': 'root',
    '[attr.type]': '"checkbox"',
    '[attr.data-hell-table-row-checkbox]': '""',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-indeterminate]': 'indeterminate() ? "" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '[attr.required]': 'required() ? "" : null',
    '(change)': 'onChange()',
  },
})
export class HellTableRowCheckbox extends HellPartStyleable<HellTableRowCheckboxPart> {
  protected readonly recipe = HELL_TABLE_ROW_CHECKBOX_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  readonly indeterminate = input(false, { alias: 'indeterminate', transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  readonly indeterminateChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
    effect(() => {
      this.host.nativeElement.indeterminate = this.indeterminate();
    });
  }

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
    this.indeterminateChange.emit(this.host.nativeElement.indeterminate);
  }
}

/** Native radio primitive for single row-selection columns with table-specific styling hooks. */
@Directive({
  selector: 'input[type="radio"][hellTableRowRadio]',
  exportAs: 'hellTableRowRadio',
  host: {
    'data-slot': 'root',
    '[attr.type]': '"radio"',
    '[attr.data-hell-table-row-radio]': '""',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(change)': 'onChange()',
  },
})
export class HellTableRowRadio extends HellPartStyleable<HellTableRowRadioPart> {
  protected readonly recipe = HELL_TABLE_ROW_RADIO_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
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
 * adapters may delegate sizing to app-owned state or TanStack column sizing.
 */
@Directive({
  selector: '[hellTableHeaderCell]',
  exportAs: 'hellTableHeaderCell',
  host: {
    'data-slot': 'root',
    '[attr.data-hell-table-header-cell]': '""',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-column-id]': 'columnId()',
    '[attr.data-sort]': 'sort()',
    '[attr.data-sortable]': 'sortable() ? "true" : null',
    '[attr.role]': 'role()',
  },
})
export class HellTableHeaderCell
  extends HellPartStyleable<HellTableHeaderCellPart>
  implements OnDestroy
{
  protected readonly recipe = HELL_TABLE_HEADER_CELL_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly sort = signal<'asc' | 'desc' | null>(null);
  readonly sortable = signal(false);
  readonly columnId = signal<string | null>(null);

  @Input({ alias: 'sort' })
  set sortInput(value: 'asc' | 'desc' | null) {
    this.sort.set(value);
  }

  @Input({ alias: 'sortable', transform: booleanAttribute })
  set sortableInput(value: boolean) {
    this.sortable.set(value);
  }

  @Input({ alias: 'columnId' })
  set columnIdInput(value: string | null) {
    this.columnId.set(value);
  }

  readonly sortToggle = output<MouseEvent | KeyboardEvent>();

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  readonly head = inject(HellTableHead, { optional: true });
  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS,
    'columnheader',
  );

  protected readonly ariaSort = computed<'ascending' | 'descending' | null>(() => {
    if (!this.sortable()) return null;
    const s = this.sort();
    if (s === 'asc') return 'ascending';
    if (s === 'desc') return 'descending';
    return null;
  });

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
    this.head?.register(this);
  }

  protected role(): string | null {
    return this.roleSupport.role();
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
    const width = `${px}px`;
    this.host.style.setProperty('--hell-table-col-width', width);
    this.host.style.width = width;
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
    'data-slot': 'root',
    '[attr.data-hell-table-sort-trigger]': '""',
    '[attr.type]': 'nativeButtonType()',
    '[disabled]': 'disabled()',
    '(click)': 'onClick($event)',
  },
})
export class HellTableSortTrigger extends HellPartStyleable<HellTableSortTriggerPart> {
  protected readonly recipe = HELL_TABLE_SORT_TRIGGER_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly sortToggle = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly header = inject(HellTableHeaderCell, { optional: true });
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

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
 * Body/data cell directive. Adds the host class and optional alignment/empty
 * state hooks. Cells stay passive; use a nested row action or selection control
 * for interaction.
 */
@Directive({
  selector: '[hellTableCell]',
  host: {
    'data-slot': 'root',
    '[attr.data-hell-table-cell]': '""',
    '[attr.data-align]': 'align()',
    '[attr.data-space]': 'space()',
    '[attr.role]': 'role()',
  },
})
export class HellTableCell extends HellPartStyleable<HellTableCellPart> {
  protected readonly recipe = HELL_TABLE_CELL_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly align = signal<'start' | 'center' | 'end'>('start');
  readonly space = signal<'normal' | 'empty'>('normal');

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(HELL_TABLE_CELL_NATIVE_ELEMENTS, 'cell');

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  protected role(): string | null {
    return this.roleSupport.role();
  }

  @Input({ alias: 'align' })
  set alignInput(value: 'start' | 'center' | 'end') {
    this.align.set(value);
  }

  @Input({ alias: 'space' })
  set spaceInput(value: 'normal' | 'empty') {
    this.space.set(value);
  }

  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
}

/**
 * Resize handle placed inside a table header or adapter-rendered header edge.
 * The handle owns separator pointer/keyboard semantics only; sizing storage is
 * delegated to a narrow `HellTableResizeAdapter` so apps or TanStack can own
 * their own column sizing state.
 *
 * Note: `HellResizable` is intentionally not reused. That composite relies on
 * sibling flex panes. Table headers and adapter renderers need adjacent item
 * adapters instead of flex-pane DOM assumptions.
 */
@Component({
  selector: '[hellTableResizeHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'root',
    '[attr.data-hell-table-resize-handle]': '""',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-label]':
      'isDisabled() && nativeButtonType() === null ? null : (ariaLabel() ?? labels.tableUtilities.resizeColumn)',
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
  template: '<span data-slot="grip" [class]="part(\'grip\')" aria-hidden="true"></span>',
})
export class HellTableResizeHandle
  extends HellPartStyleable<HellTableResizeHandlePart>
  implements AfterViewInit, OnDestroy
{
  protected readonly recipe = HELL_TABLE_RESIZE_HANDLE_RECIPE;
  protected readonly defaultUiPart = 'root';

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
  private readonly tableClasses = injectHellTablePartClassSync();
  protected readonly labels = inject<HellLabels>(HELL_LABELS);
  private readonly resizeInteraction = new HellResizePairInteractionController<HellTableResizeItem>(
    {
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
    },
  );

  constructor() {
    super();
    effect(() => this.tableClasses.apply(this.part('root')));
  }

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
