import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton, type HellButtonUi } from './button';

@Component({
  imports: [HellButton],
  template: `
    <button id="native" hellButton [disabled]="disabled()">Native</button>
    <button id="submit" hellButton type="submit">Submit</button>
    <a id="anchor" hellButton href="#next" [disabled]="disabled()">Anchor</a>
    <button id="styled" hellButton variant="primary" size="sm" iconOnly block type="button">
      Styled
    </button>
    <button id="custom" hellButton [ui]="customUi" type="button">Custom</button>
  `,
})
class ButtonHost {
  readonly disabled = signal(false);
  readonly customUi = {
    root: 'bg-hell-danger px-hell-7 data-hover:bg-hell-danger-hover',
  } satisfies HellButtonUi;
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

  it('renders the root part recipe without the legacy button class', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#styled');

    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.classList.contains('hell-button')).toBe(false);
    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain(
      'bg-[var(--hell-button-background,var(--color-hell-primary))]',
    );
    expect(button.className).toContain('h-hell-control-sm');
    expect(button.className).toContain('px-0');
    expect(button.className).toContain('w-full');
    expect(button.getAttribute('data-variant')).toBe('primary');
    expect(button.getAttribute('data-size')).toBe('sm');
    expect(button.getAttribute('data-icon-only')).toBe('');
    expect(button.getAttribute('data-block')).toBe('');
  });

  it('merges consumer root classes through the Part Style Map', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, '#custom');
    const classes = button.className.split(/\s+/);

    expect(button.className).toContain('bg-hell-danger');
    expect(button.className).toContain('px-hell-7');
    expect(button.className).toContain('data-hover:bg-hell-danger-hover');
    expect(classes).not.toContain(
      'bg-[var(--hell-button-background,var(--color-hell-surface-elevated))]',
    );
    expect(classes).not.toContain('px-hell-5');
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

    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(disabledClick)).toBe(false);
    expect(disabledClick.defaultPrevented).toBe(true);
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
