import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Runner for the repository's own tooling specs — the `.spec.mjs` and
 * `.spec.ts` files colocated with the tools under `tools/`.
 *
 * Separate from `vitest.config.ts` deliberately. That config is the Angular
 * library's runner: jsdom, `packages/angular/test-setup.ts`, and coverage
 * thresholds measured over the library. None of it applies to plain Node
 * tooling — the setup file would fail outside a DOM, and folding tool specs
 * into the library's coverage would move its thresholds for reasons that have
 * nothing to do with the library. These specs previously ran as fixture
 * functions inside the gates they cover; `tools/ci/README.md` documents the gate
 * that runs them now.
 *
 * Two deliberate divergences from that config, both about node tooling rather
 * than preference:
 *
 * - No `globals: true`. The tool specs import `describe`/`it`/`expect`
 *   explicitly. The library's specs rely on the globals because Angular's
 *   `ng test` runner and the jsdom setup file assume them; plain ESM tooling
 *   has no such runner, and an explicit import is what makes a `.spec.mjs`
 *   readable as ordinary Node code.
 * - No coverage block. Coverage thresholds belong to the surface being
 *   measured, and mixing tooling into the library's numbers would move them
 *   for unrelated reasons.
 *
 * knip needs no configuration for any of this: its Vitest plugin treats any
 * `.spec.` file as an entry point by filename, so the internals these specs are
 * the only consumers of are seen as used regardless of this file's name.
 */

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));

const reporters: (string | [string, Record<string, unknown>])[] = ['default', 'hanging-process'];

if (process.env.GITHUB_ACTIONS === 'true') {
  reporters.splice(1, 0, 'github-actions');
}

// A failing tool spec has to reach the same places a failing unit test does, or
// the gate that runs it is only readable in raw job logs. Written to its own
// path: `test-results/vitest-junit.xml` belongs to the unit job, and both files
// exist in the same workspace layout.
if (process.env.GITLAB_CI === 'true') {
  reporters.push([
    'junit',
    { outputFile: resolve(workspaceRoot, 'test-results/vitest-tools-junit.xml') },
  ]);
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/**/*.spec.{mjs,ts}'],
    reporters,
    // The cross-entrypoint spec drives the real API Extractor over generated
    // declaration fixtures — three full extractions, each compiling Angular's
    // declarations. A unit-test timeout would report a busy machine as a
    // broken contract, so the budget is set for the slowest spec here rather
    // than the typical one.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // Spies and global stubs are per-test state. Without these, a spy on a
    // shared object outlives the test that installed it whenever a restore is
    // skipped — including every time an assertion throws before the restore
    // line — so a single failure silently changes what later tests in the same
    // file measure.
    restoreMocks: true,
    unstubGlobals: true,
  },
});
