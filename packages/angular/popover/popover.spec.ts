import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

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
    <a id="disabled-anchor" href="#popover" [hellPopoverTrigger]="popover" disabled>Anchor</a>
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

describe('HellPopoverTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EnabledPopoverAnchorTriggerHost,
        DisabledPopoverTriggerHost,
        CloseablePopoverTriggerHost,
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
    expect(popover.className).toContain('rounded-hell-pill');
    expect(popover.className).not.toContain('rounded-hell-md');
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
