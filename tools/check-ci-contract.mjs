import { existsSync, readFileSync } from 'node:fs';

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
  'tools/check-package-consumer.mjs',
  'tools/check-package-pack.mjs',
  'tools/check-api-reports.mjs',
  'tools/check-changelog.mjs',
  'tools/release-dry-run.mjs',
  'tools/production-ready-check.mjs',
  'tools/package-pack-audit.mjs',
  'tools/ci-summary.mjs',
  'tools/package-manager.mjs',
  'tools/docs-budget-policy.mjs',
  'package-lock.json',
  'CHANGELOG.md',
  'docs/release/npm-publishing.md',
  'docs/release/semver-policy.md',
  'docs/release/production-readiness-checklist.md',
  'docs/release/docs-budget-policy.md',
  'docs/release/docs-bundle-budget-diagnosis.md',
];

const requiredScripts = {
  'ci:install': 'node tools/package-manager.mjs install',
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
  'ci:playwright': 'node tools/package-manager.mjs exec playwright install --with-deps chromium firefox webkit',
  'ci:build': 'node tools/package-manager.mjs run build && node tools/package-manager.mjs run test:api-report',
  'ci:verify': 'node tools/package-manager.mjs run ci:test && node tools/package-manager.mjs run ci:build',
};

const adapterChecks = [
  {
    path: '.github/workflows/ci.yml',
    includes: [
      'node tools/package-manager.mjs run ci:install',
      'node tools/package-manager.mjs run ci:playwright',
      'node tools/package-manager.mjs run ci:test',
      'node tools/package-manager.mjs run ci:build',
      'npm ci --ignore-scripts --no-audit --no-fund',
      'npm run test:ci-contract',
      'cache: npm',
      'cache-dependency-path: package-lock.json',
      'actions/upload-artifact',
      'test-results/',
      'coverage/',
    ],
  },
  {
    path: '.gitlab-ci.yml',
    includes: [
      'node tools/package-manager.mjs run ci:install',
      'node tools/package-manager.mjs run ci:playwright',
      'node tools/package-manager.mjs run ci:test',
      'node tools/package-manager.mjs run ci:build',
      'reports:',
      'junit: test-results/vitest-junit.xml',
      'coverage_format: cobertura',
      'path: coverage/cobertura-coverage.xml',
    ],
  },
  {
    path: 'Dockerfile.ci',
    includes: [
      'COPY tools/package-manager.mjs tools/package-manager.mjs',
      'node tools/package-manager.mjs run ci:install',
      'node tools/package-manager.mjs run ci:playwright',
      'node tools/package-manager.mjs run ci:test',
      'node tools/package-manager.mjs run ci:build',
      'node tools/package-manager.mjs run ci:verify',
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
    path: 'playwright.config.ts',
    includes: [
      "['json', { outputFile: 'test-results/playwright-report.json' }]",
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
  { pattern: /\bng\s+build\b/, message: 'CI adapters must call pnpm ci:build instead of ng build.' },
  { pattern: /\b(?:pnpm\s+(?:exec\s+)?vitest|npx\s+vitest|vitest\s+run)\b/, message: 'CI adapters must not inline Vitest commands.' },
  { pattern: /\btest:architecture\b/, message: 'CI adapters must not know internal check scripts.' },
  { pattern: /--coverage\b/, message: 'CI adapters must not own coverage flags.' },
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

checkPackageConsumerPackAuditOrder();
checkNpmPublishWorkflow();
checkPublishedPackageMetadata();
checkDocsBudgetPolicy();

function checkPackageConsumerPackAuditOrder() {
  const path = 'tools/check-package-consumer.mjs';
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');
  const auditIndex = content.indexOf(
    'auditPackedPackage({ distRoot: distHell, tarball: packedHell.tarball });',
  );
  const consumerScenarioIndex = content.indexOf('await runConsumerScenarioGroup(group);');

  if (auditIndex === -1) {
    errors.push('package-consumer must run the package pack audit after npm pack');
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
    'node tools/package-manager.mjs run release:dry-run -- --full',
    'node tools/package-manager.mjs run test:package-pack',
    'npm pack ./dist/hell --pack-destination release-package',
    'npm publish "$HELL_RELEASE_TARBALL" --access public --provenance',
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
  for (const forbidden of [
    'actions/checkout',
    'pnpm/action-setup',
    'node tools/package-manager.mjs',
    'npm pack',
  ]) {
    if (publishJob.includes(forbidden)) {
      errors.push(`${path} publish job must stay minimal after id-token permission; found ${forbidden}.`);
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
