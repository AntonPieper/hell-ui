import type { HellTimeValue } from 'hell-ui/core';

import {
  hellTimePickerAcceptDigit,
  hellTimePickerEarliestInRange,
  hellTimePickerIsValidStep,
  hellTimePickerNextOptionIndex,
  hellTimePickerSnapIndex,
  hellTimePickerUnitMax,
  hellTimePickerUnitOptions,
  hellTimeValueSeconds,
  type HellTimePickerCandidates,
} from './time-picker-navigation';

describe('time picker column engine', () => {
  describe('unit domains and steps', () => {
    it('uses bounded hour/minute/second ranges', () => {
      expect(hellTimePickerUnitMax('hour')).toBe(23);
      expect(hellTimePickerUnitMax('minute')).toBe(59);
      expect(hellTimePickerUnitMax('second')).toBe(59);
    });

    it('accepts only positive integer steps that divide 60', () => {
      for (const step of [1, 2, 5, 10, 15, 20, 30, 60]) {
        expect(hellTimePickerIsValidStep(step), `${step}`).toBe(true);
      }
      for (const step of [0, -5, 7, 1.5, 45, 90, Number.NaN]) {
        expect(hellTimePickerIsValidStep(step), `${step}`).toBe(false);
      }
    });
  });

  describe('option lists', () => {
    it('renders the whole unit domain at step 1', () => {
      expect(hellTimePickerUnitOptions('hour', 1, null)).toHaveLength(24);
      expect(hellTimePickerUnitOptions('minute', 1, null)).toHaveLength(60);
    });

    it('renders one option per step', () => {
      expect(hellTimePickerUnitOptions('minute', 15, null)).toEqual([0, 15, 30, 45]);
      expect(hellTimePickerUnitOptions('second', 30, null)).toEqual([0, 30]);
    });

    it('adds an off-step committed value in place so the selection stays visible', () => {
      expect(hellTimePickerUnitOptions('minute', 15, 37)).toEqual([0, 15, 30, 37, 45]);
      expect(hellTimePickerUnitOptions('minute', 15, 58)).toEqual([0, 15, 30, 45, 58]);
    });

    it('never duplicates an on-step committed value', () => {
      expect(hellTimePickerUnitOptions('minute', 15, 30)).toEqual([0, 15, 30, 45]);
    });

    it('falls back to step 1 for an invalid step', () => {
      expect(hellTimePickerUnitOptions('minute', 7, null)).toHaveLength(60);
    });
  });

  describe('bounds and the earliest-in-range rule', () => {
    const open = candidates(1, 1, true);

    it('defaults untouched units to zero without bounds', () => {
      expect(hellTimePickerEarliestInRange('minute', 30, open, null, null)).toEqual({
        hour: 0,
        minute: 30,
        second: 0,
      });
    });

    it('lifts untouched units to the smallest in-range values', () => {
      // The spec's worked example: min 09:00 with a null value, activating
      // minute 30 commits 09:30 rather than an out-of-range 00:30.
      expect(
        hellTimePickerEarliestInRange('minute', 30, open, time(9, 0, 0), null),
      ).toEqual({ hour: 9, minute: 30, second: 0 });
    });

    it('respects an upper bound', () => {
      expect(
        hellTimePickerEarliestInRange('hour', 9, open, null, time(9, 30, 0)),
      ).toEqual({ hour: 9, minute: 0, second: 0 });
    });

    it('reports options that cannot participate in any in-range value', () => {
      expect(hellTimePickerEarliestInRange('hour', 8, open, time(9, 0, 0), null)).toBeNull();
      expect(hellTimePickerEarliestInRange('hour', 10, open, null, time(9, 30, 0))).toBeNull();
      // Hour 9 survives both bounds because 09:00..09:30 is in range.
      expect(
        hellTimePickerEarliestInRange('hour', 9, open, time(9, 0, 0), time(9, 30, 0)),
      ).not.toBeNull();
    });

    it('only offers values the step grid can actually construct', () => {
      // With minuteStep 15 and min 09:10 the earliest constructible hour-9
      // value is 09:15, so activation never produces an off-step minute.
      const stepped = candidates(15, 1, false);
      expect(
        hellTimePickerEarliestInRange('hour', 9, stepped, time(9, 10, 0), null),
      ).toEqual({ hour: 9, minute: 15, second: 0 });
    });

    it('treats hidden seconds as a single zero candidate', () => {
      const withoutSeconds = candidates(1, 1, false);
      expect(
        hellTimePickerEarliestInRange('minute', 30, withoutSeconds, time(9, 30, 30), null),
      ).toEqual({ hour: 10, minute: 30, second: 0 });
    });

    it('measures bounds as inclusive same-day totals', () => {
      expect(hellTimeValueSeconds(time(1, 2, 3))).toBe(3723);
      expect(
        hellTimePickerEarliestInRange('minute', 0, open, time(9, 0, 0), time(9, 0, 0)),
      ).toEqual({ hour: 9, minute: 0, second: 0 });
    });
  });

  describe('column key navigation', () => {
    const enabled = new Array<boolean>(10).fill(false);

    it('moves one option at a time without wrapping', () => {
      expect(hellTimePickerNextOptionIndex('ArrowDown', 3, enabled)).toBe(4);
      expect(hellTimePickerNextOptionIndex('ArrowUp', 3, enabled)).toBe(2);
      expect(hellTimePickerNextOptionIndex('ArrowDown', 9, enabled)).toBe(9);
      expect(hellTimePickerNextOptionIndex('ArrowUp', 0, enabled)).toBe(0);
    });

    it('jumps to the first and last enabled options', () => {
      const bounded = [true, false, false, false, true];
      expect(hellTimePickerNextOptionIndex('Home', 3, bounded)).toBe(1);
      expect(hellTimePickerNextOptionIndex('End', 1, bounded)).toBe(3);
    });

    it('pages by five enabled options, clamped at the bounds', () => {
      expect(hellTimePickerNextOptionIndex('PageDown', 0, enabled)).toBe(5);
      expect(hellTimePickerNextOptionIndex('PageUp', 9, enabled)).toBe(4);
      expect(hellTimePickerNextOptionIndex('PageDown', 7, enabled)).toBe(9);
      expect(hellTimePickerNextOptionIndex('PageUp', 2, enabled)).toBe(0);
    });

    it('pages exactly five enabled options from a disabled starting option', () => {
      // 0-2 disabled: from the disabled option 1 the enabled run is
      // 3,4,5,6,7,... so five steps forward must land on 7, not 8.
      const leadingGap = [true, true, true, false, false, false, false, false, false, false];
      expect(hellTimePickerNextOptionIndex('PageDown', 1, leadingGap)).toBe(7);

      // 7-9 disabled: from the disabled option 8 five steps back is 2.
      const trailingGap = [false, false, false, false, false, false, false, true, true, true];
      expect(hellTimePickerNextOptionIndex('PageUp', 8, trailingGap)).toBe(2);
    });

    it('skips disabled options in every direction', () => {
      const gap = [false, true, true, false, false];
      expect(hellTimePickerNextOptionIndex('ArrowDown', 0, gap)).toBe(3);
      expect(hellTimePickerNextOptionIndex('ArrowUp', 3, gap)).toBe(0);
      expect(hellTimePickerNextOptionIndex('PageDown', 0, gap)).toBe(4);
    });

    it('returns null for unsupported keys and fully disabled columns', () => {
      expect(hellTimePickerNextOptionIndex('x', 0, enabled)).toBeNull();
      expect(hellTimePickerNextOptionIndex('Enter', 0, enabled)).toBeNull();
      expect(hellTimePickerNextOptionIndex('ArrowDown', 0, [true, true])).toBeNull();
    });
  });

  describe('typed digit accumulator', () => {
    it('completes immediately when no further digit could fit', () => {
      // 70 exceeds 23, so a leading 7 is a complete hour.
      expect(hellTimePickerAcceptDigit(null, 7, 23)).toEqual({ value: 7, buffer: null });
      // 60 exceeds 59, so a leading 6 is a complete minute.
      expect(hellTimePickerAcceptDigit(null, 6, 59)).toEqual({ value: 6, buffer: null });
    });

    it('waits for a second digit while one could still fit', () => {
      expect(hellTimePickerAcceptDigit(null, 2, 23)).toEqual({ value: 2, buffer: 2 });
      expect(hellTimePickerAcceptDigit(null, 5, 59)).toEqual({ value: 5, buffer: 5 });
    });

    it('completes on the second digit', () => {
      expect(hellTimePickerAcceptDigit(3, 7, 59)).toEqual({ value: 37, buffer: null });
      expect(hellTimePickerAcceptDigit(2, 3, 23)).toEqual({ value: 23, buffer: null });
    });

    it('restarts the accumulator when the second digit would overflow', () => {
      // 2 then 9 cannot be hour 29, so 9 becomes a fresh complete hour.
      expect(hellTimePickerAcceptDigit(2, 9, 23)).toEqual({ value: 9, buffer: null });
    });
  });

  describe('snapping to the nearest enabled option', () => {
    const quarters = [0, 15, 30, 45];
    const allEnabled = [false, false, false, false];

    it('snaps a buffered value to the nearest option', () => {
      // The spec's worked example: minuteStep 15 with "3", "7" selects 30.
      expect(hellTimePickerSnapIndex(37, quarters, allEnabled)).toBe(2);
      expect(hellTimePickerSnapIndex(44, quarters, allEnabled)).toBe(3);
      expect(hellTimePickerSnapIndex(2, quarters, allEnabled)).toBe(0);
    });

    it('resolves ties to the earlier value', () => {
      // 15 sits exactly between the 10 and 20 options of a step-10 minute grid.
      const tens = hellTimePickerUnitOptions('minute', 10, null);
      const enabled = tens.map(() => false);
      expect(tens[hellTimePickerSnapIndex(15, tens, enabled) ?? -1]).toBe(10);
      expect(tens[hellTimePickerSnapIndex(25, tens, enabled) ?? -1]).toBe(20);
    });

    it('never snaps onto a disabled option', () => {
      // 30 is the nearest option but disabled, so 45 wins on distance.
      expect(hellTimePickerSnapIndex(32, quarters, [false, false, true, false])).toBe(3);
      expect(hellTimePickerSnapIndex(32, quarters, [false, false, true, true])).toBe(1);
      expect(hellTimePickerSnapIndex(32, quarters, [true, true, true, true])).toBeNull();
    });
  });
});

function time(hour: number, minute: number, second: number): HellTimeValue {
  return { hour, minute, second };
}

function candidates(
  minuteStep: number,
  secondStep: number,
  seconds: boolean,
): HellTimePickerCandidates {
  return {
    hour: hellTimePickerUnitOptions('hour', 1, null),
    minute: hellTimePickerUnitOptions('minute', minuteStep, null),
    second: seconds ? hellTimePickerUnitOptions('second', secondStep, null) : [0],
  };
}
