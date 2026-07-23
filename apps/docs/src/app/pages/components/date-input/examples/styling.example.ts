import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDateInput } from 'hell-ui/date-input';

@Component({
  selector: 'app-date-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Styled date"
      [value]="value()"
      ui="max-w-64 rounded-hell-lg border-hell-primary bg-hell-surface-subtle font-mono text-hell-primary"
      (valueChange)="value.set($event)"
    />
  `,
})
export class DateInputStylingExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
