import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';

@Component({
  selector: 'app-time-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <!-- Refine the text input and picker chrome through named Public Parts. -->
    <hell-time-input
      [value]="value()"
      [ui]="{
        input: 'font-mono tabular-nums',
        trigger: 'text-hell-primary',
        pickerPanel: 'border-hell-primary',
      }"
      (valueChange)="value.set($event)"
    />
  `,
})
export class TimeInputStylingExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 9, minute: 30, second: 0 });
}
