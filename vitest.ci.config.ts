import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));
const testResultsPath = resolve(workspaceRoot, 'test-results/vitest-junit.xml');
const coveragePath = resolve(workspaceRoot, 'coverage');
const testTimeoutMs = positiveNumber(process.env.HELL_UNIT_TEST_CASE_TIMEOUT_MS, 30_000);

const reporters = [
  'default',
  'hanging-process',
  ['junit', { outputFile: testResultsPath, suiteName: 'hell unit tests' }],
];

if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.splice(1, 0, 'github-actions');
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(workspaceRoot, 'packages/angular/src/test-setup.ts')],
    reporters,
    testTimeout: testTimeoutMs,
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: coveragePath,
      reporter: ['text', 'json-summary', 'html', 'lcov', 'cobertura'],
      reportOnFailure: true,
      thresholds: {
        statements: 75,
        branches: 70,
        functions: 70,
        lines: 75,
      },
    },
  },
});

function positiveNumber(raw: string | undefined, fallback: number): number {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
