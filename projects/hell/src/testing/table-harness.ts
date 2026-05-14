import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface HellTableContainerHarnessFilters extends BaseHarnessFilters {
  busy?: boolean;
}

export interface HellTableHarnessFilters extends BaseHarnessFilters {
  contentWidth?: boolean;
}

export interface HellTableHeaderCellHarnessFilters extends BaseHarnessFilters {
  columnId?: string;
}

export interface HellTableRowHarnessFilters extends BaseHarnessFilters {
  text?: string;
  selected?: boolean;
  interactive?: boolean;
}

export interface HellTableSortButtonHarnessFilters extends BaseHarnessFilters {
  disabled?: boolean;
  text?: string;
}

export interface HellTableColumnResizerHarnessFilters extends BaseHarnessFilters {
  disabled?: boolean;
}

export interface HellTableCellHarnessFilters extends BaseHarnessFilters {
  text?: string;
}

export class HellTableContainerHarness extends ComponentHarness {
  static hostSelector = '[hellTableContainer]';

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

  async isBusy(): Promise<boolean> {
    const loading = await (await this.host()).getAttribute('data-loading');
    return loading === 'true';
  }

  async getAriaBusy(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-busy');
  }

  async getTable(): Promise<HellTableHarness> {
    return this.locatorFor(HellTableHarness)();
  }
}

export class HellTableHarness extends ComponentHarness {
  static hostSelector = 'table[hellTable]';

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

  async isContentWidth(): Promise<boolean> {
    const contentWidth = await (await this.host()).getAttribute('data-content-width');
    return contentWidth === 'true';
  }

  async getHead(): Promise<HellTableHeadHarness | null> {
    return this.locatorForOptional(HellTableHeadHarness)();
  }

  async getBody(): Promise<HellTableBodyHarness | null> {
    return this.locatorForOptional(HellTableBodyHarness)();
  }

  async getHeaderCells(): Promise<HellTableHeaderCellHarness[]> {
    return this.locatorForAll(HellTableHeaderCellHarness)();
  }

  async getRows(): Promise<HellTableRowHarness[]> {
    return this.locatorForAll(HellTableRowHarness)();
  }

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

export class HellTableHeadHarness extends ComponentHarness {
  static hostSelector = 'thead[hellTableHead]';

  async getHeaderCells(): Promise<HellTableHeaderCellHarness[]> {
    return this.locatorForAll(HellTableHeaderCellHarness)();
  }
}

export class HellTableBodyHarness extends ComponentHarness {
  static hostSelector = 'tbody[hellTableBody]';

  async getRows(): Promise<HellTableRowHarness[]> {
    return this.locatorForAll(HellTableRowHarness)();
  }
}

export class HellTableRowIgnoreHarness extends ComponentHarness {
  static hostSelector = '[hellTableRowIgnore], [data-hell-row-ignore]';

  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class HellTableRowHarness extends ComponentHarness {
  static hostSelector = 'tr[hellTableRow]';

  static with(options: HellTableRowHarnessFilters = {}): HarnessPredicate<HellTableRowHarness> {
    return new HarnessPredicate(HellTableRowHarness, options)
      .addOption('text', options.text, async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label.includes(text);
      })
      .addOption('selected', options.selected, async (harness, selected) => {
        const current = await harness.isSelected();
        return current === selected;
      })
      .addOption('interactive', options.interactive, async (harness, interactive) => {
        const current = await harness.isInteractive();
        return current === interactive;
      });
  }

  async isInteractive(): Promise<boolean> {
    const interactive = await (await this.host()).getAttribute('data-interactive');
    return interactive === 'true';
  }

  async isSelected(): Promise<boolean> {
    const selected = await (await this.host()).getAttribute('data-selected');
    return selected === 'true';
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async getCells(): Promise<HellTableCellHarness[]> {
    return this.locatorForAll(HellTableCellHarness)();
  }

  async getCell(index: number): Promise<HellTableCellHarness | null> {
    const cells = await this.getCells();
    return cells[index] ?? null;
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }

  async select(): Promise<void> {
    await this.click();
  }
}

export class HellTableHeaderCellHarness extends ComponentHarness {
  static hostSelector = 'th[hellTableHeaderCell]';

  static with(options: HellTableHeaderCellHarnessFilters = {}): HarnessPredicate<HellTableHeaderCellHarness> {
    return new HarnessPredicate(HellTableHeaderCellHarness, options).addOption(
      'columnId',
      options.columnId,
      async (harness, columnId) => {
        return (await harness.getColumnId()) === columnId;
      },
    );
  }

  async getColumnId(): Promise<string | null> {
    return (await this.host()).getAttribute('data-column-id');
  }

  async getSortState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-sort');
  }

  async getAriaSort(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-sort');
  }

  async isSortable(): Promise<boolean> {
    const sortable = await (await this.host()).getAttribute('data-sortable');
    return sortable === 'true';
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async getSortButton(): Promise<HellTableSortButtonHarness | null> {
    return this.locatorForOptional(HellTableSortButtonHarness)();
  }

  async getColumnResizer(): Promise<HellTableColumnResizerHarness | null> {
    return this.locatorForOptional(HellTableColumnResizerHarness)();
  }
}

export class HellTableSortButtonHarness extends ComponentHarness {
  static hostSelector = 'button[hellTableSortButton]';

  static with(
    options: HellTableSortButtonHarnessFilters = {},
  ): HarnessPredicate<HellTableSortButtonHarness> {
    return new HarnessPredicate(HellTableSortButtonHarness, options)
      .addOption('text', options.text, async (harness, text) => {
        const label = (await harness.getText()).trim();
        return label === text;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async isDisabled(): Promise<boolean> {
    const disabled = await (await this.host()).getProperty<boolean>('disabled');
    return disabled === true;
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

export class HellTableCellHarness extends ComponentHarness {
  static hostSelector = 'td[hellTableCell]';

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

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }
}

export class HellTableColumnResizerHarness extends ComponentHarness {
  static hostSelector = '[hellTableColumnResizer]';

  static with(options: HellTableColumnResizerHarnessFilters = {}): HarnessPredicate<HellTableColumnResizerHarness> {
    return new HarnessPredicate(HellTableColumnResizerHarness, options).addOption(
      'disabled',
      options.disabled,
      async (harness, disabled) => {
        const current = await harness.isDisabled();
        return current === disabled;
      },
    );
  }

  async isDisabled(): Promise<boolean> {
    const value = await (await this.host()).getAttribute('aria-disabled');
    return value === 'true';
  }

  async getAriaLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  async getAriaControls(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-controls');
  }

  async getAriaValueNow(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-valuenow');
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}
