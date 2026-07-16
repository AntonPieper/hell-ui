import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import {
  HELL_FILTER_BUILDER_IMPORTS,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterFieldDescriptor,
} from '@hell-ui/angular/features/filter-builder';
import { HellInput } from '@hell-ui/angular/input';
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

interface IdentifiedFilter<
  TField extends string,
  TOperator extends string,
  TValue,
> extends HellFilter<TField, TOperator, TValue> {
  readonly id: string;
}

type SearchFilter = IdentifiedFilter<'query', 'contains', string>;
type NameFilter = IdentifiedFilter<'name', 'contains', string>;
type StatusFilter = IdentifiedFilter<'status', 'is', 'Active' | 'Invited'>;
type RoleFilter = IdentifiedFilter<'role', 'is', 'Owner' | 'Admin' | 'Member'>;
type TeamFilter = IdentifiedFilter<
  'team',
  'is',
  'Platform' | 'Compiler' | 'Flight' | 'Operations'
>;
type PersonFilter = SearchFilter | NameFilter | StatusFilter | RoleFilter | TeamFilter;

interface FilterOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Owner', status: 'Active', team: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', role: 'Admin', status: 'Active', team: 'Compiler' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Member', status: 'Invited', team: 'Flight' },
  { id: 'dorothy', name: 'Dorothy Vaughan', role: 'Member', status: 'Active', team: 'Operations' },
];

const STATUS_OPTIONS: readonly FilterOption<StatusFilter['value']>[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Invited', label: 'Invited' },
];

const ROLE_OPTIONS: readonly FilterOption<RoleFilter['value']>[] = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Member', label: 'Member' },
];

const TEAM_OPTIONS: readonly FilterOption<TeamFilter['value']>[] = [
  { value: 'Platform', label: 'Platform' },
  { value: 'Compiler', label: 'Compiler' },
  { value: 'Flight', label: 'Flight' },
  { value: 'Operations', label: 'Operations' },
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
  selector: 'app-filter-builder-tanstack-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    HellButton,
    HellInput,
    HellTanStackTable,
    HellTableShellToolbar,
  ],
  template: `
    <hell-tanstack-table [table]="table" stickyHeader>
      <hell-filter-builder
        hellTableShellToolbar
        aria-label="People table filters"
        [fields]="fields"
        [value]="filters()"
        [identify]="identifyFilter"
        (valueChange)="filters.set($event)"
      >
        <ng-template [hellFilterBuilderEditor]="searchField" let-editor>
          <div class="flex min-w-64 flex-wrap items-end gap-hell-2">
            <label class="grid min-w-48 flex-1 gap-hell-1 text-xs font-medium">
              Global search
              <input
                #searchValue
                hellInput
                aria-label="Global search"
                placeholder="Search every column…"
                [value]="editor.filter?.value ?? ''"
                (keydown.enter)="editor.commit(searchCandidate(editor, searchValue.value))"
              />
            </label>
            <button
              hellButton
              type="button"
              size="sm"
              variant="soft"
              (click)="editor.commit(searchCandidate(editor, searchValue.value))"
            >
              Apply search
            </button>
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="nameField" let-editor>
          <div class="flex min-w-64 flex-wrap items-end gap-hell-2">
            <label class="grid min-w-48 flex-1 gap-hell-1 text-xs font-medium">
              Name text
              <input
                #nameValue
                hellInput
                aria-label="Name text"
                placeholder="e.g. Ada"
                [value]="editor.filter?.value ?? ''"
                (keydown.enter)="editor.commit(nameCandidate(editor, nameValue.value))"
              />
            </label>
            <button
              hellButton
              type="button"
              size="sm"
              variant="soft"
              (click)="editor.commit(nameCandidate(editor, nameValue.value))"
            >
              Apply name
            </button>
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="statusField" let-editor>
          <div class="flex flex-wrap gap-hell-2" aria-label="Status choices">
            @for (option of statusOptions; track option.value) {
              <button
                hellButton
                type="button"
                size="sm"
                variant="soft"
                (click)="selectStatus(editor, option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="roleField" let-editor>
          <div class="flex flex-wrap gap-hell-2" aria-label="Role choices">
            @for (option of roleOptions; track option.value) {
              <button
                hellButton
                type="button"
                size="sm"
                variant="soft"
                (click)="selectRole(editor, option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="teamField" let-editor>
          <div class="flex flex-wrap gap-hell-2" aria-label="Team choices">
            @for (option of teamOptions; track option.value) {
              <button
                hellButton
                type="button"
                size="sm"
                variant="soft"
                (click)="selectTeam(editor, option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </ng-template>
      </hell-filter-builder>
    </hell-tanstack-table>
    <p class="mt-hell-3 text-xs text-hell-foreground-muted" aria-live="polite">
      {{ table.getFilteredRowModel().rows.length }} people shown
    </p>
  `,
})
export class FilterBuilderTanStackExample {
  protected readonly rows = signal<Person[]>([...PEOPLE]);
  protected readonly filters = signal<readonly PersonFilter[]>([]);
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly teamOptions = TEAM_OPTIONS;

  protected readonly searchField: HellFilterFieldDescriptor<SearchFilter> = {
    field: 'query',
    label: 'Search',
    display: (filter) => `Search contains “${filter.value}”`,
    validate: (filter) => filter.value.trim().length > 0,
  };
  protected readonly nameField: HellFilterFieldDescriptor<NameFilter> = {
    field: 'name',
    label: 'Name',
    display: (filter) => `Name contains “${filter.value}”`,
    validate: (filter) => filter.value.trim().length > 0,
  };
  protected readonly statusField: HellFilterFieldDescriptor<StatusFilter> = {
    field: 'status',
    label: 'Status',
    display: (filter) => `Status is ${filter.value}`,
    validate: (filter) => STATUS_OPTIONS.some((option) => option.value === filter.value),
  };
  protected readonly roleField: HellFilterFieldDescriptor<RoleFilter> = {
    field: 'role',
    label: 'Role',
    display: (filter) => `Role is ${filter.value}`,
    validate: (filter) => ROLE_OPTIONS.some((option) => option.value === filter.value),
  };
  protected readonly teamField: HellFilterFieldDescriptor<TeamFilter> = {
    field: 'team',
    label: 'Team',
    multiple: true,
    display: (filter) => `Team is ${filter.value}`,
    validate: (filter) => TEAM_OPTIONS.some((option) => option.value === filter.value),
  };
  protected readonly fields = [
    this.searchField,
    this.nameField,
    this.statusField,
    this.roleField,
    this.teamField,
  ] as const;
  protected readonly identifyFilter = (filter: PersonFilter) => filter.id;

  protected readonly columns: ColumnDef<Person>[] = [
    { accessorKey: 'name', header: 'Name', filterFn: includesAnyString, size: 200 },
    { accessorKey: 'role', header: 'Role', filterFn: equalsAnyString, size: 128 },
    { accessorKey: 'status', header: 'Status', filterFn: equalsAnyString, size: 128 },
    { accessorKey: 'team', header: 'Team', filterFn: equalsAnyString, size: 160 },
  ];

  private readonly globalFilter = computed(
    () => this.filters().find((filter) => filter.field === 'query')?.value ?? '',
  );
  private readonly columnFilters = computed<ColumnFiltersState>(() => {
    const valuesByField = new Map<string, Set<string>>();

    for (const filter of this.filters()) {
      if (filter.field === 'query') continue;
      const values = valuesByField.get(filter.field) ?? new Set<string>();
      values.add(filter.value);
      valuesByField.set(filter.field, values);
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

  private nextIdentity = 0;

  protected searchCandidate(
    editor: HellFilterBuilderEditorContext<SearchFilter>,
    value: string,
  ): SearchFilter {
    return {
      id: editor.filter?.id ?? this.createIdentity('query'),
      field: 'query',
      operator: 'contains',
      value: value.trim(),
    };
  }

  protected nameCandidate(
    editor: HellFilterBuilderEditorContext<NameFilter>,
    value: string,
  ): NameFilter {
    return {
      id: editor.filter?.id ?? this.createIdentity('name'),
      field: 'name',
      operator: 'contains',
      value: value.trim(),
    };
  }

  protected selectStatus(
    editor: HellFilterBuilderEditorContext<StatusFilter>,
    value: StatusFilter['value'],
  ): void {
    editor.commit({
      id: editor.filter?.id ?? this.createIdentity('status'),
      field: 'status',
      operator: 'is',
      value,
    });
  }

  protected selectRole(
    editor: HellFilterBuilderEditorContext<RoleFilter>,
    value: RoleFilter['value'],
  ): void {
    editor.commit({
      id: editor.filter?.id ?? this.createIdentity('role'),
      field: 'role',
      operator: 'is',
      value,
    });
  }

  protected selectTeam(
    editor: HellFilterBuilderEditorContext<TeamFilter>,
    value: TeamFilter['value'],
  ): void {
    editor.commit({
      id: editor.filter?.id ?? this.createIdentity('team'),
      field: 'team',
      operator: 'is',
      value,
    });
  }

  private createIdentity(field: string): string {
    this.nextIdentity += 1;
    return `${field}-${this.nextIdentity}`;
  }
}
