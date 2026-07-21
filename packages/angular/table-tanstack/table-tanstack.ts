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
  type Cell,
  type Column,
  type Header,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/angular-table';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_EMPTY_STATE_COPY, HellEmptyState } from '@hell-ui/angular/empty-state';
import { HELL_TABLE_UTILITIES_IMPORTS } from '@hell-ui/angular/table';
import { HellInput, HELL_SEARCH_IMPORTS } from '@hell-ui/angular/input';
import { HellNativeSelect } from '@hell-ui/angular/select';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Optional teardown returned by ɵHellTanStackBodyStrategy connect hooks. */
export type ɵHellStrategyCleanup = VoidFunction | void;

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

export type HellTanStackRowClass<TData extends RowData = RowData> = {
  bivarianceHack(row: Row<TData>): HellClassValue;
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

export interface ɵHellTanStackBodyItem<TData extends RowData = RowData> {
  readonly row: Row<TData>;
  readonly key: string;
  readonly kind: ɵHellTanStackBodyItemKind;
}

export interface ɵHellTanStackBodyStrategy<TData extends RowData = RowData> {
  rows(items: readonly ɵHellTanStackBodyItem<TData>[]): readonly ɵHellTanStackBodyItem<TData>[];
  connectScrollport?(el: HTMLElement, writer: ɵHellDomWriter): ɵHellStrategyCleanup;
  connectBody?(el: HTMLElement, writer: ɵHellDomWriter): ɵHellStrategyCleanup;
  connectRow?(
    el: HTMLElement,
    item: ɵHellTanStackBodyItem<TData>,
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
export class HellTableShellHeader<TData extends RowData = RowData, TValue = unknown> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellHeader' });
  readonly template = inject<TemplateRef<HellTableShellHeaderContext<TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellCell]' })
export class HellTableShellCell<TData extends RowData = RowData, TValue = unknown> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellCell' });
  readonly template = inject<TemplateRef<HellTableShellCellContext<TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellFooterCell]' })
export class HellTableShellFooterCell<TData extends RowData = RowData, TValue = unknown> {
  readonly columnId = input.required<string>({ alias: 'hellTableShellFooterCell' });
  readonly template = inject<TemplateRef<HellTableShellHeaderContext<TData, TValue>>>(TemplateRef);
}

@Directive({ selector: 'ng-template[hellTableShellExpandedRow]' })
export class HellTableShellExpandedRow<TData extends RowData = RowData> {
  readonly template = inject<TemplateRef<HellTableShellExpandedRowContext<TData>>>(TemplateRef);
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

export interface HellTableShellCellContext<TData extends RowData = RowData, TValue = unknown> {
  readonly $implicit: Cell<TData, TValue>;
  readonly cell: Cell<TData, TValue>;
  readonly row: Row<TData>;
  readonly column: Column<TData, TValue>;
  readonly table: Table<TData>;
}

export interface HellTableShellHeaderContext<TData extends RowData = RowData, TValue = unknown> {
  readonly $implicit: Header<TData, TValue>;
  readonly header: Header<TData, TValue>;
  readonly column: Column<TData, TValue>;
  readonly table: Table<TData>;
}

export interface HellTableShellExpandedRowContext<TData extends RowData = RowData> {
  readonly $implicit: Row<TData>;
  readonly row: Row<TData>;
  readonly table: Table<TData>;
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
          @for (column of table().getVisibleLeafColumns(); track column.id) {
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
                  [sortable]="header.column.getCanSort()"
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
                      @if (header.column.getCanSort()) {
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
                    @for (cell of item.row.getVisibleCells(); track cell.id) {
                      <td
                        hellTableCell
                        [ui]="cellClass(cell)"
                        [attr.data-column-id]="cell.column.id"
                        [attr.data-pinned]="pinnedSide(cell.column)"
                        [attr.data-pinned-last]="pinnedLast(cell.column)"
                        [attr.data-pinned-first]="pinnedFirst(cell.column)"
                        [style.--hell-table-column-size.px]="columnSize(cell.column)"
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
export class HellTanStackTable<TData extends RowData = RowData> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTanStackTablePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTanStackTablePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TANSTACK_TABLE_RECIPE,
  });

  readonly table = input.required<Table<TData>>();
  readonly status = input<HellTableStatusValue>(HellTableStatus.READY);
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  readonly rowClass = input<HellTanStackRowClass<TData> | HellClassValue>(null);

  protected readonly providerViews = inject(HELL_TABLE_STATUS_VIEWS);
  protected readonly bodyStrategy = inject(ɵHELL_TANSTACK_BODY_STRATEGY, {
    optional: true,
    self: true,
  }) as ɵHellTanStackBodyStrategy<TData> | null;
  private readonly headers = contentChildren(HellTableShellHeader<TData, unknown>, {
    descendants: true,
  });
  private readonly cells = contentChildren(HellTableShellCell<TData, unknown>, {
    descendants: true,
  });
  private readonly footers = contentChildren(HellTableShellFooterCell<TData, unknown>, {
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
  protected readonly expandedRows = contentChildren(HellTableShellExpandedRow<TData>, {
    descendants: true,
  });

  protected readonly displayState = computed(() => {
    const status = this.status();
    if (status.kind === 'loading') return this.assertStatusView('loading');
    if (status.kind === 'error') return this.assertStatusView('error');
    if (this.table().getRowModel().rows.length === 0) return this.assertStatusView('empty');
    return 'ready';
  });

  protected bodyItems(): readonly ɵHellTanStackBodyItem<TData>[] {
    const items = this.allBodyItems();
    return this.bodyStrategy?.rows(items) ?? items;
  }

  protected columnSize(column: Column<TData, unknown>): number | null {
    const size = column.getSize();
    return Number.isFinite(size) && size > 0 ? size : null;
  }

  protected tableTotalSize(): number | null {
    const size = this.table().getTotalSize();
    return Number.isFinite(size) && size > 0 ? size : null;
  }

  private allBodyItems(): readonly ɵHellTanStackBodyItem<TData>[] {
    const expanded = this.expandedRowTemplate();
    const items: ɵHellTanStackBodyItem<TData>[] = [];
    for (const row of this.table().getRowModel().rows) {
      items.push({ kind: 'row', row, key: row.id });
      if (expanded && row.getIsExpanded()) {
        items.push({ kind: 'expanded', row, key: `${row.id}:expanded` });
      }
    }
    return items;
  }

  protected visibleColumnCount(): number {
    return Math.max(this.table().getVisibleLeafColumns().length, 1);
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

  protected headerTemplateFor(header: Header<TData, unknown>) {
    const template = this.templateFor(this.headers(), header.column.id);
    this.assertNoRendererConflict(
      'header',
      header.column.id,
      template,
      header.column.columnDef.header,
    );
    return template;
  }

  protected cellTemplateFor(cell: Cell<TData, unknown>) {
    const template = this.templateFor(this.cells(), cell.column.id);
    this.assertNoRendererConflict(
      'cell',
      cell.column.id,
      template,
      this.explicitCellRenderer(cell),
    );
    return template;
  }

  protected footerTemplateFor(header: Header<TData, unknown>) {
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

  protected bodyItemBridge(item: ɵHellTanStackBodyItem<TData>): ɵHellTanStackBodyItem {
    return item as unknown as ɵHellTanStackBodyItem;
  }

  protected cellContext(cell: Cell<TData, unknown>): HellTableShellCellContext<TData, unknown> {
    return {
      $implicit: cell,
      cell,
      row: cell.row,
      column: cell.column,
      table: cell.getContext().table,
    };
  }

  protected headerContext(
    header: Header<TData, unknown>,
  ): HellTableShellHeaderContext<TData, unknown> {
    return { $implicit: header, header, column: header.column, table: header.getContext().table };
  }

  protected expandedRowContext(row: Row<TData>): HellTableShellExpandedRowContext<TData> {
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

  protected headerClass(header: Header<TData, unknown>): string {
    return classValue(hellColumnMeta(header.column.columnDef.meta)?.hell?.headerClass);
  }

  protected cellClass(cell: Cell<TData, unknown>): string {
    return classValue(hellColumnMeta(cell.column.columnDef.meta)?.hell?.cellClass);
  }

  protected footerClass(header: Header<TData, unknown>): string {
    return classValue(hellColumnMeta(header.column.columnDef.meta)?.hell?.footerClass);
  }

  protected rowClassValue(row: Row<TData>): string {
    const value = this.rowClass();
    return classValue(typeof value === 'function' ? value(row) : value);
  }

  protected sortState(header: Header<TData, unknown>): 'asc' | 'desc' | null {
    const sorted = header.column.getIsSorted();
    return sorted === 'asc' || sorted === 'desc' ? sorted : null;
  }

  protected sortButtonLabel(header: Header<TData, unknown>): string {
    const sort = this.sortState(header);
    const next = sort === 'asc' ? 'descending' : sort === 'desc' ? 'clear sorting' : 'ascending';
    return `Sort ${header.column.id} ${next}`;
  }

  protected toggleSorting(header: Header<TData, unknown>, event: MouseEvent): void {
    header.column.getToggleSortingHandler()?.(event);
  }

  protected pinnedSide(column: Column<TData, unknown>): 'left' | 'right' | null {
    return column.getIsPinned() || null;
  }

  protected pinnedStart(column: Column<TData, unknown>): number | null {
    return column.getIsPinned() === 'left' ? column.getStart('left') : null;
  }

  protected pinnedAfter(column: Column<TData, unknown>): number | null {
    return column.getIsPinned() === 'right' ? column.getAfter('right') : null;
  }

  protected pinnedLast(column: Column<TData, unknown>): 'true' | null {
    return column.getIsPinned() === 'left' && column.getIsLastColumn('left') ? 'true' : null;
  }

  protected pinnedFirst(column: Column<TData, unknown>): 'true' | null {
    return column.getIsPinned() === 'right' && column.getIsFirstColumn('right') ? 'true' : null;
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

  private explicitCellRenderer(cell: Cell<TData, unknown>): unknown {
    const renderer = cell.column.columnDef.cell;
    return renderer === this.table()._getDefaultColumnDef().cell ? undefined : renderer;
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
          [value]="table().getState().pagination.pageSize"
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
export class HellTanStackPagination<TData extends RowData = RowData> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTanStackPaginationPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTanStackPaginationPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TANSTACK_PAGINATION_RECIPE,
  });

  /** Refines the nested rows-per-page `hellNativeSelect` through its own root part. */
  protected readonly pageSizeSelectUi = HELL_TANSTACK_PAGINATION_SELECT_UI;

  readonly table = input.required<Table<TData>>();
  readonly pageSizeOptions = input<readonly number[]>([]);

  protected currentPage(): number {
    return this.table().getState().pagination.pageIndex + 1;
  }

  protected pageCount(): number {
    return this.table().getPageCount() || 1;
  }

  protected pageSize(): number {
    return this.table().getState().pagination.pageSize;
  }

  protected setPage(page: number): void {
    this.table().setPageIndex(Math.max(page - 1, 0));
  }

  protected setPageSize(event: Event): void {
    const size = Number((event.target as HTMLSelectElement | null)?.value);
    if (Number.isFinite(size) && size > 0) this.table().setPageSize(size);
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
        [value]="table().getState().globalFilter ?? ''"
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
export class HellTanStackGlobalFilter<TData extends RowData = RowData> {
  readonly table = input.required<Table<TData>>();
  readonly placeholder = input('Filter rows');
  protected readonly filterInputUi = HELL_TANSTACK_FILTER_INPUT_UI;

  protected setFilter(event: Event): void {
    this.table().setGlobalFilter((event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected clearFilter(): void {
    this.table().setGlobalFilter('');
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
export class HellTanStackColumnFilter<TData extends RowData = RowData> {
  readonly table = input.required<Table<TData>>();
  readonly columnId = input.required<string>();
  readonly placeholder = input('Filter column');
  protected readonly filterInputUi = HELL_TANSTACK_FILTER_INPUT_UI;

  protected readonly column = computed(() => this.table().getColumn(this.columnId()));
  protected readonly value = computed(() => filterInputValue(this.column()?.getFilterValue()));

  protected setFilter(event: Event): void {
    this.column()?.setFilterValue((event.target as HTMLInputElement | null)?.value ?? '');
  }

  protected clearFilter(): void {
    this.column()?.setFilterValue('');
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
