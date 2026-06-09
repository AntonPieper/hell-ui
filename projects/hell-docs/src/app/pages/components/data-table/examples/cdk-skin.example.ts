import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { faSolidSliders } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';
import {
  HellColumnVisibilityMenu,
  HellTableContainer,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  hellTableVisibleColumns,
  textColumn,
  type HellTableColumnVisibilityState,
  type HellTableSortDirection,
  type HellTableSortingState,
} from '@hell-ui/angular/table';
import { HELL_CDK_TABLE_DIRECTIVES, hellCdkDisplayedColumns } from '@hell-ui/angular/table-cdk';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const columns = hellColumns<Person>();
const TABLE_COLUMNS = columns.define([
  textColumn<Person, string>('name', {
    header: 'Name',
    accessor: 'name',
    sortable: true,
    visibility: 'always',
  }),
  textColumn<Person, string>('email', {
    header: 'Email',
    accessor: 'email',
    visibility: 'user-toggleable',
  }),
  textColumn<Person, string>('role', {
    header: 'Role',
    accessor: 'role',
    visibility: 'initially-hidden',
  }),
  actionColumn<Person>('actions', {
    header: 'Actions',
  }),
]);

@Component({
  selector: 'app-data-table-cdk-skin-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellIcon,
    HellColumnVisibilityMenu,
    HellPaginationStrip,
    HellTableContainer,
    ...HELL_MENU_DIRECTIVES,
    ...HELL_CDK_TABLE_DIRECTIVES,
  ],
  providers: [provideIcons({ faSolidSliders })],
  template: `
    <div class="grid gap-3">
      <div class="grid gap-3">
        <div
          class="flex flex-wrap items-center justify-between gap-2 text-xs text-hell-foreground-muted"
        >
          <span>CDK owns dataSource, sorting transform, and pagination state.</span>
          <div class="flex flex-wrap items-center gap-2">
            <button
              hellButton
              type="button"
              size="sm"
              [variant]="hiddenColumnCount() ? 'soft' : 'default'"
              [hellMenuTrigger]="columnsMenu"
              [openTriggers]="menuOpenTriggers"
              placement="bottom-end"
            >
              <hell-icon name="faSolidSliders" size="12px" />
              Columns
            </button>
          </div>
        </div>

        <ng-template #columnsMenu>
          <hell-column-visibility-menu
            [columns]="tableColumns"
            [(columnVisibility)]="columnVisibility"
            label="Columns"
            description="The CDK row definitions receive this derived displayedColumns list."
            resetLabel="Restore"
          />
        </ng-template>

        <div hellTableContainer class="overflow-auto">
          <table cdk-table fixedLayout contentWidth [dataSource]="pagedRows()">
            <ng-container cdkColumnDef="name">
              <th
                cdk-header-cell
                *cdkHeaderCellDef
                scope="col"
                columnId="name"
                sortable
                [sort]="sortFor('name')"
                (sortToggle)="toggleSort('name')"
              >
                <button hellTableSortTrigger type="button">Name</button>
              </th>
              <td cdk-cell *cdkCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container cdkColumnDef="email">
              <th cdk-header-cell *cdkHeaderCellDef scope="col" columnId="email">Email</th>
              <td cdk-cell *cdkCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container cdkColumnDef="role">
              <th cdk-header-cell *cdkHeaderCellDef scope="col" columnId="role">Role</th>
              <td cdk-cell *cdkCellDef="let row">{{ row.role }}</td>
            </ng-container>

            <ng-container cdkColumnDef="actions">
              <th cdk-header-cell *cdkHeaderCellDef scope="col" columnId="actions">Actions</th>
              <td cdk-cell *cdkCellDef="let row">
                <button
                  hellButton
                  hellTableRowAction
                  type="button"
                  size="xs"
                  variant="ghost"
                  (click)="openRow(row)"
                >
                  Open {{ row.name }}
                </button>
              </td>
            </ng-container>

            <tr cdk-header-row *cdkHeaderRowDef="displayedColumns()"></tr>
            <tr
              cdk-row
              *cdkRowDef="let row; columns: displayedColumns()"
              [active]="row.id === activeRowId()"
            ></tr>
          </table>
        </div>

        <div
          class="overflow-x-auto overflow-y-hidden rounded-md border border-hell-border bg-hell-surface-subtle"
        >
          <div class="flex min-w-max items-center justify-between gap-3 p-2 text-xs">
            <span>{{ rangeLabel() }}</span>
            <hell-pagination
              [siblingCount]="1"
              [page]="pageIndex() + 1"
              [pageCount]="pageCount()"
              (pageChange)="setPage($event - 1)"
            />
          </div>
        </div>

        @if (activeRow(); as row) {
          <span class="text-xs text-hell-foreground-muted">Active row: {{ row.name }}</span>
        }
      </div>
    </div>
  `,
})
export class DataTableCdkSkinExample {
  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
    { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Viewer' },
    { id: 'linus', name: 'Linus Torvalds', email: 'linus@example.com', role: 'Maintainer' },
  ];
  protected readonly columnVisibility = signal<HellTableColumnVisibilityState>(
    hellTableInitialColumnVisibility(TABLE_COLUMNS),
  );
  protected readonly sorting = signal<readonly HellTableSortingState[]>([]);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = 2;
  protected readonly activeRowId = signal<string | null>(null);
  protected readonly displayedColumns = computed(() =>
    hellCdkDisplayedColumns(this.tableColumns, this.columnVisibility()),
  );
  protected readonly hiddenColumnCount = computed(
    () =>
      this.tableColumns.length -
      hellTableVisibleColumns(this.tableColumns, this.columnVisibility()).length,
  );
  protected readonly sortedRows = computed(() => sortRows(this.rows, this.sorting()));
  protected readonly pageCount = computed(() =>
    Math.ceil(this.sortedRows().length / this.pageSize),
  );
  protected readonly pagedRows = computed(() => {
    const page = Math.min(this.pageIndex(), Math.max(this.pageCount() - 1, 0));
    const start = page * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });
  protected readonly rangeLabel = computed(() => {
    const total = this.sortedRows().length;
    if (!total) return '0 of 0';
    const start = this.pageIndex() * this.pageSize;
    return `${start + 1}-${Math.min(start + this.pagedRows().length, total)} of ${total}`;
  });
  protected readonly activeRow = computed(
    () => this.rows.find((row) => row.id === this.activeRowId()) ?? null,
  );
  protected readonly menuOpenTriggers: ('click' | 'enter' | 'arrowkey')[] = [
    'click',
    'enter',
    'arrowkey',
  ];

  protected sortFor(columnId: string): HellTableSortDirection | null {
    return this.sorting().find((sort) => sort.columnId === columnId)?.direction ?? null;
  }

  protected toggleSort(columnId: string): void {
    const current = this.sortFor(columnId);
    const direction: HellTableSortDirection | null =
      current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
    this.sorting.set(direction ? [{ columnId, direction }] : []);
    this.pageIndex.set(0);
  }

  protected setPage(page: number): void {
    this.pageIndex.set(Math.max(0, Math.min(page, Math.max(this.pageCount() - 1, 0))));
  }

  protected openRow(row: Person): void {
    this.activeRowId.set(row.id);
  }
}

function sortRows(
  rows: readonly Person[],
  sorting: readonly HellTableSortingState[],
): readonly Person[] {
  const activeSort = sorting[0];
  if (!activeSort) return rows;
  return [...rows].sort((a, b) => {
    const result = a.name.localeCompare(b.name);
    return activeSort.direction === 'desc' ? -result : result;
  });
}
