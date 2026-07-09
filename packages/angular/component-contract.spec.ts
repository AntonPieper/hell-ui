import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_CARD_DIRECTIVES,
  type HellCardBodyUi,
  type HellCardFooterUi,
  type HellCardHeaderUi,
  type HellCardUi,
} from '@hell-ui/angular/card';
import {
  HELL_FIELD_DIRECTIVES,
  type HellFieldDescriptionUi,
  type HellFieldErrorUi,
  type HellFieldLabelUi,
  type HellFieldUi,
} from '@hell-ui/angular/field';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellInput, HellNativeSelect, HellTextarea } from '@hell-ui/angular/input';
import { HellBadge, HellKbd, HellTag } from '@hell-ui/angular/tag';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';

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
 * every exported styled Module so a new public Module cannot skip contract review.
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
  { symbol: 'HellNativeCheckbox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellCombobox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellComboboxBasic', area: 'primitive', coverage: 'static' },
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
  { symbol: 'HellMenuItemCheckbox', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemIcon', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemIndicator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemRadio', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuItemTrailing', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuLabel', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuSection', area: 'primitive', coverage: 'static' },
  { symbol: 'HellMenuSeparator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellNativeSelect', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPagination', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationButton', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationFirst', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationLast', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationNext', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationPrev', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPaginationStrip', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellPopover', area: 'primitive', coverage: 'static' },
  { symbol: 'HellProgress', area: 'primitive', coverage: 'static' },
  { symbol: 'HellProgressBar', area: 'primitive', coverage: 'static' },
  { symbol: 'HellRadio', area: 'primitive', coverage: 'static' },
  { symbol: 'HellNativeRadio', area: 'primitive', coverage: 'static' },
  { symbol: 'HellNativeRadioGroup', area: 'primitive', coverage: 'static' },
  { symbol: 'HellRadioGroup', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSearch', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSearchClear', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelect', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSelectBasic', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelectDropdown', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelectOption', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSelectPlaceholder', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSelectValue', area: 'primitive', coverage: 'dom' },
  { symbol: 'HellSeparator', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSkeleton', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSlider', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSpinner', area: 'primitive', coverage: 'static' },
  { symbol: 'HellSubmenuTrigger', area: 'primitive', coverage: 'static' },
  { symbol: 'HellNativeSwitch', area: 'primitive', coverage: 'static' },
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
  { symbol: 'HellSecondaryToggle', area: 'composite', coverage: 'static' },
  { symbol: 'HellSidenavToggle', area: 'composite', coverage: 'static' },
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
  { symbol: 'HellResizable', area: 'composite', coverage: 'dom' },
  { symbol: 'HellResizableHandle', area: 'composite', coverage: 'dom' },
  { symbol: 'HellResizablePane', area: 'composite', coverage: 'dom' },
  { symbol: 'HellSplitView', area: 'composite', coverage: 'dom' },
  { symbol: 'HellTimeInput', area: 'composite', coverage: 'static' },
  { symbol: 'HellToaster', area: 'composite', coverage: 'static' },
  { symbol: 'HellCodeEditor', area: 'feature', coverage: 'static' },
  { symbol: 'HellPdfViewer', area: 'feature', coverage: 'static' },
  { symbol: 'HellTable', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableBody', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableCell', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableResizeHandle', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableContainer', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableHead', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableHeaderCell', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableRow', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableRowAction', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableRowCheckbox', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableRowRadio', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableSelectionCell', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTableSortTrigger', area: 'feature', coverage: 'dom' },
  { symbol: 'HellTanStackPagination', area: 'feature', coverage: 'static' },
  { symbol: 'HellTanStackTable', area: 'feature', coverage: 'static' },
];

const PUBLIC_COMPONENT_CONTRACT_SYMBOLS = new Set(
  PUBLIC_COMPONENT_CONTRACT_MODULES.map((entry) => entry.symbol),
);

@Component({
  imports: [
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
  ],
  template: `
    <input data-contract="input" hellInput size="sm" [invalid]="true" />
    <select data-contract="native-select" hellNativeSelect size="md" [invalid]="true">
      <option>Germany</option>
    </select>
    <textarea data-contract="textarea" hellTextarea size="md" [invalid]="true"></textarea>

    <hell-avatar id="avatar" fallback="AP" size="sm" shape="square" />

    <div id="card" hellCard [elevation]="2" [ui]="cardUi">
      <div id="card-header" hellCardHeader [ui]="cardHeaderUi">Header</div>
      <div id="card-body" hellCardBody [ui]="cardBodyUi">Body</div>
      <div id="card-footer" hellCardFooter [ui]="cardFooterUi">Footer</div>
    </div>

    <span id="tag" hellTag variant="success">Ready</span>
    <span id="badge" hellBadge>3</span>
    <kbd id="kbd" hellKbd>K</kbd>

    <div id="field" hellField orientation="horizontal" [ui]="fieldUi">
      <label data-contract="field-label" hellFieldLabel for="field-control" [ui]="fieldLabelUi">
        Name
      </label>
      <input id="field-control" />
      <div data-contract="field-description" hellFieldDescription [ui]="fieldDescriptionUi">
        Human-readable name
      </div>
      <div data-contract="field-error" hellFieldError [ui]="fieldErrorUi">Required</div>
    </div>

    <button data-contract="select" hellSelect type="button">
      <span hellSelectValue>Germany</span>
      <span hellSelectPlaceholder>Choose country</span>
    </button>
  `,
})
class ContractHost {
  readonly cardUi = {
    root: 'rounded-hell-pill shadow-hell-lg',
  } satisfies HellCardUi;

  readonly cardHeaderUi = {
    root: 'px-hell-2',
  } satisfies HellCardHeaderUi;

  readonly cardBodyUi = {
    root: 'p-hell-2',
  } satisfies HellCardBodyUi;

  readonly cardFooterUi = {
    root: 'justify-start',
  } satisfies HellCardFooterUi;

  readonly fieldUi = {
    root: 'gap-hell-6',
  } satisfies HellFieldUi;

  readonly fieldLabelUi = {
    root: 'text-sm',
  } satisfies HellFieldLabelUi;

  readonly fieldDescriptionUi = {
    root: 'text-hell-danger',
  } satisfies HellFieldDescriptionUi;

  readonly fieldErrorUi = {
    root: 'text-hell-foreground',
  } satisfies HellFieldErrorUi;
}

const STYLEABLE_CASES: readonly ContractCase[] = [
  {
    id: 'input',
    module: 'HellInput',
    className: 'inline-flex',
    attrs: { 'data-slot': 'root', 'data-size': 'sm', 'aria-invalid': 'true' },
  },
  {
    id: 'native-select',
    module: 'HellNativeSelect',
    className: 'appearance-none',
    attrs: { 'data-slot': 'root', 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'textarea',
    module: 'HellTextarea',
    className: 'resize-y',
    attrs: { 'data-slot': 'root', 'data-size': 'md', 'aria-invalid': 'true' },
  },
  {
    id: 'avatar',
    module: 'HellAvatar',
    className: 'inline-flex',
    attrs: { 'data-slot': 'root', 'data-size': 'sm', 'data-shape': 'square' },
  },
  {
    id: 'card',
    module: 'HellCard',
    className: 'flex',
    attrs: { 'data-slot': 'root', 'data-elevation': '2' },
  },
  {
    id: 'card-header',
    module: 'HellCardHeader',
    className: 'items-center',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'card-body',
    module: 'HellCardBody',
    className: 'flex-auto',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'card-footer',
    module: 'HellCardFooter',
    className: 'justify-start',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'tag',
    module: 'HellTag',
    className: 'inline-flex',
    attrs: { 'data-slot': 'root', 'data-variant': 'success' },
  },
  {
    id: 'badge',
    module: 'HellBadge',
    className: 'min-w-hell-4',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'kbd',
    module: 'HellKbd',
    className: 'font-mono',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'field',
    module: 'HellField',
    className: 'gap-hell-6',
    attrs: { 'data-slot': 'root', 'data-orientation': 'horizontal' },
  },
  {
    id: 'field-label',
    module: 'HellFieldLabel',
    className: 'text-sm',
    attrs: { 'data-slot': 'root' },
  },
  {
    id: 'field-description',
    module: 'HellFieldDescription',
    className: 'text-hell-danger',
    attrs: { 'data-slot': 'root', 'data-orientation': 'horizontal' },
  },
  {
    id: 'field-error',
    module: 'HellFieldError',
    className: 'text-hell-foreground',
    attrs: { 'data-slot': 'root', 'data-orientation': 'horizontal' },
  },
  {
    id: 'select',
    module: 'HellSelect',
    className: 'inline-flex',
    attrs: { 'data-slot': 'root' },
  },
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

    for (const contract of STYLEABLE_CASES) assertContract(fixture.nativeElement, contract);
  });

  it('exposes primitive parts through host classes without owning caller markup', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('[hellSelect]') as HTMLButtonElement;
    const value = select.querySelector('[hellSelectValue]') as HTMLElement;
    const placeholder = select.querySelector('[hellSelectPlaceholder]') as HTMLElement;

    expect(select.getAttribute('data-slot')).toBe('root');
    expect(select.className).toContain('inline-flex');
    expect(value.getAttribute('data-slot')).toBe('root');
    expect(value.className).toContain('text-ellipsis');
    expect(placeholder.getAttribute('data-slot')).toBe('root');
    expect(placeholder.className).toContain('text-hell-foreground-muted');
  });
});

function assertContract(root: HTMLElement, contract: ContractCase): void {
  expect(
    PUBLIC_COMPONENT_CONTRACT_SYMBOLS.has(contract.module),
    `${contract.module} must be declared in PUBLIC_COMPONENT_CONTRACT_MODULES`,
  ).toBe(true);

  const element =
    root.querySelector(`[data-contract="${contract.id}"]`) ?? root.querySelector(`#${contract.id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${contract.id}.`);

  expect(element.classList.contains(contract.className), `${contract.id}.${contract.className}`).toBe(
    true,
  );
  for (const [name, value] of Object.entries(contract.attrs ?? {})) {
    expect(element.getAttribute(name), `${contract.id}.${name}`).toBe(value);
  }
}
