import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_ACCORDION_IMPORTS } from './accordion';

@Component({
  imports: [...HELL_ACCORDION_IMPORTS],
  template: `
    <div
      id="accordion"
      hellAccordion
      type="single"
      collapsible
      [value]="value()"
      ui="rounded-hell-lg border-hell-danger"
      (valueChange)="value.set($any($event))"
    >
      <div data-accordion="install-item" hellAccordionItem value="install" [ui]="itemUi">
        <button data-accordion="install-trigger" hellAccordionTrigger [ui]="triggerUi">
          Installation
        </button>
        <div data-accordion="install-content" hellAccordionContent [ui]="contentUi">
          <div>Install with pnpm.</div>
        </div>
      </div>

      <div data-accordion="theming-item" hellAccordionItem value="theming">
        <button data-accordion="theming-trigger" hellAccordionTrigger>Theming</button>
        <div data-accordion="theming-content" hellAccordionContent>
          <div>Override semantic tokens.</div>
        </div>
      </div>
    </div>
  `,
})
class AccordionHost {
  readonly value = signal<string | null>('install');

  protected readonly itemUi = {
    root: 'border-b-0',
  };

  protected readonly triggerUi = {
    root: 'px-hell-7 text-hell-danger',
  };

  protected readonly contentUi = {
    root: 'text-hell-foreground',
  };
}

describe('HellAccordion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccordionHost] }).compileComponents();
  });

  it('exposes local root Part Style Maps while preserving accordion state behavior', () => {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();

    const accordion = query(fixture.nativeElement, '#accordion');
    const installItem = query(fixture.nativeElement, '[data-accordion="install-item"]');
    const installTrigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-accordion="install-trigger"]',
    );
    const installContent = query(fixture.nativeElement, '[data-accordion="install-content"]');
    const themingTrigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-accordion="theming-trigger"]',
    );
    const themingContent = query(fixture.nativeElement, '[data-accordion="theming-content"]');

    expect(accordion.getAttribute('data-slot')).toBe('root');
    expect(accordion.classList.contains('rounded-hell-lg')).toBe(true);
    expect(accordion.classList.contains('rounded-hell-md')).toBe(false);
    expect(accordion.classList.contains('border-hell-danger')).toBe(true);
    expect(accordion.classList.contains('border-hell-border')).toBe(false);

    expect(installItem.getAttribute('data-slot')).toBe('root');
    expect(installItem.getAttribute('data-open')).toBe('');
    expect(installItem.classList.contains('border-b-0')).toBe(true);
    expect(installItem.classList.contains('border-b')).toBe(false);
    expect(installTrigger.type).toBe('button');
    expect(installTrigger.getAttribute('data-slot')).toBe('root');
    expect(installTrigger.getAttribute('data-open')).toBe('');
    expect(installTrigger.classList.contains('px-hell-7')).toBe(true);
    expect(installTrigger.classList.contains('px-hell-5')).toBe(false);
    expect(installTrigger.classList.contains('text-hell-danger')).toBe(true);
    expect(installTrigger.classList.contains('text-hell-foreground')).toBe(false);
    expect(installContent.getAttribute('data-slot')).toBe('root');
    expect(installContent.getAttribute('data-open')).toBe('');
    expect(installContent.getAttribute('aria-hidden')).toBeNull();
    expect(installContent.getAttribute('inert')).toBeNull();
    expect(installContent.classList.contains('text-hell-foreground')).toBe(true);
    expect(installContent.classList.contains('text-hell-foreground-muted')).toBe(false);

    expect(themingContent.getAttribute('aria-hidden')).toBe('true');
    expect(themingContent.getAttribute('inert')).toBe('');

    themingTrigger.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('theming');
    expect(installContent.getAttribute('aria-hidden')).toBe('true');
    expect(installContent.getAttribute('inert')).toBe('');
    expect(themingTrigger.getAttribute('data-open')).toBe('');
    expect(themingContent.getAttribute('aria-hidden')).toBeNull();
    expect(themingContent.getAttribute('inert')).toBeNull();
  });
});

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
