import type { Page } from '@playwright/test';

/** A calendar day for {@link freezeBrowserDate} to pin the browser clock to. */
export interface FrozenDate {
  readonly year: number;
  /** Zero-based, matching the `Date` constructor. */
  readonly month: number;
  readonly day: number;
}

/**
 * The day the date specs assume is "today". Chosen so the 22nd is both today
 * and the pre-selected date in the docs examples.
 */
const DEFAULT_FROZEN_DATE: FrozenDate = { year: 2026, month: 3, day: 22 };

/**
 * Pin the page's `Date` to midday on `date` before any application script runs.
 *
 * Date specs assert against a fixed calendar -- which month is in view, which
 * day carries `data-today` -- so a real clock would make them fail on a
 * different day or in a different timezone. Midday keeps the frozen instant
 * clear of both midnight boundaries, so a runner's local timezone offset cannot
 * roll the frozen day forward or back.
 *
 * `Date.parse` and `Date.UTC` stay delegated to the real implementation, and the
 * subclass reports `name === 'Date'`, so only the "what time is it now" answer
 * changes and library code that feature-detects `Date` is unaffected.
 */
export async function freezeBrowserDate(
  page: Page,
  date: FrozenDate = DEFAULT_FROZEN_DATE,
): Promise<void> {
  const { year, month, day } = date;
  await page.addInitScript({
    content: `
      (() => {
        const RealDate = Date;
        const fixedTime = new RealDate(
          ${JSON.stringify(year)},
          ${JSON.stringify(month)},
          ${JSON.stringify(day)},
          12, 0, 0, 0,
        ).getTime();

        class FixedDate extends RealDate {
          constructor(...args) {
            if (args.length === 0) {
              super(fixedTime);
            } else {
              super(...args);
            }
          }

          static now() {
            return fixedTime;
          }

          static parse(value) {
            return RealDate.parse(value);
          }

          static UTC(...args) {
            return RealDate.UTC(...args);
          }
        }

        Object.defineProperty(FixedDate, 'name', { value: 'Date' });
        globalThis.Date = FixedDate;
      })();
    `,
  });
}
