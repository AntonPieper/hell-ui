import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellPopover, HellPopoverTrigger } from './popover';

@Component({
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Popover');
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

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
