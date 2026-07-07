import { expect, test, type Locator, type Page } from '@playwright/test';

async function expectNamedAriaSnapshot(locator: Locator, name: string): Promise<void> {
  await expect(locator).toMatchAriaSnapshot({ name, timeout: 10_000 });
}

async function gotoDocsPage(page: Page, path: string, heading: string | RegExp): Promise<void> {
  await page.goto(path);
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

async function freezeBrowserDate(page: Page): Promise<void> {
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(2026, 3, 22, 12, 0, 0, 0).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        Object.defineProperty(FixedDate, 'name', { value: 'Date' });
        globalThis.Date = FixedDate;
      })();
    `,
  });
}

async function openBasicMenu(page: Page): Promise<Locator> {
  await gotoDocsPage(page, '/components/menu', 'Menu');
  await page.getByRole('button', { name: 'Actions' }).first().click();

  const menu = page.getByRole('menu').first();
  await expect(menu).toBeVisible();
  return menu;
}

test.describe('public docs aria snapshots', () => {
  test('accordion snapshot records heading buttons and named expanded panel state', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/accordion', 'Accordion');

    const example = page.locator('app-accordion-basic-example');
    await expect(example).toBeVisible();
    await expect(
      example.getByRole('button', { name: 'When will my order ship?' }),
    ).toHaveAttribute('aria-expanded', 'true');

    await expectNamedAriaSnapshot(example, 'accordion-single-open.aria.yml');
  });

  test('checkbox snapshots record required, mixed, disabled, and native states', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/checkbox', 'Checkbox');

    const custom = page.locator('app-checkbox-states-example');
    const native = page.locator('app-checkbox-native-example');
    await expect(custom).toBeVisible();
    await expect(native).toBeVisible();
    await expect(custom.getByRole('checkbox', { name: 'Indeterminate' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    );
    await expect(native.getByRole('checkbox', { name: 'Accept terms' })).toHaveJSProperty(
      'indeterminate',
      true,
    );

    await expectNamedAriaSnapshot(custom, 'checkbox-custom-states.aria.yml');
    await expectNamedAriaSnapshot(native, 'checkbox-native-required-indeterminate.aria.yml');
  });

  test('date picker snapshots record single-date grid and range states', async ({ page }) => {
    await freezeBrowserDate(page);
    await gotoDocsPage(page, '/components/date-picker', 'Date picker');

    const single = page.locator('app-date-picker-basic-example hell-date-picker');
    const range = page.locator('app-date-picker-range-example hell-date-range-picker');

    await expect(single.getByRole('grid', { name: 'April 2026' })).toBeVisible();
    await expect(
      single
        .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
        .filter({ hasText: /^\s*22\s*$/ }),
    ).toHaveAttribute('data-selected', '');
    await expect(
      range
        .locator('button[ngpdatepickerdatebutton]:not([data-outside-month])')
        .filter({ hasText: /^\s*6\s*$/ }),
    ).toHaveAttribute('data-range-start', '');

    await expectNamedAriaSnapshot(single, 'date-picker-single-grid.aria.yml');
    await expectNamedAriaSnapshot(range, 'date-picker-range-grid.aria.yml');
  });

  test('date picker snapshots record bounded and disabled navigation states', async ({ page }) => {
    await freezeBrowserDate(page);
    await gotoDocsPage(page, '/components/date-picker', 'Date picker');

    const bounded = page.locator('app-date-picker-bounded-example hell-date-picker');
    const disabled = page.locator('app-date-picker-disabled-example hell-date-picker').first();

    await expect(bounded.getByRole('button', { name: 'Previous year' })).toBeDisabled();
    await expect(disabled.getByRole('grid')).toHaveAttribute('data-disabled', '');

    await expectNamedAriaSnapshot(bounded, 'date-picker-bounded-nav.aria.yml');
    await expectNamedAriaSnapshot(disabled, 'date-picker-disabled-grid.aria.yml');
  });

  test('date input snapshots record invalid field state and open picker popover', async ({
    page,
  }) => {
    await freezeBrowserDate(page);
    await gotoDocsPage(page, '/components/date-input', 'Date input');

    const invalid = page
      .locator('app-date-input-bounds-and-validation-example')
      .getByRole('textbox', { name: 'Invalid date' });
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');

    const described = page
      .locator('app-date-input-reactive-forms-example')
      .getByRole('textbox', { name: 'Invoice date' });
    await expect(described).toHaveAccessibleDescription(
      'Reactive forms receive Date | null; empty text writes null.',
    );

    const basic = page.locator('app-date-input-basic-example');
    await basic.getByRole('button', { name: 'Choose date for Invoice date' }).click();
    const popover = page.locator('[data-slot="pickerPanel"]', {
      has: page.getByRole('grid'),
    });
    await expect(popover).toBeVisible();
    await expect(popover.getByRole('grid')).toBeVisible();

    await expectNamedAriaSnapshot(invalid, 'date-input-invalid-field.aria.yml');
    await expectNamedAriaSnapshot(popover, 'date-input-picker-open.aria.yml');
  });

  test('dialog snapshot records the named modal surface and actions', async ({ page }) => {
    await gotoDocsPage(page, '/components/dialog', 'Dialog');
    await page.getByRole('button', { name: 'Publish article' }).click();

    const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
    await expect(dialog).toBeVisible();

    await expectNamedAriaSnapshot(dialog, 'dialog-publish-open.aria.yml');
  });

  test('dialpad snapshot records named keys and state controls', async ({ page }) => {
    await gotoDocsPage(page, '/components/dialpad', 'Dialpad');

    const example = page.locator('app-dialpad-states-example');
    const dialpad = example.getByRole('group', { name: 'Dial pad' });
    await expect(dialpad).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Digit 2, ABC' })).toBeVisible();
    await expect(dialpad.getByRole('button', { name: 'Star' })).toBeVisible();
    // The states control is a multiple-select toggle group, so its items are
    // aria-pressed toggle buttons rather than radios.
    await example.getByRole('button', { name: 'Invalid' }).click();
    await expect(dialpad).toHaveAttribute('aria-invalid', 'true');

    await expectNamedAriaSnapshot(example, 'dialpad-interactive.aria.yml');
  });

  test('flyout snapshot records the named non-modal dialog and trigger state', async ({ page }) => {
    await gotoDocsPage(page, '/components/flyout', 'Flyout');

    const example = page.locator('app-flyout-anchor-and-boundary-example');
    const trigger = example.getByRole('button', { name: /^(Show|Hide) suggestions$/ });
    await trigger.click();

    const flyout = page.getByRole('dialog', { name: 'Anchored to the input' });
    await expect(flyout).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(flyout).toHaveAttribute('aria-modal', 'false');

    await expectNamedAriaSnapshot(example, 'flyout-boundary-open.aria.yml');
  });

  test('listbox snapshot records disabled, single-select, and multi-select option states', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/listbox', 'Listbox');

    const singleExample = page.locator('app-listbox-basic-example');
    const multipleExample = page.locator('app-listbox-multiple-example');
    const single = singleExample.getByRole('listbox', { name: 'Assign owner' });
    const multiple = multipleExample.getByRole('listbox', { name: 'Launch checks' });

    await expect(single).toBeVisible();
    await expect(multiple).toHaveAttribute('aria-multiselectable', 'true');
    await expect(multipleExample.getByRole('option', { name: /Data migration/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(
      multipleExample.getByRole('option', { name: /Accessibility review/ }),
    ).toHaveAttribute('aria-selected', 'true');

    await expectNamedAriaSnapshot(singleExample, 'listbox-basic-matrix.aria.yml');
    await expectNamedAriaSnapshot(multipleExample, 'listbox-multiple-matrix.aria.yml');
  });

  test('menu snapshot records action roles, names, and disabled state', async ({ page }) => {
    const menu = await openBasicMenu(page);

    await expectNamedAriaSnapshot(menu, 'menu-actions-open.aria.yml');
  });

  test('popover snapshots record trigger state and named dialog actions', async ({ page }) => {
    await gotoDocsPage(page, '/components/popover', 'Popover');

    const example = page.locator('app-popover-basic-example');
    const trigger = example.getByRole('button', { name: 'What is this status?' });
    await trigger.click();

    const popover = page.getByRole('dialog', { name: 'Pending review' });
    await expect(popover).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popover).toHaveAttribute('aria-labelledby', 'basic-popover-title');

    await expectNamedAriaSnapshot(trigger, 'popover-trigger-open.aria.yml');
    await expectNamedAriaSnapshot(popover, 'popover-dialog-open.aria.yml');
  });

  test('select snapshots record the expanded trigger and option roles', async ({ page }) => {
    await gotoDocsPage(page, '/components/select', 'Select');

    const select = page.getByRole('combobox', { name: 'Priority' }).first();
    await select.focus();
    await page.keyboard.press('ArrowDown');
    await expect(select).toHaveAttribute('aria-expanded', 'true');

    const options = page.getByRole('listbox').first();
    await expect(options).toBeVisible();

    await expectNamedAriaSnapshot(select, 'select-trigger-open.aria.yml');
    await expectNamedAriaSnapshot(options, 'select-options-open.aria.yml');
  });

  test('combobox snapshots record the filtered input and option roles', async ({ page }) => {
    await gotoDocsPage(page, '/components/combobox', 'Combobox');

    const input = page.getByRole('combobox', { name: 'Settlement currency' }).first();
    await input.fill('Dollar');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: 'USD — US Dollar' })).toBeVisible();

    const options = page.getByRole('listbox').first();
    await expect(options).toBeVisible();

    await expectNamedAriaSnapshot(input, 'combobox-input-filtered.aria.yml');
    await expectNamedAriaSnapshot(options, 'combobox-options-filtered.aria.yml');
  });

  test('omnibar snapshots record the expanded searchbox and async results', async ({ page }) => {
    await gotoDocsPage(page, '/components/omnibar', 'Omnibar');

    const input = page.getByRole('combobox', { name: 'Search people' });
    await input.fill('user');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('option', { name: /User 1/ }).first()).toBeVisible();

    const results = page.getByRole('listbox').first();
    await expect(results).toBeVisible();

    await expectNamedAriaSnapshot(input, 'omnibar-input-results.aria.yml');
    await expectNamedAriaSnapshot(results, 'omnibar-results-listbox.aria.yml');
  });

  test('progress snapshots record visible labels and value states', async ({ page }) => {
    await gotoDocsPage(page, '/components/progress', 'Progress');

    const labeled = page.locator('app-progress-labeled-value-example');
    await expect(labeled).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Upload progress' })).toHaveAttribute(
      'aria-valuenow',
      '66',
    );
    await expect(page.getByRole('progressbar', { name: 'Storage used' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    await expect(page.getByRole('progressbar', { name: 'Thin track' })).toHaveAttribute(
      'aria-valuenow',
      '70',
    );
    // Indeterminate progress omits aria-valuenow entirely — a distinct value state.
    await expect(
      page.getByRole('progressbar', { name: 'Connecting to server' }),
    ).not.toHaveAttribute('aria-valuenow');

    await expectNamedAriaSnapshot(labeled, 'progress-labeled-values.aria.yml');
  });

  test('radio snapshots record group labels and checked states', async ({ page }) => {
    await gotoDocsPage(page, '/components/radio', 'Radio');

    const vertical = page.locator('app-radio-plan-picker-example');
    const horizontal = page.locator('app-radio-horizontal-example');
    await expect(vertical).toBeVisible();
    await expect(horizontal).toBeVisible();
    await expect(vertical.getByRole('radiogroup', { name: 'Plan' })).toHaveAttribute(
      'aria-required',
      'true',
    );
    await expect(horizontal.getByRole('radio', { name: 'X-Large' })).toBeDisabled();

    await expectNamedAriaSnapshot(vertical, 'radio-plan-group.aria.yml');
    await expectNamedAriaSnapshot(
      horizontal.getByRole('radio', { name: 'X-Large' }),
      'radio-disabled-option.aria.yml',
    );
    await expectNamedAriaSnapshot(horizontal, 'radio-size-group.aria.yml');
  });

  test('slider snapshot records visible label and value state', async ({ page }) => {
    await gotoDocsPage(page, '/components/slider', 'Slider');

    const basic = page.locator('app-slider-basic-example');

    await expect(basic.getByRole('slider', { name: 'Volume' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );

    await expectNamedAriaSnapshot(basic, 'slider-basic-labelled.aria.yml');
  });

  test('slider snapshot records vertical orientation', async ({ page }) => {
    await gotoDocsPage(page, '/components/slider', 'Slider');

    const vertical = page.locator('app-slider-orientation-example');

    await expect(vertical.getByRole('slider', { name: 'Vertical low' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );

    await expectNamedAriaSnapshot(vertical, 'slider-vertical-orientation.aria.yml');
  });

  test('slider snapshot records disabled state', async ({ page }) => {
    await gotoDocsPage(page, '/components/slider', 'Slider');

    const disabled = page.locator('app-slider-disabled-example');

    await expect(disabled.getByRole('slider', { name: 'Disabled volume' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );

    await expectNamedAriaSnapshot(disabled, 'slider-disabled-labelled.aria.yml');
  });

  test('switch snapshots record visible labels and switch states', async ({ page }) => {
    await gotoDocsPage(page, '/components/switch', 'Switch');

    const custom = page.locator('app-switch-states-example');
    const native = page.locator('app-switch-native-example');

    await expect(custom.getByRole('switch', { name: 'On', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(custom.getByRole('switch', { name: 'Disabled, off' })).toBeDisabled();
    await expect(native.getByRole('switch', { name: 'Auto-renew subscription' })).toHaveAttribute(
      'aria-required',
      'true',
    );

    await expectNamedAriaSnapshot(custom, 'switch-custom-states.aria.yml');
    await expectNamedAriaSnapshot(native, 'switch-native-required.aria.yml');
  });

  test('tabs snapshots record tablist names, selected tabs, and linked panels', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/tabs', 'Tabs');

    const automatic = page.locator('app-tabs-basic-example');
    const manual = page.locator('app-tabs-vertical-example');
    const automaticList = automatic.getByRole('tablist', { name: 'Account sections' });
    const manualList = manual.getByRole('tablist', { name: 'Settings sections' });

    await expect(automaticList).toHaveAttribute('aria-orientation', 'horizontal');
    await expect(manualList).toHaveAttribute('aria-orientation', 'vertical');
    await expect(automatic.getByRole('tab', { name: 'General' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(manual.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await expectNamedAriaSnapshot(automatic, 'tabs-automatic-selected.aria.yml');
    await expectNamedAriaSnapshot(manual, 'tabs-manual-vertical-selected.aria.yml');
  });

  test('tooltip snapshots record trigger description and tooltip role', async ({ page }) => {
    await gotoDocsPage(page, '/components/tooltip', 'Tooltip');

    const trigger = page.getByRole('button', { name: 'Top' });
    await trigger.focus();
    const tooltip = page.getByRole('tooltip', { name: "I'm on top" });
    await expect(tooltip).toBeVisible();

    const tooltipId = await tooltip.getAttribute('id');
    if (!tooltipId) throw new Error('Tooltip must expose a non-empty id.');
    await expect(trigger).toHaveAttribute('aria-describedby', tooltipId ?? '');

    await expectNamedAriaSnapshot(trigger, 'tooltip-trigger-described.aria.yml');
    await expectNamedAriaSnapshot(tooltip, 'tooltip-open.aria.yml');
  });

  test('table utility snapshot records active row semantics and cell action name', async ({
    page,
  }) => {
    await gotoDocsPage(page, '/components/table', 'Table');

    const primitive = page.locator('app-table-primitive-example');
    await expect(primitive).toBeVisible();

    const firstRow = primitive.getByRole('row', { name: /Ada Lovelace/ }).first();
    const open = firstRow.getByRole('button', { name: 'Open Ada Lovelace' });
    await expect(open).toBeVisible();
    await open.click();
    await expect(firstRow).toHaveAttribute('data-active', 'true');
    await expect(firstRow).not.toHaveAttribute('aria-selected');
    await expect(firstRow).not.toHaveAttribute('tabindex');

    await expectNamedAriaSnapshot(firstRow, 'table-utilities-row-cell-action.aria.yml');
  });

  test('time input snapshot records labeled spinbuttons and minute presets', async ({ page }) => {
    await gotoDocsPage(page, '/components/time-input', 'Time input');

    await page
      .locator('app-time-input-basic-example')
      .getByRole('button', { name: 'Choose time' })
      .click();
    const picker = page
      .locator('[data-slot="pickerPanel"]')
      .filter({ has: page.getByRole('spinbutton', { name: 'Hours' }) });
    await expect(picker).toBeVisible();

    await expectNamedAriaSnapshot(picker, 'time-input-picker-open.aria.yml');
  });
});
