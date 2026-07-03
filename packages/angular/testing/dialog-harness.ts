import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/** Filters accepted by `HellDialogHarness.with`. */
export interface HellDialogHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellDialogOverlayHarness.with`. */
export interface HellDialogOverlayHarnessFilters extends BaseHarnessFilters {
  /** Filter by scoped-dialog mode. */
  scoped?: boolean;
}

/** Filters accepted by `HellDialogTitleHarness.with`. */
export interface HellDialogTitleHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellDialogDescriptionHarness.with`. */
export interface HellDialogDescriptionHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
}

/** Filters accepted by `HellDialogTriggerHarness.with`. */
export interface HellDialogTriggerHarnessFilters extends BaseHarnessFilters {
  /** Filter by exact trimmed text. */
  text?: string;
  /** Filter by disabled state. */
  disabled?: boolean;
}

/** Test harness driving `[hellDialog]`. */
export class HellDialogHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellDialog]';

  /** Build a `HarnessPredicate` filtered by the given options. */
  static with(options: HellDialogHarnessFilters = {}): HarnessPredicate<HellDialogHarness> {
    return new HarnessPredicate(HellDialogHarness, options).addOption('text', options.text, async (harness, text) => {
      const label = (await harness.getText()).trim();
      return label.includes(text);
    });
  }

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  /** Value of the host `data-size` attribute. */
  async getDataSize(): Promise<string | null> {
    return (await this.host()).getAttribute('data-size');
  }
}

/** Test harness driving `[hellDialogOverlay]`. */
export class HellDialogOverlayHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellDialogOverlay]';

  /** Build a `HarnessPredicate` filtered by the given options. */
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

  /** Whether the dialog is scoped to a Dialog Scope root. */
  async isScoped(): Promise<boolean> {
    const value = await (await this.host()).getAttribute('data-scoped');
    return value === 'true';
  }
}

/** Test harness driving `[hellDialogTitle]`. */
export class HellDialogTitleHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellDialogTitle]';

  /** Build a `HarnessPredicate` filtered by the given options. */
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

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `[hellDialogDescription]`. */
export class HellDialogDescriptionHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = '[hellDialogDescription]';

  /** Build a `HarnessPredicate` filtered by the given options. */
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

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

/** Test harness driving `button[data-hell-dialog-trigger], a[data-hell-dialog-trigger]`. */
export class HellDialogTriggerHarness extends ComponentHarness {
  /** CSS selector that matches this harness’s host element. */
  static hostSelector = 'button[data-hell-dialog-trigger], a[data-hell-dialog-trigger]';

  /** Build a `HarnessPredicate` filtered by the given options. */
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

  /** Trimmed-source text content of the host element. */
  async getText(): Promise<string> {
    return (await this.host()).text();
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
