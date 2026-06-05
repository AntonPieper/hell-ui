import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_DATA_TABLE_DIRECTIVES,
  HellDataTable,
  actionColumn,
  booleanColumn,
  hellColumns,
  textColumn,
  type HellTableSortingState,
} from './data-table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly role?: string;
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

describe('HellDataTable simple renderer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MinimalDataTableHost,
        SignalRowsDataTableHost,
        StatusDataTableHost,
        SortableDataTableHost,
        ControlledSortingDataTableHost,
        CustomTemplateDataTableHost,
      ],
    }).compileComponents();
  });

  it('renders HellColumnDef rows with native table semantics by default', () => {
    const fixture = TestBed.createComponent(MinimalDataTableHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('table')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('thead')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('tbody')?.getAttribute('role')).toBeNull();
    expect(root.querySelector('tr')?.getAttribute('role')).toBeNull();
    expect([...root.querySelectorAll('th')].map((cell) => cell.textContent?.trim())).toEqual([
      'Name',
      'Active',
    ]);
    expect([...root.querySelectorAll('tbody tr')].map((row) => row.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Ada true',
      'Grace false',
    ]);
    expect(root.querySelector('tbody tr')?.getAttribute('data-row-key')).toBe('ada');
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
});

function tableBodyText(root: Element): string {
  return [...root.querySelectorAll('tbody tr')]
    .map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .join(' ');
}
