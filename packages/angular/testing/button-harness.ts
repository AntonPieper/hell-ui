import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Filters accepted by `HellButtonHarness.with`. */
export interface HellButtonHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
  /** Filter by disabled state. */
  disabled?: boolean;
}

/** Test harness driving `button[hellButton], a[hellButton]`. */
export class HellButtonHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[hellButton], a[hellButton]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellButtonHarnessFilters = {}): HarnessPredicate<HellButtonHarness> {
    return new HarnessPredicate(HellButtonHarness, options)
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

  /** Whether the host element is an anchor. */
  async isAnchor(): Promise<boolean> {
    const host = await this.host();
    return host.matchesSelector('a');
  }

  /** Whether the host reports a disabled state. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    const isAnchor = await host.matchesSelector('a');

    if (isAnchor) {
      return (await host.getAttribute('aria-disabled')) === 'true';
    }

    return (await host.getProperty<boolean>('disabled')) === true;
  }

  /** Click the host element. */
  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
