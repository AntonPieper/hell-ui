import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  HELL_TABLE_UTILITIES_DIRECTIVES,
  HellColumnVisibilityPanel,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  selectionColumn,
  textColumn,
  type HellTableColumnVisibilityState,
  type HellTableSortDirection,
} from '@hell-ui/angular/table';

interface HarnessPerson {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

const HARNESS_ROWS: readonly HarnessPerson[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@example.com', role: 'Editor' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Viewer' },
];

const columns = hellColumns<HarnessPerson>();
const VISIBILITY_COLUMNS = columns.define([
  selectionColumn<HarnessPerson>('selection', {
    header: 'Select',
    selectAll: false,
    ariaLabel: (row) => `Select ${row.name}`,
  }),
  textColumn<HarnessPerson, string>('name', {
    header: 'Name',
    accessor: 'name',
    visibility: 'always',
  }),
  textColumn<HarnessPerson, string>('email', {
    header: 'Email',
    accessor: 'email',
    visibility: 'user-toggleable',
  }),
  textColumn<HarnessPerson, string>('role', {
    header: 'Role',
    accessor: 'role',
    visibility: 'initially-hidden',
  }),
  actionColumn<HarnessPerson>('actions', { header: 'Actions' }),
]);

@Component({
  selector: 'hd-table-a11y-harness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellColumnVisibilityPanel, ...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <section
      class="grid gap-6 p-6"
      aria-label="Table accessibility harness"
      data-testid="table-a11y-harness"
    >
      <h1>Table accessibility harness</h1>

      <section aria-labelledby="native-table-heading" data-testid="native-table-section">
        <h2 id="native-table-heading">Native table primitives</h2>
        <div hellTableContainer class="overflow-auto">
          <table hellTable data-testid="native-table">
            <thead hellTableHead>
              <tr hellTableRow>
                <th hellTableHeaderCell scope="col" columnId="name">Name</th>
                <th hellTableHeaderCell scope="col" columnId="role">Role</th>
                <th hellTableHeaderCell scope="col" columnId="actions">Actions</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (row of rows; track row.id) {
                <tr hellTableRow>
                  <td hellTableCell>{{ row.name }}</td>
                  <td hellTableCell>{{ row.role }}</td>
                  <td hellTableCell>
                    <button hellTableRowAction type="button">View {{ row.name }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="sortable-table-heading" data-testid="sortable-table-section">
        <h2 id="sortable-table-heading">Sortable table primitive</h2>
        <div hellTableContainer class="overflow-auto">
          <table hellTable data-testid="sortable-table">
            <thead hellTableHead>
              <tr hellTableRow>
                <th
                  hellTableHeaderCell
                  scope="col"
                  columnId="name"
                  sortable
                  [sort]="sortDirection()"
                  (sortToggle)="cycleSort()"
                >
                  <button hellTableSortTrigger type="button">Name</button>
                </th>
                <th hellTableHeaderCell scope="col" columnId="role">Role</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (row of rows; track row.id) {
                <tr hellTableRow>
                  <td hellTableCell>{{ row.name }}</td>
                  <td hellTableCell>{{ row.role }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="active-editor-heading" data-testid="active-editor-section">
        <h2 id="active-editor-heading">Active master/detail row editor</h2>
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]">
          <div hellTableContainer class="overflow-auto">
            <table hellTable data-testid="active-editor-table">
              <thead hellTableHead>
                <tr hellTableRow>
                  <th hellTableHeaderCell scope="col" columnId="name">Name</th>
                  <th hellTableHeaderCell scope="col" columnId="role">Role</th>
                  <th hellTableHeaderCell scope="col" columnId="actions">Actions</th>
                </tr>
              </thead>
              <tbody hellTableBody>
                @for (row of rows; track row.id) {
                  <tr hellTableRow [active]="activeRowId() === row.id">
                    <td hellTableCell>{{ row.name }}</td>
                    <td hellTableCell>{{ row.role }}</td>
                    <td hellTableCell>
                      <button
                        hellTableRowAction
                        type="button"
                        [attr.aria-label]="'Open editor for ' + row.name"
                        [attr.aria-controls]="activeEditorPaneId"
                        [attr.aria-expanded]="activeRowId() === row.id ? 'true' : 'false'"
                        (click)="openEditor(row.id)"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <aside
            [id]="activeEditorPaneId"
            class="rounded border border-hell-border p-3"
            role="region"
            aria-labelledby="active-editor-pane-heading"
            data-testid="active-editor-pane"
          >
            <h3 id="active-editor-pane-heading">Active row editor</h3>
            @if (activeRow(); as row) {
              <p>Editing {{ row.name }}.</p>
              <textarea
                id="table-a11y-active-editor-draft"
                name="table-a11y-active-editor-draft"
                [attr.aria-label]="'Draft for ' + row.name"
                [value]="row.email"
                rows="4"
              ></textarea>
            } @else {
              <p>Open a row to edit.</p>
            }
          </aside>
        </div>
      </section>

      <section aria-labelledby="selection-table-heading" data-testid="selection-table-section">
        <h2 id="selection-table-heading">Checkbox and radio row selection</h2>
        <div hellTableContainer class="overflow-auto">
          <table hellTable data-testid="selection-table">
            <thead hellTableHead>
              <tr hellTableRow>
                <th hellTableHeaderCell hellTableSelectionCell scope="col" columnId="bulk">
                  <input
                    hellTableRowCheckbox
                    type="checkbox"
                    aria-label="Select all harness rows"
                    [checked]="allCheckboxRowsSelected()"
                    [indeterminate]="someCheckboxRowsSelected()"
                    (checkedChange)="setAllCheckboxRowsSelected($event)"
                  />
                </th>
                <th hellTableHeaderCell hellTableSelectionCell scope="col" columnId="primary">
                  Primary row
                </th>
                <th hellTableHeaderCell scope="col" columnId="name">Name</th>
                <th hellTableHeaderCell scope="col" columnId="role">Role</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (row of rows; track row.id) {
                <tr hellTableRow [selected]="isVisuallySelected(row)">
                  <td hellTableCell hellTableSelectionCell>
                    <input
                      hellTableRowCheckbox
                      type="checkbox"
                      [attr.aria-label]="'Select ' + row.name + ' for bulk actions'"
                      [checked]="isCheckboxSelected(row)"
                      (checkedChange)="setCheckboxSelected(row.id, $event)"
                    />
                  </td>
                  <td hellTableCell hellTableSelectionCell>
                    <input
                      hellTableRowRadio
                      type="radio"
                      name="table-a11y-primary-row"
                      [attr.aria-label]="'Choose ' + row.name + ' as the primary row'"
                      [checked]="radioRowId() === row.id"
                      (checkedChange)="setRadioSelected(row.id, $event)"
                    />
                  </td>
                  <td hellTableCell>{{ row.name }}</td>
                  <td hellTableCell>{{ row.role }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="column-panel-heading" data-testid="column-panel-section">
        <h2 id="column-panel-heading">Column visibility panel</h2>
        <hell-column-visibility-panel
          [columns]="visibilityColumns"
          [(columnVisibility)]="columnVisibility"
          label="Harness columns"
          description="Toggle optional harness table columns. Required columns stay checked."
        />
      </section>

      <section aria-labelledby="grid-table-heading" data-testid="grid-table-section">
        <h2 id="grid-table-heading">Explicit grid mode</h2>
        <div hellTableContainer class="overflow-auto">
          <table
            hellTable
            data-testid="grid-table"
            semantics="grid"
            interactionMode="cell-navigation"
            [rowCount]="3"
            [colCount]="3"
          >
            <thead hellTableHead>
              <tr hellTableRow [rowIndex]="1">
                <th id="grid-name" hellTableHeaderCell [colIndex]="1">Name</th>
                <th id="grid-role" hellTableHeaderCell [colIndex]="2">Role</th>
                <th id="grid-action" hellTableHeaderCell [colIndex]="3">Action</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              <tr hellTableRow [rowIndex]="2" selected>
                <td id="grid-ada-name" hellTableCell [colIndex]="1">Ada Lovelace</td>
                <td id="grid-ada-role" hellTableCell [colIndex]="2">Admin</td>
                <td id="grid-ada-action" hellTableCell [colIndex]="3">
                  <button hellTableRowAction type="button">Edit Ada Lovelace</button>
                </td>
              </tr>
              <tr hellTableRow [rowIndex]="3">
                <td id="grid-grace-name" hellTableCell [colIndex]="1">Grace Hopper</td>
                <td id="grid-grace-role" hellTableCell [colIndex]="2">Editor</td>
                <td id="grid-grace-action" hellTableCell [colIndex]="3">
                  <button hellTableRowAction type="button">Edit Grace Hopper</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
})
export class TableA11yHarnessPage {
  protected readonly rows = HARNESS_ROWS;
  protected readonly visibilityColumns = VISIBILITY_COLUMNS;
  protected readonly activeEditorPaneId = 'table-a11y-active-editor-pane';

  protected readonly sortDirection = signal<HellTableSortDirection | null>(null);
  protected readonly activeRowId = signal<string | null>(null);
  protected readonly checkboxSelection = signal<Readonly<Record<string, boolean>>>({});
  protected readonly radioRowId = signal<string | null>(null);
  protected readonly columnVisibility = signal<HellTableColumnVisibilityState>(
    hellTableInitialColumnVisibility(VISIBILITY_COLUMNS),
  );

  protected readonly activeRow = computed(
    () => this.rows.find((row) => row.id === this.activeRowId()) ?? null,
  );

  protected readonly allCheckboxRowsSelected = computed(
    () =>
      this.rows.length > 0 && this.rows.every((row) => this.checkboxSelection()[row.id] === true),
  );

  protected readonly someCheckboxRowsSelected = computed(() => {
    const selected = this.rows.filter((row) => this.checkboxSelection()[row.id] === true).length;
    return selected > 0 && selected < this.rows.length;
  });

  protected cycleSort(): void {
    const current = this.sortDirection();
    this.sortDirection.set(current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc');
  }

  protected openEditor(rowId: string): void {
    this.activeRowId.set(rowId);
  }

  protected isCheckboxSelected(row: HarnessPerson): boolean {
    return this.checkboxSelection()[row.id] === true;
  }

  protected setCheckboxSelected(rowId: string, selected: boolean): void {
    this.checkboxSelection.update((current) => ({ ...current, [rowId]: selected }));
  }

  protected setAllCheckboxRowsSelected(selected: boolean): void {
    this.checkboxSelection.set(
      Object.fromEntries(this.rows.map((row) => [row.id, selected])) as Readonly<
        Record<string, boolean>
      >,
    );
  }

  protected setRadioSelected(rowId: string, selected: boolean): void {
    if (selected) this.radioRowId.set(rowId);
  }

  protected isVisuallySelected(row: HarnessPerson): boolean {
    return this.isCheckboxSelected(row) || this.radioRowId() === row.id;
  }
}
