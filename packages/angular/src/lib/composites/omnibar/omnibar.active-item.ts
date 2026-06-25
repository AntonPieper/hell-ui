export interface HellOmnibarActiveItemOption {
  /** Whether the option is unavailable for active-descendant navigation. */
  disabled(): boolean;
}

export interface HellOmnibarActiveItemSnapshot<T extends HellOmnibarActiveItemOption> {
  /** Registered options in DOM registration order, including disabled options. */
  readonly items: readonly T[];
  /** Current active index in the enabled-option projection. */
  readonly activeIndex: number;
}

export interface HellOmnibarActiveItemMovement<T extends HellOmnibarActiveItemOption> {
  /** Next active index in the enabled-option projection. */
  readonly activeIndex: number;
  /** Item that became active, if any enabled item exists. */
  readonly item: T | null;
}

/**
 * Pure active-descendant state policy for HellOmnibar.
 *
 * The Angular runtime owns signals, DOM scrolling, and event handling. This
 * controller owns only the list projection rules: disabled options are skipped,
 * indexes are clamped to enabled options, and keyboard movement wraps.
 */
export class HellOmnibarActiveItemController<T extends HellOmnibarActiveItemOption> {
  reset(): number {
    return 0;
  }

  activeIndex(snapshot: HellOmnibarActiveItemSnapshot<T>): number {
    return this.activeIndexForEnabledItems(this.enabledItems(snapshot.items), snapshot.activeIndex);
  }

  activeItem(snapshot: HellOmnibarActiveItemSnapshot<T>): T | null {
    const enabledItems = this.enabledItems(snapshot.items);
    return enabledItems[this.activeIndexForEnabledItems(enabledItems, snapshot.activeIndex)] ?? null;
  }

  setActive(snapshot: HellOmnibarActiveItemSnapshot<T>, item: T): number {
    if (item.disabled()) return snapshot.activeIndex;

    const index = this.enabledItems(snapshot.items).indexOf(item);
    return index >= 0 ? index : snapshot.activeIndex;
  }

  move(
    snapshot: HellOmnibarActiveItemSnapshot<T>,
    delta: number,
  ): HellOmnibarActiveItemMovement<T> {
    const enabledItems = this.enabledItems(snapshot.items);
    if (!enabledItems.length) return { activeIndex: snapshot.activeIndex, item: null };

    const current = this.activeIndexForEnabledItems(enabledItems, snapshot.activeIndex);
    let next = current + delta;
    if (next < 0) next = enabledItems.length - 1;
    if (next >= enabledItems.length) next = 0;

    return { activeIndex: next, item: enabledItems[next] ?? null };
  }

  first(snapshot: HellOmnibarActiveItemSnapshot<T>): number {
    return this.enabledItems(snapshot.items).length ? 0 : snapshot.activeIndex;
  }

  last(snapshot: HellOmnibarActiveItemSnapshot<T>): number {
    const length = this.enabledItems(snapshot.items).length;
    return length ? length - 1 : snapshot.activeIndex;
  }

  private enabledItems(items: readonly T[]): T[] {
    return items.filter((item) => !item.disabled());
  }

  private activeIndexForEnabledItems(enabledItems: readonly T[], activeIndex: number): number {
    if (!enabledItems.length) return -1;
    return Math.max(0, Math.min(activeIndex, enabledItems.length - 1));
  }
}
