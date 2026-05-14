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
import { HELL_TABLE_UTILITIES_DIRECTIVES } from './features/table-utilities/table-utilities';

interface ContractCase {
  readonly id: string;
  readonly module: string;
  readonly className: string;
  readonly attrs?: Readonly<Record<string, string | null>>;
}

type ComponentContractArea = 'primitive' | 'composite' | 'feature';
type ComponentContractCoverage = 'dom' | 'static';

interface PublicComponentContractModule {
  readonly symbol: string;
  readonly area: ComponentContractArea;
  /** `dom` means this shared spec renders at least one Interface assertion today. */
  readonly coverage: ComponentContractCoverage;
}

/**
 * Public Component Contract manifest. `tools/check-architecture.mjs` compares this list against
 * every exported `HellStyleable` Module so a new public Module cannot skip contract review.
 */
const PUBLIC_COMPONENT_CONTRACT_MODULES: readonly PublicComponentContractModule[] = [
  { symbol: 'HellAccordion', area: 'primitive', coverage: 'static' },
  { symbol: 'HellAccordionContent', area: 'primitive', coverage: 'static' },
  { symbol: 'HellAccordionItem', area: 'primitive', coverage: 'static' },
  { symbol: 'HellAccordionTrigger', area: 'primitive', coverage: 'static' },
  { symbol: 'HellAvatar', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellBadge', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellBreadcrumbEllipsis', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbItem', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbLink', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbList', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbPage', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbSeparator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellBreadcrumbs', area: 'primitive', coverage: 'static' },
  { symbol: 'HellButton', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellCard', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellCardBody', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellCardFooter', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellCardHeader', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellCheckbox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellCombobox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxButton', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxDropdown', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxEmpty', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxInput', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxOption', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDatePicker', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDateRangePicker', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDialog', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDialogDescription', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDialogOverlay', area: 'primitive', coverage: 'static' },
  { symbol: 'HellDialogTitle', area: 'primitive', coverage: 'static' },
  { symbol: 'HellField', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellFieldDescription', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellFieldError', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellFieldLabel', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellFlyout', area: 'primitive', coverage: 'static' },
  { symbol: 'HellIcon', area: 'primitive', coverage: 'static' },
  { symbol: 'HellInput', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellKbd', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellListbox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellListboxHeader', area: 'primitive', coverage: 'static' },
  { symbol: 'HellListboxOption', area: 'primitive', coverage: 'static' },
  { symbol: 'HellListboxSection', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenu', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItem', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemIcon', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemTrailing', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuLabel', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuSection', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuSeparator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellNativeSelect', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPagination', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationButton', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationFirst', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationLast', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationNext', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationPrev', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPaginationStrip', area: 'primitive', coverage: 'static' },
  { symbol: 'HellPopover', area: 'primitive', coverage: 'static' },
  { symbol: 'HellProgress', area: 'primitive', coverage: 'static' },
  { symbol: 'HellProgressBar', area: 'primitive', coverage: 'static' },
  { symbol: 'HellRadio', area: 'primitive', coverage: 'static' },
  { symbol: 'HellRadioGroup', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSearch', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSearchClear', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelect', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSelectDropdown', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelectOption', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelectPlaceholder', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSelectValue', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSeparator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSkeleton', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSlider', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSpinner', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSubmenuTrigger', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSwitch', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTab', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTabList', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTabPanel', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTabset', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTag', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellTextarea', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellToggle', area: 'primitive', coverage: 'static' },
  { symbol: 'HellToggleGroup', area: 'primitive', coverage: 'static' },
  { symbol: 'HellToggleGroupItem', area: 'primitive', coverage: 'static' },
  { symbol: 'HellTooltip', area: 'primitive', coverage: 'static' },
  { symbol: 'HellAppContent', area: 'composite', coverage: 'static' },
  { symbol: 'HellAppSecondary', area: 'composite', coverage: 'static' },
  { symbol: 'HellAppSecondaryBody', area: 'composite', coverage: 'static' },
  { symbol: 'HellAppShell', area: 'composite', coverage: 'static' },
  { symbol: 'HellAppSidenav', area: 'composite', coverage: 'static' },
  { symbol: 'HellAppTopbar', area: 'composite', coverage: 'static' },
  { symbol: 'HellAudioPlayer', area: 'composite', coverage: 'static' },
  { symbol: 'HellAvatarGroup', area: 'composite', coverage: 'static' },
  { symbol: 'HellAvatarGroupItem', area: 'composite', coverage: 'static' },
  { symbol: 'HellAvatarGroupOverflow', area: 'composite', coverage: 'static' },
  { symbol: 'HellDateInput', area: 'composite', coverage: 'static' },
  { symbol: 'HellDialpad', area: 'composite', coverage: 'static' },
  { symbol: 'HellDropZone', area: 'composite', coverage: 'static' },
  { symbol: 'HellNavItem', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavItemIcon', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavItemLabel', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavItemTrailing', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavSection', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavSectionItems', area: 'composite', coverage: 'dom' },
  { symbol: 'HellNavSectionToggle', area: 'composite', coverage: 'dom' },
  { symbol: 'HellOmnibar', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarAction', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarActionsStrip', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarChip', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarChipRemove', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarGroup', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarGroupLabel', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarItem', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarItemIcon', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarItemSubtext', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarItemText', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarItemTrailing', area: 'composite', coverage: 'static' },
  { symbol: 'HellOmnibarPanel', area: 'composite', coverage: 'static' },
  { symbol: 'HellResizable', area: 'composite', coverage: 'static' },
  { symbol: 'HellResizableHandle', area: 'composite', coverage: 'static' },
  { symbol: 'HellResizablePane', area: 'composite', coverage: 'static' },
  { symbol: 'HellSplitView', area: 'composite', coverage: 'static' },
  { symbol: 'HellTimeInput', area: 'composite', coverage: 'static' },
  { symbol: 'HellToaster', area: 'composite', coverage: 'static' },
  { symbol: 'HellCodeEditor', area: 'feature', coverage: 'static' },
  { symbol: 'HellPdfViewer', area: 'feature', coverage: 'static' },
  { symbol: 'HellTable', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableBody', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableCell', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableColumnResizer', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableContainer', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableHead', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableHeaderCell', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableRow', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableSortButton', area: 'feature', coverage: 'dom' },
];

const PUBLIC_COMPONENT_CONTRACT_SYMBOLS = new Set(
  PUBLIC_COMPONENT_CONTRACT_MODULES.map((entry) => entry.symbol),
);

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
    ...HELL_TABLE_UTILITIES_DIRECTIVES,
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
      <label data-contract="field-label" hellFieldLabel for="field-control">Name</label>
      <input id="field-control" />
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
      <div id="nav-section" hellNavSection>
        <button id="nav-section-toggle" hellNavSectionToggle type="button">Settings</button>
        <div id="nav-section-items" hellNavSectionItems>
          <a hellNavItem href="#">Preferences</a>
        </div>
      </div>
    </nav>

    <div id="table-container" hellTableContainer busy>
      <table id="table" hellTable contentWidth>
        <thead id="table-head" hellTableHead>
          <tr id="table-row" hellTableRow selected interactive>
            <th id="table-header-cell" hellTableHeaderCell sortable sort="asc">
              <button id="table-sort-button" hellTableSortButton type="button">Name</button>
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
    module: 'HellButton',
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
    module: 'HellInput',
    className: 'hell-input',
    attrs: { 'data-size': 'sm', 'aria-invalid': 'true' },
  },
  {
    id: 'native-select',
    module: 'HellNativeSelect',
    className: 'hell-native-select',
    attrs: { 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'textarea',
    module: 'HellTextarea',
    className: 'hell-textarea',
    attrs: { 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'avatar',
    module: 'HellAvatar',
    className: 'hell-avatar',
    attrs: { 'data-size': 'sm', 'data-shape': 'square' },
  },
  { id: 'card', module: 'HellCard', className: 'hell-card', attrs: { 'data-elevation': '2' } },
  { id: 'card-header', module: 'HellCardHeader', className: 'hell-card-header' },
  { id: 'card-body', module: 'HellCardBody', className: 'hell-card-body' },
  { id: 'card-footer', module: 'HellCardFooter', className: 'hell-card-footer' },
  { id: 'tag', module: 'HellTag', className: 'hell-tag', attrs: { 'data-variant': 'success' } },
  { id: 'badge', module: 'HellBadge', className: 'hell-badge' },
  { id: 'kbd', module: 'HellKbd', className: 'hell-kbd' },
  {
    id: 'field',
    module: 'HellField',
    className: 'hell-field',
    attrs: { 'data-orientation': 'horizontal' },
  },
  { id: 'field-label', module: 'HellFieldLabel', className: 'hell-field-label' },
  {
    id: 'field-description',
    module: 'HellFieldDescription',
    className: 'hell-field-description',
  },
  { id: 'field-error', module: 'HellFieldError', className: 'hell-field-error' },
  { id: 'select', module: 'HellSelect', className: 'hell-select' },
  {
    id: 'nav-item',
    module: 'HellNavItem',
    className: 'hell-nav-item',
    attrs: { 'data-slot': 'nav-item' },
  },
  {
    id: 'nav-section',
    module: 'HellNavSection',
    className: 'hell-nav-section',
    attrs: { 'data-slot': 'nav-section' },
  },
  {
    id: 'nav-section-toggle',
    module: 'HellNavSectionToggle',
    className: 'hell-nav-section-toggle',
    attrs: { 'data-slot': 'nav-section-toggle', 'aria-expanded': 'true' },
  },
  {
    id: 'nav-section-items',
    module: 'HellNavSectionItems',
    className: 'hell-nav-section-items',
    attrs: { 'data-slot': 'nav-section-items' },
  },
  {
    id: 'table-container',
    module: 'HellTableContainer',
    className: 'hell-table-container',
    attrs: { 'aria-busy': 'true' },
  },
  {
    id: 'table',
    module: 'HellTable',
    className: 'hell-table',
    attrs: { 'data-content-width': 'true' },
  },
  { id: 'table-head', module: 'HellTableHead', className: 'hell-table-head' },
  { id: 'table-body', module: 'HellTableBody', className: 'hell-table-body' },
  {
    id: 'table-row',
    module: 'HellTableRow',
    className: 'hell-table-row',
    attrs: { 'data-selected': 'true', 'aria-selected': 'true', tabindex: '0' },
  },
  {
    id: 'table-header-cell',
    module: 'HellTableHeaderCell',
    className: 'hell-table-header-cell',
    attrs: { 'data-sort': 'asc', 'aria-sort': 'ascending', 'data-sortable': 'true' },
  },
  {
    id: 'table-sort-button',
    module: 'HellTableSortButton',
    className: 'hell-table-sort-button',
    attrs: { type: 'button' },
  },
  {
    id: 'table-cell',
    module: 'HellTableCell',
    className: 'hell-table-cell',
    attrs: { 'data-align': 'end', 'data-space': 'empty' },
  },
  {
    id: 'table-resizer',
    module: 'HellTableColumnResizer',
    className: 'hell-table-column-resizer',
    attrs: { role: 'separator' },
  },
];

const STYLE_OPT_OUT_CASES: readonly ContractCase[] = [
  {
    id: 'unstyled-button',
    module: 'HellButton',
    className: 'hell-button',
    attrs: { 'data-variant': 'danger', 'data-size': 'lg' },
  },
  {
    id: 'unstyled-input',
    module: 'HellInput',
    className: 'hell-input',
    attrs: { 'data-size': 'lg', 'aria-invalid': 'true' },
  },
  {
    id: 'unstyled-card',
    module: 'HellCard',
    className: 'hell-card',
    attrs: { 'data-elevation': '3' },
  },
  { id: 'unstyled-nav-item', module: 'HellNavItem', className: 'hell-nav-item' },
];

describe('Hell Component Contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractHost],
    }).compileComponents();
  });

  it('declares public contract modules once in the shared manifest', () => {
    expect(PUBLIC_COMPONENT_CONTRACT_MODULES.length).toBe(PUBLIC_COMPONENT_CONTRACT_SYMBOLS.size);
    expect(PUBLIC_COMPONENT_CONTRACT_SYMBOLS.has('HellButton')).toBe(true);
    expect(PUBLIC_COMPONENT_CONTRACT_SYMBOLS.has('HellToaster')).toBe(true);
    expect(PUBLIC_COMPONENT_CONTRACT_SYMBOLS.has('HellPdfViewer')).toBe(true);
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
  expect(
    PUBLIC_COMPONENT_CONTRACT_SYMBOLS.has(contract.module),
    `${contract.module} must be declared in PUBLIC_COMPONENT_CONTRACT_MODULES`,
  ).toBe(true);

  const element =
    root.querySelector(`[data-contract="${contract.id}"]`) ?? root.querySelector(`#${contract.id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${contract.id}.`);

  expect(element.classList.contains(contract.className)).toBe(styled);
  for (const [name, value] of Object.entries(contract.attrs ?? {})) {
    expect(element.getAttribute(name), `${contract.id}.${name}`).toBe(value);
  }
}
