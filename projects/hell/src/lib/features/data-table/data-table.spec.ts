import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_TABLE_DIRECTIVES, type HellTableColumnResizeEvent } from './data-table';

@Component({
  imports: [...HELL_TABLE_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th
            id="name"
            hellTableHeaderCell
            columnId="name"
            [sortable]="sortable()"
            [sort]="sort()"
            (sortToggle)="sortEvents.push($event)"
          >
            Name
            <button
              id="name-resizer"
              hellTableColumnResizer
              [minWidth]="minWidth()"
              (columnResize)="resizeEvents.push($event)"
            ></button>
          </th>
          <th id="role" hellTableHeaderCell columnId="role">
            Role
            <button
              id="role-resizer"
              hellTableColumnResizer
              [minWidth]="minWidth()"
              (columnResize)="resizeEvents.push($event)"
            ></button>
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
  readonly minWidth = signal(40);

  readonly rowEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly cellEvents: MouseEvent[] = [];
  readonly sortEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly resizeEvents: HellTableColumnResizeEvent[] = [];
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

  it('resizes adjacent header cells from the keyboard and emits one transaction', () => {
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
    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer');
    resizer.dispatchEvent(key);
    fixture.detectChanges();

    expect(key.defaultPrevented).toBe(true);
    expect(host.resizeEvents).toEqual([
      {
        before: { columnId: 'name', px: 136, share: 0.68 },
        after: { columnId: 'role', px: 64, share: 0.32 },
        totalPx: 200,
      },
    ]);
    expect(name.style.getPropertyValue('--hell-table-col-width')).toBe('136px');
    expect(role.style.getPropertyValue('--hell-table-col-width')).toBe('64px');
    expect(resizer.getAttribute('aria-valuenow')).toBe('68');
  });

  it('resizes adjacent header cells from pointer drag and commits once on release', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.minWidth.set(70);
    fixture.detectChanges();

    const name = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const role = byId<HTMLTableCellElement>(fixture.nativeElement, 'role');
    mockWidth(name, 120);
    mockWidth(role, 80);

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer');
    const pointerDown = new PointerEvent('pointerdown', {
      button: 0,
      pointerId: 7,
      clientX: 10,
      bubbles: true,
      cancelable: true,
    });
    resizer.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(pointerDown.defaultPrevented).toBe(true);
    expect(resizer.getAttribute('data-active')).toBe('true');

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 7,
        clientX: 70,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(host.resizeEvents).toEqual([]);
    expect(name.style.getPropertyValue('--hell-table-col-width')).toBe('130px');
    expect(role.style.getPropertyValue('--hell-table-col-width')).toBe('70px');
    expect(resizer.getAttribute('aria-valuenow')).toBe('65');

    window.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId: 7,
        clientX: 70,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(resizer.hasAttribute('data-active')).toBe(false);
    expect(host.resizeEvents).toEqual([
      {
        before: { columnId: 'name', px: 130, share: 0.65 },
        after: { columnId: 'role', px: 70, share: 0.35 },
        totalPx: 200,
      },
    ]);
  });

  it('does nothing when the last header resizer has no neighbor', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    mockWidth(byId<HTMLTableCellElement>(fixture.nativeElement, 'role'), 80);
    byId<HTMLButtonElement>(fixture.nativeElement, 'role-resizer').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );

    expect(host.resizeEvents).toEqual([]);
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
