import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellPopover, HellPopoverTrigger } from './popover';

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
      <div hellPopover>Popover</div>
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

describe('HellPopoverTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnabledPopoverAnchorTriggerHost, DisabledPopoverTriggerHost],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
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

    expect(container.textContent).toContain('Popover');

    const closeClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(closeClick);
    await waitForPopoverOverlayTextToDisappear(fixture, container, 'Popover');
    await waitForPopoverTriggerClosed(fixture, anchor);
    await waitForPopoverCloseEvent(fixture);
    expect(container.textContent).not.toContain('Popover');
  });

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

  it('ignores missing or non-updatable overlay seams', () => {
    const host = createPopoverPatchHost();

    expect(() => configureOverlayClose(host, null)).not.toThrow();
    expect(() => configureOverlayClose(host, undefined)).not.toThrow();
    expect(() => configureOverlayClose(host, {})).not.toThrow();
    expect(() => configureOverlayClose(host, { updateConfig: null })).not.toThrow();
    expect(host.trigger.openChange.emit).not.toHaveBeenCalled();
  });

  it('patches callable overlay close config with a destroy guard', () => {
    const host = createPopoverPatchHost();
    const updateConfig = vi.fn();

    configureOverlayClose(host, { updateConfig });

    expect(updateConfig).toHaveBeenCalledOnce();
    expect(updateConfig).toHaveBeenCalledWith({ onClose: expect.any(Function) });

    const config = updateConfig.mock.calls[0][0] as { onClose: () => void };
    config.onClose();
    expect(host.trigger.openChange.emit).toHaveBeenCalledExactlyOnceWith(false);

    host.destroyed = true;
    config.onClose();
    expect(host.trigger.openChange.emit).toHaveBeenCalledOnce();
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

async function waitForPopoverOverlayText(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  container: HTMLElement,
  text: string,
): Promise<void> {
  const timeout = Date.now() + 1000;
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
  const timeout = Date.now() + 1000;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (!container.textContent?.includes(text)) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected container content to not contain ${text}.`);
}

async function waitForPopoverOpenEvent(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown>; componentInstance: EnabledPopoverAnchorTriggerHost },
): Promise<void> {
  await waitForPopoverEvent(fixture, true);
}

async function waitForPopoverCloseEvent(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown>; componentInstance: EnabledPopoverAnchorTriggerHost },
): Promise<void> {
  await waitForPopoverEvent(fixture, false);
}

async function waitForPopoverEvent(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown>; componentInstance: EnabledPopoverAnchorTriggerHost },
  open: boolean,
): Promise<void> {
  const timeout = Date.now() + 1000;
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
  const timeout = Date.now() + 1000;
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

interface PopoverPatchHost {
  destroyed: boolean;
  trigger: {
    openChange: {
      emit: ReturnType<typeof vi.fn>;
    };
  };
}

function createPopoverPatchHost(): PopoverPatchHost {
  return {
    destroyed: false,
    trigger: {
      openChange: {
        emit: vi.fn(),
      },
    },
  };
}

function configureOverlayClose(host: PopoverPatchHost, overlay: unknown): void {
  (
    HellPopoverTrigger.prototype as unknown as {
      configureOverlayClose(this: PopoverPatchHost, overlay: unknown): void;
    }
  ).configureOverlayClose.call(host, overlay);
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
