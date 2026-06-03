import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import { HELL_TABLE_UTILITIES_DIRECTIVES, type HellTableColumnResizeEvent } from './table-utilities';

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
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
            <button id="name-sort" hellTableSortTrigger type="button">Name</button>
            <span id="name-sort-non-button" hellTableSortTrigger tabindex="0">Ignored sort label</span>
            <button id="header-action" type="button">Filter</button>
            <button
              id="name-resizer"
              hellTableColumnResizer
              [minWidth]="minWidth()"
              [aria-controls]="[' name-resizer-pane ', ' ']"
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
          [selectable]="selectable()"
          (rowSelect)="rowEvents.push($event)"
        >
          <td hellTableCell (cellSelect)="cellEvents.push($event)">
            Ada
            <button id="row-action" type="button">Edit</button>
            <a id="row-link" href="/people/ada">Profile</a>
            <input id="row-input" aria-label="Inline edit" />
            <span id="row-ignore" hellTableRowIgnore>Ignore</span>
            <span id="row-legacy-ignore" data-hell-row-ignore>Legacy Ignore</span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class DataTableHost {
  readonly selectable = signal(false);
  readonly selected = signal(false);
  readonly sortable = signal(false);
  readonly sort = signal<'asc' | 'desc' | null>(null);
  readonly minWidth = signal(40);

  readonly rowEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly cellEvents: MouseEvent[] = [];
  readonly sortEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly resizeEvents: HellTableColumnResizeEvent[] = [];
}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th id="override-left" hellTableHeaderCell columnId="override-left">
            <button id="left-sort" hellTableSortTrigger type="button">Left</button>
            <button
              id="left-resizer"
              hellTableColumnResizer
              [minWidth]="40"
              aria-label="Custom resize label"
            ></button>
          </th>
          <th id="override-right" hellTableHeaderCell columnId="override-right">
            Right
            <button id="right-resizer" hellTableColumnResizer [minWidth]="40"></button>
          </th>
        </tr>
      </thead>
      <tbody hellTableBody>
        <tr>
          <td hellTableCell>Left</td>
          <td hellTableCell>Right</td>
        </tr>
      </tbody>
    </table>
  `,
})
class DataTableResizerAriaOverrideHost {}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  providers: [provideHellLabels({ tableUtilities: { resizeColumn: 'Spaltenbreite ändern' } })],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th id="localized-left" hellTableHeaderCell columnId="localized-left">
            Left
            <button id="localized-resizer" hellTableColumnResizer [minWidth]="40"></button>
          </th>
          <th id="localized-right" hellTableHeaderCell columnId="localized-right">Right</th>
        </tr>
      </thead>
    </table>
  `,
})
class DataTableLocalizedLabelHost {}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th
            id="alpha-header"
            hellTableHeaderCell
            columnId="alpha"
            sortable
            [sort]="activeColumn() === 'alpha' ? order() : null"
          >
            <button id="alpha-sort" hellTableSortTrigger type="button">Alpha</button>
          </th>
          <th
            id="beta-header"
            hellTableHeaderCell
            columnId="beta"
            sortable
            [sort]="activeColumn() === 'beta' ? order() : null"
          >
            <button id="beta-sort" hellTableSortTrigger type="button">Beta</button>
          </th>
        </tr>
      </thead>
    </table>
  `,
})
class DataTableSortableAriaHost {
  readonly activeColumn = signal<'alpha' | 'beta'>('alpha');
  readonly order = signal<'asc' | 'desc'>('asc');
}

describe('Hell table utilities directives', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DataTableHost,
        DataTableResizerAriaOverrideHost,
        DataTableLocalizedLabelHost,
        DataTableSortableAriaHost,
      ],
    }).compileComponents();
  });

  it('keeps rows static unless a selectable row model is explicit', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const row = byId<HTMLTableRowElement>(fixture.nativeElement, 'person-row');
    row.click();
    expect(host.rowEvents).toEqual([]);
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-selected')).toBe(false);

    host.selected.set(true);
    fixture.detectChanges();
    expect(row.getAttribute('data-selected')).toBe('true');
    expect(row.hasAttribute('aria-selected')).toBe(false);

    host.selectable.set(true);
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

  it('does not select rows or cells from nested interactive controls', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.selectable.set(true);
    fixture.detectChanges();

    byId<HTMLButtonElement>(fixture.nativeElement, 'row-action').click();
    const link = byId<HTMLAnchorElement>(fixture.nativeElement, 'row-link');
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    byId<HTMLInputElement>(fixture.nativeElement, 'row-input').click();

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    byId<HTMLButtonElement>(fixture.nativeElement, 'row-action').dispatchEvent(enter);

    expect(enter.defaultPrevented).toBe(false);
    expect(host.rowEvents).toEqual([]);
    expect(host.cellEvents).toEqual([]);
  });

  it('does not select row from elements marked as table row ignore', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.selectable.set(true);
    fixture.detectChanges();

    const row = byId<HTMLTableRowElement>(fixture.nativeElement, 'person-row');
    byId<HTMLSpanElement>(fixture.nativeElement, 'row-ignore').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    byId<HTMLSpanElement>(fixture.nativeElement, 'row-legacy-ignore').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(host.rowEvents).toEqual([]);
    row.click();

    expect(host.rowEvents).toHaveLength(1);
    expect(host.rowEvents[0].type).toBe('click');
  });

  it('disables the sort trigger when its header is not sortable', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const sortTrigger = byId<HTMLButtonElement>(fixture.nativeElement, 'name-sort');
    expect(sortTrigger.disabled).toBe(true);

    sortTrigger.click();
    expect(host.sortEvents).toEqual([]);

    host.sortable.set(true);
    fixture.detectChanges();
    expect(sortTrigger.disabled).toBe(false);
  });

  it('maps sortable header state and ignores resizer clicks', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;

    const name = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const role = byId<HTMLTableCellElement>(fixture.nativeElement, 'role');
    mockWidth(name, 120);
    mockWidth(role, 80);

    host.sortable.set(true);
    fixture.detectChanges();

    const header = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const sortTrigger = byId<HTMLButtonElement>(fixture.nativeElement, 'name-sort');
    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer');

    expect(header.getAttribute('aria-sort')).toBe(null);
    expect(header.hasAttribute('tabindex')).toBe(false);
    expect(sortTrigger.getAttribute('type')).toBe('button');
    expect(resizer.getAttribute('aria-valuenow')).toBe('60');

    host.sort.set('asc');
    fixture.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(header.getAttribute('data-sort')).toBe('asc');

    sortTrigger.click();
    resizer.click();
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(host.sortEvents).toHaveLength(1);
  });

  it('sets aria-sort only on the active sorted header', () => {
    const fixture = TestBed.createComponent(DataTableSortableAriaHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const alpha = byId<HTMLTableCellElement>(fixture.nativeElement, 'alpha-header');
    const beta = byId<HTMLTableCellElement>(fixture.nativeElement, 'beta-header');

    expect(alpha.getAttribute('aria-sort')).toBe('ascending');
    expect(beta.hasAttribute('aria-sort')).toBe(false);

    host.activeColumn.set('beta');
    host.order.set('desc');
    fixture.detectChanges();

    expect(alpha.hasAttribute('aria-sort')).toBe(false);
    expect(beta.getAttribute('aria-sort')).toBe('descending');
  });

  it('does not sort from columnheader or non-button trigger hosts', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.sortable.set(true);
    fixture.detectChanges();

    const header = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const nonButtonTrigger = byId<HTMLElement>(fixture.nativeElement, 'name-sort-non-button');

    header.click();
    header.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    header.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    nonButtonTrigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    nonButtonTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(nonButtonTrigger.classList.contains('hell-table-sort-trigger')).toBe(false);
    expect(host.sortEvents).toEqual([]);
  });

  it('emits sort activation from the native button trigger', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.sortable.set(true);
    fixture.detectChanges();

    const sortTrigger = byId<HTMLButtonElement>(fixture.nativeElement, 'name-sort');
    sortTrigger.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));

    expect(host.sortEvents).toHaveLength(1);
    expect(host.sortEvents[0].type).toBe('click');
    expect(host.sortEvents[0].target).toBe(sortTrigger);
  });

  it('does not sort from nested header controls', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    host.sortable.set(true);
    fixture.detectChanges();

    const action = byId<HTMLButtonElement>(fixture.nativeElement, 'header-action');
    action.click();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    action.dispatchEvent(enter);

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer');
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    resizer.dispatchEvent(space);

    expect(enter.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
    expect(host.sortEvents).toEqual([]);
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
    expect(resizer.getAttribute('type')).toBe('button');
    expect(resizer.getAttribute('aria-label')).toBe('Resize column');
    expect(resizer.getAttribute('aria-controls')).toBe('name-resizer-pane');
    expect(resizer.getAttribute('aria-valuemin')).toBe('0');
    expect(resizer.getAttribute('aria-valuemax')).toBe('100');
    expect(resizer.getAttribute('aria-valuenow')).toBe('68');
    expect(byId<HTMLButtonElement>(fixture.nativeElement, 'role-resizer').getAttribute('aria-controls')).toBe(
      null,
    );
  });

  it('uses RTL-aware horizontal arrow semantics for column resize', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const name = byId<HTMLTableCellElement>(fixture.nativeElement, 'name');
    const role = byId<HTMLTableCellElement>(fixture.nativeElement, 'role');
    mockWidth(name, 120);
    mockWidth(role, 80);

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'name-resizer');
    resizer.setAttribute('dir', 'rtl');
    resizer.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(host.resizeEvents).toEqual([
      {
        before: { columnId: 'name', px: 104, share: 0.52 },
        after: { columnId: 'role', px: 96, share: 0.48 },
        totalPx: 200,
      },
    ]);
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

  it('marks the last header resizer disabled when it has no neighbor', () => {
    const fixture = TestBed.createComponent(DataTableHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'role-resizer');
    const key = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    const pointer = new PointerEvent('pointerdown', {
      button: 0,
      pointerId: 8,
      clientX: 10,
      bubbles: true,
      cancelable: true,
    });

    mockWidth(byId<HTMLTableCellElement>(fixture.nativeElement, 'role'), 80);
    resizer.dispatchEvent(key);
    resizer.dispatchEvent(pointer);

    expect(resizer.getAttribute('aria-disabled')).toBe('true');
    expect(resizer.getAttribute('aria-label')).toBe('Resize column');
    expect(resizer.getAttribute('tabindex')).toBe('-1');
    expect(resizer.getAttribute('role')).toBeNull();
    expect(resizer.getAttribute('aria-valuenow')).toBeNull();
    expect(key.defaultPrevented).toBe(false);
    expect(pointer.defaultPrevented).toBe(false);
    expect(host.resizeEvents).toEqual([]);
  });

  it('uses explicit aria-label override for column resizer', () => {
    const fixture = TestBed.createComponent(DataTableResizerAriaOverrideHost);
    fixture.detectChanges();

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'left-resizer');
    expect(resizer.getAttribute('aria-label')).toBe('Custom resize label');
  });

  it('uses preferred table utilities label overrides for column resizer defaults', () => {
    const fixture = TestBed.createComponent(DataTableLocalizedLabelHost);
    fixture.detectChanges();

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'localized-resizer');
    expect(resizer.getAttribute('aria-label')).toBe('Spaltenbreite ändern');
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
