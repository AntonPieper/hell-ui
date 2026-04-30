import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellTimeInput } from './time-input';

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
  readonly value = signal<string | null>(null);
  readonly seconds = signal(false);
  placeholder: string | null = null;
  ariaLabel = 'Start time';
  values: string[] = [];
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeInputHost],
    }).compileComponents();
  });

  it('parses common 12-hour text and emits padded 24-hour values', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '9:05 pm';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual(['21:05']);
  });

  it('includes seconds when the seconds mode is enabled', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '1:02:03 am';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual(['01:02:03']);
  });

  it('reverts invalid typed text without emitting', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set('08:30');
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '25:99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('25:99');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.value).toBe('08:30');
  });

  it('drops in-progress typing when the bound value changes externally', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set('08:30');
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.value.set('12:45');
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
