import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import type {
  ColumnDefBase_All,
  RowData,
  Table,
  TableFeature,
  TableFeatures,
} from '@tanstack/angular-table';
// Feature APIs are read through the static-function entry point for the same
// reason as in the shell: the directive is generic over `TFeatures`, so gated
// instance methods stay unresolved. See `docs/adr/tanstack-table-shell.md`.
import {
  column_getCanResize,
  column_getSize,
  getDefaultColumnSizingColumnDef,
  table_getTotalSize,
  table_setColumnSizing,
} from '@tanstack/angular-table/static-functions';
import type { HellTableResizeAdapter, HellTableResizeItem } from 'hell-ui/table';

import {
  ɵHELL_TANSTACK_RESIZE_STRATEGY,
  type ɵHellTanStackResizeStrategy,
} from './table-tanstack';

/**
 * TanStack features `hellTanStackResizableColumns` requires on the tables it
 * transacts against.
 *
 * - `columnSizingFeature` — the sizes, bounds, and table total every resize
 *   measures against, and the `columnSizing` state every resize commits into.
 * - `columnResizingFeature` — TanStack's resize opt-outs: the directive is the
 *   per-table opt-in, but the table-level `enableColumnResizing` option and
 *   the per-column `columnDef.enableResizing` remain the fine-grained control,
 *   and both belong to this feature.
 *
 * The base shell deliberately does not require column resizing: a table that
 * never resizes skips this directive and `columnResizingFeature` entirely.
 * `columnSizingFeature` is different — the shell requires it for every table
 * it renders, resizable or not. See {@link HellTanStackTableFeatures}.
 */
export interface HellTanStackResizableColumnsFeatures extends TableFeatures {
  columnResizingFeature: TableFeature;
  columnSizingFeature: TableFeature;
}

/** Mutable state both sides of one resize transaction share while it runs. */
interface HellColumnResizeTransaction {
  /** Rendered pixels per TanStack unit, latched for the life of the transaction. */
  scale: number;
  /** Sizes this transaction has written so far, keyed by column id. */
  writes: Readonly<Record<string, number>>;
}

/**
 * Optional TanStack column-resize registration for `hell-tanstack-table`.
 *
 * Applying the directive is what makes the shell render a
 * `hellTableResizeHandle` separator on every header cell that has a resizable
 * trailing neighbour; without it the shell renders no resize affordance and
 * requires no resizing feature. The directive shares the shell's `table`
 * binding, so opting in is one attribute on the shell element.
 *
 * The shell stays in charge of where separators render — it owns the rendered
 * column order and the placeholder rules — and asks this directive for the
 * resize pair of each candidate through {@link ɵHellTanStackResizeStrategy}.
 * That boundary speaks in column ids and the non-generic
 * `HellTableResizeAdapter`, which is what lets this directive require resizing
 * features the shell itself no longer names.
 */
@Directive({
  selector: 'hell-tanstack-table[hellTanStackResizableColumns]',
  exportAs: 'hellTanStackResizableColumns',
  providers: [
    { provide: ɵHELL_TANSTACK_RESIZE_STRATEGY, useExisting: HellTanStackResizableColumns },
  ],
  host: {
    '[attr.data-hell-tanstack-resizable-columns]': 'enabled() ? "true" : null',
  },
})
export class HellTanStackResizableColumns<
    TFeatures extends HellTanStackResizableColumnsFeatures,
    TData extends RowData = RowData,
  >
  implements ɵHellTanStackResizeStrategy
{
  /**
   * Live opt-in switch bound through the selector attribute itself, so a bare
   * `hellTanStackResizableColumns` enables resizing and
   * `[hellTanStackResizableColumns]="false"` parks the registration without
   * removing it.
   */
  readonly enabled = input(true, {
    alias: 'hellTanStackResizableColumns',
    transform: booleanAttribute,
  });

  /**
   * The same caller-owned table the shell renders. Both directives declare the
   * input under the one name, so a single `[table]` binding feeds both and each
   * checks the table against its own feature requirements.
   */
  readonly table = input.required<Table<TFeatures, TData>>();

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly resizePairs = new Map<
    string,
    { readonly afterId: string; readonly adapter: HellTableResizeAdapter }
  >();

  /**
   * Resize pair for one rendered header, or `null` when it gets no handle:
   * a disabled directive, a missing trailing neighbour, and columns TanStack
   * marks unresizable have no adjacent pair to transact against.
   * `column_getCanResize()` is TanStack's own gate, so the table-level
   * `enableColumnResizing` and per-column `enableResizing` opt-outs keep
   * working — both default to enabled now that this directive, rather than an
   * explicit `enableColumnResizing: true`, is the per-table opt-in.
   *
   * Adapters are memoized per leading column so the `resizeAdapter` binding
   * keeps a stable identity across change detection.
   */
  adapterFor(
    beforeColumnId: string,
    afterColumnId: string | undefined,
  ): HellTableResizeAdapter | null {
    if (!this.enabled() || afterColumnId === undefined) return null;

    const table = this.table();
    const before = table.getColumn(beforeColumnId);
    const after = table.getColumn(afterColumnId);
    if (!before || !after || !column_getCanResize(before) || !column_getCanResize(after)) {
      return null;
    }

    const cached = this.resizePairs.get(beforeColumnId);
    if (cached?.afterId === afterColumnId) return cached.adapter;

    // Both sides share one transaction so neither can half-convert its delta
    // nor overwrite the other's write.
    const transaction: HellColumnResizeTransaction = { scale: 1, writes: {} };
    const adapter: HellTableResizeAdapter = {
      before: this.resizeItemFor(beforeColumnId, afterColumnId, transaction),
      after: this.resizeItemFor(afterColumnId, beforeColumnId, transaction),
    };
    this.resizePairs.set(beforeColumnId, { afterId: afterColumnId, adapter });
    return adapter;
  }

  /**
   * One side of a shell resize transaction. Sizes live in TanStack's
   * `columnSizing` state — the single channel the `<colgroup>`, the header
   * grid, and the body cell size/grow variables all read — so the shell never
   * writes a competing width onto the header cell itself.
   *
   * Every value crosses the rendered/TanStack boundary through the pair's
   * render scale, because the shell table stretches past `getTotalSize()`
   * whenever the scrollport is wider than the columns.
   *
   * The scale is latched on `measure()` — the resize runtime reads both start
   * sizes before it writes anything — and reused for the rest of the
   * transaction. Recomputing it per call would read a `getTotalSize()` that
   * already contains this transaction's first write, so the two sides would
   * convert at different rates and the pair total would creep on every move.
   * `measure()` also opens a fresh write set, so a new drag starts from
   * TanStack's own state rather than from what the last one left behind.
   */
  private resizeItemFor(
    columnId: string,
    otherColumnId: string,
    transaction: HellColumnResizeTransaction,
  ): HellTableResizeItem {
    return {
      columnId,
      measure: () => {
        transaction.scale = this.columnRenderScale();
        transaction.writes = {};
        return this.columnUnits(columnId) * transaction.scale;
      },
      minSize: () => this.resizeMinUnits(columnId, otherColumnId) * transaction.scale,
      setSize: (px) => this.writeColumnSize(transaction, columnId, px / transaction.scale),
    };
  }

  /**
   * Lower bound for one side in TanStack units: its own `minSize`, raised so
   * the opposite side cannot pass its `maxSize`. Both bounds stay TanStack's;
   * the directive only translates them into the pair contract the resize
   * handle clamps against.
   */
  private resizeMinUnits(columnId: string, otherColumnId: string): number {
    const own = this.columnBounds(columnId);
    const other = this.columnBounds(otherColumnId);
    const sum = this.columnUnits(columnId) + this.columnUnits(otherColumnId);
    return Math.max(own.min, sum - other.max);
  }

  private columnUnits(columnId: string): number {
    const column = this.table().getColumn(columnId);
    const size = column ? column_getSize(column) : 0;
    return Number.isFinite(size) && size > 0 ? size : 0;
  }

  /**
   * TanStack merges its sizing defaults into every `columnDef`, so a column that
   * still exists always answers with concrete bounds. The fallbacks only cover a
   * column disappearing between two reads, and deliberately reuse TanStack's own
   * defaults so the directive never invents a bound of its own.
   *
   * The bounds live on the sizing slice of the column definition, so they are
   * read through TanStack's broadened `ColumnDefBase_All` view rather than by
   * pinning a feature set on the directive.
   */
  private columnBounds(columnId: string): { readonly min: number; readonly max: number } {
    const columnDef: ColumnDefBase_All<TFeatures, TData, unknown> | undefined = this.table()
      .getColumn(columnId)
      ?.columnDef;
    const defaults = getDefaultColumnSizingColumnDef();
    return {
      min: columnDef?.minSize ?? defaults.minSize,
      max: columnDef?.maxSize ?? defaults.maxSize,
    };
  }

  /**
   * Rendered CSS pixels per TanStack size unit. Under `table-layout: fixed` the
   * shell table stretches its columns proportionally when it is wider than
   * `getTotalSize()`, so a pointer delta measured on screen is that much larger
   * than the size delta TanStack should record.
   *
   * The directive sits on the shell host and measures the shell `<table>`
   * through the direct host > scrollport > table path the shell template
   * guarantees. A descendant query would not do: projected content — a toolbar
   * is rendered before the scrollport — may nest another shell, whose table
   * would then win document order and put a foreign width over this table's
   * TanStack total.
   */
  private columnRenderScale(): number {
    const element = this.host.querySelector(
      ':scope > [data-hell-table-shell-scrollport] > [data-hell-table-shell-table]',
    );
    const total = table_getTotalSize(this.table());
    if (!element || !Number.isFinite(total) || total <= 0) return 1;
    const rendered = element.getBoundingClientRect().width;
    return rendered > 0 ? rendered / total : 1;
  }

  /**
   * Records one side's size and republishes the whole transaction in a single
   * `columnSizing` updater.
   *
   * The resize runtime writes both sides back to back with no render in
   * between, and the `columnSizing` an updater reads does not refresh across two
   * synchronous writes: the slice follows Angular reactivity, which has not run
   * again by the time the second updater executes. A per-side updater would
   * therefore compute the second write from the same state as the first and
   * drop the leading column's size, leaving the pair total — and with it the
   * table total — drifting by the whole delta on every move. Carrying the
   * accumulated writes makes each call land both sides at once, which is also
   * correct when the caller controls `columnSizing` through a signal.
   *
   * `UncontrolledResizableShellHost` in the spec is the regression guard: it
   * leaves sizing to TanStack, where the staleness is observable.
   */
  private writeColumnSize(
    transaction: HellColumnResizeTransaction,
    columnId: string,
    size: number,
  ): void {
    transaction.writes = { ...transaction.writes, [columnId]: size };
    const { writes } = transaction;
    table_setColumnSizing(this.table(), (current) => ({ ...current, ...writes }));
  }
}
