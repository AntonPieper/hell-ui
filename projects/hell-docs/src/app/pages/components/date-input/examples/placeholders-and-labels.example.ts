import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_FIELD_DIRECTIVES, HellDateInput } from 'hell';

@Component({
  selector: 'app-date-input-placeholders-and-labels-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellDateInput],
  template: `
    <hell-date-input placeholder="2026-04-22" aria-label="Invoice date" [date]="null" />
    <p class="hd-note">
      Use <code>aria-label</code> when no visible <code>hellFieldLabel</code> is present.
    </p>
  `,
})
export class DateInputPlaceholdersAndLabelsExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
