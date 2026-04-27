import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_FIELD_DIRECTIVES, HellDateInput } from 'hell';

@Component({
  selector: 'app-date-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <hell-date-input size="sm" [date]="small()" (dateChange)="small.set($event)" />
    <hell-date-input size="md" [date]="value()" (dateChange)="value.set($event)" />
    <hell-date-input size="lg" [date]="large()" (dateChange)="large.set($event)" />
  `,
})
export class DateInputSizesExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
  protected readonly small = signal<Date | null>(new Date(2026, 0, 15));
  protected readonly large = signal<Date | null>(new Date(2026, 11, 31));
  protected readonly bounded = signal<Date | null>(new Date(2026, 5, 15));
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
}
