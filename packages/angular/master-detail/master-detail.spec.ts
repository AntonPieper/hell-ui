import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_MASTER_DETAIL_IMPORTS } from './master-detail';

@Component({
  imports: [...HELL_MASTER_DETAIL_IMPORTS],
  template: `
    <div
      id="master-detail"
      hellMasterDetail
      #masterDetail="hellMasterDetail"
      [compactBelow]="compactBelow()"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="setDetailOpen($event)"
      ui="bg-hell-surface-muted"
    >
      <section id="primary" hellMasterPane="primary" ui="bg-hell-primary-soft">
        <button id="open-detail" type="button" (click)="detailOpen.set(true)">Open detail</button>
        <input id="primary-state" aria-label="Primary state" [value]="primaryState()" />
      </section>
      <section id="detail" hellMasterPane="detail" ui="bg-hell-surface-elevated">
        <button hellMasterDetailBack ui="text-hell-primary">Back to records</button>
        <input id="detail-state" aria-label="Detail state" [value]="detailState()" />
      </section>
      <output id="compact-state">{{ masterDetail.compact() }}</output>
    </div>
  `,
})
class MasterDetailHost {
  readonly compactBelow = signal(700);
  readonly detailOpen = signal(false);
  readonly primaryState = signal('primary preserved');
  readonly detailState = signal('detail preserved');
  readonly detailEvents: boolean[] = [];

  setDetailOpen(open: boolean): void {
    this.detailEvents.push(open);
    this.detailOpen.set(open);
  }
}

@Component({
  imports: [...HELL_MASTER_DETAIL_IMPORTS],
  template: `
    <div
      id="outer-master-detail"
      hellMasterDetail
      [compactBelow]="700"
      [detailOpen]="outerOpen()"
      (detailOpenChange)="outerOpen.set($event)"
    >
      <section id="outer-primary" hellMasterPane="primary">
        <button id="outer-opener" type="button" (click)="outerOpen.set(true)">
          Open outer detail
        </button>
      </section>
      <section id="outer-detail" hellMasterPane="detail">
        <div
          id="nested-master-detail"
          hellMasterDetail
          [compactBelow]="700"
          [detailOpen]="nestedOpen()"
          (detailOpenChange)="nestedOpen.set($event)"
        >
          <section id="nested-primary" hellMasterPane="primary">
            <button id="nested-primary-control" type="button">Nested primary</button>
          </section>
          <section id="nested-detail" hellMasterPane="detail">
            <button id="nested-back" hellMasterDetailBack type="button">Nested Back</button>
            <input id="nested-detail-control" aria-label="Nested detail" />
          </section>
        </div>
        <button id="outer-back" hellMasterDetailBack type="button">Outer Back</button>
        <input id="outer-detail-control" aria-label="Outer detail" />
      </section>
    </div>
  `,
})
class NestedMasterDetailHost {
  readonly outerOpen = signal(false);
  readonly nestedOpen = signal(true);
}

describe('HellMasterDetail', () => {
  let resizeObserverDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    resizeObserverDescriptor = Object.getOwnPropertyDescriptor(window, 'ResizeObserver');
    TestResizeObserver.instances = [];
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: TestResizeObserver,
    });
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue(
      [{} as DOMRect] as unknown as DOMRectList,
    );

    await TestBed.configureTestingModule({
      imports: [MasterDetailHost, NestedMasterDetailHost],
    }).compileComponents();
  });

  afterEach(() => {
    if (resizeObserverDescriptor) {
      Object.defineProperty(window, 'ResizeObserver', resizeObserverDescriptor);
    } else {
      Reflect.deleteProperty(window, 'ResizeObserver');
    }
    vi.restoreAllMocks();
  });

  it('keeps both consumer panes available in wide mode without owning layout anatomy', () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();

    const root = byId(fixture.nativeElement, 'master-detail');
    const primary = byId(fixture.nativeElement, 'primary');
    const detail = byId(fixture.nativeElement, 'detail');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.getAttribute('data-compact')).toBeNull();
    expect(primary.hidden).toBe(false);
    expect(detail.hidden).toBe(false);
    expect(primary.hasAttribute('inert')).toBe(false);
    expect(detail.hasAttribute('inert')).toBe(false);
    expect(primary.getAttribute('aria-hidden')).toBeNull();
    expect(detail.getAttribute('aria-hidden')).toBeNull();
    expect(back.hidden).toBe(true);

    expect(root.querySelector('[hellResizable]')).toBeNull();
    expect(root.querySelector('[hellResizableHandle]')).toBeNull();
    expect(root.querySelector('hell-pagination, hell-overflow-toolbar, hell-toolbar')).toBeNull();
    expect(root.querySelectorAll(':scope > section')).toHaveLength(2);
  });

  it('switches accessible pane visibility without destroying consumer state', () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const root = byId(fixture.nativeElement, 'master-detail');
    const primary = byId(fixture.nativeElement, 'primary');
    const detail = byId(fixture.nativeElement, 'detail');
    const detailState = byId<HTMLInputElement>(fixture.nativeElement, 'detail-state');

    expect(root.getAttribute('data-compact')).toBe('true');
    expect(byId(fixture.nativeElement, 'compact-state').textContent?.trim()).toBe('true');
    expect(primary.hidden).toBe(false);
    expect(detail.hidden).toBe(true);
    expect(detail.getAttribute('aria-hidden')).toBe('true');
    expect(detail.hasAttribute('inert')).toBe(true);
    expect(primary.getAttribute('data-active')).toBe('true');
    expect(detail.getAttribute('data-active')).toBe('false');

    fixture.componentInstance.detailOpen.set(true);
    fixture.detectChanges();

    expect(primary.hidden).toBe(true);
    expect(primary.getAttribute('aria-hidden')).toBe('true');
    expect(primary.hasAttribute('inert')).toBe(true);
    expect(detail.hidden).toBe(false);
    expect(detail.getAttribute('aria-hidden')).toBeNull();
    expect(detail.hasAttribute('inert')).toBe(false);
    expect(byId(fixture.nativeElement, 'detail-state')).toBe(detailState);
    expect((detailState as HTMLInputElement).value).toBe('detail preserved');
  });

  it('focuses compact detail on open and restores the opener through the model output on back', async () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const opener = byId<HTMLButtonElement>(fixture.nativeElement, 'open-detail');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushFocus();

    expect(fixture.componentInstance.detailOpen()).toBe(true);
    expect(back.hidden).toBe(false);
    expect(document.activeElement).toBe(back);

    back.click();
    fixture.detectChanges();
    await flushFocus();

    expect(fixture.componentInstance.detailEvents).toEqual([false]);
    expect(fixture.componentInstance.detailOpen()).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('skips a saved opener that becomes aria-disabled and leaves the tab order', async () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const opener = byId<HTMLButtonElement>(fixture.nativeElement, 'open-detail');
    const primaryFallback = byId<HTMLInputElement>(fixture.nativeElement, 'primary-state');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushFocus();

    opener.setAttribute('aria-disabled', 'true');
    opener.setAttribute('tabindex', '-1');
    back.click();
    fixture.detectChanges();
    await flushFocus();

    expect(fixture.componentInstance.detailOpen()).toBe(false);
    expect(document.activeElement).toBe(primaryFallback);
  });

  it('skips a non-rendered preferred Back candidate for a safe detail control', async () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const opener = byId<HTMLButtonElement>(fixture.nativeElement, 'open-detail');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');
    const detailFallback = byId<HTMLInputElement>(fixture.nativeElement, 'detail-state');
    Object.defineProperty(back, 'getClientRects', {
      configurable: true,
      value: () => [] as unknown as DOMRectList,
    });

    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushFocus();

    expect(fixture.componentInstance.detailOpen()).toBe(true);
    expect(document.activeElement).toBe(detailFallback);
  });

  it('moves focus out of a pane that becomes hidden during a breakpoint transition', async () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();

    const detailState = byId<HTMLInputElement>(fixture.nativeElement, 'detail-state');
    const opener = byId<HTMLButtonElement>(fixture.nativeElement, 'open-detail');
    detailState.focus();
    expect(document.activeElement).toBe(detailState);

    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();
    await flushFocus();

    expect(byId(fixture.nativeElement, 'detail').hidden).toBe(true);
    expect(document.activeElement).toBe(opener);
  });

  it('moves focus off the compact Back button when the controller becomes wide', async () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const opener = byId<HTMLButtonElement>(fixture.nativeElement, 'open-detail');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');
    const detailState = byId<HTMLInputElement>(fixture.nativeElement, 'detail-state');
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await flushFocus();
    expect(document.activeElement).toBe(back);

    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();
    await flushFocus();

    expect(back.hidden).toBe(true);
    expect(byId(fixture.nativeElement, 'primary').hidden).toBe(false);
    expect(byId(fixture.nativeElement, 'detail').hidden).toBe(false);
    expect(document.activeElement).toBe(detailState);
  });

  it('keeps Back focus and activation within the nearest nested controller', async () => {
    const fixture = TestBed.createComponent(NestedMasterDetailHost);
    fixture.detectChanges();
    observeWidth(fixture.nativeElement, 500, 'outer-master-detail');
    observeWidth(fixture.nativeElement, 500, 'nested-master-detail');
    fixture.detectChanges();

    const outerOpener = byId<HTMLButtonElement>(fixture.nativeElement, 'outer-opener');
    const outerBack = byId<HTMLButtonElement>(fixture.nativeElement, 'outer-back');
    const nestedBack = byId<HTMLButtonElement>(fixture.nativeElement, 'nested-back');
    outerOpener.focus();
    outerOpener.click();
    fixture.detectChanges();
    await flushFocus();

    expect(nestedBack.compareDocumentPosition(outerBack) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(document.activeElement).toBe(outerBack);

    nestedBack.focus();
    observeWidth(fixture.nativeElement, 900, 'outer-master-detail');
    fixture.detectChanges();
    await flushFocus();

    expect(outerBack.hidden).toBe(true);
    expect(nestedBack.hidden).toBe(false);
    expect(document.activeElement).toBe(nestedBack);

    nestedBack.click();
    fixture.detectChanges();
    await flushFocus();

    expect(fixture.componentInstance.outerOpen()).toBe(true);
    expect(fixture.componentInstance.nestedOpen()).toBe(false);
    expect(document.activeElement).toBe(
      byId<HTMLButtonElement>(fixture.nativeElement, 'nested-primary-control'),
    );
  });

  it('uses local root Part Style Maps without reviving owned Split View parts', () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();

    const root = byId(fixture.nativeElement, 'master-detail');
    const primary = byId(fixture.nativeElement, 'primary');
    const back = query<HTMLButtonElement>(fixture.nativeElement, '[hellMasterDetailBack]');

    expect(root.className).toContain('bg-hell-surface-muted');
    expect(primary.className).toContain('bg-hell-primary-soft');
    expect(back.className).toContain('text-hell-primary');
    expect(primary.getAttribute('data-slot')).toBe('root');
    expect(back.getAttribute('data-slot')).toBe('root');
    expect(root.querySelector('[data-slot="pane"], [data-slot="compactHeader"]')).toBeNull();
  });

  it('disconnects the owner-window ResizeObserver on destroy', () => {
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();
    const observer = TestResizeObserver.instances[0];
    expect(observer?.observed).toBe(byId(fixture.nativeElement, 'master-detail'));

    fixture.destroy();

    expect(observer?.disconnected).toBe(true);
  });

  it('falls back to the owner-window resize event and removes the listener on destroy', () => {
    Object.defineProperty(window, 'ResizeObserver', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const fixture = TestBed.createComponent(MasterDetailHost);
    fixture.detectChanges();

    const root = byId(fixture.nativeElement, 'master-detail');
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(500);
    const resizeListener = add.mock.calls.find(([name]) => name === 'resize')?.[1];
    if (typeof resizeListener !== 'function') throw new Error('Expected owner-window resize listener.');
    resizeListener(new Event('resize'));
    fixture.detectChanges();

    expect(root.getAttribute('data-compact')).toBe('true');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('resize', resizeListener);
  });
});

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  observed: Element | null = null;
  disconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed = element;
  }

  disconnect(): void {
    this.disconnected = true;
  }

  trigger(width: number): void {
    const entry = { contentRect: { width } } as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

function observeWidth(root: HTMLElement, width: number, hostId = 'master-detail'): void {
  const host = byId(root, hostId);
  const observer = TestResizeObserver.instances.find((candidate) => candidate.observed === host);
  if (!observer) throw new Error('Expected Master Detail ResizeObserver.');
  observer.trigger(width);
}

async function flushFocus(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function byId<T extends HTMLElement = HTMLElement>(root: ParentNode, id: string): T {
  return query<T>(root, `#${id}`);
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
