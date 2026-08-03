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
 * nothing to do with the library.
 *
 * These specs used to run as fixture functions inside the gates themselves, so
 * every real `test:api-report` invocation paid for three synthetic API
 * Extractor runs and every Playwright config load — `--list` included — paid
 * for the host-health reporter's self-test. They are tests, so they run here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/**/*.spec.{mjs,ts}'],
    // The cross-entrypoint spec drives the real API Extractor over generated
    // declaration fixtures — three full extractions, each compiling Angular's
    // declarations. A unit-test timeout would report a busy machine as a
    // broken contract, so the budget is set for the slowest spec here rather
    // than the typical one.
    testTimeout: 180_000,
    hookTimeout: 180_000,
  },
});
