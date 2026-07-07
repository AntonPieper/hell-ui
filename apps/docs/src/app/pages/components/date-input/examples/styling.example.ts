import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-date-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <!-- HellDateInputPart: root | input | trigger | triggerIcon | pickerPanel. -->
    <hell-date-input
      aria-label="Styled date"
      [date]="value()"
      [ui]="{
        root: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
        input: 'font-mono text-hell-primary',
        trigger: 'rounded-hell-sm bg-hell-primary/10 text-hell-primary hover:bg-hell-primary/20',
        triggerIcon: 'text-hell-primary',
        pickerPanel: 'rounded-hell-lg border border-hell-primary',
      }"
      (dateChange)="value.set($event)"
    />
  `,
})
export class DateInputStylingExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
