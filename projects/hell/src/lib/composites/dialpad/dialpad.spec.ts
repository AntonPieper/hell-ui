import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDialpad } from './dialpad';
import { provideHellLabels } from '../../core/labels';

@Component({
  selector: 'app-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad (digit)="digits.push($event)" (valueChange)="values.push($event)" />`,
})
class DialpadHost {
  readonly digits: string[] = [];
  readonly values: string[] = [];
}

@Component({
  selector: 'app-stated-dialpad-host',
  imports: [HellDialpad],
  template: `
    <hell-dialpad
      [value]="value()"
      [disabled]="disabled()"
      [readOnly]="readOnly()"
      [invalid]="invalid()"
      (digit)="digits.push($event)"
      (valueChange)="values.push($event)"
      (call)="calls.push($event)"
    />
  `,
})
class StatedDialpadHost {
  readonly value = signal('');
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly invalid = signal(false);
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
      imports: [DialpadHost, StatedDialpadHost, LocalizedDialpadHost, ControlledDialpadHost],
    }).compileComponents();
  });

  it('uses default accessibility and action labels', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Dial pad');
    expect(query(host, '[data-slot="display-label"]').textContent?.trim()).toBe('Number');
    expect(query(host, '[data-slot="clear"]').textContent?.trim()).toBe('Clear');
    expect(query(host, '[data-slot="back"]').getAttribute('aria-label')).toBe('Backspace');
    expect(query(host, '[data-key="2"]').getAttribute('aria-label')).toBe('Digit 2, ABC');
    expect(query(host, '[data-key="*"]').getAttribute('aria-label')).toBe('Star');
    expect(query(host, '[data-key="#"]').getAttribute('aria-label')).toBe('Pound');
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

  it('handles keyboard input while a child key has focus', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const two = query<HTMLButtonElement>(host, '[data-key="2"]');
    two.focus();

    const digit = dispatchKey(two, '7');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual(['7']);
    expect(fixture.componentInstance.values).toEqual(['7']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('7');
  });

  it('clears with Delete and submits with Enter from host focus', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    dispatchKey(dialpad, '1');
    dispatchKey(dialpad, '2');
    fixture.detectChanges();

    const enter = dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['1', '12']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('12');

    const clear = dispatchKey(dialpad, 'Delete');
    fixture.detectChanges();

    expect(clear.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['1', '12', '']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('');
  });

  it('emits call from the call button and host Enter', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('5550137');
    const host = fixture.nativeElement;
    fixture.detectChanges();

    query<HTMLButtonElement>(host, '[data-slot="call"]').click();
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(fixture.componentInstance.calls).toEqual(['5550137', '5550137']);
  });

  it('exposes disabled state and blocks keyboard and pointer edits', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('12');
    fixture.componentInstance.disabled.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    expect(dialpad.getAttribute('aria-disabled')).toBe('true');
    expect(dialpad.getAttribute('data-disabled')).toBe('');
    expect(dialpad.getAttribute('tabindex')).toBe('-1');
    expect(query<HTMLButtonElement>(host, '[data-key="3"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="clear"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="back"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="call"]').disabled).toBe(true);

    dispatchKey(dialpad, '3');
    query<HTMLButtonElement>(host, '[data-key="3"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(fixture.componentInstance.values).toEqual([]);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('12');
  });

  it('keeps readonly values callable while blocking edits', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('12');
    fixture.componentInstance.readOnly.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    expect(dialpad.getAttribute('data-readonly')).toBe('');
    expect(query<HTMLButtonElement>(host, '[data-key="3"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="clear"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="back"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="call"]').disabled).toBe(false);

    const digit = dispatchKey(dialpad, '3');
    dispatchKey(dialpad, 'Backspace');
    dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual([]);
    expect(fixture.componentInstance.values).toEqual([]);
    expect(fixture.componentInstance.calls).toEqual(['12']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('12');
  });

  it('exposes invalid state for styling and accessibility', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.invalid.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');

    expect(dialpad.getAttribute('aria-invalid')).toBe('true');
    expect(dialpad.getAttribute('data-invalid')).toBe('');
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
    expect(query(host, '[data-slot="clear"]').getAttribute('disabled')).toBe('');

    firstDigit.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual(['1']);
    expect(normalizeDisplay(query(host, '[data-slot="number-inner"]').textContent)).toBe('');
    expect(backspace.getAttribute('disabled')).toBe('');
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
  const normalized = (text ?? '').replace(/\u00A0/g, '').trim();
  return normalized === '—' ? '' : normalized;
}

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}
