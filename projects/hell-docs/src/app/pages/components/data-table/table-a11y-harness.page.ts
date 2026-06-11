import { CdkTableModule } from '@angular/cdk/table';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import {
  HellColumnVisibilityPanel,
  HellTable,
  HellTableBody,
  HellTableCell,
  HellTableContainer,
  HellTableHead,
  HellTableHeaderCell,
  HellTableResizeHandle,
  HellTableRow,
  HellTableRowAction,
  HellTableRowCheckbox,
  HellTableRowRadio,
  HellTableSelectionCell,
  HellTableSortTrigger,
  actionColumn,
  hellColumns,
  hellTableInitialColumnVisibility,
  selectionColumn,
  textColumn,
  type HellTableColumnVisibilityState,
  type HellTableResizeAdapter,
  type HellTableResizeEvent,
  type HellTableResizeItem,
  type HellTableSortDirection,
} from '@hell-ui/angular/table';
import {
  HellCdkCell,
  HellCdkHeaderCell,
  HellCdkHeaderRow,
  HellCdkRow,
  HellCdkTable,
} from '@hell-ui/angular/table-cdk';

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
  imports: [
    CdkTableModule,
    HellButton,
    HellColumnVisibilityPanel,
    HellTableContainer,
    HellTable,
    HellTableHead,
    HellTableBody,
    HellTableRow,
    HellTableHeaderCell,
    HellTableSortTrigger,
    HellTableResizeHandle,
    HellTableCell,
    HellTableRowAction,
    HellTableSelectionCell,
    HellTableRowCheckbox,
    HellTableRowRadio,
    HellCdkTable,
    HellCdkHeaderRow,
    HellCdkRow,
    HellCdkHeaderCell,
    HellCdkCell,
  ],
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
                    <button hellButton hellTableRowAction type="button" size="xs" variant="ghost">
                      View {{ row.name }}
                    </button>
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

      <section aria-labelledby="semantic-resize-heading" data-testid="table-resize-semantic-section">
        <h2 id="semantic-resize-heading">Semantic table resize contract</h2>
        <div class="text-xs text-hell-foreground-muted" aria-hidden="true">
          sort <output data-testid="semantic-resize-sort-count">{{ semanticResizeSortCount() }}</output>
          action <output data-testid="semantic-resize-action-count">{{ semanticResizeActionCount() }}</output>
          resize <output data-testid="semantic-resize-commit-count">{{ semanticResizeCommitCount() }}</output>
        </div>
        <div hellTableContainer class="overflow-auto max-w-[680px]">
          <table hellTable data-testid="semantic-resize-table" class="w-[640px]">
            <thead hellTableHead>
              <tr hellTableRow>
                <th
                  id="semantic-resize-name"
                  hellTableHeaderCell
                  scope="col"
                  columnId="name"
                  sortable
                  [sort]="null"
                  style="--hell-table-col-width: 220px;"
                  data-testid="semantic-resize-name-header"
                  (sortToggle)="recordSemanticResizeSort()"
                >
                  <button hellTableSortTrigger type="button">Name</button>
                  <button
                    hellTableResizeHandle
                    type="button"
                    [minWidth]="120"
                    aria-controls="semantic-resize-name semantic-resize-role"
                    data-testid="semantic-resize-handle"
                    (resizeCommit)="recordSemanticResizeCommit($event)"
                  ></button>
                </th>
                <th
                  id="semantic-resize-role"
                  hellTableHeaderCell
                  scope="col"
                  columnId="role"
                  style="--hell-table-col-width: 180px;"
                  data-testid="semantic-resize-role-header"
                >
                  Role
                </th>
                <th hellTableHeaderCell scope="col" columnId="actions">Actions</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (row of rows; track row.id) {
                <tr hellTableRow>
                  <td hellTableCell>{{ row.name }}</td>
                  <td hellTableCell>{{ row.role }}</td>
                  <td hellTableCell>
                    <button
                      hellButton
                      hellTableRowAction
                      type="button"
                      size="xs"
                      variant="ghost"
                      (click)="recordSemanticResizeAction()"
                    >
                      Inspect {{ row.name }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="cdk-resize-heading" data-testid="table-resize-cdk-section">
        <h2 id="cdk-resize-heading">CDK adapter-rendered resize contract</h2>
        <div class="text-xs text-hell-foreground-muted" aria-hidden="true">
          sort <output data-testid="cdk-resize-sort-count">{{ cdkResizeSortCount() }}</output>
          action <output data-testid="cdk-resize-action-count">{{ cdkResizeActionCount() }}</output>
          resize <output data-testid="cdk-resize-commit-count">{{ cdkResizeCommitCount() }}</output>
        </div>
        <div hellTableContainer class="overflow-auto max-w-[680px]">
          <table cdk-table fixedLayout data-testid="cdk-resize-table" class="w-[640px]" [dataSource]="rows">
            <ng-container cdkColumnDef="name">
              <th
                id="cdk-resize-name"
                cdk-header-cell
                *cdkHeaderCellDef
                scope="col"
                columnId="name"
                sortable
                [sort]="null"
                [style.--hell-table-col-width]="cdkResizeWidths().name + 'px'"
                data-testid="cdk-resize-name-header"
                (sortToggle)="recordCdkResizeSort()"
              >
                <button hellTableSortTrigger type="button">Name</button>
                <button
                  hellTableResizeHandle
                  type="button"
                  [minWidth]="120"
                  [resizeAdapter]="cdkResizeAdapter"
                  aria-controls="cdk-resize-name cdk-resize-role"
                  data-testid="cdk-resize-handle"
                  (resizeCommit)="recordCdkResizeCommit($event)"
                ></button>
              </th>
              <td cdk-cell *cdkCellDef="let row">{{ row.name }}</td>
            </ng-container>

            <ng-container cdkColumnDef="role">
              <th
                id="cdk-resize-role"
                cdk-header-cell
                *cdkHeaderCellDef
                scope="col"
                columnId="role"
                [style.--hell-table-col-width]="cdkResizeWidths().role + 'px'"
                data-testid="cdk-resize-role-header"
              >
                Role
              </th>
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
                  (click)="recordCdkResizeAction(row.id)"
                >
                  Inspect {{ row.name }}
                </button>
              </td>
            </ng-container>

            <tr cdk-header-row *cdkHeaderRowDef="cdkResizeDisplayedColumns"></tr>
            <tr
              cdk-row
              *cdkRowDef="let row; columns: cdkResizeDisplayedColumns"
              [active]="cdkResizeActiveRowId() === row.id"
            ></tr>
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
                        hellButton
                        hellTableRowAction
                        type="button"
                        size="xs"
                        variant="ghost"
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
                  <button hellButton hellTableRowAction type="button" size="xs" variant="ghost">
                    Edit Ada Lovelace
                  </button>
                </td>
              </tr>
              <tr hellTableRow [rowIndex]="3">
                <td id="grid-grace-name" hellTableCell [colIndex]="1">Grace Hopper</td>
                <td id="grid-grace-role" hellTableCell [colIndex]="2">Editor</td>
                <td id="grid-grace-action" hellTableCell [colIndex]="3">
                  <button hellButton hellTableRowAction type="button" size="xs" variant="ghost">
                    Edit Grace Hopper
                  </button>
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
  protected readonly cdkResizeDisplayedColumns = ['name', 'role', 'actions'];

  protected readonly sortDirection = signal<HellTableSortDirection | null>(null);
  protected readonly semanticResizeSortCount = signal(0);
  protected readonly semanticResizeActionCount = signal(0);
  protected readonly semanticResizeCommitCount = signal(0);
  protected readonly cdkResizeSortCount = signal(0);
  protected readonly cdkResizeActionCount = signal(0);
  protected readonly cdkResizeCommitCount = signal(0);
  protected readonly cdkResizeActiveRowId = signal<string | null>(null);
  protected readonly cdkResizeWidths = signal<Record<'name' | 'role', number>>({ name: 220, role: 180 });
  protected readonly cdkResizeAdapter: HellTableResizeAdapter = {
    before: this.cdkResizeItem('name', 'cdk-resize-name'),
    after: this.cdkResizeItem('role', 'cdk-resize-role'),
  };
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

  protected recordSemanticResizeSort(): void {
    this.semanticResizeSortCount.update((count) => count + 1);
  }

  protected recordSemanticResizeAction(): void {
    this.semanticResizeActionCount.update((count) => count + 1);
  }

  protected recordSemanticResizeCommit(_event: HellTableResizeEvent): void {
    this.semanticResizeCommitCount.update((count) => count + 1);
  }

  protected recordCdkResizeSort(): void {
    this.cdkResizeSortCount.update((count) => count + 1);
  }

  protected recordCdkResizeAction(rowId: string): void {
    this.cdkResizeActionCount.update((count) => count + 1);
    this.cdkResizeActiveRowId.set(rowId);
  }

  protected recordCdkResizeCommit(_event: HellTableResizeEvent): void {
    this.cdkResizeCommitCount.update((count) => count + 1);
  }

  private cdkResizeItem(columnId: 'name' | 'role', ariaControls: string): HellTableResizeItem {
    return {
      columnId,
      ariaControls,
      measure: () => this.cdkResizeWidths()[columnId],
      minSize: () => 120,
      setSize: (px) => this.setCdkResizeWidth(columnId, px),
      commitSize: (px) => this.setCdkResizeWidth(columnId, px),
    };
  }

  private setCdkResizeWidth(columnId: 'name' | 'role', px: number): void {
    this.cdkResizeWidths.update((current) => ({ ...current, [columnId]: px }));
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
