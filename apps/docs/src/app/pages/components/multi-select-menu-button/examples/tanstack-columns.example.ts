import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type WritableSignal,
} from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellTableShellToolbar, HellTanStackTable } from '@hell-ui/angular/table-tanstack';
import {
  createAngularTable,
  getCoreRowModel,
  type ColumnDef,
  type Updater,
  type VisibilityState,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly status: string;
  readonly team: string;
  readonly email: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Owner', status: 'Active', team: 'Platform', email: 'ada@example.com' },
  { id: 'grace', name: 'Grace Hopper', role: 'Admin', status: 'Active', team: 'Compiler', email: 'grace@example.com' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Member', status: 'Invited', team: 'Flight', email: 'kj@example.com' },
  { id: 'dorothy', name: 'Dorothy Vaughan', role: 'Member', status: 'Active', team: 'Operations', email: 'dv@example.com' },
];

// The app owns the storage key and its version — the recipe persists nothing itself.
const STORAGE_KEY = 'hell-docs.people-table.column-visibility.v1';
const MIN_VISIBLE = 1;

function loadColumnVisibility(): VisibilityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  } catch {
    return {};
  }
}

function saveColumnVisibility(state: VisibilityState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota) — the table still works in-session.
  }
}

@Component({
  selector: 'app-multi-select-menu-button-tanstack-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellTanStackTable,
    HellTableShellToolbar,
    ...HELL_MENU_DIRECTIVES,
  ],
  template: `
    <hell-tanstack-table [table]="table" stickyHeader>
      <div hellTableShellToolbar>
        <button
          hellButton
          type="button"
          [hellMenuTrigger]="columnsMenu"
          [attr.data-selection-count]="visibleColumns().length"
        >
          Columns ({{ visibleColumns().length }})
        </button>
        <ng-template #columnsMenu>
          <div hellMenu aria-label="Visible columns">
            <hell-menu-options
              [options]="columnOptions()"
              [selected]="visibleColumns()"
              (selectedChange)="setVisibleColumns($event)"
            />
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button" (click)="resetColumns()">Reset to default</button>
          </div>
        </ng-template>
      </div>
    </hell-tanstack-table>
  `,
})
export class MultiSelectMenuButtonTanStackExample {
  protected readonly rows = signal<Person[]>([...PEOPLE]);

  // TanStack owns the column-visibility state; the app persists it to localStorage.
  protected readonly columnVisibility = signal<VisibilityState>(loadColumnVisibility());

  protected readonly columns: ColumnDef<Person>[] = [
    // The anchor column opts out of hiding, so it never appears in the menu and
    // the table can never lose its identity column.
    { accessorKey: 'name', header: 'Name', enableHiding: false, size: 200 },
    { accessorKey: 'role', header: 'Role', size: 128 },
    { accessorKey: 'status', header: 'Status', size: 128 },
    { accessorKey: 'team', header: 'Team', size: 160 },
    { accessorKey: 'email', header: 'Email', size: 220 },
  ];

  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    state: { columnVisibility: this.columnVisibility() },
    onColumnVisibilityChange: (updater) => {
      applyUpdater(this.columnVisibility, updater);
      saveColumnVisibility(this.columnVisibility());
    },
  }));

  // Options are the columns TanStack reports as hideable (enableHiding !== false),
  // with the selection floor applied: the last visible column disables.
  protected readonly columnOptions = computed<readonly HellOption<string>[]>(() => {
    const visible = this.visibleColumns();
    const atFloor = visible.length <= MIN_VISIBLE;
    return this.table
      .getAllLeafColumns()
      .filter((column) => column.getCanHide())
      .map((column) => ({
        value: column.id,
        label: String(column.columnDef.header ?? column.id),
        disabled: atFloor && visible.includes(column.id),
      }));
  });

  // The controlled selection is the set of hideable columns currently visible.
  protected readonly visibleColumns = computed<string[]>(() => {
    const visibility = this.columnVisibility();
    return this.table
      .getAllLeafColumns()
      .filter((column) => column.getCanHide())
      .map((column) => column.id)
      .filter((id) => visibility[id] !== false);
  });

  protected setVisibleColumns(next: readonly string[]): void {
    const visibility: VisibilityState = {};
    for (const option of this.columnOptions()) {
      visibility[option.value] = next.includes(option.value);
    }
    // Route the whole next state back through the table instance (TanStack owns it).
    this.table.setColumnVisibility(visibility);
  }

  protected resetColumns(): void {
    // Empty map = every column visible again.
    this.table.setColumnVisibility({});
  }
}

function applyUpdater<T>(target: WritableSignal<T>, updater: Updater<T>): void {
  target.update((current) =>
    typeof updater === 'function' ? (updater as (value: T) => T)(current) : updater,
  );
}
