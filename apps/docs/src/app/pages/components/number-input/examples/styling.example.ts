import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellNumberInput } from '@hell-ui/angular/number-input';

@Component({
  selector: 'app-number-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNumberInput],
  template: `
    <!-- HellNumberInputPart: root | input | increment | decrement | suffix. -->
    <hell-number-input
      aria-label="Styled amount"
      steppers
      suffix="%"
      [max]="100"
      [min]="0"
      [value]="value()"
      [ui]="{
        root: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
        input: 'font-mono text-hell-primary',
        increment: 'text-hell-primary hover:bg-hell-primary/10',
        decrement: 'text-hell-primary hover:bg-hell-primary/10',
        suffix: 'font-semibold text-hell-primary',
      }"
      (valueChange)="value.set($event)"
    />
  `,
})
export class NumberInputStylingExample {
  protected readonly value = signal<number | null>(40);
}
