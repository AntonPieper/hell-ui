import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));
const coveragePath = resolve(workspaceRoot, 'coverage');

const reporters = ['default', 'hanging-process'];

if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.splice(1, 0, 'github-actions');
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
      reporter: ['text', 'html'],
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
