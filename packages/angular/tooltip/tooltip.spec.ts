import { Component, TemplateRef, signal, viewChild, type ElementRef } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgpTooltipTriggerStateToken } from 'ng-primitives/tooltip';

import {
  HellTooltip,
  HellTooltipSurface,
  provideHellTooltipDefaults,
  type HellTooltipDefaults,
} from './tooltip';

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

@Component({
  selector: 'hell-spec-guaranteed-timing-host',
  imports: [HellTooltip],
  template: `<button type="button" hellTooltip="Hint">Guaranteed</button>`,
})
class GuaranteedTimingHost {}

@Component({
  selector: 'hell-spec-scoped-defaults-host',
  imports: [HellTooltip],
  providers: [
    provideHellTooltipDefaults({ showDelay: 120, placement: 'bottom', cooldown: 40, offset: 10 }),
  ],
  template: `<button type="button" hellTooltip="Hint">Scoped</button>`,
})
class ScopedDefaultsHost {}

@Component({
  selector: 'hell-spec-nested-defaults-child',
  imports: [HellTooltip],
  providers: [provideHellTooltipDefaults({ hideDelay: 80, showDelay: undefined })],
  template: `<button type="button" hellTooltip="Hint">Nested</button>`,
})
class NestedDefaultsChild {}

@Component({
  selector: 'hell-spec-nested-defaults-host',
  imports: [NestedDefaultsChild],
  providers: [provideHellTooltipDefaults({ showDelay: 120, cooldown: 40 })],
  template: `<hell-spec-nested-defaults-child />`,
})
class NestedDefaultsHost {}

@Component({
  selector: 'hell-spec-local-precedence-host',
  imports: [HellTooltip],
  providers: [provideHellTooltipDefaults({ placement: 'bottom', showDelay: 120, offset: 10 })],
  template: `
    <button type="button" hellTooltip="Hint" placement="left" [showDelay]="25">Local</button>
  `,
})
class LocalPrecedenceHost {}

@Component({
  selector: 'hell-spec-excluded-defaults-host',
  imports: [HellTooltip],
  providers: [
    provideHellTooltipDefaults({
      hoverableContent: false,
      useTextContent: true,
      disabled: true,
      content: 'smuggled',
    } as unknown as HellTooltipDefaults),
  ],
  template: `<button type="button" hellTooltip="Hint">Excluded</button>`,
})
class ExcludedDefaultsHost {}

@Component({
  selector: 'hell-spec-forwarded-capabilities-host',
  imports: [HellTooltip],
  template: `
    <div #anchorEl></div>
    <div #containerEl></div>
    <button
      type="button"
      hellTooltip="Hint"
      placement="right-start"
      offset="12"
      [flip]="false"
      [shift]="false"
      [showDelay]="5"
      [hideDelay]="6"
      [cooldown]="7"
      [container]="containerEl"
      [showOnOverflow]="true"
      [anchor]="anchorEl"
      [position]="position"
      [trackPosition]="true"
      scrollBehavior="close"
    >
      Forwarded
    </button>
  `,
})
class ForwardedCapabilitiesHost {
  readonly anchorEl = viewChild.required<ElementRef<HTMLElement>>('anchorEl');
  readonly containerEl = viewChild.required<ElementRef<HTMLElement>>('containerEl');
  readonly position = { x: 24, y: 48 };
}

@Component({
  selector: 'hell-spec-hover-travel-host',
  imports: [HellTooltip],
  template: `
    <button id="travel-trigger" type="button" hellTooltip="Hint" [showDelay]="0" [hideDelay]="0">
      Travel
    </button>
  `,
})
class HoverTravelTooltipHost {
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

describe('HellTooltip scoped defaults', () => {
  it('guarantees 500ms show delay, 0ms hide delay, and 300ms cooldown without overrides', () => {
    const fixture = TestBed.createComponent(GuaranteedTimingHost);
    fixture.detectChanges();

    const state = engineState(fixture);
    expect(state.showDelay()).toBe(500);
    expect(state.hideDelay()).toBe(0);
    expect(state.cooldown()).toBe(300);
  });

  it('applies partial scoped defaults while keeping guaranteed values for unspecified keys', () => {
    const fixture = TestBed.createComponent(ScopedDefaultsHost);
    fixture.detectChanges();

    const state = engineState(fixture);
    expect(state.showDelay()).toBe(120);
    expect(state.placement()).toBe('bottom');
    expect(state.cooldown()).toBe(40);
    expect(state.offset()).toBe(10);
    expect(state.hideDelay()).toBe(0);
  });

  it('merges a nested provider over its nearest ancestor instead of resetting values', () => {
    const fixture = TestBed.createComponent(NestedDefaultsHost);
    fixture.detectChanges();

    const state = engineState(fixture);
    // Refined by the nested provider.
    expect(state.hideDelay()).toBe(80);
    // Inherited from the ancestor provider; the nested partial (including its
    // explicit `showDelay: undefined`) must not reset them.
    expect(state.showDelay()).toBe(120);
    expect(state.cooldown()).toBe(40);
  });

  it('lets local trigger inputs win over every provider', () => {
    const fixture = TestBed.createComponent(LocalPrecedenceHost);
    fixture.detectChanges();

    const state = engineState(fixture);
    expect(state.placement()).toBe('left');
    expect(state.showDelay()).toBe(25);
    // No local input, so the scoped default still applies.
    expect(state.offset()).toBe(10);
  });

  it('cannot configure content, disabled state, host-text fallback, or hoverability', () => {
    const fixture = TestBed.createComponent(ExcludedDefaultsHost);
    fixture.detectChanges();

    const state = engineState(fixture);
    expect(state.hoverableContent()).toBe(true);
    expect(state.useTextContent()).toBe(false);
    expect(state.disabled()).toBe(false);
  });
});

describe('HellTooltip forwarded capabilities', () => {
  it('forwards positioning and behavior inputs to the delegated engine under upstream types', () => {
    const fixture = TestBed.createComponent(ForwardedCapabilitiesHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const state = engineState(fixture);
    expect(state.placement()).toBe('right-start');
    expect(state.offset()).toBe(12);
    expect(state.flip()).toBe(false);
    expect(state.shift()).toBe(false);
    expect(state.showDelay()).toBe(5);
    expect(state.hideDelay()).toBe(6);
    expect(state.cooldown()).toBe(7);
    expect(state.container()).toBe(host.containerEl().nativeElement);
    expect(state.showOnOverflow()).toBe(true);
    expect(state.anchor()).toBe(host.anchorEl().nativeElement);
    expect(state.position()).toEqual({ x: 24, y: 48 });
    expect(state.trackPosition()).toBe(true);
    expect(state.scrollBehavior()).toBe('close');
  });
});

describe('HellTooltip invariants', () => {
  it('always renders a hoverable surface that suppresses entrance motion under reduced motion', async () => {
    const fixture = TestBed.createComponent(HoverTravelTooltipHost);
    fixture.detectChanges();

    expect(engineState(fixture).hoverableContent()).toBe(true);

    fixture.componentInstance.hellTrigger().show();
    const tooltip = await waitForTooltip(fixture);

    expect(tooltip.hasAttribute('data-hoverable')).toBe(false);
    expect(tooltip.className).toContain('pointer-events-auto');
    expect(tooltip.className).not.toContain('pointer-events-none');
    expect(tooltip.className).toContain('animate-[hell-pop-in');
    expect(tooltip.className).toContain('motion-reduce:animate-none');

    fixture.componentInstance.hellTrigger().hide();
    await waitFor(fixture, () => !fixture.componentInstance.hellTrigger().open());
    cleanupPortaledTestElements('[hellTooltipSurface]');
  });

  it('keeps the tooltip open while the pointer travels from the trigger onto the surface', async () => {
    const fixture = TestBed.createComponent(HoverTravelTooltipHost);
    fixture.detectChanges();
    const directive = fixture.componentInstance.hellTrigger();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#travel-trigger');
    // The delegated hover bridge computes a travel corridor from real layout
    // boxes; give the boxless test DOM a trigger and a surface 10px above it.
    trigger.getBoundingClientRect = () => new DOMRect(0, 100, 100, 20);
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    const tooltip = await waitForTooltip(fixture);
    tooltip.getBoundingClientRect = () => new DOMRect(0, 60, 100, 30);

    trigger.dispatchEvent(
      new MouseEvent('mouseleave', { bubbles: true, clientX: 50, clientY: 100 }),
    );
    tooltip.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    await settleFrames(fixture, 5);
    expect(directive.open()).toBe(true);
    expect(queryTooltip()).not.toBeNull();

    tooltip.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    await waitFor(fixture, () => !directive.open());
    expect(queryTooltip()).toBeNull();
    cleanupPortaledTestElements('[hellTooltipSurface]');
  });

  it('closes on Escape without moving focus', async () => {
    const fixture = TestBed.createComponent(HoverTravelTooltipHost);
    fixture.detectChanges();
    const directive = fixture.componentInstance.hellTrigger();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#travel-trigger');
    trigger.focus();
    await waitForTooltip(fixture);
    expect(directive.open()).toBe(true);
    expect(document.activeElement).toBe(trigger);

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitFor(fixture, () => !directive.open());

    expect(directive.open()).toBe(false);
    expect(queryTooltip()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    cleanupPortaledTestElements('[hellTooltipSurface]');
  });
});

/**
 * Reads the delegated engine's public trigger state from the trigger's element
 * injector — the same seam `HellTooltipSurface` and upstream consumers use.
 */
function engineState(fixture: ComponentFixture<unknown>) {
  return fixture.debugElement
    .query(By.directive(HellTooltip))
    .injector.get(NgpTooltipTriggerStateToken)();
}

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
