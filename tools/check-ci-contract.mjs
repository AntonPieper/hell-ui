import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import {
  DOCS_BUDGET_POLICY_PATH,
  parseBudgetSize,
  readDocsBudgetPolicy,
  validateDocsBudgetPolicy,
  validateDocsBudgetPolicyMarkdown,
} from './docs-budget-policy.mjs';
import { releaseCandidateConsumerScenarioNames } from './release-evidence-policy.mjs';

const errors = [];
const packageConsumerContract = readPackageConsumerContract();

const requiredFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/npm-publish.yml',
  '.gitlab-ci.yml',
  'Dockerfile.ci',
  'vitest.ci.config.ts',
  'tools/run-ci-tests.mjs',
  'tools/run-unit-tests.mjs',
  'tools/ci/nginx-spa.conf',
  'tools/ci/README.md',
  'tools/check-package-consumer.mjs',
  'tools/check-package-pack.mjs',
  'tools/check-api-reports.mjs',
  'tools/check-changelog.mjs',
  'tools/release-evidence-policy.mjs',
  'tools/release-dry-run.mjs',
  'tools/production-ready-check.mjs',
  'tools/package-pack-audit.mjs',
  'tools/ci-summary.mjs',
  'tools/docs-budget-policy.mjs',
  'tools/docs-bundle-budget-report.mjs',
  'CHANGELOG.md',
  'docs/release/npm-publishing.md',
  'docs/release/semver-policy.md',
  'docs/release/release-evidence-policy.md',
  'docs/release/production-readiness-checklist.md',
  'docs/release/docs-budget-policy.md',
  'docs/release/docs-bundle-budget-diagnosis.md',
];

const requiredScripts = {
  'ci:install': 'pnpm install --frozen-lockfile',
  'test:unit': 'node tools/run-unit-tests.mjs',
  'test:package-consumer': 'node tools/check-package-consumer.mjs',
  'test:package-pack': 'node tools/check-package-pack.mjs',
  'test:api-report': 'node tools/check-api-reports.mjs',
  'test:changelog': 'node tools/check-changelog.mjs',
  'api-report:update': 'node tools/check-api-reports.mjs --local',
  'build:docs': 'pnpm --filter hell-docs build && node tools/docs-bundle-budget-report.mjs --check --summary-only --verify-output',
  'release:dry-run': 'node tools/release-dry-run.mjs',
  'production-ready:check': 'node tools/production-ready-check.mjs',
  'ci:test': 'node tools/run-ci-tests.mjs',
  'ci:playwright': 'pnpm exec playwright install --with-deps chromium firefox webkit',
  'ci:playwright:chromium': 'pnpm exec playwright install --with-deps chromium',
  'ci:playwright:firefox': 'pnpm exec playwright install --with-deps firefox',
  'ci:playwright:webkit': 'pnpm exec playwright install --with-deps webkit',
  'ci:test:unit': 'node tools/run-unit-tests.mjs --ci-summary',
  'ci:test:static': 'pnpm run lint && pnpm run test:architecture && pnpm run test:ci-contract',
  'ci:test:e2e': 'pnpm exec playwright test',
  'ci:test:package-consumer': 'pnpm run test:package-consumer -- --minimal-deps',
  ...packageConsumerScriptCommands(packageConsumerContract),
  'ci:build:lib': 'pnpm run build:lib',
  'ci:build:docs': 'pnpm run build:lib && pnpm run build:docs',
  'ci:build:docs:prepared': 'pnpm run build:docs',
  'ci:ensure:build:lib': "sh -c 'test -f dist/hell/package.json && test -f dist/hell-pdf-viewer/package.json || pnpm run ci:build:lib'",
  'ci:ensure:build:docs': "sh -c 'test -f dist/hell-docs/browser/index.html || test -f dist/hell-docs/index.html || pnpm run ci:build:docs:prepared'",
  'ci:test:api-report': 'pnpm run build:lib && pnpm run test:api-report',
  'ci:test:api-report:prepared': 'pnpm run test:api-report',
  'ci:build': 'pnpm run build:lib && pnpm run build:docs && pnpm run test:api-report',
  'ci:verify': 'pnpm run ci:test && pnpm run ci:build',
};

function readPackageConsumerContract() {
  const result = spawnSync(process.execPath, ['tools/check-package-consumer.mjs', '--catalog-json'], {
    encoding: 'utf8',
  });
  if (result.error) {
    errors.push(`Unable to read package-consumer catalog: ${result.error.message}`);
    return emptyPackageConsumerContract();
  }
  if (result.status !== 0) {
    errors.push(
      `Unable to read package-consumer catalog: ${result.stderr || result.stdout || `exit ${result.status}`}`,
    );
    return emptyPackageConsumerContract();
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    errors.push(
      `Unable to parse package-consumer catalog JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return emptyPackageConsumerContract();
  }
}

function emptyPackageConsumerContract() {
  return {
    scenarios: [],
    peerGroups: {},
    ciGroups: [],
    scriptGroups: [],
    releaseScenarios: [],
    strictPeerGroups: [],
  };
}

function packageConsumerScriptCommands(contract) {
  return Object.fromEntries(
    contract.scriptGroups.map((group) => [
      `ci:test:package-consumer:${group.name}`,
      `HELL_PACKAGE_CONSUMER_SCENARIOS=${group.scenarios.join(',')} pnpm run ci:test:package-consumer`,
    ]),
  );
}

const e2eBrowsers = ['chromium', 'firefox', 'webkit'];
const e2eGroups = [
  {
    name: 'aria-snapshots-foundations',
    specs: ['e2e/aria-snapshots.spec.ts'],
  },
  {
    name: 'aria-snapshots-overlays-data',
    specs: ['e2e/aria-snapshots.spec.ts'],
  },
  {
    name: 'docs-smoke-foundations',
    specs: ['e2e/docs-axe-smoke.spec.ts'],
  },
  {
    name: 'docs-smoke-surfaces',
    specs: ['e2e/docs-axe-smoke.spec.ts'],
  },
  {
    name: 'controls-a11y',
    specs: [
      'e2e/accordion-a11y-contracts.spec.ts',
      'e2e/checkbox-a11y-contracts.spec.ts',
      'e2e/radio-a11y-contracts.spec.ts',
      'e2e/slider-a11y-contracts.spec.ts',
      'e2e/switch-a11y-contracts.spec.ts',
      'e2e/tabs-a11y-contracts.spec.ts',
      'e2e/tooltip-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'date-selection-a11y',
    specs: [
      'e2e/date-input-a11y-contracts.spec.ts',
      'e2e/date-picker-a11y-contracts.spec.ts',
      'e2e/listbox-a11y-contracts.spec.ts',
      'e2e/time-input-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'overlays-keyboard',
    specs: [
      'e2e/floating-dismissal.spec.ts',
      'e2e/flyout-a11y-contracts.spec.ts',
      'e2e/menu-select-combobox-keyboard.spec.ts',
      'e2e/omnibar-a11y-contracts.spec.ts',
      'e2e/popover-a11y-contracts.spec.ts',
    ],
  },
  {
    name: 'table-resize',
    specs: [
      'e2e/resize-contracts.spec.ts',
      'e2e/table-a11y-contracts.spec.ts',
      'e2e/table-docs-regressions.spec.ts',
    ],
  },
  {
    name: 'behavior-regressions',
    specs: [
      'e2e/component-polish-regressions.spec.ts',
      'e2e/navigation-controls.spec.ts',
      'e2e/ui-behavior.spec.ts',
    ],
  },
];

const splitE2eSpecCounts = new Map([
  ['e2e/aria-snapshots.spec.ts', 2],
  ['e2e/docs-axe-smoke.spec.ts', 2],
]);

const adapterChecks = [
  {
    path: '.github/workflows/ci.yml',
    includes: [
      'pnpm run ci:install',
      'Static contracts',
      'Unit tests',
      'Build and API',
      'Package consumer (${{ matrix.scenario }})',
      'API report',
      'E2E (${{ matrix.group }})',
      'nginx:1.27-alpine',
      'tools/ci/nginx-spa.conf:/etc/nginx/conf.d/default.conf:ro',
      'mcr.microsoft.com/playwright:v1.59.1-noble',
      'docker run --rm --network host',
      'strategy:',
      'needs: build',
      'group:',
      '          - aria-snapshots-foundations',
      '          - aria-snapshots-overlays-data',
      '          - docs-smoke-foundations',
      '          - docs-smoke-surfaces',
      '          - controls-a11y',
      '          - date-selection-a11y',
      '          - overlays-keyboard',
      '          - table-resize',
      '          - behavior-regressions',
      'pnpm run ci:test:static',
      'pnpm run ci:test:unit',
      'HELL_PACKAGE_CONSUMER_SCENARIOS: ${{ matrix.scenarios }}',
      'pnpm run ci:test:package-consumer',
      'HELL_PACKAGE_CONSUMER_SKIP_BUILD: 1',
      'pnpm run ci:ensure:build:lib',
      'pnpm run ci:ensure:build:docs',
      'pnpm run ci:test:api-report:prepared',
      'Restore Playwright image cache',
      'Prepare Playwright image',
      '.ci-cache/playwright-image-v1.59.1-noble.tar',
      'playwright-image-${{ runner.os }}-v1.59.1-noble',
      'docker load --input "${image_tar}"',
      'docker pull "${image}"',
      'docker save --output "${image_tar}" "${image}"',
      '--env HELL_E2E_PROJECTS=ci',
      'PLAYWRIGHT_GROUP: ${{ matrix.group }}',
      'Browser tests',
      '--project="chromium-${PLAYWRIGHT_GROUP}"',
      '--project="firefox-${PLAYWRIGHT_GROUP}"',
      '--project="webkit-${PLAYWRIGHT_GROUP}"',
      'cache: pnpm',
      'cache-dependency-path: pnpm-lock.yaml',
      'actions/cache@v5',
      '.angular/cache',
      'actions/upload-artifact@v7',
      'Ensure built docs',
      'dist-packages-${{ runner.os }}-${{ hashFiles',
      'docs-dist-${{ runner.os }}-${{ hashFiles',
      'playwright-${{ matrix.group }}',
      'test-results/',
      'coverage/',
    ],
  },
  {
    path: '.gitlab-ci.yml',
    includes: [
      'pnpm run ci:install',
      'PLAYWRIGHT_BROWSERS_PATH',
      'PACKAGE_CONSUMER_GROUP',
      'PACKAGE_CONSUMER_SCENARIOS',
      'PLAYWRIGHT_GROUP',
      'HELL_PACKAGE_CONSUMER_SKIP_BUILD',
      'HELL_E2E_PROJECTS: ci',
      'pnpm run ci:test:static',
      'pnpm run ci:test:unit',
      'HELL_PACKAGE_CONSUMER_SCENARIOS="${PACKAGE_CONSUMER_SCENARIOS}" pnpm run ci:test:package-consumer',
      'PACKAGE_CONSUMER_SCENARIOS: primitive-icons-css,button-ui',
      'PACKAGE_CONSUMER_SCENARIOS: composite-css,app-shell',
      'PACKAGE_CONSUMER_SCENARIOS: code-editor,pdf-viewer',
      'pnpm run ci:ensure:build:lib',
      'pnpm run ci:ensure:build:docs',
      'needs:',
      'job: build',
      'artifacts: true',
      'pnpm run ci:test:api-report:prepared',
      'mcr.microsoft.com/playwright:v1.59.1-noble',
      'HOME: /root',
      'PLAYWRIGHT_BROWSERS_PATH: /ms-playwright',
      'pnpm run ci:test:e2e --workers=8 --project="chromium-${PLAYWRIGHT_GROUP}" --project="firefox-${PLAYWRIGHT_GROUP}" --project="webkit-${PLAYWRIGHT_GROUP}"',
      'reports:',
      'junit: test-results/vitest-junit.xml',
      'coverage_format: cobertura',
      'path: coverage/cobertura-coverage.xml',
    ],
  },
  {
    path: 'Dockerfile.ci',
    includes: [
      'FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble AS deps',
      'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
      'pnpm run ci:install',
      'FROM source AS test',
      'FROM source AS build',
      'FROM source AS e2e',
      'FROM source AS verify',
      'pnpm run ci:test',
      'pnpm run ci:build',
      'pnpm run ci:test:e2e',
      'pnpm run ci:verify',
    ],
  },
];

const fileChecks = [
  {
    path: 'vitest.ci.config.ts',
    includes: [
      "const testResultsPath = resolve(workspaceRoot, 'test-results/vitest-junit.xml');",
      "const coveragePath = resolve(workspaceRoot, 'coverage');",
      "const testTimeoutMs = positiveNumber(process.env.HELL_UNIT_TEST_CASE_TIMEOUT_MS, 30_000);",
      "const junitReporter = ['junit', { outputFile: testResultsPath, suiteName: 'hell unit tests' }] as const;",
      "'default'",
      "'hanging-process'",
      "'github-actions'",
      'reporter: [\'text\', \'json-summary\', \'html\', \'lcov\', \'cobertura\']',
      'reportOnFailure: true',
    ],
  },
  {
    path: 'tools/run-ci-tests.mjs',
    includes: [
      "const artifactDirs = ['test-results', 'coverage'];",
      'rmSync(path, { force: true, recursive: true });',
      "args: ['run', 'test:package-consumer', '--', '--minimal-deps']",
      "env: { ...process.env, CI: 'true' }",
      "spawnSync('node', ['tools/ci-summary.mjs']",
      'summary.error',
      'summary.signal',
      'summary.status !== 0',
    ],
  },
  {
    path: 'tools/run-unit-tests.mjs',
    includes: [
      "const junitPath = join(testResultsDir, 'vitest-junit.xml');",
      "const markdownSummaryPath = join(testResultsDir, 'summary.md');",
      "const coverageSummaryPath = join(coverageDir, 'coverage-summary.json');",
      "const coberturaPath = join(coverageDir, 'cobertura-coverage.xml');",
      'const writeCiSummary = rawArgs.includes(\'--ci-summary\');',
      'process.env.HELL_UNIT_TEST_TIMEOUT_MS, 180_000',
      'rmSync(junitPath, { force: true });',
      'rmSync(markdownSummaryPath, { force: true });',
      'rmSync(coverageDir, { force: true, recursive: true });',
      'finish(unitExitCode)',
      "spawnSync('node', ['tools/ci-summary.mjs']",
      'inspectJUnitReport',
      'inspectCoverageArtifacts',
      'coverage summary is stale from a previous run',
      'Cobertura report is stale from a previous run',
      'Cobertura report is malformed',
      'coverageMeetsThresholds',
    ],
  },
  {
    path: 'tools/ci-summary.mjs',
    includes: [
      "const junitPath = join(root, 'test-results/vitest-junit.xml');",
      "const coverageSummaryPath = join(root, 'coverage/coverage-summary.json');",
      "const markdownPath = join(root, 'test-results/summary.md');",
      'const summaryStartedAt = Date.now();',
      'rmSync(markdownPath, { force: true });',
      'writeFileSync(markdownPath, markdown);',
      'validateMarkdownSummary',
      'Could not parse coverage summary',
      'Markdown summary is stale from a previous run',
      'process.env.GITHUB_STEP_SUMMARY',
    ],
  },
  {
    path: 'tools/check-package-consumer.mjs',
    includes: [
      'HELL_PACKAGE_CONSUMER_SKIP_BUILD',
      'using prebuilt packages from dist',
      '--skip-build',
    ],
  },
  {
    path: 'tools/ci/nginx-spa.conf',
    includes: [
      'default_type application/javascript;',
      'location ~* \\.(?:css|js|json|map|wasm|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?)$',
      'wasm',
      'webp',
      'avif',
      'try_files $uri =404;',
      'try_files $uri $uri/ /index.html;',
    ],
  },
  {
    path: 'tools/ci/README.md',
    includes: [
      'test-results/vitest-junit.xml',
      'test-results/summary.md',
      'coverage/cobertura-coverage.xml',
      'coverage/coverage-summary.json',
      'test-results/playwright-report.json',
      'test-results/playwright-html/',
      'test-results/playwright/',
      'HELL_UNIT_TEST_TIMEOUT_MS',
      'HELL_UNIT_TEST_CASE_TIMEOUT_MS',
      'github-actions',
      'cobertura',
      'missing, empty, stale, malformed',
      'require a POSIX shell',
      '`dist/` is a build artifact, not a broad mutable cache',
      'returns 404 for missing static assets',
    ],
  },
  {
    path: 'playwright.config.ts',
    includes: [
      'pnpm --filter hell-docs exec ng serve hell-docs',
      'HELL_E2E_BASE_URL',
      'HELL_E2E_PROJECTS',
      'ciGroups',
      'docs-smoke-foundations',
      'docs-smoke-surfaces',
      'table-resize',
      'retries: process.env.CI ? 1 : 0',
      "['html', { open: 'never', outputFolder: 'test-results/playwright-html' }]",
      "['json', { outputFile: 'test-results/playwright-report.json' }]",
      "outputDir: 'test-results/playwright'",
    ],
  },
  {
    path: 'tools/check-api-reports.mjs',
    includes: [
      'apiReportEntrypoints',
      'localBuild',
      'reportFolder',
      'reportTempFolder',
    ],
  },
  {
    path: 'tools/release-evidence-policy.mjs',
    includes: [
      'releaseCandidateConsumerScenarios',
      'root-core',
      'core',
      'testing',
      'button-ui',
      'button',
      'primitive-icons-css',
      'composite-css',
      'app-shell',
      'audio-player',
      'audio-transcript',
      'table',
      'table-tanstack',
      'table-tanstack-virtual',
      'no-legacy-alias',
      'code-editor',
      'pdf-viewer',
      'apiReportEntrypoints',
      '@hell-ui/angular/core',
      '@hell-ui/angular/internal/hotkeys',
      '@hell-ui/angular/input',
      '@hell-ui/angular/dialpad',
      '@hell-ui/angular/testing',
      'hell-ui-angular-internal-hotkeys.api.md',
      'internal-report-exception',
      'requiredFullReleaseTasks',
    ],
  },
  {
    path: 'tools/package-pack-audit.mjs',
    includes: [
      'source map',
      'secret-bearing file',
      'test artifact or test source',
      'workspace node_modules leak',
      'unexpected worker asset',
      'sideEffects must include **/*.css',
      'publishConfig.provenance',
      'Secondary entry point',
      '@hell-ui/angular peerDependencies',
      '@hell-ui/pdf-viewer peerDependencies',
      '@hell-ui/pdf-viewer must pin pdfjs-dist peer',
      'legacy table alias files',
      'Package pack audit self-test',
    ],
  },
  {
    path: 'tools/check-changelog.mjs',
    includes: [
      'changelogPath',
      'semverPolicyPath',
      'packageManifestPath',
      'changelogRequiredPolicyTerms',
      'releaseEvidencePolicyDocPath',
    ],
  },
  {
    path: 'tools/release-dry-run.mjs',
    includes: [
      '--fast',
      '--full',
      'releaseEvidenceDirectory',
      'Git commit:',
      'Git tracked changes:',
      'test:architecture',
      'test:ci-contract',
      'test:changelog',
      'test:unit',
      'build:lib',
      'test:package-pack',
      'test:package-consumer',
      'test:api-report',
      'build:docs',
    ],
  },
  {
    path: 'tools/production-ready-check.mjs',
    includes: [
      'production-readiness-gate',
      'productionReadinessStatus',
      'package-consumer',
      'api',
      'accessibility',
      'docs-budgets',
      'pack-audit',
      'release-dry-run',
      'test-results/release-evidence',
      'releaseDryRunEvidence',
      'requiredScenarios',
      'playwrightJsonReport',
      'allE2eSpecs',
      'requiredPlaywrightProjects',
      'requiredApiReportPaths',
      'requiredFullReleaseTasks',
      'pdf-viewer',
      'modifiedAfterCurrentGitCommit',
    ],
  },
  {
    path: 'CHANGELOG.md',
    includes: [
      'Keep a Changelog',
      'docs/release/semver-policy.md',
      'production-readiness checklist',
      'package-consumer',
    ],
  },
  {
    path: 'docs/release/semver-policy.md',
    includes: [
      'alpha',
      'internal beta',
      'public beta',
      'stable',
      'SemVer',
      'CHANGELOG.md',
      'release:dry-run',
    ],
  },
  {
    path: 'docs/release/release-evidence-policy.md',
    includes: [
      'Release-candidate package-consumer scenarios',
      'PDF viewer split-package exception',
      'Internal hotkeys API report exception',
      'tools/release-evidence-policy.mjs',
      'production-readiness checklist',
      'pdf-viewer',
      '@hell-ui/angular/internal/hotkeys',
      'hell-ui-angular-internal-hotkeys.api.md',
    ],
  },
  {
    path: 'docs/release/production-readiness-checklist.md',
    includes: [
      'production-readiness-gate',
      'internal beta until the production-readiness gate passes',
      'package-consumer',
      'api',
      'accessibility',
      'docs-budgets',
      'pack-audit',
      'release-dry-run',
      'test-results/playwright-report.json',
      'releaseDryRunEvidence',
      'requiredScenarios',
      'pdf-viewer',
      'hell-ui-angular-internal-hotkeys.api.md',
      'allE2eSpecs',
      'modifiedAfterCurrentGitCommit',
      'clean tracked tree',
      'Critical gap',
      'criticalGap: true',
      'pdf-viewer',
    ],
  },
  {
    path: 'docs/release/docs-budget-policy.md',
    includes: [
      'docs-budget-policy',
      'Docs shell / global styles',
      'Individual docs page owner',
      'acceptedMaximum',
      'accepted warning',
      'regression',
      'lazy-route import graph guard',
    ],
  },
  {
    path: 'docs/release/npm-publishing.md',
    includes: [
      'npm trusted publishing',
      'AntonPieper',
      '@hell-ui/pdf-viewer',
      'npm-publish.yml',
      'npm-publish',
      'Require two-factor authentication and disallow tokens',
      'release-dry-run-evidence',
      'id-token: write',
      '@hell-ui/pdf-viewer',
      'both package tarballs',
    ],
  },
];

const adapterForbiddenPatterns = [
  { pattern: /\bng\s+test\b/, message: 'CI adapters must call ci:test instead of ng test.' },
  { pattern: /pnpm\s+exec\s+playwright\s+install\s+--with-deps\s+chromium\s+firefox\s+webkit/, message: 'CI adapters must call ci:playwright instead of pnpm exec playwright install.' },
  { pattern: /\bng\s+build\b/, message: 'CI adapters must call pnpm run ci:build instead of ng build.' },
  { pattern: /\b(?:pnpm\s+(?:exec\s+)?vitest|npx\s+vitest|vitest\s+run)\b/, message: 'CI adapters must not inline Vitest commands.' },
  { pattern: /\btest:architecture\b/, message: 'CI adapters must not know internal check scripts.' },
  { pattern: /--coverage\b/, message: 'CI adapters must not own coverage flags.' },
  { pattern: /\b(?:shard|total_shards|PLAYWRIGHT_SHARD)\b|--shard\b/, message: 'CI adapters must use semantic E2E groups instead of numeric shards.' },
  { pattern: /serve-built-docs|HELL_E2E_USE_BUILT_DOCS|ci:test:e2e:built/, message: 'CI adapters must use official Angular dev server or nginx serving instead of custom servers.' },
  { pattern: /install-playwright-webkit-deps|webkit-linux-deps|HELL_WEBKIT_DEPS_CACHE_DIR|webkit-system-deps|MiniBrowser/, message: 'CI adapters must use the official Playwright image for browser dependencies.' },
  { pattern: /ci:playwright:cached/, message: 'CI adapters must use official Playwright install commands when caching browsers.' },
];

for (const path of requiredFiles) {
  if (!existsSync(path)) {
    errors.push(`Missing ${path}`);
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
for (const [scriptName, expectedCommand] of Object.entries(requiredScripts)) {
  if (packageJson.scripts?.[scriptName] !== expectedCommand) {
    errors.push(`package.json script ${scriptName} must be: ${expectedCommand}`);
  }
}

for (const obsoleteScript of [
  'ci:playwright:cached:chromium',
  'ci:playwright:cached:firefox',
  'ci:playwright:cached:webkit',
  'ci:playwright:webkit-linux-deps',
  'ci:test:e2e:built',
]) {
  if (packageJson.scripts?.[obsoleteScript]) {
    errors.push(`package.json must not define obsolete script ${obsoleteScript}`);
  }
}

for (const check of adapterChecks) {
  if (!existsSync(check.path)) {
    continue;
  }

  const content = readFileSync(check.path, 'utf8');
  for (const expected of check.includes) {
    if (!content.includes(expected)) {
      errors.push(`${check.path} must include ${expected}`);
    }
  }

  for (const forbidden of adapterForbiddenPatterns) {
    if (forbidden.pattern.test(content)) {
      errors.push(`${check.path}: ${forbidden.message}`);
    }
  }
}

for (const check of fileChecks) {
  if (!existsSync(check.path)) {
    continue;
  }

  const content = readFileSync(check.path, 'utf8');
  for (const expected of check.includes) {
    if (!content.includes(expected)) {
      errors.push(`${check.path} must include ${expected}`);
    }
  }
}

checkRemovedBrittleCiHelpers();
checkPackageConsumerCatalogDrift();
checkSemanticE2eGroups();
checkPackageConsumerPackAuditOrder();
checkProviderPackageConsumerScenarios();
checkGitLabDistCachePolicy();
checkNpmPublishWorkflow();
checkPublishedPackageMetadata();
checkDocsBudgetPolicy();

function checkPackageConsumerCatalogDrift() {
  const scenarioNames = new Set(packageConsumerContract.scenarios.map((scenario) => scenario.name));
  const peerGroupNames = new Set(Object.keys(packageConsumerContract.peerGroups));
  const scenarioPeerGroups = new Set();

  for (const scenario of packageConsumerContract.scenarios) {
    if (!peerGroupNames.has(scenario.peerGroup)) {
      errors.push(`Package-consumer scenario ${scenario.name} references unknown peer group ${scenario.peerGroup}.`);
    }
    scenarioPeerGroups.add(scenario.peerGroup);
  }

  for (const peerGroup of peerGroupNames) {
    if (!scenarioPeerGroups.has(peerGroup)) {
      errors.push(`Package-consumer catalog must cover peer group ${peerGroup}.`);
    }
  }

  assertScenarioGroupsReferenceKnownScenarios(
    'package-consumer catalog CI group',
    packageConsumerContract.ciGroups,
    scenarioNames,
  );
  assertScenarioGroupsCoverAllOnce(
    'package-consumer catalog CI group',
    packageConsumerContract.ciGroups,
    scenarioNames,
  );
  assertScenarioGroupsReferenceKnownScenarios(
    'package-consumer catalog script group',
    packageConsumerContract.scriptGroups,
    scenarioNames,
  );
  assertScenarioListReferencesKnownScenarios(
    'package-consumer catalog release scenario',
    packageConsumerContract.releaseScenarios,
    scenarioNames,
  );
  assertStrictPeerGroupsCoverScenarios(packageConsumerContract.strictPeerGroups, scenarioNames);

  assertScenarioGroupsEqual(
    'GitHub Actions package-consumer matrix',
    readGithubPackageConsumerGroups(),
    packageConsumerContract.ciGroups,
  );
  assertScenarioGroupsEqual(
    'GitLab package-consumer matrix',
    readGitlabPackageConsumerGroups(),
    packageConsumerContract.ciGroups,
  );
  assertScenarioListEqual(
    'tools/release-evidence-policy.mjs release package-consumer scenarios',
    releaseCandidateConsumerScenarioNames,
    packageConsumerContract.releaseScenarios,
  );
  if (!readFileSync('tools/release-dry-run.mjs', 'utf8').includes('releaseCandidateConsumerScenarioNames')) {
    errors.push('tools/release-dry-run.mjs must use releaseCandidateConsumerScenarioNames.');
  }
  if (
    !readFileSync('tools/production-ready-check.mjs', 'utf8').includes(
      'releaseCandidateConsumerScenarioNames',
    )
  ) {
    errors.push('tools/production-ready-check.mjs must use releaseCandidateConsumerScenarioNames.');
  }
}

function readGithubPackageConsumerGroups() {
  const path = '.github/workflows/ci.yml';
  if (!existsSync(path)) return [];

  const jobBlock = yamlJobBlock(readFileSync(path, 'utf8'), 'package-consumer');
  const groups = [];
  let current = null;

  for (const line of jobBlock.split(/\r?\n/)) {
    const groupMatch = line.match(/^\s*-\s+scenario:\s*([^#\s]+)/);
    if (groupMatch) {
      if (current) groups.push(current);
      current = { name: groupMatch[1], scenarios: [] };
      continue;
    }

    const scenariosMatch = line.match(/^\s+scenarios:\s*([^#]+?)\s*$/);
    if (current && scenariosMatch) {
      current.scenarios = parseScenarioCsv(scenariosMatch[1]);
    }
  }

  if (current) groups.push(current);
  return groups;
}

function readGitlabPackageConsumerGroups() {
  const path = '.gitlab-ci.yml';
  if (!existsSync(path)) return [];

  const groups = [];
  let current = null;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const groupMatch = line.match(/^\s*-\s+PACKAGE_CONSUMER_GROUP:\s*([^#\s]+)/);
    if (groupMatch) {
      if (current) groups.push(current);
      current = { name: groupMatch[1], scenarios: [] };
      continue;
    }

    const scenariosMatch = line.match(/^\s+PACKAGE_CONSUMER_SCENARIOS:\s*([^#]+?)\s*$/);
    if (current && scenariosMatch) {
      current.scenarios = parseScenarioCsv(scenariosMatch[1]);
    }
  }

  if (current) groups.push(current);
  return groups;
}

function yamlJobBlock(content, jobName) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `  ${jobName}:`);
  if (start === -1) {
    errors.push(`GitHub Actions workflow must define ${jobName} job.`);
    return '';
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join('\n');
}

function assertScenarioGroupsEqual(label, actualGroups, expectedGroups) {
  const actualByName = new Map();
  const expectedByName = new Map(expectedGroups.map((group) => [group.name, group]));

  for (const actual of actualGroups) {
    if (actualByName.has(actual.name)) {
      errors.push(`${label} must not duplicate group ${actual.name}.`);
      continue;
    }
    actualByName.set(actual.name, actual);
  }

  for (const expected of expectedGroups) {
    const actual = actualByName.get(expected.name);
    if (!actual) {
      errors.push(`${label} must include group ${expected.name}.`);
      continue;
    }

    assertScenarioListEqual(`${label} group ${expected.name}`, actual.scenarios, expected.scenarios);
  }

  for (const actual of actualGroups) {
    if (!expectedByName.has(actual.name)) {
      errors.push(`${label} must not include unknown group ${actual.name}.`);
    }
  }
}

function assertScenarioGroupsReferenceKnownScenarios(label, groups, scenarioNames) {
  const groupNames = new Set();
  for (const group of groups) {
    if (groupNames.has(group.name)) {
      errors.push(`${label} must not duplicate group ${group.name}.`);
    }
    groupNames.add(group.name);
    assertScenarioListReferencesKnownScenarios(`${label} ${group.name}`, group.scenarios, scenarioNames);
  }
}

function assertScenarioGroupsCoverAllOnce(label, groups, scenarioNames) {
  const seen = new Map();
  for (const group of groups) {
    for (const scenario of group.scenarios) {
      const previousGroup = seen.get(scenario);
      if (previousGroup) {
        errors.push(`${label} must not list ${scenario} in both ${previousGroup} and ${group.name}.`);
      }
      seen.set(scenario, group.name);
    }
  }

  for (const scenario of scenarioNames) {
    if (!seen.has(scenario)) {
      errors.push(`${label} must include scenario ${scenario}.`);
    }
  }
}

function assertStrictPeerGroupsCoverScenarios(strictPeerGroups, scenarioNames) {
  const seen = new Set();
  for (const group of strictPeerGroups) {
    if (!Array.isArray(group.peerGroups) || group.peerGroups.length === 0) {
      errors.push(`Package-consumer strict peer group ${group.name} must name peer groups.`);
    }
    assertScenarioListReferencesKnownScenarios(
      `package-consumer strict peer group ${group.name}`,
      group.scenarios,
      scenarioNames,
    );
    for (const scenario of group.scenarios) seen.add(scenario);
  }

  for (const scenario of scenarioNames) {
    if (!seen.has(scenario)) {
      errors.push(`Package-consumer strict peer groups must include scenario ${scenario}.`);
    }
  }
}

function assertScenarioListReferencesKnownScenarios(label, names, scenarioNames) {
  for (const name of names) {
    if (!scenarioNames.has(name)) {
      errors.push(`${label} references unknown package-consumer scenario ${name}.`);
    }
  }
}

function assertScenarioListEqual(label, actual, expected) {
  if (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  ) {
    return;
  }

  errors.push(`${label} must be ${formatList(expected)}; found ${formatList(actual)}.`);
}

function readJsStringArrayAfterMarker(path, marker) {
  if (!existsSync(path)) return [];

  const content = readFileSync(path, 'utf8');
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    errors.push(`${path} must include ${marker}.`);
    return [];
  }

  const arrayStart = content.indexOf('[', markerIndex);
  const arrayEnd = content.indexOf(']', arrayStart);
  if (arrayStart === -1 || arrayEnd === -1) {
    errors.push(`${path} must include a string array after ${marker}.`);
    return [];
  }

  return [...content.slice(arrayStart, arrayEnd).matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function parseScenarioCsv(value) {
  return value
    .split(',')
    .map((scenario) => scenario.trim())
    .filter(Boolean);
}

function formatList(values) {
  return values.length ? values.join(',') : '(none)';
}

function checkRemovedBrittleCiHelpers() {
  for (const path of ['tools/serve-built-docs.mjs', 'tools/install-playwright-webkit-deps.sh']) {
    if (existsSync(path)) {
      errors.push(`${path} must be removed in favor of official Angular/Playwright CI patterns.`);
    }
  }
}

function checkSemanticE2eGroups() {
  const githubWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
  const gitlabWorkflow = readFileSync('.gitlab-ci.yml', 'utf8');
  const playwrightConfig = readFileSync('playwright.config.ts', 'utf8');
  const e2eSpecFiles = readdirSync('e2e')
    .filter((file) => file.endsWith('.spec.ts'))
    .map((file) => `e2e/${file}`)
    .sort();
  const groupedSpecs = e2eGroups.flatMap((group) => group.specs);
  const groupedSpecCounts = new Map();

  for (const spec of groupedSpecs) {
    groupedSpecCounts.set(spec, (groupedSpecCounts.get(spec) ?? 0) + 1);
  }

  for (const spec of e2eSpecFiles) {
    if (!groupedSpecCounts.has(spec)) {
      errors.push(`E2E spec ${spec} must be assigned to a semantic CI group.`);
    }
  }

  for (const [spec, count] of groupedSpecCounts) {
    if (!e2eSpecFiles.includes(spec)) {
      errors.push(`E2E group references missing spec ${spec}.`);
    }

    const expectedCount = splitE2eSpecCounts.get(spec) ?? 1;
    if (count !== expectedCount) {
      errors.push(`E2E spec ${spec} must appear in ${expectedCount} semantic CI group(s), found ${count}.`);
    }
  }

  for (const browser of e2eBrowsers) {
    const browserProject = `--project="${browser}-\${PLAYWRIGHT_GROUP}"`;
    if (!githubWorkflow.includes(browserProject)) {
      errors.push(`GitHub Actions E2E group job must run ${browser}.`);
    }

    if (!gitlabWorkflow.includes(browserProject)) {
      errors.push(`GitLab E2E group job must run ${browser}.`);
    }
  }

  for (const group of e2eGroups) {
    if (countOccurrences(githubWorkflow, `          - ${group.name}`) !== 1) {
      errors.push(`GitHub Actions E2E matrix must include ${group.name} once.`);
    }

    if (countOccurrences(gitlabWorkflow, `          - ${group.name}`) !== 1) {
      errors.push(`GitLab E2E matrix must include ${group.name} once.`);
    }

    if (!playwrightConfig.includes(`name: '${group.name}'`)) {
      errors.push(`playwright.config.ts must define semantic E2E group ${group.name}.`);
    }

    for (const spec of group.specs) {
      const basename = spec.replace('e2e/', '');
      if (!playwrightConfig.includes(`'${basename}'`)) {
        errors.push(`playwright.config.ts group ${group.name} must include ${basename}.`);
      }
    }
  }

  for (const forbiddenFilter of ['PLAYWRIGHT_ARGS', '--grep', '--grep-invert']) {
    if (githubWorkflow.includes(forbiddenFilter) || gitlabWorkflow.includes(forbiddenFilter)) {
      errors.push(`CI E2E adapters must select named Playwright projects without ${forbiddenFilter}.`);
    }
  }

  for (const browserMatrixPattern of [
    { label: 'matrix.browser', pattern: /matrix\.browser/ },
    { label: 'PLAYWRIGHT_PROJECT', pattern: /\bPLAYWRIGHT_PROJECT\b/ },
    { label: 'PLAYWRIGHT_BROWSER', pattern: /\bPLAYWRIGHT_BROWSER\b/ },
    { label: '~/.cache/ms-playwright', pattern: /~\/\.cache\/ms-playwright/ },
    { label: 'actions/cache/restore@*', pattern: /actions\/cache\/restore@/ },
    { label: 'actions/cache/save@*', pattern: /actions\/cache\/save@/ },
  ]) {
    if (browserMatrixPattern.pattern.test(githubWorkflow) || browserMatrixPattern.pattern.test(gitlabWorkflow)) {
      errors.push(`CI E2E adapters must not reintroduce split browser setup via ${browserMatrixPattern.label}.`);
    }
  }

  for (const spec of e2eSpecFiles) {
    if (githubWorkflow.includes(spec) || gitlabWorkflow.includes(spec)) {
      errors.push(`CI E2E adapters must select semantic Playwright projects, not filter ${spec}.`);
    }
  }
}

function countOccurrences(content, needle) {
  if (!needle) return 0;
  return content.split(needle).length - 1;
}

function checkPackageConsumerPackAuditOrder() {
  const path = 'tools/check-package-consumer.mjs';
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  const packHellIndex = content.indexOf("packBuiltPackage(distHell, 'pack-core')");
  const packPdfViewerIndex = content.indexOf("packBuiltPackage(distPdfViewer, 'pack-pdf-viewer')");
  const auditMarkers = [
    'auditPackedPackage({ tarball: packedHell.tarball });',
    'auditPackedPackage({ tarball: packedPdfViewer.tarball });',
  ];
  const auditIndexes = auditMarkers.map((marker) => content.indexOf(marker));
  const selectScenariosIndex = content.indexOf('const enabledScenarios = selectScenarios');
  const consumerScenarioIndex = content.indexOf('await runConsumerScenarioGroup(group);');

  if (packHellIndex === -1 || packPdfViewerIndex === -1) {
    errors.push('package-consumer must pack both @hell-ui/angular and @hell-ui/pdf-viewer before audit');
    return;
  }

  for (const [index, auditIndex] of auditIndexes.entries()) {
    if (auditIndex === -1) {
      errors.push(`package-consumer must run package pack audit marker: ${auditMarkers[index]}`);
      return;
    }

    const packIndex = index === 0 ? packHellIndex : packPdfViewerIndex;
    if (packIndex > auditIndex) {
      errors.push('package-consumer must run package pack audit after pnpm pack');
    }
  }

  if (selectScenariosIndex === -1 || consumerScenarioIndex === -1) {
    errors.push('package-consumer scenario selection or loop marker is missing');
    return;
  }

  for (const auditIndex of auditIndexes) {
    if (auditIndex > selectScenariosIndex || auditIndex > consumerScenarioIndex) {
      errors.push('package-consumer must run package pack audit before consumer install/build scenarios');
    }
  }
}

function checkProviderPackageConsumerScenarios() {
  const knownScenarios = readPackageConsumerScenarioNames();
  for (const path of ['.github/workflows/ci.yml', '.gitlab-ci.yml']) {
    if (!existsSync(path)) continue;

    const content = readFileSync(path, 'utf8');
    const scenarioLists = [
      ...content.matchAll(/\bscenarios:\s*([a-z0-9-]+(?:,[a-z0-9-]+)*)/g),
      ...content.matchAll(/\bPACKAGE_CONSUMER_SCENARIOS:\s*([a-z0-9-]+(?:,[a-z0-9-]+)*)/g),
    ];

    for (const match of scenarioLists) {
      const selected = match[1].split(',').map((name) => name.trim()).filter(Boolean);
      for (const name of selected) {
        if (!knownScenarios.has(name)) {
          errors.push(`${path} references unknown package-consumer scenario ${name}.`);
        }
      }
    }
  }
}

function readPackageConsumerScenarioNames() {
  const content = readFileSync('tools/check-package-consumer.mjs', 'utf8');
  const names = new Set();

  for (const match of content.matchAll(/\bname:\s*'([^']+)'/g)) {
    names.add(match[1]);
  }

  for (const match of content.matchAll(/\baliases:\s*\[([^\]]*)\]/g)) {
    for (const alias of match[1].matchAll(/'([^']+)'/g)) {
      names.add(alias[1]);
    }
  }

  return names;
}

function checkGitLabDistCachePolicy() {
  const path = '.gitlab-ci.yml';
  if (!existsSync(path)) return;

  const defaultBlock = readFileSync(path, 'utf8').split('\nstatic:')[0] ?? '';
  if (/^\s+-\s+dist\/\s*$/m.test(defaultBlock)) {
    errors.push(`${path} default cache must not store dist/; build output must come from artifacts or content-addressed restores.`);
  }
}

function checkNpmPublishWorkflow() {
  const path = '.github/workflows/npm-publish.yml';
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  const required = [
    'needs: [release-dry-run, build-package]',
    'id-token: write',
    'actions/upload-artifact',
    'actions/download-artifact',
    'release-dry-run-evidence',
    'release-package',
    'pnpm/action-setup',
    'pnpm run release:dry-run -- --full',
    'pnpm run test:package-pack',
    'pnpm --dir ./dist/hell pack --pack-destination ../../release-package',
    'pnpm --dir ./dist/hell-pdf-viewer pack --pack-destination ../../release-package',
    'test "$tarball_count" = "2"',
    '@hell-ui/angular',
    '@hell-ui/pdf-viewer',
    'HELL_RELEASE_TARBALLS',
    'pnpm publish "$tarball" --access public --provenance --no-git-checks',
  ];

  for (const expected of required) {
    if (!content.includes(expected)) {
      errors.push(`${path} must include ${expected}`);
    }
  }

  for (const forbidden of ['NPM_TOKEN', 'NODE_AUTH_TOKEN']) {
    if (content.includes(forbidden)) {
      errors.push(`${path} must not depend on ${forbidden} for trusted publishing.`);
    }
  }

  const publishJob = content.split('\n  publish:')[1] ?? '';
  const publishJobForbiddenPatterns = [
    { label: 'checkout step', pattern: /actions\/checkout/ },
    { label: 'legacy pack command', pattern: /\bnpm\s+pack\b/ },
    { label: 'legacy publish command', pattern: /\bnpm\s+publish\b/ },
  ];
  for (const forbidden of publishJobForbiddenPatterns) {
    if (forbidden.pattern.test(publishJob)) {
      errors.push(`${path} publish job must stay minimal after id-token permission; found ${forbidden.label}.`);
    }
  }
}

function checkPublishedPackageMetadata() {
  for (const [path, directory] of [
    ['packages/angular/package.json', 'packages/angular'],
    ['packages/pdf-viewer/package.json', 'packages/pdf-viewer'],
  ]) {
    if (!existsSync(path)) continue;

    const packageJson = JSON.parse(readFileSync(path, 'utf8'));
    if (packageJson.repository?.url !== 'git+https://github.com/AntonPieper/hell-ui.git') {
      errors.push(`${path} repository.url must match the GitHub repository used for trusted publishing.`);
    }
    if (packageJson.repository?.directory !== directory) {
      errors.push(`${path} repository.directory must be ${directory}.`);
    }
    if (packageJson.publishConfig?.registry !== 'https://registry.npmjs.org/') {
      errors.push(`${path} publishConfig.registry must be the public npm registry.`);
    }
    if (packageJson.publishConfig?.access !== 'public') {
      errors.push(`${path} publishConfig.access must be public.`);
    }
    if (packageJson.publishConfig?.provenance !== true) {
      errors.push(`${path} publishConfig.provenance must be true.`);
    }
  }
}

function checkDocsBudgetPolicy() {
  const docsAngularJsonPath = 'apps/docs/angular.json';
  if (!existsSync(docsAngularJsonPath)) return;

  const angularJson = JSON.parse(readFileSync(docsAngularJsonPath, 'utf8'));
  const budgets =
    angularJson.projects?.['hell-docs']?.architect?.build?.configurations?.production?.budgets ?? [];
  requireDocsBudget(budgets, 'initial');
  requireDocsBudget(budgets, 'anyComponentStyle');

  const policyRead = readDocsBudgetPolicy();
  const policyContent = existsSync(DOCS_BUDGET_POLICY_PATH)
    ? readFileSync(DOCS_BUDGET_POLICY_PATH, 'utf8')
    : '';

  errors.push(...policyRead.errors);
  errors.push(...validateDocsBudgetPolicy(policyRead.policy, budgets));
  errors.push(...validateDocsBudgetPolicyMarkdown(policyContent, policyRead.policy));
  checkDocsBudgetDiagnosis(policyRead.policy, budgets);

  const buildDocsScript = packageJson.scripts?.['build:docs'] ?? '';
  if (!buildDocsScript.includes('node tools/docs-bundle-budget-report.mjs --check --summary-only')) {
    errors.push('build:docs must classify accepted docs budget warnings vs regressions after the Angular build.');
  }
}

function requireDocsBudget(budgets, type) {
  if (!budgets.some((budget) => budget.type === type)) {
    errors.push(`apps/docs/angular.json production budgets must include ${type}.`);
  }
}

function checkDocsBudgetDiagnosis(policy, budgets) {
  const path = 'docs/release/docs-bundle-budget-diagnosis.md';
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  const rows = readBudgetStatusRows(content);
  if (rows.length === 0) {
    errors.push(`${path} must include a generated budget status table.`);
  }

  const acceptedDetailRows = readAcceptedWarningDetailRows(content);
  const acceptedDetailRowsByType = new Map();
  for (const detail of acceptedDetailRows) {
    const type = budgetTypeForReportLabel(detail.label);
    if (!type) {
      errors.push(`${path} accepted warning details table documents unknown budget ${detail.label}.`);
      continue;
    }
    if (acceptedDetailRowsByType.has(type)) {
      errors.push(`${path} accepted warning details table documents duplicate budget ${detail.label}.`);
      continue;
    }
    acceptedDetailRowsByType.set(type, detail);
  }

  const acceptedWarnings = policy?.acceptedWarnings ?? [];
  const seenWarningTypes = new Set();
  const seenAcceptedDetailTypes = new Set();
  const rowsByType = new Map();

  for (const row of rows) {
    const type = budgetTypeForReportLabel(row.label);
    if (!type) {
      errors.push(`${path} budget status table documents unknown budget ${row.label}.`);
      continue;
    }

    if (rowsByType.has(type)) {
      errors.push(`${path} budget status table documents duplicate budget ${row.label}.`);
      continue;
    }
    rowsByType.set(type, row);

    const currentBytes = parseReportSize(row.current);
    const warningBytes = parseReportSize(row.warning);
    if (!Number.isFinite(currentBytes) || !Number.isFinite(warningBytes)) {
      errors.push(`${path} budget row ${row.label} must include parseable current and warning sizes.`);
      continue;
    }

    const acceptedWarning = acceptedWarnings.find((warning) => warning.type === type);
    const isWarning = currentBytes > warningBytes;
    if (row.status.includes('regression')) {
      errors.push(`${path} records a ${row.label} budget regression; fix it or document a narrow accepted warning.`);
    }

    if (!isWarning) {
      if (acceptedWarning) {
        errors.push(`${path} shows ${row.label} within budget; remove stale accepted warning ${type} from docs-budget-policy.`);
      }
      continue;
    }

    seenWarningTypes.add(type);
    if (!acceptedWarning) {
      errors.push(`${path} shows a ${row.label} warning, but docs-budget-policy has no accepted warning for ${type}.`);
      continue;
    }

    const acceptedMaximumBytes = parseBudgetSize(acceptedWarning.acceptedMaximum);
    if (!Number.isFinite(acceptedMaximumBytes)) {
      errors.push(`docs-budget-policy accepted warning ${type} must include a parseable acceptedMaximum.`);
      continue;
    }
    if (currentBytes > acceptedMaximumBytes) {
      errors.push(`${path} ${row.label} is ${row.current}, above accepted warning ceiling ${acceptedWarning.acceptedMaximum}.`);
    }
    if (!row.status.includes('accepted warning')) {
      errors.push(`${path} ${row.label} warning must be classified as accepted or regression in the budget status table.`);
    }

    const detail = acceptedDetailRowsByType.get(type);
    if (!detail) {
      errors.push(`${path} accepted warning details must include ${row.label}.`);
      continue;
    }

    seenAcceptedDetailTypes.add(type);
    compareReportSize(detail.current, row.current, `${path} ${row.label} accepted warning current size`);
    compareReportSize(
      detail.acceptedCeiling,
      acceptedWarning.acceptedMaximum,
      `${path} ${row.label} accepted warning ceiling`,
    );
    compareReportText(detail.owner, acceptedWarning.owner, `${path} ${row.label} accepted warning owner`);
    compareReportText(detail.rationale, acceptedWarning.rationale, `${path} ${row.label} accepted warning rationale`);
    compareReportText(detail.evidence, acceptedWarning.evidence, `${path} ${row.label} accepted warning evidence`);
    compareReportText(detail.followUp, acceptedWarning.followUp, `${path} ${row.label} accepted warning follow-up`);
    compareReportText(detail.expiry, acceptedWarning.expiresWhen, `${path} ${row.label} accepted warning expiry`);
  }

  for (const warning of acceptedWarnings) {
    if (!seenWarningTypes.has(warning.type)) {
      errors.push(`${path} does not show current warning ${warning.type}; remove or refresh accepted warning policy.`);
    }
  }

  for (const budget of budgets) {
    if (!rowsByType.has(budget.type)) {
      errors.push(`${path} budget status table must include the configured ${budget.type} budget.`);
    }
  }

  for (const type of acceptedDetailRowsByType.keys()) {
    if (!seenAcceptedDetailTypes.has(type)) {
      errors.push(`${path} accepted warning details include ${type}, but the budget status table does not show a current accepted warning.`);
    }
  }
}

function readBudgetStatusRows(content) {
  return readMarkdownRows(content, '| Budget | Current | Warning | Error | Status |').map((cells) => ({
    label: cells[0],
    current: cells[1],
    warning: cells[2],
    error: cells[3],
    status: cells[4],
  }));
}

function readAcceptedWarningDetailRows(content) {
  return readMarkdownRows(
    content,
    '| Budget | Current | Accepted ceiling | Owner | Rationale | Evidence | Follow-up | Expiry |',
  ).map((cells) => ({
    label: cells[0],
    current: cells[1],
    acceptedCeiling: cells[2],
    owner: cells[3],
    rationale: cells[4],
    evidence: cells[5],
    followUp: cells[6],
    expiry: cells[7],
  }));
}

function readMarkdownRows(content, header) {
  const lines = content.split('\n');
  const headerIndex = lines.findIndex((line) => line.trim() === header);
  if (headerIndex === -1) return [];

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('| ')) break;
    const cells = splitMarkdownRow(line);
    if (cells.length === 0) continue;
    rows.push(cells);
  }
  return rows;
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function budgetTypeForReportLabel(label) {
  if (label === 'Initial bundle') return 'initial';
  if (label === 'Any component style') return 'anyComponentStyle';
  return null;
}

function parseReportSize(value) {
  return parseBudgetSize(String(value).replace(/\s+largest$/, ''));
}

function compareReportSize(actual, expected, label) {
  const actualBytes = parseReportSize(actual);
  const expectedBytes = parseReportSize(expected);
  if (!Number.isFinite(actualBytes)) {
    errors.push(`${label} is not a parseable size.`);
    return;
  }
  if (!Number.isFinite(expectedBytes)) {
    errors.push(`${label} expected value is not a parseable size.`);
    return;
  }
  if (Math.abs(actualBytes - expectedBytes) > 0.1) {
    errors.push(`${label} (${actual}) must match ${expected}.`);
  }
}

function compareReportText(actual, expected, label) {
  if (normalizeReportText(actual) !== normalizeReportText(expected)) {
    errors.push(`${label} must match docs-budget-policy.`);
  }
}

function normalizeReportText(value) {
  return String(value ?? '')
    .replace(/^`|`$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

if (errors.length > 0) {
  console.error('CI contract failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CI contract ok.');
