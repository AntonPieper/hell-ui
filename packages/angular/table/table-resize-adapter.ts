/** One side of a table resize transaction. Adapters own where this size is stored. */
export interface HellTableResizeItem {
  /** Stable column id for the table engine or simple table state owner. */
  readonly columnId: string;
  /** Optional controlled cell/header ids for aria-controls derivation. */
  readonly ariaControls?: string | readonly string[] | null;
  /** Current size of the item in CSS pixels, used as the drag start anchor. */
  measure(): number;
  /** Minimum size the item may shrink to, in CSS pixels. */
  minSize?(): number;
  /** Applies a live size to the item while the user is dragging. */
  setSize(px: number): void;
  /** Persists the final size after pointerup or a key step. */
  commitSize?(px: number): void;
}

/** Narrow adapter boundary consumed by hellTableResizeHandle. */
export interface HellTableResizeAdapter {
  /** The item on the leading side of the handle. */
  readonly before: HellTableResizeItem;
  /** The item on the trailing side of the handle. */
  readonly after: HellTableResizeItem;
}

/** One side of a committed two-column resize transaction. */
export interface HellTableResizeSide {
  /** Stable column id of this side. */
  readonly columnId: string;
  /** Final size of this column in CSS pixels. */
  readonly px: number;
  /** Fraction of `totalPx` held by this column after the resize. */
  readonly share: number;
}

/** Emitted once per committed resize for the affected adjacent columns. */
export interface HellTableResizeEvent {
  /** The leading column after the resize. */
  readonly before: HellTableResizeSide;
  /** The trailing column after the resize. */
  readonly after: HellTableResizeSide;
  /** Combined width of both columns in CSS pixels. */
  readonly totalPx: number;
}

/** Type guard that reports whether the adapter has both sides ready to resize. */
export function hellTableResizeAdapterCanResize(
  adapter: HellTableResizeAdapter | null | undefined,
): adapter is HellTableResizeAdapter {
  return !!adapter?.before?.columnId && !!adapter.after?.columnId;
}

export function hellTableResizeEvent(
  adapter: HellTableResizeAdapter,
  beforePx: number,
  afterPx: number,
): HellTableResizeEvent {
  const totalPx = beforePx + afterPx;
  const share = (px: number) => (totalPx > 0 ? px / totalPx : 0);
  return {
    before: { columnId: adapter.before.columnId, px: beforePx, share: share(beforePx) },
    after: { columnId: adapter.after.columnId, px: afterPx, share: share(afterPx) },
    totalPx,
  };
}
