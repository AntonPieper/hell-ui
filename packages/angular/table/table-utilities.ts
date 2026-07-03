import { hellCreateLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
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
import type { InjectionToken, Provider } from '@angular/core';

/** Built-in accessibility labels owned by the table utilities entry point. */
export interface HellTableUtilitiesLabels {
  /** Accessible label announced on the column resize handle. */
  readonly resizeColumn: string;
}

const HELL_TABLE_UTILITIES_LABELS_CONTRACT = hellCreateLabels<HellTableUtilitiesLabels>('HELL_TABLE_UTILITIES_LABELS', {
  resizeColumn: 'Resize column',
});

/** Injection token resolving to the effective table utilities labels. */
export const HELL_TABLE_UTILITIES_LABELS: InjectionToken<HellTableUtilitiesLabels> = HELL_TABLE_UTILITIES_LABELS_CONTRACT.token;

/** Override any subset of the table utilities labels for an injector scope. */
export function provideHellTableUtilitiesLabels(overrides: Partial<HellTableUtilitiesLabels>): Provider {
  return HELL_TABLE_UTILITIES_LABELS_CONTRACT.provide(overrides);
}

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

/** Public parts of the HellTableContainer module, styleable through its Part Style Map. */
export type HellTableContainerPart = 'root';
/** Part Style Map accepted by the HellTableContainer `ui` input. */
export type HellTableContainerUi = HellUi<HellTableContainerPart>;

/** Public parts of the HellTable module, styleable through its Part Style Map. */
export type HellTablePart = 'root';
/** Part Style Map accepted by the HellTable `ui` input. */
export type HellTableUi = HellUi<HellTablePart>;

/** Public parts of the HellTableHead module, styleable through its Part Style Map. */
export type HellTableHeadPart = 'root';
/** Part Style Map accepted by the HellTableHead `ui` input. */
export type HellTableHeadUi = HellUi<HellTableHeadPart>;

/** Public parts of the HellTableBody module, styleable through its Part Style Map. */
export type HellTableBodyPart = 'root';
/** Part Style Map accepted by the HellTableBody `ui` input. */
export type HellTableBodyUi = HellUi<HellTableBodyPart>;

/** Public parts of the HellTableRow module, styleable through its Part Style Map. */
export type HellTableRowPart = 'root';
/** Part Style Map accepted by the HellTableRow `ui` input. */
export type HellTableRowUi = HellUi<HellTableRowPart>;

/** Public parts of the HellTableRowAction module, styleable through its Part Style Map. */
export type HellTableRowActionPart = 'root';
/** Part Style Map accepted by the HellTableRowAction `ui` input. */
export type HellTableRowActionUi = HellUi<HellTableRowActionPart>;

/** Public parts of the HellTableSelectionCell module, styleable through its Part Style Map. */
export type HellTableSelectionCellPart = 'root';
/** Part Style Map accepted by the HellTableSelectionCell `ui` input. */
export type HellTableSelectionCellUi = HellUi<HellTableSelectionCellPart>;

/** Public parts of the HellTableRowCheckbox module, styleable through its Part Style Map. */
export type HellTableRowCheckboxPart = 'root';
/** Part Style Map accepted by the HellTableRowCheckbox `ui` input. */
export type HellTableRowCheckboxUi = HellUi<HellTableRowCheckboxPart>;

/** Public parts of the HellTableRowRadio module, styleable through its Part Style Map. */
export type HellTableRowRadioPart = 'root';
/** Part Style Map accepted by the HellTableRowRadio `ui` input. */
export type HellTableRowRadioUi = HellUi<HellTableRowRadioPart>;

/** Public parts of the HellTableHeaderCell module, styleable through its Part Style Map. */
export type HellTableHeaderCellPart = 'root';
/** Part Style Map accepted by the HellTableHeaderCell `ui` input. */
export type HellTableHeaderCellUi = HellUi<HellTableHeaderCellPart>;

/** Public parts of the HellTableSortTrigger module, styleable through its Part Style Map. */
export type HellTableSortTriggerPart = 'root';
/** Part Style Map accepted by the HellTableSortTrigger `ui` input. */
export type HellTableSortTriggerUi = HellUi<HellTableSortTriggerPart>;

/** Public parts of the HellTableCell module, styleable through its Part Style Map. */
export type HellTableCellPart = 'root';
/** Part Style Map accepted by the HellTableCell `ui` input. */
export type HellTableCellUi = HellUi<HellTableCellPart>;

/** Public parts of the HellTableResizeHandle module, styleable through its Part Style Map. */
export type HellTableResizeHandlePart = 'root' | 'grip';
/** Part Style Map accepted by the HellTableResizeHandle `ui` input. */
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
export class HellTableContainer {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableContainerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableContainerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_CONTAINER_RECIPE,
  });
  /** Reflects a loading state via `data-loading`/`aria-busy`. Defaults to `false`. */
  readonly busy = input(false, { transform: booleanAttribute });

  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
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
export class HellTable {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTablePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTablePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_RECIPE,
  });

  /** Whether the table sizes to its content width rather than filling its container. */
  readonly contentWidth = signal(false);

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_ROOT_NATIVE_ELEMENTS,
    'table',
  );

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Resolves the host ARIA role, inferring `table` for non-native hosts. */
  protected role(): string | null {
    return this.roleSupport.role();
  }

  /** Sets `contentWidth` from the `contentWidth` attribute input. */
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
export class HellTableHead {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableHeadPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableHeadPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_HEAD_RECIPE,
  });

  private readonly cells = new Set<HellTableHeaderCell>();
  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_HEADER_NATIVE_ELEMENTS,
    'rowgroup',
  );

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Resolves the host ARIA role, inferring `rowgroup` for non-native hosts. */
  protected role(): string | null {
    return this.roleSupport.role();
  }

  /** Registers a child header cell so its neighbors can be discovered. */
  register(c: HellTableHeaderCell) {
    this.cells.add(c);
  }
  /** Removes a header cell from neighbor tracking. */
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

/** Body section for table utilities. Applies the host class and infers its ARIA role. */
@Directive({
  selector: '[hellTableBody]',
  host: {
    'data-slot': 'root',
    '[attr.data-hell-table-body]': '""',
    '[attr.role]': 'role()',
  },
})
export class HellTableBody {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableBodyPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableBodyPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_BODY_RECIPE,
  });

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_BODY_NATIVE_ELEMENTS,
    'rowgroup',
  );

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Resolves the host ARIA role, inferring `rowgroup` for non-native hosts. */
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
export class HellTableRow {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableRowPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableRowPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_ROW_RECIPE,
  });

  /** Whether the row shows the active master/detail or editor highlight. */
  readonly active = signal(false);
  /** Whether the row shows the bulk-selection highlight. */
  readonly selected = signal(false);

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(HELL_TABLE_ROW_NATIVE_ELEMENTS, 'row');

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Resolves the host ARIA role, inferring `row` for non-native hosts. */
  protected role(): string | null {
    return this.roleSupport.role();
  }

  /** Sets `active` from the `active` attribute input. */
  @Input({ alias: 'active', transform: booleanAttribute })
  set activeInput(value: boolean) {
    this.active.set(value);
  }

  /** Sets `selected` from the `selected` attribute input. */
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
export class HellTableRowAction {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableRowActionPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableRowActionPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_ROW_ACTION_RECIPE,
  });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Emits `"button"` for native button hosts so the type attribute is set. */
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
export class HellTableSelectionCell {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableSelectionCellPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableSelectionCellPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_SELECTION_CELL_RECIPE,
  });

  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
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
export class HellTableRowCheckbox {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableRowCheckboxPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableRowCheckboxPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_ROW_CHECKBOX_RECIPE,
  });

  /** Whether the checkbox is required. Defaults to `false`. */
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  /** Whether the checkbox renders the indeterminate state. Defaults to `false`. */
  readonly indeterminate = input(false, { alias: 'indeterminate', transform: booleanAttribute });

  /** Emits the native checked value whenever the checkbox changes. */
  readonly checkedChange = output<boolean>();
  /** Emits the native indeterminate value whenever the checkbox changes. */
  readonly indeterminateChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
    effect(() => {
      this.host.nativeElement.indeterminate = this.indeterminate();
    });
  }

  /** Relays the native change event through the checked/indeterminate outputs. */
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
export class HellTableRowRadio {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableRowRadioPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableRowRadioPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_ROW_RADIO_RECIPE,
  });

  /** Whether the radio is required. Defaults to `false`. */
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  /** Emits the native checked value whenever the radio changes. */
  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Relays the native change event through the checked output. */
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
export class HellTableHeaderCell implements OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableHeaderCellPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableHeaderCellPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_HEADER_CELL_RECIPE,
  });

  /** Current sort direction of the column, or `null` when unsorted. */
  readonly sort = signal<'asc' | 'desc' | null>(null);
  /** Whether the column advertises itself as sortable. */
  readonly sortable = signal(false);
  /** Stable column id used by resize adapters, or `null` when unset. */
  readonly columnId = signal<string | null>(null);

  /** Sets `sort` from the `sort` attribute input. */
  @Input({ alias: 'sort' })
  set sortInput(value: 'asc' | 'desc' | null) {
    this.sort.set(value);
  }

  /** Sets `sortable` from the `sortable` attribute input. */
  @Input({ alias: 'sortable', transform: booleanAttribute })
  set sortableInput(value: boolean) {
    this.sortable.set(value);
  }

  /** Sets `columnId` from the `columnId` attribute input. */
  @Input({ alias: 'columnId' })
  set columnIdInput(value: string | null) {
    this.columnId.set(value);
  }

  /** Emits the originating event when a sortable header cell is toggled. */
  readonly sortToggle = output<MouseEvent | KeyboardEvent>();

  /** The header cell host element. */
  readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  /** The enclosing header section, or `null` when used standalone. */
  readonly head = inject(HellTableHead, { optional: true });
  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(
    HELL_TABLE_HEADER_CELL_NATIVE_ELEMENTS,
    'columnheader',
  );

  /** Maps the current sort direction to the `aria-sort` token when sortable. */
  protected readonly ariaSort = computed<'ascending' | 'descending' | null>(() => {
    if (!this.sortable()) return null;
    const s = this.sort();
    if (s === 'asc') return 'ascending';
    if (s === 'desc') return 'descending';
    return null;
  });

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
    this.head?.register(this);
  }

  /** Resolves the host ARIA role, inferring `columnheader` for non-native hosts. */
  protected role(): string | null {
    return this.roleSupport.role();
  }

  /** Unregisters this cell from its header section on teardown. */
  ngOnDestroy() {
    this.head?.unregister(this);
  }

  /** Emits `sortToggle` for the given event when the column is sortable. */
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
export class HellTableSortTrigger {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableSortTriggerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableSortTriggerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_SORT_TRIGGER_RECIPE,
  });

  /** Emits the click event when the trigger activates a sort. */
  readonly sortToggle = output<MouseEvent>();

  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;
  private readonly header = inject(HellTableHeaderCell, { optional: true });
  private readonly tableClasses = injectHellTablePartClassSync();

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Emits `"button"` for native button hosts so the type attribute is set. */
  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
  }

  /** Whether the trigger is disabled because its header cell is not sortable. */
  protected disabled(): boolean {
    return this.header ? !this.header.sortable() : false;
  }

  /** Forwards activation to the header cell and emits `sortToggle`. */
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
export class HellTableCell {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableCellPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableCellPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_CELL_RECIPE,
  });

  /** Horizontal content alignment of the cell. Defaults to `start`. */
  readonly align = signal<'start' | 'center' | 'end'>('start');
  /** Content spacing mode; `empty` adds extra vertical padding. Defaults to `normal`. */
  readonly space = signal<'normal' | 'empty'>('normal');

  private readonly tableClasses = injectHellTablePartClassSync();
  private readonly roleSupport = injectHellTableRoleSupport(HELL_TABLE_CELL_NATIVE_ELEMENTS, 'cell');

  constructor() {
    effect(() => this.tableClasses.apply(this.part('root')));
  }

  /** Resolves the host ARIA role, inferring `cell` for non-native hosts. */
  protected role(): string | null {
    return this.roleSupport.role();
  }

  /** Sets `align` from the `align` attribute input. */
  @Input({ alias: 'align' })
  set alignInput(value: 'start' | 'center' | 'end') {
    this.align.set(value);
  }

  /** Sets `space` from the `space` attribute input. */
  @Input({ alias: 'space' })
  set spaceInput(value: 'normal' | 'empty') {
    this.space.set(value);
  }

  /** The cell host element. */
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
      'isDisabled() && nativeButtonType() === null ? null : (ariaLabel() ?? labels.resizeColumn)',
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
export class HellTableResizeHandle implements AfterViewInit, OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTableResizeHandlePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTableResizeHandlePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TABLE_RESIZE_HANDLE_RECIPE,
  });

  /** Minimum column width in CSS pixels either side may shrink to. Defaults to `40`. */
  readonly minWidth = input(40, { transform: numberAttribute });
  /** Optional adapter supplying the two sides to resize. Defaults to the adjacent header cells. */
  readonly resizeAdapter = input<HellTableResizeAdapter | null>(null);
  /** Accessible label override for the handle. Defaults to the injected resize-column label. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Ids the handle controls, overriding the values derived from the resize pair. */
  readonly ariaControls = input<string | readonly string[] | null>(null, {
    alias: 'aria-controls',
  });

  /** Resolved `aria-controls` value, preferring the input over adapter-derived ids. */
  protected readonly ariaControlsValue = computed(() =>
    hellAriaControlsValue(this.ariaControls() ?? this.adapterAriaControls()),
  );

  /** Emits once per committed resize with the affected adjacent columns. */
  readonly resizeCommit = output<HellTableResizeEvent>();

  /** Whether a pointer drag is currently in progress. */
  protected readonly dragging = signal(false);
  /** Current `aria-valuenow` percentage for the resize separator. */
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly cell = inject(HellTableHeaderCell, { optional: true });
  private readonly tableClasses = injectHellTablePartClassSync();
  /** Resolved accessibility labels for the table utilities. */
  protected readonly labels = inject(HELL_TABLE_UTILITIES_LABELS);
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

  /** Whether the handle has no resolvable resize pair and is therefore inert. */
  protected isDisabled(): boolean {
    return this.resizePair() === null;
  }

  /** Emits `"button"` for native button hosts so the type attribute is set. */
  protected nativeButtonType(): 'button' | null {
    return hellHostElementName(this.host) === 'BUTTON' ? 'button' : null;
  }

  /** Tab index for the handle: `0` when active, `-1` when disabled. */
  protected resizeTabIndex(): -1 | 0 {
    return this.isDisabled() ? -1 : 0;
  }

  /** Seeds the initial `aria-valuenow` once the view is ready. */
  ngAfterViewInit(): void {
    this.refreshAriaValueNow();
  }

  /** Starts a pointer-driven resize interaction. */
  protected onPointerDown(e: PointerEvent) {
    if (this.isDisabled()) return;
    this.refreshAriaValueNow();
    this.resizeInteraction.startPointer(e);
  }

  /** Applies a keyboard step to the resize interaction. */
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

  /** Tears down the resize interaction controller. */
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
