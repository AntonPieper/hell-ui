import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  '.github/workflows/ci.yml',
  '.gitlab-ci.yml',
  'Dockerfile.ci',
  'vitest.ci.config.ts',
  'tools/run-ci-tests.mjs',
  'tools/run-unit-tests.mjs',
  'tools/check-package-consumer.mjs',
  'tools/check-package-pack.mjs',
  'tools/check-api-reports.mjs',
  'tools/package-pack-audit.mjs',
  'tools/ci-summary.mjs',
  'tools/package-manager.mjs',
  'package-lock.json',
];

const requiredScripts = {
  'ci:install': 'node tools/package-manager.mjs install',
  'test:unit': 'node tools/run-unit-tests.mjs',
  'test:package-consumer': 'node tools/check-package-consumer.mjs',
  'test:package-pack': 'node tools/check-package-pack.mjs',
  'test:api-report': 'node tools/check-api-reports.mjs',
  'api-report:update': 'node tools/check-api-reports.mjs --local',
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
      'Secondary entry point',
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

if (errors.length > 0) {
  console.error('CI contract failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CI contract ok.');
