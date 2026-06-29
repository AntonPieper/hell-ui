import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_SPLIT_VIEW_DIRECTIVES, type HellSplitViewUi } from './split-view';

@Component({
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view
      [compactBelow]="compactBelow()"
      [detailOpen]="detailOpen()"
      [height]="height()"
      [itemNavigation]="itemNavigation()"
      [ui]="ui"
      itemNavigationLabel="Ticket navigation"
      previousItemLabel="Previous ticket"
      nextItemLabel="Next ticket"
      [previousItemDisabled]="previousItemDisabled()"
      [nextItemDisabled]="nextItemDisabled()"
      (detailOpenChange)="detailEvents.push($event)"
      (previousItem)="previousEvents.push('previous')"
      (nextItem)="nextEvents.push('next')"
    >
      <ng-template hellSplitPrimary let-compact="compact" let-detailOpen="detailOpen">
        <section id="primary">Primary {{ compact }} {{ detailOpen }}</section>
      </ng-template>
      <ng-template hellSplitDetail let-compact="compact" let-detailOpen="detailOpen">
        <section id="detail">Detail {{ compact }} {{ detailOpen }}</section>
      </ng-template>
    </hell-split-view>
  `,
})
class SplitViewHost {
  readonly compactBelow = signal(700);
  readonly detailOpen = signal(false);
  readonly height = signal<string | number | null>(null);
  readonly itemNavigation = signal(false);
  readonly previousItemDisabled = signal(false);
  readonly nextItemDisabled = signal(false);
  readonly detailEvents: boolean[] = [];
  readonly previousEvents: string[] = [];
  readonly nextEvents: string[] = [];
  readonly ui = {
    root: 'h-[420px] bg-hell-surface-muted',
    resizable: 'h-[410px] bg-hell-danger',
    screen: 'bg-hell-surface-elevated',
    pane: 'overflow-auto bg-hell-surface-subtle',
    compactHeader: 'bg-hell-danger p-hell-3',
    detailHeader: 'bg-hell-danger p-hell-3',
    itemNavigation: 'gap-hell-3',
  } satisfies HellSplitViewUi;
}

describe('HellSplitView', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver;
    TestResizeObserver.instances = [];
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [SplitViewHost],
    }).compileComponents();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
  });

  it('switches compact/detail rendering from observed width and emits from back action', () => {
    const fixture = TestBed.createComponent(SplitViewHost);
    fixture.detectChanges();

    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();

    expect(text(fixture.nativeElement, '#primary')).toContain('Primary false false');
    expect(text(fixture.nativeElement, '#detail')).toContain('Detail false false');

    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    expect(text(fixture.nativeElement, '#primary')).toContain('Primary true false');
    expect(fixture.nativeElement.querySelector('#detail')).toBeNull();

    fixture.componentInstance.detailOpen.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#primary')).toBeNull();
    expect(text(fixture.nativeElement, '#detail')).toContain('Detail true true');

    const back = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    back.click();

    expect(fixture.componentInstance.detailEvents).toEqual([false]);
  });

  it('normalizes numeric heights while preserving explicit CSS lengths', () => {
    const fixture = TestBed.createComponent(SplitViewHost);
    fixture.componentInstance.height.set(320);
    fixture.detectChanges();

    const splitView = fixture.nativeElement.querySelector('hell-split-view') as HTMLElement;
    expect(splitView.getAttribute('data-slot')).toBe('root');
    expect(splitView.style.getPropertyValue('--hell-split-view-height')).toBe('320px');

    fixture.componentInstance.height.set('min(70vh, 42rem)');
    fixture.detectChanges();

    expect(splitView.style.getPropertyValue('--hell-split-view-height')).toBe('min(70vh, 42rem)');
  });

  it('renders item navigation without replacing the resizable desktop layout', () => {
    const fixture = TestBed.createComponent(SplitViewHost);
    fixture.componentInstance.itemNavigation.set(true);
    fixture.componentInstance.previousItemDisabled.set(true);
    fixture.detectChanges();

    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-slot="resizable"]')).toBeInstanceOf(HTMLElement);
    expect(root.querySelector('[hellResizableHandle]')).toBeInstanceOf(HTMLElement);
    expect(root.querySelector('[data-slot="detailHeader"]')).toBeInstanceOf(HTMLElement);
    expect(root.querySelector('[data-slot="itemNavigation"] [hellPagination]')).toBeInstanceOf(
      HTMLElement,
    );

    expect(button(root, 'Previous ticket').disabled).toBe(true);
    expect(button(root, 'Next ticket').disabled).toBe(false);

    button(root, 'Previous ticket').click();
    button(root, 'Next ticket').click();

    expect(fixture.componentInstance.previousEvents).toEqual([]);
    expect(fixture.componentInstance.nextEvents).toEqual(['next']);

    fixture.componentInstance.previousItemDisabled.set(false);
    fixture.componentInstance.nextItemDisabled.set(true);
    fixture.detectChanges();

    expect(button(root, 'Previous ticket').disabled).toBe(false);
    expect(button(root, 'Next ticket').disabled).toBe(true);

    button(root, 'Previous ticket').click();
    button(root, 'Next ticket').click();

    expect(fixture.componentInstance.previousEvents).toEqual(['previous']);
    expect(fixture.componentInstance.nextEvents).toEqual(['next']);
  });

  it('merges split-view ui classes through owned camelCase parts', () => {
    const fixture = TestBed.createComponent(SplitViewHost);
    fixture.componentInstance.itemNavigation.set(true);
    fixture.detectChanges();

    observeWidth(fixture.nativeElement, 900);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const splitView = query(root, 'hell-split-view');
    const resizable = query(root, '[data-slot="resizable"]');
    const desktopPane = query(root, '[data-slot="pane"][data-pane="primary"]');
    const detailHeader = query(root, '[data-slot="detailHeader"]');
    const itemNavigation = query(root, '[data-slot="itemNavigation"]');

    expect(splitView.className).toContain('h-[420px]');
    expect(splitView.className).not.toContain('h-full');
    expect(splitView.getAttribute('data-detail-open')).toBe(null);
    expect(resizable.className).toContain('h-[410px]');
    expect(resizable.className).not.toContain('h-full');
    expect(desktopPane.className).toContain('overflow-auto');
    expect(desktopPane.className).not.toContain('overflow-hidden');
    expect(detailHeader.className).toContain('bg-hell-danger');
    expect(detailHeader.className).toContain('p-hell-3');
    expect(itemNavigation.className).toContain('gap-hell-3');

    fixture.componentInstance.detailOpen.set(true);
    observeWidth(fixture.nativeElement, 500);
    fixture.detectChanges();

    const screen = query(root, '[data-slot="screen"]');
    const compactHeader = query(root, '[data-slot="compactHeader"]');
    expect(splitView.getAttribute('data-compact')).toBe('true');
    expect(splitView.getAttribute('data-detail-open')).toBe('true');
    expect(screen.className).toContain('bg-hell-surface-elevated');
    expect(compactHeader.className).toContain('bg-hell-danger');
  });
});

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  observed: Element | null = null;

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed = element;
  }

  disconnect(): void {}

  trigger(width: number): void {
    const entry = { contentRect: { width } } as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

function observeWidth(root: HTMLElement, width: number): void {
  const host = root.querySelector('hell-split-view');
  const observer = TestResizeObserver.instances.find((instance) => instance.observed === host);
  if (!observer) throw new Error('Expected ResizeObserver.');
  observer.trigger(width);
}

function text(root: HTMLElement, selector: string): string {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element.textContent ?? '';
}

function button(root: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const element = root.querySelector(`button[aria-label="${ariaLabel}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${ariaLabel} button.`);
  return element;
}

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
