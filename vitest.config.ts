import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));
const coveragePath = resolve(workspaceRoot, 'coverage');

const reporters: (string | [string, Record<string, unknown>])[] = [
  'default',
  'hanging-process',
];

if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.splice(1, 0, 'github-actions');
}

// The merge-request test widget reads a JUnit report; written only on the
// GitLab runner so local runs leave no stray file.
if (process.env.GITLAB_CI === 'true') {
  reporters.push([
    'junit',
    { outputFile: resolve(workspaceRoot, 'test-results/vitest-junit.xml') },
  ]);
}

const coverageReporters = ['text', 'html'];

// Cobertura feeds the merge-request coverage visualization; the text
// reporter's "All files" row is what the job's coverage regex reads.
if (process.env.GITLAB_CI === 'true') {
  coverageReporters.push('cobertura');
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(workspaceRoot, 'packages/angular/test-setup.ts')],
    reporters,
    testTimeout: 30_000,
    // Spies and global stubs are per-test state. Without these, a spy on a
    // shared object (`console`, `HTMLMediaElement.prototype`) outlives the test
    // that installed it whenever a restore is skipped — including every time an
    // assertion throws before the restore line — so a single failure silently
    // changes what later tests in the same file measure.
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: coveragePath,
      reporter: coverageReporters,
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
