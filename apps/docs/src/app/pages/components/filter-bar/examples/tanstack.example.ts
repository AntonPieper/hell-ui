import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  HELL_FILTER_TEXT_KEY,
  HellFilterBar,
  type HellFilterField,
  type HellFilterToken,
} from '@hell-ui/angular/filter-bar';
import { HellTableShellToolbar, HellTanStackTable } from '@hell-ui/angular/table-tanstack';
import {
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/angular-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly status: string;
  readonly team: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Owner', status: 'Active', team: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', role: 'Admin', status: 'Active', team: 'Compiler' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Member', status: 'Invited', team: 'Flight' },
  { id: 'dorothy', name: 'Dorothy Vaughan', role: 'Member', status: 'Active', team: 'Operations' },
];

const includesAnyString: FilterFn<Person> = (row, columnId, filterValues: readonly string[]) => {
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
  return filterValues.some((value) => cellValue.includes(value.toLowerCase()));
};

const equalsAnyString: FilterFn<Person> = (row, columnId, filterValues: readonly string[]) => {
  const cellValue = String(row.getValue(columnId) ?? '').toLowerCase();
  return filterValues.some((value) => cellValue === value.toLowerCase());
};

@Component({
  selector: 'app-filter-bar-tanstack-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellFilterBar, HellTanStackTable, HellTableShellToolbar],
  template: `
    <hell-tanstack-table [table]="table" stickyHeader>
      <hell-filter-bar
        hellTableShellToolbar
        aria-label="People filters"
        [fields]="fields"
        [value]="filters()"
        (valueChange)="filters.set($event)"
      />
    </hell-tanstack-table>
    <p class="mt-hell-3 text-xs text-hell-foreground-muted" aria-live="polite">
      {{ table.getFilteredRowModel().rows.length }} people shown
    </p>
  `,
})
export class FilterBarTanStackExample {
  protected readonly rows = signal<Person[]>([...PEOPLE]);
  protected readonly filters = signal<readonly HellFilterToken[]>([]);

  protected readonly fields: readonly HellFilterField[] = [
    { key: 'name', label: 'Name', kind: 'text' },
    {
      key: 'status',
      label: 'Status',
      kind: 'options',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'Invited', label: 'Invited' },
      ],
    },
    {
      key: 'role',
      label: 'Role',
      kind: 'options',
      options: [
        { value: 'Owner', label: 'Owner' },
        { value: 'Admin', label: 'Admin' },
        { value: 'Member', label: 'Member' },
      ],
    },
    {
      key: 'team',
      label: 'Team',
      kind: 'options',
      multiple: true,
      options: [
        { value: 'Platform', label: 'Platform' },
        { value: 'Compiler', label: 'Compiler' },
        { value: 'Flight', label: 'Flight' },
        { value: 'Operations', label: 'Operations' },
      ],
    },
  ];

  protected readonly columns: ColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name', filterFn: includesAnyString, size: 200 },
    { accessorKey: 'role', header: 'Role', filterFn: equalsAnyString, size: 128 },
    { accessorKey: 'status', header: 'Status', filterFn: equalsAnyString, size: 128 },
    { accessorKey: 'team', header: 'Team', filterFn: equalsAnyString, size: 160 },
  ];

  private readonly globalFilter = computed(
    () => {
      const value = this.filters().find((token) => token.key === HELL_FILTER_TEXT_KEY)?.value;
      return typeof value === 'string' ? value : '';
    },
  );
  private readonly columnFilters = computed<ColumnFiltersState>(() => {
    const valuesByField = new Map<string, Set<string>>();

    for (const token of this.filters()) {
      if (token.key === HELL_FILTER_TEXT_KEY || typeof token.value !== 'string') continue;

      const values = valuesByField.get(token.key) ?? new Set<string>();
      values.add(token.value);
      valuesByField.set(token.key, values);
    }

    return Array.from(valuesByField, ([id, values]) => ({ id, value: [...values] }));
  });

  protected readonly table = createAngularTable<Person>(() => ({
    data: this.rows(),
    columns: this.columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
    globalFilterFn: 'includesString',
    state: {
      globalFilter: this.globalFilter(),
      columnFilters: this.columnFilters(),
    },
  }));
}
