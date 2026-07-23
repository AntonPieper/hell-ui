import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from 'hell-ui/time-input';

@Component({
  selector: 'app-time-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <input
      id="styled-time"
      hellTimeInput
      aria-label="Styled time"
      seconds
      [value]="value()"
      ui="max-w-64 rounded-hell-lg border-hell-primary bg-hell-surface-subtle font-mono text-hell-primary"
      (valueChange)="value.set($event)"
    />
  `,
})
export class TimeInputStylingExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 9, minute: 30, second: 0 });
}
