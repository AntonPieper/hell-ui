import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgpTooltipTrigger } from 'ng-primitives/tooltip';

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

@Component({
  imports: [HellTooltip, HellTooltipTrigger],
  template: `
    <div #tooltipContainer></div>
    <ng-template #tooltip>
      <div hellTooltip ui="rounded-hell-pill bg-hell-primary">Tooltip</div>
    </ng-template>
    <button
      id="trigger"
      type="button"
      [hellTooltipTrigger]="tooltip"
      [container]="tooltipContainer"
      [showDelay]="0"
    >
      Button
    </button>
  `,
})
class TooltipUiHost {
  readonly primitiveTrigger = viewChild.required(NgpTooltipTrigger);
}

describe('HellTooltipTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisabledTooltipTriggerHost, TooltipUiHost],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellTooltip]');
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

  it('merges tooltip root part styles on the rendered surface', async () => {
    const fixture = TestBed.createComponent(TooltipUiHost);
    fixture.detectChanges();

    query<HTMLButtonElement>(fixture.nativeElement, '#trigger');
    fixture.componentInstance.primitiveTrigger().show();

    const tooltip = await waitForTooltip(fixture, fixture.nativeElement);
    expect(tooltip.getAttribute('data-slot')).toBe('root');
    expect(tooltip.className).toContain('rounded-hell-pill');
    expect(tooltip.className).not.toContain('rounded-hell-sm');
    expect(tooltip.className).toContain('bg-hell-primary');
  });
});

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

async function waitForTooltip(fixture: {
  detectChanges(): void;
}, root: ParentNode = document): Promise<HTMLElement> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const tooltip = root.querySelector<HTMLElement>('[hellTooltip]');
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
