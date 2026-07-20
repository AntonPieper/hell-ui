import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_FLOATING_SCOPE,
  containsNode,
  type HellFloatingScope,
} from '@hell-ui/angular/internal/core';

import { HellPopover, HellPopoverTrigger } from './popover';

const POPOVER_TEST_TIMEOUT_MS = 15000;
const POPOVER_TEST_CASE_TIMEOUT_MS = 30000;

beforeAll(() => {
  const elementPrototype = Element.prototype as Element & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
});

@Component({
  selector: 'hell-popover-enabled-anchor-trigger-host',
  imports: [HellPopover, HellPopoverTrigger],
  template: `
    <ng-template #popover>
      <div hellPopover ui="rounded-hell-pill bg-hell-primary">Popover</div>
    </ng-template>
    <a
      id="enabled-anchor"
      href="#popover"
      [hellPopoverTrigger]="popover"
      [container]="container"
      (openChange)="openEvents.push($event)"
    >
      Anchor
    </a>
    <div id="popover-container" #container></div>
  `,
})
class EnabledPopoverAnchorTriggerHost {
  readonly openEvents: boolean[] = [];
}

@Component({
  selector: 'hell-popover-disabled-anchor-trigger-host',
  imports: [HellPopover, HellPopoverTrigger],
  template: `
    <ng-template #popover>
      <div hellPopover>Popover</div>
    </ng-template>
    <button id="disabled-button" type="button" [hellPopoverTrigger]="popover" disabled>
      Button
    </button>
    <a
      id="disabled-anchor"
      href="#popover"
      tabindex="0"
      [hellPopoverTrigger]="popover"
      disabled
    >
      Anchor
    </a>
    <button id="authored-tabindex" tabindex="-1" [hellPopoverTrigger]="popover">
      Authored tabindex
    </button>
    <button id="native-tabindex" [hellPopoverTrigger]="popover">Native tabindex</button>
  `,
})
class DisabledPopoverTriggerHost {}

@Component({
  selector: 'hell-popover-closeable-trigger-host',
  imports: [HellPopover, HellPopoverTrigger],
  template: `
    <ng-template #popover>
      <div hellPopover>
        <button id="inside-action" type="button">Inside action</button>
        Popover
      </div>
    </ng-template>
    <button
      id="button-trigger"
      type="button"
      [hellPopoverTrigger]="popover"
      [container]="container"
      (openChange)="openEvents.push($event)"
    >
      Button
    </button>
    <button id="outside-target" type="button">Outside</button>
    <div id="popover-container" #container></div>
  `,
})
class CloseablePopoverTriggerHost {
  readonly openEvents: boolean[] = [];
}

@Component({
  selector: 'hell-popover-non-modal-host',
  imports: [HellPopover, HellPopoverTrigger],
  template: `
    <ng-template #popover>
      <div hellPopover id="nonmodal-panel">
        <button id="panel-action" type="button">Panel action</button>
        Popover
      </div>
    </ng-template>
    <button
      id="nonmodal-trigger"
      type="button"
      [hellPopoverTrigger]="popover"
      [container]="container"
      [trapFocus]="trapFocus"
      [boundary]="boundary"
      (openChange)="openEvents.push($event)"
    >
      Trigger
    </button>
    <div id="boundary-zone">
      <button id="boundary-action" type="button">Boundary action</button>
    </div>
    <button id="outside-target" type="button">Outside</button>
    <div id="popover-container" #container></div>
  `,
})
class NonModalPopoverHost {
  trapFocus = false;
  boundary: HTMLElement | null = null;
  readonly openEvents: boolean[] = [];
}

@Injectable()
class FakeFloatingScope implements HellFloatingScope {
  readonly registered: HTMLElement[] = [];

  registerFloatingElement(element: HTMLElement): void {
    this.registered.push(element);
  }

  unregisterFloatingElement(element: HTMLElement): void {
    const index = this.registered.indexOf(element);
    if (index >= 0) this.registered.splice(index, 1);
  }

  containsFloatingTarget(target: EventTarget | Node | null): boolean {
    return this.registered.some((element) => containsNode(element, target));
  }
}

@Component({
  selector: 'hell-popover-scoped-non-modal-host',
  imports: [HellPopover, HellPopoverTrigger],
  providers: [FakeFloatingScope, { provide: HELL_FLOATING_SCOPE, useExisting: FakeFloatingScope }],
  template: `
    <ng-template #popover>
      <div hellPopover>Popover</div>
    </ng-template>
    <button
      id="scoped-trigger"
      type="button"
      [hellPopoverTrigger]="popover"
      [container]="container"
      [trapFocus]="false"
    >
      Trigger
    </button>
    <button id="nested-surface" type="button">Nested surface</button>
    <button id="outside-target" type="button">Outside</button>
    <div id="popover-container" #container></div>
  `,
})
class ScopedNonModalPopoverHost {}

describe('HellPopoverTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EnabledPopoverAnchorTriggerHost,
        DisabledPopoverTriggerHost,
        CloseablePopoverTriggerHost,
        NonModalPopoverHost,
        ScopedNonModalPopoverHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellPopover]');
  });

  it('opens from enabled anchors without leaving default navigation', async () => {
    const fixture = TestBed.createComponent(EnabledPopoverAnchorTriggerHost);
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#enabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);

    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, anchor);
    await waitForPopoverOpenEvent(fixture);

    const popover = query<HTMLElement>(container, '[hellPopover]');
    expect(popover.getAttribute('data-slot')).toBe('root');
    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(popover.className).toContain('rounded-hell-pill');
    expect(popover.className).toContain('bg-hell-primary');
    expect(container.textContent).toContain('Popover');

    const closeClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(closeClick);
    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, anchor);
    await waitForPopoverCloseEvent(fixture);
    expect(container.textContent).not.toContain('Popover');
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('reflects disabled semantics on buttons and anchors', () => {
    const fixture = TestBed.createComponent(DisabledPopoverTriggerHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#disabled-button');
    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#disabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    expect(document.body.textContent).not.toContain('Popover');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default
    // surface classes without asserting individual utilities elsewhere.
    it('keeps the default surface classes stable', async () => {
      const fixture = TestBed.createComponent(CloseablePopoverTriggerHost);
      fixture.detectChanges();

      const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#button-trigger');
      const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
      trigger.click();

      await waitForPopoverOverlayText(fixture, container, 'Popover');
      await waitForPopoverTriggerOpen(fixture, trigger);
      await waitForPopoverOpenEvent(fixture);

      const popover = query<HTMLElement>(container, '[hellPopover]');
      expect({
        popover: popover.className.split(/\s+/).filter(Boolean).sort(),
      }).toMatchSnapshot('popover');
    }, POPOVER_TEST_CASE_TIMEOUT_MS);
  });

  it('preserves authored tabindex on enabled buttons without adding one to native triggers', () => {
    const fixture = TestBed.createComponent(DisabledPopoverTriggerHost);
    fixture.detectChanges();

    const authored = query<HTMLButtonElement>(fixture.nativeElement, '#authored-tabindex');
    const native = query<HTMLButtonElement>(fixture.nativeElement, '#native-tabindex');

    expect(authored.getAttribute('tabindex')).toBe('-1');
    expect(native.hasAttribute('tabindex')).toBe(false);
  });

  it('emits close when outside pointer interaction closes button popovers', async () => {
    const fixture = TestBed.createComponent(CloseablePopoverTriggerHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#button-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);
    await waitForPopoverOpenEvent(fixture);

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
    outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
    await waitForPopoverCloseEvent(fixture);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('emits close when button triggers toggle open popovers', async () => {
    const fixture = TestBed.createComponent(CloseablePopoverTriggerHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#button-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);
    await waitForPopoverOpenEvent(fixture);

    trigger.click();

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
    await waitForPopoverCloseEvent(fixture);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('emits close when Escape closes button popovers', async () => {
    const fixture = TestBed.createComponent(CloseablePopoverTriggerHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#button-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);
    await waitForPopoverOpenEvent(fixture);

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
    await waitForPopoverCloseEvent(fixture);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('skips the focus trap and keeps focus on the trigger when trapFocus is false', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.focus();
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);

    const panel = query<HTMLElement>(container, '[hellPopover]');
    expect(panel.hasAttribute('data-focus-trap')).toBe(false);
    expect(panel.getAttribute('aria-modal')).toBe('false');
    expect(document.activeElement).toBe(trigger);

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
    expect(document.activeElement).toBe(trigger);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('keeps the focus trap and modal semantics by default', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.componentInstance.trapFocus = true;
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);

    const panel = query<HTMLElement>(container, '[hellPopover]');
    expect(panel.hasAttribute('data-focus-trap')).toBe(true);
    expect(panel.hasAttribute('aria-modal')).toBe(false);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('does not restore focus to the trigger when an outside click closes a non-modal popover', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    query<HTMLButtonElement>(container, '#panel-action').focus();

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
    outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
    expect(document.activeElement).not.toBe(trigger);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('closes a non-modal popover when focus moves outside', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.focus();
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
    outside.focus();

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('treats interactions inside the boundary as inside the popover', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.componentInstance.boundary = query<HTMLElement>(
      fixture.nativeElement,
      '#boundary-zone',
    );
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);

    const boundaryAction = query<HTMLButtonElement>(fixture.nativeElement, '#boundary-action');
    boundaryAction.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }),
    );
    boundaryAction.focus();
    for (let i = 0; i < 5; i++) await settle(fixture);

    expect(container.textContent).toContain('Popover');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
    outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('treats nested Hell floating surfaces registered with the Floating Scope as inside', async () => {
    const fixture = TestBed.createComponent(ScopedNonModalPopoverHost);
    fixture.detectChanges();

    const scope = fixture.debugElement.injector.get(FakeFloatingScope);
    const nested = query<HTMLButtonElement>(fixture.nativeElement, '#nested-surface');
    scope.registerFloatingElement(nested);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#scoped-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    trigger.click();

    await waitForPopoverOverlayText(fixture, container, 'Popover');
    await waitForPopoverTriggerOpen(fixture, trigger);

    nested.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));
    nested.focus();
    for (let i = 0; i < 5; i++) await settle(fixture);

    expect(container.textContent).toContain('Popover');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
    outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));

    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, trigger);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('exposes reactive open state on the trigger', async () => {
    const fixture = TestBed.createComponent(NonModalPopoverHost);
    fixture.detectChanges();

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#nonmodal-trigger');
    const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
    const directive = fixture.debugElement
      .query((node) => node.nativeElement === trigger)
      .injector.get(HellPopoverTrigger);

    expect(directive.open()).toBe(false);

    trigger.click();
    await waitForPopoverOverlayText(fixture, container, 'Popover');
    expect(directive.open()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    expect(directive.open()).toBe(false);
  }, POPOVER_TEST_CASE_TIMEOUT_MS);

  it('does not emit through destroyed outputs when a previously opened popover tears down', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const fixture = TestBed.createComponent(CloseablePopoverTriggerHost);
      fixture.detectChanges();

      const trigger = query<HTMLButtonElement>(fixture.nativeElement, '#button-trigger');
      const container = query<HTMLElement>(fixture.nativeElement, '#popover-container');
      trigger.click();

      await waitForPopoverOverlayText(fixture, container, 'Popover');
      await waitForPopoverTriggerOpen(fixture, trigger);

      const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside-target');
      outside.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: 1, clientY: 1 }));
      await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
      await waitForPopoverTriggerClosed(fixture, trigger);

      fixture.destroy();
      await nextFrame();

      const messages = [...consoleWarn.mock.calls, ...consoleError.mock.calls]
        .flat()
        .map(String)
        .join('\n');
      expect(messages).not.toContain('NG0953');
    } finally {
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  }, POPOVER_TEST_CASE_TIMEOUT_MS);
});

async function settle(fixture: { detectChanges(): void }) {
  fixture.detectChanges();
  await Promise.resolve();
  await nextFrame();
  fixture.detectChanges();
}

async function waitForPopoverOverlayText(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  container: HTMLElement,
  text: string,
): Promise<void> {
  const timeout = Date.now() + POPOVER_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (container.textContent?.includes(text)) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected container content to contain ${text}.`);
}

async function waitForPopoverOverlayTextToDisappear(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  container: HTMLElement,
  text: string,
): Promise<void> {
  const timeout = Date.now() + POPOVER_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (!container.textContent?.includes(text)) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected container content to not contain ${text}.`);
}

async function waitForPopoverOpenEvent(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
  componentInstance: EnabledPopoverAnchorTriggerHost;
}): Promise<void> {
  await waitForPopoverEvent(fixture, true);
}

async function waitForPopoverCloseEvent(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
  componentInstance: EnabledPopoverAnchorTriggerHost;
}): Promise<void> {
  await waitForPopoverEvent(fixture, false);
}

async function waitForPopoverEvent(
  fixture: {
    detectChanges(): void;
    whenStable(): Promise<unknown>;
    componentInstance: EnabledPopoverAnchorTriggerHost;
  },
  open: boolean,
): Promise<void> {
  const timeout = Date.now() + POPOVER_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (fixture.componentInstance.openEvents.includes(open)) return;
    await nextFrame();
  }

  throw new Error(`Expected popover openChange to emit ${open}.`);
}

async function waitForPopoverTriggerOpen(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  trigger: HTMLElement,
): Promise<void> {
  await waitForPopoverTriggerState(fixture, trigger, 'true');
}

async function waitForPopoverTriggerClosed(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  trigger: HTMLElement,
): Promise<void> {
  await waitForPopoverTriggerState(fixture, trigger, 'false');
}

async function waitForPopoverTriggerState(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  trigger: HTMLElement,
  expanded: 'true' | 'false',
): Promise<void> {
  const timeout = Date.now() + POPOVER_TEST_TIMEOUT_MS;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (trigger.getAttribute('aria-expanded') === expanded) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected popover trigger aria-expanded to be ${expanded}.`);
}

async function nextFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }

  await Promise.resolve();
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of Array.from(document.body.querySelectorAll(selector))) {
    element.remove();
  }
}
