import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  isSignal,
  signal,
  type Signal,
} from '@angular/core';
import {
  Virtualizer,
  elementScroll,
  measureElement as tanStackMeasureElement,
  observeElementOffset,
  observeElementRect,
  type Rect,
  type ScrollToOptions,
  type VirtualItem,
  type VirtualizerOptions,
} from '@tanstack/virtual-core';

export {
  Virtualizer as TanStackVirtualizer,
  elementScroll as tanStackElementScroll,
  measureElement as tanStackMeasureElement,
  observeElementOffset as tanStackObserveElementOffset,
  observeElementRect as tanStackObserveElementRect,
  type Range as TanStackVirtualRange,
  type Rect as TanStackVirtualRect,
  type ScrollToOptions as TanStackVirtualScrollToOptions,
  type VirtualItem as TanStackVirtualItem,
  type VirtualizerOptions as TanStackVirtualizerOptions,
} from '@tanstack/virtual-core';

import {
  hellTableNormalizeRowKey,
  hellTableVirtualRowPartKey,
  type HellTableRowKeyValue,
  type HellTableSignalInput,
  type HellVirtualRowPart,
  type HellVirtualRowPartKind,
} from '../table/table';
import { type HellTableRowMeasurement } from '../table/table-measure-row';

/** Default estimated block-axis size, in CSS pixels, for unmeasured virtual row parts. */
export const HELL_TANSTACK_VIRTUAL_DEFAULT_ESTIMATE_SIZE = 48;

/** Key type accepted by TanStack Virtual's `getItemKey` option. */
export type HellTanStackVirtualItemKey = string | number | bigint;

/** Scroll element input accepted by the Hell TanStack Virtual adapter. */
export type HellTanStackVirtualScrollElement<TScrollElement extends Element> =
  | TScrollElement
  | ElementRef<TScrollElement>
  | null
  | undefined;

/** Context passed to `estimateSize` for one Hell row part. */
export interface HellTanStackVirtualEstimateSizeContext<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
> {
  readonly part: TPart;
  readonly index: number;
  readonly rowParts: readonly TPart[];
}

/** Context passed to `getItemKey` for one Hell row part. */
export type HellTanStackVirtualItemKeyContext<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
> = HellTanStackVirtualEstimateSizeContext<TPart>;

/** Static or row-part-aware estimated size accepted by the adapter. */
export type HellTanStackVirtualEstimateSize<TPart extends HellVirtualRowPart = HellVirtualRowPart> =
  | number
  | ((context: HellTanStackVirtualEstimateSizeContext<TPart>) => number);

/** Row-part-aware item key callback accepted by the adapter. */
export type HellTanStackVirtualGetItemKey<TPart extends HellVirtualRowPart = HellVirtualRowPart> = (
  context: HellTanStackVirtualItemKeyContext<TPart>,
) => HellTanStackVirtualItemKey;

/** TanStack Virtual options that may pass through after Hell owns row-part wiring. */
export type HellTanStackVirtualPassthroughOptions<
  TScrollElement extends Element,
  TItemElement extends Element,
> = Partial<
  Omit<
    VirtualizerOptions<TScrollElement, TItemElement>,
    | 'count'
    | 'getScrollElement'
    | 'estimateSize'
    | 'getItemKey'
    | 'enabled'
    | 'overscan'
    | 'measureElement'
    | 'onChange'
    | 'scrollToFn'
    | 'observeElementRect'
    | 'observeElementOffset'
  >
>;

/** Options for adapting HellVirtualRowPart items to a TanStack Virtualizer. */
export interface HellTanStackVirtualRowsOptions<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
> {
  /** Flattened Hell row parts from a HellTableModel or adapter. */
  readonly rowParts: HellTableSignalInput<readonly TPart[]>;
  /** Scroll container or ElementRef. The adapter disables itself until this exists in the browser. */
  readonly scrollElement: HellTableSignalInput<HellTanStackVirtualScrollElement<TScrollElement>>;
  /** Estimated row-part size. Receives the Hell row part as well as the TanStack index. */
  readonly estimateSize?: HellTableSignalInput<HellTanStackVirtualEstimateSize<TPart>>;
  /** Stable TanStack item key. Defaults to the Hell row-part key, e.g. `row:42` or `editor:42`. */
  readonly getItemKey?: HellTanStackVirtualGetItemKey<TPart>;
  /** TanStack overscan. Defaults to TanStack Virtual's default of 1. */
  readonly overscan?: HellTableSignalInput<number>;
  /** Explicit runtime switch. SSR still forces `enabled: false`. */
  readonly enabled?: HellTableSignalInput<boolean>;
  /** Initial viewport rect for deterministic first render or tests before observers report. */
  readonly initialRect?: Rect;
  /** Optional TanStack dynamic measurement implementation. Defaults to TanStack's measureElement helper. */
  readonly measureElement?: VirtualizerOptions<TScrollElement, TItemElement>['measureElement'];
  /** Optional scroll implementation, exposed for tests or custom scroll containers. */
  readonly scrollToFn?: VirtualizerOptions<TScrollElement, TItemElement>['scrollToFn'];
  /** Optional viewport rect observer override. */
  readonly observeElementRect?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementRect'];
  /** Optional scroll offset observer override. */
  readonly observeElementOffset?: VirtualizerOptions<TScrollElement, TItemElement>['observeElementOffset'];
  /** Advanced TanStack Virtual options not already owned by Hell's row-part adapter. */
  readonly virtualizerOptions?: HellTableSignalInput<
    HellTanStackVirtualPassthroughOptions<TScrollElement, TItemElement>
  >;
  /** Called after the adapter has refreshed its Angular signals. */
  readonly onChange?: (
    virtualizer: Virtualizer<TScrollElement, TItemElement>,
    sync: boolean,
  ) => void;
}

/** TanStack VirtualItem enriched with the Hell row part at the same index. */
export interface HellTanStackVirtualRowPartItem<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
> extends VirtualItem {
  readonly part: TPart | null;
  readonly partKey: string;
}

/** Scroll-to-row options that target a row, detail row, or row editor part. */
export interface HellTanStackVirtualScrollToRowOptions extends ScrollToOptions {
  readonly partKind?: Extract<HellVirtualRowPartKind, 'row' | 'editor' | 'detail'>;
}

/** Signal-backed TanStack Virtual adapter for Hell row parts. */
export interface HellTanStackVirtualRows<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
> {
  readonly rowParts: Signal<readonly TPart[]>;
  readonly enabled: Signal<boolean>;
  readonly virtualizer: Signal<Virtualizer<TScrollElement, TItemElement>>;
  readonly options: Signal<Required<VirtualizerOptions<TScrollElement, TItemElement>>>;
  readonly virtualItems: Signal<readonly HellTanStackVirtualRowPartItem<TPart>[]>;
  readonly visibleIndexes: Signal<readonly number[]>;
  readonly totalSize: Signal<number>;
  partAt(index: number): TPart | null;
  indexOfPart(partKey: string): number;
  measureElement(element: TItemElement | null): void;
  measureRow(measurement: Pick<HellTableRowMeasurement<TPart>, 'key' | 'size'>): boolean;
  scrollToIndex(index: number, options?: ScrollToOptions): boolean;
  scrollToPart(partKey: string, options?: ScrollToOptions): boolean;
  scrollToRow(rowKey: HellTableRowKeyValue, options?: HellTanStackVirtualScrollToRowOptions): boolean;
}

/**
 * Creates a TanStack Virtualizer wired to HellVirtualRowPart items.
 *
 * Use `virtualItems()` to render only visible row parts and call `measureElement(element)`
 * or `measureRow(measurement)` from `hellTableMeasureRow` when dynamic row/detail/editor
 * content changes height.
 */
export function injectHellTanStackVirtualRows<
  TPart extends HellVirtualRowPart = HellVirtualRowPart,
  TScrollElement extends Element = HTMLElement,
  TItemElement extends Element = HTMLElement,
>(
  options: HellTanStackVirtualRowsOptions<TPart, TScrollElement, TItemElement>,
): HellTanStackVirtualRows<TPart, TScrollElement, TItemElement> {
  const platformId = inject(PLATFORM_ID);
  const destroyRef = inject(DestroyRef);
  const isBrowser = isPlatformBrowser(platformId);

  const rowParts = hellTableVirtualToSignal(options.rowParts);
  const scrollElementInput = hellTableVirtualToSignal(options.scrollElement);
  const estimateSizeInput = hellTableVirtualToSignal<HellTanStackVirtualEstimateSize<TPart>>(
    options.estimateSize ?? HELL_TANSTACK_VIRTUAL_DEFAULT_ESTIMATE_SIZE,
  );
  const overscanInput = hellTableVirtualToSignal(options.overscan ?? 1);
  const enabledInput = hellTableVirtualToSignal(options.enabled ?? true);
  const passthroughOptions = hellTableVirtualToSignal<
    HellTanStackVirtualPassthroughOptions<TScrollElement, TItemElement>
  >(options.virtualizerOptions ?? {});

  const enabled = computed(() =>
    Boolean(isBrowser && enabledInput() && unwrapScrollElement(scrollElementInput())),
  );
  const resolvedOptions = computed<VirtualizerOptions<TScrollElement, TItemElement>>(() => {
    const parts = rowParts();
    const scrollElement = unwrapScrollElement(scrollElementInput());
    const currentEnabled = Boolean(isBrowser && enabledInput() && scrollElement);
    const estimateSize = estimateSizeInput();
    const overscan = finiteNonNegativeInteger(overscanInput(), 1);
    const advanced = passthroughOptions();

    return {
      ...advanced,
      count: parts.length,
      getScrollElement: () => (currentEnabled ? scrollElement : null),
      estimateSize: (index) => estimatePartSize(parts, index, estimateSize),
      getItemKey: (index) => itemKeyForPart(parts, index, options.getItemKey),
      overscan,
      enabled: currentEnabled,
      initialRect: options.initialRect ?? advanced.initialRect,
      measureElement: options.measureElement ?? tanStackMeasureElement,
      scrollToFn: options.scrollToFn ?? elementScroll,
      observeElementRect: options.observeElementRect ?? observeElementRect,
      observeElementOffset: options.observeElementOffset ?? observeElementOffset,
      onChange: (virtualizer, sync) => {
        publish(virtualizer);
        options.onChange?.(virtualizer, sync);
      },
    };
  });

  let virtualizer: Virtualizer<TScrollElement, TItemElement> | null = null;
  let cleanup: (() => void) | null = null;
  const virtualizerSignal = signal<Virtualizer<TScrollElement, TItemElement> | null>(null, {
    equal: () => false,
  });

  function currentVirtualizer(): Virtualizer<TScrollElement, TItemElement> {
    if (!virtualizer) {
      virtualizer = new Virtualizer<TScrollElement, TItemElement>(resolvedOptions());
    }
    return virtualizer;
  }

  function syncVirtualizer(): void {
    const instance = currentVirtualizer();
    instance.setOptions(resolvedOptions());
    instance._willUpdate();
    publish(instance);
  }

  // Initial instance exists even on the server, but `enabled` is false there and observers are never attached.
  syncVirtualizer();
  cleanup = currentVirtualizer()._didMount();

  effect(() => {
    resolvedOptions();
    syncVirtualizer();
  });

  destroyRef.onDestroy(() => {
    cleanup?.();
    cleanup = null;
  });

  const virtualizerState = computed(() => {
    virtualizerSignal();
    return currentVirtualizer();
  }, { equal: () => false });
  const virtualItems = computed<readonly HellTanStackVirtualRowPartItem<TPart>[]>(() => {
    const instance = virtualizerState();
    const parts = rowParts();
    return instance.getVirtualItems().map((item) => enrichVirtualItem(item, parts));
  });

  function publish(instance: Virtualizer<TScrollElement, TItemElement>): void {
    virtualizerSignal.set(instance);
  }

  function notify(): void {
    publish(currentVirtualizer());
  }

  function partAt(index: number): TPart | null {
    return rowParts()[index] ?? null;
  }

  function indexOfPart(partKey: string): number {
    return rowParts().findIndex((part) => part.key === partKey);
  }

  function measureElement(element: TItemElement | null): void {
    syncVirtualizer();
    const instance = currentVirtualizer();
    instance.getTotalSize();
    instance.measureElement(element);
    notify();
  }

  function measureRow(measurement: Pick<HellTableRowMeasurement<TPart>, 'key' | 'size'>): boolean {
    syncVirtualizer();
    const index = indexOfPart(measurement.key);
    if (index < 0 || !Number.isFinite(measurement.size) || measurement.size < 0) return false;
    const instance = currentVirtualizer();
    instance.getTotalSize();
    instance.resizeItem(index, measurement.size);
    notify();
    return true;
  }

  function scrollToIndex(index: number, scrollOptions?: ScrollToOptions): boolean {
    syncVirtualizer();
    if (!enabled()) return false;
    const parts = rowParts();
    if (!Number.isInteger(index) || index < 0 || index >= parts.length) return false;
    currentVirtualizer().scrollToIndex(index, scrollOptions);
    notify();
    return true;
  }

  function scrollToPart(partKey: string, scrollOptions?: ScrollToOptions): boolean {
    return scrollToIndex(indexOfPart(partKey), scrollOptions);
  }

  function scrollToRow(
    rowKey: HellTableRowKeyValue,
    scrollOptions: HellTanStackVirtualScrollToRowOptions = {},
  ): boolean {
    const { partKind = 'row', ...tanStackScrollOptions } = scrollOptions;
    return scrollToPart(hellTableVirtualRowPartKey(partKind, rowKey), tanStackScrollOptions);
  }

  return {
    rowParts,
    enabled,
    virtualizer: virtualizerState,
    options: computed(() => virtualizerState().options),
    virtualItems,
    visibleIndexes: computed(() => virtualItems().map((item) => item.index)),
    totalSize: computed(() => {
      virtualizerState();
      return currentVirtualizer().getTotalSize();
    }),
    partAt,
    indexOfPart,
    measureElement,
    measureRow,
    scrollToIndex,
    scrollToPart,
    scrollToRow,
  };
}

function estimatePartSize<TPart extends HellVirtualRowPart>(
  parts: readonly TPart[],
  index: number,
  estimateSize: HellTanStackVirtualEstimateSize<TPart>,
): number {
  const part = parts[index];
  const size =
    typeof estimateSize === 'function'
      ? part
        ? estimateSize({ part, index, rowParts: parts })
        : HELL_TANSTACK_VIRTUAL_DEFAULT_ESTIMATE_SIZE
      : estimateSize;
  return finitePositivePixel(size, HELL_TANSTACK_VIRTUAL_DEFAULT_ESTIMATE_SIZE);
}

function itemKeyForPart<TPart extends HellVirtualRowPart>(
  parts: readonly TPart[],
  index: number,
  getItemKey: HellTanStackVirtualGetItemKey<TPart> | undefined,
): HellTanStackVirtualItemKey {
  const part = parts[index];
  if (!part) return index;
  return getItemKey?.({ part, index, rowParts: parts }) ?? part.key;
}

function enrichVirtualItem<TPart extends HellVirtualRowPart>(
  item: VirtualItem,
  parts: readonly TPart[],
): HellTanStackVirtualRowPartItem<TPart> {
  const part = parts[item.index] ?? null;
  return {
    ...item,
    part,
    partKey: part?.key ?? hellTableNormalizeRowKey(item.key.toString()),
  };
}

function unwrapScrollElement<TScrollElement extends Element>(
  value: HellTanStackVirtualScrollElement<TScrollElement>,
): TScrollElement | null {
  if (!value) return null;
  if (isRecord(value) && 'nativeElement' in value) {
    return value.nativeElement as TScrollElement;
  }
  return value as TScrollElement;
}

function hellTableVirtualToSignal<T>(inputValue: HellTableSignalInput<T>): Signal<T> {
  return isSignal(inputValue) ? (inputValue as Signal<T>) : signal(inputValue);
}

function finitePositivePixel(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function finiteNonNegativeInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object';
}
