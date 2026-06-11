import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4200);
const externalBaseUrl = process.env.HELL_E2E_BASE_URL;
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;
const webServerCommand =
  process.env.HELL_E2E_WEB_SERVER_COMMAND ??
  `pnpm run ci:ensure:build:lib && node tools/setup-docs-hell-package-alias.mjs && pnpm exec ng serve hell-docs --configuration production --host 127.0.0.1 --port ${port}`;

const browserProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
] as const;

const ciGroups = [
  {
    name: 'aria-snapshots',
    testMatch: 'aria-snapshots.spec.ts',
  },
  {
    name: 'docs-smoke-foundations',
    testMatch: 'docs-axe-smoke.spec.ts',
    grep:
      /accordion|button|checkbox|date-picker|date.*input|radio|slider|switch|tabs|tooltip/,
  },
  {
    name: 'docs-smoke-surfaces',
    testMatch: 'docs-axe-smoke.spec.ts',
    grep:
      /dialog|flyout|listbox|popover|menu|select|combobox|omnibar|table|time.*input|pdf.*viewer/,
  },
  {
    name: 'controls-a11y',
    testMatch: [
      'accordion-a11y-contracts.spec.ts',
      'checkbox-a11y-contracts.spec.ts',
      'radio-a11y-contracts.spec.ts',
      'slider-a11y-contracts.spec.ts',
      'switch-a11y-contracts.spec.ts',
      'tabs-a11y-contracts.spec.ts',
      'tooltip-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'date-selection-a11y',
    testMatch: [
      'date-input-a11y-contracts.spec.ts',
      'date-picker-a11y-contracts.spec.ts',
      'listbox-a11y-contracts.spec.ts',
      'time-input-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'overlays-keyboard',
    testMatch: [
      'floating-dismissal.spec.ts',
      'flyout-a11y-contracts.spec.ts',
      'menu-select-combobox-keyboard.spec.ts',
      'omnibar-a11y-contracts.spec.ts',
      'popover-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'table-resize',
    testMatch: [
      'resize-contracts.spec.ts',
      'table-a11y-contracts.spec.ts',
      'table-docs-regressions.spec.ts',
    ],
  },
  {
    name: 'behavior-regressions',
    testMatch: 'ui-behavior.spec.ts',
  },
] as const;

const projects =
  process.env.HELL_E2E_PROJECTS === 'ci'
    ? browserProjects.flatMap((browser) =>
        ciGroups.map((group) => ({
          name: `${browser.name}-${group.name}`,
          testMatch: group.testMatch,
          grep: 'grep' in group ? group.grep : undefined,
          use: browser.use,
        })),
      )
    : [...browserProjects];

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/playwright-html' }],
    ['json', { outputFile: 'test-results/playwright-report.json' }],
  ],
  outputDir: 'test-results/playwright',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects,
});
