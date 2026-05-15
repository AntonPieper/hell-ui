import { signal } from '@angular/core';

/** Minimal table column contract consumed by the table column resize runtime. */
export interface HellTableColumnResizeColumn {
  columnKey(): string | null;
}

/** One side of a committed two-column resize transaction. */
export interface HellTableColumnResizeSide {
  readonly columnId: string;
  readonly px: number;
  /** Fraction of `totalPx` held by this column after the resize. */
  readonly share: number;
}

/** Emitted once per committed resize for the affected adjacent columns. */
export interface HellTableColumnResizeEvent {
  readonly before: HellTableColumnResizeSide;
  readonly after: HellTableColumnResizeSide;
  readonly totalPx: number;
}

/** Header-cell pair adjacent to a column resizer. */
export interface HellTableColumnResizePair<
  TColumn extends HellTableColumnResizeColumn = HellTableColumnResizeColumn,
> {
  readonly before: TColumn;
  readonly after: TColumn;
}

/**
 * Table-specific column resize state. The shared Resize Behavior owns pointer,
 * keyboard, and total-preserving math; this runtime owns column-id lookup,
 * live width storage, and the public table resize event shape.
 */
export class HellTableColumnResizeRuntime<
  TColumn extends HellTableColumnResizeColumn = HellTableColumnResizeColumn,
> {
  private readonly widths = signal<ReadonlyMap<string, number>>(new Map());

  widthFor(columnId: string | null): number | null {
    return columnId ? (this.widths().get(columnId) ?? null) : null;
  }

  setWidth(columnId: string, px: number): void {
    this.widths.update((current) => new Map(current).set(columnId, px));
  }

  transactionEvent(
    pair: HellTableColumnResizePair<TColumn>,
    beforePx: number,
    afterPx: number,
  ): HellTableColumnResizeEvent | null {
    const beforeId = pair.before.columnKey();
    const afterId = pair.after.columnKey();
    if (!beforeId || !afterId) return null;
    const totalPx = beforePx + afterPx;
    const share = (px: number) => (totalPx > 0 ? px / totalPx : 0);
    return {
      before: { columnId: beforeId, px: beforePx, share: share(beforePx) },
      after: { columnId: afterId, px: afterPx, share: share(afterPx) },
      totalPx,
    };
  }
}
