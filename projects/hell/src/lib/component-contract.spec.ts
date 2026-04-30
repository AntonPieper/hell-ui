import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton } from './primitives/button/button';
import { HELL_CARD_DIRECTIVES } from './primitives/card/card';
import { HELL_FIELD_DIRECTIVES } from './primitives/field/field';
import { HellAvatar } from './primitives/avatar/avatar';
import { HellInput, HellNativeSelect, HellTextarea } from './primitives/input/input';
import { HellBadge, HellKbd, HellTag } from './primitives/tag/tag';
import { HELL_SELECT_DIRECTIVES } from './primitives/select/select';
import { HELL_APP_SHELL_DIRECTIVES } from './composites/app-shell/app-shell';
import { HELL_TABLE_DIRECTIVES } from './features/data-table/data-table';

interface ContractCase {
  readonly id: string;
  readonly className: string;
  readonly attrs?: Readonly<Record<string, string | null>>;
}

@Component({
  imports: [
    HellButton,
    HellAvatar,
    HellInput,
    HellNativeSelect,
    HellTextarea,
    HellTag,
    HellBadge,
    HellKbd,
    ...HELL_CARD_DIRECTIVES,
    ...HELL_FIELD_DIRECTIVES,
    ...HELL_SELECT_DIRECTIVES,
    ...HELL_APP_SHELL_DIRECTIVES,
    ...HELL_TABLE_DIRECTIVES,
  ],
  template: `
    <button id="styled-button" hellButton variant="primary" size="sm" iconOnly block type="button">
      Save
    </button>
    <button id="unstyled-button" hellButton unstyled variant="danger" size="lg" type="button">
      Delete
    </button>

    <input data-contract="input" hellInput size="sm" [invalid]="true" />
    <input data-contract="unstyled-input" hellInput unstyled size="lg" [invalid]="true" />
    <select data-contract="native-select" hellNativeSelect size="md" [invalid]="true">
      <option>Germany</option>
    </select>
    <textarea data-contract="textarea" hellTextarea size="md" [invalid]="true"></textarea>

    <hell-avatar id="avatar" fallback="AP" size="sm" shape="square" />

    <div id="card" hellCard [elevation]="2">
      <div id="card-header" hellCardHeader>Header</div>
      <div id="card-body" hellCardBody>Body</div>
      <div id="card-footer" hellCardFooter>Footer</div>
    </div>
    <div id="unstyled-card" hellCard unstyled [elevation]="3"></div>

    <span id="tag" hellTag variant="success">Ready</span>
    <span id="badge" hellBadge>3</span>
    <kbd id="kbd" hellKbd>K</kbd>

    <div id="field" hellField orientation="horizontal">
      <label data-contract="field-label" hellFieldLabel>Name</label>
      <div data-contract="field-description" hellFieldDescription>Human-readable name</div>
      <div data-contract="field-error" hellFieldError>Required</div>
    </div>

    <button data-contract="select" hellSelect type="button">
      <span hellSelectValue>Germany</span>
      <span hellSelectPlaceholder>Choose country</span>
    </button>

    <nav hellAppSidenav>
      <a id="nav-item" hellNavItem active href="#">
        <span hellNavItemIcon aria-hidden="true"></span>
        <span hellNavItemLabel>Dashboard</span>
        <span hellNavItemTrailing>3</span>
      </a>
      <a id="unstyled-nav-item" hellNavItem unstyled href="#">
        <span hellNavItemLabel unstyled>Raw</span>
      </a>
    </nav>

    <div id="table-container" hellTableContainer busy>
      <table id="table" hellTable contentWidth>
        <thead id="table-head" hellTableHead>
          <tr id="table-row" hellTableRow selected interactive>
            <th id="table-header-cell" hellTableHeaderCell sortable sort="asc">
              Name
              <button id="table-resizer" hellTableColumnResizer></button>
            </th>
            <td id="table-cell" hellTableCell align="end" space="empty">Ada</td>
          </tr>
        </thead>
        <tbody id="table-body" hellTableBody></tbody>
      </table>
    </div>
  `,
})
class ContractHost {}

const STYLEABLE_CASES: readonly ContractCase[] = [
  {
    id: 'styled-button',
    className: 'hell-button',
    attrs: {
      'data-variant': 'primary',
      'data-size': 'sm',
      'data-icon-only': '',
      'data-block': '',
    },
  },
  {
    id: 'input',
    className: 'hell-input',
    attrs: { 'data-size': 'sm', 'aria-invalid': 'true' },
  },
  {
    id: 'native-select',
    className: 'hell-native-select',
    attrs: { 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'textarea',
    className: 'hell-textarea',
    attrs: { 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'avatar',
    className: 'hell-avatar',
    attrs: { 'data-size': 'sm', 'data-shape': 'square' },
  },
  { id: 'card', className: 'hell-card', attrs: { 'data-elevation': '2' } },
  { id: 'card-header', className: 'hell-card-header' },
  { id: 'card-body', className: 'hell-card-body' },
  { id: 'card-footer', className: 'hell-card-footer' },
  { id: 'tag', className: 'hell-tag', attrs: { 'data-variant': 'success' } },
  { id: 'badge', className: 'hell-badge' },
  { id: 'kbd', className: 'hell-kbd' },
  { id: 'field', className: 'hell-field', attrs: { 'data-orientation': 'horizontal' } },
  { id: 'field-label', className: 'hell-field-label' },
  { id: 'field-description', className: 'hell-field-description' },
  { id: 'field-error', className: 'hell-field-error' },
  { id: 'select', className: 'hell-select' },
  { id: 'nav-item', className: 'hell-nav-item', attrs: { 'data-slot': 'nav-item' } },
  { id: 'table-container', className: 'hell-table-container', attrs: { 'aria-busy': 'true' } },
  { id: 'table', className: 'hell-table', attrs: { 'data-content-width': 'true' } },
  { id: 'table-head', className: 'hell-table-head' },
  {
    id: 'table-row',
    className: 'hell-table-row',
    attrs: { 'data-selected': 'true', 'aria-selected': 'true', tabindex: '0' },
  },
  {
    id: 'table-header-cell',
    className: 'hell-table-header-cell',
    attrs: { 'data-sort': 'asc', 'aria-sort': 'ascending', 'data-sortable': 'true' },
  },
  {
    id: 'table-cell',
    className: 'hell-table-cell',
    attrs: { 'data-align': 'end', 'data-space': 'empty' },
  },
  { id: 'table-resizer', className: 'hell-table-column-resizer', attrs: { role: 'separator' } },
];

const STYLE_OPT_OUT_CASES: readonly ContractCase[] = [
  {
    id: 'unstyled-button',
    className: 'hell-button',
    attrs: { 'data-variant': 'danger', 'data-size': 'lg' },
  },
  {
    id: 'unstyled-input',
    className: 'hell-input',
    attrs: { 'data-size': 'lg', 'aria-invalid': 'true' },
  },
  { id: 'unstyled-card', className: 'hell-card', attrs: { 'data-elevation': '3' } },
  { id: 'unstyled-nav-item', className: 'hell-nav-item' },
];

describe('Hell Component Contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractHost],
    }).compileComponents();
  });

  it('exposes public classes, state attributes and slot attributes through one table', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    for (const contract of STYLEABLE_CASES) assertContract(fixture.nativeElement, contract, true);
  });

  it('keeps state attributes while Style Opt-Out removes default classes', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    for (const contract of STYLE_OPT_OUT_CASES)
      assertContract(fixture.nativeElement, contract, false);
  });

  it('exposes primitive parts through host classes without owning caller markup', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.hell-select') as HTMLButtonElement;
    const value = select.querySelector('.hell-select-value') as HTMLElement;
    const placeholder = select.querySelector('.hell-select-placeholder') as HTMLElement;

    expect(select.classList.contains('hell-select')).toBe(true);
    expect(value.classList.contains('hell-select-value')).toBe(true);
    expect(placeholder.classList.contains('hell-select-placeholder')).toBe(true);
  });

  it('exposes app shell nav as explicit parts instead of raw descendant styling', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('#nav-item') as HTMLAnchorElement;
    const icon = item.querySelector('[hellNavItemIcon]') as HTMLElement;
    const label = item.querySelector('[hellNavItemLabel]') as HTMLElement;
    const trailing = item.querySelector('[hellNavItemTrailing]') as HTMLElement;
    const unstyled = fixture.nativeElement.querySelector('#unstyled-nav-item') as HTMLAnchorElement;

    expect(item.classList.contains('hell-nav-item')).toBe(true);
    expect(item.getAttribute('data-slot')).toBe('nav-item');
    expect(item.getAttribute('data-active')).toBe('true');
    expect(icon.classList.contains('hell-nav-icon')).toBe(true);
    expect(icon.getAttribute('data-slot')).toBe('nav-icon');
    expect(label.classList.contains('hell-nav-label')).toBe(true);
    expect(label.getAttribute('data-slot')).toBe('nav-label');
    expect(trailing.classList.contains('hell-nav-trailing')).toBe(true);
    expect(trailing.getAttribute('data-slot')).toBe('nav-trailing');
    expect(unstyled.classList.contains('hell-nav-item')).toBe(false);
  });
});

function assertContract(root: HTMLElement, contract: ContractCase, styled: boolean): void {
  const element =
    root.querySelector(`[data-contract="${contract.id}"]`) ?? root.querySelector(`#${contract.id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${contract.id}.`);

  expect(element.classList.contains(contract.className)).toBe(styled);
  for (const [name, value] of Object.entries(contract.attrs ?? {})) {
    expect(element.getAttribute(name), `${contract.id}.${name}`).toBe(value);
  }
}
