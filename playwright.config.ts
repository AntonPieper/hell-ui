import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, devices, type Project } from '@playwright/test';

/**
 * Browser-risk tiers (#265). Every tier reuses the same test code; a tier only
 * selects browser projects and, for the `main` tier, the engine-sensitive
 * subset below. CI resolves the tier from the triggering event
 * (`.github/workflows/ci.yml`); see `tools/ci/README.md`.
 *
 * - `pr`: chromium runs every behavioral suite plus the docs axe smoke.
 * - `main`: chromium as in `pr`, plus firefox and webkit for the
 *   engine-sensitive suites enumerated in `ENGINE_SENSITIVE_SUITES`.
 * - `full` (nightly, release tags, and the local default): the full
 *   three-browser matrix, including the full axe suite on every engine.
 */
const E2E_TIERS = ['pr', 'main', 'full'] as const;
type E2eTier = (typeof E2E_TIERS)[number];

/**
 * Suites whose contracts lean on engine-specific behavior, so chromium alone
 * cannot vouch for them. These run on firefox and webkit in the `main` tier;
 * the remaining suites assert engine-uniform semantics (ARIA attributes, axe
 * scans, JS-driven state) and stay chromium-only until the `full` tier.
 */
const ENGINE_SENSITIVE_SUITES: readonly string[] = [
  // Focus and keyboard semantics: focus traps and restoration, outside-focus
  // dismissal, Tab traversal, and selection-follows-focus differ per engine.
  'floating-dismissal.spec.ts',
  'listbox-a11y-contracts.spec.ts',
  'menu-select-combobox-keyboard.spec.ts',
  'tabs-a11y-contracts.spec.ts',
  'ui-behavior.spec.ts', // dialog focus trap/restore, submenus, audio + pdf runtimes
  // Overlays: floating positioning, anchoring, and dismissal.
  'combobox-chip-input-a11y-contracts.spec.ts',
  'confirm-a11y-contracts.spec.ts',
  'date-picker-a11y-contracts.spec.ts',
  'filter-builder-contracts.spec.ts',
  'multi-select-menu-button-contracts.spec.ts',
  'omnibar-a11y-contracts.spec.ts',
  'popover-a11y-contracts.spec.ts',
  'popover-contracts.spec.ts',
  'time-picker-a11y-contracts.spec.ts',
  'tooltip-a11y-contracts.spec.ts',
  // Native inputs: native control focus, editing, and chooser behavior.
  'checkbox-a11y-contracts.spec.ts',
  'date-input-a11y-contracts.spec.ts',
  'file-picker-contracts.spec.ts',
  'number-input-a11y-contracts.spec.ts',
  'radio-a11y-contracts.spec.ts',
  'switch-a11y-contracts.spec.ts',
  'time-input-a11y-contracts.spec.ts',
  // Media and motion: media queries and animation policy.
  'reduced-motion-contracts.spec.ts',
  // Measured layout: responsive transitions, overflow measurement, geometry.
  'app-shell-contracts.spec.ts',
  'master-detail-contracts.spec.ts',
  'resize-contracts.spec.ts',
  'save-bar-a11y-contracts.spec.ts',
  'table-docs-regressions.spec.ts',
  'toolbar-contracts.spec.ts',
];

const tier = resolveTier(process.env.HELL_E2E_TIER);
assertEngineSensitiveSuitesExist();

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4200);
const externalBaseUrl = process.env.HELL_E2E_BASE_URL;
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;
const webServerCommand =
  process.env.HELL_E2E_WEB_SERVER_COMMAND ??
  `pnpm run build:docs && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist/hell-docs/browser`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/playwright-html' }],
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
  projects: projectsForTier(tier),
});

function resolveTier(raw: string | undefined): E2eTier {
  if (raw === undefined || raw === '') return 'full';
  if ((E2E_TIERS as readonly string[]).includes(raw)) return raw as E2eTier;
  throw new Error(
    `Unknown HELL_E2E_TIER "${raw}". Expected one of: ${E2E_TIERS.join(', ')}.`,
  );
}

function projectsForTier(selected: E2eTier): Project[] {
  const chromium: Project = { name: 'chromium', use: { ...devices['Desktop Chrome'] } };
  if (selected === 'pr') return [chromium];

  const engineSubset =
    selected === 'main'
      ? { testMatch: ENGINE_SENSITIVE_SUITES.map((file) => `**/${file}`) }
      : {};
  return [
    chromium,
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, ...engineSubset },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, ...engineSubset },
  ];
}

/** A renamed or removed suite must fail the config loudly, not silently shrink the `main` tier. */
function assertEngineSensitiveSuitesExist(): void {
  const missing = ENGINE_SENSITIVE_SUITES.filter(
    (file) => !existsSync(join(__dirname, 'e2e', file)),
  );
  if (missing.length) {
    throw new Error(
      `Engine-sensitive suites missing from e2e/: ${missing.join(', ')}. ` +
        'Update ENGINE_SENSITIVE_SUITES in playwright.config.ts to match the renamed or removed spec files.',
    );
  }
  const duplicates = ENGINE_SENSITIVE_SUITES.filter(
    (file, index) => ENGINE_SENSITIVE_SUITES.indexOf(file) !== index,
  );
  if (duplicates.length) {
    throw new Error(
      `Engine-sensitive suites listed more than once: ${[...new Set(duplicates)].join(', ')}.`,
    );
  }
}
