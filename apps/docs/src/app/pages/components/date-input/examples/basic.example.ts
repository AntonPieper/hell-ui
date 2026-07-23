import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput } from 'hell-ui/date-input';

@Component({
  selector: 'app-date-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      id="invoice-date"
      hellDateInput
      aria-label="Invoice date"
      placeholder="YYYY-MM-DD"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <p class="hd-note">Committed value: {{ value()?.toDateString() ?? 'not set' }}</p>
  `,
})
export class DateInputBasicExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
