import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton } from './button';

@Component({
  imports: [HellButton],
  template: `
    <button hellButton type="button" [disabled]="disabled()">Native</button>
    <a hellButton href="#next" [disabled]="disabled()">Anchor</a>
  `,
})
class ButtonHost {
  readonly disabled = signal(false);
}

describe('HellButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ButtonHost] }).compileComponents();
  });

  it('keeps anchor disabled semantics explicit', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();

    const anchor = query<HTMLAnchorElement>(fixture.nativeElement, 'a[hellButton]');
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

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellButton]');

    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
