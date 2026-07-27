import type { HellTimeValue } from 'hell-ui/core';

/** One selectable time unit rendered as a picker column. */
export type HellTimePickerUnit = 'hour' | 'minute' | 'second';

/** Units in descending significance, the order columns render in. */
const UNITS = ['hour', 'minute', 'second'] as const;

/** Option values offered by one column, ascending. */
export type HellTimePickerCandidates = Readonly<Record<HellTimePickerUnit, readonly number[]>>;

/** How far PageUp/PageDown jump through a column's enabled options. */
const PAGE_SIZE = 5;

/** Inclusive maximum accepted by one time unit. */
export function hellTimePickerUnitMax(unit: HellTimePickerUnit): 23 | 59 {
  return unit === 'hour' ? 23 : 59;
}

/** Whether a `minuteStep`/`secondStep` value is a positive integer dividing 60. */
export function hellTimePickerIsValidStep(step: number): boolean {
  return Number.isInteger(step) && step > 0 && step <= 60 && 60 % step === 0;
}

/**
 * Ascending option values for one column: every multiple of `step` inside the
 * unit domain, plus `committed` when an external write left the value off the
 * step grid so the selection stays visible. Picker-internal interaction never
 * produces off-step values, so this extra option only ever comes from outside.
 */
export function hellTimePickerUnitOptions(
  unit: HellTimePickerUnit,
  step: number,
  committed: number | null,
): readonly number[] {
  const max = hellTimePickerUnitMax(unit);
  const safeStep = hellTimePickerIsValidStep(step) ? step : 1;
  const options: number[] = [];
  for (let value = 0; value <= max; value += safeStep) options.push(value);

  if (committed === null || !Number.isInteger(committed)) return options;
  if (committed < 0 || committed > max || options.includes(committed)) return options;

  const index = options.findIndex((option) => option > committed);
  options.splice(index === -1 ? options.length : index, 0, committed);
  return options;
}

/** Total seconds since midnight for a structured time. */
export function hellTimeValueSeconds(value: HellTimeValue): number {
  return value.hour * 3600 + value.minute * 60 + value.second;
}

/**
 * The earliest time the picker can construct whose `unit` equals `value` and
 * which stays inside the inclusive `min`/`max` bounds, or `null` when the
 * option cannot participate in any in-range value.
 *
 * This single rule backs both option disabling and the null first-commit
 * behavior, so "an option is enabled" and "activating it commits a value"
 * cannot disagree. Untouched units take the smallest candidates that keep the
 * whole value in range, which reduces to zero when no bounds are set.
 */
export function hellTimePickerEarliestInRange(
  unit: HellTimePickerUnit,
  value: number,
  candidates: HellTimePickerCandidates,
  min: HellTimeValue | null,
  max: HellTimeValue | null,
): HellTimeValue | null {
  const minSeconds = min ? hellTimeValueSeconds(min) : 0;
  const maxSeconds = max ? hellTimeValueSeconds(max) : 24 * 3600 - 1;
  const [outer, inner] = UNITS.filter((candidate) => candidate !== unit);
  const innerCandidates = candidates[inner];
  if (!innerCandidates.length) return null;

  for (const outerValue of candidates[outer]) {
    // Candidates ascend and the outer unit is the more significant one, so the
    // first inner candidate gives this outer value's smallest reachable total.
    if (
      hellTimeValueSeconds(
        assembleTime(unit, value, outer, outerValue, inner, innerCandidates[0]),
      ) > maxSeconds
    ) {
      break;
    }

    for (const innerValue of innerCandidates) {
      const time = assembleTime(unit, value, outer, outerValue, inner, innerValue);
      const total = hellTimeValueSeconds(time);
      if (total > maxSeconds) break;
      if (total >= minSeconds) return time;
    }
  }

  return null;
}

/**
 * Next option index for one column keyboard event, or `null` when the key is
 * not a column navigation key. Disabled options are skipped and movement never
 * wraps; the result may equal `current` when the column is already at a bound.
 */
export function hellTimePickerNextOptionIndex(
  key: string,
  current: number,
  disabled: readonly boolean[],
): number | null {
  const enabled = disabled
    .map((isDisabled, index) => (isDisabled ? -1 : index))
    .filter((index) => index !== -1);
  if (!enabled.length) return null;

  const first = enabled[0];
  const last = enabled[enabled.length - 1];

  switch (key) {
    case 'Home':
      return first;
    case 'End':
      return last;
    case 'ArrowDown':
      return enabled.find((index) => index > current) ?? (current > last ? last : current);
    case 'ArrowUp':
      return findLast(enabled, (index) => index < current) ?? (current < first ? first : current);
    case 'PageDown':
      return stepThroughEnabled(enabled, current, PAGE_SIZE);
    case 'PageUp':
      return stepThroughEnabled(enabled, current, -PAGE_SIZE);
    default:
      return null;
  }
}

/** One accepted typed digit: the unit value to select and the surviving buffer. */
export interface HellTimePickerDigitEntry {
  /** Buffered unit value to select and commit. */
  readonly value: number;
  /**
   * Buffer carried into the next digit, or `null` when the entry completed and
   * focus should auto-advance to the next column.
   */
  readonly buffer: number | null;
}

/**
 * Folds one typed digit into a column's two-digit accumulator, defined against
 * the unit's numeric domain rather than the rendered option set.
 *
 * The entry completes when a second digit arrives, or when appending any
 * further digit would exceed the unit maximum. A digit that would overflow the
 * pending buffer restarts the accumulator from that digit.
 */
export function hellTimePickerAcceptDigit(
  buffer: number | null,
  digit: number,
  unitMax: number,
): HellTimePickerDigitEntry {
  const appended = buffer === null ? digit : buffer * 10 + digit;
  const restarted = appended > unitMax;
  const value = restarted ? digit : appended;
  const isSecondDigit = buffer !== null && !restarted;
  const complete = isSecondDigit || value * 10 > unitMax;

  return { value, buffer: complete ? null : value };
}

/**
 * Index of the enabled option nearest to `value`, resolving ties to the
 * earlier value. Disabled options never match.
 */
export function hellTimePickerSnapIndex(
  value: number,
  options: readonly number[],
  disabled: readonly boolean[],
): number | null {
  let best: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [index, option] of options.entries()) {
    if (disabled[index]) continue;
    const distance = Math.abs(option - value);
    // Options ascend, so a strict comparison keeps the earlier value on ties.
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }

  return best;
}

function stepThroughEnabled(
  enabled: readonly number[],
  current: number,
  delta: number,
): number {
  const position = enabled.indexOf(current);
  if (position !== -1) return enabled[clamp(position + delta, 0, enabled.length - 1)];

  // A disabled current option (an out-of-bounds external value) still anchors
  // paging. The nearest enabled option in the travel direction is step one, so
  // anchor just short of it — anchoring *on* it would travel delta + 1.
  if (delta > 0) {
    const next = enabled.findIndex((index) => index > current);
    if (next === -1) return enabled[enabled.length - 1];
    return enabled[clamp(next - 1 + delta, 0, enabled.length - 1)];
  }

  const previous = lastIndexWhere(enabled, (index) => index < current);
  if (previous === -1) return enabled[0];
  return enabled[clamp(previous + 1 + delta, 0, enabled.length - 1)];
}

function assembleTime(
  unitA: HellTimePickerUnit,
  valueA: number,
  unitB: HellTimePickerUnit,
  valueB: number,
  unitC: HellTimePickerUnit,
  valueC: number,
): HellTimeValue {
  const time = { hour: 0, minute: 0, second: 0 };
  time[unitA] = valueA;
  time[unitB] = valueB;
  time[unitC] = valueC;
  return time;
}

function findLast(
  values: readonly number[],
  predicate: (value: number) => boolean,
): number | undefined {
  for (let index = values.length - 1; index >= 0; index--) {
    if (predicate(values[index])) return values[index];
  }
  return undefined;
}

function lastIndexWhere(
  values: readonly number[],
  predicate: (value: number) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index--) {
    if (predicate(values[index])) return index;
  }
  return -1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
