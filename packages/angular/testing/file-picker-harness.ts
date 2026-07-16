import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Filters accepted by `HellFilePickerHarness.with`. */
export interface HellFilePickerHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed host text. */
  text?: string;
  /** Filter by disabled state. */
  disabled?: boolean;
}

/** Test harness driving `[hellFilePicker]`. */
export class HellFilePickerHarness extends ComponentHarness {
  /** CSS selector that matches this harness's host element. */
  static hostSelector = '[hellFilePicker]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(
    options: HellFilePickerHarnessFilters = {},
  ): HarnessPredicate<HellFilePickerHarness> {
    return new HarnessPredicate(HellFilePickerHarness, options)
      .addOption('text', options.text, async (harness, text) => {
        return (await harness.getText()) === text;
      })
      .addOption('disabled', options.disabled, async (harness, disabled) => {
        return (await harness.isDisabled()) === disabled;
      });
  }

  /** Trimmed text content of the consumer-owned host. */
  async getText(): Promise<string> {
    return (await this.host()).text().then((text) => text.trim());
  }

  /** Whether the host reports disabled state. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) === 'true';
  }

  /** Whether a file drag is currently inside the complete host. */
  async isDragging(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-dragging')) === 'true';
  }

  /** Value of the host `aria-disabled` attribute. */
  async getAriaDisabled(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-disabled');
  }

  /** Value of the host `tabindex` attribute. */
  async getTabIndex(): Promise<string | null> {
    return (await this.host()).getAttribute('tabindex');
  }

  /** Activates the host's native browse action. */
  async open(): Promise<void> {
    await (await this.host()).click();
  }
}
