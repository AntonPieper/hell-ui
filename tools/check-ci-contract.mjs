import { existsSync, readFileSync, readdirSync } from 'node:fs';

import {
  parseBudgetSize,
  readDocsBudgetPolicy,
  validateDocsBudgetPolicy,
} from './docs-budget-policy.mjs';

const requiredFiles = [
  '.github/workflows/ci.yml',
  '.github/workflows/npm-publish.yml',
  '.gitlab-ci.yml',
  'Dockerfile.ci',
  'vitest.ci.config.ts',
  'tools/run-ci-tests.mjs',
  'tools/run-unit-tests.mjs',
  'tools/ci/nginx-spa.conf',
  'tools/check-package-consumer.mjs',
  'tools/check-package-pack.mjs',
  'tools/check-api-reports.mjs',
  'tools/check-changelog.mjs',
  'tools/release-dry-run.mjs',
  'tools/production-ready-check.mjs',
  'tools/package-pack-audit.mjs',
  'tools/ci-summary.mjs',
  'tools/docs-budget-policy.mjs',
  'CHANGELOG.md',
  'docs/release/npm-publishing.md',
  'docs/release/semver-policy.md',
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
  'build:docs': 'node tools/setup-docs-hell-package-alias.mjs && ng build hell-docs && node tools/docs-bundle-budget-report.mjs --check --summary-only',
  'release:dry-run': 'node tools/release-dry-run.mjs',
  'production-ready:check': 'node tools/production-ready-check.mjs',
  'ci:test': 'node tools/run-ci-tests.mjs',
  'ci:playwright': 'pnpm exec playwright install --with-deps chromium firefox webkit',
  'ci:playwright:chromium': 'pnpm exec playwright install --with-deps chromium',
  'ci:playwright:firefox': 'pnpm exec playwright install --with-deps firefox',
  'ci:playwright:webkit': 'pnpm exec playwright install --with-deps webkit',
  'ci:test:unit': 'pnpm run test:unit && node tools/ci-summary.mjs',
  'ci:test:static': 'pnpm run lint && pnpm run test:architecture && pnpm run test:ci-contract',
  'ci:test:e2e': 'pnpm exec playwright test',
  'ci:test:package-consumer': 'pnpm run test:package-consumer -- --minimal-deps',
  'ci:test:package-consumer:core': 'HELL_PACKAGE_CONSUMER_SCENARIOS=root-core,core,testing pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:primitives': 'HELL_PACKAGE_CONSUMER_SCENARIOS=primitives-css,button-unstyled,button pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:composites': 'HELL_PACKAGE_CONSUMER_SCENARIOS=composites-css,app-shell,audio-player,audio-transcript pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:features': 'HELL_PACKAGE_CONSUMER_SCENARIOS=code-editor,pdf-viewer pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:tables': 'HELL_PACKAGE_CONSUMER_SCENARIOS=table,data-table,table-tanstack,table-virtual,table-cdk,no-legacy-alias pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:code-editor': 'HELL_PACKAGE_CONSUMER_SCENARIOS=code-editor pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:pdf-viewer': 'HELL_PACKAGE_CONSUMER_SCENARIOS=pdf-viewer pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:table-core': 'HELL_PACKAGE_CONSUMER_SCENARIOS=table,data-table,no-legacy-alias pnpm run ci:test:package-consumer',
  'ci:test:package-consumer:table-adapters': 'HELL_PACKAGE_CONSUMER_SCENARIOS=table-tanstack,table-virtual,table-cdk pnpm run ci:test:package-consumer',
  'ci:build:lib': 'pnpm run build:lib',
  'ci:build:docs': 'pnpm run build:lib && pnpm run build:docs',
  'ci:build:docs:prepared': 'pnpm run build:docs',
  'ci:ensure:build:lib': "sh -c 'test -f dist/hell/package.json && test -f dist/hell-pdf-viewer/package.json || pnpm run ci:build:lib'",
  'ci:ensure:build:docs': "sh -c 'test -f dist/hell-docs/browser/index.html || test -f dist/hell-docs/index.html || (pnpm run ci:ensure:build:lib && pnpm run ci:build:docs:prepared)'",
  'ci:test:api-report': 'pnpm run build:lib && pnpm run test:api-report',
  'ci:test:api-report:prepared': 'pnpm run test:api-report',
  'ci:build': 'pnpm run build:lib && pnpm run build:docs && pnpm run test:api-report',
  'ci:verify': 'pnpm run ci:test && pnpm run ci:build',
};

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
    specs: ['e2e/component-polish-regressions.spec.ts', 'e2e/ui-behavior.spec.ts'],
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
      'scenario: core',
      'scenarios: root-core,core,testing',
      'scenario: audio',
      'scenario: table-tanstack-virtual',
      'scenario: table-cdk',
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
      'PACKAGE_CONSUMER_GROUP: audio',
      'PACKAGE_CONSUMER_GROUP: table-cdk',
      'HELL_E2E_PROJECTS: ci',
      'pnpm run ci:test:static',
      'pnpm run ci:test:unit',
      'HELL_PACKAGE_CONSUMER_SCENARIOS="${PACKAGE_CONSUMER_SCENARIOS}" pnpm run ci:test:package-consumer',
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
      "'hanging-process'",
    ],
  },
  {
    path: 'tools/run-ci-tests.mjs',
    includes: [
      "args: ['run', 'test:package-consumer', '--', '--minimal-deps']",
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
      'try_files $uri $uri/ /index.html;',
    ],
  },
  {
    path: 'playwright.config.ts',
    includes: [
      'pnpm run ci:ensure:build:lib',
      'pnpm exec ng serve hell-docs',
      'HELL_E2E_BASE_URL',
      'HELL_E2E_PROJECTS',
      'ciGroups',
      'docs-smoke-foundations',
      'docs-smoke-surfaces',
      'table-resize',
      'retries: process.env.CI ? 1 : 0',
      "['json', { outputFile: 'test-results/playwright-report.json' }]",
    ],
  },
  {
    path: 'tools/check-api-reports.mjs',
    includes: [
      '@hell-ui/angular/core',
      '@hell-ui/angular/primitives',
      '@hell-ui/angular/testing',
      'localBuild',
      'reportFolder',
      'reportTempFolder',
    ],
  },
  {
    path: 'tools/package-pack-audit.mjs',
    includes: [
      'source map',
      'secret-bearing file',
      'test artifact or test source',
      'generated docs package alias',
      'unexpected worker asset',
      'sideEffects must include **/*.css',
      'publishConfig.provenance',
      'Secondary entry point',
    ],
  },
  {
    path: 'tools/check-changelog.mjs',
    includes: [
      'CHANGELOG.md',
      'docs/release/semver-policy.md',
      'projects/hell/package.json',
      'internal beta',
      'public beta',
      'stable',
    ],
  },
  {
    path: 'tools/release-dry-run.mjs',
    includes: [
      '--fast',
      '--full',
      'test-results/release-evidence',
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
      'internal-beta-until-gate-passes',
      'package-consumer',
      'api',
      'accessibility',
      'docs-budgets',
      'pack-audit',
      'release-dry-run',
      'test-results/release-evidence',
      'releaseDryRunEvidence',
      'playwrightJsonReport',
      'allE2eSpecs',
      'requiredPlaywrightProjects',
      'requiredApiReportPaths',
      'requiredFullReleaseTasks',
      'modifiedAfterCurrentGitCommit',
    ],
  },
  {
    path: 'CHANGELOG.md',
    includes: [
      'Keep a Changelog',
      'docs/release/semver-policy.md',
      'HELL-023',
      'HELL-049',
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
      'allE2eSpecs',
      'modifiedAfterCurrentGitCommit',
      'clean tracked tree',
      'Critical gap',
      'criticalGap: true',
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
      'HELL-050',
    ],
  },
  {
    path: 'docs/release/npm-publishing.md',
    includes: [
      'npm trusted publishing',
      'AntonPieper',
      'npm-publish.yml',
      'npm-publish',
      'Require two-factor authentication and disallow tokens',
      'release-dry-run-evidence',
      'id-token: write',
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

const errors = [];

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
checkSemanticE2eGroups();
checkPackageConsumerPackAuditOrder();
checkNpmPublishWorkflow();
checkPublishedPackageMetadata();
checkDocsBudgetPolicy();

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
  const auditIndex = content.indexOf(
    'auditPackedPackage({ distRoot: distHell, tarball: packedHell.tarball });',
  );
  const consumerScenarioIndex = content.indexOf('await runConsumerScenarioGroup(group);');

  if (auditIndex === -1) {
    errors.push('package-consumer must run the package pack audit after pnpm pack');
    return;
  }

  if (consumerScenarioIndex === -1) {
    errors.push('package-consumer scenario loop marker is missing');
    return;
  }

  if (auditIndex > consumerScenarioIndex) {
    errors.push('package-consumer must run package pack audit before consumer install/build scenarios');
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
    'pnpm publish "$HELL_RELEASE_TARBALL" --access public --provenance --no-git-checks',
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
  const path = 'projects/hell/package.json';
  if (!existsSync(path)) return;

  const packageJson = JSON.parse(readFileSync(path, 'utf8'));
  if (packageJson.repository?.url !== 'git+https://github.com/AntonPieper/hell-ui.git') {
    errors.push(`${path} repository.url must match the GitHub repository used for trusted publishing.`);
  }
  if (packageJson.repository?.directory !== 'projects/hell') {
    errors.push(`${path} repository.directory must be projects/hell.`);
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

function checkDocsBudgetPolicy() {
  if (!existsSync('angular.json')) return;

  const angularJson = JSON.parse(readFileSync('angular.json', 'utf8'));
  const budgets =
    angularJson.projects?.['hell-docs']?.architect?.build?.configurations?.production?.budgets ?? [];
  const policyRead = readDocsBudgetPolicy();

  errors.push(...policyRead.errors);
  errors.push(...validateDocsBudgetPolicy(policyRead.policy, budgets));
  checkDocsBudgetDiagnosis(policyRead.policy);

  const buildDocsScript = packageJson.scripts?.['build:docs'] ?? '';
  if (!buildDocsScript.includes('node tools/docs-bundle-budget-report.mjs --check --summary-only')) {
    errors.push('build:docs must classify accepted docs budget warnings vs regressions after the Angular build.');
  }
}

function checkDocsBudgetDiagnosis(policy) {
  const path = 'docs/release/docs-bundle-budget-diagnosis.md';
  if (!existsSync(path)) return;

  const rows = readBudgetStatusRows(readFileSync(path, 'utf8'));
  const acceptedWarnings = policy?.acceptedWarnings ?? [];
  const seenWarningTypes = new Set();

  for (const row of rows) {
    const type = budgetTypeForReportLabel(row.label);
    if (!type) continue;

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
  }

  for (const warning of acceptedWarnings) {
    if (!seenWarningTypes.has(warning.type)) {
      errors.push(`${path} does not show current warning ${warning.type}; remove or refresh accepted warning policy.`);
    }
  }
}

function readBudgetStatusRows(content) {
  const lines = content.split('\n');
  const headerIndex = lines.findIndex((line) => line.trim() === '| Budget | Current | Warning | Error | Status |');
  if (headerIndex === -1) return [];

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith('| ')) break;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 5) continue;
    rows.push({
      label: cells[0],
      current: cells[1],
      warning: cells[2],
      error: cells[3],
      status: cells[4],
    });
  }
  return rows;
}

function budgetTypeForReportLabel(label) {
  if (label === 'Initial bundle') return 'initial';
  if (label === 'Any component style') return 'anyComponentStyle';
  return null;
}

function parseReportSize(value) {
  return parseBudgetSize(String(value).replace(/\s+largest$/, ''));
}

if (errors.length > 0) {
  console.error('CI contract failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CI contract ok.');
