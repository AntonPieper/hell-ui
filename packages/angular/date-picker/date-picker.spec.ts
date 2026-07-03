import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellDatePicker,
  HellDateRangePicker,
  type HellDatePickerUi,
  type HellDateRangePickerUi,
} from './date-picker';

@Component({
  imports: [HellDatePicker],
  template: `
    <hell-date-picker
      [date]="date()"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [locale]="locale()"
      [firstDayOfWeek]="firstDayOfWeek()"
      [ui]="ui()"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DatePickerHost {
  readonly date = signal<Date | undefined>(undefined);
  readonly locale = signal<string | null>(null);
  readonly firstDayOfWeek = signal<1 | 2 | 3 | 4 | 5 | 6 | 7>(7);
  readonly min = signal<Date | undefined>(undefined);
  readonly max = signal<Date | undefined>(undefined);
  readonly disabled = signal(false);
  readonly ui = signal<string | HellDatePickerUi | undefined>(undefined);
  readonly dates: Array<Date | undefined> = [];
}

@Component({
  imports: [HellDateRangePicker],
  template: `
    <hell-date-range-picker
      [startDate]="startDate()"
      [endDate]="endDate()"
      [ui]="ui()"
    />
  `,
})
class DateRangePickerHost {
  readonly startDate = signal<Date | undefined>(new Date(2026, 10, 24));
  readonly endDate = signal<Date | undefined>(new Date(2027, 0, 2));
  readonly ui = signal<string | HellDateRangePickerUi | undefined>(undefined);
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

  it('uses localized month labels and weekday headers', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.locale.set('fr-FR');
    fixture.componentInstance.firstDayOfWeek.set(1);
    fixture.detectChanges();

    expect(label(fixture.nativeElement)).toBe('avril 2026');
    expect(grid(fixture.nativeElement).getAttribute('aria-label')).toBe('avril 2026');
    expect(weekdayHeaders(fixture.nativeElement).map((header) => header.abbr)).toEqual([
      'lundi',
      'mardi',
      'mercredi',
      'jeudi',
      'vendredi',
      'samedi',
      'dimanche',
    ]);
  });

  it('merges ui classes into root, navigation, label, and repeated date button parts', () => {
    vi.setSystemTime(new Date(2026, 3, 30));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.ui.set({
      root: 'w-[22rem] border-hell-danger',
      navButton: 'bg-hell-surface-subtle text-hell-danger',
      label: 'text-hell-danger',
      dateButton: 'rounded-hell-pill text-lg',
    });
    fixture.detectChanges();

    const picker = datePicker(fixture.nativeElement);
    const navButton = button(fixture.nativeElement, 'Previous year');
    const firstDateButton = dateButtons(fixture.nativeElement)[0];

    expect(picker.getAttribute('data-slot')).toBe('root');
    expect(picker.classList.contains('w-[22rem]')).toBe(true);
    expect(picker.classList.contains('border-hell-danger')).toBe(true);
    expect(picker.classList.contains('border-hell-border')).toBe(false);
    expect(labelElement(fixture.nativeElement).getAttribute('data-slot')).toBe('label');
    expect(labelElement(fixture.nativeElement).classList.contains('text-hell-danger')).toBe(true);
    expect(navButton.getAttribute('data-slot')).toBe('navButton');
    expect(navButton.getAttribute('data-direction')).toBe('previous');
    expect(navButton.getAttribute('data-step')).toBe('year');
    expect(navButton.classList.contains('bg-hell-surface-subtle')).toBe(true);
    expect(firstDateButton.getAttribute('data-slot')).toBe('dateButton');
    expect(firstDateButton.classList.contains('rounded-hell-pill')).toBe(true);
    expect(firstDateButton.classList.contains('text-lg')).toBe(true);
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

  it('disables year navigation when the picker is disabled or the target month is outside bounds', async () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DatePickerHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'Previous year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous year').getAttribute('data-disabled')).toBe('');
    expect(button(fixture.nativeElement, 'Previous month').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous month').getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(button(fixture.nativeElement, 'Next year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Next month').getAttribute('aria-disabled')).toBe('true');

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.min.set(new Date(2026, 3, 1));
    fixture.componentInstance.max.set(new Date(2026, 11, 31));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'Previous year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous year').getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(button(fixture.nativeElement, 'Previous month').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Previous month').getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(button(fixture.nativeElement, 'Next year').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Next year').getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture.nativeElement, 'Next month').disabled).toBe(false);
  });

  it('marks date ranges complete independently of the focused month', () => {
    vi.setSystemTime(new Date(2026, 3, 22));
    const fixture = TestBed.createComponent(DateRangePickerHost);
    fixture.componentInstance.ui.set('w-[23rem] border-hell-danger');
    fixture.detectChanges();

    const picker = rangePicker(fixture.nativeElement);
    expect(picker.getAttribute('data-slot')).toBe('root');
    expect(picker.classList.contains('w-[23rem]')).toBe(true);
    expect(label(fixture.nativeElement)).toBe('April 2026');
    expect(picker.getAttribute('data-range-complete')).toBe('');

    fixture.componentInstance.endDate.set(undefined);
    fixture.detectChanges();

    expect(picker.hasAttribute('data-range-complete')).toBe(false);
  });
});

function label(root: HTMLElement): string {
  const element = labelElement(root);
  return element.textContent?.trim() ?? '';
}

function labelElement(root: HTMLElement): HTMLElement {
  const element = root.querySelector('h2');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date picker label.');
  return element;
}

function weekdayHeaders(root: HTMLElement): { abbr: string; text: string }[] {
  return [...root.querySelectorAll('th')].map((header) => ({
    abbr: header.getAttribute('abbr') ?? '',
    text: header.textContent?.trim() ?? '',
  }));
}

function grid(root: HTMLElement): HTMLTableElement {
  const element = root.querySelector('table[ngpdatepickergrid]');
  if (!(element instanceof HTMLTableElement)) throw new Error('Expected date picker grid.');
  return element;
}

function button(root: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const element = root.querySelector(`button[aria-label="${ariaLabel}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${ariaLabel} button.`);
  return element;
}

function dateButtons(root: HTMLElement): HTMLButtonElement[] {
  const buttons = [...root.querySelectorAll('button[ngpDatePickerDateButton]')];
  if (!buttons.every((button) => button instanceof HTMLButtonElement)) {
    throw new Error('Expected date buttons.');
  }
  return buttons;
}

function datePicker(root: HTMLElement): HTMLElement {
  const element = root.querySelector('hell-date-picker');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date picker.');
  return element;
}

function rangePicker(root: HTMLElement): HTMLElement {
  const element = root.querySelector('hell-date-range-picker');
  if (!(element instanceof HTMLElement)) throw new Error('Expected date range picker.');
  return element;
}
