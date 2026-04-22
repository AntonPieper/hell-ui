import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
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
import { HellButton } from '../../primitives/button/button';

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
  imports: [FlexRenderDirective, HellButton],
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
                [attr.aria-sort]="ariaSort(header.column.getIsSorted())"
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
      <span style="flex:1"></span>
      <button hellButton variant="ghost" size="sm" (click)="prev()" [disabled]="pageIndex() === 0">
        Prev
      </button>
      <span>Page {{ pageIndex() + 1 }} / {{ pageCount() }}</span>
      <button
        hellButton
        variant="ghost"
        size="sm"
        (click)="next()"
        [disabled]="pageIndex() + 1 >= pageCount()"
      >
        Next
      </button>
    </div>
  `,
})
export class HellDataTable<T> {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly data = input<readonly T[]>([]);
  readonly columns = input<ColumnDef<T, any>[]>([]);
  readonly total = input<number>(0);
  readonly pageSize = input<number>(20);

  readonly queryChange = output<HellDataTableQuery>();

  protected readonly pageIndex = signal(0);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly filter = signal('');

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly visibleColumnCount = computed(() => this.columns().length || 1);

  protected readonly rangeLabel = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    const end = Math.min(start + this.pageSize(), this.total());
    return this.total() ? `${start + 1}–${end} of ${this.total()}` : '0';
  });

  protected readonly table: any = createAngularTable(() => ({
    data: [...this.data()],
    columns: this.columns(),
    state: {
      pagination: { pageIndex: this.pageIndex(), pageSize: this.pageSize() } as PaginationState,
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

  protected next() {
    this.pageIndex.update((p) => Math.min(p + 1, this.pageCount() - 1));
    this.emit();
  }
  protected prev() {
    this.pageIndex.update((p) => Math.max(p - 1, 0));
    this.emit();
  }
  protected onFilter(v: string) {
    this.filter.set(v);
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
      pageSize: this.pageSize(),
      sorting: this.sorting(),
      filter: this.filter(),
    });
  }
}
