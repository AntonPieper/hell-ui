import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from 'hell/composites';

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
}
