import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_DATA_TABLE_DIRECTIVES,
  HellDataTable,
  HellRowDraftController,
  actionColumn,
  booleanColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  selectionColumn,
  textColumn,
  type HellTableColumnVisibilityState,
  type HellTableRowSelectionState,
  type HellTableSortingState,
} from './data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly role?: string;
  readonly email?: string;
}

const people = hellColumns<Person>();

@Component({
  imports: [HellDataTable],
  template: `<hell-data-table [rows]="rows" [columns]="columns" rowKey="id" />`,
})
class MinimalDataTableHost {
  readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true },
    { id: 'grace', name: 'Grace', active: false },
  ];
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    booleanColumn<Person, boolean>('active', { header: 'Active', accessor: 'active' }),
  ]);
}

@Component({
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      semantics="grid"
      interactionMode="cell-navigation"
    />
  `,
})
class GridDataTableHost {
  readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true },
    { id: 'grace', name: 'Grace', active: false },
  ];
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    booleanColumn<Person, boolean>('active', { header: 'Active', accessor: 'active' }),
  ]);
}

@Component({
  imports: [HellDataTable],
  template: `<hell-data-table [rows]="rows" [columns]="columns" rowKey="id" semantics="grid" />`,
})
class InvalidGridDataTableHost {
  readonly rows: readonly Person[] = [{ id: 'ada', name: 'Ada', active: true }];
  readonly columns = people.define([textColumn<Person, string>('name', { accessor: 'name' })]);
}

@Component({
  imports: [HellDataTable],
  template: `<hell-data-table [rows]="rows" [columns]="columns" rowKey="id" />`,
})
class SignalRowsDataTableHost {
  readonly rows = signal<readonly Person[]>([{ id: 'ada', name: 'Ada', active: true }]);
  readonly columns = people.define([textColumn<Person, string>('name', { accessor: 'name' })]);
}

@Component({
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      [loading]="loading()"
      [error]="error()"
      [empty]="'Nobody here.'"
      [unstyled]="unstyled()"
      density="compact"
    >
      <button hellDataTableToolbarStart type="button">Refresh</button>
      <span hellDataTableToolbar>People</span>
      <button hellDataTableToolbarEnd type="button">Export</button>
    </hell-data-table>
  `,
})
class StatusDataTableHost {
  readonly rows: readonly Person[] = [];
  readonly columns = people.define([textColumn<Person, string>('name', { accessor: 'name' })]);
  readonly loading = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly unstyled = signal(false);
}

@Component({
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      (sortingChange)="recordSorting($event)"
    />
  `,
})
class SortableDataTableHost {
  readonly rows: readonly Person[] = [
    { id: 'grace', name: 'Grace', active: false },
    { id: 'ada', name: 'Ada', active: true },
  ];
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name', sortable: true }),
    textColumn<Person, string>('role', { header: 'Role', accessor: 'role', sortable: false }),
  ]);
  sortingEvents: readonly (readonly HellTableSortingState[])[] = [];

  recordSorting(event: readonly HellTableSortingState[]): void {
    this.sortingEvents = [...this.sortingEvents, event];
  }
}

@Component({
  imports: [HellDataTable],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      [sorting]="sorting()"
      (sortingChange)="sorting.set($event)"
    />
  `,
})
class ControlledSortingDataTableHost {
  readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true },
    { id: 'grace', name: 'Grace', active: false },
  ];
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name', sortable: true }),
  ]);
  readonly sorting = signal<readonly HellTableSortingState[]>([
    { columnId: 'name', direction: 'desc' },
  ]);
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table [rows]="rows" [columns]="columns" rowKey="id">
      <ng-template [hellHeaderCell]="'name'" let-header="header">
        Custom {{ header.columnId }}
      </ng-template>
      <ng-template [hellCell]="'name'" let-row="row" let-value="value">
        <strong>{{ row.key }}:{{ value }}</strong>
      </ng-template>
      <ng-template [hellRowActions]="'actions'" let-row="row">
        <button type="button">Open {{ row.key }}</button>
      </ng-template>
    </hell-data-table>
  `,
})
class CustomTemplateDataTableHost {
  readonly rows: readonly Person[] = [{ id: 'ada', name: 'Ada', active: true }];
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table [rows]="rows" [columns]="columns" rowKey="id" [(activeRowKey)]="activeRowKey">
      <ng-template
        [hellRowActions]="'actions'"
        let-row="row"
        let-state="state"
        let-commands="commands"
      >
        <button
          hellTableRowAction
          type="button"
          [attr.aria-controls]="detailId"
          [attr.aria-expanded]="commands.isActive(row) ? 'true' : 'false'"
          (click)="commands.isActive(row) ? commands.closeRow(row) : commands.openRow(row)"
        >
          {{ commands.isActive(row) ? 'Close' : 'Open' }} {{ row.original.name }}
        </button>
        <span data-selection-count>{{ selectionCount(state.rowSelection.value()) }}</span>
        <span data-active-name>{{ commands.activeRow()?.original.name ?? 'none' }}</span>
      </ng-template>
    </hell-data-table>

    <aside [id]="detailId">
      @if (activeRow(); as row) {
        <h2>Edit {{ row.name }}</h2>
        <button data-close-detail type="button" (click)="activeRowKey.set(null)">
          Close detail
        </button>
      } @else {
        <p>No active row</p>
      }
    </aside>
  `,
})
class ActiveRowDataTableHost {
  readonly detailId = 'active-row-detail';
  readonly activeRowKey = signal<string | null>(null);
  readonly page = signal(0);
  readonly roleFilter = signal<Person['role'] | null>(null);
  private readonly pageSize = 1;
  private readonly allRows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true, role: 'Admin' },
    { id: 'grace', name: 'Grace', active: false, role: 'Editor' },
    { id: 'linus', name: 'Linus', active: true, role: 'Viewer' },
  ];
  readonly rows = computed(() => {
    const filter = this.roleFilter();
    const filtered = filter ? this.allRows.filter((row) => row.role === filter) : this.allRows;
    const start = this.page() * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });
  readonly activeRow = computed(
    () => this.rows().find((row) => row.id === this.activeRowKey()) ?? null,
  );
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);

  selectionCount(selection: Readonly<Record<string, boolean>>): number {
    return Object.values(selection).filter(Boolean).length;
  }
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table [rows]="rows" [columns]="columns" rowKey="id" [(rowSelection)]="rowSelection">
      <button hellDataTableBulkActions type="button">Bulk {{ selectedCount() }}</button>
    </hell-data-table>
  `,
})
class SelectableRowsDataTableHost {
  readonly group = signal<'core' | 'systems'>('core');
  readonly rowSelection = signal<HellTableRowSelectionState>({});
  readonly sourceRows = signal<readonly Person[]>([
    { id: 'ada', name: 'Ada', active: true, role: 'core' },
    { id: 'grace', name: 'Grace', active: true, role: 'core' },
    { id: 'linus', name: 'Linus', active: false, role: 'systems' },
    { id: 'dorothy', name: 'Dorothy', active: true, role: 'systems' },
  ]);
  readonly rows = computed(() => this.sourceRows().filter((row) => row.role === this.group()));
  readonly columns = people.define([
    selectionColumn<Person>('selection', {
      header: 'Select',
      selectAllAriaLabel: 'Select visible people',
      ariaLabel: (row) => `Select ${row.name}`,
      disabled: (row) => row.id === 'linus',
    }),
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
  ]);

  selectedCount(): number {
    return Object.values(this.rowSelection()).filter(Boolean).length;
  }

  reorderCoreRows(): void {
    this.sourceRows.update((rows) => [rows[1], rows[0], ...rows.slice(2)]);
  }
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      [(activeRowKey)]="activeRowKey"
      [(selectedRowKey)]="selectedRowKey"
    >
      <ng-template [hellRowActions]="'actions'" let-row="row" let-commands="commands">
        <button hellTableRowAction type="button" (click)="commands.openRow(row)">
          Open {{ row.original.name }}
        </button>
      </ng-template>
    </hell-data-table>
  `,
})
class SingleSelectableRowsDataTableHost {
  readonly activeRowKey = signal<string | null>(null);
  readonly selectedRowKey = signal<string | null>(null);
  readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true },
    { id: 'grace', name: 'Grace', active: true },
  ];
  readonly columns = people.define([
    selectionColumn<Person>('primary', {
      mode: 'radio',
      radioName: 'primary-person',
      ariaLabel: (row) => `Make ${row.name} primary`,
    }),
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-data-table
      [rows]="rows()"
      [columns]="columns"
      rowKey="id"
      [rowDraftController]="drafts"
      [(activeRowKey)]="activeRowKey"
    >
      <ng-template [hellRowActions]="'actions'" let-row="row" let-commands="commands">
        <button hellTableRowAction type="button" (click)="commands.openRow(row)">
          Edit {{ row.original.name }}
        </button>
      </ng-template>

      <ng-template
        [hellRowEditor]="'detail'"
        let-row="row"
        let-draft="draft"
        let-field="field"
        let-commands="commands"
        let-commit="commit"
        let-cancel="cancel"
        let-saveStatus="saveStatus"
      >
        @let name = field('name');
        <label>
          Name
          <input
            data-edit-name
            [value]="$any(name.value) ?? ''"
            [disabled]="name.disabled"
            (input)="name.patch($any($event.target).value)"
            (blur)="name.touch()"
          />
        </label>
        <span data-row-context>
          {{ row.key }}|{{ draft.name }}|{{ name.touched }}|{{ name.errors.join('|') }}|{{
            saveStatus
          }}
        </span>
        <span data-command-active>{{ commands.isActive(row) }}</span>
        <button data-commit type="button" [disabled]="name.disabled" (click)="commit()">
          Save
        </button>
        <button data-cancel type="button" (click)="cancel()">Cancel</button>
      </ng-template>
    </hell-data-table>
  `,
})
class DraftEditorDataTableHost {
  readonly activeRowKey = signal<string | null>(null);
  readonly rows = signal<readonly Person[]>([
    { id: 'ada', name: 'Ada', active: true },
    { id: 'grace', name: 'Grace', active: true },
  ]);
  readonly saved: Partial<Person>[] = [];
  readonly drafts = new HellRowDraftController<Person>({
    validate: (draft) => (draft.name?.trim() ? null : { name: ['Name required'] }),
    save: async (draft) => {
      this.saved.push({ ...draft });
    },
  });
  readonly columns = people.define([
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
}

@Component({
  imports: [...HELL_DATA_TABLE_DIRECTIVES],
  template: `
    <hell-column-visibility-panel
      [columns]="columns"
      [(columnVisibility)]="columnVisibility"
      label="Columns"
      description="Choose visible columns."
    />

    <hell-data-table
      [rows]="rows"
      [columns]="columns"
      rowKey="id"
      [(columnVisibility)]="columnVisibility"
    />
  `,
})
class ColumnVisibilityDataTableHost {
  readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada', active: true, role: 'Admin', email: 'ada@example.com' },
    { id: 'grace', name: 'Grace', active: true, role: 'Editor', email: 'grace@example.com' },
  ];
  readonly columns = people.define([
    selectionColumn<Person>('selection', { header: 'Select', selectAll: false }),
    textColumn<Person, string>('name', { header: 'Name', accessor: 'name' }),
    textColumn<Person, string>('email', { header: 'Email', accessor: 'email' }),
    textColumn<Person, string>('role', {
      header: 'Role',
      accessor: 'role',
      visibility: 'initially-hidden',
    }),
    actionColumn<Person>('actions', { header: 'Actions' }),
  ]);
  readonly columnVisibility = signal<HellTableColumnVisibilityState>(
    hellTableInitialColumnVisibility(this.columns),
  );
}

describe('HellDataTable simple renderer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MinimalDataTableHost,
        GridDataTableHost,
        InvalidGridDataTableHost,
        SignalRowsDataTableHost,
        StatusDataTableHost,
        SortableDataTableHost,
        ControlledSortingDataTableHost,
        CustomTemplateDataTableHost,
        ActiveRowDataTableHost,
        SelectableRowsDataTableHost,
        SingleSelectableRowsDataTableHost,
        DraftEditorDataTableHost,
        ColumnVisibilityDataTableHost,
      ],
    }).compileComponents();
  });

  it('renders HellColumnDef rows with native table semantics by default', () => {
    const fixture = TestBed.createComponent(MinimalDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('table')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('table')?.hasAttribute('tabindex')).toBe(false);
    expect(root.querySelector('table')?.hasAttribute('aria-activedescendant')).toBe(false);
    expect(root.querySelector('thead')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('tbody')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('tr')?.getAttribute('role')).toBeNull();
    expect([...root.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Name',
      'Active',
    ]);
    expect(
      [...root.querySelectorAll('tbody tr')].map((row) =>
        row.textContent?.replace(/\s+/g, ' ').trim(),
      ),
    ).toEqual(['Ada true', 'Grace false']);
    expect(root.querySelector('tbody tr')?.getAttribute('data-row-key')).toBe('ada');
  });

  it('renders explicit grid semantics with one table tab stop and indexed cells', () => {
    const fixture = TestBed.createComponent(GridDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const table = root.querySelector('table');
    if (!(table instanceof HTMLTableElement)) throw new Error('Expected table.');
    const headerCells = [...root.querySelectorAll('thead th')];
    const dataCells = [...root.querySelectorAll('tbody td')];

    expect(table.getAttribute('role')).toBe('grid');
    expect(table.getAttribute('tabindex')).toBe('0');
    expect(table.getAttribute('aria-rowcount')).toBe('3');
    expect(table.getAttribute('aria-colcount')).toBe('2');
    expect(root.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect([...root.querySelectorAll('button[tabindex="-1"]')].map((button) => button.textContent?.trim())).toEqual([
      'Name',
      'Active',
    ]);
    expect(root.querySelector('thead tr')?.getAttribute('aria-rowindex')).toBe('1');
    expect(root.querySelector('tbody tr')?.getAttribute('aria-rowindex')).toBe('2');
    expect(headerCells[0]?.getAttribute('role')).toBe('columnheader');
    expect(headerCells[1]?.getAttribute('aria-colindex')).toBe('2');
    expect(dataCells[0]?.getAttribute('role')).toBe('gridcell');
    expect(dataCells[1]?.getAttribute('aria-colindex')).toBe('2');
    expect(headerCells[0]?.id).toBeTruthy();
    expect(headerCells[1]?.id).toBeTruthy();
    expect(table.getAttribute('aria-activedescendant')).toBe(headerCells[0]?.id);

    const right = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    table.dispatchEvent(right);
    fixture.detectChanges();

    expect(right.defaultPrevented).toBe(true);
    expect(table.getAttribute('aria-activedescendant')).toBe(headerCells[1]?.id);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    table.dispatchEvent(enter);
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(headerCells[1]?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('requires an interaction mode before enabling data-table grid semantics', () => {
    const fixture = TestBed.createComponent(InvalidGridDataTableHost);
    expect(() => fixture.detectChanges()).toThrow(/semantics="grid" requires interactionMode/);
  });

  it('updates when rows are supplied as a signal', () => {
    const fixture = TestBed.createComponent(SignalRowsDataTableHost);
    fixture.detectChanges();

    expect(tableBodyText(fixture.nativeElement)).toContain('Ada');

    fixture.componentInstance.rows.set([{ id: 'grace', name: 'Grace', active: false }]);
    fixture.detectChanges();

    expect(tableBodyText(fixture.nativeElement)).not.toContain('Ada');
    expect(tableBodyText(fixture.nativeElement)).toContain('Grace');
  });

  it('renders toolbar slots, loading, error, empty, density, and unstyled states', () => {
    const fixture = TestBed.createComponent(StatusDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = root.querySelector('hell-data-table');

    expect(host?.getAttribute('data-density')).toBe('compact');
    expect(root.querySelector('[hellDataTableToolbarStart]')?.textContent?.trim()).toBe('Refresh');
    expect(root.querySelector('[hellDataTableToolbar]')?.textContent?.trim()).toBe('People');
    expect(root.querySelector('[hellDataTableToolbarEnd]')?.textContent?.trim()).toBe('Export');
    expect(root.querySelector('tbody tr')?.getAttribute('data-status')).toBe('empty');
    expect(tableBodyText(root)).toContain('Nobody here.');

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(root.querySelector('tbody tr')?.getAttribute('data-status')).toBe('loading');
    expect(tableBodyText(root)).toContain('Loading');

    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.error.set(new Error('Rows failed'));
    fixture.detectChanges();
    expect(root.querySelector('tbody tr')?.getAttribute('data-status')).toBe('error');
    expect(tableBodyText(root)).toContain('Rows failed');

    fixture.componentInstance.error.set(null);
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    expect(host?.classList.contains('hell-data-table')).toBe(false);
    expect(root.querySelector('table')?.classList.contains('hell-table')).toBe(false);
    expect(root.querySelector('table')?.hasAttribute('data-hell-table-root')).toBe(true);
  });

  it('sorts through native header buttons and emits sorting changes', () => {
    const fixture = TestBed.createComponent(SortableDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const nameSortButton = root.querySelector('th button');
    if (!(nameSortButton instanceof HTMLButtonElement)) throw new Error('Expected sort button.');

    expect(tableBodyText(root)).toMatch(/Grace\s+Ada/);

    nameSortButton.click();
    fixture.detectChanges();
    expect(tableBodyText(root)).toMatch(/Ada\s+Grace/);
    expect(root.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');
    expect(fixture.componentInstance.sortingEvents.at(-1)).toEqual([
      { columnId: 'name', direction: 'asc' },
    ]);

    nameSortButton.click();
    fixture.detectChanges();
    expect(tableBodyText(root)).toMatch(/Grace\s+Ada/);
    expect(root.querySelector('th')?.getAttribute('aria-sort')).toBe('descending');

    nameSortButton.click();
    fixture.detectChanges();
    expect(root.querySelector('th')?.getAttribute('aria-sort')).toBeNull();
    expect(fixture.componentInstance.sortingEvents.at(-1)).toEqual([]);
  });

  it('honors controlled sorting updates including an external clear', () => {
    const fixture = TestBed.createComponent(ControlledSortingDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(tableBodyText(root)).toMatch(/Grace\s+Ada/);

    fixture.componentInstance.sorting.set([]);
    fixture.detectChanges();

    expect(tableBodyText(root)).toMatch(/Ada\s+Grace/);
    expect(root.querySelector('th')?.getAttribute('aria-sort')).toBeNull();
  });

  it('renders projected custom header, cell, and action templates', () => {
    const fixture = TestBed.createComponent(CustomTemplateDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('th')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Custom name');
    expect(root.querySelector('strong')?.textContent?.trim()).toBe('ada:Ada');
    expect(root.querySelector('tbody button')?.textContent?.trim()).toBe('Open ada');
  });

  it('opens active row detail through row-action commands and clears when the pane closes', () => {
    const fixture = TestBed.createComponent(ActiveRowDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    let action = activeRowAction(root);
    expect(action.getAttribute('aria-controls')).toBe('active-row-detail');
    expect(action.getAttribute('aria-expanded')).toBe('false');

    action.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeRowKey()).toBe('ada');
    expect(root.querySelector('tbody tr')?.getAttribute('data-active')).toBe('true');
    expect(root.querySelector('#active-row-detail')?.textContent).toContain('Edit Ada');
    expect(root.querySelector('[data-selection-count]')?.textContent?.trim()).toBe('0');
    expect(root.querySelector('[data-active-name]')?.textContent?.trim()).toBe('Ada');
    action = activeRowAction(root);
    expect(action.getAttribute('aria-expanded')).toBe('true');

    const closeDetail = root.querySelector('[data-close-detail]');
    if (!(closeDetail instanceof HTMLButtonElement))
      throw new Error('Expected detail close button.');
    closeDetail.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activeRowKey()).toBeNull();
    expect(root.querySelector('tbody tr')?.getAttribute('data-active')).toBeNull();
    expect(root.querySelector('#active-row-detail')?.textContent).toContain('No active row');
    expect(activeRowAction(root).getAttribute('aria-expanded')).toBe('false');
  });

  it('clears active row when filtering or pagination removes it from the visible rows', () => {
    const fixture = TestBed.createComponent(ActiveRowDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    activeRowAction(root).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeRowKey()).toBe('ada');

    fixture.componentInstance.page.set(1);
    fixture.detectChanges();
    expect(tableBodyText(root)).toContain('Grace');
    expect(fixture.componentInstance.activeRowKey()).toBeNull();

    fixture.componentInstance.page.set(0);
    fixture.detectChanges();
    activeRowAction(root).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeRowKey()).toBe('ada');

    fixture.componentInstance.roleFilter.set('Viewer');
    fixture.detectChanges();
    expect(tableBodyText(root)).toContain('Linus');
    expect(fixture.componentInstance.activeRowKey()).toBeNull();
  });

  it('passes draft, field, commands, commit, and cancel contexts to row editor templates', async () => {
    const fixture = TestBed.createComponent(DraftEditorDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;

    activeRowAction(root).click();
    fixture.detectChanges();

    expect(host.activeRowKey()).toBe('ada');
    expect(rowEditorByKey(root, 'ada').getAttribute('data-row-part-key')).toBe('editor:ada');
    expect(root.querySelector('[data-command-active]')?.textContent?.trim()).toBe('true');

    const input = editNameInput(root);
    expect(input.value).toBe('Ada');

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(root.querySelector('[data-row-context]')?.textContent?.replace(/\s+/g, '')).toBe(
      'ada||true||idle',
    );

    commitDraftButton(root).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.saved).toEqual([]);
    expect(root.querySelector('[data-row-context]')?.textContent?.replace(/\s+/g, '')).toBe(
      'ada||true|Namerequired|error',
    );

    input.value = 'Ada Lovelace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    commitDraftButton(root).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.saved).toEqual([{ id: 'ada', name: 'Ada Lovelace', active: true }]);
    expect(root.querySelector('[data-row-context]')?.textContent?.replace(/\s+/g, '')).toBe(
      'ada|AdaLovelace|false||saved',
    );
  });

  it('rolls back and cleans row draft context when row editor rows cancel or disappear', () => {
    const fixture = TestBed.createComponent(DraftEditorDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;

    activeRowAction(root).click();
    fixture.detectChanges();
    editNameInput(root).value = 'Transient Ada';
    editNameInput(root).dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.drafts.has('ada')).toBe(true);
    expect(root.querySelector('[data-row-context]')?.textContent).toContain('Transient Ada');

    cancelDraftButton(root).click();
    fixture.detectChanges();

    expect(host.activeRowKey()).toBeNull();
    expect(root.querySelector('[data-row-editor]')).toBeNull();

    activeRowAction(root).click();
    fixture.detectChanges();
    expect(editNameInput(root).value).toBe('Ada');

    host.rows.set([{ id: 'grace', name: 'Grace', active: true }]);
    fixture.detectChanges();

    expect(host.activeRowKey()).toBeNull();
    expect(host.drafts.has('ada')).toBe(false);
  });

  it('keeps checkbox rowSelection keyed by row id across reorders and filtered pages', () => {
    const fixture = TestBed.createComponent(SelectableRowsDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;

    expect(root.querySelector('[data-hell-data-table-bulk-actions]')).toBeNull();
    expect(rowKeys(root)).toEqual(['ada', 'grace']);

    const rowSpace = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    rowByKey(root, 'ada').dispatchEvent(rowSpace);
    expect(rowSpace.defaultPrevented).toBe(false);
    expect(host.rowSelection()).toEqual({});

    const adaCheckbox = checkboxByLabel(root, 'Select Ada');
    adaCheckbox.focus();
    const controlSpace = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    adaCheckbox.dispatchEvent(controlSpace);
    expect(controlSpace.defaultPrevented).toBe(false);

    adaCheckbox.click();
    fixture.detectChanges();

    expect(host.rowSelection()).toEqual({ ada: true });
    expect(checkboxByLabel(root, 'Select Ada').checked).toBe(true);
    expect(rowByKey(root, 'ada').getAttribute('data-selected')).toBe('true');
    expect(rowByKey(root, 'ada').hasAttribute('aria-selected')).toBe(false);
    expect(checkboxByLabel(root, 'Select visible people').indeterminate).toBe(true);
    expect(root.querySelector('[data-hell-data-table-bulk-actions]')?.textContent).toContain(
      'Bulk 1',
    );

    host.reorderCoreRows();
    fixture.detectChanges();

    expect(rowKeys(root)).toEqual(['grace', 'ada']);
    expect(checkboxByLabel(root, 'Select Ada').checked).toBe(true);

    checkboxByLabel(root, 'Select visible people').click();
    fixture.detectChanges();
    expect(host.rowSelection()).toEqual({ ada: true, grace: true });

    host.group.set('systems');
    fixture.detectChanges();

    expect(rowKeys(root)).toEqual(['linus', 'dorothy']);
    expect(checkboxByLabel(root, 'Select Linus').disabled).toBe(true);
    expect(checkboxByLabel(root, 'Select Dorothy').checked).toBe(false);
    expect(checkboxByLabel(root, 'Select visible people').checked).toBe(false);

    checkboxByLabel(root, 'Select visible people').click();
    fixture.detectChanges();

    expect(host.rowSelection()).toEqual({ ada: true, grace: true, dorothy: true });
    expect(checkboxByLabel(root, 'Select Linus').checked).toBe(false);
    expect(checkboxByLabel(root, 'Select Dorothy').checked).toBe(true);

    checkboxByLabel(root, 'Select visible people').click();
    fixture.detectChanges();

    expect(host.rowSelection()).toEqual({ ada: true, grace: true, dorothy: false });
  });

  it('uses selectedRowKey for radio selection without reusing activeRowKey', () => {
    const fixture = TestBed.createComponent(SingleSelectableRowsDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;

    expect(root.querySelector('thead input[type="checkbox"]')).toBeNull();

    const graceRadio = radioByLabel(root, 'Make Grace primary');
    expect(graceRadio.name).toBe('primary-person');
    graceRadio.click();
    fixture.detectChanges();

    expect(host.selectedRowKey()).toBe('grace');
    expect(host.activeRowKey()).toBeNull();
    expect(rowByKey(root, 'grace').getAttribute('data-selected')).toBe('true');
    expect(rowByKey(root, 'grace').hasAttribute('aria-selected')).toBe(false);

    activeRowAction(root).click();
    fixture.detectChanges();

    expect(host.activeRowKey()).toBe('ada');
    expect(host.selectedRowKey()).toBe('grace');
    expect(rowByKey(root, 'ada').getAttribute('data-active')).toBe('true');
    expect(rowByKey(root, 'ada').getAttribute('data-selected')).toBeNull();
    expect(rowByKey(root, 'ada').hasAttribute('aria-selected')).toBe(false);
    expect(radioByLabel(root, 'Make Grace primary').checked).toBe(true);
  });

  it('uses app-owned columnVisibility with an accessible resettable picker panel', () => {
    const fixture = TestBed.createComponent(ColumnVisibilityDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const host = fixture.componentInstance;

    expect(host.columnVisibility()).toEqual({ role: false });
    expect(tableHeaderText(root)).toEqual(['Select', 'Name', 'Email', 'Actions']);
    expect(checkboxByLabel(root, 'Select').disabled).toBe(true);
    expect(checkboxByLabel(root, 'Actions').disabled).toBe(true);
    expect(checkboxByLabel(root, 'Role').checked).toBe(false);
    expect(checkboxByLabel(root, 'Email').checked).toBe(true);

    checkboxByLabel(root, 'Email').click();
    fixture.detectChanges();

    expect(host.columnVisibility()).toEqual({ role: false, email: false });
    expect(tableHeaderText(root)).toEqual(['Select', 'Name', 'Actions']);

    checkboxByLabel(root, 'Role').click();
    fixture.detectChanges();

    expect(host.columnVisibility()).toEqual({ role: true, email: false });
    expect(tableHeaderText(root)).toEqual(['Select', 'Name', 'Role', 'Actions']);

    resetColumnVisibilityButton(root).click();
    fixture.detectChanges();

    expect(host.columnVisibility()).toEqual({ role: false });
    expect(tableHeaderText(root)).toEqual(['Select', 'Name', 'Email', 'Actions']);
    expect(resetColumnVisibilityButton(root).disabled).toBe(true);

    host.columnVisibility.set({});
    fixture.detectChanges();

    expect(checkboxByLabel(root, 'Role').checked).toBe(true);
    expect(tableHeaderText(root)).toEqual(['Select', 'Name', 'Email', 'Role', 'Actions']);
  });
});

function tableBodyText(root: Element): string {
  return [...root.querySelectorAll('tbody tr')]
    .map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .join(' ');
}

function rowKeys(root: Element): string[] {
  return [...root.querySelectorAll('tbody tr[data-row-key]')].map(
    (row) => row.getAttribute('data-row-key') ?? '',
  );
}

function tableHeaderText(root: Element): string[] {
  return [...root.querySelectorAll('hell-data-table thead th')].map(
    (cell) =>
      cell.textContent
        ?.replace(/Required|Initially hidden/g, '')
        .replace(/\s+/g, ' ')
        .trim() ?? '',
  );
}

function rowByKey(root: Element, key: string): HTMLTableRowElement {
  const row = root.querySelector(`tbody tr[data-row-key="${key}"]`);
  if (!(row instanceof HTMLTableRowElement)) throw new Error(`Expected row ${key}.`);
  return row;
}

function checkboxByLabel(root: Element, label: string): HTMLInputElement {
  const checkbox = root.querySelector(`input[type="checkbox"][aria-label="${label}"]`);
  if (!(checkbox instanceof HTMLInputElement)) throw new Error(`Expected checkbox ${label}.`);
  return checkbox;
}

function radioByLabel(root: Element, label: string): HTMLInputElement {
  const radio = root.querySelector(`input[type="radio"][aria-label="${label}"]`);
  if (!(radio instanceof HTMLInputElement)) throw new Error(`Expected radio ${label}.`);
  return radio;
}

function resetColumnVisibilityButton(root: Element): HTMLButtonElement {
  const button = root.querySelector('hell-column-visibility-panel button');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected reset button.');
  return button;
}

function rowEditorByKey(root: Element, key: string): HTMLTableRowElement {
  const row = root.querySelector(`tbody tr[data-row-editor][data-row-key="${key}"]`);
  if (!(row instanceof HTMLTableRowElement)) throw new Error(`Expected row editor ${key}.`);
  return row;
}

function editNameInput(root: Element): HTMLInputElement {
  const input = root.querySelector('[data-edit-name]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected draft name input.');
  return input;
}

function commitDraftButton(root: Element): HTMLButtonElement {
  const button = root.querySelector('[data-commit]');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected commit button.');
  return button;
}

function cancelDraftButton(root: Element): HTMLButtonElement {
  const button = root.querySelector('[data-cancel]');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected cancel button.');
  return button;
}

function activeRowAction(root: Element): HTMLButtonElement {
  const button = root.querySelector('button[hellTableRowAction]');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected row action button.');
  return button;
}
