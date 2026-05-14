import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  '.github/workflows/ci.yml',
  '.gitlab-ci.yml',
  'Dockerfile.ci',
  'vitest.ci.config.ts',
  'tools/run-ci-tests.mjs',
  'tools/check-package-consumer.mjs',
  'tools/ci-summary.mjs',
  'tools/package-manager.mjs',
];

const requiredScripts = {
  'ci:install': 'node tools/package-manager.mjs install',
  'test:package-consumer': 'node tools/check-package-consumer.mjs',
  'ci:test': 'node tools/run-ci-tests.mjs',
  'ci:build': 'node tools/package-manager.mjs run build',
  'ci:verify': 'node tools/package-manager.mjs run ci:test && node tools/package-manager.mjs run ci:build',
};

const adapterChecks = [
  {
    path: '.github/workflows/ci.yml',
    includes: [
      'pnpm ci:install',
      'pnpm ci:test',
      'pnpm ci:build',
      'pnpm exec playwright install --with-deps chromium firefox webkit',
      'actions/upload-artifact',
      'test-results/',
      'coverage/',
    ],
  },
  {
    path: '.gitlab-ci.yml',
    includes: [
      'pnpm ci:install',
      'pnpm ci:test',
      'pnpm ci:build',
      'pnpm exec playwright install --with-deps chromium firefox webkit',
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
      'pnpm ci:install',
      'pnpm exec playwright install --with-deps chromium firefox webkit',
      'pnpm ci:test',
      'pnpm ci:build',
      'pnpm ci:verify',
    ],
  },
];

const adapterForbiddenPatterns = [
  { pattern: /\bng\s+test\b/, message: 'CI adapters must call pnpm ci:test instead of ng test.' },
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
