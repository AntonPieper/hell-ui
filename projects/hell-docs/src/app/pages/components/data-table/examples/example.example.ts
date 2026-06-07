import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowRotateLeft,
  faSolidChevronDown,
  faSolidCheck,
  faSolidEnvelope,
  faSolidFilter,
  faSolidIdCard,
  faSolidLayerGroup,
  faSolidMagnifyingGlass,
  faSolidSliders,
  faSolidTable,
  faSolidUser,
  faSolidUsers,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';
import { hellSearchKey, hellSearchWords } from '@hell-ui/angular/core';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';
import { HellSkeleton } from '@hell-ui/angular/skeleton';

import {
  HELL_TABLE_UTILITIES_DIRECTIVES,
  HellColumnVisibilityPanel,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  hellTableVisibleColumns,
  selectionColumn,
  textColumn,
  type HellTableColumnVisibilityState,
} from '@hell-ui/angular/table';

type RowRole = 'Admin' | 'Editor' | 'Viewer';
type RowAssignee = 'Ada' | 'Grace' | 'Linus' | 'Margaret';

interface Row {
  id: number;
  name: string;
  email: string;
  role: RowRole;
  assignee: RowAssignee;
}

type SearchScope = 'all' | keyof Row;
type RowOrderBy = 'rank' | keyof Row;
type RowOrder = 'asc' | 'desc';
type RowFilter<T extends string> = T | 'all';

interface SearchToken {
  readonly id: number;
  readonly scope: SearchScope;
  readonly value: string;
}

interface SearchSuggestion {
  readonly scope: SearchScope;
  readonly value: string;
  readonly title: string;
  readonly detail: string;
  readonly icon: string;
}

interface RowApiRequest {
  readonly tokens: readonly SearchToken[];
  readonly page: number;
  readonly pageSize: number;
  readonly orderBy: RowOrderBy;
  readonly order: RowOrder;
  readonly role: RowFilter<RowRole>;
  readonly assignee: RowFilter<RowAssignee>;
}

interface RowApiHit {
  readonly row: Row;
  readonly score: number;
}

interface RowApiPage {
  readonly hits: readonly RowApiHit[];
  readonly total: number;
}

const ROLES: readonly RowRole[] = ['Admin', 'Editor', 'Viewer'];
const ASSIGNEES: readonly RowAssignee[] = ['Ada', 'Grace', 'Linus', 'Margaret'];
const PAGE_SIZES = [5, 10, 20] as const;
const SEARCH_SUGGESTION_LIMIT = 5;

const SEARCH_SCOPES: readonly {
  readonly value: SearchScope;
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
}[] = [
  { value: 'all', label: 'All fields', detail: 'Name, email, role, assignee, ID', icon: 'faSolidMagnifyingGlass' },
  { value: 'name', label: 'Name', detail: 'Only row names', icon: 'faSolidUser' },
  { value: 'email', label: 'Email', detail: 'Only email addresses', icon: 'faSolidEnvelope' },
  { value: 'role', label: 'Role', detail: 'Only role values', icon: 'faSolidLayerGroup' },
  { value: 'assignee', label: 'Assignee', detail: 'Only assignees', icon: 'faSolidUsers' },
];

const ALL: readonly Row[] = Array.from({ length: 47 }, (_, i) => ({
  id: i + 1,
  name: 'User ' + (i + 1),
  email: 'user' + (i + 1) + '@example.com',
  role: ROLES[i % ROLES.length],
  assignee: ASSIGNEES[i % ASSIGNEES.length],
}));

const columns = hellColumns<Row>();
const TABLE_COLUMNS = columns.define([
  selectionColumn<Row>('selection', {
    header: 'Select',
    selectAll: true,
    ariaLabel: (row) => `Select ${row.name} for bulk actions`,
  }),
  textColumn<Row, number>('id', {
    header: 'ID',
    accessor: 'id',
    visibility: 'always',
  }),
  textColumn<Row, string>('name', {
    header: 'Name',
    accessor: 'name',
    visibility: 'always',
  }),
  textColumn<Row, string>('email', {
    header: 'Email',
    accessor: 'email',
    visibility: 'user-toggleable',
  }),
  textColumn<Row, RowRole>('role', {
    header: 'Role',
    accessor: 'role',
    visibility: 'user-toggleable',
  }),
  textColumn<Row, RowAssignee>('assignee', {
    header: 'Assignee',
    accessor: 'assignee',
    visibility: 'user-toggleable',
  }),
  actionColumn<Row>('actions', { header: 'Actions' }),
]);

@Component({
  selector: 'app-data-table-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_MENU_DIRECTIVES,
    ...HELL_OMNIBAR_DIRECTIVES,
    ...HELL_SPLIT_VIEW_DIRECTIVES,
    ...HELL_TABLE_UTILITIES_DIRECTIVES,
    HellColumnVisibilityPanel,
    HellButton,
    HellIcon,
    HellPaginationStrip,
    HellSkeleton,
  ],
  providers: [
    provideIcons({
      faSolidCheck,
      faSolidArrowRotateLeft,
      faSolidChevronDown,
      faSolidEnvelope,
      faSolidFilter,
      faSolidIdCard,
      faSolidLayerGroup,
      faSolidMagnifyingGlass,
      faSolidSliders,
      faSolidTable,
      faSolidUser,
      faSolidUsers,
      faSolidXmark,
    }),
  ],
  template: `
    <div class="grid gap-4 p-4">
      <hell-omnibar
        #rowsOmnibar="hellOmnibar"
        size="sm"
        placeholder="Type and press Enter"
        ariaLabel="Build row search"
        emptyMessage="Type a query, then press Enter"
        [searchLimit]="searchSuggestionLimit"
        [searchDebounce]="0"
        [minPanelWidth]="460"
        [(value)]="draftSearch"
      >
        <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />
        @for (token of searchTokens(); track token.id) {
          <span hellOmnibarLeading hellOmnibarChip>
            {{ tokenLabel(token) }}
            <button
              hellOmnibarChipRemove
              [attr.aria-label]="'Remove ' + tokenLabel(token)"
              (pointerdown)="$event.preventDefault()"
              (click)="removeSearchToken(token.id)"
            >
              <hell-icon name="faSolidXmark" size="10px" />
            </button>
          </span>
        }
        @if (loading()) {
          <hell-icon hellOmnibarTrailing name="faSolidSliders" size="13px" />
        }

        @if (searchSuggestions().length) {
          <div hellOmnibarGroup label="Commit search">
            <div hellOmnibarGroupLabel>Commit search</div>
            @for (suggestion of searchSuggestions(); track suggestion.scope) {
              <button
                hellOmnibarItem
                type="button"
                [value]="suggestion"
                (select)="commitSearch($any($event))"
              >
                <hell-icon hellOmnibarItemIcon [name]="suggestion.icon" size="13px" />
                <span hellOmnibarItemText>
                  <span>{{ suggestion.title }}</span>
                  <span hellOmnibarItemSubtext>{{ suggestion.detail }}</span>
                </span>
              </button>
            }
          </div>
        }
      </hell-omnibar>

      <div class="flex flex-wrap items-center gap-2">
        <button
          hellButton
          size="sm"
          type="button"
          [variant]="hasActiveFilters() ? 'soft' : 'default'"
          [hellMenuTrigger]="filterMenu"
          [openTriggers]="menuOpenTriggers"
          placement="bottom-start"
        >
          <hell-icon name="faSolidFilter" size="12px" />
          Filters
        </button>
        <button
          hellButton
          size="sm"
          type="button"
          [variant]="orderBy() !== 'rank' || order() !== 'desc' ? 'soft' : 'default'"
          [hellMenuTrigger]="sortMenu"
          [openTriggers]="menuOpenTriggers"
          placement="bottom-start"
        >
          <hell-icon name="faSolidTable" size="12px" />
          {{ orderByLabel() }}
        </button>
        <button
          hellButton
          size="sm"
          type="button"
          variant="ghost"
          [disabled]="!hasQueryState()"
          (click)="clearQueryState()"
        >
          <hell-icon name="faSolidArrowRotateLeft" size="12px" />
          Reset
        </button>
        @if (selectedCount()) {
          <span class="rounded-full bg-hell-primary-soft px-2 py-1 text-xs text-hell-primary">
            {{ selectedCount() }} selected for bulk actions
          </span>
          <button hellButton size="sm" type="button" variant="ghost" (click)="clearRowSelection()">
            Clear selection
          </button>
        }
      </div>

      <div class="grid gap-3 rounded-md border border-hell-border bg-hell-surface-subtle p-3 md:grid-cols-[260px_minmax(0,1fr)]">
        <div class="text-sm text-hell-foreground-muted">
          <strong class="text-hell-foreground">Column visibility is app-owned state.</strong>
          <p class="mt-2">
            This example stores <code>columnVisibility</code> locally and applies it to primitive
            header/body markup. The picker can hide user-toggleable data columns without changing
            <code>activeRowKey</code> or <code>rowSelection</code>.
          </p>
        </div>
        <hell-column-visibility-panel
          [columns]="tableColumns"
          [(columnVisibility)]="columnVisibility"
          label="Visible columns"
          description="Selection and actions stay required; data columns can be toggled."
        />
      </div>

      <ng-template #filterMenu>
        <div hellMenu>
          <div hellMenuSection>
            <div hellMenuLabel>Filters</div>
            <button hellMenuItem type="button" [hellSubmenuTrigger]="roleMenu">
              <hell-icon hellMenuItemIcon name="faSolidLayerGroup" />
              <span>Role</span>
              <span hellMenuItemTrailing>{{ roleLabel() }}</span>
            </button>
            <button hellMenuItem type="button" [hellSubmenuTrigger]="assigneeMenu">
              <hell-icon hellMenuItemIcon name="faSolidUsers" />
              <span>Assignee</span>
              <span hellMenuItemTrailing>{{ assigneeLabel() }}</span>
            </button>
          </div>
          <div hellMenuSeparator></div>
          <button
            hellMenuItem
            type="button"
            [disabled]="!hasActiveFilters()"
            (click)="clearFilters()"
          >
            <hell-icon hellMenuItemIcon name="faSolidFilter" />
            <span>Clear filters</span>
          </button>
        </div>
      </ng-template>

      <ng-template #roleMenu>
        <div hellMenu>
          <button hellMenuItem type="button" (click)="setRoleFilter('all')">
            @if (roleFilter() === 'all') {
              <hell-icon hellMenuItemIcon name="faSolidCheck" />
            } @else {
              <span hellMenuItemIcon></span>
            }
            <span>Any role</span>
          </button>
          @for (role of roles; track role) {
            <button hellMenuItem type="button" (click)="setRoleFilter(role)">
              @if (roleFilter() === role) {
                <hell-icon hellMenuItemIcon name="faSolidCheck" />
              } @else {
                <span hellMenuItemIcon></span>
              }
              <span>{{ role }}</span>
            </button>
          }
        </div>
      </ng-template>

      <ng-template #assigneeMenu>
        <div hellMenu>
          <button hellMenuItem type="button" (click)="setAssigneeFilter('all')">
            @if (assigneeFilter() === 'all') {
              <hell-icon hellMenuItemIcon name="faSolidCheck" />
            } @else {
              <span hellMenuItemIcon></span>
            }
            <span>Anyone</span>
          </button>
          @for (assignee of assignees; track assignee) {
            <button hellMenuItem type="button" (click)="setAssigneeFilter(assignee)">
              @if (assigneeFilter() === assignee) {
                <hell-icon hellMenuItemIcon name="faSolidCheck" />
              } @else {
                <span hellMenuItemIcon></span>
              }
              <span>{{ assignee }}</span>
            </button>
          }
        </div>
      </ng-template>

      <ng-template #sortMenu>
        <div hellMenu>
          <button hellMenuItem type="button" [hellSubmenuTrigger]="orderByMenu">
            <hell-icon hellMenuItemIcon name="faSolidTable" />
            <span>Order by</span>
            <span hellMenuItemTrailing>{{ orderByLabel() }}</span>
          </button>
          <button hellMenuItem type="button" [hellSubmenuTrigger]="orderMenu">
            <span hellMenuItemIcon></span>
            <span>Order</span>
            <span hellMenuItemTrailing>{{ orderLabel() }}</span>
          </button>
        </div>
      </ng-template>

      <ng-template #orderByMenu>
        <div hellMenu>
          @for (option of orderByOptions; track option.value) {
            <button hellMenuItem type="button" (click)="setOrderBy(option.value)">
              @if (orderBy() === option.value) {
                <hell-icon hellMenuItemIcon name="faSolidCheck" />
              } @else {
                <span hellMenuItemIcon></span>
              }
              <span>{{ option.label }}</span>
            </button>
          }
        </div>
      </ng-template>

      <ng-template #orderMenu>
        <div hellMenu>
          @for (option of orderOptions; track option.value) {
            <button hellMenuItem type="button" (click)="setOrder(option.value)">
              @if (order() === option.value) {
                <hell-icon hellMenuItemIcon name="faSolidCheck" />
              } @else {
                <span hellMenuItemIcon></span>
              }
              <span>{{ option.label }}</span>
            </button>
          }
        </div>
      </ng-template>

      <hell-split-view
        framed
        backLabel="Rows"
        [height]="560"
        [compactBelow]="720"
        [primaryFlex]="3"
        [detailFlex]="2"
        [primaryMinSize]="320"
        [detailMinSize]="260"
        [detailOpen]="!!activeRow()"
        (detailOpenChange)="onDetailOpenChange($event)"
      >
        <ng-template hellSplitPrimary>
          <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-2">
            <div hellTableContainer class="min-h-0 flex-1 overflow-auto" [busy]="loading()">
              <table hellTable contentWidth>
                <thead hellTableHead>
                  <tr>
                    @if (columnVisible('selection')) {
                      <th hellTableHeaderCell hellTableSelectionCell class="w-12">
                        <input
                          hellTableRowCheckbox
                          type="checkbox"
                          aria-label="Select visible rows"
                          [checked]="allVisibleSelected()"
                          [indeterminate]="someVisibleSelected()"
                          (checkedChange)="setVisibleSelection($event)"
                        />
                      </th>
                    }
                    @if (columnVisible('id')) {
                      <th
                        hellTableHeaderCell
                        columnId="id"
                        class="w-20"
                        sortable
                        [sort]="tableSortKey() === 'id' ? order() : null"
                        (sortToggle)="toggleSort('id')"
                      >
                        <button hellTableSortTrigger type="button">ID</button>
                        <span hellTableResizeHandle></span>
                      </th>
                    }
                    @if (columnVisible('name')) {
                      <th
                        hellTableHeaderCell
                        columnId="name"
                        class="w-45"
                        sortable
                        [sort]="tableSortKey() === 'name' ? order() : null"
                        (sortToggle)="toggleSort('name')"
                      >
                        <button hellTableSortTrigger type="button">Name</button>
                        <span hellTableResizeHandle></span>
                      </th>
                    }
                    @if (columnVisible('email')) {
                      <th
                        hellTableHeaderCell
                        columnId="email"
                        class="w-65"
                        sortable
                        [sort]="tableSortKey() === 'email' ? order() : null"
                        (sortToggle)="toggleSort('email')"
                      >
                        <button hellTableSortTrigger type="button">Email</button>
                        <span hellTableResizeHandle></span>
                      </th>
                    }
                    @if (columnVisible('role')) {
                      <th
                        hellTableHeaderCell
                        columnId="role"
                        class="w-35"
                        sortable
                        [sort]="tableSortKey() === 'role' ? order() : null"
                        (sortToggle)="toggleSort('role')"
                      >
                        <button hellTableSortTrigger type="button">Role</button>
                        <span hellTableResizeHandle></span>
                      </th>
                    }
                    @if (columnVisible('assignee')) {
                      <th
                        hellTableHeaderCell
                        columnId="assignee"
                        class="w-45"
                        sortable
                        [sort]="tableSortKey() === 'assignee' ? order() : null"
                        (sortToggle)="toggleSort('assignee')"
                      >
                        <button hellTableSortTrigger type="button">Assignee</button>
                      </th>
                    }
                    @if (columnVisible('actions')) {
                      <th hellTableHeaderCell class="w-28">Actions</th>
                    }
                  </tr>
                </thead>
                <tbody hellTableBody>
                  @if (loading()) {
                    @for (row of skeletonRows(); track row) {
                      <tr hellTableRow>
                        @if (columnVisible('selection')) {
                          <td hellTableCell hellTableSelectionCell><div hellSkeleton width="14px" height="14px"></div></td>
                        }
                        @if (columnVisible('id')) {
                          <td hellTableCell><div hellSkeleton width="34px" height="13px"></div></td>
                        }
                        @if (columnVisible('name')) {
                          <td hellTableCell><div hellSkeleton width="70%" height="13px"></div></td>
                        }
                        @if (columnVisible('email')) {
                          <td hellTableCell><div hellSkeleton width="84%" height="13px"></div></td>
                        }
                        @if (columnVisible('role')) {
                          <td hellTableCell><div hellSkeleton width="58px" height="13px"></div></td>
                        }
                        @if (columnVisible('assignee')) {
                          <td hellTableCell><div hellSkeleton width="72px" height="13px"></div></td>
                        }
                        @if (columnVisible('actions')) {
                          <td hellTableCell><div hellSkeleton width="54px" height="24px"></div></td>
                        }
                      </tr>
                    }
                  } @else if (error(); as message) {
                    <tr>
                      <td hellTableCell align="center" space="empty" [attr.colspan]="visibleColumnCount()">
                        {{ message }}
                      </td>
                    </tr>
                  } @else {
                    @for (row of rows(); track row.id) {
                      <tr hellTableRow [active]="activeRowKey() === row.id" [selected]="isSelected(row)">
                        @if (columnVisible('selection')) {
                          <td hellTableCell hellTableSelectionCell>
                            <input
                              hellTableRowCheckbox
                              type="checkbox"
                              [attr.aria-label]="'Select ' + row.name + ' for bulk actions'"
                              [checked]="isSelected(row)"
                              (checkedChange)="setRowSelected(row, $event)"
                            />
                          </td>
                        }
                        @if (columnVisible('id')) {
                          <td hellTableCell>{{ row.id }}</td>
                        }
                        @if (columnVisible('name')) {
                          <td hellTableCell>{{ row.name }}</td>
                        }
                        @if (columnVisible('email')) {
                          <td hellTableCell>{{ row.email }}</td>
                        }
                        @if (columnVisible('role')) {
                          <td hellTableCell>{{ row.role }}</td>
                        }
                        @if (columnVisible('assignee')) {
                          <td hellTableCell>{{ row.assignee }}</td>
                        }
                        @if (columnVisible('actions')) {
                          <td hellTableCell>
                            <button
                              hellButton
                              hellTableRowAction
                              type="button"
                              variant="ghost"
                              size="xs"
                              [attr.aria-label]="'Open details for ' + row.name"
                              [attr.aria-controls]="detailPaneId"
                              [attr.aria-expanded]="activeRowKey() === row.id ? 'true' : 'false'"
                              (click)="openRow(row)"
                            >
                              Open
                            </button>
                          </td>
                        }
                      </tr>
                    } @empty {
                      <tr>
                        <td hellTableCell align="center" space="empty" [attr.colspan]="visibleColumnCount()">
                          No results.
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <div
              class="shrink-0 overflow-x-auto overflow-y-hidden rounded-md border border-hell-border bg-hell-surface-subtle"
            >
              <div class="flex min-w-max items-center justify-between gap-3 p-2 text-xs">
                <span>{{ rangeLabel() }}</span>
                <div class="flex items-center gap-2">
                  <button
                    hellButton
                    size="xs"
                    type="button"
                    [hellMenuTrigger]="pageSizeMenu"
                    [openTriggers]="menuOpenTriggers"
                    placement="top-end"
                  >
                    {{ pageSize() }} rows
                    <hell-icon name="faSolidChevronDown" size="10px" />
                  </button>
                  <hell-pagination
                    [siblingCount]="1"
                    [page]="page() + 1"
                    [pageCount]="pageCount()"
                    (pageChange)="setPage($event - 1)"
                  />
                </div>
              </div>
            </div>
          </div>
        </ng-template>

        <ng-template hellSplitDetail>
          <div [id]="detailPaneId" class="flex min-h-0 min-w-0 flex-1 flex-col">
            @if (activeRow(); as row) {
              <div class="flex items-center justify-between border-b border-hell-border bg-hell-surface-subtle p-3">
                <strong class="text-sm font-semibold text-hell-foreground">{{ row.name }}</strong>
                <span class="text-xs text-hell-foreground-muted">#{{ row.id }}</span>
              </div>
              <textarea
                class="min-h-0 min-w-0 flex-1 resize-none rounded border border-hell-border bg-transparent p-3 text-sm text-hell-foreground"
                rows="12"
                [value]="docText()"
                (input)="onEditorChange($any($event.target).value ?? '')"
              ></textarea>
            } @else {
              <div class="flex flex-1 items-center justify-center text-center text-sm text-hell-foreground-muted">
                Open a row to edit.
              </div>
            }
          </div>
        </ng-template>
      </hell-split-view>

      <ng-template #pageSizeMenu>
        <div hellMenu>
          @for (option of pageSizeOptions; track option) {
            <button hellMenuItem type="button" (click)="setPageSize(option)">
              @if (pageSize() === option) {
                <hell-icon hellMenuItemIcon name="faSolidCheck" />
              } @else {
                <span hellMenuItemIcon></span>
              }
              <span>{{ option }} rows</span>
            </button>
          }
        </div>
      </ng-template>
    </div>
  `,
})
export class DataTableExampleExample {
  private readonly destroyRef = inject(DestroyRef);
  private controller: AbortController | null = null;
  private requestId = 0;
  private nextTokenId = 0;

  protected readonly draftSearch = signal('');
  protected readonly searchTokens = signal<readonly SearchToken[]>([]);
  protected readonly rows = signal<readonly Row[]>([]);
  protected readonly totalRows = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly pageSize = signal<(typeof PAGE_SIZES)[number]>(10);
  protected readonly orderBy = signal<RowOrderBy>('rank');
  protected readonly order = signal<RowOrder>('desc');
  protected readonly roleFilter = signal<RowFilter<RowRole>>('all');
  protected readonly assigneeFilter = signal<RowFilter<RowAssignee>>('all');
  protected readonly activeRowKey = signal<number | null>(null);
  protected readonly rowSelection = signal<Readonly<Record<string, boolean>>>({});
  protected readonly columnVisibility = signal<HellTableColumnVisibilityState>(
    hellTableInitialColumnVisibility(TABLE_COLUMNS),
  );

  private readonly drafts = signal<ReadonlyMap<number, string>>(new Map());

  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly visibleColumns = computed(() =>
    hellTableVisibleColumns(this.tableColumns, this.columnVisibility()),
  );
  protected readonly visibleColumnCount = computed(() => this.visibleColumns().length);
  protected readonly selectedCount = computed(
    () => Object.values(this.rowSelection()).filter(Boolean).length,
  );

  protected readonly roles = ROLES;
  protected readonly assignees = ASSIGNEES;
  protected readonly pageSizeOptions = PAGE_SIZES;
  protected readonly searchSuggestionLimit = SEARCH_SUGGESTION_LIMIT;
  protected readonly detailPaneId = 'data-table-example-detail-pane';
  protected readonly menuOpenTriggers: ('click' | 'enter' | 'arrowkey')[] = [
    'click',
    'enter',
    'arrowkey',
  ];
  protected readonly orderByOptions: readonly { readonly value: RowOrderBy; readonly label: string }[] = [
    { value: 'rank', label: 'Best match' },
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'assignee', label: 'Assignee' },
  ];
  protected readonly orderOptions: readonly { readonly value: RowOrder; readonly label: string }[] = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];

  protected readonly searchSuggestions = computed<readonly SearchSuggestion[]>(() => {
    const value = this.draftSearch().trim();
    if (!value) return [];

    return SEARCH_SCOPES.slice(0, this.searchSuggestionLimit).map((scope) => ({
      scope: scope.value,
      value,
      title: `Search ${scope.label.toLowerCase()} for "${value}"`,
      detail: scope.detail,
      icon: scope.icon,
    }));
  });

  protected readonly request = computed<RowApiRequest>(() => ({
    tokens: this.searchTokens(),
    page: this.page(),
    pageSize: this.pageSize(),
    orderBy: this.orderBy(),
    order: this.order(),
    role: this.roleFilter(),
    assignee: this.assigneeFilter(),
  }));
  protected readonly tableSortKey = computed(() =>
    this.orderBy() === 'rank' ? null : this.orderBy(),
  );
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalRows() / this.pageSize())),
  );
  protected readonly rangeLabel = computed(() => {
    if (this.loading()) return 'Loading rows';
    const total = this.totalRows();
    if (!total) return '0 of 0';
    const start = this.page() * this.pageSize();
    return `${start + 1}-${Math.min(start + this.rows().length, total)} of ${total}`;
  });
  protected readonly skeletonRows = computed(() =>
    Array.from({ length: Math.min(this.pageSize(), 10) }, (_, i) => i),
  );
  protected readonly hasActiveFilters = computed(
    () => this.roleFilter() !== 'all' || this.assigneeFilter() !== 'all',
  );
  protected readonly hasQueryState = computed(
    () =>
      this.searchTokens().length > 0 ||
      this.hasActiveFilters() ||
      this.orderBy() !== 'rank' ||
      this.order() !== 'desc',
  );
  protected readonly orderByLabel = computed(
    () => this.orderByOptions.find((option) => option.value === this.orderBy())?.label ?? 'Best match',
  );
  protected readonly orderLabel = computed(
    () => this.orderOptions.find((option) => option.value === this.order())?.label ?? 'Descending',
  );
  protected readonly roleLabel = computed(() =>
    this.roleFilter() === 'all' ? 'Any role' : this.roleFilter(),
  );
  protected readonly assigneeLabel = computed(() =>
    this.assigneeFilter() === 'all' ? 'Anyone' : this.assigneeFilter(),
  );
  protected readonly activeRow = computed(
    () => this.rows().find((row) => row.id === this.activeRowKey()) ?? null,
  );
  protected readonly allVisibleSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.isSelected(row));
  });
  protected readonly someVisibleSelected = computed(() => {
    const rows = this.rows();
    const selectedCount = rows.filter((row) => this.isSelected(row)).length;
    return selectedCount > 0 && selectedCount < rows.length;
  });
  protected readonly docText = computed(() => {
    const row = this.activeRow();
    if (!row) return '';
    return this.drafts().get(row.id) ?? JSON.stringify(row, null, 2);
  });

  constructor() {
    effect(() => {
      void this.loadRows(this.request());
    });
    this.destroyRef.onDestroy(() => this.controller?.abort());
  }

  protected commitSearch(suggestion: SearchSuggestion): void {
    const value = suggestion.value.trim();
    if (!value) return;

    const normalized = hellSearchKey(value);
    if (
      this.searchTokens().some(
        (token) => token.scope === suggestion.scope && hellSearchKey(token.value) === normalized,
      )
    ) {
      this.draftSearch.set('');
      return;
    }

    this.searchTokens.update((tokens) => [
      ...tokens,
      { id: ++this.nextTokenId, scope: suggestion.scope, value },
    ]);
    this.draftSearch.set('');
    this.page.set(0);
  }

  protected removeSearchToken(id: number): void {
    this.searchTokens.update((tokens) => tokens.filter((token) => token.id !== id));
    this.page.set(0);
  }

  protected tokenLabel(token: SearchToken): string {
    const scope = SEARCH_SCOPES.find((option) => option.value === token.scope);
    return `${scope?.label ?? token.scope}: ${token.value}`;
  }

  protected clearQueryState(): void {
    this.searchTokens.set([]);
    this.clearFilters();
    this.orderBy.set('rank');
    this.order.set('desc');
    this.page.set(0);
  }

  protected clearFilters(): void {
    this.roleFilter.set('all');
    this.assigneeFilter.set('all');
    this.page.set(0);
  }

  protected setPage(page: number): void {
    this.page.set(Math.max(0, Math.min(page, this.pageCount() - 1)));
  }

  protected setPageSize(size: (typeof PAGE_SIZES)[number]): void {
    this.pageSize.set(size);
    this.page.set(0);
  }

  protected setOrderBy(orderBy: RowOrderBy): void {
    this.orderBy.set(orderBy);
    this.page.set(0);
  }

  protected setOrder(order: RowOrder): void {
    this.order.set(order);
    this.page.set(0);
  }

  protected setRoleFilter(role: RowFilter<RowRole>): void {
    this.roleFilter.set(role);
    this.page.set(0);
  }

  protected setAssigneeFilter(assignee: RowFilter<RowAssignee>): void {
    this.assigneeFilter.set(assignee);
    this.page.set(0);
  }

  protected toggleSort(key: keyof Row): void {
    if (this.orderBy() !== key) {
      this.orderBy.set(key);
      this.order.set('asc');
    } else if (this.order() === 'asc') {
      this.order.set('desc');
    } else {
      this.orderBy.set('rank');
      this.order.set('desc');
    }
    this.page.set(0);
  }

  protected columnVisible(columnId: string): boolean {
    return this.visibleColumns().some((column) => column.id === columnId);
  }

  protected isSelected(row: Row): boolean {
    return this.rowSelection()[row.id] === true;
  }

  protected setRowSelected(row: Row, checked: boolean): void {
    this.rowSelection.update((current) => rowSelectionWith(current, row.id, checked));
  }

  protected setVisibleSelection(checked: boolean): void {
    this.rowSelection.update((current) => {
      let next = current;
      for (const row of this.rows()) {
        next = rowSelectionWith(next, row.id, checked);
      }
      return next;
    });
  }

  protected clearRowSelection(): void {
    this.rowSelection.set({});
  }

  protected openRow(row: Row): void {
    this.activeRowKey.set(row.id);
  }

  protected onDetailOpenChange(open: boolean): void {
    if (!open) this.activeRowKey.set(null);
  }

  protected onEditorChange(text: string): void {
    const id = this.activeRowKey();
    if (id == null) return;
    const next = new Map(this.drafts());
    next.set(id, text);
    this.drafts.set(next);
  }

  private async loadRows(request: RowApiRequest): Promise<void> {
    const id = ++this.requestId;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await fetchRowsPage(request, controller.signal);
      if (id !== this.requestId || controller.signal.aborted) return;
      this.rows.set(page.hits.map((hit) => hit.row));
      this.totalRows.set(page.total);
      if (!page.hits.some((hit) => hit.row.id === this.activeRowKey())) {
        this.activeRowKey.set(null);
      }
    } catch (error) {
      if (id !== this.requestId || controller.signal.aborted) return;
      this.rows.set([]);
      this.totalRows.set(0);
      this.error.set(error instanceof Error ? error.message : 'Search failed');
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }
}

function rowSelectionWith(
  current: Readonly<Record<string, boolean>>,
  rowId: number,
  checked: boolean,
): Readonly<Record<string, boolean>> {
  const next = { ...current };
  if (checked) next[String(rowId)] = true;
  else delete next[String(rowId)];
  return next;
}

function fetchRowsPage(request: RowApiRequest, signal?: AbortSignal): Promise<RowApiPage> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const delay = 650 + Math.min(450, request.tokens.length * 120);
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve(runRowsQuery(request));
    }, delay);

    const abort = () => {
      clearTimeout(timeout);
      reject(abortError());
    };

    signal?.addEventListener('abort', abort, { once: true });
  });
}

function runRowsQuery(request: RowApiRequest): RowApiPage {
  const hits = ALL.map((row) => ({ row, score: scoreRow(row, request.tokens) }))
    .filter(({ row, score }) => {
      if (request.tokens.length && score <= 0) return false;
      if (request.role !== 'all' && row.role !== request.role) return false;
      if (request.assignee !== 'all' && row.assignee !== request.assignee) return false;
      return true;
    })
    .sort((a, b) => compareHits(a, b, request));

  const start = request.page * request.pageSize;
  return {
    hits: hits.slice(start, start + request.pageSize),
    total: hits.length,
  };
}

function compareHits(a: RowApiHit, b: RowApiHit, request: RowApiRequest): number {
  if (request.orderBy === 'rank') {
    const ranked = b.score - a.score;
    if (ranked) return ranked;
    return a.row.id - b.row.id;
  }

  const sign = request.order === 'asc' ? 1 : -1;
  const av = a.row[request.orderBy];
  const bv = b.row[request.orderBy];
  return (av > bv ? 1 : av < bv ? -1 : a.row.id - b.row.id) * sign;
}

function scoreRow(row: Row, tokens: readonly SearchToken[]): number {
  if (!tokens.length) return 0;

  let total = 0;
  for (const token of tokens) {
    const words = hellSearchWords(token.value);
    if (!words.length) continue;
    const score = scoreToken(row, token.scope, words);
    if (score <= 0) return 0;
    total += score;
  }
  return total;
}

function scoreToken(row: Row, scope: SearchScope, words: readonly string[]): number {
  const fields = searchableFields(row).filter((field) => scope === 'all' || field.scope === scope);
  let total = 0;
  for (const word of words) {
    let best = 0;
    for (const field of fields) {
      best = Math.max(best, scoreText(field.text, word) * field.weight);
    }
    if (best <= 0) return 0;
    total += best;
  }
  return total;
}

function searchableFields(row: Row): readonly {
  readonly scope: keyof Row;
  readonly weight: number;
  readonly text: string;
}[] {
  return [
    { scope: 'name', weight: 5, text: hellSearchKey(row.name) },
    { scope: 'email', weight: 4, text: hellSearchKey(row.email) },
    { scope: 'role', weight: 3, text: hellSearchKey(row.role) },
    { scope: 'assignee', weight: 3, text: hellSearchKey(row.assignee) },
    { scope: 'id', weight: 2, text: hellSearchKey(String(row.id)) },
  ];
}

function scoreText(text: string, word: string): number {
  if (text === word) return 120;
  if (text.startsWith(word)) return 90;

  const tokens = text.split(' ');
  if (tokens.some((token) => token === word)) return 80;
  if (tokens.some((token) => token.startsWith(word))) return 60;
  if (text.includes(word)) return 35;
  return 0;
}

function abortError(): unknown {
  if (typeof DOMException !== 'undefined') return new DOMException('Aborted', 'AbortError');
  return new Error('Aborted');
}
