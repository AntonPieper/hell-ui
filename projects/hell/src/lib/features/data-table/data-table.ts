import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FlexRenderDirective,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  createAngularTable,
  getCoreRowModel,
} from '@tanstack/angular-table';
import { HellPaginationStrip } from '../../primitives/pagination/pagination';

export interface HellDataTableQuery {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  filter: string;
}

/**
 * Data table built on `@tanstack/angular-table` with server-side pagination,
 * sorting, and a single global filter input. Consumers are expected to listen
 * to `(queryChange)` and update `data` + `total` accordingly.
 */
@Component({
  selector: 'hell-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlexRenderDirective, HellPaginationStrip],
  host: {
    '[class.hell-table-shell]': '!unstyled()',
  },
  template: `
    <div class="hell-table-toolbar">
      <input
        class="hell-input"
        type="search"
        [value]="filter()"
        (input)="onFilter($any($event.target).value)"
        placeholder="Filter…"
      />
    </div>

    <table class="hell-table">
      <thead>
        @for (group of table.getHeaderGroups(); track group.id) {
          <tr>
            @for (header of group.headers; track header.id) {
              <th
                [attr.aria-sort]="header.column.getCanSort() ? ariaSort(header.column.getIsSorted()) : null"
                [attr.data-sortable]="header.column.getCanSort() ? 'true' : null"
                (click)="header.column.getCanSort() && header.column.toggleSorting()"
              >
                <ng-container
                  *flexRender="
                    header.column.columnDef.header;
                    props: header.getContext();
                    let h
                  "
                >
                  {{ h }}
                </ng-container>
              </th>
            }
          </tr>
        }
      </thead>
      <tbody>
        @for (row of table.getRowModel().rows; track row.id) {
          <tr>
            @for (cell of row.getVisibleCells(); track cell.id) {
              <td>
                <ng-container
                  *flexRender="
                    cell.column.columnDef.cell;
                    props: cell.getContext();
                    let c
                  "
                >
                  {{ c }}
                </ng-container>
              </td>
            }
          </tr>
        } @empty {
          <tr>
            <td [attr.colspan]="visibleColumnCount()" style="text-align:center; padding:2rem;">
              No results.
            </td>
          </tr>
        }
      </tbody>
    </table>

    <div class="hell-table-footer">
      <span>{{ rangeLabel() }}</span>
      <label class="hell-table-pagesize">
        Rows
        <select
          class="hell-input"
          [value]="pageSizeSig()"
          (change)="onPageSizeChange($any($event.target).value)"
        >
          @for (n of pageSizeOptions(); track n) {
            <option [value]="n">{{ n }}</option>
          }
        </select>
      </label>
      <span style="flex:1"></span>
      <hell-pagination
        [page]="pageIndex() + 1"
        [pageCount]="pageCount()"
        (pageChange)="goToPage($event)"
      />
    </div>
  `,
})
export class HellDataTable<T> {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly data = input<readonly T[]>([]);
  readonly columns = input<ColumnDef<T, any>[]>([]);
  readonly total = input<number>(0);
  readonly pageSize = input<number>(20);
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);

  readonly queryChange = output<HellDataTableQuery>();

  protected readonly pageIndex = signal(0);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly filter = signal('');
  /** Internal page size — initialized from the `pageSize` input but
   *  can be changed by the user via the footer selector. */
  protected readonly pageSizeSig = signal(this.pageSize());

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSizeSig())),
  );

  protected readonly visibleColumnCount = computed(() => this.columns().length || 1);

  protected readonly rangeLabel = computed(() => {
    const start = this.pageIndex() * this.pageSizeSig();
    const end = Math.min(start + this.pageSizeSig(), this.total());
    return this.total() ? `${start + 1}–${end} of ${this.total()}` : '0';
  });

  protected readonly table: any = createAngularTable(() => ({
    data: [...this.data()],
    columns: this.columns(),
    state: {
      pagination: { pageIndex: this.pageIndex(), pageSize: this.pageSizeSig() } as PaginationState,
      sorting: this.sorting(),
    },
    pageCount: this.pageCount(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(this.sorting()) : updater;
      this.sorting.set(next);
      this.emit();
    },
    getCoreRowModel: getCoreRowModel(),
  }));

  constructor() {
    // Re-sync the internal page size whenever the input changes.
    effect(() => {
      this.pageSizeSig.set(this.pageSize());
    });
  }

  protected goToPage(page1Based: number) {
    this.pageIndex.set(Math.max(0, Math.min(this.pageCount() - 1, page1Based - 1)));
    this.emit();
  }
  protected onFilter(v: string) {
    this.filter.set(v);
    this.pageIndex.set(0);
    this.emit();
  }
  protected onPageSizeChange(v: string | number) {
    const n = typeof v === 'string' ? Number(v) : v;
    if (!Number.isFinite(n) || n <= 0) return;
    this.pageSizeSig.set(n);
    this.pageIndex.set(0);
    this.emit();
  }

  protected ariaSort(s: false | 'asc' | 'desc'): 'ascending' | 'descending' | 'none' {
    if (s === 'asc') return 'ascending';
    if (s === 'desc') return 'descending';
    return 'none';
  }

  private emit() {
    this.queryChange.emit({
      pageIndex: this.pageIndex(),
      pageSize: this.pageSizeSig(),
      sorting: this.sorting(),
      filter: this.filter(),
    });
  }
}
