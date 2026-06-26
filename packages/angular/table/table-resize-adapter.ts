/** One side of a table resize transaction. Adapters own where this size is stored. */
export interface HellTableResizeItem {
  /** Stable column id for the table engine or simple table state owner. */
  readonly columnId: string;
  /** Optional controlled cell/header ids for aria-controls derivation. */
  readonly ariaControls?: string | readonly string[] | null;
  measure(): number;
  minSize?(): number;
  setSize(px: number): void;
  commitSize?(px: number): void;
}

/** Narrow adapter boundary consumed by hellTableResizeHandle. */
export interface HellTableResizeAdapter {
  readonly before: HellTableResizeItem;
  readonly after: HellTableResizeItem;
}

/** One side of a committed two-column resize transaction. */
export interface HellTableResizeSide {
  readonly columnId: string;
  readonly px: number;
  /** Fraction of `totalPx` held by this column after the resize. */
  readonly share: number;
}

/** Emitted once per committed resize for the affected adjacent columns. */
export interface HellTableResizeEvent {
  readonly before: HellTableResizeSide;
  readonly after: HellTableResizeSide;
  readonly totalPx: number;
}

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
