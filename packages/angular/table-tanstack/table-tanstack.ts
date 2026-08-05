import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  InjectionToken,
  NO_ERRORS_SCHEMA,
  OnChanges,
  OnDestroy,
  TemplateRef,
  Type,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  isDevMode,
  viewChild,
  type Provider,
} from '@angular/core';
import {
  FlexRenderDirective,
  type Atoms_All,
  type Cell,
  type Column,
  type ColumnDefBase_All,
  type Header,
  type Row,
  type RowData,
  type Table,
  type TableFeature,
  type TableFeatures,
  type TableOptions_All,
} from '@tanstack/angular-table';
// Feature APIs are gated on the features a table registers, so a shell that is
// generic over `TFeatures` cannot reach them as instance methods: TanStack's
// feature-map lookup stays unresolved while `TFeatures` is a type parameter.
// The static-function entry point exists for exactly this case — every function
// is itself generic over `TFeatures` and takes the instance as its first
// argument, so the shell reads the same APIs without pinning a feature set.
import {
  column_getAfter,
  column_getCanResize,
  column_getCanSort,
  column_getFilterValue,
  column_getIsPinned,
  column_getIsSorted,
  column_getSize,
  column_getStart,
  column_getToggleSortingHandler,
  column_setFilterValue,
  getDefaultColumnSizingColumnDef,
  getDefaultPaginationState,
  row_getIsExpanded,
  row_getVisibleCells,
  table_getCenterVisibleLeafColumns,
  table_getEndVisibleLeafColumns,
  table_getPageCount,
  table_getStartVisibleLeafColumns,
  table_getTotalSize,
  table_setColumnSizing,
  table_setGlobalFilter,
  table_setPageIndex,
  table_setPageSize,
} from '@tanstack/angular-table/static-functions';
import { HellButton } from 'hell-ui/button';
import { HELL_EMPTY_STATE_COPY, HellEmptyState } from 'hell-ui/empty-state';
import {
  HELL_TABLE_UTILITIES_IMPORTS,
  HELL_TABLE_UTILITIES_LABELS,
  type HellTableResizeAdapter,
  type HellTableResizeItem,
  type HellTableUtilitiesLabels,
} from 'hell-ui/table';
import { HellInput, HELL_SEARCH_IMPORTS } from 'hell-ui/input';
import { HellNativeSelect } from 'hell-ui/select';
import { HellPaginationStrip } from 'hell-ui/pagination';
import type { HellUi, HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';

/** Optional teardown returned by ɵHellTanStackBodyStrategy connect hooks. */
export type ɵHellStrategyCleanup = VoidFunction | void;

/**
 * TanStack features `hell-tanstack-table` requires on the tables it renders.
 *
 * v9 gates every feature API on the features a table registers, so a shell can
 * only read what it declares. Each requirement below is something the shell
 * reads unconditionally for every table it renders:
 *
 * - `columnVisibilityFeature` — the visible leaf columns and each row's cells,
 *   which drive the `<colgroup>`, the header grid, and every body row.
 * - `columnSizingFeature` — column sizes, the table total, and the pinned
 *   start/after offsets published as CSS variables.
 * - `columnPinningFeature` — the pinned side and the pinned edge flags.
 * - `columnResizingFeature` — whether a column may be resized, which decides
 *   whether a resize separator is rendered.
 * - `rowSortingFeature` — whether a header is sortable and its current
 *   direction, which the shell renders as a sort trigger.
 * - `rowExpandingFeature` — whether a row is expanded, which decides whether
 *   the projected expanded-row template is rendered beneath it.
 *
 * Extra features are always welcome: the shell is generic over `TFeatures`, so
 * a table registering row selection or grouping alongside these satisfies it.
 *
 * Requirements are per shell class rather than one shared union, so a caller
 * who only wants a sorted table never has to register pagination or filtering.
 * See {@link HellTanStackPaginationFeatures},
 * {@link HellTanStackGlobalFilterFeatures} and
 * {@link HellTanStackColumnFilterFeatures}.
 */
export interface HellTanStackTableFeatures extends TableFeatures {
  columnPinningFeature: TableFeature;
  columnResizingFeature: TableFeature;
  columnSizingFeature: TableFeature;
  columnVisibilityFeature: TableFeature;
  rowExpandingFeature: TableFeature;
  rowSortingFeature: TableFeature;
}

/** TanStack features `hell-tanstack-pagination` requires. */
export interface HellTanStackPaginationFeatures extends TableFeatures {
  rowPaginationFeature: TableFeature;
}

/**
 * TanStack features `hell-tanstack-global-filter` requires.
 *
 * `globalFilteringFeature` builds on column filtering state in v9, so TanStack
 * itself requires both to be registered together.
 */
export interface HellTanStackGlobalFilterFeatures extends TableFeatures {
  columnFilteringFeature: TableFeature;
  globalFilteringFeature: TableFeature;
}

/** TanStack features `hell-tanstack-column-filter` requires. */
export interface HellTanStackColumnFilterFeatures extends TableFeatures {
  columnFilteringFeature: TableFeature;
}

/**
 * Requires the state atoms a shell reads.
 *
 * v9 replaced `table.getState()` with one signal-backed atom per state slice.
 * Code generic over `TFeatures` sees `table.atoms` through TanStack's broadened
 * all-features map, where each slice is optional, so naming the slices a shell
 * needs is what keeps those reads type-checked. The values stay optional
 * exactly as TanStack declares them, which is why every read below falls back
 * to TanStack's own default state rather than to a value Hell invents.
 *
 * Exported only because it appears in the shells' `table` input signatures.
 * Callers never name it: passing a TanStack table satisfies it structurally.
 */
export type ɵHellTableAtoms<TSlice extends keyof Atoms_All> = {
  readonly atoms: Required<Pick<Atoms_All, TSlice>>;
};

const HELL_TANSTACK_FILTER_INPUT_UI = {
  root: 'min-w-[calc(var(--spacing)*44)] max-w-full rounded-hell-sm px-hell-2',
} satisfies HellUi<'root'>;

/** Public parts of the HellTanStackTable shell, styleable through its Part Style Map. */
export type HellTanStackTablePart = 'root' | 'toolbar' | 'footer' | 'scrollport';
/** Part Style Map accepted by the HellTanStackTable `ui` input. */
export type HellTanStackTableUi = HellUi<HellTanStackTablePart>;

/**
 * Public parts of the HellTanStackPagination control, styleable through its Part Style Map.
 *
 * The rows-per-page `<select>` is a nested `hellNativeSelect`; refine it through that
 * primitive's own `root` part rather than a shell part, so there is a single Part-Class
 * Pipeline over its DOM. Only the owned `pageSize` label wrapper is a shell part.
 */
export type HellTanStackPaginationPart = 'root' | 'pageSize';
/** Part Style Map accepted by the HellTanStackPagination `ui` input. */
export type HellTanStackPaginationUi = HellUi<HellTanStackPaginationPart>;

const HELL_TANSTACK_TABLE_RECIPE = {
  root: 'block min-w-0 overflow-clip text-hell-foreground bg-hell-surface-elevated border border-hell-border rounded-md shadow-hell-xs',
  toolbar:
    'flex min-h-[calc(var(--spacing)*10)] flex-wrap items-center gap-hell-2 px-hell-3 py-hell-2 text-[12px] text-hell-foreground-muted border-b border-hell-border bg-hell-surface-subtle',
  footer:
    'flex min-h-[calc(var(--spacing)*10)] flex-wrap items-center justify-end gap-hell-2 px-hell-3 py-hell-2 text-[12px] text-hell-foreground-muted border-t border-hell-border bg-hell-surface-elevated max-[640px]:items-start max-[640px]:justify-start max-[640px]:gap-hell-3',
  scrollport: 'max-w-full overflow-auto overscroll-x-contain',
} satisfies HellRecipe<HellTanStackTablePart>;

const HELL_TANSTACK_PAGINATION_RECIPE = {
  root: 'inline-flex min-w-0 flex-wrap items-center gap-hell-2 max-[640px]:w-full max-[640px]:gap-hell-3',
  pageSize: 'inline-flex items-center gap-hell-2 whitespace-nowrap max-[640px]:basis-full',
} satisfies HellRecipe<HellTanStackPaginationPart>;

/** Refines the rows-per-page `<select>` through the nested `hellNativeSelect` root part. */
const HELL_TANSTACK_PAGINATION_SELECT_UI = {
  root: 'min-w-[calc(var(--spacing)*18)] max-[640px]:min-w-[calc(var(--spacing)*20)]',
} satisfies HellUi<'root'>;

/**
 * Class value accepted by the `rowClass` input and the `hell` column meta
 * (`headerClass`/`cellClass`/`footerClass`): a class string, a class list, or
 * an `ngClass`-style toggle record.
 */
export type HellClassValue =
  | string
  | readonly string[]
  | Readonly<Record<string, boolean | null | undefined>>
  | null
  | undefined;

export type HellTanStackRowClass<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
> = {
  bivarianceHack(row: Row<TFeatures, TData>): HellClassValue;
}['bivarianceHack'];

export type HellTableStatusValue =
  | { readonly kind: 'ready' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'error'; readonly error: unknown };

export const HellTableStatus = {
  READY: { kind: 'ready' } as HellTableStatusValue,
  LOADING: { kind: 'loading' } as HellTableStatusValue,
  error(error: unknown): HellTableStatusValue {
    return { kind: 'error', error };
  },
} as const;

export interface HellTableStatusViews {
  readonly loading?: Type<unknown>;
  readonly empty?: Type<unknown>;
  readonly error?: Type<unknown>;
}

export const HELL_TABLE_STATUS_VIEWS = new InjectionToken<HellTableStatusViews>(
  'HELL_TABLE_STATUS_VIEWS',
  { factory: () => ({}) },
);

export function provideHellTableStatusViews(views: HellTableStatusViews): Provider {
  return { provide: HELL_TABLE_STATUS_VIEWS, useValue: views };
}

export type ɵHellTanStackBodyItemKind = 'row' | 'expanded';

export interface ɵHellTanStackBodyItem<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
> {
  readonly row: Row<TFeatures, TData>;
  readonly key: string;
  readonly kind: ɵHellTanStackBodyItemKind;
}

export interface ɵHellTanStackBodyStrategy<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
> {
  rows(
    items: readonly ɵHellTanStackBodyItem<TFeatures, TData>[],
  ): readonly ɵHellTanStackBodyItem<TFeatures, TData>[];
  connectScrollport?(el: HTMLElement, writer: ɵHellDomWriter): ɵHellStrategyCleanup;
  connectBody?(el: HTMLElement, writer: ɵHellDomWriter): ɵHellStrategyCleanup;
  connectRow?(
    el: HTMLElement,
    item: ɵHellTanStackBodyItem<TFeatures, TData>,
    writer: ɵHellDomWriter,
  ): ɵHellStrategyCleanup;
}

export const ɵHELL_TANSTACK_BODY_STRATEGY = new InjectionToken<ɵHellTanStackBodyStrategy>(
  'ɵHELL_TANSTACK_BODY_STRATEGY',
);

export class ɵHellDomWriter {
  private readonly cleanups: VoidFunction[] = [];

  data(el: HTMLElement, name: string, value: string | null | undefined): void {
    const attr = `data-hell-${normalizeDomName(name)}`;
    if (value === null || value === undefined) {
      el.removeAttribute(attr);
      return;
    }
    el.setAttribute(attr, value);
    this.cleanups.push(() => el.removeAttribute(attr));
  }

  cssVar(el: HTMLElement, name: string, value: string | null | undefined): void {
    const property = name.startsWith('--') ? name : `--hell-${normalizeDomName(name)}`;
    if (value === null || value === undefined) {
      el.style.removeProperty(property);
      return;
    }
    el.style.setProperty(property, value);
    this.cleanups.push(() => el.style.removeProperty(property));
  }

  cleanup(_el?: HTMLElement): void {
    for (const cleanup of this.cleanups.splice(0).reverse()) cleanup();
  }
}

@Directive({
  selector: '[hellTanStackInternalBodyScrollport]',
  standalone: true,
})
export class ɵHellTanStackBodyScrollportConnector implements AfterViewInit, OnChanges, OnDestroy {
  readonly strategy = input<ɵHellTanStackBodyStrategy | null>(null, {
    alias: 'hellTanStackInternalBodyScrollport',
  });

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private viewReady = false;
  private cleanup: VoidFunction = () => {};

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.reconnect();
  }

  ngOnChanges(): void {
    this.reconnect();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private reconnect(): void {
    if (!this.viewReady) return;
    this.cleanup();
    const strategy = this.strategy();
    if (!strategy?.connectScrollport) {
      this.cleanup = () => {};
      return;
    }
    const writer = new ɵHellDomWriter();
    const strategyCleanup = strategy.connectScrollport(this.el, writer);
    this.cleanup = () => {
      if (strategyCleanup) strategyCleanup();
      writer.cleanup(this.el);
    };
  }
}

@Directive({
  selector: '[hellTanStackInternalBody]',
  standalone: true,
})
export class ɵHellTanStackBodyConnector implements AfterViewInit, OnChanges, OnDestroy {
  readonly strategy = input<ɵHellTanStackBodyStrategy | null>(null, {
    alias: 'hellTanStackInternalBody',
  });

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private viewReady = false;
  private cleanup: VoidFunction = () => {};

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.reconnect();
  }

  ngOnChanges(): void {
    this.reconnect();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private reconnect(): void {
    if (!this.viewReady) return;
    this.cleanup();
    const strategy = this.strategy();
    if (!strategy?.connectBody) {
      this.cleanup = () => {};
      return;
    }
    const writer = new ɵHellDomWriter();
    const strategyCleanup = strategy.connectBody(this.el, writer);
    this.cleanup = () => {
      if (strategyCleanup) strategyCleanup();
      writer.cleanup(this.el);
    };
  }
}

@Directive({
  selector: '[hellTanStackInternalBodyItemConnector]',
  standalone: true,
})
export class ɵHellTanStackBodyItemConnector implements AfterViewInit, OnChanges, OnDestroy {
  readonly strategy = input<ɵHellTanStackBodyStrategy | null>(null, {
    alias: 'hellTanStackInternalBodyItemConnector',
  });
  readonly item = input.required<ɵHellTanStackBodyItem>({
    alias: 'hellTanStackInternalBodyItem',
  });

  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private viewReady = false;
  private cleanup: VoidFunction = () => {};

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.reconnect();
  }

  ngOnChanges(): void {
    this.reconnect();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private reconnect(): void {
    if (!this.viewReady) return;
    this.cleanup();
    const strategy = this.strategy();
    if (!strategy?.connectRow) {
      this.cleanup = () => {};
      return;
    }
    const writer = new ɵHellDomWriter();
    const strategyCleanup = strategy.connectRow(this.el, this.item(), writer);
    this.cleanup = () => {
      if (strategyCleanup) strategyCleanup();
      writer.cleanup(this.el);
    };
  }
}

@Directive({ selector: 'ng-template[hellTableShellHeader]' })
export class HellTableShellHeader<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
  TValue = unknown,
> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellHeader' });
  readonly template =
    inject<TemplateRef<HellTableShellHeaderContext<TFeatures, TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellCell]' })
export class HellTableShellCell<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
  TValue = unknown,
> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellCell' });
  readonly template =
    inject<TemplateRef<HellTableShellCellContext<TFeatures, TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellFooterCell]' })
export class HellTableShellFooterCell<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
  TValue = unknown,
> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellFooterCell' });
  readonly template =
    inject<TemplateRef<HellTableShellHeaderContext<TFeatures, TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellExpandedRow]' })
export class HellTableShellExpandedRow<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
> {
  readonly template =
    inject<TemplateRef<HellTableShellExpandedRowContext<TFeatures, TData>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellLoading]' })
export class HellTableShellLoading {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellEmpty]' })
export class HellTableShellEmpty {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellError]' })
export class HellTableShellError {
  readonly template = inject<TemplateRef<{ $implicit: unknown; error: unknown }>>(TemplateRef);
}

@Directive({
  selector: '[hellTableShellToolbar]',
  host: { '[attr.data-hell-table-shell-toolbar-item]': '""' },
})
export class HellTableShellToolbar {}

@Directive({
  selector: '[hellTableShellFooter]',
  host: { '[attr.data-hell-table-shell-footer-item]': '""' },
})
export class HellTableShellFooter {}

export interface HellTableShellCellContext<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
  TValue = unknown,
> {
  readonly $implicit: Cell<TFeatures, TData, TValue>;
  readonly cell: Cell<TFeatures, TData, TValue>;
  readonly row: Row<TFeatures, TData>;
  readonly column: Column<TFeatures, TData, TValue>;
  readonly table: Table<TFeatures, TData>;
}

export interface HellTableShellHeaderContext<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
  TValue = unknown,
> {
  readonly $implicit: Header<TFeatures, TData, TValue>;
  readonly header: Header<TFeatures, TData, TValue>;
  readonly column: Column<TFeatures, TData, TValue>;
  readonly table: Table<TFeatures, TData>;
}

export interface HellTableShellExpandedRowContext<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
> {
  readonly $implicit: Row<TFeatures, TData>;
  readonly row: Row<TFeatures, TData>;
  readonly table: Table<TFeatures, TData>;
}

/** Mutable state both sides of one resize transaction share while it runs. */
interface HellColumnResizeTransaction {
  /** Rendered pixels per TanStack unit, latched for the life of the transaction. */
  scale: number;
  /** Sizes this transaction has written so far, keyed by column id. */
  writes: Readonly<Record<string, number>>;
}

interface HellColumnMeta {
  readonly hell?: {
    readonly headerClass?: HellClassValue;
    readonly cellClass?: HellClassValue;
    readonly footerClass?: HellClassValue;
  };
}

@Component({
  selector: 'hell-tanstack-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FlexRenderDirective,
    ...HELL_TABLE_UTILITIES_IMPORTS,
    ɵHellTanStackBodyScrollportConnector,
    ɵHellTanStackBodyConnector,
    ɵHellTanStackBodyItemConnector,
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-sticky-header]': 'stickyHeader() ? "true" : null',
    '[attr.data-hell-tanstack-resizable-columns]': 'columnResizingEnabled() ? "true" : null',
    '[attr.data-status]': 'status().kind',
  },
  template: `
    @if (hasToolbar()) {
      <div [class]="part('toolbar')" data-slot="toolbar" data-hell-table-shell-toolbar>
        <ng-content select="[hellTableShellToolbar]" />
      </div>
    }

    <div
      [class]="part('scrollport')"
      data-slot="scrollport"
      data-hell-table-shell-scrollport
      [hellTanStackInternalBodyScrollport]="bodyStrategyBridge()"
    >
      <table
        #shellTable
        hellTableRoot
        class="hell-table-shell-table"
        data-hell-table-shell-table
        [style.--hell-table-total-size.px]="tableTotalSize()"
      >
        <colgroup>
          @for (column of visibleLeafColumns(); track column.id) {
            <col [style.width.px]="columnSize(column)" />
          }
        </colgroup>
        <thead hellTableHeader data-hell-table-shell-head>
          @for (headerGroup of headerGroups(); track headerGroup.id) {
            <tr hellTableRow data-hell-table-shell-header-row>
              @for (header of headerGroup.headers; track header.id) {
                <th
                  hellTableHeaderCell
                  [ui]="headerClass(header)"
                  [attr.colspan]="header.colSpan"
                  [columnId]="header.column.id"
                  [attr.data-pinned]="pinnedSide(header.column)"
                  [attr.data-pinned-last]="pinnedLast(header.column)"
                  [attr.data-pinned-first]="pinnedFirst(header.column)"
                  [sortable]="sortable(header)"
                  [sort]="sortState(header)"
                  [style.--hell-table-pinned-start.px]="pinnedStart(header.column)"
                  [style.--hell-table-pinned-after.px]="pinnedAfter(header.column)"
                >
                  @if (!header.isPlaceholder) {
                    @if (headerTemplateFor(header); as projected) {
                      <ng-container
                        [ngTemplateOutlet]="projected.template"
                        [ngTemplateOutletContext]="headerContext(header)"
                      />
                    } @else {
                      @if (sortable(header)) {
                        <button
                          hellTableSortTrigger
                          type="button"
                          [attr.aria-label]="sortButtonLabel(header)"
                          (click)="toggleSorting(header, $event)"
                        >
                          <ng-container
                            *flexRender="
                              header.column.columnDef.header;
                              props: header.getContext();
                              let rendered
                            "
                          >
                            {{ rendered ?? header.column.id }}
                          </ng-container>
                        </button>
                      } @else {
                        <ng-container
                          *flexRender="
                            header.column.columnDef.header;
                            props: header.getContext();
                            let rendered
                          "
                        >
                          {{ rendered ?? header.column.id }}
                        </ng-container>
                      }
                    }

                    <!--
                      Inside the placeholder guard: a placeholder header still
                      carries the leaf column, so a separator outside it would
                      render a second handle for the same pair in whichever
                      grouped header row padded that column out.
                    -->
                    @if (resizeAdapterFor(header); as resizeAdapter) {
                      <button
                        hellTableResizeHandle
                        type="button"
                        data-hell-table-shell-resize-handle
                        [resizeAdapter]="resizeAdapter"
                        [aria-label]="resizeHandleLabel(header)"
                      ></button>
                    }
                  }
                </th>
              }
            </tr>
          }
        </thead>

        <tbody
          hellTableBody
          data-hell-table-shell-body
          [hellTanStackInternalBody]="bodyStrategyBridge()"
        >
          @switch (displayState()) {
            @case ('loading') {
              <tr hellTableRow data-hell-table-shell-status-row>
                <td hellTableCell [attr.colspan]="visibleColumnCount()">
                  <ng-container [ngTemplateOutlet]="loadingTemplate()?.template ?? null" />
                  @if (!loadingTemplate()) {
                    <ng-container
                      *ngComponentOutlet="
                        providerViews.loading ?? null;
                        inputs: statusComponentInputs()
                      "
                    />
                  }
                </td>
              </tr>
            }
            @case ('error') {
              <tr hellTableRow data-hell-table-shell-status-row>
                <td hellTableCell [attr.colspan]="visibleColumnCount()">
                  <ng-container
                    [ngTemplateOutlet]="errorTemplate()?.template ?? null"
                    [ngTemplateOutletContext]="errorContext()"
                  />
                  @if (!errorTemplate()) {
                    <ng-container
                      *ngComponentOutlet="
                        providerViews.error ?? null;
                        inputs: statusComponentInputs(errorValue())
                      "
                    />
                  }
                </td>
              </tr>
            }
            @case ('empty') {
              <tr hellTableRow data-hell-table-shell-status-row>
                <td hellTableCell [attr.colspan]="visibleColumnCount()">
                  <ng-container [ngTemplateOutlet]="emptyTemplate()?.template ?? null" />
                  @if (!emptyTemplate()) {
                    <ng-container
                      *ngComponentOutlet="
                        providerViews.empty ?? null;
                        inputs: statusComponentInputs()
                      "
                    />
                  }
                </td>
              </tr>
            }
            @default {
              @for (item of bodyItems(); track item.key) {
                @if (item.kind === 'expanded') {
                  <tr
                    hellTableRow
                    data-hell-table-shell-expanded-row
                    [hellTanStackInternalBodyItemConnector]="bodyStrategyBridge()"
                    [hellTanStackInternalBodyItem]="bodyItemBridge(item)"
                  >
                    <td
                      hellTableCell
                      class="hell-table-shell-expanded-cell"
                      data-hell-table-shell-expanded-cell
                      [attr.colspan]="visibleColumnCount()"
                    >
                      @if (expandedRowTemplate(); as expanded) {
                        <ng-container
                          [ngTemplateOutlet]="expanded.template"
                          [ngTemplateOutletContext]="expandedRowContext(item.row)"
                        />
                      }
                    </td>
                  </tr>
                } @else {
                  <tr
                    hellTableRow
                    [ui]="rowClassValue(item.row)"
                    data-hell-table-shell-row
                    [hellTanStackInternalBodyItemConnector]="bodyStrategyBridge()"
                    [hellTanStackInternalBodyItem]="bodyItemBridge(item)"
                  >
                    @for (cell of rowCells(item.row); track cell.id) {
                      <td
                        hellTableCell
                        [ui]="cellClass(cell)"
                        [attr.data-column-id]="cell.column.id"
                        [attr.data-pinned]="pinnedSide(cell.column)"
                        [attr.data-pinned-last]="pinnedLast(cell.column)"
                        [attr.data-pinned-first]="pinnedFirst(cell.column)"
                        [style.--hell-table-column-size.px]="columnSize(cell.column)"
                        [style.--hell-table-column-grow]="columnSize(cell.column)"
                        [style.--hell-table-pinned-start.px]="pinnedStart(cell.column)"
                        [style.--hell-table-pinned-after.px]="pinnedAfter(cell.column)"
                      >
                        @if (cellTemplateFor(cell); as projected) {
                          <ng-container
                            [ngTemplateOutlet]="projected.template"
                            [ngTemplateOutletContext]="cellContext(cell)"
                          />
                        } @else if (cell.column.columnDef.cell) {
                          <ng-container
                            *flexRender="
                              cell.column.columnDef.cell;
                              props: cell.getContext();
                              let rendered
                            "
                          >
                            {{ rendered }}
                          </ng-container>
                        } @else {
                          {{ cell.renderValue() }}
                        }
                      </td>
                    }
                  </tr>
                }
              }
            }
          }
        </tbody>

        @if (hasFooters()) {
          <tfoot data-hell-table-shell-foot>
            @for (footerGroup of footerGroups(); track footerGroup.id) {
              <tr hellTableRow data-hell-table-shell-footer-row>
                @for (footer of footerGroup.headers; track footer.id) {
                  <td
                    hellTableCell
                    [ui]="footerClass(footer)"
                    [attr.colspan]="footer.colSpan"
                    [attr.data-column-id]="footer.column.id"
                    [attr.data-pinned]="pinnedSide(footer.column)"
                    [attr.data-pinned-last]="pinnedLast(footer.column)"
                    [attr.data-pinned-first]="pinnedFirst(footer.column)"
                    [style.--hell-table-pinned-start.px]="pinnedStart(footer.column)"
                    [style.--hell-table-pinned-after.px]="pinnedAfter(footer.column)"
                  >
                    @if (!footer.isPlaceholder) {
                      @if (footerTemplateFor(footer); as projected) {
                        <ng-container
                          [ngTemplateOutlet]="projected.template"
                          [ngTemplateOutletContext]="headerContext(footer)"
                        />
                      } @else if (footer.column.columnDef.footer) {
                        <ng-container
                          *flexRender="
                            footer.column.columnDef.footer;
                            props: footer.getContext();
                            let rendered
                          "
                        >
                          {{ rendered }}
                        </ng-container>
                      }
                    }
                  </td>
                }
              </tr>
            }
          </tfoot>
        }
      </table>
    </div>

    @if (hasFooter()) {
      <div [class]="part('footer')" data-slot="footer" data-hell-table-shell-footer>
        <ng-content select="[hellTableShellFooter]" />
      </div>
    }
  `,
})
export class HellTanStackTable<
  TFeatures extends HellTanStackTableFeatures,
  TData extends RowData = RowData,
> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTanStackTablePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTanStackTablePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TANSTACK_TABLE_RECIPE,
  });

  readonly table =
    input.required<Table<TFeatures, TData> & ɵHellTableAtoms<'columnSizing'>>();
  readonly status = input<HellTableStatusValue>(HellTableStatus.READY);
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  readonly rowClass = input<HellTanStackRowClass<TFeatures, TData> | HellClassValue>(null);

  protected readonly providerViews = inject(HELL_TABLE_STATUS_VIEWS);
  private readonly tableLabels: HellTableUtilitiesLabels = inject(HELL_TABLE_UTILITIES_LABELS);
  private readonly shellTable = viewChild<ElementRef<HTMLTableElement>>('shellTable');
  private readonly resizePairs = new Map<
    string,
    { readonly afterId: string; readonly adapter: HellTableResizeAdapter }
  >();
  protected readonly bodyStrategy = inject(ɵHELL_TANSTACK_BODY_STRATEGY, {
    optional: true,
    self: true,
  }) as ɵHellTanStackBodyStrategy<TFeatures, TData> | null;
  private readonly headers = contentChildren(HellTableShellHeader<TFeatures, TData, unknown>, {
    descendants: true,
  });
  private readonly cells = contentChildren(HellTableShellCell<TFeatures, TData, unknown>, {
    descendants: true,
  });
  private readonly footers = contentChildren(HellTableShellFooterCell<TFeatures, TData, unknown>, {
    descendants: true,
  });
  private readonly loadingTemplates = contentChildren(HellTableShellLoading, {
    descendants: true,
  });
  private readonly emptyTemplates = contentChildren(HellTableShellEmpty, {
    descendants: true,
  });
  private readonly errorTemplates = contentChildren(HellTableShellError, {
    descendants: true,
  });
  private readonly toolbars = contentChildren(HellTableShellToolbar, {
    descendants: true,
  });
  private readonly footersShell = contentChildren(HellTableShellFooter, {
    descendants: true,
  });
  protected readonly expandedRows = contentChildren(
    HellTableShellExpandedRow<TFeatures, TData>,
    { descendants: true },
  );

  protected readonly displayState = computed(() => {
    const status = this.status();
    if (status.kind === 'loading') return this.assertStatusView('loading');
    if (status.kind === 'error') return this.assertStatusView('error');
    if (this.table().getRowModel().rows.length === 0) return this.assertStatusView('empty');
    return 'ready';
  });

  protected bodyItems(): readonly ɵHellTanStackBodyItem<TFeatures, TData>[] {
    const items = this.allBodyItems();
    return this.bodyStrategy?.rows(items) ?? items;
  }

  /**
   * Visible leaf columns in the order the table actually renders them.
   *
   * TanStack builds both header groups and row cells as start-pinned, then
   * centre, then end-pinned, while `table_getVisibleLeafColumns()` keeps the
   * original leaf order and ignores pinning. The `<colgroup>` and the resize
   * pair both index positionally against the rendered cells, so both have to
   * walk the pinned regions in that same order. Reading the flat list instead
   * only agrees while every pinned column is already leading: pinning a column
   * from further right would map `<col>` widths onto the wrong columns and pair
   * each resize separator with the wrong neighbour.
   */
  protected visibleLeafColumns(): readonly Column<TFeatures, TData, unknown>[] {
    const table = this.table();
    return [
      ...table_getStartVisibleLeafColumns(table),
      ...table_getCenterVisibleLeafColumns(table),
      ...table_getEndVisibleLeafColumns(table),
    ];
  }

  protected headerGroups() {
    return this.table().getHeaderGroups();
  }

  protected footerGroups() {
    return this.table().getFooterGroups();
  }

  protected rowCells(row: Row<TFeatures, TData>): readonly Cell<TFeatures, TData, unknown>[] {
    return row_getVisibleCells(row);
  }

  protected columnSize(column: Column<TFeatures, TData, unknown>): number | null {
    this.trackColumnSizing();
    const size = column_getSize(column);
    return Number.isFinite(size) && size > 0 ? size : null;
  }

  /**
   * Registers the shell view as a reader of TanStack column sizing state.
   *
   * The Angular adapter turns table accessors into computed signals, but
   * `column_getSize()` is a plain read the view cannot track. A
   * total-preserving resize also leaves the table total at the same value, so
   * without this read the shell would keep a stale grid whenever sizing changes
   * outside its own view — a reset control in the toolbar, or restored widths.
   *
   * The `columnSizing` atom is that dependency in v9, replacing v8's
   * `getState().columnSizing`.
   */
  private trackColumnSizing(): void {
    void this.table().atoms.columnSizing?.get();
  }

  protected tableTotalSize(): number | null {
    const size = table_getTotalSize(this.table());
    return Number.isFinite(size) && size > 0 ? size : null;
  }

  /**
   * Whether the caller explicitly turned on TanStack column resizing. The shell
   * adds no resize input of its own: `enableColumnResizing` is TanStack's own
   * option, and per-column opt-out stays `columnDef.enableResizing`. Only an
   * explicit `true` counts, because TanStack treats the unset option as enabled
   * and the shell must not grow resize separators on every existing table.
   *
   * The option is read through a header context rather than off the injected
   * table: the Angular adapter proxies `get*` accessors into signals but caches
   * plain properties such as `options` on first access, so that copy goes stale
   * as soon as the caller's options recompute.
   */
  protected columnResizingEnabled(): boolean {
    const header = this.headerGroups()[0]?.headers[0];
    if (!header) return false;
    // `enableColumnResizing` belongs to the resizing feature, so a shell generic
    // over `TFeatures` reads it through TanStack's broadened options view.
    const options: TableOptions_All<TFeatures, TData> = header.getContext().table.options;
    return options.enableColumnResizing === true;
  }

  /**
   * Resize pair for one header, or `null` when the shell renders no handle:
   * grouped headers, the trailing column, and columns TanStack marks
   * unresizable have no adjacent pair to transact against.
   *
   * Adapters are memoized per leading column so the `resizeAdapter` binding
   * keeps a stable identity across change detection.
   */
  protected resizeAdapterFor(
    header: Header<TFeatures, TData, unknown>,
  ): HellTableResizeAdapter | null {
    if (!this.columnResizingEnabled()) return null;

    const before = header.column;
    const columns = this.visibleLeafColumns();
    const index = columns.findIndex((column) => column.id === before.id);
    const after = index >= 0 ? columns[index + 1] : undefined;
    if (!after || !column_getCanResize(before) || !column_getCanResize(after)) return null;

    const cached = this.resizePairs.get(before.id);
    if (cached?.afterId === after.id) return cached.adapter;

    // Both sides share one transaction so neither can half-convert its delta
    // nor overwrite the other's write.
    const transaction: HellColumnResizeTransaction = { scale: 1, writes: {} };
    const adapter: HellTableResizeAdapter = {
      before: this.resizeItemFor(before.id, after.id, transaction),
      after: this.resizeItemFor(after.id, before.id, transaction),
    };
    this.resizePairs.set(before.id, { afterId: after.id, adapter });
    return adapter;
  }

  /** Accessible name for one column's resize separator. */
  protected resizeHandleLabel(header: Header<TFeatures, TData, unknown>): string {
    return `${this.tableLabels.resizeColumn} ${header.column.id}`;
  }

  /**
   * One side of a shell resize transaction. Sizes live in TanStack's
   * `columnSizing` state — the single channel the `<colgroup>`, the header
   * grid, and the body cell size/grow variables all read — so the shell never
   * writes a competing width onto the header cell itself.
   *
   * Every value crosses the rendered/TanStack boundary through the pair's
   * render scale, because the shell table stretches past `getTotalSize()`
   * whenever the scrollport is wider than the columns.
   *
   * The scale is latched on `measure()` — the resize runtime reads both start
   * sizes before it writes anything — and reused for the rest of the
   * transaction. Recomputing it per call would read a `getTotalSize()` that
   * already contains this transaction's first write, so the two sides would
   * convert at different rates and the pair total would creep on every move.
   * `measure()` also opens a fresh write set, so a new drag starts from
   * TanStack's own state rather than from what the last one left behind.
   */
  private resizeItemFor(
    columnId: string,
    otherColumnId: string,
    transaction: HellColumnResizeTransaction,
  ): HellTableResizeItem {
    return {
      columnId,
      measure: () => {
        transaction.scale = this.columnRenderScale();
        transaction.writes = {};
        return this.columnUnits(columnId) * transaction.scale;
      },
      minSize: () => this.resizeMinUnits(columnId, otherColumnId) * transaction.scale,
      setSize: (px) => this.writeColumnSize(transaction, columnId, px / transaction.scale),
    };
  }

  /**
   * Lower bound for one side in TanStack units: its own `minSize`, raised so
   * the opposite side cannot pass its `maxSize`. Both bounds stay TanStack's;
   * the shell only translates them into the pair contract the resize handle
   * clamps against.
   */
  private resizeMinUnits(columnId: string, otherColumnId: string): number {
    const own = this.columnBounds(columnId);
    const other = this.columnBounds(otherColumnId);
    const sum = this.columnUnits(columnId) + this.columnUnits(otherColumnId);
    return Math.max(own.min, sum - other.max);
  }

  private columnUnits(columnId: string): number {
    const column = this.table().getColumn(columnId);
    const size = column ? column_getSize(column) : 0;
    return Number.isFinite(size) && size > 0 ? size : 0;
  }

  /**
   * TanStack merges its sizing defaults into every `columnDef`, so a column that
   * still exists always answers with concrete bounds. The fallbacks only cover a
   * column disappearing between two reads, and deliberately reuse TanStack's own
   * defaults so the shell never invents a bound of its own.
   *
   * The bounds live on the sizing slice of the column definition, so they are
   * read through TanStack's broadened `ColumnDefBase_All` view rather than by
   * pinning a feature set on the shell.
   */
  private columnBounds(columnId: string): { readonly min: number; readonly max: number } {
    const columnDef: ColumnDefBase_All<TFeatures, TData, unknown> | undefined = this.table()
      .getColumn(columnId)
      ?.columnDef;
    const defaults = getDefaultColumnSizingColumnDef();
    return {
      min: columnDef?.minSize ?? defaults.minSize,
      max: columnDef?.maxSize ?? defaults.maxSize,
    };
  }

  /**
   * Rendered CSS pixels per TanStack size unit. Under `table-layout: fixed` the
   * shell table stretches its columns proportionally when it is wider than
   * `getTotalSize()`, so a pointer delta measured on screen is that much larger
   * than the size delta TanStack should record.
   */
  private columnRenderScale(): number {
    const element = this.shellTable()?.nativeElement;
    const total = table_getTotalSize(this.table());
    if (!element || !Number.isFinite(total) || total <= 0) return 1;
    const rendered = element.getBoundingClientRect().width;
    return rendered > 0 ? rendered / total : 1;
  }

  /**
   * Records one side's size and republishes the whole transaction in a single
   * `columnSizing` updater.
   *
   * The resize runtime writes both sides back to back with no render in
   * between, and TanStack's own `columnSizing` state does not refresh between
   * two synchronous updaters: the Angular adapter's `onStateChange` closes over
   * the state captured when its options last recomputed, and the table proxy
   * caches `setColumnSizing` after the first access. A per-side updater would
   * therefore compute the second write from the same state as the first and
   * drop the leading column's size, leaving the pair total — and with it
   * `getTotalSize()` — drifting by the whole delta on every move. Carrying the
   * accumulated writes makes each call land both sides at once, which is also
   * correct when the caller controls `columnSizing` through a signal.
   */
  private writeColumnSize(
    transaction: HellColumnResizeTransaction,
    columnId: string,
    size: number,
  ): void {
    transaction.writes = { ...transaction.writes, [columnId]: size };
    const { writes } = transaction;
    table_setColumnSizing(this.table(), (current) => ({ ...current, ...writes }));
  }

  private allBodyItems(): readonly ɵHellTanStackBodyItem<TFeatures, TData>[] {
    const expanded = this.expandedRowTemplate();
    const items: ɵHellTanStackBodyItem<TFeatures, TData>[] = [];
    for (const row of this.table().getRowModel().rows) {
      items.push({ kind: 'row', row, key: row.id });
      if (expanded && row_getIsExpanded(row)) {
        items.push({ kind: 'expanded', row, key: `${row.id}:expanded` });
      }
    }
    return items;
  }

  protected visibleColumnCount(): number {
    return Math.max(this.visibleLeafColumns().length, 1);
  }

  protected loadingTemplate(): HellTableShellLoading | null {
    return this.loadingTemplates()[0] ?? null;
  }

  protected emptyTemplate(): HellTableShellEmpty | null {
    return this.emptyTemplates()[0] ?? null;
  }

  protected errorTemplate(): HellTableShellError | null {
    return this.errorTemplates()[0] ?? null;
  }

  protected hasToolbar(): boolean {
    return this.toolbars().length > 0;
  }

  protected hasFooter(): boolean {
    return this.footersShell().length > 0;
  }

  protected hasFooters(): boolean {
    return this.footerGroups().some((group) =>
      group.headers.some(
        (header) =>
          !header.isPlaceholder &&
          (header.column.columnDef.footer || this.templateFor(this.footers(), header.column.id)),
      ),
    );
  }

  protected headerTemplateFor(header: Header<TFeatures, TData, unknown>) {
    const template = this.templateFor(this.headers(), header.column.id);
    this.assertNoRendererConflict(
      'header',
      header.column.id,
      template,
      header.column.columnDef.header,
    );
    return template;
  }

  protected cellTemplateFor(cell: Cell<TFeatures, TData, unknown>) {
    const template = this.templateFor(this.cells(), cell.column.id);
    this.assertNoRendererConflict(
      'cell',
      cell.column.id,
      template,
      this.explicitCellRenderer(cell),
    );
    return template;
  }

  protected footerTemplateFor(header: Header<TFeatures, TData, unknown>) {
    const template = this.templateFor(this.footers(), header.column.id);
    this.assertNoRendererConflict(
      'footer',
      header.column.id,
      template,
      header.column.columnDef.footer,
    );
    return template;
  }

  protected expandedRowTemplate() {
    return this.expandedRows()[0] ?? null;
  }

  protected bodyStrategyBridge(): ɵHellTanStackBodyStrategy | null {
    return this.bodyStrategy as unknown as ɵHellTanStackBodyStrategy | null;
  }

  protected bodyItemBridge(item: ɵHellTanStackBodyItem<TFeatures, TData>): ɵHellTanStackBodyItem {
    return item as unknown as ɵHellTanStackBodyItem;
  }

  protected cellContext(
    cell: Cell<TFeatures, TData, unknown>,
  ): HellTableShellCellContext<TFeatures, TData, unknown> {
    return {
      $implicit: cell,
      cell,
      row: cell.row,
      column: cell.column,
      table: cell.getContext().table,
    };
  }

  protected headerContext(
    header: Header<TFeatures, TData, unknown>,
  ): HellTableShellHeaderContext<TFeatures, TData, unknown> {
    return {
      $implicit: header,
      header,
      column: header.column,
      table: header.getContext().table,
    };
  }

  protected expandedRowContext(
    row: Row<TFeatures, TData>,
  ): HellTableShellExpandedRowContext<TFeatures, TData> {
    return { $implicit: row, row, table: this.table() };
  }

  protected errorValue(): unknown {
    const status = this.status();
    return status.kind === 'error' ? status.error : null;
  }

  protected errorContext(): { $implicit: unknown; error: unknown } {
    const error = this.errorValue();
    return { $implicit: error, error };
  }

  protected statusComponentInputs(error?: unknown): Record<string, unknown> {
    return arguments.length > 0 ? { error } : {};
  }

  protected headerClass(header: Header<TFeatures, TData, unknown>): string {
    return classValue(hellColumnMeta(header.column.columnDef.meta)?.hell?.headerClass);
  }

  protected cellClass(cell: Cell<TFeatures, TData, unknown>): string {
    return classValue(hellColumnMeta(cell.column.columnDef.meta)?.hell?.cellClass);
  }

  protected footerClass(header: Header<TFeatures, TData, unknown>): string {
    return classValue(hellColumnMeta(header.column.columnDef.meta)?.hell?.footerClass);
  }

  protected rowClassValue(row: Row<TFeatures, TData>): string {
    const value = this.rowClass();
    return classValue(typeof value === 'function' ? value(row) : value);
  }

  protected sortable(header: Header<TFeatures, TData, unknown>): boolean {
    return column_getCanSort(header.column);
  }

  protected sortState(header: Header<TFeatures, TData, unknown>): 'asc' | 'desc' | null {
    const sorted = column_getIsSorted(header.column);
    return sorted === 'asc' || sorted === 'desc' ? sorted : null;
  }

  protected sortButtonLabel(header: Header<TFeatures, TData, unknown>): string {
    const sort = this.sortState(header);
    const next = sort === 'asc' ? 'descending' : sort === 'desc' ? 'clear sorting' : 'ascending';
    return `Sort ${header.column.id} ${next}`;
  }

  protected toggleSorting(header: Header<TFeatures, TData, unknown>, event: MouseEvent): void {
    column_getToggleSortingHandler(header.column)?.(event);
  }

  /**
   * Logical pinned side. v9 dropped the physical `'left'`/`'right'` aliases, so
   * the shell publishes `'start'`/`'end'` and the stylesheet resolves them
   * against the writing direction through CSS logical properties.
   */
  protected pinnedSide(column: Column<TFeatures, TData, unknown>): 'start' | 'end' | null {
    return column_getIsPinned(column) || null;
  }

  protected pinnedStart(column: Column<TFeatures, TData, unknown>): number | null {
    return column_getIsPinned(column) === 'start' ? column_getStart(column, 'start') : null;
  }

  protected pinnedAfter(column: Column<TFeatures, TData, unknown>): number | null {
    return column_getIsPinned(column) === 'end' ? column_getAfter(column, 'end') : null;
  }

  /**
   * Pinned-edge flags, which the stylesheet uses to draw the separating shadow
   * on the column that borders the scrolling centre region.
   *
   * These read the pinned regions directly instead of v8's
   * `getIsLastColumn`/`getIsFirstColumn`, which live on the column ordering
   * feature in v9 — asking pinning for its own edges keeps `columnOrderingFeature`
   * out of the shell's requirements.
   */
  protected pinnedLast(column: Column<TFeatures, TData, unknown>): 'true' | null {
    if (column_getIsPinned(column) !== 'start') return null;
    const pinned = table_getStartVisibleLeafColumns(this.table());
    return pinned[pinned.length - 1]?.id === column.id ? 'true' : null;
  }

  protected pinnedFirst(column: Column<TFeatures, TData, unknown>): 'true' | null {
    if (column_getIsPinned(column) !== 'end') return null;
    return table_getEndVisibleLeafColumns(this.table())[0]?.id === column.id ? 'true' : null;
  }

  private templateFor<TTemplate extends { columnId(): string }>(
    templates: readonly TTemplate[],
    columnId: string,
  ): TTemplate | null {
    return templates.find((template) => template.columnId() === columnId) ?? null;
  }

  private assertNoRendererConflict(
    kind: 'header' | 'cell' | 'footer',
    columnId: string,
    template: unknown,
    renderer: unknown,
  ): void {
    if (!isDevMode() || !template || renderer === null || renderer === undefined) return;
    throw new Error(
      `Hell TanStack table ${kind} template for column "${columnId}" conflicts with TanStack columnDef.${kind}. Remove one renderer.`,
    );
  }

  private assertStatusView(kind: 'loading' | 'error' | 'empty'): 'loading' | 'error' | 'empty' {
    const local =
      kind === 'loading'
        ? this.loadingTemplates()[0]
        : kind === 'error'
          ? this.errorTemplates()[0]
          : this.emptyTemplates()[0];
    if (!isDevMode() || local || this.providerViews[kind]) return kind;
    throw new Error(
      `Hell TanStack table needs a ${kind} state template or provideHellTableStatusViews() provider.`,
    );
  }

  private explicitCellRenderer(cell: Cell<TFeatures, TData, unknown>): unknown {
    const renderer = cell.column.columnDef.cell;
    // v9 promoted the internal `_getDefaultColumnDef` to a public table API.
    return renderer === this.table().getDefaultColumnDef().cell ? undefined : renderer;
  }
}

@Component({
  selector: 'hell-default-table-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="hell-table-shell-status">Loading...</span>`,
})
export class HellDefaultTableLoadingState {}

@Component({
  selector: 'hell-default-table-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellEmptyState],
  template: `<hell-empty-state
    glyph="noData"
    [title]="copy.title"
    [description]="copy.description"
  />`,
})
export class HellDefaultTableEmptyState {
  /** Localize by providing custom status views via `provideHellTableStatusViews`. */
  protected readonly copy = HELL_EMPTY_STATE_COPY.noData;
}

@Component({
  selector: 'hell-default-table-error-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="hell-table-shell-status">Could not load rows.</span>`,
})
export class HellDefaultTableErrorState {
  readonly error = input<unknown>(null);
}

@Component({
  selector: 'hell-tanstack-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNativeSelect, HellPaginationStrip],
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: `
    <hell-pagination
      [page]="currentPage()"
      [pageCount]="pageCount()"
      [siblingCount]="1"
      (pageChange)="setPage($any($event))"
    />
    @if (pageSizeOptions().length) {
      <label [class]="part('pageSize')" data-slot="pageSize">
        <span>Rows</span>
        <select
          hellNativeSelect
          size="sm"
          [ui]="pageSizeSelectUi"
          [value]="pageSize()"
          (change)="setPageSize($event)"
        >
          @for (size of pageSizeOptions(); track size) {
            <option [value]="size" [selected]="size === pageSize()">{{ size }}</option>
          }
        </select>
      </label>
    }
  `,
})
export class HellTanStackPagination<
  TFeatures extends HellTanStackPaginationFeatures,
  TData extends RowData = RowData,
> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTanStackPaginationPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTanStackPaginationPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TANSTACK_PAGINATION_RECIPE,
  });

  /** Refines the nested rows-per-page `hellNativeSelect` through its own root part. */
  protected readonly pageSizeSelectUi = HELL_TANSTACK_PAGINATION_SELECT_UI;

  readonly table = input.required<Table<TFeatures, TData> & ɵHellTableAtoms<'pagination'>>();
  readonly pageSizeOptions = input<readonly number[]>([]);

  /** v9 reads pagination through its state atom rather than `getState()`. */
  private paginationState() {
    return this.table().atoms.pagination?.get() ?? getDefaultPaginationState();
  }

  protected currentPage(): number {
    return this.paginationState().pageIndex + 1;
  }

  protected pageCount(): number {
    return table_getPageCount(this.table()) || 1;
  }

  protected pageSize(): number {
    return this.paginationState().pageSize;
  }

  protected setPage(page: number): void {
    table_setPageIndex(this.table(), Math.max(page - 1, 0));
  }

  protected setPageSize(event: Event): void {
    const size = Number((event.target as HTMLSelectElement | null)?.value);
    if (Number.isFinite(size) && size > 0) table_setPageSize(this.table(), size);
  }
}

@Component({
  selector: 'hell-tanstack-global-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_IMPORTS],
  template: `
    <div hellSearch class="hell-tanstack-filter-search">
      <input
        hellInput
        size="sm"
        type="search"
        [ui]="filterInputUi"
        [attr.placeholder]="placeholder()"
        [value]="value()"
        (input)="setFilter($event)"
      />
      <button
        hellButton
        hellSearchClear
        size="sm"
        variant="ghost"
        type="button"
        (click)="clearFilter()"
      >
        Clear
      </button>
    </div>
  `,
})
export class HellTanStackGlobalFilter<
  TFeatures extends HellTanStackGlobalFilterFeatures,
  TData extends RowData = RowData,
> {
  readonly table = input.required<Table<TFeatures, TData> & ɵHellTableAtoms<'globalFilter'>>();
  readonly placeholder = input('Filter rows');
  protected readonly filterInputUi = HELL_TANSTACK_FILTER_INPUT_UI;

  /** v9 reads the global filter through its state atom rather than `getState()`. */
  protected value(): string {
    return filterInputValue(this.table().atoms.globalFilter?.get());
  }

  protected setFilter(event: Event): void {
    table_setGlobalFilter(this.table(), (event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected clearFilter(): void {
    table_setGlobalFilter(this.table(), '');
  }
}

@Component({
  selector: 'hell-tanstack-column-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_IMPORTS],
  template: `
    <div hellSearch class="hell-tanstack-filter-search">
      <input
        hellInput
        size="sm"
        type="search"
        [ui]="filterInputUi"
        [attr.placeholder]="placeholder()"
        [value]="value()"
        (input)="setFilter($event)"
      />
      <button
        hellButton
        hellSearchClear
        size="sm"
        variant="ghost"
        type="button"
        (click)="clearFilter()"
      >
        Clear
      </button>
    </div>
  `,
})
export class HellTanStackColumnFilter<
  TFeatures extends HellTanStackColumnFilterFeatures,
  TData extends RowData = RowData,
> {
  readonly table = input.required<Table<TFeatures, TData>>();
  readonly columnId = input.required<string>();
  readonly placeholder = input('Filter column');
  protected readonly filterInputUi = HELL_TANSTACK_FILTER_INPUT_UI;

  protected readonly column = computed(() => this.table().getColumn(this.columnId()));
  protected readonly value = computed(() => {
    const column = this.column();
    return column ? filterInputValue(column_getFilterValue(column)) : '';
  });

  protected setFilter(event: Event): void {
    const column = this.column();
    if (column) {
      column_setFilterValue(column, (event.target as HTMLInputElement | null)?.value ?? '');
    }
  }

  protected clearFilter(): void {
    const column = this.column();
    if (column) column_setFilterValue(column, '');
  }
}

function classValue(value: HellClassValue): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  return Object.entries(value)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name)
    .join(' ');
}

function hellColumnMeta(value: unknown): HellColumnMeta | undefined {
  if (typeof value !== 'object' || value === null || !('hell' in value)) return undefined;
  return value as HellColumnMeta;
}

function filterInputValue(value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  return '';
}

function normalizeDomName(name: string): string {
  return name
    .replace(/^data-hell-/, '')
    .replace(/^--hell-/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** All directives that make up the TanStack Table entry point, for bulk `imports`. */
export const HELL_TANSTACK_TABLE_IMPORTS = [
  HellTanStackTable,
  HellTableShellHeader,
  HellTableShellCell,
  HellTableShellFooterCell,
  HellTableShellExpandedRow,
  HellTableShellLoading,
  HellTableShellEmpty,
  HellTableShellError,
  HellTableShellToolbar,
  HellTableShellFooter,
  HellTanStackPagination,
  HellTanStackGlobalFilter,
  HellTanStackColumnFilter,
  FlexRenderDirective,
] as const;
