/**
 * Priority-based overflow policy for the toolbar's measurement loop.
 * Internal to the entry point: exported from this file only so the pure
 * policy stays unit-testable without a DOM, not part of the public API.
 */
import type { HellToolbarActionPriority, HellToolbarItemKind } from './toolbar';

/** One item's inputs to the priority-based overflow policy. */
export interface HellToolbarOverflowItem {
  /** The item's kind. Defaults to `'action'` when omitted. */
  readonly kind?: HellToolbarItemKind;
  /** For actions, how it participates in overflow. Defaults to `'default'`. */
  readonly priority?: HellToolbarActionPriority;
  /** Measured inline width of the item, in pixels. */
  readonly width: number;
  /**
   * Separator-delimited group index. Items before the first separator are group
   * `0` (the leading group); each separator opens the next group. Defaults to
   * `0`, so a toolbar with no separators is one leading group.
   */
  readonly group?: number;
}

/** Geometry inputs to the priority-based overflow policy. */
export interface HellToolbarOverflowMetrics {
  /** Available inline size of the actions row, in pixels. */
  readonly available: number;
  /** Gap between adjacent controls, in pixels. */
  readonly gap: number;
  /** Reserved width of the overflow trigger button, in pixels. */
  readonly triggerWidth: number;
}

/** The result of resolving overflow: which declared indices render where. */
export interface HellToolbarOverflowResult {
  /** Declared indices rendered inline, in declaration order. */
  readonly inline: readonly number[];
  /** Declared indices rendered in the overflow menu, in declaration order. */
  readonly overflow: readonly number[];
}

/**
 * Resolves which items render inline and which collapse into the overflow menu.
 *
 * Policy:
 *   - `primary` actions and `widget`s are pinned inline and never overflow.
 *   - `overflowOnly` actions never render inline.
 *   - `default` actions collapse to make room. Collapse is group-aware: the
 *     leading group (before the first separator) collapses action-by-action
 *     from the last-declared default first, while every subsequent
 *     separator-delimited group collapses as a unit — a trailing group whose
 *     remainder would not fit moves to the menu whole, so a separator never
 *     strands a partial cluster. A toolbar with no separators is a single
 *     leading group and therefore collapses per action, as before.
 *   - A separator renders inline only when it divides two inline items and in
 *     the menu only when it divides two overflowed items; edge and doubled
 *     separators are dropped from both.
 *
 * This is the pure core of the toolbar's measurement loop, exported so the
 * policy can be unit-tested without a DOM.
 */
export function hellResolveToolbarOverflow(
  items: readonly HellToolbarOverflowItem[],
  metrics: HellToolbarOverflowMetrics,
): HellToolbarOverflowResult {
  const n = items.length;
  const kindOf = (i: number): HellToolbarItemKind => items[i].kind ?? 'action';
  const priorityOf = (i: number): HellToolbarActionPriority => items[i].priority ?? 'default';
  const groupOf = (i: number): number => items[i].group ?? 0;
  const widthOf = (i: number): number => items[i].width;

  const isPinned = (i: number): boolean =>
    kindOf(i) === 'widget' || (kindOf(i) === 'action' && priorityOf(i) === 'primary');
  const isCollapsible = (i: number): boolean =>
    kindOf(i) === 'action' && priorityOf(i) === 'default';
  const isSeparator = (i: number): boolean => kindOf(i) === 'separator';
  const isAction = (i: number): boolean => kindOf(i) === 'action';

  const defaults: number[] = [];
  for (let i = 0; i < n; i += 1) if (isCollapsible(i)) defaults.push(i);

  // Drop order: whole trailing groups (group > 0) first, highest group first,
  // then the leading group's defaults last-declared first.
  const trailingGroups = [...new Set(defaults.map(groupOf))]
    .filter((group) => group !== 0)
    .sort((a, b) => b - a);
  const chunks: number[][] = trailingGroups.map((group) =>
    defaults.filter((i) => groupOf(i) === group),
  );
  const leading = defaults.filter((i) => groupOf(i) === 0);
  for (let k = leading.length - 1; k >= 0; k -= 1) chunks.push([leading[k]]);

  const inlineDefaults = new Set(defaults);

  const separatorsInterior = (isInline: (i: number) => boolean): Set<number> => {
    const interior = new Set<number>();
    for (let s = 0; s < n; s += 1) {
      if (!isSeparator(s)) continue;
      let before = false;
      let after = false;
      for (let i = 0; i < s; i += 1) if (!isSeparator(i) && isInline(i)) before = true;
      for (let i = s + 1; i < n; i += 1) if (!isSeparator(i) && isInline(i)) after = true;
      if (before && after) interior.add(s);
    }
    return interior;
  };

  const inlineNonSeparator = (): ((i: number) => boolean) => {
    return (i: number) =>
      isPinned(i) || (isCollapsible(i) && inlineDefaults.has(i));
  };

  const fits = (): boolean => {
    const inline = inlineNonSeparator();
    const interior = separatorsInterior(inline);
    let widthSum = 0;
    let controlCount = 0;
    let willOverflow = false;
    for (let i = 0; i < n; i += 1) {
      if (inline(i) || interior.has(i)) {
        widthSum += widthOf(i);
        controlCount += 1;
      }
      if (isAction(i) && !inline(i)) willOverflow = true;
    }
    if (willOverflow) controlCount += 1;
    const gaps = Math.max(0, controlCount - 1) * metrics.gap;
    const reserve = willOverflow ? metrics.triggerWidth : 0;
    return widthSum + gaps + reserve <= metrics.available;
  };

  let chunk = 0;
  while (!fits() && chunk < chunks.length) {
    for (const index of chunks[chunk]) inlineDefaults.delete(index);
    chunk += 1;
  }

  const inline = inlineNonSeparator();
  const inlineInteriorSeps = separatorsInterior(inline);
  const overflowInteriorSeps = separatorsInterior(
    (i) => isAction(i) && !inline(i),
  );

  // The two placements are computed independently: a separator may divide two
  // inline items and, at the same time, divide two overflowed groups in the
  // menu (the two renderings are distinct elements). Each list then drops its
  // own edge and doubled separators.
  const inlineList: number[] = [];
  const overflowList: number[] = [];
  for (let i = 0; i < n; i += 1) {
    if (isSeparator(i)) {
      if (inlineInteriorSeps.has(i)) inlineList.push(i);
      if (overflowInteriorSeps.has(i)) overflowList.push(i);
    } else if (inline(i)) {
      inlineList.push(i);
    } else if (isAction(i)) {
      overflowList.push(i);
    }
  }

  return {
    inline: dedupeSeparators(inlineList, isSeparator),
    overflow: dedupeSeparators(overflowList, isSeparator),
  };
}

/** Drops leading, trailing, and consecutive separators from a resolved list. */
function dedupeSeparators(
  list: readonly number[],
  isSeparator: (i: number) => boolean,
): number[] {
  const out: number[] = [];
  let previousSeparator = true; // treat the start as a separator so a leading one drops
  for (const index of list) {
    const separator = isSeparator(index);
    if (separator && previousSeparator) continue;
    out.push(index);
    previousSeparator = separator;
  }
  while (out.length && isSeparator(out[out.length - 1])) out.pop();
  return out;
}
