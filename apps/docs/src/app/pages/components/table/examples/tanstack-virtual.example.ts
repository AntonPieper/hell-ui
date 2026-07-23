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
import { HellButton } from 'hell-ui/button';
import { hellSearchResource, type HellSearchField } from 'hell-ui/core';
import { HellIcon } from 'hell-ui/icon';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';
import { HELL_OMNIBAR_IMPORTS } from 'hell-ui/omnibar';
import { HellTableRowRadio } from 'hell-ui/table';
import {
  HellTableShellCell,
  HellTableShellEmpty,
  HellTableShellExpandedRow,
  HellTableShellFooter,
  HellTableShellToolbar,
  HellTableStatus,
  HellTanStackTable,
} from 'hell-ui/table-tanstack';
import { HellTanStackVirtualRows } from 'hell-ui/table-tanstack/virtual';
import {
  createAngularTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: 'Admin' | 'Editor' | 'Viewer';
  readonly status: 'active' | 'away';
  readonly team: string;
}

const TEAMS = ['Platform', 'Compiler', 'Flight', 'Operations'] as const;
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
  selector: 'app-table-tanstack-virtual-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellIcon,
    HellTanStackTable,
    HellTanStackVirtualRows,
    HellTableShellCell,
    HellTableShellEmpty,
    HellTableShellExpandedRow,
    HellTableShellFooter,
    HellTableShellToolbar,
    HellTableRowRadio,
    ...HELL_MENU_IMPORTS,
    ...HELL_OMNIBAR_IMPORTS,
  ],
  providers: [provideIcons(TABLE_EXAMPLE_ICONS)],
  template: `
    <hell-tanstack-table
      [table]="table"
      [status]="HellTableStatus.READY"
      stickyHeader
      hellTanStackVirtualRows
      [rowClass]="selectedRowClass"
      [virtualEstimateRowSize]="44"
      [virtualOverscan]="6"
    >
      <hell-omnibar
        hellTableShellToolbar
        #peopleOmnibar="hellOmnibar"
        class="min-w-64 flex-1"
        size="sm"
        placeholder="Search virtual rows"
        ariaLabel="Search virtual rows"
        [query]="globalFilter()"
        [minPanelWidth]="420"
        (queryChange)="setGlobalFilter($event)"
        (submit)="selectAndReveal($any($event.item))"
      >
        <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />
        <span hellOmnibarTrailing class="text-xs text-hell-foreground-muted">
          {{ table.getFilteredRowModel().rows.length }}
        </span>

        <div hellOmnibarActions aria-label="Virtual table quick actions">
          <button
            hellOmnibarAction
            type="button"
            [pressed]="filtersActive()"
            [attr.aria-pressed]="filtersActive()"
            [hellMenuTrigger]="filterMenu"
            [container]="peopleOmnibar.floatingContainer()"
          >
            <hell-icon name="faSolidFilter" size="12px" />
            Filters
          </button>
          <button hellOmnibarAction type="button" (click)="resetControls()">
            <hell-icon name="faSolidSliders" size="12px" />
            Reset
          </button>
        </div>

        @if (peopleSearch.status() === 'loading') {
          <div role="status" class="px-hell-3 py-hell-4 text-sm text-hell-foreground-muted">
            Searching virtual rows…
          </div>
        } @else if (peopleSearch.items().length === 0) {
          <div class="px-hell-3 py-hell-4 text-sm text-hell-foreground-muted">
            No virtual rows found.
          </div>
        } @else {
          <div hellOmnibarGroup label="Virtual people">
            <div hellOmnibarGroupLabel>People</div>
            @for (person of peopleSearch.items(); track person.id) {
              <button hellOmnibarItem type="button" [value]="person">
                <hell-icon
                  class="inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle in-data-[active=true]:text-hell-foreground"
                  name="faSolidUser"
                  size="13px"
                />
                <span class="flex min-w-0 flex-1 flex-col overflow-hidden *:truncate">
                  {{ person.name }}
                  <span class="text-[11px] text-hell-foreground-muted">{{ person.team }}</span>
                </span>
                <span class="ms-auto inline-flex items-center gap-1 text-[11px] text-hell-foreground-muted">
                  {{ person.role }}
                </span>
              </button>
            }
          </div>
        }
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
        aria-label="More virtual table actions"
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
            (click)="toggleSelectedExpansion()"
            [disabled]="!selectedPerson()"
          >
            <hell-icon hellMenuItemIcon name="faSolidFolderOpen" />
            <span>Toggle selected details</span>
          </button>
          <button hellMenuItem type="button" (click)="resetControls()">
            <hell-icon hellMenuItemIcon name="faSolidSliders" />
            <span>Reset virtual table</span>
          </button>
        </div>
      </ng-template>

      <ng-template hellTableShellCell="select" let-row="row">
        <input
          hellTableRowRadio
          type="radio"
          name="virtual-primary-person"
          [attr.aria-label]="'Select ' + row.original.name"
          [checked]="row.getIsSelected()"
          (change)="selectRow(row.id)"
        />
      </ng-template>

      <ng-template hellTableShellCell="actions" let-row="row">
        <button
          hellButton
          size="xs"
          variant="ghost"
          type="button"
          [attr.aria-label]="'Toggle details for ' + row.original.name"
          [attr.aria-expanded]="row.getIsExpanded()"
          (click)="toggleExpansion(row.id)"
        >
          <hell-icon name="faSolidFolderOpen" />
          <span>Details</span>
        </button>
      </ng-template>

      <ng-template hellTableShellEmpty>No people found.</ng-template>
      <ng-template hellTableShellExpandedRow let-row="row">
        <p class="text-sm text-hell-foreground-muted">
          {{ row.original.name }} owns expansion state through TanStack Table. The virtual body
          strategy only measures and places the expanded row.
        </p>
      </ng-template>

      <span hellTableShellFooter>{{ table.getFilteredRowModel().rows.length }} visible</span>
      <span hellTableShellFooter>{{ selectedPerson()?.name ?? 'No one' }} selected</span>
    </hell-tanstack-table>
  `,
})
export class TableTanStackVirtualExample {
  protected readonly HellTableStatus = HellTableStatus;
  protected readonly rows = signal<Person[]>(
    Array.from({ length: 36 }, (_, index) => ({
      id: `person-${index + 1}`,
      name: `Person ${index + 1}`,
      role: index % 3 === 0 ? 'Admin' : index % 3 === 1 ? 'Editor' : 'Viewer',
      status: index % 4 === 0 ? 'away' : 'active',
      team: TEAMS[index % TEAMS.length],
    })),
  );
  protected readonly sorting = signal<SortingState>([{ id: 'name', desc: false }]);
  protected readonly columnFilters = signal<ColumnFiltersState>([]);
  protected readonly rowSelection = signal<RowSelectionState>({ 'person-1': true });
  protected readonly expanded = signal<ExpandedState>({});
  protected readonly globalFilter = signal('');
  protected readonly selectedRowClass = (row: Row<Person>) =>
    row.getIsSelected() ? 'bg-hell-primary-soft' : null;

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
    { value: 'Viewer', label: 'Viewer' },
  ];
  protected readonly searchFields: readonly HellSearchField<Person>[] = [
    { name: 'name', weight: 5, get: (person) => person.name },
    { name: 'role', weight: 3, get: (person) => person.role },
    { name: 'status', weight: 2, get: (person) => person.status },
    { name: 'team', weight: 2, get: (person) => person.team },
  ];
  protected readonly peopleSearch = hellSearchResource({
    query: this.globalFilter,
    items: this.rows,
    fields: this.searchFields,
    limit: 6,
  });

  protected readonly selectedPerson = computed(() => {
    const selectedId = Object.keys(this.rowSelection())[0];
    return this.rows().find((person) => person.id === selectedId) ?? null;
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
      size: 176,
      meta: { hell: { cellClass: 'font-medium' } },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      size: 112,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 104,
    },
    {
      accessorKey: 'team',
      header: 'Team',
      size: 144,
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 112,
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
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
    state: {
      sorting: this.sorting(),
      columnFilters: this.columnFilters(),
      rowSelection: this.rowSelection(),
      expanded: this.expanded(),
      globalFilter: this.globalFilter(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onColumnFiltersChange: (updater) => applyUpdater(this.columnFilters, updater),
    onRowSelectionChange: (updater) => applyUpdater(this.rowSelection, updater),
    onExpandedChange: (updater) => applyUpdater(this.expanded, updater),
    onGlobalFilterChange: (updater) => applyUpdater(this.globalFilter, updater),
  }));

  protected setGlobalFilter(value: string): void {
    this.globalFilter.set(value);
  }

  protected selectRow(rowId: string): void {
    this.rowSelection.set({ [rowId]: true });
  }

  protected selectAndReveal(person: Person | null): void {
    if (!person) return;
    this.selectRow(person.id);
    this.expanded.set({ [person.id]: true });
  }

  protected toggleExpansion(rowId: string): void {
    this.expanded.update((current) => {
      const expandedRows = current === true ? {} : current;
      return { ...expandedRows, [rowId]: !expandedRows[rowId] };
    });
  }

  protected toggleSelectedExpansion(): void {
    const person = this.selectedPerson();
    if (person) this.toggleExpansion(person.id);
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
    this.expanded.set({});
  }

  private setColumnFilter(columnId: 'role' | 'status', value: RoleFilter | StatusFilter): void {
    this.columnFilters.update((filters) => [
      ...filters.filter((filter) => filter.id !== columnId),
      ...(value === 'all' ? [] : [{ id: columnId, value }]),
    ]);
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
