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
    <a id="enabled-anchor" href="#popover" [hellPopoverTrigger]="popover">Anchor</a>
  `,
})
class EnabledPopoverAnchorTriggerHost {}

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

    await waitForPopoverOverlayText(fixture, 'Popover');

    expect(document.body.textContent).toContain('Popover');

    const closeClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(closeClick);
    await waitForPopoverOverlayTextToDisappear(fixture, 'Popover');
    expect(document.body.textContent).not.toContain('Popover');
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
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

async function waitForPopoverOverlayText(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  text: string,
): Promise<void> {
  const timeout = Date.now() + 1000;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (document.body.textContent?.includes(text)) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected body content to contain ${text}.`);
}

async function waitForPopoverOverlayTextToDisappear(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  text: string,
): Promise<void> {
  const timeout = Date.now() + 1000;
  while (Date.now() < timeout) {
    await settle(fixture);
    if (!document.body.textContent?.includes(text)) {
      return;
    }
    await nextFrame();
  }

  throw new Error(`Expected body content to not contain ${text}.`);
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
