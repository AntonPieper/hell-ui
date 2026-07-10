import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellNumberInput } from '@hell-ui/angular/number-input';

@Component({
  selector: 'app-number-input-duration-seconds-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNumberInput],
  template: `
    <hell-number-input
      aria-label="Announce interval"
      integer
      steppers
      suffix="seconds"
      [min]="0"
      [max]="600"
      [step]="5"
      [value]="interval()"
      (valueChange)="interval.set($event)"
    />
    <p class="hd-note">The unit suffix is self-describing; the value stays a plain number.</p>
  `,
})
export class NumberInputDurationSecondsExample {
  protected readonly interval = signal<number | null>(30);
}
