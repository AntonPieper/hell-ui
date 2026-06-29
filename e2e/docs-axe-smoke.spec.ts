import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

type DocsAxeTarget = {
  readonly name: string;
  readonly path: string;
  readonly heading: string | RegExp;
  readonly include: readonly string[];
  readonly prepare?: (page: Page) => Promise<void>;
};

const WCAG_SMOKE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const DOCS_AXE_TARGETS: readonly DocsAxeTarget[] = [
  {
    name: 'accordion',
    path: '/components/accordion',
    heading: 'Accordion',
    include: ['main'],
  },
  {
    name: 'button',
    path: '/components/button',
    heading: 'Button',
    include: ['main'],
  },
  {
    name: 'checkbox',
    path: '/components/checkbox',
    heading: 'Checkbox',
    include: ['main'],
  },
  {
    name: 'date-picker',
    path: '/components/date-picker',
    heading: 'Date picker',
    include: ['main'],
  },
  {
    name: 'date input',
    path: '/components/date-input',
    heading: 'Date input',
    include: ['main', '[hellPopover][data-slot="root"]'],
    prepare: async (page) => {
      const example = page.locator('app-date-input-text-input-calendar-popover-example');
      const departure = example.getByRole('textbox', { name: 'Departure' });
      await departure.locator('xpath=..').getByRole('button', { name: 'Choose date' }).click();
      await expect(page.getByRole('grid')).toBeVisible();
    },
  },
  {
    name: 'dialog',
    path: '/components/dialog',
    heading: 'Dialog',
    include: ['[role="dialog"][data-slot="root"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Publish article' }).click();
      const dialog = page.getByRole('dialog', { name: 'Publish this article?' });
      await expect(dialog).toBeVisible();
      await expect
        .poll(() => dialog.evaluate((element) => getComputedStyle(element).opacity))
        .toBe('1');
    },
  },
  {
    name: 'dialpad',
    path: '/components/dialpad',
    heading: 'Dialpad',
    include: ['main'],
  },
  {
    name: 'flyout',
    path: '/components/flyout',
    heading: 'Flyout',
    include: ['main', '[data-hell-flyout][data-slot="root"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Show flyout' }).click();
      await expect(page.getByRole('dialog', { name: 'Anchored, non-modal' })).toBeVisible();
    },
  },
  {
    name: 'listbox',
    path: '/components/listbox',
    heading: 'Listbox',
    include: ['main'],
  },
  {
    name: 'popover',
    path: '/components/popover',
    heading: 'Popover',
    include: ['main', '[hellPopover][data-slot="root"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Show profile summary' }).click();
      await expect(page.getByRole('dialog', { name: 'Profile summary' })).toBeVisible();
    },
  },
  {
    name: 'radio',
    path: '/components/radio',
    heading: 'Radio',
    include: ['main'],
  },
  {
    name: 'slider',
    path: '/components/slider',
    heading: 'Slider',
    include: ['main'],
  },
  {
    name: 'switch',
    path: '/components/switch',
    heading: 'Switch',
    include: ['main'],
  },
  {
    name: 'tabs',
    path: '/components/tabs',
    heading: 'Tabs',
    include: ['main'],
  },
  {
    name: 'tooltip',
    path: '/components/tooltip',
    heading: 'Tooltip',
    include: ['main', '[hellTooltip][data-slot="root"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Top' }).focus();
      await expect(page.getByRole('tooltip', { name: "I'm on top" })).toBeVisible();
    },
  },
  {
    name: 'menu',
    path: '/components/menu',
    heading: 'Menu',
    include: ['main', '[hellMenu][data-slot="root"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Actions' }).first().click();
      await expect(page.getByRole('menu').first()).toBeVisible();
    },
  },
  {
    name: 'select',
    path: '/components/select',
    heading: 'Select',
    include: ['main', '[hellSelectDropdown][data-slot="root"]'],
    prepare: async (page) => {
      const select = page.getByRole('combobox', { name: 'Select priority' }).first();
      await select.focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('option', { name: 'Lowest' })).toBeVisible();
    },
  },
  {
    name: 'combobox',
    path: '/components/combobox',
    heading: 'Combobox',
    include: ['main', '[hellComboboxDropdown][data-slot="root"]'],
    prepare: async (page) => {
      const input = page.getByRole('combobox', { name: 'Search fruit…' }).first();
      await input.focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.getByRole('option', { name: 'Apple', exact: true })).toBeVisible();
    },
  },
  {
    name: 'omnibar',
    path: '/components/omnibar',
    heading: 'Omnibar',
    include: ['main', '.hell-omnibar-overlay-pane [data-slot="panel"]'],
    prepare: async (page) => {
      const input = page.getByRole('combobox', { name: 'Search people' });
      await input.fill('user');
      await expect(page.getByRole('option', { name: /User 1/ }).first()).toBeVisible();
    },
  },
  {
    name: 'table primitives docs example',
    path: '/components/table',
    heading: 'Table',
    include: ['app-table-primitive-example'],
    prepare: async (page) => {
      await expect(
        page
          .locator('app-table-primitive-example')
          .getByRole('cell', { name: 'Ada Lovelace', exact: true }),
      ).toBeVisible();
    },
  },
  {
    name: 'TanStack table shell docs example',
    path: '/components/table',
    heading: 'Table',
    include: ['app-table-tanstack-shell-example'],
  },
  {
    name: 'TanStack virtual row strategy docs example',
    path: '/components/table',
    heading: 'Table',
    include: ['app-table-tanstack-virtual-example'],
  },
  {
    name: 'time input docs example',
    path: '/components/time-input',
    heading: 'Time input',
    include: ['main', '[data-slot="pickerPanel"]'],
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Choose time for Reminder time' }).first().click();
      await expect(page.getByRole('spinbutton', { name: 'Hours' })).toBeVisible();
    },
  },
  {
    name: 'pdf viewer shell',
    path: '/components/pdf-viewer',
    heading: 'PDF viewer',
    include: ['hell-pdf-viewer'],
    prepare: async (page) => {
      await page.getByRole('tab', { name: 'Preview' }).nth(1).click();
      await expect(page.locator('hell-pdf-viewer')).toBeVisible();
    },
  },
];

test.describe('public docs axe smoke', () => {
  for (const target of DOCS_AXE_TARGETS) {
    test(`${target.name} docs example reports no axe WCAG smoke violations`, async ({ page }) => {
      await page.goto(target.path);
      await expect(page.getByRole('heading', { name: target.heading, level: 1 })).toBeVisible();
      await target.prepare?.(page);

      const builder = new AxeBuilder({ page }).withTags(WCAG_SMOKE_TAGS);
      for (const selector of target.include) {
        builder.include(selector);
      }

      const results = await builder.analyze();
      expect(results.violations, formatAxeViolations(target, results.violations)).toEqual([]);
    });
  }
});

function formatAxeViolations(target: DocsAxeTarget, violations: readonly AxeViolation[]): string {
  if (!violations.length) return `${target.name} (${target.path}) has no axe violations.`;

  const details = violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          const summary = node.failureSummary?.trim().replace(/\s+/g, ' ') ?? 'No failure summary.';
          return `    - target: ${node.target.join(' | ')}\n      ${summary}`;
        })
        .join('\n');

      return `  ${violation.id} [${violation.impact ?? 'unknown'}]: ${violation.help}\n    ${violation.helpUrl}\n${nodes}`;
    })
    .join('\n\n');

  return [
    `Axe WCAG smoke violations for ${target.name} docs example (${target.path}).`,
    'Known exceptions are not suppressed here; add an inline rationale plus a tracked follow-up before excluding a rule or node.',
    details,
  ].join('\n\n');
}
