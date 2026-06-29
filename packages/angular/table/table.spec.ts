import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { hellTableInferredRoleForHost } from './table-role-inference';
import { HELL_TABLE_UTILITIES_DIRECTIVES, type HellTableResizeHandleUi } from './table';

@Component({
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table id="native-root" hellTableRoot contentWidth>
      <thead id="native-header" hellTableHeader>
        <tr id="native-header-row" hellTableRow>
          <th id="native-header-cell" hellTableHeaderCell columnId="name" sortable sort="asc">
            <button id="sort" hellTableSortTrigger>Name</button>
          </th>
          <th id="select-header" hellTableHeaderCell hellTableSelectionCell>
            <input id="select-all" type="checkbox" hellTableRowCheckbox />
          </th>
        </tr>
      </thead>
      <tbody id="native-body" hellTableBody>
        <tr id="native-row" hellTableRow active selected>
          <td id="native-cell" hellTableCell align="end" space="empty">Ada</td>
          <td id="select-cell" hellTableCell hellTableSelectionCell>
            <input id="select-row" type="radio" hellTableRowRadio />
            <button id="edit-row" hellTableRowAction>Edit</button>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
class NativeTablePrimitiveHost {}

@Component({
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="inferred-root" hellTableRoot>
      <div id="inferred-header" hellTableHeader>
        <div id="inferred-header-row" hellTableRow>
          <div id="inferred-header-cell" hellTableHeaderCell columnId="name">Name</div>
        </div>
      </div>
      <div id="inferred-body" hellTableBody>
        <div id="inferred-row" hellTableRow>
          <div id="inferred-cell" hellTableCell>Ada</div>
        </div>
      </div>
    </div>
  `,
})
class InferredRoleTablePrimitiveHost {}

@Component({
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="explicit-root" hellTableRoot role="grid">
      <div id="explicit-row" hellTableRow role="row">
        <div id="explicit-cell" hellTableCell role="gridcell">Ada</div>
      </div>
    </div>
  `,
})
class ExplicitRoleTablePrimitiveHost {}

@Component({
  standalone: true,
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="ui-root" hellTableRoot ui="bg-hell-surface-muted">
      <div id="ui-row" hellTableRow ui="bg-hell-primary-soft" active>
        <div id="ui-cell" hellTableCell hellTableSelectionCell ui="text-hell-danger px-hell-7">
          Ada
          <button id="ui-action" hellTableRowAction ui="text-hell-danger">Open</button>
          <input id="ui-checkbox" hellTableRowCheckbox type="checkbox" ui="border-hell-danger" />
          <button id="ui-resizer" hellTableResizeHandle [ui]="resizeHandleUi"></button>
        </div>
      </div>
    </div>
  `,
})
class UiTablePrimitiveHost {
  readonly resizeHandleUi = {
    root: 'w-hell-6',
    grip: 'bg-hell-danger',
  } satisfies HellTableResizeHandleUi;
}

describe('host-agnostic Hell table primitives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NativeTablePrimitiveHost,
        InferredRoleTablePrimitiveHost,
        ExplicitRoleTablePrimitiveHost,
        UiTablePrimitiveHost,
      ],
    }).compileComponents();
  });

  it('uses native table markup without adding redundant ARIA or row-as-button behavior', () => {
    const fixture = TestBed.createComponent(NativeTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    for (const id of [
      'native-root',
      'native-header',
      'native-body',
      'native-row',
      'native-header-cell',
      'native-cell',
    ]) {
      expect(byId(root, id).getAttribute('role'), id).toBeNull();
    }
    expect(byId(root, 'native-root').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-cell').getAttribute('role')).toBeNull();

    expect(byId(root, 'native-root').hasAttribute('tabindex')).toBe(false);
    expect(byId(root, 'native-root').hasAttribute('aria-activedescendant')).toBe(false);
    expect(byId(root, 'native-row').hasAttribute('tabindex')).toBe(false);
    expect(byId(root, 'native-row').hasAttribute('aria-selected')).toBe(false);
    expect(byId(root, 'native-row').hasAttribute('data-interactive')).toBe(false);

    expectPartAndData(byId(root, 'native-root'), 'hell-table', 'data-hell-table-root');
    expectPartAndData(byId(root, 'native-header'), 'hell-table-head', 'data-hell-table-header');
    expectPartAndData(byId(root, 'native-body'), 'hell-table-body', 'data-hell-table-body');
    expectPartAndData(byId(root, 'native-row'), 'hell-table-row', 'data-hell-table-row');
    expectPartAndData(
      byId(root, 'native-header-cell'),
      'hell-table-header-cell',
      'data-hell-table-header-cell',
    );
    expectPartAndData(byId(root, 'native-cell'), 'hell-table-cell', 'data-hell-table-cell');

    expect(byId(root, 'native-root').getAttribute('data-content-width')).toBe('true');
    expect(byId(root, 'native-row').getAttribute('data-active')).toBe('true');
    expect(byId(root, 'native-row').getAttribute('data-selected')).toBe('true');
    expect(byId(root, 'native-header-cell').getAttribute('aria-sort')).toBe('ascending');
    expect(byId(root, 'sort').getAttribute('type')).toBe('button');
    expect(byId(root, 'edit-row').getAttribute('type')).toBe('button');
    expect(byId(root, 'select-header').getAttribute('data-hell-table-selection-cell')).toBe('');
    expect(byId(root, 'select-header').classList.contains('hell-table-selection-cell')).toBe(false);
    expect(byId(root, 'select-row').getAttribute('data-hell-table-row-radio')).toBe('');
    expect(byId(root, 'select-row').classList.contains('hell-table-row-radio')).toBe(false);
    expect(byId(root, 'native-cell').getAttribute('data-align')).toBe('end');
    expect(byId(root, 'native-cell').getAttribute('data-space')).toBe('empty');
  });

  it('infers table roles on non-native hosts when no role is explicit', () => {
    const fixture = TestBed.createComponent(InferredRoleTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(byId(root, 'inferred-root').getAttribute('role')).toBe('table');
    expect(byId(root, 'inferred-header').getAttribute('role')).toBe('rowgroup');
    expect(byId(root, 'inferred-body').getAttribute('role')).toBe('rowgroup');
    expect(byId(root, 'inferred-header-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'inferred-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'inferred-header-cell').getAttribute('role')).toBe('columnheader');
    expect(byId(root, 'inferred-cell').getAttribute('role')).toBe('cell');
  });

  it('preserves explicit consumer roles on non-native markup', () => {
    const fixture = TestBed.createComponent(ExplicitRoleTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(byId(root, 'explicit-root').getAttribute('role')).toBe('grid');
    expect(byId(root, 'explicit-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'explicit-cell').getAttribute('role')).toBe('gridcell');
  });

  it('keeps data attributes and applies ui through root parts without legacy classes', () => {
    const fixture = TestBed.createComponent(UiTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expectPartAndData(byId(root, 'ui-root'), 'hell-table', 'data-hell-table-root');
    expectPartAndData(byId(root, 'ui-row'), 'hell-table-row', 'data-hell-table-row');
    expectPartAndData(byId(root, 'ui-cell'), 'hell-table-cell', 'data-hell-table-cell');
    expectPartAndData(
      byId(root, 'ui-action'),
      'hell-table-row-action',
      'data-hell-table-row-action',
    );
    expectPartAndData(
      byId(root, 'ui-checkbox'),
      'hell-table-row-checkbox',
      'data-hell-table-row-checkbox',
    );
    expectPartAndData(
      byId(root, 'ui-resizer'),
      'hell-table-resize-handle',
      'data-hell-table-resize-handle',
    );

    expect(byId(root, 'ui-root').className).toContain('bg-hell-surface-muted');
    expect(byId(root, 'ui-row').className).toContain('bg-hell-primary-soft');
    expect(byId(root, 'ui-cell').className).toContain('text-hell-danger');
    expect(byId(root, 'ui-cell').className).toContain('px-hell-7');
    expect(byId(root, 'ui-cell').getAttribute('data-hell-table-selection-cell')).toBe('');
    expect(byId(root, 'ui-action').className).toContain('text-hell-danger');
    expect(byId(root, 'ui-checkbox').className).toContain('border-hell-danger');
    expect(byId(root, 'ui-resizer').className).toContain('w-hell-6');
    expect(byId(root, 'ui-resizer').querySelector('[data-slot="grip"]')?.className).toContain(
      'bg-hell-danger',
    );
    expect(byId(root, 'ui-root').getAttribute('role')).toBe('table');
    expect(byId(root, 'ui-cell').getAttribute('role')).toBe('cell');
  });

  it('keeps role inference safe for SSR-like hosts with minimal DOM shape', () => {
    const nativeTable = { nodeName: 'table', getAttribute: () => null };
    const explicitRole = { nodeName: 'hell-table', getAttribute: () => 'grid' };
    const customElement = { nodeName: 'hell-table', getAttribute: () => null };

    expect(hellTableInferredRoleForHost(nativeTable, ['TABLE'], 'table')).toBeNull();
    expect(hellTableInferredRoleForHost(explicitRole, ['TABLE'], 'table')).toBeNull();
    expect(hellTableInferredRoleForHost(customElement, ['TABLE'], 'table')).toBe('table');
    expect(hellTableInferredRoleForHost(null, ['TABLE'], 'table')).toBeNull();
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function expectPartAndData(element: HTMLElement, className: string, dataAttribute: string): void {
  expect(element.classList.contains(className), `${element.id}.${className}`).toBe(false);
  expect(element.getAttribute('data-slot'), `${element.id}.data-slot`).toBe('root');
  expect(element.getAttribute(dataAttribute), `${element.id}.${dataAttribute}`).toBe('');
}
