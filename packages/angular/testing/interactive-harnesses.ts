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

/** Filters shared by text-bearing Hell harnesses. */
export interface HellTextHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}
/** Filters for harnesses exposing a disabled state. */
export interface HellDisabledHarnessFilters extends HellTextHarnessFilters {
  /** Filter by disabled state. */
  disabled?: boolean;
}
/** Filters for harnesses exposing a state attribute. */
export interface HellStateHarnessFilters extends HellTextHarnessFilters {
  /** Filter by state attribute value. */
  state?: string;
}

/** Test harness driving `[hellSelect]`. */
export class HellSelectHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellSelect]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellSelectHarness> {
    return new HarnessPredicate(HellSelectHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) !== null;
  }
  /** Whether the host reports an open state. */
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-open')) !== null;
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving `[hellSelectDropdown]`. */
export class HellSelectDropdownHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellSelectDropdown]';
  /** Child option harnesses in DOM order. */
  async getOptions(): Promise<HellSelectOptionHarness[]> {
    return this.locatorForAll(HellSelectOptionHarness)();
  }
}

/** Test harness driving `[hellSelectOption]`. */
export class HellSelectOptionHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellSelectOption]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellSelectOptionHarness> {
    return new HarnessPredicate(HellSelectOptionHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('data-disabled')) !== null ||
      (await (await this.host()).getAttribute('aria-disabled')) === 'true'
    );
  }
  /** Whether the host reports a selected state. */
  async isSelected(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-selected')) === 'true' ||
      (await (await this.host()).getAttribute('data-selected')) !== null
    );
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving `[hellCombobox]`. */
export class HellComboboxHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellCombobox]';
  /** Inner input harness. */
  async getInput(): Promise<HellComboboxInputHarness> {
    return this.locatorFor(HellComboboxInputHarness)();
  }
  /** Inner button harness. */
  async getButton(): Promise<HellComboboxButtonHarness | null> {
    return this.locatorForOptional(HellComboboxButtonHarness)();
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) !== null;
  }
}

/** Test harness driving `input[hellComboboxInput]`. */
export class HellComboboxInputHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'input[hellComboboxInput]';
  /** Current value of the control. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }
  /** Replace the control value. */
  async setValue(value: string): Promise<void> {
    await (await this.host()).setInputValue(value);
  }
  /** Focus the host element. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }
}

/** Test harness driving `button[hellComboboxButton]`. */
export class HellComboboxButtonHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellComboboxButton]';
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `[hellComboboxDropdown]`. */
export class HellComboboxDropdownHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellComboboxDropdown]';
  /** Child option harnesses in DOM order. */
  async getOptions(): Promise<HellComboboxOptionHarness[]> {
    return this.locatorForAll(HellComboboxOptionHarness)();
  }
}

/** Test harness driving `[hellComboboxOption]`. */
export class HellComboboxOptionHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellComboboxOption]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellComboboxOptionHarness> {
    return new HarnessPredicate(HellComboboxOptionHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving its host. */
export class HellMenuTriggerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector =
    'button[hellMenuTrigger], a[hellMenuTrigger], button[data-hell-menu-trigger], a[data-hell-menu-trigger]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellMenuTriggerHarness> {
    return new HarnessPredicate(HellMenuTriggerHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean>('disabled')) === true ||
      (await host.getAttribute('aria-disabled')) === 'true'
    );
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving `[hellMenu]`. */
export class HellMenuHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellMenu]';
  /** Child item harnesses in DOM order. */
  async getItems(): Promise<HellMenuItemHarness[]> {
    return this.locatorForAll(HellMenuItemHarness)();
  }
}
/** Test harness driving `button[hellMenuItem], a[hellMenuItem], div[hellMenuItem]`. */
export class HellMenuItemHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellMenuItem], a[hellMenuItem], div[hellMenuItem]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellMenuItemHarness> {
    return new HarnessPredicate(HellMenuItemHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean>('disabled')) === true ||
      (await host.getAttribute('aria-disabled')) === 'true'
    );
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving `[hellTabset]`. */
export class HellTabsetHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTabset]';
  /** Value of the host orientation attribute. */
  async getOrientation(): Promise<string | null> {
    return (await this.host()).getAttribute('data-orientation');
  }
  /** Tab harnesses in DOM order. */
  async getTabs(): Promise<HellTabHarness[]> {
    return this.locatorForAll(HellTabHarness)();
  }
}
/** Test harness driving `button[hellTab]`. */
export class HellTabHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellTab]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDisabledHarnessFilters = {}): HarnessPredicate<HellTabHarness> {
    return new HarnessPredicate(HellTabHarness, options)
      .addOption('text', options.text, textMatches)
      .addOption('disabled', options.disabled, async (h, v) => (await h.isDisabled()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports a selected state. */
  async isSelected(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-selected')) === 'true' ||
      (await (await this.host()).getAttribute('data-selected')) !== null
    );
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.host()).getProperty<boolean>('disabled')) === true ||
      (await (await this.host()).getAttribute('aria-disabled')) === 'true'
    );
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
/** Test harness driving `[hellTabPanel]`. */
export class HellTabPanelHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellTabPanel]';
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `[hellAccordion]`. */
export class HellAccordionHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellAccordion]';
  /** Child item harnesses in DOM order. */
  async getItems(): Promise<HellAccordionItemHarness[]> {
    return this.locatorForAll(HellAccordionItemHarness)();
  }
}
/** Test harness driving `[hellAccordionItem]`. */
export class HellAccordionItemHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellAccordionItem]';
  /** Trigger harness of the surface. */
  async getTrigger(): Promise<HellAccordionTriggerHarness> {
    return this.locatorFor(HellAccordionTriggerHarness)();
  }
  /** Content text of the surface. */
  async getContent(): Promise<HellAccordionContentHarness | null> {
    return this.locatorForOptional(HellAccordionContentHarness)();
  }
}
/** Test harness driving `button[hellAccordionTrigger]`. */
export class HellAccordionTriggerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellAccordionTrigger]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellAccordionTriggerHarness> {
    return new HarnessPredicate(HellAccordionTriggerHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports an expanded state. */
  async isExpanded(): Promise<boolean> {
    return (
      (await (await this.host()).getAttribute('aria-expanded')) === 'true' ||
      (await (await this.host()).getAttribute('data-state')) === 'open'
    );
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
/** Test harness driving `[hellAccordionContent]`. */
export class HellAccordionContentHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellAccordionContent]';
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `hell-slider`. */
export class HellSliderHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'hell-slider';
  /** Current value of the control. */
  async getValue(): Promise<string | null> {
    const thumb = await this.locatorFor('[data-slot="thumb"]')();
    return (await thumb.getAttribute('aria-valuenow')) ?? (await thumb.getAttribute('data-value'));
  }
  /** Value of the host `data-size` attribute. */
  async getDataSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }
  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const thumb = await this.locatorFor('[data-slot="thumb"]')();
    return (await thumb.getAttribute('aria-disabled')) === 'true';
  }
}

/** Test harness driving `hell-date-picker, hell-date-range-picker`. */
export class HellDatePickerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'hell-date-picker, hell-date-range-picker';
  /** Label text of the host. */
  async getLabel(): Promise<string> {
    return (await this.locatorFor('[data-slot="label"]')()).text();
  }
  /** Calendar day button harnesses. */
  async getDateButtons(): Promise<HellDatePickerDateButtonHarness[]> {
    return this.locatorForAll(HellDatePickerDateButtonHarness)();
  }
}
/** Test harness driving `button[ngpDatePickerDateButton]`. */
export class HellDatePickerDateButtonHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[ngpDatePickerDateButton]';
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}

/** Test harness driving `input[hellDateInput]`. */
export class HellDateInputHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'input[hellDateInput]';
  /** Current native input text, including an invalid draft. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }
  /** Replace the native input text without implicitly committing the draft. */
  async setValue(value: string): Promise<void> {
    const host = await this.host();
    await host.setInputValue(value);
    await host.dispatchEvent('input');
  }
  /** Focus the native input. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }
  /** Blur the native input, committing a valid or empty draft. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }
  /** Whether the native input currently owns focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
  /** Whether the native input is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }
  /** Whether the native input is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }
  /** Whether the host reports an invalid state. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }
}
/** Test harness driving `hell-time-input`. */
export class HellTimeInputHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'hell-time-input';
  /** Current value of the inner input element. */
  async getInputValue(): Promise<string> {
    return (await this.locatorFor('input[data-slot="input"]')()).getProperty<string>('value');
  }
  /** Type a new value into the inner input element. */
  async setInputValue(value: string): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).setInputValue(value);
  }
  /** Open the associated picker popover. */
  async openPicker(): Promise<void> {
    await (await this.locatorFor('button[data-slot="trigger"]')()).click();
  }
  /** Whether the host reports an invalid state. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-invalid')) === 'true';
  }
}

/** Test harness driving `[data-slot="toast"]`. */
export class HellToastHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[data-slot="toast"]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellStateHarnessFilters = {}): HarnessPredicate<HellToastHarness> {
    return new HarnessPredicate(HellToastHarness, options)
      .addOption('text', options.text, textIncludes)
      .addOption('state', options.state, async (h, v) => (await h.getState()) === v);
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Value of the host `data-variant` attribute. */
  async getVariant(): Promise<string | null> {
    return (await this.host()).getAttribute('data-variant');
  }
  /** Value of the host state attribute. */
  async getState(): Promise<string | null> {
    return (await this.host()).getAttribute('data-state');
  }
  /** Close the surface. */
  async close(): Promise<void> {
    await (await this.locatorFor('[data-slot="close"]')()).click();
  }
}
/** Test harness driving `hell-toaster`. */
export class HellToasterHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'hell-toaster';
  /** Position/placement reported by the host. */
  async getPosition(): Promise<string | null> {
    return (await this.host()).getAttribute('data-position');
  }
  /** Toast harnesses currently rendered. */
  async getToasts(): Promise<HellToastHarness[]> {
    return this.locatorForAll(HellToastHarness)();
  }
}

/** Test harness driving `hell-omnibar`. */
export class HellOmnibarHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'hell-omnibar';
  /** Whether the host reports an open state. */
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-open')) === 'true';
  }
  /** Current value of the inner input element. */
  async getInputValue(): Promise<string> {
    return (await this.locatorFor('input[data-slot="input"]')()).getProperty<string>('value');
  }
  /** Type a new value into the inner input element. */
  async setInputValue(value: string): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).setInputValue(value);
  }
  /** Focus the host element. */
  async focus(): Promise<void> {
    await (await this.locatorFor('input[data-slot="input"]')()).focus();
  }
  /** Clear the control value. */
  async clear(): Promise<void> {
    await (await this.locatorFor('[data-slot="clear"]')()).click();
  }
}
/** Test harness driving `button[hellOmnibarItem]`. */
export class HellOmnibarItemHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellOmnibarItem]';
  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellTextHarnessFilters = {}): HarnessPredicate<HellOmnibarItemHarness> {
    return new HarnessPredicate(HellOmnibarItemHarness, options).addOption(
      'text',
      options.text,
      textMatches,
    );
  }
  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  /** Whether the host reports the active state. */
  async isActive(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-active')) === 'true';
  }
  /** Click the host element. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }
}
/** Test harness driving `[data-slot="panel"]`. */
export class HellOmnibarPanelHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[data-slot="panel"]';
  /** Child item harnesses in DOM order. */
  async getItems(): Promise<HellOmnibarItemHarness[]> {
    return this.locatorForAll(HellOmnibarItemHarness)();
  }
}
