import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDialpad } from './dialpad';
import { provideHellLabels } from '../../core/labels';

@Component({
  selector: 'app-dialpad-host',
  imports: [HellDialpad],
  template: `
    <hell-dialpad
      (digit)="digits.push($event)"
      (valueChange)="values.push($event)"
      (call)="calls.push($event)"
    />
  `,
})
class DialpadHost {
  readonly digits: string[] = [];
  readonly values: string[] = [];
  readonly calls: string[] = [];
}

@Component({
  selector: 'app-localized-dialpad-host',
  imports: [HellDialpad],
  providers: [
    provideHellLabels({
      dialpad: {
        dialpad: 'Telefonwählschieber',
        backspace: 'Rücktaste',
        call: 'Anrufen',
      },
    }),
  ],
  template: `<hell-dialpad />`,
})
class LocalizedDialpadHost {}

@Component({
  selector: 'app-controlled-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad [value]="value()" (valueChange)="values.push($event)" />`,
})
class ControlledDialpadHost {
  readonly value = signal<string>('');
  values: string[] = [];
}

describe('HellDialpad labels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialpadHost, LocalizedDialpadHost, ControlledDialpadHost],
    }).compileComponents();
  });

  it('uses default accessibility and action labels', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Dial pad');
    expect(query(host, '[data-slot="back"]').getAttribute('aria-label')).toBe('Backspace');
    expect(query(host, '[data-slot="call"]').textContent?.trim()).toBe('Call');
  });

  it('supports label overrides via provideHellLabels', () => {
    const fixture = TestBed.createComponent(LocalizedDialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Telefonwählschieber');
    expect(query(host, '[data-slot="back"]').getAttribute('aria-label')).toBe('Rücktaste');
    expect(query(host, '[data-slot="call"]').textContent?.trim()).toBe('Anrufen');
  });

  it('updates local display when value is uncontrolled', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;
    const firstDigit = [...host.querySelectorAll('[data-slot="key"]')].find(
      (button) => button.textContent?.trim() === '1',
    );
    if (!(firstDigit instanceof HTMLElement)) {
      throw new Error('Expected a dialpad digit button.');
    }

    firstDigit.click();
    fixture.detectChanges();

    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('1');
    expect(query(host, '[data-slot="back"]').getAttribute('disabled')).toBeNull();
  });

  it('handles host keyboard digits and backspace', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    const digit = dispatchKey(dialpad, '5');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual(['5']);
    expect(fixture.componentInstance.values).toEqual(['5']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('5');

    const backspace = dispatchKey(dialpad, 'Backspace');
    fixture.detectChanges();

    expect(backspace.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['5', '']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('');
  });

  it('treats an explicit empty controlled value as controlled state', () => {
    const fixture = TestBed.createComponent(ControlledDialpadHost);
    fixture.componentInstance.value.set('');
    fixture.detectChanges();

    const host = fixture.nativeElement;
    const backspace = query(host, '[data-slot="back"]');
    const firstDigit = [...host.querySelectorAll('[data-slot="key"]')].find(
      (button) => button.textContent?.trim() === '1',
    );
    if (!(firstDigit instanceof HTMLElement)) {
      throw new Error('Expected a dialpad digit button.');
    }

    expect(backspace.getAttribute('disabled')).toBe('');

    firstDigit.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual(['1']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('');
    expect(backspace.getAttribute('disabled')).toBe('');
  });

  it('supports keyboard call and clear shortcuts', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    dispatchKey(dialpad, '5');
    dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(fixture.componentInstance.calls).toEqual(['5']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('5');

    const escape = dispatchKey(dialpad, 'Escape');
    fixture.detectChanges();

    expect(escape.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['5', '']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('');
  });

  it('names digit buttons with their associated letters', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, '[data-slot="key"][aria-label="2, ABC"]')).not.toBeNull();
    expect(query(host, '[data-slot="key"][aria-label="0, +"]')).not.toBeNull();
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Expected ${selector}.`);
  }
  return element as T;
}

function normalizeDisplay(text: string | null): string {
  return (text ?? '').replace(/\u00A0/g, '').trim();
}

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}
