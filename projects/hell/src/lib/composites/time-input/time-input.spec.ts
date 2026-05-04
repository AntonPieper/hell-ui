import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellTimeInput, type HellTimeValue } from './time-input';

@Component({
  imports: [HellTimeInput],
  template: `
    <hell-time-input
      [value]="value()"
      [seconds]="seconds()"
      [placeholder]="placeholder"
      [aria-label]="ariaLabel"
      (valueChange)="values.push($event)"
    />
  `,
})
class TimeInputHost {
  readonly value = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  placeholder: string | null = null;
  ariaLabel = 'Start time';
  values: Array<HellTimeValue | null> = [];
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeInputHost],
    }).compileComponents();
  });

  it('parses common 12-hour text and emits structured time values', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '9:05 pm';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 21, minute: 5, second: 0 }]);
  });

  it('includes seconds in display when seconds mode is enabled', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '1:02:03 am';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 1, minute: 2, second: 3 }]);
    expect(input.value).toBe('01:02:03');
  });

  it('keeps invalid typed text visible without emitting', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '25:99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('25:99');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.value).toBe('25:99');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('emits null when empty text is committed', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('drops in-progress typing when the bound value changes externally', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.value.set({ hour: 12, minute: 45, second: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('12:45');
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected time input.');
  return input;
}
