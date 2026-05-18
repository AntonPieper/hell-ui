import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  '.github/workflows/ci.yml',
  '.gitlab-ci.yml',
  'Dockerfile.ci',
  'vitest.ci.config.ts',
  'tools/run-ci-tests.mjs',
  'tools/run-unit-tests.mjs',
  'tools/check-package-consumer.mjs',
  'tools/ci-summary.mjs',
  'tools/package-manager.mjs',
  'package-lock.json',
];

const requiredScripts = {
  'ci:install': 'node tools/package-manager.mjs install',
  'test:unit': 'node tools/run-unit-tests.mjs',
  'test:package-consumer': 'node tools/check-package-consumer.mjs',
  'ci:test': 'node tools/run-ci-tests.mjs',
  'ci:playwright': 'node tools/package-manager.mjs exec playwright install --with-deps chromium firefox webkit',
  'ci:build': 'node tools/package-manager.mjs run build',
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

if (errors.length > 0) {
  console.error('CI contract failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CI contract ok.');
