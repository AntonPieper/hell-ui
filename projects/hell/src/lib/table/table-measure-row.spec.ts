import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  type HellTableMeasurableItem,
  HellTableMeasureRow,
  type HellTableRowMeasurement,
} from './table';

interface Person {
  readonly id: string;
  readonly name: string;
}

const row = { key: '42', original: { id: '42', name: 'Ada' }, index: 0 };

interface TestMeasuredItem<TData> extends HellTableMeasurableItem {
  readonly kind: 'row' | 'expanded' | 'editor';
  readonly key: string;
  readonly row: typeof row & { readonly original: TData };
}

@Component({
  standalone: true,
  imports: [HellTableMeasureRow],
  template: `
    <div
      [hellTableMeasureRow]="part()"
      [hellTableMeasureRowCallback]="recordMeasurement"
      (measured)="outputMeasurements.push($event)"
    >
      Measured row
    </div>
  `,
})
class MeasureRowHost {
  readonly part = signal<TestMeasuredItem<Person>>({ kind: 'row', key: 'row:42', row });
  readonly measurements: HellTableRowMeasurement<TestMeasuredItem<Person>>[] = [];
  readonly outputMeasurements: HellTableRowMeasurement<TestMeasuredItem<Person>>[] = [];
  readonly recordMeasurement = (
    measurement: HellTableRowMeasurement<TestMeasuredItem<Person>>,
  ) => {
    this.measurements.push(measurement);
  };
}

describe('HellTableMeasureRow', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let height = 48;
  const width = 320;

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver;
    TestResizeObserver.instances = [];
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () =>
        ({
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          right: width,
          bottom: height,
          width,
          height,
          toJSON: () => ({}),
        }) as DOMRect,
    );

    await TestBed.configureTestingModule({
      imports: [MeasureRowHost],
    }).compileComponents();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    vi.restoreAllMocks();
  });

  it('reports row-part size through an adapter-safe callback and invalidates dynamic height changes', () => {
    const fixture = TestBed.createComponent(MeasureRowHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const measuredElement = fixture.nativeElement.querySelector('[data-hell-table-measure-row]');

    expect(measuredElement?.getAttribute('data-hell-table-measure-row')).toBe('row:42');
    expect(host.measurements.map(({ key, size, reason }) => ({ key, size, reason }))).toEqual([
      { key: 'row:42', size: 48, reason: 'init' },
    ]);
    expect(host.outputMeasurements.map((measurement) => measurement.key)).toEqual(['row:42']);

    height = 72;
    observeMeasuredElement(measuredElement).trigger();
    fixture.detectChanges();

    expect(host.measurements.map(({ key, size, reason }) => ({ key, size, reason }))).toEqual([
      { key: 'row:42', size: 48, reason: 'init' },
      { key: 'row:42', size: 72, reason: 'resize' },
    ]);

    observeMeasuredElement(measuredElement).trigger();
    expect(host.measurements).toHaveLength(2);

    host.part.set({ kind: 'editor', key: 'editor:42', row });
    fixture.detectChanges();

    expect(host.measurements.at(-1)).toMatchObject({
      key: 'editor:42',
      size: 72,
      reason: 'input',
    });
    expect(measuredElement?.getAttribute('data-hell-table-measure-row')).toBe('editor:42');
  });
});

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  observed: Element | null = null;

  constructor(private readonly callback: () => void) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed = element;
  }

  disconnect(): void {}

  trigger(): void {
    this.callback();
  }
}

function observeMeasuredElement(element: Element | null): TestResizeObserver {
  const observer = TestResizeObserver.instances.find((instance) => instance.observed === element);
  if (!observer) throw new Error('Expected measured row ResizeObserver.');
  return observer;
}
