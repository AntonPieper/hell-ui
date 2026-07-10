import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_TOOLBAR_DIRECTIVES,
  hellResolveToolbarOverflow,
  type HellToolbarOverflowItem,
  type HellToolbarUi,
} from './toolbar';

describe('hellResolveToolbarOverflow', () => {
  const item = (
    priority: HellToolbarOverflowItem['priority'],
    width: number,
  ): HellToolbarOverflowItem => ({ priority, width });

  it('keeps every action inline when the row is wide enough', () => {
    const result = hellResolveToolbarOverflow(
      [item('default', 100), item('default', 100), item('primary', 100)],
      { available: 1000, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([0, 1, 2]);
    expect(result.overflow).toEqual([]);
  });

  it('overflows default actions from the last-declared first, reserving trigger width', () => {
    // widths 100, gap 8, trigger 40. available 300 fits 2 defaults + trigger.
    const result = hellResolveToolbarOverflow(
      [item('default', 100), item('default', 100), item('default', 100), item('default', 100)],
      { available: 300, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([0, 1]);
    expect(result.overflow).toEqual([2, 3]);
  });

  it('never overflows a primary action, even when it does not fit', () => {
    const result = hellResolveToolbarOverflow(
      [item('default', 100), item('primary', 100), item('primary', 100)],
      { available: 10, gap: 8, triggerWidth: 40 },
    );

    // Both primaries stay inline; only the default collapses.
    expect(result.inline).toEqual([1, 2]);
    expect(result.overflow).toEqual([0]);
  });

  it('never renders an overflowOnly action inline, even with unlimited room', () => {
    const result = hellResolveToolbarOverflow(
      [item('overflowOnly', 100), item('default', 100), item('primary', 100)],
      { available: 100_000, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([1, 2]);
    expect(result.overflow).toEqual([0]);
  });

  it('preserves declaration order across mixed priorities', () => {
    const result = hellResolveToolbarOverflow(
      [
        item('default', 100),
        item('overflowOnly', 100),
        item('primary', 100),
        item('default', 100),
      ],
      { available: 148, gap: 8, triggerWidth: 40 },
    );

    // Room for the single primary + trigger only; both defaults collapse and
    // join the overflowOnly action in declaration order.
    expect(result.inline).toEqual([2]);
    expect(result.overflow).toEqual([0, 1, 3]);
  });
});

@Component({
  imports: [...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <hell-toolbar label="Record actions" [ui]="ui">
      <ng-template hellToolbarAction label="Save" priority="primary" (activated)="log('save')">
        <span class="icon">S</span>
      </ng-template>
      <ng-template hellToolbarAction label="Edit" (activated)="log('edit')">
        <span class="icon">E</span>
      </ng-template>
      <ng-template
        hellToolbarAction
        label="Archive"
        priority="overflowOnly"
        [disabled]="archiveDisabled()"
        (activated)="log('archive')"
      ></ng-template>
      <ng-template hellToolbarAction label="Delete" priority="overflowOnly" (activated)="log('delete')">
      </ng-template>
    </hell-toolbar>
  `,
})
class ToolbarHost {
  readonly archiveDisabled = signal(false);
  readonly events: string[] = [];
  readonly ui = {
    root: 'bg-hell-surface-muted',
    action: 'font-semibold',
  } satisfies HellToolbarUi;

  log(action: string): void {
    this.events.push(action);
  }
}

@Component({
  imports: [...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <hell-toolbar label="Bulk actions">
      @for (label of labels(); track label) {
        <ng-template hellToolbarAction [label]="label"><span>·</span></ng-template>
      }
    </hell-toolbar>
  `,
})
class WidthToolbarHost {
  readonly labels = signal(['One', 'Two', 'Three', 'Four']);
}

describe('HellToolbar', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;
  const mounted: HTMLElement[] = [];

  const mount = (fixture: { nativeElement: HTMLElement; detectChanges(): void }): void => {
    document.body.appendChild(fixture.nativeElement);
    mounted.push(fixture.nativeElement);
  };

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver;
    TestResizeObserver.instances = [];
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [ToolbarHost, WidthToolbarHost],
    }).compileComponents();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    cleanupPortaledTestElements('[hellMenu]');
    while (mounted.length) mounted.pop()?.remove();
  });

  it('renders primary/default inline and keeps overflowOnly actions out of the inline row', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    const toolbar = query(fixture.nativeElement, 'hell-toolbar');
    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBe('Record actions');
    expect(toolbar.getAttribute('data-slot')).toBe('root');

    expect(actionLabels(fixture.nativeElement)).toEqual(['Save', 'Edit']);

    // overflowOnly actions never render inline; the trigger is present.
    expect(fixture.nativeElement.querySelector('[data-slot="overflowTrigger"]')).toBeInstanceOf(
      HTMLElement,
    );
    expect(toolbar.querySelector('[data-slot="root"]')).toBeNull();
  });

  it('activates an action from the inline button rendering', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    actionButtons(fixture.nativeElement)[0].click();
    expect(fixture.componentInstance.events).toEqual(['save']);
  });

  it('activates an action from the overflow menu rendering with disabled parity', async () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.componentInstance.archiveDisabled.set(true);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="overflowTrigger"]').click();
    const items = await waitForOverlayElements(fixture, 'button[hellMenuItem]');
    const labels = items.map((item) => item.textContent?.trim());
    expect(labels).toEqual(['Archive', 'Delete']);

    const archive = items[0];
    const del = items[1];
    // Disabled state carries into the menu rendering identically.
    expect(archive.hasAttribute('disabled')).toBe(true);
    expect(del.hasAttribute('disabled')).toBe(false);

    del.click();
    expect(fixture.componentInstance.events).toEqual(['delete']);
  });

  it('exposes a single roving tab stop that moves with the arrow keys', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const controls = Array.from(
      host.querySelectorAll<HTMLElement>('[data-hell-toolbar-control]'),
    );
    expect(controls.map((control) => control.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    const toolbar = query(fixture.nativeElement, 'hell-toolbar');
    controls[0].focus();
    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(document.activeElement).toBe(controls[1]);
    expect(controls.map((control) => control.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);

    toolbar.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(controls[2]);
  });

  it('recomputes overflow membership from the observed container width without losing actions', () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = measuredRect;

    try {
      const fixture = TestBed.createComponent(WidthToolbarHost);
      mount(fixture);
      fixture.detectChanges();

      const row = query(fixture.nativeElement, '[data-hell-toolbar-actions]');
      let available = 300;
      Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => available });

      // Narrow: only two default actions fit alongside the reserved trigger.
      observe(row, 300);
      fixture.detectChanges();
      expect(actionLabels(fixture.nativeElement)).toEqual(['One', 'Two']);
      expect(fixture.nativeElement.querySelector('[data-slot="overflowTrigger"]')).toBeInstanceOf(
        HTMLElement,
      );

      // Wide: every action returns to the inline row, none lost, no trigger.
      available = 1000;
      observe(row, 1000);
      fixture.detectChanges();
      expect(actionLabels(fixture.nativeElement)).toEqual(['One', 'Two', 'Three', 'Four']);
      expect(fixture.nativeElement.querySelector('[data-slot="overflowTrigger"]')).toBeNull();
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it('merges toolbar ui refinements through the forwarded action part', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    const toolbar = query(fixture.nativeElement, 'hell-toolbar');
    expect(toolbar.className).toContain('bg-hell-surface-muted');
    expect(actionButtons(fixture.nativeElement)[0].className).toContain('font-semibold');
  });
});

function measuredRect(this: HTMLElement): DOMRect {
  let width = 0;
  if (this.matches('[data-slot="action"]')) width = 100;
  else if (this.matches('[data-slot="overflowTrigger"]')) width = 40;
  return {
    width,
    height: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

function actionButtons(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-slot="action"]'));
}

function actionLabels(root: HTMLElement): string[] {
  return actionButtons(root).map(
    (button) => button.querySelector('.hell-toolbar-action-label')?.textContent?.trim() ?? '',
  );
}

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

function observe(row: Element, width: number): void {
  const observer = TestResizeObserver.instances.find((instance) => instance.observed === row);
  if (!observer) throw new Error('Expected ResizeObserver on the actions row.');
  observer.trigger(width);
}

async function settle(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

async function waitForOverlayElements<T extends HTMLElement>(
  fixture: { detectChanges(): void },
  selector: string,
): Promise<T[]> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    fixture.detectChanges();
    const elements = Array.from(document.body.querySelectorAll<T>(selector));
    if (elements.length) return elements;
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
  throw new Error(`Expected overlay elements for ${selector}.`);
}

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of Array.from(document.body.querySelectorAll(selector))) {
    element.remove();
  }
}
