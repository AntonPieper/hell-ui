import { Component, PLATFORM_ID, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  hellTableCreateModel,
  hellTableVirtualRowPartsFromRows,
  type HellVirtualRowPart,
} from '../table/table';
import {
  injectHellTanStackVirtualRows,
  type HellTanStackVirtualRows,
} from './table-virtual';

interface Person {
  readonly id: string;
  readonly name: string;
}

interface ScrollCall {
  readonly offset: number;
  readonly adjustments: number;
  readonly top: number;
  readonly behavior: string | undefined;
}

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada' },
  { id: 'grace', name: 'Grace' },
  { id: 'katherine', name: 'Katherine' },
  { id: 'linus', name: 'Linus' },
  { id: 'margaret', name: 'Margaret' },
  { id: 'alan', name: 'Alan' },
];

@Component({ selector: 'hell-test-virtual-rows-host', template: '' })
class VirtualRowsHost {
  readonly sourceRows = signal([...people]);
  readonly expandedRows = signal<Record<string, boolean>>({});
  readonly scrollElement = createScrollElement();
  readonly scrollCalls: ScrollCall[] = [];
  readonly offsetCallbacks: ((offset: number, isScrolling: boolean) => void)[] = [];
  readonly model = hellTableCreateModel<Person>({
    columns: [],
    rows: this.sourceRows,
    rowKey: (row) => row.id,
  });
  readonly parts = computed(() =>
    hellTableVirtualRowPartsFromRows({
      rows: this.model.rows(),
      activeEditorRowKey: this.model.state.activeRowKey.value(),
      expandedDetailRowKeys: this.expandedRows(),
    }),
  );
  readonly virtual = injectHellTanStackVirtualRows({
    rowParts: this.parts,
    scrollElement: this.scrollElement,
    estimateSize: ({ part }) => (part.kind === 'editor' ? 80 : part.kind === 'detail' ? 96 : 40),
    getItemKey: ({ part }) => part.key,
    overscan: 2,
    initialRect: { width: 320, height: 100 },
    scrollToFn: (offset, options, instance) => {
      const adjustments = options.adjustments ?? 0;
      const top = offset + adjustments;
      this.scrollElement.scrollTop = top;
      instance.scrollOffset = top;
      this.scrollCalls.push({ offset, adjustments, top, behavior: options.behavior });
    },
    observeElementRect: (_instance, cb) => {
      cb({ width: 320, height: 100 });
      return undefined;
    },
    observeElementOffset: (_instance, cb) => {
      this.offsetCallbacks.push(cb);
      cb(this.scrollElement.scrollTop, false);
      return undefined;
    },
  });
}

@Component({ selector: 'hell-test-server-virtual-rows-host', template: '' })
class ServerVirtualRowsHost {
  readonly scrollElement = createScrollElement();
  readonly scrollCalls: ScrollCall[] = [];
  readonly parts = signal<readonly HellVirtualRowPart<Person>[]>([
    { kind: 'row', key: 'row:ada', row: { key: 'ada', original: people[0]!, index: 0 } },
  ]);
  readonly virtual = injectHellTanStackVirtualRows({
    rowParts: this.parts,
    scrollElement: this.scrollElement,
    estimateSize: 40,
    initialRect: { width: 320, height: 100 },
    scrollToFn: (offset, options) => {
      this.scrollCalls.push({
        offset,
        adjustments: options.adjustments ?? 0,
        top: offset + (options.adjustments ?? 0),
        behavior: options.behavior,
      });
    },
  });
}

describe('Hell TanStack Virtual adapter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VirtualRowsHost] }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('composes Hell row parts into TanStack Virtual count, estimateSize, getItemKey, and overscan options', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    expect(host.virtual.options().count).toBe(6);
    expect(host.virtual.options().estimateSize(0)).toBe(40);
    expect(host.virtual.options().getItemKey(0)).toBe('row:ada');
    expect(host.virtual.options().getItemKey(1)).toBe('row:grace');
    expect(host.virtual.options().overscan).toBe(2);
    expect(host.virtual.visibleIndexes()).toEqual([0, 1, 2, 3, 4]);
    expect(host.virtual.virtualItems()[0]).toMatchObject({
      index: 0,
      key: 'row:ada',
      partKey: 'row:ada',
    });
    expect(host.virtual.totalSize()).toBe(240);
  });

  it('scrolls to rows and reports failed part lookups without mutating active row state', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    expect(host.virtual.scrollToRow('katherine', { align: 'start' })).toBe(true);
    expect(host.scrollCalls.at(-1)).toMatchObject({ offset: 80, adjustments: 0, top: 80 });

    host.model.commands.openRow('grace');
    fixture.detectChanges();

    expect(host.virtual.scrollToPart('missing:row')).toBe(false);
    expect(host.model.state.activeRowKey.value()).toBe('grace');
  });

  it('uses measureRow-style dynamic measurement to preserve scroll anchor and visible indexes', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const firstPart = expectPart(host.virtual, 0);

    expect(host.virtual.totalSize()).toBe(240);
    host.virtual.virtualizer().scrollOffset = 120;

    expect(host.virtual.measureRow({ key: firstPart.key, size: 80 })).toBe(true);

    expect(host.virtual.totalSize()).toBe(280);
    expect(host.scrollCalls.at(-1)).toMatchObject({ offset: 120, adjustments: 40, top: 160 });
    expect(host.virtual.visibleIndexes().every((index) => host.virtual.partAt(index))).toBe(true);
  });

  it('keeps row editors and expanded detail rows keyed while height changes and open/close state moves indexes', () => {
    const fixture = TestBed.createComponent(VirtualRowsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    host.model.commands.openRow('grace');
    fixture.detectChanges();

    expect(host.virtual.rowParts().map((part) => part.key).slice(0, 4)).toEqual([
      'row:ada',
      'row:grace',
      'editor:grace',
      'row:katherine',
    ]);
    expect(host.virtual.options().count).toBe(7);
    expect(host.virtual.options().estimateSize(2)).toBe(80);
    notifyScrollOffset(host, 200);
    expect(host.virtual.measureRow({ key: 'editor:grace', size: 140 })).toBe(true);
    expect(host.scrollCalls.at(-1)).toMatchObject({ offset: 200, adjustments: 60, top: 260 });
    expect(host.model.state.activeRowKey.value()).toBe('grace');

    host.expandedRows.set({ katherine: true });
    fixture.detectChanges();

    expect(host.virtual.indexOfPart('detail:katherine')).toBe(4);
    notifyScrollOffset(host, 360);
    expect(host.virtual.measureRow({ key: 'detail:katherine', size: 128 })).toBe(true);
    expect(host.scrollCalls.at(-1)).toMatchObject({ offset: 360, adjustments: 32, top: 392 });
    expect(host.model.state.activeRowKey.value()).toBe('grace');
    expect(host.virtual.visibleIndexes().every((index) => host.virtual.partAt(index))).toBe(true);

    host.model.commands.closeRow('grace');
    fixture.detectChanges();

    expect(host.model.state.activeRowKey.value()).toBeNull();
    expect(host.virtual.indexOfPart('row:katherine')).toBe(2);
    expect(host.virtual.indexOfPart('detail:katherine')).toBe(3);

    host.expandedRows.set({});
    fixture.detectChanges();

    expect(host.virtual.indexOfPart('detail:katherine')).toBe(-1);
    expect(host.virtual.indexOfPart('row:linus')).toBe(3);
    expect(host.model.state.activeRowKey.value()).toBeNull();
    expect(host.virtual.visibleIndexes().every((index) => host.virtual.partAt(index))).toBe(true);
  });
});

describe('Hell TanStack Virtual adapter SSR guard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerVirtualRowsHost],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('keeps initialization disabled on the server even when row parts and a scroll element are present', () => {
    const fixture = TestBed.createComponent(ServerVirtualRowsHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;

    expect(host.virtual.enabled()).toBe(false);
    expect(host.virtual.options().enabled).toBe(false);
    expect(host.virtual.visibleIndexes()).toEqual([]);
    expect(host.virtual.totalSize()).toBe(0);
    expect(host.virtual.scrollToRow('ada')).toBe(false);
    expect(host.scrollCalls).toEqual([]);
  });
});

function notifyScrollOffset(host: VirtualRowsHost, offset: number): void {
  host.scrollElement.scrollTop = offset;
  host.virtual.virtualizer().scrollOffset = offset;
  host.offsetCallbacks.at(-1)?.(offset, false);
}

function createScrollElement(): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'offsetWidth', { configurable: true, value: 320 });
  Object.defineProperty(element, 'offsetHeight', { configurable: true, value: 100 });
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 320 });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: 100 });
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: 320 });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: 1000 });
  return element;
}

function expectPart<TPart extends HellVirtualRowPart>(
  virtual: HellTanStackVirtualRows<TPart>,
  index: number,
): TPart {
  const part = virtual.partAt(index);
  if (!part) throw new Error(`Expected virtual part at index ${index}.`);
  return part;
}
