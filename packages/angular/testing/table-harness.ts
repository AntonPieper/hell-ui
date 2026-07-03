import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Filters accepted by `HellTableContainerHarness.with`. */
export interface HellTableContainerHarnessFilters extends BaseHarnessFilters {
  /** Filter by `aria-busy` state. */
  busy?: boolean;
}

/** Filters accepted by `HellTableHarness.with`. */
export interface HellTableHarnessFilters extends BaseHarnessFilters {
  /** Filter by content-width sizing mode. */
  contentWidth?: boolean;
}

/** Filters accepted by `HellTableHeaderCellHarness.with`. */
export interface HellTableHeaderCellHarnessFilters extends BaseHarnessFilters {
  /** Filter by column id. */
  columnId?: string;
}

/** Filters accepted by `HellTableRowHarness.with`. */
export interface HellTableRowHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
  /** Filter by active state. */
  active?: boolean;
  /** Filter by selected state. */
  selected?: boolean;
}

/** Filters accepted by `HellTableRowActionHarness.with`. */
export interface HellTableRowActionHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellTableSelectionCellHarness.with`. */
export interface HellTableSelectionCellHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellTableRowCheckboxHarness.with`. */
export interface HellTableRowCheckboxHarnessFilters extends BaseHarnessFilters {
  /** Filter by checked state. */
  checked?: boolean;
}

/** Filters accepted by `HellTableRowRadioHarness.with`. */
export interface HellTableRowRadioHarnessFilters extends BaseHarnessFilters {
  /** Filter by checked state. */
  checked?: boolean;
}

/** Filters accepted by `HellTableSortTriggerHarness.with`. */
export interface HellTableSortTriggerHarnessFilters extends BaseHarnessFilters {
  /** Filter by disabled state. */
  disabled?: boolean;
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellTableResizeHandleHarness.with`. */
export interface HellTableResizeHandleHarnessFilters extends BaseHarnessFilters {
  /** Filter by disabled state. */
  disabled?: boolean;
}

/** Filters accepted by `HellTableCellHarness.with`. */
export interface HellTableCellHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Test harness driving `[hellTableContainer]`. */
export class HellTableContainerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableContainer]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableContainerHarnessFilters = {}): HarnessPredicate<HellTableContainerHarness> {
    return new HarnessPredicate(HellTableContainerHarness, options).addOption(
      'busy',
      options.busy,
      async (harness, busy) => {
        const isBusy = await harness.isBusy();
        return isBusy === busy;
      },
    );
  }

  /** Whether the host reports a busy state. */
  async isBusy(): Promise<boolean> {
    const loading = await (await this.host()).getAttribute('data-loading');
    return loading === 'true';
  }

  /** Value of the host `aria-busy` attribute. */
  async getAriaBusy(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-busy');
  }

  /** Inner table harness. */
  async getTable(): Promise<HellTableHarness> {
    return this.locatorFor(HellTableHarness)();
  }
}

/** Test harness driving `[hellTableRoot], table[hellTable]`. */
export class HellTableHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableRoot], table[hellTable]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableHarnessFilters = {}): HarnessPredicate<HellTableHarness> {
    return new HarnessPredicate(HellTableHarness, options).addOption(
      'contentWidth',
      options.contentWidth,
      async (harness, contentWidth) => {
        const hasContentWidth = await harness.isContentWidth();
        return hasContentWidth === contentWidth;
      },
    );
  }

  /** Whether the host uses content-width sizing. */
  async isContentWidth(): Promise<boolean> {
    const contentWidth = await (await this.host()).getAttribute('data-content-width');
    return contentWidth === 'true';
  }

  /** Table head harness. */
  async getHead(): Promise<HellTableHeadHarness | null> {
    return this.locatorForOptional(HellTableHeadHarness)();
  }

  /** Table body harness. */
  async getBody(): Promise<HellTableBodyHarness | null> {
    return this.locatorForOptional(HellTableBodyHarness)();
  }

  /** Header cell harnesses in DOM order. */
  async getHeaderCells(): Promise<HellTableHeaderCellHarness[]> {
    return this.locatorForAll(HellTableHeaderCellHarness)();
  }

  /** Row harnesses in DOM order. */
  async getRows(): Promise<HellTableRowHarness[]> {
    return this.locatorForAll(HellTableRowHarness)();
  }

  /** Header cell harness matching a column id. */
  async getHeaderCellByColumnId(columnId: string): Promise<HellTableHeaderCellHarness | null> {
    const headers = await this.getHeaderCells();

    for (const header of headers) {
      if ((await header.getColumnId()) === columnId) {
        return header;
      }
    }

    return null;
  }
}

/** Test harness driving `[hellTableHeader], thead[hellTableHead]`. */
export class HellTableHeadHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableHeader], thead[hellTableHead]';

  /** Header cell harnesses in DOM order. */
  async getHeaderCells(): Promise<HellTableHeaderCellHarness[]> {
    return this.locatorForAll(HellTableHeaderCellHarness)();
  }
}

/** Test harness driving `[hellTableBody]`. */
export class HellTableBodyHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableBody]';

  /** Row harnesses in DOM order. */
  async getRows(): Promise<HellTableRowHarness[]> {
    return this.locatorForAll(HellTableRowHarness)();
  }
}

/** Test harness driving `[hellTableRowIgnore], [data-hell-row-ignore]`. */
export class HellTableRowIgnoreHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableRowIgnore], [data-hell-row-ignore]';

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `[hellTableRow]`. */
export class HellTableRowHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableRow]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableRowHarnessFilters = {}): HarnessPredicate<HellTableRowHarness> {
    return new HarnessPredicate(HellTableRowHarness, options)
      .addOption('text', options.text, async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label.includes(text);
      })
      .addOption('active', options.active, async (harness, active) => {
        const current = await harness.isActive();
        return current === active;
      })
      .addOption('selected', options.selected, async (harness, selected) => {
        const current = await harness.isSelected();
        return current === selected;
      });
  }

  /** Whether the host reports the active state. */
  async isActive(): Promise<boolean> {
    const active = await (await this.host()).getAttribute('data-active');
    return active === 'true';
  }

  /** Whether the host reports a selected state. */
  async isSelected(): Promise<boolean> {
    const selected = await (await this.host()).getAttribute('data-selected');
    return selected === 'true';
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Cell harnesses of this row in DOM order. */
  async getCells(): Promise<HellTableCellHarness[]> {
    return this.locatorForAll(HellTableCellHarness)();
  }

  /** One cell harness by position. */
  async getCell(index: number): Promise<HellTableCellHarness | null> {
    const cells = await this.getCells();
    return cells[index] ?? null;
  }

  /** Selection cell harnesses of this row. */
  async getSelectionCells(): Promise<HellTableSelectionCellHarness[]> {
    return this.locatorForAll(HellTableSelectionCellHarness)();
  }

  /** Action harnesses rendered by the host. */
  async getActions(): Promise<HellTableRowActionHarness[]> {
    return this.locatorForAll(HellTableRowActionHarness)();
  }

  /** Row-selection checkbox harnesses. */
  async getCheckboxes(): Promise<HellTableRowCheckboxHarness[]> {
    return this.locatorForAll(HellTableRowCheckboxHarness)();
  }

  /** Row-selection radio harnesses. */
  async getRadios(): Promise<HellTableRowRadioHarness[]> {
    return this.locatorForAll(HellTableRowRadioHarness)();
  }
}

/** Test harness driving `[hellTableRowAction]`. */
export class HellTableRowActionHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableRowAction]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellTableRowActionHarnessFilters = {},
  ): HarnessPredicate<HellTableRowActionHarness> {
    return new HarnessPredicate(HellTableRowActionHarness, options).addOption(
      'text',
      options.text,
      async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label === text;
      },
    );
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Click the host element. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

/** Test harness driving `[hellTableSelectionCell]`. */
export class HellTableSelectionCellHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableSelectionCell]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellTableSelectionCellHarnessFilters = {},
  ): HarnessPredicate<HellTableSelectionCellHarness> {
    return new HarnessPredicate(HellTableSelectionCellHarness, options).addOption(
      'text',
      options.text,
      async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label === text;
      },
    );
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `input[hellTableRowCheckbox]`. */
export class HellTableRowCheckboxHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'input[hellTableRowCheckbox]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellTableRowCheckboxHarnessFilters = {},
  ): HarnessPredicate<HellTableRowCheckboxHarness> {
    return new HarnessPredicate(HellTableRowCheckboxHarness, options).addOption(
      'checked',
      options.checked,
      async (harness, checked) => {
        const current = await harness.isChecked();
        return current === checked;
      },
    );
  }

  /** Whether the control is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('checked');
  }

  /** Whether the control is in the indeterminate state. */
  async isIndeterminate(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('indeterminate');
  }

  /** Check the control if it is not already checked. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) await (await this.host()).click();
  }

  /** Uncheck the control if it is currently checked. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) await (await this.host()).click();
  }
}

/** Test harness driving `input[hellTableRowRadio]`. */
export class HellTableRowRadioHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'input[hellTableRowRadio]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellTableRowRadioHarnessFilters = {},
  ): HarnessPredicate<HellTableRowRadioHarness> {
    return new HarnessPredicate(HellTableRowRadioHarness, options).addOption(
      'checked',
      options.checked,
      async (harness, checked) => {
        const current = await harness.isChecked();
        return current === checked;
      },
    );
  }

  /** Whether the control is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('checked');
  }

  /** Check the control if it is not already checked. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) await (await this.host()).click();
  }
}

/** Test harness driving `[hellTableHeaderCell]`. */
export class HellTableHeaderCellHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableHeaderCell]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableHeaderCellHarnessFilters = {}): HarnessPredicate<HellTableHeaderCellHarness> {
    return new HarnessPredicate(HellTableHeaderCellHarness, options).addOption(
      'columnId',
      options.columnId,
      async (harness, columnId) => {
        return (await harness.getColumnId()) === columnId;
      },
    );
  }

  /** Column id reported by the header cell. */
  async getColumnId(): Promise<string | null> {
    return (await this.host()).getAttribute('data-column-id');
  }

  /** Sort state reported by the header. */
  async getSortState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-sort');
  }

  /** Value of the header `aria-sort` attribute. */
  async getAriaSort(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-sort');
  }

  /** Whether the column header exposes a sort affordance. */
  async isSortable(): Promise<boolean> {
    const sortable = await (await this.host()).getAttribute('data-sortable');
    return sortable === 'true';
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Sort trigger harness of the header cell. */
  async getSortTrigger(): Promise<HellTableSortTriggerHarness | null> {
    return this.locatorForOptional(HellTableSortTriggerHarness)();
  }

  /** Column resize handle element. */
  async getResizeHandle(): Promise<HellTableResizeHandleHarness | null> {
    return this.locatorForOptional(HellTableResizeHandleHarness)();
  }
}

/** Test harness driving `button[hellTableSortTrigger]`. */
export class HellTableSortTriggerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellTableSortTrigger]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellTableSortTriggerHarnessFilters = {},
  ): HarnessPredicate<HellTableSortTriggerHarness> {
    return new HarnessPredicate(HellTableSortTriggerHarness, options)
      .addOption('text', options.text, async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label === text;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const disabled = await (await this.host()).getProperty<boolean>('disabled');
    return disabled === true;
  }

  /** Click the host element. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

/** Test harness driving `[hellTableCell]`. */
export class HellTableCellHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableCell]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableCellHarnessFilters = {}): HarnessPredicate<HellTableCellHarness> {
    return new HarnessPredicate(HellTableCellHarness, options).addOption(
      'text',
      options.text,
      async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label === text;
      },
    );
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Click the host element. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

/** Test harness driving `[hellTableResizeHandle]`. */
export class HellTableResizeHandleHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTableResizeHandle]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTableResizeHandleHarnessFilters = {}): HarnessPredicate<HellTableResizeHandleHarness> {
    return new HarnessPredicate(HellTableResizeHandleHarness, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        const current = await harness.isDisabled();
        return current === disabled;
      },
    );
  }

  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    const ariaDisabled = await host.getAttribute('aria-disabled');
    const role = await host.getAttribute('role');
    const tabIndex = await host.getAttribute('tabindex');
    return ariaDisabled === 'true' || role !== 'separator' || tabIndex === '-1';
  }

  /** Value of the host `aria-label` attribute. */
  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Value of the host `aria-controls` attribute. */
  async getAriaControls(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-controls');
  }

  /** Value of the host `aria-valuenow` attribute. */
  async getAriaValueNow(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-valuenow');
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}
