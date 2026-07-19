import { Component, TemplateRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellTooltip, HellTooltipSurface } from './tooltip';

beforeAll(() => {
  const elementPrototype = Element.prototype as Element & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
});

type TooltipContent = string | TemplateRef<unknown> | null | undefined;

@Component({
  imports: [HellTooltip, HellTooltipSurface],
  template: `
    <div #tooltipContainer></div>
    <ng-template #rich>
      <div class="rich-surface" hellTooltipSurface ui="rounded-hell-pill bg-hell-primary">
        Rich hint
      </div>
    </ng-template>
    <button
      id="trigger"
      type="button"
      class="trigger-own-class"
      [hellTooltip]="content()"
      [container]="tooltipContainer"
      [showDelay]="0"
      [hideDelay]="0"
      (openChange)="openEvents.push($event)"
    >
      Button
    </button>
  `,
})
class SwitchingTooltipHost {
  readonly rich = viewChild.required('rich', { read: TemplateRef });
  readonly hellTrigger = viewChild.required(HellTooltip);
  readonly openEvents: boolean[] = [];
  readonly content = signal<TooltipContent>('Plain hint');
}

@Component({
  imports: [HellTooltip],
  template: `
    <span id="plain-host" hellTooltip="Full label for a truncated cell" [showDelay]="0">
      Truncated…
    </span>
  `,
})
class ArbitraryHostTooltipHost {
  readonly hellTrigger = viewChild.required(HellTooltip);
}

@Component({
  imports: [HellTooltip],
  template: `
    <button id="native-disabled" type="button" hellTooltip="Hint" [showDelay]="0" disabled>
      Button
    </button>
  `,
})
class NativeDisabledTooltipHost {
  readonly hellTrigger = viewChild.required(HellTooltip);
}

describe('HellTooltip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchingTooltipHost, ArbitraryHostTooltipHost, NativeDisabledTooltipHost],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellTooltipSurface]');
  });

  it('renders a present string through an implicit surface with the explicit surface contract', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    fixture.detectChanges();

    fixture.componentInstance.hellTrigger().show();
    const tooltip = await waitForTooltip(fixture, fixture.nativeElement);

    expect(tooltip.textContent).toContain('Plain hint');
    expect(tooltip.getAttribute('role')).toBe('tooltip');
    expect(tooltip.getAttribute('data-slot')).toBe('root');
    expect(tooltip.className).toContain('rounded-hell-sm');
  });

  it('lets a template surface own its ui styling without styling the trigger', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    fixture.componentInstance.content.set(fixture.componentInstance.rich());
    fixture.detectChanges();

    fixture.componentInstance.hellTrigger().show();
    const tooltip = await waitForTooltip(fixture, fixture.nativeElement);

    expect(tooltip.classList.contains('rich-surface')).toBe(true);
    expect(tooltip.textContent).toContain('Rich hint');
    expect(tooltip.className).toContain('rounded-hell-pill');
    expect(tooltip.className).not.toContain('rounded-hell-sm');
    expect(tooltip.className).toContain('bg-hell-primary');

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#trigger');
    expect(trigger.className).toBe('trigger-own-class');
  });

  it('updates presentation across present content changes without a false lifecycle transition', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    fixture.detectChanges();
    const directive = fixture.componentInstance.hellTrigger();

    fixture.componentInstance.content.set('First');
    fixture.detectChanges();
    directive.show();
    await waitForTooltip(fixture, fixture.nativeElement);
    expect(directive.open()).toBe(true);
    expect(fixture.componentInstance.openEvents).toEqual([true]);

    fixture.componentInstance.content.set('Second');
    await waitFor(fixture, () =>
      queryTooltip(fixture.nativeElement)?.textContent?.includes('Second') ?? false,
    );
    expect(directive.open()).toBe(true);
    expect(fixture.componentInstance.openEvents).toEqual([true]);

    fixture.componentInstance.content.set(fixture.componentInstance.rich());
    await waitFor(
      fixture,
      () => queryTooltip(fixture.nativeElement)?.classList.contains('rich-surface') ?? false,
    );
    expect(directive.open()).toBe(true);
    expect(fixture.componentInstance.openEvents).toEqual([true]);

    fixture.componentInstance.content.set('Third');
    await waitFor(fixture, () =>
      queryTooltip(fixture.nativeElement)?.textContent?.includes('Third') ?? false,
    );
    expect(directive.open()).toBe(true);
    expect(fixture.componentInstance.openEvents).toEqual([true]);
  });

  it('treats null, undefined, and the empty string as absent content that disables opening', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    const directive = () => fixture.componentInstance.hellTrigger();

    for (const absent of ['', null, undefined] as const) {
      fixture.componentInstance.content.set(absent);
      fixture.detectChanges();

      directive().show();
      query<HTMLButtonElement>(fixture.nativeElement, '#trigger').dispatchEvent(
        new MouseEvent('mouseenter', { bubbles: true }),
      );
      await settleFrames(fixture, 5);

      expect(directive().open()).toBe(false);
      expect(queryTooltip(fixture.nativeElement)).toBeNull();
    }
    expect(fixture.componentInstance.openEvents).toEqual([]);
  });

  it('closes an open tooltip when present content becomes absent', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    fixture.detectChanges();
    const directive = fixture.componentInstance.hellTrigger();

    directive.show();
    await waitForTooltip(fixture, fixture.nativeElement);
    expect(directive.open()).toBe(true);

    fixture.componentInstance.content.set(null);
    await waitFor(fixture, () => !directive.open());

    expect(directive.open()).toBe(false);
    expect(queryTooltip(fixture.nativeElement)).toBeNull();
    expect(fixture.componentInstance.openEvents).toEqual([true, false]);
  });

  it('exposes the Anchored Surface Contract state on the trigger', async () => {
    const fixture = TestBed.createComponent(SwitchingTooltipHost);
    fixture.detectChanges();

    const directive = fixture.componentInstance.hellTrigger();
    expect(directive.open()).toBe(false);

    directive.show();
    await waitForTooltip(fixture, fixture.nativeElement);
    expect(directive.open()).toBe(true);
    expect(fixture.componentInstance.openEvents).toEqual([true]);

    directive.hide();
    await waitFor(fixture, () => !directive.open());
    expect(directive.open()).toBe(false);
    expect(fixture.componentInstance.openEvents).toEqual([true, false]);
  });

  it('works on an arbitrary host without adding focusability or an accessible name', async () => {
    const fixture = TestBed.createComponent(ArbitraryHostTooltipHost);
    fixture.detectChanges();

    const host = query<HTMLSpanElement>(fixture.nativeElement, '#plain-host');
    host.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const tooltip = await waitForTooltip(fixture);

    expect(fixture.componentInstance.hellTrigger().open()).toBe(true);
    expect(tooltip.textContent).toContain('Full label for a truncated cell');
    expect(host.getAttribute('tabindex')).toBeNull();
    expect(host.getAttribute('aria-label')).toBeNull();
    expect(host.getAttribute('aria-labelledby')).toBeNull();
    expect(tooltip.id).not.toBe('');
    expect(host.getAttribute('aria-describedby')).toBe(tooltip.id);
  });

  it('does not open on a natively disabled control and does not mutate the host', async () => {
    const fixture = TestBed.createComponent(NativeDisabledTooltipHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#native-disabled');
    const directive = fixture.componentInstance.hellTrigger();

    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    directive.show();
    await settleFrames(fixture, 5);

    expect(directive.open()).toBe(false);
    expect(queryTooltip()).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.getAttribute('tabindex')).toBeNull();

    button.disabled = false;
    await settleFrames(fixture, 2);
    directive.show();
    await waitForTooltip(fixture);
    expect(directive.open()).toBe(true);
  });
});

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function queryTooltip(root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>('[hellTooltipSurface]');
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of Array.from(document.body.querySelectorAll(selector))) {
    element.remove();
  }
}

async function waitFor(
  fixture: { detectChanges(): void },
  condition: () => boolean,
): Promise<void> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    if (condition()) return;
    await nextFrame();
    fixture.detectChanges();
  }

  throw new Error('Expected condition within timeout.');
}

async function settleFrames(fixture: { detectChanges(): void }, frames: number): Promise<void> {
  for (let frame = 0; frame < frames; frame += 1) {
    fixture.detectChanges();
    await nextFrame();
  }
  fixture.detectChanges();
}

async function waitForTooltip(
  fixture: { detectChanges(): void },
  root: ParentNode = document,
): Promise<HTMLElement> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const tooltip = queryTooltip(root);
    if (tooltip) return tooltip;
    await nextFrame();
    fixture.detectChanges();
  }

  throw new Error('Expected tooltip.');
}

async function nextFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }

  await Promise.resolve();
}
