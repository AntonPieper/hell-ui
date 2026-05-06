import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDateInput } from './date-input';

@Component({
  imports: [HellDateInput],
  template: `
    <hell-date-input
      [date]="date()"
      [min]="min()"
      [max]="max()"
      [placeholder]="placeholder"
      [aria-label]="ariaLabel"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DateInputHost {
  readonly date = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  placeholder = 'YYYY-MM-DD';
  ariaLabel = 'Report date';
  dates: Array<Date | null> = [];
}

describe('HellDateInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateInputHost],
    }).compileComponents();
  });

  it('emits parsed ISO dates from the text field', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-04-30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    const emitted = fixture.componentInstance.dates[0];
    expect(emitted).toBeInstanceOf(Date);
    if (!(emitted instanceof Date)) throw new Error('Expected emitted date.');
    expect(emitted.getFullYear()).toBe(2026);
    expect(emitted.getMonth()).toBe(3);
    expect(emitted.getDate()).toBe(30);
  });

  it('rejects impossible ISO dates instead of rolling them forward', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 1, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-02-31';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('2026-02-31');
  });

  it('keeps invalid typed text visible without emitting', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'not a date';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('not a date');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('not a date');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('emits null when empty text is committed', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('rejects typed dates outside min and max without clamping', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-03-31';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    input.value = '2026-05-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('2026-05-01');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('accepts typed dates on min and max boundaries', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-04-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    input.value = '2026-04-30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.dates[0])).toBe('2026-04-01');
    expect(formatDate(host.dates[1])).toBe('2026-04-30');
  });

  it('keeps the calendar trigger in the keyboard tab order', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    const trigger = triggerButton(fixture.nativeElement);
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.getAttribute('aria-label')).toBe('Choose date for Report date');
  });

  it('drops in-progress typing when the bound date changes externally', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.date.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe(formatDate(host.date()));
  });

  it('does not emit stale typed text after the bound date changes externally', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-08-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.date.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe(formatDate(host.date()));
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected date input.');
  return input;
}

function triggerButton(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector('button[data-slot="trigger"]');
  if (!(trigger instanceof HTMLButtonElement)) throw new Error('Expected date trigger.');
  return trigger;
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
