import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import { HellButton } from '@hell-ui/angular/button';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import {
  HellColumnVisibilityPanel,
  HellTableContainer,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
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
    HellColumnVisibilityPanel,
    HellTableContainer,
    HellPopover,
    HellPopoverTrigger,
    ...HELL_CDK_TABLE_DIRECTIVES,
  ],
  template: `
    <div class="grid gap-3">
      <div class="grid gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-hell-foreground-muted">
          <span>CDK owns dataSource, sorting transform, and pagination state.</span>
          <div class="flex flex-wrap items-center gap-2">
            <span>Page {{ pageIndex() + 1 }} of {{ pageCount() }}</span>
            <button
              hellButton
              type="button"
              size="sm"
              variant="soft"
              [hellPopoverTrigger]="columnsMenu"
              placement="bottom-end"
            >
              CDK columns
            </button>
          </div>
        </div>

        <ng-template #columnsMenu>
          <div hellPopover class="min-w-72">
            <hell-column-visibility-panel
              [columns]="tableColumns"
              [(columnVisibility)]="columnVisibility"
              label="CDK columns"
              description="The CDK row definitions receive this derived displayedColumns list."
              resetLabel="Restore"
            />
          </div>
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

        <div class="flex flex-wrap items-center gap-2">
          <button hellButton type="button" size="sm" variant="ghost" [disabled]="pageIndex() === 0" (click)="previousPage()">
            Previous
          </button>
          <button
            hellButton
            type="button"
            size="sm"
            variant="ghost"
            [disabled]="pageIndex() >= pageCount() - 1"
            (click)="nextPage()"
          >
            Next
          </button>
          @if (activeRow(); as row) {
            <span class="text-xs text-hell-foreground-muted">Active row: {{ row.name }}</span>
          }
        </div>
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
  protected readonly sortedRows = computed(() => sortRows(this.rows, this.sorting()));
  protected readonly pageCount = computed(() => Math.ceil(this.sortedRows().length / this.pageSize));
  protected readonly pagedRows = computed(() => {
    const page = Math.min(this.pageIndex(), Math.max(this.pageCount() - 1, 0));
    const start = page * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });
  protected readonly activeRow = computed(() =>
    this.rows.find((row) => row.id === this.activeRowId()) ?? null,
  );

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

  protected previousPage(): void {
    this.pageIndex.update((page) => Math.max(page - 1, 0));
  }

  protected nextPage(): void {
    this.pageIndex.update((page) => Math.min(page + 1, Math.max(this.pageCount() - 1, 0)));
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
