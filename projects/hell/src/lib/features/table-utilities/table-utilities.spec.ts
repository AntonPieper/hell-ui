import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import {
  HELL_TABLE_UTILITIES_DIRECTIVES,
  type HellTableResizeAdapter,
  type HellTableResizeEvent,
  type HellTableResizeItem,
} from './table-utilities';

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th hellTableHeaderCell hellTableSelectionCell>
            <input
              id="select-all"
              hellTableRowCheckbox
              type="checkbox"
              aria-label="Select all people"
              [indeterminate]="indeterminate()"
              (checkedChange)="checkboxEvents.push($event)"
            />
          </th>
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
              hellTableResizeHandle
              [minWidth]="minWidth()"
              [aria-controls]="[' name-resizer-pane ', ' ']"
              (resizeCommit)="resizeEvents.push($event)"
            ></button>
          </th>
          <th id="role" hellTableHeaderCell columnId="role">
            Role
            <button
              id="role-resizer"
              hellTableResizeHandle
              [minWidth]="minWidth()"
              (resizeCommit)="resizeEvents.push($event)"
            ></button>
          </th>
        </tr>
      </thead>
      <tbody hellTableBody>
        <tr id="person-row" hellTableRow [active]="active()" [selected]="selected()">
          <td hellTableCell hellTableSelectionCell>
            <input
              id="row-checkbox"
              hellTableRowCheckbox
              type="checkbox"
              aria-label="Select Ada"
              [checked]="selected()"
              (checkedChange)="onCheckboxChange($event)"
            />
          </td>
          <td hellTableCell>
            Ada
            <button
              id="row-action"
              hellTableRowAction
              type="button"
              (click)="actionEvents.push($event)"
            >
              Edit
            </button>
            <a
              id="row-link"
              hellTableRowAction
              href="/people/ada"
              (click)="actionEvents.push($event)"
            >
              Profile
            </a>
            <input id="row-input" aria-label="Inline edit" />
            <span id="row-ignore" hellTableRowIgnore>Ignore</span>
            <span id="row-legacy-ignore" data-hell-row-ignore>Legacy Ignore</span>
          </td>
          <td hellTableCell hellTableSelectionCell>
            <input
              id="row-radio"
              hellTableRowRadio
              type="radio"
              name="primary-row"
              aria-label="Make Ada primary"
              [checked]="radioSelected()"
              (checkedChange)="onRadioChange($event)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class TableUtilitiesHost {
  readonly active = signal(false);
  readonly selected = signal(false);
  readonly indeterminate = signal(false);
  readonly radioSelected = signal(false);
  readonly sortable = signal(false);
  readonly sort = signal<'asc' | 'desc' | null>(null);
  readonly minWidth = signal(40);

  readonly actionEvents: MouseEvent[] = [];
  readonly checkboxEvents: boolean[] = [];
  readonly radioEvents: boolean[] = [];
  readonly sortEvents: Array<MouseEvent | KeyboardEvent> = [];
  readonly resizeEvents: HellTableResizeEvent[] = [];

  onCheckboxChange(checked: boolean): void {
    this.checkboxEvents.push(checked);
    this.selected.set(checked);
  }

  onRadioChange(checked: boolean): void {
    this.radioEvents.push(checked);
    this.radioSelected.set(checked);
  }
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
              hellTableResizeHandle
              [minWidth]="40"
              aria-label="Custom resize label"
            ></button>
          </th>
          <th id="override-right" hellTableHeaderCell columnId="override-right">
            Right
            <button id="right-resizer" hellTableResizeHandle [minWidth]="40"></button>
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
class TableUtilitiesResizerAriaOverrideHost {}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  providers: [provideHellLabels({ tableUtilities: { resizeColumn: 'Spaltenbreite ändern' } })],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th id="localized-left" hellTableHeaderCell columnId="localized-left">
            Left
            <button id="localized-resizer" hellTableResizeHandle [minWidth]="40"></button>
          </th>
          <th id="localized-right" hellTableHeaderCell columnId="localized-right">Right</th>
        </tr>
      </thead>
    </table>
  `,
})
class TableUtilitiesLocalizedLabelHost {}

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
class TableUtilitiesSortableAriaHost {
  readonly activeColumn = signal<'alpha' | 'beta'>('alpha');
  readonly order = signal<'asc' | 'desc'>('asc');
}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table hellTable>
      <thead hellTableHead>
        <tr>
          <th id="adapter-alpha" hellTableHeaderCell columnId="alpha">
            Alpha
            <button
              id="adapter-resizer"
              hellTableResizeHandle
              aria-controls="adapter-alpha adapter-beta"
              [resizeAdapter]="adapter"
              (resizeCommit)="resizeEvents.push($event)"
            ></button>
          </th>
          <th id="adapter-beta" hellTableHeaderCell columnId="beta">Beta</th>
        </tr>
      </thead>
    </table>
  `,
})
class TableUtilitiesResizeAdapterHost {
  readonly widths = signal<Record<'alpha' | 'beta', number>>({ alpha: 100, beta: 100 });
  readonly resizeEvents: HellTableResizeEvent[] = [];
  readonly commitEvents: Array<{ columnId: 'alpha' | 'beta'; px: number }> = [];
  readonly adapter: HellTableResizeAdapter = {
    before: this.item('alpha'),
    after: this.item('beta'),
  };

  private item(columnId: 'alpha' | 'beta'): HellTableResizeItem {
    return {
      columnId,
      measure: () => this.widths()[columnId],
      minSize: () => 70,
      setSize: (px) => this.setWidth(columnId, px),
      commitSize: (px) => {
        this.commitEvents.push({ columnId, px });
        this.setWidth(columnId, px);
      },
    };
  }

  private setWidth(columnId: 'alpha' | 'beta', px: number): void {
    this.widths.update((current) => ({ ...current, [columnId]: px }));
  }
}

describe('Hell table utilities directives', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TableUtilitiesHost,
        TableUtilitiesResizerAriaOverrideHost,
        TableUtilitiesLocalizedLabelHost,
        TableUtilitiesSortableAriaHost,
        TableUtilitiesResizeAdapterHost,
      ],
    }).compileComponents();
  });

  it('keeps active and selected row states visual in native table mode', () => {
    const fixture = TestBed.createComponent(TableUtilitiesHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const row = byId<HTMLTableRowElement>(fixture.nativeElement, 'person-row');
    row.click();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    row.dispatchEvent(enter);
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    row.dispatchEvent(space);

    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-selected')).toBe(false);
    expect(row.hasAttribute('data-interactive')).toBe(false);
    expect(enter.defaultPrevented).toBe(false);
    expect(space.defaultPrevented).toBe(false);
    expect(host.actionEvents).toEqual([]);

    host.active.set(true);
    host.selected.set(true);
    fixture.detectChanges();

    expect(row.getAttribute('data-active')).toBe('true');
    expect(row.getAttribute('data-selected')).toBe('true');
    expect(row.hasAttribute('tabindex')).toBe(false);
    expect(row.hasAttribute('aria-selected')).toBe(false);
  });

  it('uses native row action, checkbox, and radio controls for row interaction', () => {
    const fixture = TestBed.createComponent(TableUtilitiesHost);
    const host = fixture.componentInstance;
    host.indeterminate.set(true);
    fixture.detectChanges();

    const row = byId<HTMLTableRowElement>(fixture.nativeElement, 'person-row');
    const action = byId<HTMLButtonElement>(fixture.nativeElement, 'row-action');
    const link = byId<HTMLAnchorElement>(fixture.nativeElement, 'row-link');
    const checkbox = byId<HTMLInputElement>(fixture.nativeElement, 'row-checkbox');
    const radio = byId<HTMLInputElement>(fixture.nativeElement, 'row-radio');
    const selectAll = byId<HTMLInputElement>(fixture.nativeElement, 'select-all');

    expect(action.getAttribute('type')).toBe('button');
    expect(action.getAttribute('data-hell-table-row-action')).toBe('');
    expect(link.getAttribute('type')).toBeNull();
    expect(checkbox.checked).toBe(false);
    expect(radio.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.getAttribute('data-indeterminate')).toBe('');
    expect(checkbox.classList.contains('hell-checkbox')).toBe(true);
    expect(radio.classList.contains('hell-radio')).toBe(true);
    expect(byId<HTMLElement>(fixture.nativeElement, 'row-checkbox').getAttribute('data-hell-table-row-checkbox')).toBe('');
    expect(byId<HTMLElement>(fixture.nativeElement, 'row-radio').getAttribute('data-hell-table-row-radio')).toBe('');

    action.click();
    link.addEventListener('click', (event) => event.preventDefault(), { once: true });
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    checkbox.click();
    radio.click();
    fixture.detectChanges();

    expect(host.actionEvents).toHaveLength(2);
    expect(host.checkboxEvents).toEqual([true]);
    expect(host.radioEvents).toEqual([true]);
    expect(checkbox.checked).toBe(true);
    expect(radio.checked).toBe(true);
    expect(row.getAttribute('data-selected')).toBe('true');
    expect(row.hasAttribute('aria-selected')).toBe(false);
  });

  it('keeps row-ignore markers inert now that rows do not activate', () => {
    const fixture = TestBed.createComponent(TableUtilitiesHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    byId<HTMLSpanElement>(fixture.nativeElement, 'row-ignore').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    byId<HTMLSpanElement>(fixture.nativeElement, 'row-legacy-ignore').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );

    expect(host.actionEvents).toEqual([]);
    expect(byId<HTMLSpanElement>(fixture.nativeElement, 'row-ignore').getAttribute('data-hell-row-ignore')).toBe('');
    expect(byId<HTMLSpanElement>(fixture.nativeElement, 'row-legacy-ignore').getAttribute('data-hell-row-ignore')).toBe('');
  });

  it('disables the sort trigger when its header is not sortable', () => {
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesSortableAriaHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    let leakedKeys = 0;
    name.addEventListener('keydown', () => leakedKeys++);
    resizer.dispatchEvent(key);
    fixture.detectChanges();

    expect(key.defaultPrevented).toBe(true);
    expect(leakedKeys).toBe(0);
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

  it('delegates sizing through a provided resize adapter without header-cell state', () => {
    const fixture = TestBed.createComponent(TableUtilitiesResizeAdapterHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'adapter-resizer');
    resizer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.widths()).toEqual({ alpha: 116, beta: 84 });
    expect(host.commitEvents).toEqual([
      { columnId: 'alpha', px: 116 },
      { columnId: 'beta', px: 84 },
    ]);
    expect(host.resizeEvents).toEqual([
      {
        before: { columnId: 'alpha', px: 116, share: 0.58 },
        after: { columnId: 'beta', px: 84, share: 0.42 },
        totalPx: 200,
      },
    ]);
    expect(byId<HTMLElement>(fixture.nativeElement, 'adapter-alpha').style.getPropertyValue('--hell-table-col-width')).toBe('');
    expect(byId<HTMLElement>(fixture.nativeElement, 'adapter-beta').style.getPropertyValue('--hell-table-col-width')).toBe('');
    expect(resizer.getAttribute('aria-controls')).toBe('adapter-alpha adapter-beta');
    expect(resizer.getAttribute('aria-valuenow')).toBe('58');
  });

  it('uses RTL-aware horizontal arrow semantics for resize intent', () => {
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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
    let leakedPointerDown = 0;
    name.addEventListener('pointerdown', () => leakedPointerDown++);
    resizer.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(pointerDown.defaultPrevented).toBe(true);
    expect(leakedPointerDown).toBe(0);
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
    const fixture = TestBed.createComponent(TableUtilitiesHost);
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

  it('uses explicit aria-label override for resize handle', () => {
    const fixture = TestBed.createComponent(TableUtilitiesResizerAriaOverrideHost);
    fixture.detectChanges();

    const resizer = byId<HTMLButtonElement>(fixture.nativeElement, 'left-resizer');
    expect(resizer.getAttribute('aria-label')).toBe('Custom resize label');
  });

  it('uses preferred table utilities label overrides for resize handle defaults', () => {
    const fixture = TestBed.createComponent(TableUtilitiesLocalizedLabelHost);
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
