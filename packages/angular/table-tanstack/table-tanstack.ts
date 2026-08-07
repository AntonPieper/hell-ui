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
  type Provider,
} from '@angular/core';
import {
  FlexRenderDirective,
  type Atoms_All,
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
  type Table,
  type TableFeature,
  type TableFeatures,
} from '@tanstack/angular-table';
// Feature APIs are gated on the features a table registers, so a shell that is
// generic over `TFeatures` cannot reach them as instance methods: TanStack's
// feature-map lookup stays unresolved while `TFeatures` is a type parameter.
// The static-function entry point exists for exactly this case — every function
// is itself generic over `TFeatures` and takes the instance as its first
// argument, so the shell reads the same APIs without pinning a feature set.
import {
  column_getAfter,
  column_getCanSort,
  column_getFilterValue,
  column_getIsPinned,
  column_getIsSorted,
  column_getSize,
  column_getStart,
  column_getToggleSortingHandler,
  column_setFilterValue,
  getDefaultPaginationState,
  row_getIsExpanded,
  row_getVisibleCells,
  table_getCenterVisibleLeafColumns,
  table_getEndVisibleLeafColumns,
  table_getPageCount,
  table_getStartVisibleLeafColumns,
  table_getTotalSize,
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
 * - `rowSortingFeature` — whether a header is sortable and its current
 *   direction, which the shell renders as a sort trigger.
 * - `rowExpandingFeature` — whether a row is expanded, which decides whether
 *   the projected expanded-row template is rendered beneath it.
 *
 * Column resizing is deliberately absent: it is opt-in through the
 * `hellTanStackResizableColumns` directive, which carries its own
 * `HellTanStackResizableColumnsFeatures` requirements, so a table that never
 * resizes registers no resizing feature at all.
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

/**
 * Contract the opt-in `hellTanStackResizableColumns` registration fulfils.
 *
 * The shell keeps rendering the separators — it owns the rendered column order
 * and the placeholder rules — and asks the strategy for each candidate pair.
 * The boundary speaks in column ids and the non-generic
 * `HellTableResizeAdapter`, so a strategy generic over its own feature
 * requirements serves a shell generic over different ones without a variance
 * bridge between the two `Table` types.
 */
export interface ɵHellTanStackResizeStrategy {
  /**
   * Resize pair for the leading column of one rendered header, or `null` when
   * that header gets no handle. `afterColumnId` is the rendered trailing
   * neighbour; the trailing column of the table passes `undefined`.
   */
  adapterFor(
    beforeColumnId: string,
    afterColumnId: string | undefined,
  ): HellTableResizeAdapter | null;
}

export const ɵHELL_TANSTACK_RESIZE_STRATEGY = new InjectionToken<ɵHellTanStackResizeStrategy>(
  'ɵHELL_TANSTACK_RESIZE_STRATEGY',
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
          @for (headerGroup of table().getHeaderGroups(); track headerGroup.id) {
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
            @for (footerGroup of table().getFooterGroups(); track footerGroup.id) {
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
  private readonly resizeStrategy = inject(ɵHELL_TANSTACK_RESIZE_STRATEGY, {
    optional: true,
    self: true,
  });
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
   * Resize pair for one header, or `null` when the shell renders no handle.
   *
   * Resizing is opt-in: without the `hellTanStackResizableColumns` directive
   * there is no strategy and no header gets a handle. With it, the shell still
   * decides where handles may render — grouped headers and the trailing column
   * have no adjacent pair — and the strategy decides whether the pair resizes,
   * which is where TanStack's own opt-outs apply. The pair is found in
   * `visibleLeafColumns()` order because the handle transacts against the
   * rendered trailing neighbour, not the declared one.
   */
  protected resizeAdapterFor(
    header: Header<TFeatures, TData, unknown>,
  ): HellTableResizeAdapter | null {
    const strategy = this.resizeStrategy;
    if (!strategy) return null;

    const columns = this.visibleLeafColumns();
    const index = columns.findIndex((column) => column.id === header.column.id);
    if (index < 0) return null;
    return strategy.adapterFor(header.column.id, columns[index + 1]?.id);
  }

  /** Accessible name for one column's resize separator. */
  protected resizeHandleLabel(header: Header<TFeatures, TData, unknown>): string {
    return `${this.tableLabels.resizeColumn} ${header.column.id}`;
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
    return this.table()
      .getFooterGroups()
      .some((group) =>
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

/**
 * The base TanStack Table shell directives, for bulk `imports`.
 *
 * Opt-in extensions are deliberately not part of this aggregate, so tables
 * that skip them never carry their code: import `HellTanStackResizableColumns`
 * directly for column resizing, and `HellTanStackVirtualRows` from
 * `hell-ui/table-tanstack/virtual` for virtual rows.
 */
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
