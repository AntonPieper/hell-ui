import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton, type HellButtonUi } from '@hell-ui/angular/button';
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
import { HELL_PAGINATION_DIRECTIVES, type HellPaginationStripUi } from '@hell-ui/angular/pagination';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import {
  HELL_TABLE_UTILITIES_DIRECTIVES,
  type HellTableResizeHandleUi,
  type HellTableUi,
} from '@hell-ui/angular/table';
import {
  HELL_RESIZABLE_DIRECTIVES,
  type HellResizableHandleUi,
  type HellResizablePaneUi,
} from '@hell-ui/angular/resizable';
import { HELL_SPLIT_VIEW_DIRECTIVES, type HellSplitViewUi } from '@hell-ui/angular/split-view';

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
    ...HELL_PAGINATION_DIRECTIVES,
    ...HELL_APP_SHELL_DIRECTIVES,
    ...HELL_RESIZABLE_DIRECTIVES,
    ...HELL_SPLIT_VIEW_DIRECTIVES,
    ...HELL_TABLE_UTILITIES_DIRECTIVES,
  ],
  template: `
    <button id="styled-button" hellButton variant="primary" size="sm" iconOnly block type="button">
      Save
    </button>
    <button id="custom-button" hellButton [ui]="buttonUi" type="button">Custom</button>

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

    <nav id="pagination" hellPagination ui="gap-hell-4" [page]="1" [pageCount]="3">
      <button id="pagination-first" hellPaginationFirst type="button" ui="bg-hell-danger px-hell-7">
        First
      </button>
      <button id="pagination-prev" hellPaginationPrev type="button">Previous</button>
      <button id="pagination-page" hellPaginationButton type="button" [page]="2" aria-label="Page 2">
        2
      </button>
      <button id="pagination-next" hellPaginationNext type="button">Next</button>
      <button id="pagination-last" hellPaginationLast type="button">Last</button>
    </nav>
    <hell-pagination
      id="pagination-strip"
      mode="jump"
      [page]="2"
      [pageCount]="4"
      [ui]="paginationStripUi"
    />

    <nav hellAppSidenav>
      <a id="nav-item" hellNavItem active href="#">
        <span hellNavItemIcon aria-hidden="true"></span>
        <span hellNavItemLabel>Dashboard</span>
        <span hellNavItemTrailing>3</span>
      </a>
      <a id="custom-nav-item" hellNavItem ui="bg-hell-danger px-hell-7" href="#">
        <span hellNavItemLabel>Raw</span>
      </a>
      <div id="nav-section" hellNavSection>
        <button id="nav-section-toggle" hellNavSectionToggle type="button">Settings</button>
        <div id="nav-section-items" hellNavSectionItems>
          <a hellNavItem href="#">Preferences</a>
        </div>
      </div>
    </nav>

    <div id="resizable" hellResizable orientation="vertical" ui="h-[360px] bg-hell-surface-muted">
      <section id="resizable-pane-a" hellResizablePane [ui]="resizablePaneUi" [minSize]="40">
        A
      </section>
      <div
        id="resizable-handle"
        hellResizableHandle
        appearance="grip"
        [ui]="resizableHandleUi"
      ></div>
      <section id="resizable-pane-b" hellResizablePane [minSize]="40">B</section>
    </div>

    <hell-split-view
      id="split-view"
      [compactBelow]="0"
      itemNavigation
      framed
      [ui]="splitViewUi"
    >
      <ng-template hellSplitPrimary>
        <section>Primary</section>
      </ng-template>
      <ng-template hellSplitDetail>
        <section>Detail</section>
      </ng-template>
    </hell-split-view>

    <div id="table-container" hellTableContainer busy ui="bg-hell-surface-muted">
      <table id="table" hellTableRoot contentWidth [ui]="tableUi">
        <thead id="table-head" hellTableHeader ui="bg-hell-danger">
          <tr id="table-row" hellTableRow active selected ui="bg-hell-primary-soft">
            <th id="table-selection-header" hellTableHeaderCell hellTableSelectionCell ui="px-hell-7">
              <input
                id="table-row-checkbox"
                hellTableRowCheckbox
                type="checkbox"
                checked
                ui="border-hell-danger"
              />
            </th>
            <th
              id="table-header-cell"
              hellTableHeaderCell
              columnId="name"
              sortable
              sort="asc"
              ui="bg-hell-danger"
            >
              <button id="table-sort-trigger" hellTableSortTrigger type="button" ui="text-hell-danger">
                Name
              </button>
              <button id="table-resizer" hellTableResizeHandle [ui]="tableResizeHandleUi"></button>
            </th>
            <th hellTableHeaderCell columnId="role">Role</th>
            <td id="table-cell" hellTableCell align="end" space="empty" ui="text-hell-danger">
              Ada
              <button id="table-row-action" hellTableRowAction type="button" ui="text-hell-danger">
                Open
              </button>
              <input
                id="table-row-radio"
                hellTableRowRadio
                type="radio"
                name="table-radio"
                checked
                ui="border-hell-danger"
              />
            </td>
          </tr>
        </thead>
        <tbody id="table-body" hellTableBody></tbody>
      </table>
    </div>
  `,
})
class ContractHost {
  readonly buttonUi = {
    root: 'rounded-hell-pill bg-hell-danger',
  } satisfies HellButtonUi;

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

  readonly resizablePaneUi = {
    root: 'overflow-hidden bg-hell-danger',
  } satisfies HellResizablePaneUi;

  readonly resizableHandleUi = {
    root: 'bg-hell-danger flex-none',
    grip: 'bg-hell-primary',
  } satisfies HellResizableHandleUi;
  readonly splitViewUi = {
    root: 'h-[420px] bg-hell-surface-muted',
    resizable: 'h-[410px] bg-hell-danger',
    pane: 'overflow-auto bg-hell-surface-subtle',
    detailHeader: 'bg-hell-danger p-hell-3',
    itemNavigation: 'gap-hell-3',
  } satisfies HellSplitViewUi;
  readonly paginationStripUi = {
    root: 'gap-hell-4 bg-hell-surface-muted',
    jump: 'text-hell-danger',
    jumpSelect: 'min-w-[calc(var(--spacing)*24)]',
  } satisfies HellPaginationStripUi;
  readonly tableUi = {
    root: 'text-sm bg-hell-surface-muted',
  } satisfies HellTableUi;
  readonly tableResizeHandleUi = {
    root: 'w-hell-6',
    grip: 'bg-hell-danger',
  } satisfies HellTableResizeHandleUi;
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
  { id: 'select', module: 'HellSelect', className: 'hell-select' },
];

const STYLE_OPT_OUT_CASES: readonly ContractCase[] = [];

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
  });

  it('exposes public classes, state attributes and slot attributes through one table', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    for (const contract of STYLEABLE_CASES) assertContract(fixture.nativeElement, contract, true);
  });

  it('exposes migrated Part Style Map contracts through public root parts', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const styled = query(fixture.nativeElement, '#styled-button');
    expect(styled.classList.contains('hell-button')).toBe(false);
    expect(styled.getAttribute('data-slot')).toBe('root');
    expect(styled.getAttribute('data-variant')).toBe('primary');
    expect(styled.getAttribute('data-size')).toBe('sm');
    expect(styled.getAttribute('data-icon-only')).toBe('');
    expect(styled.getAttribute('data-block')).toBe('');
    expect(styled.className).toContain('bg-hell-primary');
    expect(styled.className).toContain('w-full');

    const custom = query(fixture.nativeElement, '#custom-button');
    expect(custom.classList.contains('hell-button')).toBe(false);
    expect(custom.getAttribute('data-slot')).toBe('root');
    expect(custom.className).toContain('rounded-hell-pill');
    expect(custom.className).toContain('bg-hell-danger');

    const card = query(fixture.nativeElement, '#card');
    expect(card.classList.contains('hell-card')).toBe(false);
    expect(card.getAttribute('data-slot')).toBe('root');
    expect(card.className).toContain('rounded-hell-pill');
    expect(card.className).not.toContain('rounded-hell-lg');
    expect(card.className).toContain('shadow-hell-lg');
    expect(card.className).not.toContain('shadow-hell-xs');

    const cardHeader = query(fixture.nativeElement, '#card-header');
    const cardBody = query(fixture.nativeElement, '#card-body');
    const cardFooter = query(fixture.nativeElement, '#card-footer');
    expect(cardHeader.classList.contains('hell-card-header')).toBe(false);
    expect(cardHeader.className).toContain('px-hell-2');
    expect(cardHeader.className).not.toContain('px-hell-6');
    expect(cardBody.classList.contains('hell-card-body')).toBe(false);
    expect(cardBody.className).toContain('p-hell-2');
    expect(cardBody.className).not.toContain('p-hell-6');
    expect(cardFooter.classList.contains('hell-card-footer')).toBe(false);
    expect(cardFooter.className).toContain('justify-start');
    expect(cardFooter.className).not.toContain('justify-end');

    const field = query(fixture.nativeElement, '#field');
    const fieldLabel = query(fixture.nativeElement, '[data-contract="field-label"]');
    const fieldDescription = query(fixture.nativeElement, '[data-contract="field-description"]');
    const fieldError = query(fixture.nativeElement, '[data-contract="field-error"]');
    expect(field.classList.contains('hell-field')).toBe(false);
    expect(field.getAttribute('data-slot')).toBe('root');
    expect(field.className).toContain('gap-hell-6');
    expect(field.className).not.toContain('gap-hell-2');
    expect(fieldLabel.classList.contains('hell-field-label')).toBe(false);
    expect(fieldLabel.className).toContain('text-sm');
    expect(fieldLabel.className).not.toContain('text-xs');
    expect(fieldDescription.classList.contains('hell-field-description')).toBe(false);
    expect(fieldDescription.className).toContain('text-hell-danger');
    expect(fieldDescription.className).not.toContain('text-hell-foreground-muted');
    expect(fieldError.classList.contains('hell-field-error')).toBe(false);
    expect(fieldError.className).toContain('text-hell-foreground');
    expect(fieldError.className).not.toContain('text-hell-danger');
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
    const custom = fixture.nativeElement.querySelector('#custom-nav-item') as HTMLAnchorElement;
    const section = fixture.nativeElement.querySelector('#nav-section') as HTMLElement;
    const sectionToggle = fixture.nativeElement.querySelector(
      '#nav-section-toggle',
    ) as HTMLButtonElement;
    const sectionItems = fixture.nativeElement.querySelector('#nav-section-items') as HTMLElement;

    expect(item.classList.contains('hell-nav-item')).toBe(false);
    expect(item.getAttribute('data-slot')).toBe('root');
    expect(item.getAttribute('data-active')).toBe('true');
    expect(icon.classList.contains('hell-nav-icon')).toBe(false);
    expect(icon.getAttribute('data-slot')).toBe('root');
    expect(label.classList.contains('hell-nav-label')).toBe(false);
    expect(label.getAttribute('data-slot')).toBe('root');
    expect(trailing.classList.contains('hell-nav-trailing')).toBe(false);
    expect(trailing.getAttribute('data-slot')).toBe('root');
    expect(custom.className).toContain('bg-hell-danger');
    expect(custom.className).toContain('px-hell-7');
    expect(custom.className).not.toContain('px-3');
    expect(section.getAttribute('data-slot')).toBe('root');
    expect(sectionToggle.getAttribute('data-slot')).toBe('root');
    expect(sectionToggle.getAttribute('aria-expanded')).toBe('true');
    expect(sectionItems.getAttribute('data-slot')).toBe('root');
  });

  it('exposes resizable as local root parts with resize state attributes intact', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const group = query(fixture.nativeElement, '#resizable');
    const pane = query(fixture.nativeElement, '#resizable-pane-a');
    const handle = query(fixture.nativeElement, '#resizable-handle');
    const grip = query(handle, '[data-slot="grip"]');

    expect(group.classList.contains('hell-resizable')).toBe(false);
    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expect(group.className).toContain('h-[360px]');
    expect(group.className).not.toContain('h-full');

    expect(pane.classList.contains('hell-resizable-pane')).toBe(false);
    expect(pane.getAttribute('data-slot')).toBe('root');
    expect(pane.getAttribute('data-orientation')).toBe('vertical');
    expect(pane.className).toContain('overflow-hidden');
    expect(pane.className).not.toContain('overflow-auto');

    expect(handle.classList.contains('hell-resizable-handle')).toBe(false);
    expect(handle.getAttribute('data-slot')).toBe('root');
    expect(handle.getAttribute('data-appearance')).toBe('grip');
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.className).toContain('bg-hell-danger');
    expect(grip.className).toContain('bg-hell-primary');
  });

  it('exposes pagination local roots and strip anatomy through Part Style Maps', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const pagination = query(fixture.nativeElement, '#pagination');
    const first = query(fixture.nativeElement, '#pagination-first');
    const prev = query(fixture.nativeElement, '#pagination-prev');
    const numbered = query(fixture.nativeElement, '#pagination-page');
    const next = query(fixture.nativeElement, '#pagination-next');
    const last = query(fixture.nativeElement, '#pagination-last');
    const strip = query(fixture.nativeElement, '#pagination-strip');
    const jump = query(strip, '[data-slot="jump"]');
    const jumpSelect = query<HTMLSelectElement>(strip, '[data-slot="jumpSelect"]');

    expect(pagination.classList.contains('hell-pagination')).toBe(false);
    expect(pagination.getAttribute('data-slot')).toBe('root');
    expect(pagination.className).toContain('gap-hell-4');

    for (const control of [first, prev, numbered, next, last]) {
      expect(control.classList.contains('hell-button')).toBe(false);
      expect(control.classList.contains('hell-pagination-item')).toBe(false);
      expect(control.getAttribute('data-slot')).toBe('root');
      expect(control.getAttribute('data-variant')).toBe('ghost');
      expect(control.getAttribute('data-icon-only')).toBe('');
    }

    expect(first.className).toContain('bg-hell-danger');
    expect(first.className).toContain('px-hell-7');
    expect(numbered.getAttribute('aria-label')).toBe('Page 2');
    expect(strip.classList.contains('hell-pagination')).toBe(false);
    expect(strip.getAttribute('data-slot')).toBe('root');
    expect(strip.getAttribute('data-mode')).toBe('jump');
    expect(jump.className).toContain('text-hell-danger');
    expect(jumpSelect.tagName).toBe('SELECT');
    expect(jumpSelect.className).toContain('min-w-[calc(var(--spacing)*24)]');
    expect(jumpSelect.className).toContain('h-hell-control-sm');
  });

  it('exposes table primitive roots and resize anatomy through Part Style Maps', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const container = query(fixture.nativeElement, '#table-container');
    const table = query(fixture.nativeElement, '#table');
    const head = query(fixture.nativeElement, '#table-head');
    const body = query(fixture.nativeElement, '#table-body');
    const row = query(fixture.nativeElement, '#table-row');
    const selectionHeader = query(fixture.nativeElement, '#table-selection-header');
    const checkbox = query(fixture.nativeElement, '#table-row-checkbox');
    const headerCell = query(fixture.nativeElement, '#table-header-cell');
    const sortTrigger = query(fixture.nativeElement, '#table-sort-trigger');
    const action = query(fixture.nativeElement, '#table-row-action');
    const radio = query(fixture.nativeElement, '#table-row-radio');
    const cell = query(fixture.nativeElement, '#table-cell');
    const resizer = query(fixture.nativeElement, '#table-resizer');
    const grip = query(resizer, '[data-slot="grip"]');

    for (const [element, legacyClass] of [
      [container, 'hell-table-container'],
      [table, 'hell-table'],
      [head, 'hell-table-head'],
      [body, 'hell-table-body'],
      [row, 'hell-table-row'],
      [selectionHeader, 'hell-table-selection-cell'],
      [selectionHeader, 'hell-table-header-cell'],
      [checkbox, 'hell-table-row-checkbox'],
      [headerCell, 'hell-table-header-cell'],
      [sortTrigger, 'hell-table-sort-trigger'],
      [action, 'hell-table-row-action'],
      [radio, 'hell-table-row-radio'],
      [cell, 'hell-table-cell'],
      [resizer, 'hell-table-resize-handle'],
    ] as const) {
      expect(element.classList.contains(legacyClass), legacyClass).toBe(false);
      expect(element.getAttribute('data-slot'), legacyClass).toBe('root');
    }

    expect(container.getAttribute('aria-busy')).toBe('true');
    expect(container.className).toContain('bg-hell-surface-muted');
    expect(table.getAttribute('data-content-width')).toBe('true');
    expect(table.className).toContain('text-sm');
    expect(head.className).toContain('bg-hell-danger');
    expect(row.getAttribute('data-active')).toBe('true');
    expect(row.getAttribute('data-selected')).toBe('true');
    expect(row.className).toContain('bg-hell-primary-soft');
    expect(selectionHeader.getAttribute('data-hell-table-selection-cell')).toBe('');
    expect(selectionHeader.className).toContain('px-hell-7');
    expect(checkbox.className).toContain('border-hell-danger');
    expect(headerCell.getAttribute('data-sort')).toBe('asc');
    expect(headerCell.getAttribute('aria-sort')).toBe('ascending');
    expect(headerCell.getAttribute('data-sortable')).toBe('true');
    expect(headerCell.className).toContain('bg-hell-danger');
    expect(sortTrigger.getAttribute('type')).toBe('button');
    expect(sortTrigger.className).toContain('text-hell-danger');
    expect(action.getAttribute('type')).toBe('button');
    expect(action.className).toContain('text-hell-danger');
    expect(radio.className).toContain('border-hell-danger');
    expect(cell.getAttribute('data-align')).toBe('end');
    expect(cell.getAttribute('data-space')).toBe('empty');
    expect(cell.className).toContain('text-hell-danger');
    expect(resizer.getAttribute('role')).toBe('separator');
    expect(resizer.className).toContain('w-hell-6');
    expect(grip.className).toContain('bg-hell-danger');
  });

  it('exposes split view owned anatomy through flat camelCase parts', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const splitView = query(fixture.nativeElement, '#split-view');
    const resizable = query(fixture.nativeElement, '#split-view [data-slot="resizable"]');
    const pane = query(fixture.nativeElement, '#split-view [data-slot="pane"][data-pane="primary"]');
    const detailHeader = query(fixture.nativeElement, '#split-view [data-slot="detailHeader"]');
    const itemNavigation = query(
      fixture.nativeElement,
      '#split-view [data-slot="itemNavigation"]',
    );

    expect(splitView.classList.contains('hell-split-view')).toBe(false);
    expect(splitView.getAttribute('data-slot')).toBe('root');
    expect(splitView.getAttribute('data-framed')).toBe('true');
    expect(splitView.className).toContain('h-[420px]');
    expect(splitView.className).not.toContain('h-full');
    expect(resizable.className).toContain('h-[410px]');
    expect(pane.className).toContain('overflow-auto');
    expect(detailHeader.className).toContain('bg-hell-danger');
    expect(itemNavigation.className).toContain('gap-hell-3');
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

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
