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
  // dismissal, Tab traversal, and hover/pointer event ordering differ per
  // engine. Suites whose assertions are JS-driven roving focus or ARIA state
  // render identically per engine and are deliberately NOT listed (checkbox,
  // switch, radio, toggle, listbox, tabs, number-input, multi-select): the
  // membership bar is that a test asserts behavior the engine itself owns,
  // not that the widget is keyboard-operable.
  'control-group-contracts.spec.ts',
  'dialog-modality-contracts.spec.ts', // focus trap/restore, inert + aria-hidden interleavings
  'floating-dismissal.spec.ts',
  'menu-select-combobox-keyboard.spec.ts',
  // Overlays: floating positioning, anchoring, and dismissal.
  'combobox-chip-input-a11y-contracts.spec.ts',
  'confirm-a11y-contracts.spec.ts',
  'date-picker-a11y-contracts.spec.ts',
  'filter-builder-contracts.spec.ts',
  'omnibar-a11y-contracts.spec.ts',
  'popover-a11y-contracts.spec.ts',
  'popover-contracts.spec.ts',
  'time-picker-a11y-contracts.spec.ts',
  'tooltip-a11y-contracts.spec.ts',
  // Native inputs: native control focus, editing, and chooser behavior.
  'date-input-a11y-contracts.spec.ts',
  'file-picker-contracts.spec.ts',
  'time-input-a11y-contracts.spec.ts',
  // Media and motion: media queries and animation policy.
  'reduced-motion-contracts.spec.ts',
  // Embedded runtimes: pdf.js rasterization, windowed Tab traversal through
  // the overview rail, and coarse-pointer toolbar sizing.
  'pdf-viewer-behavior.spec.ts',
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
/**
 * Builds the docs, stamps them, then serves them.
 *
 * The stamp is written here rather than by `build:docs` on purpose. `vercel.json`
 * publishes `dist/hell-docs/browser` wholesale, so anything `build:docs` leaves
 * there ships with the public site — and this file identifies the machine that
 * produced it. Writing it as part of serving keeps it out of every build that is
 * not this harness.
 */
const webServerCommand =
  process.env.HELL_E2E_WEB_SERVER_COMMAND ??
  `pnpm run build:docs && node tools/docs/stamp-docs-build.mjs dist/hell-docs && ` +
    `pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist/hell-docs/browser`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Every worker is a browser plus a runner process, so workers beyond the
  // core count oversubscribe the host. CI once forced 8 workers onto 4-core
  // runners; the host-health reporter read a median load of up to 7.6 per
  // logical core on the shards carrying the CPU-bound suites (axe scans,
  // pdf.js rasterization), which inflated every measured duration and tipped
  // the animation-sampling contracts over. One worker per core keeps the
  // wait-bound majority parallel without starving those. Outside CI,
  // Playwright's default (half the cores) stands.
  workers: process.env.CI ? '100%' : undefined,
  globalSetup: './tools/e2e/global-setup.ts',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/playwright-html' }],
    // Prints what the machine and the docs server were doing while each failure
    // ran — load during its window, and what the nearest server probe saw and
    // when. It draws no conclusion from any of it, deliberately: see the header
    // of that file for the six rounds of wrong conclusions that led here.
    ['./tools/e2e/host-health-reporter.ts'],
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
        // The command builds the docs before serving them, and a cold docs
        // build takes around 90s on a developer machine. At 120s that raced:
        // with no `dist/hell-docs`, the server never came up in time and the
        // run reported 292 failures across every suite — a suite-wide red with
        // no defect behind it, and nothing in the output naming the cause.
        // Sized for a cold build plus headroom on a slower runner; a warm run
        // is unaffected because it finishes long before this.
        timeout: 600_000,
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
