import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDatePicker } from './date-picker';

@Component({
  imports: [HellDatePicker],
  template: ` <hell-date-picker [date]="date()" (dateChange)="dates.push($event)" /> `,
})
class DatePickerHost {
  readonly date = signal<Date | undefined>(undefined);
  readonly dates: Date[] = [];
}

describe('HellDatePicker', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerHost],
    }).compileComponents();
  });

  it('moves the focused month by one year with previous and next year buttons', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2026');

    button(fixture.nativeElement, 'Previous year').click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2025');

    button(fixture.nativeElement, 'Next year').click();
    button(fixture.nativeElement, 'Next year').click();
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('April 2027');
  });
});

function label(root: HTMLElement): string {
  const element = root.querySelector('h2');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date picker label.');
  return element.textContent?.trim() ?? '';
}

function button(root: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const element = root.querySelector(`button[aria-label="${ariaLabel}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${ariaLabel} button.`);
  return element;
}
