import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type WritableSignal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidEllipsisVertical,
  faSolidFilter,
  faSolidFolderOpen,
  faSolidMagnifyingGlass,
  faSolidSliders,
  faSolidUser,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { type HellSearchField } from '@hell-ui/angular/core';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';
import { HellTableRowRadio } from '@hell-ui/angular/table';
import {
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellFooter,
  HellTableShellToolbar,
  HellTableStatus,
  HellTanStackPagination,
  HellTanStackTable,
} from '@hell-ui/angular/table-tanstack';
import {
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: 'Admin' | 'Editor' | 'Analyst';
  readonly status: 'active' | 'away';
  readonly team: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin', status: 'active', team: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor', status: 'away', team: 'Compiler' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Analyst', status: 'active', team: 'Flight' },
  { id: 'dorothy', name: 'Dorothy Vaughan', role: 'Admin', status: 'active', team: 'Operations' },
  { id: 'mary', name: 'Mary Jackson', role: 'Editor', status: 'away', team: 'Research' },
];

const TABLE_EXAMPLE_ICONS = {
  faSolidEllipsisVertical,
  faSolidFilter,
  faSolidFolderOpen,
  faSolidMagnifyingGlass,
  faSolidSliders,
  faSolidUser,
};

type RoleFilter = 'all' | Person['role'];
type StatusFilter = 'all' | Person['status'];

@Component({
  selector: 'app-table-tanstack-shell-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellIcon,
    HellTanStackTable,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellFooter,
    HellTableShellToolbar,
    HellTanStackPagination,
    HellTableRowRadio,
    ...HELL_MENU_DIRECTIVES,
    ...HELL_OMNIBAR_DIRECTIVES,
    ...HELL_SPLIT_VIEW_DIRECTIVES,
  ],
  providers: [provideIcons(TABLE_EXAMPLE_ICONS)],
  template: `
    <hell-split-view
      framed
      data-testid="table-master-detail"
      [height]="540"
      itemNavigation
      previousItemLabel="Previous person"
      nextItemLabel="Next person"
      [previousItemDisabled]="previousPersonDisabled()"
      [nextItemDisabled]="nextPersonDisabled()"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      (previousItem)="openAdjacentPerson(-1)"
      (nextItem)="openAdjacentPerson(1)"
    >
      <ng-template hellSplitPrimary>
        <hell-tanstack-table [table]="table" [status]="HellTableStatus.READY" stickyHeader>
          <hell-omnibar
            hellTableShellToolbar
            #peopleSearch="hellOmnibar"
            class="min-w-64 flex-1"
            size="sm"
            placeholder="Search people"
            ariaLabel="Search people"
            [value]="globalFilter()"
            [searchItems]="rows()"
            [searchFields]="searchFields"
            [searchLimit]="5"
            [searchDebounce]="80"
            [minPanelWidth]="420"
            (valueChange)="setGlobalFilter($event)"
            (submit)="openPerson($any($event.item))"
          >
            <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />
            <span hellOmnibarTrailing class="text-xs text-hell-foreground-muted">
              {{ table.getFilteredRowModel().rows.length }}
            </span>

            <div hellOmnibarActions aria-label="People table quick actions">
              <button
                hellOmnibarAction
                type="button"
                [pressed]="filtersActive()"
                [attr.aria-pressed]="filtersActive()"
                [hellMenuTrigger]="filterMenu"
                [container]="peopleSearch.floatingContainer()"
              >
                <hell-icon name="faSolidFilter" size="12px" />
                Filters
              </button>
              <button hellOmnibarAction type="button" (click)="resetControls()">
                <hell-icon name="faSolidSliders" size="12px" />
                Reset
              </button>
            </div>

            <div hellOmnibarGroup label="People">
              <div hellOmnibarGroupLabel>People</div>
              @for (result of peopleSearch.searchResults(); track result.item.id) {
                <button hellOmnibarItem type="button" [value]="result.item">
                  <hell-icon hellOmnibarItemIcon name="faSolidUser" size="13px" />
                  <span hellOmnibarItemText>
                    {{ result.item.name }}
                    <span hellOmnibarItemSubtext>{{ result.item.team }}</span>
                  </span>
                  <span hellOmnibarItemTrailing>{{ result.item.role }}</span>
                </button>
              }
            </div>
          </hell-omnibar>

          <button
            hellTableShellToolbar
            hellButton
            size="sm"
            variant="ghost"
            type="button"
            [hellMenuTrigger]="filterMenu"
            [attr.aria-pressed]="filtersActive()"
          >
            <hell-icon name="faSolidFilter" size="12px" />
            Filters
          </button>

          <button
            hellTableShellToolbar
            hellButton
            iconOnly
            size="sm"
            variant="ghost"
            type="button"
            aria-label="More table actions"
            [hellMenuTrigger]="moreMenu"
          >
            <hell-icon name="faSolidEllipsisVertical" />
          </button>

          <ng-template #filterMenu>
            <div hellMenu>
              <div
                hellMenuSection
                hellMenuItemRadioGroup
                [value]="statusFilter()"
                (valueChange)="setStatusFilter($any($event))"
              >
                <div hellMenuLabel>Status</div>
                @for (status of statusFilters; track status.value) {
                  <button hellMenuItemRadio type="button" [value]="status.value">
                    <span hellMenuItemIndicator></span>
                    <span>{{ status.label }}</span>
                  </button>
                }
              </div>
              <div hellMenuSeparator></div>
              <div
                hellMenuSection
                hellMenuItemRadioGroup
                [value]="roleFilter()"
                (valueChange)="setRoleFilter($any($event))"
              >
                <div hellMenuLabel>Role</div>
                @for (role of roleFilters; track role.value) {
                  <button hellMenuItemRadio type="button" [value]="role.value">
                    <span hellMenuItemIndicator></span>
                    <span>{{ role.label }}</span>
                  </button>
                }
              </div>
            </div>
          </ng-template>

          <ng-template #moreMenu>
            <div hellMenu>
              <button
                hellMenuItem
                type="button"
                [disabled]="!selectedPerson()"
                (click)="openSelectedPerson()"
              >
                <hell-icon hellMenuItemIcon name="faSolidFolderOpen" />
                <span>Open selected</span>
              </button>
              <button hellMenuItem type="button" (click)="resetControls()">
                <hell-icon hellMenuItemIcon name="faSolidSliders" />
                <span>Reset table controls</span>
              </button>
            </div>
          </ng-template>

          <ng-template hellTableShellCell="select" let-row="row">
            <input
              hellTableRowRadio
              type="radio"
              name="tanstack-primary-person"
              [attr.aria-label]="'Select ' + row.original.name"
              [checked]="row.getIsSelected()"
              (change)="selectRow(row.id)"
            />
          </ng-template>

          <ng-template hellTableShellCell="actions" let-row="row">
            <button
              hellButton
              iconOnly
              size="xs"
              variant="ghost"
              type="button"
              [attr.aria-label]="'Open ' + row.original.name"
              (click)="openPerson(row.original)"
            >
              <hell-icon name="faSolidFolderOpen" />
            </button>
          </ng-template>

          <ng-template hellTableShellEmpty>No people found.</ng-template>

          <span hellTableShellFooter>{{ table.getFilteredRowModel().rows.length }} visible</span>
          <span hellTableShellFooter>{{ selectedPerson()?.name ?? 'No one' }} selected</span>
          <hell-tanstack-pagination
            hellTableShellFooter
            [table]="table"
            [pageSizeOptions]="[2, 5]"
          />
        </hell-tanstack-table>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3" data-testid="table-detail-pane">
          @if (openedPerson(); as person) {
            <div class="grid gap-1">
              <strong class="text-sm font-semibold text-hell-foreground">{{ person.name }}</strong>
              <span class="text-xs text-hell-foreground-muted">
                {{ person.role }} / {{ person.team }} / {{ person.status }}
              </span>
            </div>
            <p class="m-0 text-sm text-hell-foreground-muted">
              This pane is Hell Split View chrome. The selected row, filters, sorting, and
              pagination stay in the caller-owned TanStack table state.
            </p>
          } @else {
            <div
              class="flex flex-1 items-center justify-center text-center text-sm text-hell-foreground-muted"
            >
              Open a person from the table.
            </div>
          }
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class TableTanStackShellExample {
  protected readonly HellTableStatus = HellTableStatus;
  protected readonly rows = signal<Person[]>([...PEOPLE]);
  protected readonly sorting = signal<SortingState>([{ id: 'name', desc: false }]);
  protected readonly columnFilters = signal<ColumnFiltersState>([]);
  protected readonly pagination = signal<PaginationState>({ pageIndex: 0, pageSize: 2 });
  protected readonly rowSelection = signal<RowSelectionState>({ ada: true });
  protected readonly globalFilter = signal('');
  protected readonly detailOpen = signal(false);
  protected readonly openedId = signal<string | null>(null);

  protected readonly statusFilters: readonly {
    readonly value: StatusFilter;
    readonly label: string;
  }[] = [
    { value: 'all', label: 'Any status' },
    { value: 'active', label: 'Active' },
    { value: 'away', label: 'Away' },
  ];
  protected readonly roleFilters: readonly {
    readonly value: RoleFilter;
    readonly label: string;
  }[] = [
    { value: 'all', label: 'Any role' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Editor', label: 'Editor' },
    { value: 'Analyst', label: 'Analyst' },
  ];
  protected readonly searchFields: readonly HellSearchField<Person>[] = [
    { name: 'name', weight: 5, get: (person) => person.name },
    { name: 'role', weight: 3, get: (person) => person.role },
    { name: 'status', weight: 2, get: (person) => person.status },
    { name: 'team', weight: 2, get: (person) => person.team },
  ];

  protected readonly selectedPerson = computed(() => {
    const selectedId = Object.keys(this.rowSelection())[0];
    return this.rows().find((person) => person.id === selectedId) ?? null;
  });
  protected readonly openedPerson = computed(() => {
    const openedId = this.openedId();
    return this.rows().find((person) => person.id === openedId) ?? null;
  });
  protected readonly statusFilter = computed<StatusFilter>(
    () =>
      (this.columnFilters().find((filter) => filter.id === 'status')?.value as
        | StatusFilter
        | undefined) ?? 'all',
  );
  protected readonly roleFilter = computed<RoleFilter>(
    () =>
      (this.columnFilters().find((filter) => filter.id === 'role')?.value as
        | RoleFilter
        | undefined) ?? 'all',
  );
  protected readonly filtersActive = computed(
    () => this.statusFilter() !== 'all' || this.roleFilter() !== 'all',
  );

  protected readonly columns: ColumnDef<Person>[] = [
    {
      id: 'select',
      header: '',
      size: 44,
      enableSorting: false,
      enableGlobalFilter: false,
      meta: { hell: { cellClass: 'text-center' } },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 192,
      meta: { hell: { cellClass: 'font-medium' } },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      size: 128,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 112,
    },
    {
      accessorKey: 'team',
      header: 'Team',
      size: 144,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 88,
      enableSorting: false,
      enableGlobalFilter: false,
      meta: { hell: { cellClass: 'text-right', headerClass: 'text-right' } },
    },
  ];

  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    state: {
      sorting: this.sorting(),
      columnFilters: this.columnFilters(),
      pagination: this.pagination(),
      rowSelection: this.rowSelection(),
      globalFilter: this.globalFilter(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onColumnFiltersChange: (updater) => applyUpdater(this.columnFilters, updater),
    onPaginationChange: (updater) => applyUpdater(this.pagination, updater),
    onRowSelectionChange: (updater) => applyUpdater(this.rowSelection, updater),
    onGlobalFilterChange: (updater) => applyUpdater(this.globalFilter, updater),
  }));

  protected setGlobalFilter(value: string): void {
    this.globalFilter.set(value);
    this.resetPage();
  }

  protected selectRow(rowId: string): void {
    this.rowSelection.set({ [rowId]: true });
  }

  protected openPerson(person: Person | null): void {
    if (!person) return;
    this.selectRow(person.id);
    this.openedId.set(person.id);
    this.detailOpen.set(true);
  }

  protected openSelectedPerson(): void {
    this.openPerson(this.selectedPerson());
  }

  protected setStatusFilter(value: StatusFilter): void {
    this.setColumnFilter('status', value);
  }

  protected setRoleFilter(value: RoleFilter): void {
    this.setColumnFilter('role', value);
  }

  protected resetControls(): void {
    this.globalFilter.set('');
    this.columnFilters.set([]);
    this.sorting.set([{ id: 'name', desc: false }]);
    this.pagination.set({ pageIndex: 0, pageSize: this.pagination().pageSize });
  }

  private setColumnFilter(columnId: 'role' | 'status', value: RoleFilter | StatusFilter): void {
    this.columnFilters.update((filters) => [
      ...filters.filter((filter) => filter.id !== columnId),
      ...(value === 'all' ? [] : [{ id: columnId, value }]),
    ]);
    this.resetPage();
  }

  private resetPage(): void {
    this.pagination.update((current) => ({ ...current, pageIndex: 0 }));
  }

  protected previousPersonDisabled(): boolean {
    const rows = this.table.getRowModel().rows;
    const index = this.openedRowIndex(rows);
    return index <= 0 && !this.table.getCanPreviousPage();
  }

  protected nextPersonDisabled(): boolean {
    const rows = this.table.getRowModel().rows;
    const index = this.openedRowIndex(rows);
    return index < 0 || (index >= rows.length - 1 && !this.table.getCanNextPage());
  }

  protected openAdjacentPerson(direction: -1 | 1): void {
    const rows = this.table.getRowModel().rows;
    const index = this.openedRowIndex(rows);
    const next = rows[index + direction];
    if (next) {
      this.openPerson(next.original);
      return;
    }

    if (direction > 0 && this.table.getCanNextPage()) {
      this.table.nextPage();
      queueMicrotask(() => this.openPerson(this.table.getRowModel().rows[0]?.original ?? null));
    } else if (direction < 0 && this.table.getCanPreviousPage()) {
      this.table.previousPage();
      queueMicrotask(() => this.openPerson(this.table.getRowModel().rows.at(-1)?.original ?? null));
    }
  }

  private openedRowIndex(rows: readonly { readonly original: Person }[]): number {
    const openedId = this.openedId();
    return rows.findIndex((row) => row.original.id === openedId);
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
