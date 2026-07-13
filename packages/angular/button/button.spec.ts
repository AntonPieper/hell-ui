import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton } from './button';

@Component({
  imports: [HellButton],
  template: `
    <button id="native" hellButton [disabled]="disabled()">Native</button>
    <button id="submit" hellButton type="submit">Submit</button>
    <a id="anchor" hellButton href="#next" [disabled]="disabled()">Anchor</a>
    <button id="styled" hellButton variant="primary" size="sm" iconOnly block type="button">
      Styled
    </button>
    <button
      id="custom-string"
      hellButton
      ui="bg-hell-danger px-hell-7 shadow-hell-lg data-hover:bg-hell-danger-hover"
      type="button"
    >
      Custom string
    </button>
    <button id="custom-map" hellButton [ui]="customUi" type="button">Custom map</button>
    <button id="dynamic-map" hellButton [ui]="dynamicUi()" type="button">Dynamic map</button>
    <button id="class-hook" hellButton class="mt-4 bg-hell-danger" type="button">Class hook</button>
    <button id="link" hellButton variant="link" size="lg" type="button">Link</button>
  `,
})
class ButtonHost {
  readonly disabled = signal(false);
  readonly customUi = {
    root: 'bg-hell-danger px-hell-7 shadow-hell-lg data-hover:bg-hell-danger-hover',
  };
  readonly dynamicUi = signal<{ root?: string }>({
    root: 'bg-hell-danger px-hell-7',
  });
}

describe('HellButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonHost] }).compileComponents();
  });

  it('defaults button hosts to non-submit without overriding explicit submit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    expect(query<HTMLButtonElement>(fixture.nativeElement, '#native').type).toBe('button');
    expect(query<HTMLButtonElement>(fixture.nativeElement, '#submit').type).toBe('submit');
  });

  it('renders the root part recipe with variant and size state attributes', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#styled');

    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain('bg-hell-primary');
    expect(button.className).toContain('h-hell-control-sm');
    expect(button.className).toContain('px-0');
    expect(button.className).toContain('shrink-0');
    expect(button.className).toContain('w-full');
    expect(button.getAttribute('data-variant')).toBe('primary');
    expect(button.getAttribute('data-size')).toBe('sm');
    expect(button.getAttribute('data-icon-only')).toBe('');
    expect(button.getAttribute('data-block')).toBe('');
  });

  it('uses string ui shorthand for the root part with deterministic precedence', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#custom-string');
    const classes = button.className.split(/\s+/);

    expect(button.className).toContain('bg-hell-danger');
    expect(button.className).toContain('px-hell-7');
    expect(button.className).toContain('shadow-hell-lg');
    expect(button.className).toContain('data-hover:bg-hell-danger-hover');
    expect(classes).not.toContain('bg-hell-surface-elevated');
    expect(classes).not.toContain('px-hell-5');
    expect(classes).not.toContain('shadow-hell-xs');
  });

  it('keeps explicit root part maps for typed consumers', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#custom-map');

    expect(button.className).toContain('bg-hell-danger');
    expect(button.className).toContain('px-hell-7');
    expect(button.className).toContain('shadow-hell-lg');
    expect(button.className).toContain('data-hover:bg-hell-danger-hover');
  });

  it('reacts to ui signal input updates through the public binding', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#dynamic-map');

    expect(button.className).toContain('bg-hell-danger');
    expect(button.className).toContain('px-hell-7');

    fixture.componentInstance.dynamicUi.set({
      root: 'bg-hell-success-strong px-hell-3',
    });
    fixture.detectChanges();

    const classes = button.className.split(/\s+/);

    expect(classes).toContain('bg-hell-success-strong');
    expect(classes).toContain('px-hell-3');
    expect(classes).not.toContain('bg-hell-danger');
    expect(classes).not.toContain('px-hell-7');
  });

  it('keeps template class additive but outside the Tailwind merge path', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#class-hook');

    expect(button.className).toContain('mt-4');
    expect(button.className).toContain('bg-hell-danger');
    expect(button.className).toContain('bg-hell-surface-elevated');
  });

  it('lets the link variant own sizing after semantic size recipes', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const link = query<HTMLButtonElement>(fixture.nativeElement, '#link');
    const classes = link.className.split(/\s+/);

    expect(classes).toContain('h-auto');
    expect(classes).toContain('p-0');
    expect(classes).not.toContain('h-hell-control-lg');
    expect(classes).not.toContain('px-hell-6');
  });

  it('keeps anchor disabled semantics explicit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, '#anchor');
    const enabledClick = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(anchor.getAttribute('aria-disabled')).toBeNull();
    expect(anchor.getAttribute('tabindex')).toBeNull();
    expect(anchor.dispatchEvent(enabledClick)).toBe(true);
    expect(enabledClick.defaultPrevented).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const disabledClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const disabledEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });

    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(disabledClick)).toBe(false);
    expect(disabledClick.defaultPrevented).toBe(true);
    expect(anchor.dispatchEvent(disabledEnter)).toBe(false);
    expect(disabledEnter.defaultPrevented).toBe(true);
  });

  it('keeps native disabled for button hosts', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#native');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
