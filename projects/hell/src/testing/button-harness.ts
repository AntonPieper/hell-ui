import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface HellButtonHarnessFilters extends BaseHarnessFilters {
  text?: string;
  disabled?: boolean;
}

export class HellButtonHarness extends ComponentHarness {
  static hostSelector = 'button[hellButton], a[hellButton]';

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

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async isAnchor(): Promise<boolean> {
    const host = await this.host();
    return host.matchesSelector('a');
  }

  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    const isAnchor = await host.matchesSelector('a');

    if (isAnchor) {
      return (await host.getAttribute('aria-disabled')) === 'true';
    }

    return (await host.getProperty<boolean>('disabled')) === true;
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
