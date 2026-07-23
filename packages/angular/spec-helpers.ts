// Shared spec-only assertion helpers. Imported by component specs alongside
// `test-setup.ts`; deliberately not exported from any public entry point
// (including `@hell-ui/angular/testing`).
import { expect } from 'vitest';

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
export function expectUiRouting(
  defaultClassName: string,
  customClassName: string,
  ui: string,
): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

export function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}
