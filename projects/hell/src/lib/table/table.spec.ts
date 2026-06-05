import { CdkTableModule } from '@angular/cdk/table';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { hellTableInferredRoleForHost } from '../features/table-utilities/table-role-inference';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from './table';

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <table id="native-root" hellTableRoot contentWidth>
      <thead id="native-header" hellTableHeader>
        <tr id="native-header-row" hellTableRow>
          <th id="native-header-cell" hellTableHeaderCell columnId="name">Name</th>
        </tr>
      </thead>
      <tbody id="native-body" hellTableBody>
        <tr id="native-row" hellTableRow active selected>
          <td id="native-cell" hellTableCell align="end" space="empty">Ada</td>
        </tr>
      </tbody>
    </table>
  `,
})
class NativeTablePrimitiveHost {}

@Component({
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
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="explicit-root" hellTableRoot role="grid">
      <div id="explicit-header" hellTableHeader role="presentation">
        <div id="explicit-header-row" hellTableRow role="row">
          <div id="explicit-header-cell" hellTableHeaderCell role="columnheader">Name</div>
        </div>
      </div>
      <div id="explicit-body" hellTableBody role="rowgroup">
        <div id="explicit-row" hellTableRow role="row">
          <div id="explicit-cell" hellTableCell role="gridcell">Ada</div>
        </div>
      </div>
    </div>
  `,
})
class ExplicitRoleTablePrimitiveHost {}

@Component({
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div id="unstyled-root" hellTableRoot unstyled>
      <div id="unstyled-header" hellTableHeader unstyled>
        <div id="unstyled-header-row" hellTableRow unstyled>
          <div id="unstyled-header-cell" hellTableHeaderCell unstyled>Name</div>
        </div>
      </div>
      <div id="unstyled-body" hellTableBody unstyled>
        <div id="unstyled-row" hellTableRow unstyled>
          <div id="unstyled-cell" hellTableCell unstyled>Ada</div>
        </div>
      </div>
    </div>
  `,
})
class UnstyledTablePrimitiveHost {}

@Component({
  imports: [CdkTableModule, ...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <cdk-table id="cdk-root" hellTableRoot [dataSource]="rows">
      <ng-container cdkColumnDef="name">
        <cdk-header-cell id="cdk-header-cell" *cdkHeaderCellDef hellTableHeaderCell columnId="name">
          Name
        </cdk-header-cell>
        <cdk-cell id="cdk-cell" *cdkCellDef="let row" hellTableCell>{{ $any(row).name }}</cdk-cell>
      </ng-container>

      <cdk-header-row id="cdk-header-row" *cdkHeaderRowDef="columns" hellTableRow />
      <cdk-row id="cdk-row" *cdkRowDef="let row; columns: columns" hellTableRow />
    </cdk-table>
  `,
})
class CdkTablePrimitiveHost {
  readonly columns = ['name'];
  readonly rows = [{ name: 'Ada' }];
}

describe('host-agnostic Hell table primitives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NativeTablePrimitiveHost,
        InferredRoleTablePrimitiveHost,
        ExplicitRoleTablePrimitiveHost,
        UnstyledTablePrimitiveHost,
        CdkTablePrimitiveHost,
      ],
    }).compileComponents();
  });

  it('uses modern selectors on native table markup without adding redundant ARIA roles', () => {
    const fixture = TestBed.createComponent(NativeTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(byId(root, 'native-root').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-header').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-body').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-row').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-header-cell').getAttribute('role')).toBeNull();
    expect(byId(root, 'native-cell').getAttribute('role')).toBeNull();

    expectClassAndData(byId(root, 'native-root'), 'hell-table', 'data-hell-table-root');
    expectClassAndData(byId(root, 'native-header'), 'hell-table-head', 'data-hell-table-header');
    expectClassAndData(byId(root, 'native-body'), 'hell-table-body', 'data-hell-table-body');
    expectClassAndData(byId(root, 'native-row'), 'hell-table-row', 'data-hell-table-row');
    expectClassAndData(
      byId(root, 'native-header-cell'),
      'hell-table-header-cell',
      'data-hell-table-header-cell',
    );
    expectClassAndData(byId(root, 'native-cell'), 'hell-table-cell', 'data-hell-table-cell');
    expect(byId(root, 'native-root').getAttribute('data-content-width')).toBe('true');
    expect(byId(root, 'native-row').getAttribute('data-active')).toBe('true');
    expect(byId(root, 'native-row').getAttribute('data-selected')).toBe('true');
    expect(byId(root, 'native-row').hasAttribute('data-interactive')).toBe(false);
    expect(byId(root, 'native-row').hasAttribute('tabindex')).toBe(false);
    expect(byId(root, 'native-row').hasAttribute('aria-selected')).toBe(false);
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

  it('preserves explicit consumer roles on non-native role markup', () => {
    const fixture = TestBed.createComponent(ExplicitRoleTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(byId(root, 'explicit-root').getAttribute('role')).toBe('grid');
    expect(byId(root, 'explicit-header').getAttribute('role')).toBe('presentation');
    expect(byId(root, 'explicit-header-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'explicit-header-cell').getAttribute('role')).toBe('columnheader');
    expect(byId(root, 'explicit-body').getAttribute('role')).toBe('rowgroup');
    expect(byId(root, 'explicit-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'explicit-cell').getAttribute('role')).toBe('gridcell');
  });

  it('keeps roles and data attributes in unstyled mode without Hell classes', () => {
    const fixture = TestBed.createComponent(UnstyledTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expectUnstyledPrimitive(byId(root, 'unstyled-root'), 'hell-table', 'data-hell-table-root');
    expectUnstyledPrimitive(byId(root, 'unstyled-header'), 'hell-table-head', 'data-hell-table-header');
    expectUnstyledPrimitive(byId(root, 'unstyled-body'), 'hell-table-body', 'data-hell-table-body');
    expectUnstyledPrimitive(byId(root, 'unstyled-row'), 'hell-table-row', 'data-hell-table-row');
    expectUnstyledPrimitive(
      byId(root, 'unstyled-header-cell'),
      'hell-table-header-cell',
      'data-hell-table-header-cell',
    );
    expectUnstyledPrimitive(byId(root, 'unstyled-cell'), 'hell-table-cell', 'data-hell-table-cell');
    expect(byId(root, 'unstyled-root').getAttribute('role')).toBe('table');
    expect(byId(root, 'unstyled-cell').getAttribute('role')).toBe('cell');
  });

  it('coexists with CDK table hosts without overriding CDK roles', () => {
    const fixture = TestBed.createComponent(CdkTablePrimitiveHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expectClassAndData(byId(root, 'cdk-root'), 'hell-table', 'data-hell-table-root');
    expectClassAndData(byId(root, 'cdk-header-row'), 'hell-table-row', 'data-hell-table-row');
    expectClassAndData(byId(root, 'cdk-row'), 'hell-table-row', 'data-hell-table-row');
    expectClassAndData(
      byId(root, 'cdk-header-cell'),
      'hell-table-header-cell',
      'data-hell-table-header-cell',
    );
    expectClassAndData(byId(root, 'cdk-cell'), 'hell-table-cell', 'data-hell-table-cell');

    expect(byId(root, 'cdk-root').getAttribute('role')).toBe('table');
    expect(byId(root, 'cdk-header-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'cdk-row').getAttribute('role')).toBe('row');
    expect(byId(root, 'cdk-header-cell').getAttribute('role')).toBe('columnheader');
    expect(byId(root, 'cdk-cell').getAttribute('role')).toBe('cell');
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

function expectClassAndData(element: HTMLElement, className: string, dataAttribute: string): void {
  expect(element.classList.contains(className), `${element.id}.${className}`).toBe(true);
  expect(element.getAttribute(dataAttribute), `${element.id}.${dataAttribute}`).toBe('');
}

function expectUnstyledPrimitive(
  element: HTMLElement,
  className: string,
  dataAttribute: string,
): void {
  expect(element.classList.contains(className), `${element.id}.${className}`).toBe(false);
  expect(element.getAttribute(dataAttribute), `${element.id}.${dataAttribute}`).toBe('');
}
