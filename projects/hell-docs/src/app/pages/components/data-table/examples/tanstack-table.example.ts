import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import {
  createAngularTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/angular-table';

import { HellButton } from '@hell-ui/angular/button';
import {
  HellTable,
  HellTableBody,
  HellTableCell,
  HellTableContainer,
  HellTableHead,
  HellTableHeaderCell,
  HellTableRow,
  HellTableSortTrigger,
  type HellTableSortDirection,
} from '@hell-ui/angular/table';
import {
  HellTanStackFlexRenderOutlet,
  hellTanStackIsFlexRenderValue,
  hellTanStackResolveFlexRenderValue,
  hellTanStackTableModel,
  type HellTanStackFlexRenderValue,
} from '@hell-ui/angular/table-tanstack';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Viewer' },
];

const COLUMNS: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (context) => context.getValue<string>(),
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: (context) => context.getValue<string>(),
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: (context) => context.getValue<string>(),
  },
];

@Component({
  selector: 'app-data-table-tanstack-table-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    NgTemplateOutlet,
    HellTableContainer,
    HellTable,
    HellTableHead,
    HellTableBody,
    HellTableRow,
    HellTableHeaderCell,
    HellTableSortTrigger,
    HellTableCell,
    HellTanStackFlexRenderOutlet,
  ],
  template: `
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-hell-foreground-muted">
        <span>TanStack owns sorting, row models, and visibility; Hell renders the normalized model.</span>
        <button type="button" hellButton size="sm" variant="ghost" (click)="toggleEmailColumn()">
          {{ columnVisibility()['email'] === false ? 'Show email' : 'Hide email' }}
        </button>
      </div>

      <div hellTableContainer class="overflow-auto">
        <table hellTable contentWidth>
          <thead hellTableHead>
            @for (headerGroup of model.headerGroups(); track headerGroup.id) {
              <tr hellTableRow>
                @for (header of headerGroup.headers; track header.id) {
                  <th
                    hellTableHeaderCell
                    scope="col"
                    [attr.colspan]="header.colSpan ?? null"
                    [attr.rowspan]="header.rowSpan ?? null"
                    [columnId]="header.columnId ?? null"
                    [sortable]="header.column?.sortable ?? false"
                    [sort]="sortFor(header.columnId)"
                    (sortToggle)="toggleSort(header.columnId)"
                  >
                    @if (!header.placeholder) {
                      @if (header.column?.sortable) {
                        <button hellTableSortTrigger type="button">
                          <ng-container [ngTemplateOutlet]="headerContent" />
                        </button>
                      } @else {
                        <ng-container [ngTemplateOutlet]="headerContent" />
                      }

                      <ng-template #headerContent>
                        @if (asTanStackRender(header.label); as render) {
                          <hell-tanstack-flex-render [value]="render" />
                        } @else {
                          {{ resolveTanStackValue(header.label) }}
                        }
                      </ng-template>
                    }
                  </th>
                }
              </tr>
            }
          </thead>
          <tbody hellTableBody>
            @for (row of model.rows(); track row.key) {
              <tr hellTableRow [selected]="model.commands.isRowSelected(row)">
                @for (cell of model.cellsForRow(row); track cell.id) {
                  <td hellTableCell [attr.data-column-id]="cell.column.id">
                    @if (asTanStackRender(cell.render); as render) {
                      <hell-tanstack-flex-render [value]="render" />
                    } @else {
                      {{ resolveTanStackValue(cell.renderValue ?? cell.value) }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class DataTableTanStackTableExample {
  protected readonly data = signal<Person[]>([...PEOPLE]);
  protected readonly sorting = signal<SortingState>([]);
  protected readonly rowSelection = signal<RowSelectionState>({});
  protected readonly columnVisibility = signal<VisibilityState>({});

  protected readonly table = createAngularTable<Person>(() => ({
    data: this.data(),
    columns: COLUMNS,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    state: {
      sorting: this.sorting(),
      rowSelection: this.rowSelection(),
      columnVisibility: this.columnVisibility(),
    },
    onSortingChange: (updater) => applyUpdater(this.sorting, updater),
    onRowSelectionChange: (updater) => applyUpdater(this.rowSelection, updater),
    onColumnVisibilityChange: (updater) => applyUpdater(this.columnVisibility, updater),
  }));

  protected readonly model = hellTanStackTableModel({ table: this.table });

  protected asTanStackRender(value: unknown): HellTanStackFlexRenderValue | null {
    return hellTanStackIsFlexRenderValue(value) ? value : null;
  }

  protected resolveTanStackValue(value: unknown): unknown {
    return hellTanStackResolveFlexRenderValue(value);
  }

  protected sortFor(columnId: string | undefined): HellTableSortDirection | null {
    if (!columnId) return null;
    const sort = this.model.state.sorting.value().find((candidate) => candidate.columnId === columnId);
    return sort?.direction ?? null;
  }

  protected toggleSort(columnId: string | undefined): void {
    if (!columnId) return;
    const current = this.sortFor(columnId);
    const direction: HellTableSortDirection | null =
      current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
    this.model.commands.setSorting(direction ? [{ columnId, direction }] : []);
  }

  protected toggleEmailColumn(): void {
    this.model.commands.toggleColumnVisible('email');
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
