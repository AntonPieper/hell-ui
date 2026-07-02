import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';

@Component({
  selector: 'app-date-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <!-- HellDateInputPart: root | input | trigger | triggerIcon | pickerPanel. -->
    <hell-date-input
      [date]="value()"
      [ui]="{
        input: 'font-mono',
        trigger: 'text-hell-primary',
        pickerPanel: 'border-hell-primary',
      }"
      (dateChange)="value.set($event)"
    />
  `,
})
export class DateInputStylingExample {
  protected readonly value = signal<Date | null>(new Date(2026, 3, 22));
}
