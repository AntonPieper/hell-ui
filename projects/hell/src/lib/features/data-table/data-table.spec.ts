import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_TABLE_DIRECTIVES } from './data-table';

@Component({
  imports: [...HELL_TABLE_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th
            id="name"
            hellTableHeaderCell
            [sortable]="sortable()"
            [sort]="sort()"
            [width]="nameWidth()"
            (sortToggle)="sortEvents.push($event)"
            (widthChange)="recordWidth('name', $event)"
          >
            Name
            <button id="name-resizer" hellTableColumnResizer [minWidth]="minWidth()"></button>
          </th>
          <th
            id="role"
            hellTableHeaderCell
            [width]="roleWidth()"
            (widthChange)="recordWidth('role', $event)"
          >
            Role
            <button id="role-resizer" hellTableColumnResizer [minWidth]="minWidth()"></button>
          </th>
        </tr>
      </thead>
      <tbody hellTableBody>
        <tr
          id="person-row"
          hellTableRow
          [selected]="selected()"
          [interactive]="interactive()"
          (rowSelect)="rowEvents.push($event)"
        >
          <td hellTableCell (cellSelect)="cellEvents.push($event)">Ada</td>
        </tr>
      </tbody>
    </table>
  `,
})
class DataTableHost {
  readonly interactive = signal(false);
  readonly selected = signal(false);
  readonly sortable = signal(false);
  readonly sort = signal<'asc' | 'desc' | null>(null);
  readonly nameWidth = signal<number | null>(120);
  readonly roleWidth = signal<number | null>(80);
  readonly minWidth = signal(40);

  readonly rowEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly cellEvents: MouseEvent[] = [];
  readonly sortEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly widthEvents: Array<{ column: string; width: number }> = [];

  recordWidth(column: string, width: number): void {
    this.widthEvents.push({ column, width });
  }
}

describe('Hell data table directives', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableHost],
    }).compileComponents();
  });

  it('emits row selection from click and keyboard only when interactive', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const row = byId<HTMLTableRowElement>(fixture.nativeElement, 'person-row');
    row.click();
    expect(host.rowEvents).toEqual([]);
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-selected')).toBe(false);

    host.interactive.set(true);
    host.selected.set(true);
    fixture.detectChanges();

    row.click();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    row.dispatchEvent(enter);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    row.dispatchEvent(space);

    expect(row.getAttribute('tabindex')).toBe('0');
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(space.defaultPrevented).toBe(true);
    expect(host.rowEvents).toHaveLength(3);
  });

  it('maps sortable header state and ignores resizer clicks', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.sortable.set(true);
    fixture.detectChanges();

    const header = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    expect(header.getAttribute('aria-sort')).toBe('none');

    host.sort.set('asc');
    fixture.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(header.getAttribute('data-sort')).toBe('asc');

    header.click();
    byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer').click();
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.sortEvents).toHaveLength(2);
  });

  it('resizes adjacent header cells from the keyboard', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const name = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const role = byId<HTMLTableCellElement>(fixture.nativeElement, 'role');
    mockWidth(name, 120);
    mockWidth(role, 80);

    const key = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer').dispatchEvent(key);

    expect(key.defaultPrevented).toBe(true);
    expect(host.widthEvents).toEqual([
      { column: 'name', width: 136 },
      { column: 'role', width: 64 },
    ]);
    expect(name.style.getPropertyValue('--hell-table-col-width')).toBe('136px');
    expect(role.style.getPropertyValue('--hell-table-col-width')).toBe('64px');
  });

  it('does nothing when the last header resizer has no neighbor', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    mockWidth(byId<HTMLTableCellElement>(fixture.nativeElement, 'role'), 80);
    byId<HTMLButtonElement>(fixture.nativeElement, 'role-resizer').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );

    expect(host.widthEvents).toEqual([]);
  });
});

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function mockWidth(element: HTMLElement, width: number): void {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    width,
    height: 24,
    top: 0,
    right: width,
    bottom: 24,
    left: 0,
    toJSON: () => ({}),
  });
}
