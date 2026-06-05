import {
  Directive,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import { type HellVirtualRowPart } from './table-model';

type HellTableResizeObserver = {
  observe(element: Element): void;
  disconnect(): void;
};

type HellTableResizeObserverConstructor = new (callback: () => void) => HellTableResizeObserver;

/** Reason a row-part measurement was reported. */
export type HellTableRowMeasurementReason = 'init' | 'input' | 'manual' | 'resize';

/** Adapter-safe row-part size report. `size` is the block-axis row height in CSS pixels. */
export interface HellTableRowMeasurement<TPart extends HellVirtualRowPart = HellVirtualRowPart> {
  readonly key: string;
  readonly part: TPart | null;
  readonly element: HTMLElement;
  readonly size: number;
  readonly height: number;
  readonly width: number;
  readonly reason: HellTableRowMeasurementReason;
}

/** Callback accepted by `hellTableMeasureRow`; adapters can map this to their own invalidation APIs. */
export type HellTableMeasureRowCallback<TPart extends HellVirtualRowPart = HellVirtualRowPart> = {
  bivarianceHack(measurement: HellTableRowMeasurement<TPart>): void;
}['bivarianceHack'];

/**
 * Measures a rendered virtual row part and reports height changes without depending on
 * TanStack Virtual, CDK virtual scroll, or any concrete table engine.
 */
@Directive({
  selector: '[hellTableMeasureRow]',
  exportAs: 'hellTableMeasureRow',
  host: {
    '[attr.data-hell-table-measure-row]': 'partKey()',
  },
})
export class HellTableMeasureRow<TPart extends HellVirtualRowPart = HellVirtualRowPart>
  implements AfterViewInit, OnDestroy
{
  /** Row part to measure. The part key is used unless `hellTableMeasureRowKey` is supplied. */
  readonly rowPart = input<TPart | null>(null, { alias: 'hellTableMeasureRow' });

  /** Explicit key override for custom adapter rows. */
  readonly rowPartKey = input<string | null>(null, { alias: 'hellTableMeasureRowKey' });

  /** Adapter callback invoked when the row part is first measured or changes size/key. */
  readonly measureRow = input<HellTableMeasureRowCallback<TPart> | null>(null, {
    alias: 'hellTableMeasureRowCallback',
  });

  /** Output mirror for Angular templates that prefer event binding over callback inputs. */
  readonly measured = output<HellTableRowMeasurement<TPart>>();

  protected readonly partKey = computed(() => this.rowPartKey() ?? this.rowPart()?.key ?? null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private resizeObserver: HellTableResizeObserver | null = null;
  private viewReady = false;
  private destroyed = false;
  private lastMeasurement: { readonly key: string; readonly size: number } | null = null;

  constructor() {
    effect(() => {
      this.rowPart();
      this.rowPartKey();
      this.measureRow();
      if (this.viewReady) this.reportMeasurement('input', true);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.observeSizeChanges();
    this.reportMeasurement('init', true);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /** Imperative escape hatch for adapters that know their content changed outside ResizeObserver. */
  measureNow(): void {
    this.reportMeasurement('manual', true);
  }

  private observeSizeChanges(): void {
    const ResizeObserverConstructor = this.host.ownerDocument.defaultView?.ResizeObserver as
      | HellTableResizeObserverConstructor
      | undefined;
    if (!ResizeObserverConstructor) return;

    this.resizeObserver = new ResizeObserverConstructor(() => this.reportMeasurement('resize'));
    this.resizeObserver.observe(this.host);
  }

  private reportMeasurement(reason: HellTableRowMeasurementReason, force = false): void {
    if (this.destroyed) return;
    const key = this.partKey();
    if (!key) return;

    const rect = this.measureHostRect();
    const height = finitePixel(rect.height);
    const width = finitePixel(rect.width);
    const size = height;
    if (!force && this.lastMeasurement?.key === key && this.lastMeasurement.size === size) return;

    this.lastMeasurement = { key, size };
    const measurement = {
      key,
      part: this.rowPart(),
      element: this.host,
      size,
      height,
      width,
      reason,
    } satisfies HellTableRowMeasurement<TPart>;

    this.measureRow()?.(measurement);
    this.measured.emit(measurement);
  }

  private measureHostRect(): { readonly height: number; readonly width: number } {
    if (typeof this.host.getBoundingClientRect !== 'function') return { height: 0, width: 0 };
    return this.host.getBoundingClientRect();
  }
}

function finitePixel(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}
