import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { faSolidSliders } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import {
  HELL_DATA_TABLE_DIRECTIVES,
  HellColumnVisibilitySelector,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  selectionColumn,
  textColumn,
  type HellTableColumnVisibilityState,
} from '@hell-ui/angular/data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const STORAGE_KEY = 'hell-docs:data-table-column-visibility';
const columns = hellColumns<Person>();
const TABLE_COLUMNS = columns.define([
  selectionColumn<Person>('selection', {
    header: 'Select',
    selectAll: false,
    ariaLabel: (row) => `Select ${row.name}`,
  }),
  textColumn<Person, string>('name', {
    header: 'Name',
    accessor: 'name',
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
  actionColumn<Person>('actions', { header: 'Actions' }),
]);

@Component({
  selector: 'app-data-table-column-visibility-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellIcon,
    HellColumnVisibilitySelector,
    ...HELL_DATA_TABLE_DIRECTIVES,
  ],
  providers: [provideIcons({ faSolidSliders })],
  template: `
    <div class="grid gap-3">
      <div
        class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hell-border bg-hell-surface-subtle p-2 text-xs text-hell-foreground-muted"
      >
        <span>Preferences are stored by this example component, not by Hell.</span>
        <hell-column-visibility-selector
          [columns]="tableColumns"
          [(columnVisibility)]="columnVisibility"
          description="Show or hide optional columns."
        >
          <hell-icon hellColumnVisibilitySelectorIcon name="faSolidSliders" size="12px" />
        </hell-column-visibility-selector>
      </div>

      <hell-data-table
        [rows]="rows"
        [columns]="tableColumns"
        rowKey="id"
        density="compact"
        [(rowSelection)]="rowSelection"
        [(columnVisibility)]="columnVisibility"
      >
        <button hellDataTableBulkActions hellButton type="button" variant="primary" size="sm">
          Bulk actions for {{ selectedCount() }} rows
        </button>
        <ng-template [hellRowActions]="'actions'" let-row="row">
          <button type="button" hellButton hellTableRowAction size="xs" variant="ghost">
            Open {{ row.original.name }}
          </button>
        </ng-template>
      </hell-data-table>
    </div>
  `,
})
export class DataTableColumnVisibilityExample {
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
    { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Viewer' },
  ];
  protected readonly tableColumns = TABLE_COLUMNS;
  protected readonly rowSelection = signal<Readonly<Record<string, boolean>>>({});
  protected readonly columnVisibility = signal<HellTableColumnVisibilityState>(
    readStoredVisibility() ?? hellTableInitialColumnVisibility(TABLE_COLUMNS),
  );

  constructor() {
    effect(() => writeStoredVisibility(this.columnVisibility()));
  }

  protected selectedCount(): number {
    return Object.values(this.rowSelection()).filter(Boolean).length;
  }
}

function readStoredVisibility(): HellTableColumnVisibilityState | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const visibility: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') visibility[key] = value;
    }
    return visibility;
  } catch {
    return null;
  }
}

function writeStoredVisibility(visibility: HellTableColumnVisibilityState): void {
  safeLocalStorage()?.setItem(STORAGE_KEY, JSON.stringify(visibility));
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
