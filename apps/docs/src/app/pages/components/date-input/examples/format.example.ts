import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDateInput, provideHellDateInputFormat } from 'hell-ui/date-input';

@Component({
  selector: 'app-date-input-format-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Provide the format once per app (or per feature) instead of per input.
  providers: [provideHellDateInputFormat('DD.MM.YYYY')],
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="German invoice date"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <p class="hd-note">
      Scoped <code>DD.MM.YYYY</code>: parsing, display, native bounds, and the placeholder hint all
      follow it.
    </p>

    <input
      hellDateInput
      format="MM/DD/YYYY"
      aria-label="US invoice date"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
    <p class="hd-note">
      A local <code>format</code> wins over the provider for this one input.
    </p>

    <p class="hd-note" data-date-input-format-state>
      Committed value: {{ value()?.toDateString() ?? 'not set' }}
    </p>
  `,
})
export class DateInputFormatExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
