import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellTooltip, HellTooltipTrigger } from './tooltip';

@Component({
  imports: [HellTooltip, HellTooltipTrigger],
  template: `
    <ng-template #tooltip>
      <div hellTooltip>Tooltip</div>
    </ng-template>
    <button id="disabled-button" type="button" [hellTooltipTrigger]="tooltip" disabled>
      Button
    </button>
    <a id="disabled-anchor" href="#tooltip" [hellTooltipTrigger]="tooltip" disabled>Anchor</a>
  `,
})
class DisabledTooltipTriggerHost {}

describe('HellTooltipTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DisabledTooltipTriggerHost] }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reflects disabled semantics on buttons and anchors', () => {
    const fixture = TestBed.createComponent(DisabledTooltipTriggerHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#disabled-button');
    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#disabled-anchor');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
    expect(document.body.textContent).not.toContain('Tooltip');
  });
});

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
