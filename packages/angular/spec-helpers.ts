// Shared spec-only assertion helpers. Imported by component specs alongside
// `test-setup.ts`; deliberately not exported from any public entry point
// (including `hell-ui/testing`).
import { expect, vi } from 'vitest';

/** The tick period of a countdown-gated prompt action. */
const COUNTDOWN_INTERVAL_MS = 1000;

/**
 * Replaces the one-second countdown interval with a manual tick, so a spec can
 * open a countdown-gated action without sleeping through it in real time.
 *
 * Sinon's fake timers are deliberately not used for this. jsdom pumps
 * `requestAnimationFrame` from a `setInterval` of its own (see
 * `jsdom/lib/jsdom/browser/Window.js`), so faking `setInterval` freezes every
 * animation frame -- which freezes Angular's change-detection scheduler and any
 * helper that waits a frame, and the prompt then never settles at all. This
 * intercepts only the one-second countdown interval and passes every other
 * interval, jsdom's frame pump included, straight through.
 *
 * Must be called before the countdown starts. `restoreMocks` undoes the spy.
 *
 * @returns Advances the countdown by `seconds` whole ticks.
 */
export function stubCountdownInterval(): (seconds?: number) => void {
  const ticks: (() => void)[] = [];
  const scheduleInterval = globalThis.setInterval;

  vi.spyOn(globalThis, 'setInterval').mockImplementation(((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (typeof handler !== 'function' || timeout !== COUNTDOWN_INTERVAL_MS) {
      return scheduleInterval(handler, timeout, ...args);
    }
    ticks.push(handler as () => void);
    // Nothing was scheduled, so the caller's `clearInterval` is a no-op.
    return 0;
  }) as typeof globalThis.setInterval);

  return (seconds = 1) => {
    for (let elapsed = 0; elapsed < seconds; elapsed += 1) {
      for (const tick of [...ticks]) tick();
    }
  };
}

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`.
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
