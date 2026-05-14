import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface HellDialogHarnessFilters extends BaseHarnessFilters {
  text?: string;
}

export interface HellDialogOverlayHarnessFilters extends BaseHarnessFilters {
  scoped?: boolean;
}

export interface HellDialogTitleHarnessFilters extends BaseHarnessFilters {
  text?: string;
}

export interface HellDialogDescriptionHarnessFilters extends BaseHarnessFilters {
  text?: string;
}

export interface HellDialogTriggerHarnessFilters extends BaseHarnessFilters {
  text?: string;
  disabled?: boolean;
}

export class HellDialogHarness extends ComponentHarness {
  static hostSelector = '[hellDialog]';

  static with(options: HellDialogHarnessFilters = {}): HarnessPredicate<HellDialogHarness> {
    return new HarnessPredicate(HellDialogHarness, options).addOption('text', options.text, async (harness, text) => {
      const label = (await harness.getText()).trim();
      return label.includes(text);
    });
  }

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async getDataSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }
}

export class HellDialogOverlayHarness extends ComponentHarness {
  static hostSelector = '[hellDialogOverlay]';

  static with(
    options: HellDialogOverlayHarnessFilters = {},
  ): HarnessPredicate<HellDialogOverlayHarness> {
    return new HarnessPredicate(HellDialogOverlayHarness, options).addOption(
      'scoped',
      options.scoped,
      async (harness, scoped) => {
        const value = await harness.isScoped();
        return value === scoped;
      },
    );
  }

  async isScoped(): Promise<boolean> {
    const value = await (await this.host()).getAttribute('data-scoped');
    return value === 'true';
  }
}

export class HellDialogTitleHarness extends ComponentHarness {
  static hostSelector = '[hellDialogTitle]';

  static with(options: HellDialogTitleHarnessFilters = {}): HarnessPredicate<HellDialogTitleHarness> {
    return new HarnessPredicate(HellDialogTitleHarness, options).addOption(
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
}

export class HellDialogDescriptionHarness extends ComponentHarness {
  static hostSelector = '[hellDialogDescription]';

  static with(
    options: HellDialogDescriptionHarnessFilters = {},
  ): HarnessPredicate<HellDialogDescriptionHarness> {
    return new HarnessPredicate(HellDialogDescriptionHarness, options).addOption(
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
}

export class HellDialogTriggerHarness extends ComponentHarness {
  static hostSelector = 'button[data-hell-dialog-trigger], a[data-hell-dialog-trigger]';

  static with(options: HellDialogTriggerHarnessFilters = {}): HarnessPredicate<HellDialogTriggerHarness> {
    return new HarnessPredicate(HellDialogTriggerHarness, options)
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
