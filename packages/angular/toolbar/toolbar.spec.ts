import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_TOOLBAR_DIRECTIVES,
  hellResolveToolbarOverflow,
  provideHellToolbarLabels,
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

  it('pins widgets inline and never menu-ifies them, even collapsed to nothing', () => {
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'widget', width: 200 },
        { kind: 'action', priority: 'default', width: 100 },
      ],
      { available: 0, gap: 8, triggerWidth: 40 },
    );

    // The widget stays inline; the default collapses into the menu.
    expect(result.inline).toEqual([0]);
    expect(result.overflow).toEqual([1]);
  });

  it('renders a separator inline only when it divides two visible groups', () => {
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'default', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
      ],
      { available: 1000, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([0, 1, 2]);
    expect(result.overflow).toEqual([]);
  });

  it('drops a separator that would sit at the boundary of a collapsed group', () => {
    // Only the leading group fits; the separator and trailing group collapse.
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'default', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
      ],
      { available: 150, gap: 8, triggerWidth: 40 },
    );

    // Leading group [0] inline; the separator is not inline (nothing inline
    // after it) and not in the menu (nothing overflowed before it).
    expect(result.inline).toEqual([0]);
    expect(result.overflow).toEqual([2, 3]);
  });

  it('collapses a trailing separated group as a unit', () => {
    // Widths chosen so action 2 alone would fit, but its group [2,3] is atomic.
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'default', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
      ],
      // Enough for [0] + separator + one of the trailing group, but not both.
      { available: 268, gap: 8, triggerWidth: 40 },
    );

    // The whole trailing group collapses rather than showing a half-group.
    expect(result.inline).toEqual([0]);
    expect(result.overflow).toEqual([2, 3]);
  });

  it('collapses the leading group action-by-action even with a trailing group present', () => {
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'default', width: 100, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
      ],
      // Room for two controls + trigger: the trailing group goes first (atomic),
      // then the leading group erodes from its last-declared default.
      { available: 300, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([0, 1]);
    expect(result.overflow).toEqual([3]);
  });

  it('places a separator inline and in the menu when it divides both views', () => {
    // Pinned items surround two collapsed groups: the surviving inline divider
    // sits between the primary and the widget, while the separator between the
    // two collapsed groups also divides them in the menu.
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'primary', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'default', width: 100, group: 1 },
        { kind: 'separator', width: 10, group: 1 },
        { kind: 'action', priority: 'default', width: 100, group: 2 },
        { kind: 'widget', width: 100, group: 2 },
      ],
      { available: 260, gap: 8, triggerWidth: 40 },
    );

    expect(result.inline).toEqual([0, 1, 5]);
    expect(result.overflow).toEqual([2, 3, 4]);
  });

  it('places a menu separator between two overflowed groups', () => {
    const result = hellResolveToolbarOverflow(
      [
        { kind: 'action', priority: 'primary', width: 100, group: 0 },
        { kind: 'separator', width: 10, group: 0 },
        { kind: 'action', priority: 'overflowOnly', width: 100, group: 1 },
        { kind: 'separator', width: 10, group: 1 },
        { kind: 'action', priority: 'overflowOnly', width: 100, group: 2 },
      ],
      { available: 1000, gap: 8, triggerWidth: 40 },
    );

    // Primary inline (no inline separator — nothing inline after it); the menu
    // shows both overflowOnly actions divided by their separator.
    expect(result.inline).toEqual([0]);
    expect(result.overflow).toEqual([2, 3, 4]);
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

@Component({
  imports: [...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <hell-toolbar label="Editor">
      <ng-template hellToolbarAction label="Bold" iconOnly (activated)="log('bold')">
        <span class="glyph">B</span>
      </ng-template>
      <ng-template hellToolbarSeparator></ng-template>
      <ng-template hellToolbarAction label="Align left" iconOnly>
        <span class="glyph">L</span>
      </ng-template>
      <ng-template hellToolbarWidget>
        <input class="search" type="search" aria-label="Search" />
      </ng-template>
    </hell-toolbar>
  `,
})
class CapabilitiesHost {
  readonly events: string[] = [];
  log(action: string): void {
    this.events.push(action);
  }
}

@Component({
  imports: [...HELL_TOOLBAR_DIRECTIVES],
  providers: [provideHellToolbarLabels({ overflowTrigger: 'Weitere Aktionen' })],
  template: `
    <hell-toolbar label="Localized">
      <ng-template hellToolbarAction label="One" priority="primary"></ng-template>
      <ng-template hellToolbarAction label="Two" priority="overflowOnly"></ng-template>
    </hell-toolbar>
  `,
})
class LocalizedToolbarHost {}

describe('HellToolbar', () => {
  let originalResizeObserver: typeof ResizeObserver | undefined;
  let originalRect: typeof HTMLElement.prototype.getBoundingClientRect;
  const mounted: HTMLElement[] = [];

  const mount = (fixture: { nativeElement: HTMLElement; detectChanges(): void }): void => {
    document.body.appendChild(fixture.nativeElement);
    mounted.push(fixture.nativeElement);
  };

  beforeEach(async () => {
    originalResizeObserver = globalThis.ResizeObserver;
    originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = measuredRect;
    TestResizeObserver.instances = [];
    globalThis.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

    await TestBed.configureTestingModule({
      imports: [ToolbarHost, WidthToolbarHost, CapabilitiesHost, LocalizedToolbarHost],
    }).compileComponents();
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver as typeof ResizeObserver;
    HTMLElement.prototype.getBoundingClientRect = originalRect;
    cleanupPortaledTestElements('[hellMenu]');
    while (mounted.length) mounted.pop()?.remove();
  });

  it('starts collapsed to its pinned items before the first measurement commits', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    // No measurement has run (no ResizeObserver frame), so only the primary is
    // inline and every default sits in the overflow menu — no clipped flash.
    expect(actionLabels(fixture.nativeElement)).toEqual(['Save']);
    expect(fixture.nativeElement.querySelector('[data-slot="overflowTrigger"]')).toBeInstanceOf(
      HTMLElement,
    );
  });

  it('renders primary/default inline and keeps overflowOnly actions out of the inline row', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    const toolbar = query(fixture.nativeElement, 'hell-toolbar');
    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBe('Record actions');
    expect(toolbar.getAttribute('data-slot')).toBe('root');

    expect(actionLabels(fixture.nativeElement)).toEqual(['Save', 'Edit']);

    // overflowOnly actions never render inline; the trigger is present.
    expect(fixture.nativeElement.querySelector('[data-slot="overflowTrigger"]')).toBeInstanceOf(
      HTMLElement,
    );
  });

  it('activates an action from the inline button rendering', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    actionButtons(fixture.nativeElement)[0].click();
    expect(fixture.componentInstance.events).toEqual(['save']);
  });

  it('activates an action from the overflow menu rendering with disabled parity', async () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.componentInstance.archiveDisabled.set(true);
    await settle(fixture);
    drive(fixture, 1000);

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
    drive(fixture, 1000);

    const host = fixture.nativeElement as HTMLElement;
    const controls = Array.from(
      host.querySelectorAll<HTMLElement>(
        '[data-hell-toolbar-actions] [data-hell-toolbar-control]',
      ),
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

    // Widen-then-recompute: narrowing again restores the exact narrow membership
    // (container growth cached widths, so no width-0 oscillation loses actions).
    available = 300;
    observe(row, 300);
    fixture.detectChanges();
    expect(actionLabels(fixture.nativeElement)).toEqual(['One', 'Two']);
  });

  it('merges toolbar ui refinements through the forwarded action part', () => {
    const fixture = TestBed.createComponent(ToolbarHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    const toolbar = query(fixture.nativeElement, 'hell-toolbar');
    expect(toolbar.className).toContain('bg-hell-surface-muted');
    expect(actionButtons(fixture.nativeElement)[0].className).toContain('font-semibold');
  });

  it('renders an icon-only action with its label as the accessible name and no visible text', () => {
    const fixture = TestBed.createComponent(CapabilitiesHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    const bold = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-slot="action"][data-item-index="0"]',
    );
    expect(bold.getAttribute('aria-label')).toBe('Bold');
    expect(bold.getAttribute('title')).toBe('Bold');
    expect(bold.hasAttribute('data-icon-only')).toBe(true);
    expect(bold.querySelector('.hell-toolbar-action-label')).toBeNull();
  });

  it('renders an inline separator between groups and a menu separator when collapsed', async () => {
    const fixture = TestBed.createComponent(CapabilitiesHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    // Wide: the separator divides the two inline groups.
    expect(fixture.nativeElement.querySelector('[data-slot="separator"]')).toBeInstanceOf(
      HTMLElement,
    );

    // Narrow: actions collapse; the widget stays inline and the menu carries a
    // menu separator between the overflowed groups. (A positive width keeps the
    // measurement from short-circuiting on a zero-width container.)
    drive(fixture, 60);
    expect(fixture.nativeElement.querySelector('[data-slot="widget"]')).toBeInstanceOf(HTMLElement);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="overflowTrigger"]').click();
    await waitForOverlayElements(fixture, 'button[hellMenuItem]');
    expect(document.body.querySelector('[hellMenuSeparator]')).toBeInstanceOf(HTMLElement);
  });

  it('keeps a widget inline and in the roving order but never in the overflow menu', () => {
    const fixture = TestBed.createComponent(CapabilitiesHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 60);

    // The widget stays visible even when every action has collapsed.
    const search = query<HTMLInputElement>(fixture.nativeElement, 'input.search');
    expect(search.isConnected).toBe(true);

    // The widget's control participates in the single roving tab order.
    const host = fixture.nativeElement as HTMLElement;
    const rovingStops = Array.from(
      host.querySelectorAll<HTMLElement>(
        '[data-hell-toolbar-actions] [tabindex="0"], [data-hell-toolbar-actions] [tabindex="-1"]',
      ),
    );
    expect(rovingStops).toContain(search);
  });

  it('resolves the overflow trigger label from the Label Contract, overridable per input', () => {
    const fixture = TestBed.createComponent(LocalizedToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    const trigger = query(fixture.nativeElement, '[data-slot="overflowTrigger"]');
    expect(trigger.getAttribute('aria-label')).toBe('Weitere Aktionen');
  });

  it('moves focus to the overflow trigger when the focused action collapses out of the row', () => {
    const fixture = TestBed.createComponent(WidthToolbarHost);
    mount(fixture);
    fixture.detectChanges();

    const row = query(fixture.nativeElement, '[data-hell-toolbar-actions]');
    let available = 1000;
    Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => available });

    observe(row, 1000);
    fixture.detectChanges();

    // Focus the last inline action, then narrow so it collapses out.
    const buttons = actionButtons(fixture.nativeElement);
    const last = buttons[buttons.length - 1];
    last.focus();
    last.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    expect(last.isConnected).toBe(true);

    available = 220;
    observe(row, 220);
    fixture.detectChanges();

    const trigger = query(fixture.nativeElement, '[data-slot="overflowTrigger"]');
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps the tab stop on the focused control when a commit shifts its position', () => {
    const fixture = TestBed.createComponent(CapabilitiesHost);
    mount(fixture);
    fixture.detectChanges();
    drive(fixture, 1000);

    // Wide: focus the widget's input (last control in the roving order).
    const search = query<HTMLInputElement>(fixture.nativeElement, 'input.search');
    search.focus();
    search.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    expect(search.getAttribute('tabindex')).toBe('0');

    // Narrow: the icon actions collapse, so the still-focused input moves to
    // the front of the roving order. The re-rendered row must keep the tab
    // stop on the focused control, not on whatever now sits at its old index.
    drive(fixture, 60);

    expect(document.activeElement).toBe(search);
    expect(search.getAttribute('tabindex')).toBe('0');
    const trigger = query(fixture.nativeElement, '[data-slot="overflowTrigger"]');
    expect(trigger.getAttribute('tabindex')).toBe('-1');
  });
});

function measuredRect(this: HTMLElement): DOMRect {
  let width = 0;
  if (this.matches('[data-slot="action"]')) width = 100;
  else if (this.matches('button.hell-toolbar-measure-item')) width = 100;
  else if (this.matches('.hell-toolbar-measure-item')) width = 12;
  else if (this.matches('[data-slot="separator"]')) width = 12;
  else if (this.matches('[data-slot="widget"]')) width = 160;
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

/** Drives one deterministic measurement pass at the given container width. */
function drive(
  fixture: { nativeElement: HTMLElement; detectChanges(): void },
  width: number,
): void {
  const row = query(fixture.nativeElement, '[data-hell-toolbar-actions]');
  Object.defineProperty(row, 'clientWidth', { configurable: true, get: () => width });
  observe(row, width);
  fixture.detectChanges();
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
