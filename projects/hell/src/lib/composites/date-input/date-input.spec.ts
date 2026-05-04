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
  dates: Date[] = [];
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
    expect(input.value).toBe(formatDate(host.date()));
  });

  it('reverts invalid typed text without emitting', () => {
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
    expect(input.value).toBe(formatDate(host.date()));
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

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
