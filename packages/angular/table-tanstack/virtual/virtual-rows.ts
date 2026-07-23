import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  Virtualizer,
  elementScroll,
  measureElement,
  observeElementOffset,
  observeElementRect,
  type VirtualItem,
} from '@tanstack/virtual-core';
import type { RowData } from '@tanstack/angular-table';

import {
  ɵHELL_TANSTACK_BODY_STRATEGY,
  ɵHellDomWriter,
  type ɵHellTanStackBodyItem,
  type ɵHellTanStackBodyStrategy,
} from 'hell-ui/table-tanstack';

interface HellVirtualBodyItem<TData extends RowData> extends ɵHellTanStackBodyItem<TData> {
  readonly virtualIndex: number;
}

type HellVirtualResizeObserver = {
  observe(el: Element): void;
  disconnect(): void;
};
type HellVirtualResizeObserverConstructor = new (
  callback: ResizeObserverCallback,
) => HellVirtualResizeObserver;

/** Optional TanStack Virtual row strategy registration for `hell-tanstack-table`. */
@Directive({
  selector: 'hell-tanstack-table[hellTanStackVirtualRows]',
  exportAs: 'hellTanStackVirtualRows',
  providers: [{ provide: ɵHELL_TANSTACK_BODY_STRATEGY, useExisting: HellTanStackVirtualRows }],
  host: {
    '[attr.data-hell-tanstack-virtual-rows]': 'enabled() ? "true" : null',
    '[style.--hell-table-virtual-total-size.px]': 'totalSize()',
    '[style.--hell-table-virtual-row-width.px]': 'rowWidth()',
  },
})
export class HellTanStackVirtualRows<TData extends RowData = RowData>
  implements ɵHellTanStackBodyStrategy<TData>, OnDestroy
{
  readonly enabled = input(true, {
    alias: 'hellTanStackVirtualRows',
    transform: booleanAttribute,
  });
  readonly estimateRowSize = input(44, {
    alias: 'virtualEstimateRowSize',
    transform: numberAttribute,
  });
  readonly overscan = input(6, {
    alias: 'virtualOverscan',
    transform: numberAttribute,
  });

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly version = signal(0);
  private scrollport: HTMLElement | null = null;
  private body: HTMLElement | null = null;
  private sourceItems: readonly ɵHellTanStackBodyItem<TData>[] = [];
  private virtualItems: readonly VirtualItem[] = [];
  private virtualItemsByKey = new Map<string, VirtualItem>();
  private mountedCleanup: VoidFunction | null = null;
  private resizeObserver: HellVirtualResizeObserver | null = null;
  private readonly observedWidthElements = new Set<HTMLElement>();

  protected readonly totalSize = signal(0);
  protected readonly rowWidth = signal<number | null>(null);

  private readonly virtualizer = new Virtualizer<HTMLElement, HTMLElement>({
    count: 0,
    getScrollElement: () =>
      this.scrollport ??
      (this.host.querySelector('[data-hell-table-shell-scrollport]') as HTMLElement | null),
    estimateSize: () => this.estimateRowSize(),
    overscan: this.overscan(),
    scrollToFn: elementScroll,
    observeElementRect,
    observeElementOffset,
    measureElement,
    indexAttribute: 'data-hell-table-virtual-row-index',
    enabled: this.enabled(),
    onChange: (instance) =>
      this.syncVirtualItems(instance.getVirtualItems(), instance.getTotalSize()),
  });

  constructor() {
    effect(() => {
      this.virtualizer.setOptions({
        ...this.virtualizer.options,
        enabled: this.enabled(),
        estimateSize: () => this.estimateRowSize(),
        overscan: this.overscan(),
      });
      this.virtualizer.measure();
      this.bump();
    });
  }

  rows(items: readonly ɵHellTanStackBodyItem<TData>[]): readonly ɵHellTanStackBodyItem<TData>[] {
    this.version();
    this.sourceItems = items;
    this.setCount(items.length);

    if (!this.enabled()) return items;

    const virtualItems = this.virtualItems.length
      ? this.virtualItems
      : this.virtualizer.getVirtualItems();
    if (!virtualItems.length) return items.slice(0, Math.min(items.length, this.overscan() + 1));

    return virtualItems
      .map((virtualItem) => this.itemForVirtualItem(virtualItem))
      .filter((item): item is HellVirtualBodyItem<TData> => !!item);
  }

  connectScrollport(el: HTMLElement, writer: ɵHellDomWriter): VoidFunction {
    this.scrollport = el;
    writer.data(el, 'table-virtual-scrollport', 'true');
    this.observeWidthElement(el);
    queueMicrotask(() => {
      this.observeTableWidth();
      this.syncRowWidth();
    });
    this.syncRowWidth();
    this.ensureMounted();
    this.virtualizer._willUpdate();
    return () => {
      if (this.scrollport === el) this.scrollport = null;
      this.syncRowWidth();
    };
  }

  connectBody(el: HTMLElement, writer: ɵHellDomWriter): VoidFunction {
    this.body = el;
    writer.data(el, 'table-virtual-body', 'true');
    this.observeTableWidth();
    this.syncRowWidth();
    return () => {
      if (this.body === el) this.body = null;
    };
  }

  connectRow(
    el: HTMLElement,
    item: ɵHellTanStackBodyItem<TData>,
    writer: ɵHellDomWriter,
  ): VoidFunction {
    const virtualItem = this.virtualItemFor(item);
    const virtualIndex =
      virtualItem?.index ?? this.sourceItems.findIndex((source) => source.key === item.key);

    writer.data(el, 'table-virtual-row', 'true');
    writer.data(el, 'table-virtual-row-kind', item.kind);
    if (virtualIndex >= 0) writer.data(el, 'table-virtual-row-index', String(virtualIndex));

    if (virtualItem) {
      writer.cssVar(el, 'table-virtual-row-start', `${virtualItem.start}px`);
      writer.cssVar(el, 'table-virtual-row-size', `${virtualItem.size}px`);
    }

    this.virtualizer.measureElement(el);

    return () => {};
  }

  ngOnDestroy(): void {
    this.mountedCleanup?.();
    this.mountedCleanup = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.observedWidthElements.clear();
  }

  private setCount(count: number): void {
    if (this.virtualizer.options.count === count) return;
    this.virtualizer.setOptions({ ...this.virtualizer.options, count });
  }

  private ensureMounted(): void {
    this.mountedCleanup ??= this.virtualizer._didMount();
  }

  private itemForVirtualItem(virtualItem: VirtualItem): HellVirtualBodyItem<TData> | null {
    const item = this.sourceItems[virtualItem.index];
    if (!item) return null;
    this.virtualItemsByKey.set(item.key, virtualItem);
    return { ...item, virtualIndex: virtualItem.index };
  }

  private virtualItemFor(item: ɵHellTanStackBodyItem<TData>): VirtualItem | null {
    return this.virtualItemsByKey.get(item.key) ?? null;
  }

  private syncVirtualItems(items: readonly VirtualItem[], totalSize: number): void {
    this.virtualItems = items;
    this.virtualItemsByKey = new Map();
    for (const virtualItem of items) {
      const item = this.sourceItems[virtualItem.index];
      if (item) this.virtualItemsByKey.set(item.key, virtualItem);
    }
    this.totalSize.set(totalSize);
    this.syncRowWidth();
    this.bump();
  }

  private observeTableWidth(): void {
    const table = this.host.querySelector('[data-hell-table-shell-table]') as HTMLElement | null;
    if (table) this.observeWidthElement(table);
  }

  private observeWidthElement(el: HTMLElement): void {
    if (this.observedWidthElements.has(el)) return;
    const ResizeObserverConstructor = this.host.ownerDocument.defaultView?.ResizeObserver as
      | HellVirtualResizeObserverConstructor
      | undefined;
    if (!ResizeObserverConstructor) return;
    this.resizeObserver ??= new ResizeObserverConstructor(() => this.syncRowWidth());
    this.resizeObserver.observe(el);
    this.observedWidthElements.add(el);
  }

  private syncRowWidth(): void {
    const table = this.host.querySelector('[data-hell-table-shell-table]') as HTMLElement | null;
    const tableWidth = table?.getBoundingClientRect().width ?? 0;
    const scrollportWidth = this.scrollport?.clientWidth ?? 0;
    const width = Math.max(tableWidth, scrollportWidth);
    this.rowWidth.set(width > 0 ? width : null);
    this.cdr.markForCheck();
  }

  private bump(): void {
    this.version.update((version) => version + 1);
    this.cdr.markForCheck();
  }
}

/** All directives that make up the TanStack virtual rows entry point, for bulk `imports`. */
export const HELL_TANSTACK_TABLE_VIRTUAL_IMPORTS = [HellTanStackVirtualRows] as const;
