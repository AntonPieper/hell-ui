import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-date-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <hell-date-input aria-label="Invoice date" [date]="value()" (dateChange)="value.set($event)" />
  `,
})
export class DateInputBasicExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
