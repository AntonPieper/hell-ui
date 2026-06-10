import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  hellColumns,
  textColumn,
  type HellTableColumnVisibilityState,
  type HellTableSortDirection,
  type HellTableSortingState,
} from '../table/table';
import {
  HELL_CDK_TABLE_DIRECTIVES,
  HELL_CDK_TABLE_VIRTUAL_SCROLL_GUIDANCE,
  hellCdkDisplayedColumns,
} from './table-cdk';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  { id: 'margaret', name: 'Margaret Hamilton', role: 'Viewer' },
];

const columnBuilder = hellColumns<Person>();
const TABLE_COLUMNS = columnBuilder.define([
  textColumn<Person, string>('name', {
    header: 'Name',
    accessor: 'name',
    sortable: true,
    visibility: 'always',
  }),
  textColumn<Person, string>('role', {
    header: 'Role',
    accessor: 'role',
    sortable: true,
    visibility: 'user-toggleable',
  }),
  textColumn<Person, string>('region', {
    header: 'Region',
    accessor: () => 'Remote',
    visibility: 'initially-hidden',
  }),
]);

@Component({
  selector: 'hell-test-cdk-flex-host',
  imports: [HELL_CDK_TABLE_DIRECTIVES],
  template: `
    <cdk-table [dataSource]="rows" contentWidth>
      <ng-container cdkColumnDef="name">
        <cdk-header-cell
          *cdkHeaderCellDef
          columnId="name"
          sortable
          [sort]="sortDirection"
          (sortToggle)="sortToggleCount = sortToggleCount + 1"
        >
          <button hellTableSortTrigger type="button">Name</button>
        </cdk-header-cell>
        <cdk-cell *cdkCellDef="let row">{{ row.name }}</cdk-cell>
      </ng-container>

      <ng-container cdkColumnDef="role">
        <cdk-header-cell *cdkHeaderCellDef columnId="role">Role</cdk-header-cell>
        <cdk-cell *cdkCellDef="let row">{{ row.role }}</cdk-cell>
      </ng-container>

      <cdk-header-row *cdkHeaderRowDef="displayedColumns"></cdk-header-row>
      <cdk-row
        *cdkRowDef="let row; columns: displayedColumns"
        [active]="row.id === activeId"
        [selected]="row.id === selectedId"
      ></cdk-row>
    </cdk-table>
  `,
})
class CdkFlexHost {
  protected readonly rows = people.slice(0, 2);
  protected readonly displayedColumns = ['name', 'role'];
  protected readonly activeId = 'ada';
  protected readonly selectedId = 'grace';
  protected readonly sortDirection: HellTableSortDirection = 'asc';
  sortToggleCount = 0;
}

@Component({
  selector: 'hell-test-cdk-native-host',
  imports: [HELL_CDK_TABLE_DIRECTIVES],
  template: `
    <table cdk-table fixedLayout [dataSource]="pagedRows()">
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

      <ng-container cdkColumnDef="role">
        <th
          cdk-header-cell
          *cdkHeaderCellDef
          scope="col"
          columnId="role"
          sortable
          [sort]="sortFor('role')"
          (sortToggle)="toggleSort('role')"
        >
          <button hellTableSortTrigger type="button">Role</button>
        </th>
        <td cdk-cell *cdkCellDef="let row">{{ row.role }}</td>
      </ng-container>

      <ng-container cdkColumnDef="region">
        <th cdk-header-cell *cdkHeaderCellDef scope="col" columnId="region">Region</th>
        <td cdk-cell *cdkCellDef="let row">Remote</td>
      </ng-container>

      <tr cdk-header-row *cdkHeaderRowDef="displayedColumns()"></tr>
      <tr cdk-row *cdkRowDef="let row; columns: displayedColumns()"></tr>
    </table>
  `,
})
class CdkNativeHost {
  readonly columnVisibility = signal<HellTableColumnVisibilityState>({ region: false });
  readonly sorting = signal<readonly HellTableSortingState[]>([]);
  readonly pageIndex = signal(0);
  readonly pageSize = 2;
  readonly displayedColumns = computed(() =>
    hellCdkDisplayedColumns(TABLE_COLUMNS, this.columnVisibility()),
  );
  readonly sortedRows = computed(() => sortRows(people, this.sorting()));
  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.sortedRows().slice(start, start + this.pageSize);
  });

  sortFor(columnId: string): HellTableSortDirection | null {
    return this.sorting().find((sort) => sort.columnId === columnId)?.direction ?? null;
  }

  toggleSort(columnId: string): void {
    const current = this.sortFor(columnId);
    const direction: HellTableSortDirection | null =
      current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc';
    this.sorting.set(direction ? [{ columnId, direction }] : []);
  }
}

describe('Hell CDK table skin adapter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CdkFlexHost, CdkNativeHost],
    }).compileComponents();
  });

  it('skins flex CDK table hosts with Hell table primitives without extra CDK row definitions', () => {
    const fixture = TestBed.createComponent(CdkFlexHost);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.querySelector('cdk-table')?.classList).toContain('hell-table');
    expect(root.querySelector('cdk-table')?.getAttribute('role')).toBe('table');
    expect(root.querySelector('cdk-table')?.getAttribute('data-hell-cdk-table')).toBe('');
    expect(root.querySelector('cdk-header-row')?.classList).toContain('hell-table-row');
    expect(root.querySelector('cdk-header-cell')?.classList).toContain('hell-table-header-cell');
    expect(root.querySelector('cdk-cell')?.classList).toContain('hell-table-cell');

    const rows = [...root.querySelectorAll('cdk-row')];
    expect(rows.length).toBe(2);
    expect(rows[0]?.getAttribute('data-active')).toBe('true');
    expect(rows[1]?.getAttribute('data-selected')).toBe('true');

    root.querySelector<HTMLButtonElement>('button[hellTableSortTrigger]')?.click();
    expect(fixture.componentInstance.sortToggleCount).toBe(1);
  });

  it('derives native CDK displayedColumns from Hell visibility while app code owns sort and pagination', () => {
    const fixture = TestBed.createComponent(CdkNativeHost);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(fixture.componentInstance.displayedColumns()).toEqual(['name', 'role']);
    expect(headerText(root)).toBe('Name Role');
    expect(bodyText(root)).toContain('Ada Lovelace');
    expect(bodyText(root)).not.toContain('Margaret Hamilton');
    expect(root.querySelector('table')?.classList).toContain('hell-table');
    expect(root.querySelector('tr[cdk-header-row]')?.classList).toContain('hell-table-row');
    expect(root.querySelector('th[cdk-header-cell]')?.classList).toContain(
      'hell-table-header-cell',
    );
    expect(root.querySelector('td[cdk-cell]')?.classList).toContain('hell-table-cell');

    fixture.componentInstance.columnVisibility.set({ role: false, region: true });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayedColumns()).toEqual(['name', 'region']);
    expect(headerText(root)).toBe('Name Region');

    fixture.componentInstance.columnVisibility.set({ region: false });
    fixture.detectChanges();
    expect(fixture.componentInstance.displayedColumns()).toEqual(['name', 'role']);

    const [nameSortButton, roleSortButton] = root.querySelectorAll<HTMLButtonElement>(
      'button[hellTableSortTrigger]',
    );

    nameSortButton?.click();
    fixture.componentInstance.pageIndex.set(0);
    fixture.detectChanges();
    expect(fixture.componentInstance.sorting()).toEqual([{ columnId: 'name', direction: 'asc' }]);
    expect(firstDataCellText(root)).toBe('Ada Lovelace');

    nameSortButton?.click();
    fixture.componentInstance.pageIndex.set(1);
    fixture.detectChanges();
    expect(fixture.componentInstance.sorting()).toEqual([{ columnId: 'name', direction: 'desc' }]);
    expect(firstDataCellText(root)).toBe('Ada Lovelace');

    roleSortButton?.click();
    fixture.componentInstance.pageIndex.set(0);
    fixture.detectChanges();
    expect(fixture.componentInstance.sorting()).toEqual([{ columnId: 'role', direction: 'asc' }]);
    expect(bodyText(root)).toMatch(/Ada Lovelace\s+Admin\s+Grace Hopper\s+Editor/);

    roleSortButton?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sorting()).toEqual([{ columnId: 'role', direction: 'desc' }]);
    expect(bodyText(root)).toMatch(/Margaret Hamilton\s+Viewer\s+Grace Hopper\s+Editor/);
  });

  it('states that CDK virtual scrolling is fixed-size while dynamic heights use TanStack Virtual', () => {
    expect(HELL_CDK_TABLE_VIRTUAL_SCROLL_GUIDANCE).toContain('fixed-size');
    expect(HELL_CDK_TABLE_VIRTUAL_SCROLL_GUIDANCE).toContain('@hell-ui/angular/table-virtual');
    expect(HELL_CDK_TABLE_VIRTUAL_SCROLL_GUIDANCE).toContain('dynamic-height TanStack Virtual');
  });
});

function sortRows(
  rows: readonly Person[],
  sorting: readonly HellTableSortingState[],
): readonly Person[] {
  const activeSort = sorting[0];
  if (!activeSort) return rows;
  return [...rows].sort((a, b) => {
    const result = sortableValue(a, activeSort.columnId).localeCompare(
      sortableValue(b, activeSort.columnId),
    );
    return activeSort.direction === 'desc' ? -result : result;
  });
}

function sortableValue(row: Person, columnId: string): string {
  switch (columnId) {
    case 'name':
      return row.name;
    case 'role':
      return row.role;
    default:
      return '';
  }
}

function headerText(root: HTMLElement): string {
  return text([...root.querySelectorAll('th[cdk-header-cell], cdk-header-cell')]);
}

function bodyText(root: HTMLElement): string {
  return text([...root.querySelectorAll('td[cdk-cell], cdk-cell')]);
}

function firstDataCellText(root: HTMLElement): string {
  return root.querySelector('td[cdk-cell], cdk-cell')?.textContent?.trim() ?? '';
}

function text(elements: Element[]): string {
  return elements
    .map((element) => element.textContent?.trim())
    .filter(Boolean)
    .join(' ');
}
