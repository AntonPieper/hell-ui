import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

async function textMatches(
  harness: { getText(): Promise<string> },
  text: string,
): Promise<boolean> {
  return (await harness.getText()).trim() === text;
}

async function textIncludes(
  harness: { getText(): Promise<string> },
  text: string,
): Promise<boolean> {
  return (await harness.getText()).trim().includes(text);
}

export interface HellTextHarnessFilters extends BaseHarnessFilters {
  text?: string;
}
export interface HellDisabledHarnessFilters extends HellTextHarnessFilters {
  disabled?: boolean;
}
export interface HellStateHarnessFilters extends HellTextHarnessFilters {
  state?: string;
}

export class HellSelectHarness extends ComponentHarness {
  static hostSelector = '[hellSelect]';
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellSelectHarness> {
    return new HarnessPredicate(HellSelectHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) !== null;
  }
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-open')) !== null;
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellSelectDropdownHarness extends ComponentHarness {
  static hostSelector = '[hellSelectDropdown]';
  async getOptions(): Promise<HellSelectOptionHarness[]> {
    return this.locatorForAll(HellSelectOptionHarness)();
  }
}

export class HellSelectOptionHarness extends ComponentHarness {
  static hostSelector = '[hellSelectOption]';
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellSelectOptionHarness> {
    return new HarnessPredicate(HellSelectOptionHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('data-disabled')) !== null ||
      (await (await this.host()).getAttribute('aria-disabled')) === 'true'
    );
  }
  async isSelected(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-selected')) === 'true' ||
      (await (await this.host()).getAttribute('data-selected')) !== null
    );
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellComboboxHarness extends ComponentHarness {
  static hostSelector = '[hellCombobox]';
  async getInput(): Promise<HellComboboxInputHarness> {
    return this.locatorFor(HellComboboxInputHarness)();
  }
  async getButton(): Promise<HellComboboxButtonHarness | null> {
    return this.locatorForOptional(HellComboboxButtonHarness)();
  }
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) !== null;
  }
}

export class HellComboboxInputHarness extends ComponentHarness {
  static hostSelector = 'input[hellComboboxInput]';
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.host()).setInputValue(value);
  }
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }
}

export class HellComboboxButtonHarness extends ComponentHarness {
  static hostSelector = 'button[hellComboboxButton]';
  async click(): Promise<void> {
    await (await this.host()).click();
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class HellComboboxDropdownHarness extends ComponentHarness {
  static hostSelector = '[hellComboboxDropdown]';
  async getOptions(): Promise<HellComboboxOptionHarness[]> {
    return this.locatorForAll(HellComboboxOptionHarness)();
  }
}

export class HellComboboxOptionHarness extends ComponentHarness {
  static hostSelector = '[hellComboboxOption]';
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellComboboxOptionHarness> {
    return new HarnessPredicate(HellComboboxOptionHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellMenuTriggerHarness extends ComponentHarness {
  static hostSelector =
    'button[hellMenuTrigger], a[hellMenuTrigger], button[data-hell-menu-trigger], a[data-hell-menu-trigger]';
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellMenuTriggerHarness> {
    return new HarnessPredicate(HellMenuTriggerHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean>('disabled')) === true ||
      (await host.getAttribute('aria-disabled')) === 'true'
    );
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellMenuHarness extends ComponentHarness {
  static hostSelector = '[hellMenu]';
  async getItems(): Promise<HellMenuItemHarness[]> {
    return this.locatorForAll(HellMenuItemHarness)();
  }
}
export class HellMenuItemHarness extends ComponentHarness {
  static hostSelector = 'button[hellMenuItem], a[hellMenuItem], div[hellMenuItem]';
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellMenuItemHarness> {
    return new HarnessPredicate(HellMenuItemHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean>('disabled')) === true ||
      (await host.getAttribute('aria-disabled')) === 'true'
    );
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellTabsetHarness extends ComponentHarness {
  static hostSelector = '[hellTabset]';
  async getOrientation(): Promise<string | null> {
    return (await this.host()).getAttribute('data-orientation');
  }
  async getTabs(): Promise<HellTabHarness[]> {
    return this.locatorForAll(HellTabHarness)();
  }
}
export class HellTabHarness extends ComponentHarness {
  static hostSelector = 'button[hellTab]';
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellTabHarness> {
    return new HarnessPredicate(HellTabHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isSelected(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-selected')) === 'true' ||
      (await (await this.host()).getAttribute('data-selected')) !== null
    );
  }
  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.host()).getProperty<boolean>('disabled')) === true ||
      (await (await this.host()).getAttribute('aria-disabled')) === 'true'
    );
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
export class HellTabPanelHarness extends ComponentHarness {
  static hostSelector = '[hellTabPanel]';
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class HellAccordionHarness extends ComponentHarness {
  static hostSelector = '[hellAccordion]';
  async getItems(): Promise<HellAccordionItemHarness[]> {
    return this.locatorForAll(HellAccordionItemHarness)();
  }
}
export class HellAccordionItemHarness extends ComponentHarness {
  static hostSelector = '[hellAccordionItem]';
  async getTrigger(): Promise<HellAccordionTriggerHarness> {
    return this.locatorFor(HellAccordionTriggerHarness)();
  }
  async getContent(): Promise<HellAccordionContentHarness | null> {
    return this.locatorForOptional(HellAccordionContentHarness)();
  }
}
export class HellAccordionTriggerHarness extends ComponentHarness {
  static hostSelector = 'button[hellAccordionTrigger]';
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellAccordionTriggerHarness> {
    return new HarnessPredicate(HellAccordionTriggerHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isExpanded(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-expanded')) === 'true' ||
      (await (await this.host()).getAttribute('data-state')) === 'open'
    );
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
export class HellAccordionContentHarness extends ComponentHarness {
  static hostSelector = '[hellAccordionContent]';
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class HellSliderHarness extends ComponentHarness {
  static hostSelector = 'hell-slider';
  async getValue(): Promise<string | null> {
    const thumb = await this.locatorFor('[data-slot="thumb"]')();
    return (await thumb.getAttribute('aria-valuenow')) ?? (await thumb.getAttribute('data-value'));
  }
  async getDataSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }
  async isDisabled(): Promise<boolean> {
    const thumb = await this.locatorFor('[data-slot="thumb"]')();
    return (await thumb.getAttribute('aria-disabled')) === 'true';
  }
}

export class HellDatePickerHarness extends ComponentHarness {
  static hostSelector = 'hell-date-picker, hell-date-range-picker';
  async getLabel(): Promise<string> {
    return (await this.locatorFor('[data-slot="label"]')()).text();
  }
  async getDateButtons(): Promise<HellDatePickerDateButtonHarness[]> {
    return this.locatorForAll(HellDatePickerDateButtonHarness)();
  }
}
export class HellDatePickerDateButtonHarness extends ComponentHarness {
  static hostSelector = 'button[ngpDatePickerDateButton]';
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

export class HellDateInputHarness extends ComponentHarness {
  static hostSelector = 'hell-date-input';
  async getInputValue(): Promise<string> {
    return (await this.locatorFor('input[data-slot="input"]')()).getProperty<string>('value');
  }
  async setInputValue(value: string): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).setInputValue(value);
  }
  async openPicker(): Promise<void> {
    await (await this.locatorFor('button[data-slot="trigger"]')()).click();
  }
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-invalid')) === 'true';
  }
}
export class HellTimeInputHarness extends ComponentHarness {
  static hostSelector = 'hell-time-input';
  async getInputValue(): Promise<string> {
    return (await this.locatorFor('input[data-slot="input"]')()).getProperty<string>('value');
  }
  async setInputValue(value: string): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).setInputValue(value);
  }
  async openPicker(): Promise<void> {
    await (await this.locatorFor('button[data-slot="trigger"]')()).click();
  }
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-invalid')) === 'true';
  }
}

export class HellToastHarness extends ComponentHarness {
  static hostSelector = '[data-slot="toast"]';
  static with(options: HellStateHarnessFilters = {}): HarnessPredicate<HellToastHarness> {
    return new HarnessPredicate(HellToastHarness, options)
      .addOption('text', options.text, textIncludes)
      .addOption('state', options.state, async (h, v) => (await h.getState()) === v);
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async getVariant(): Promise<string | null> {
    return (await this.host()).getAttribute('data-variant');
  }
  async getState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-state');
  }
  async close(): Promise<void> {
    await (await this.locatorFor('[data-slot="close"]')()).click();
  }
}
export class HellToasterHarness extends ComponentHarness {
  static hostSelector = 'hell-toaster';
  async getPosition(): Promise<string | null> {
    return (await this.host()).getAttribute('data-position');
  }
  async getToasts(): Promise<HellToastHarness[]> {
    return this.locatorForAll(HellToastHarness)();
  }
}

export class HellDropZoneHarness extends ComponentHarness {
  static hostSelector = '[hellDropzone]';
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-active')) === 'true';
  }
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) === 'true';
  }
  async getAriaDisabled(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-disabled');
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class HellOmnibarHarness extends ComponentHarness {
  static hostSelector = 'hell-omnibar';
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-open')) === 'true';
  }
  async getInputValue(): Promise<string> {
    return (await this.locatorFor('input[data-slot="input"]')()).getProperty<string>('value');
  }
  async setInputValue(value: string): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).setInputValue(value);
  }
  async focus(): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).focus();
  }
  async clear(): Promise<void> {
    await (await this.locatorFor('[data-slot="clear"]')()).click();
  }
}
export class HellOmnibarItemHarness extends ComponentHarness {
  static hostSelector = 'button[hellOmnibarItem]';
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellOmnibarItemHarness> {
    return new HarnessPredicate(HellOmnibarItemHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-active')) === 'true';
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
export class HellOmnibarPanelHarness extends ComponentHarness {
  static hostSelector = '[data-slot="panel"]';
  async getItems(): Promise<HellOmnibarItemHarness[]> {
    return this.locatorForAll(HellOmnibarItemHarness)();
  }
}
