import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  HellControlGroup,
  HellControlGroupSuffix,
} from 'hell-ui/control-group';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';

@Component({
  selector: 'app-number-input-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellControlGroup,
    HellControlGroupSuffix,
    ...HELL_NUMBER_INPUT_IMPORTS,
  ],
  template: `
    <div
      hellControlGroup
      ui="max-w-72 rounded-hell-lg border-hell-primary bg-hell-surface-subtle"
    >
      <input
        #amountInput="hellNumberInput"
        hellNumberInput
        aria-label="Styled amount"
        integer
        [attr.aria-valuetext]="accessibleValue()"
        [max]="100"
        [min]="0"
        [value]="value()"
        [ui]="controlUi"
        (valueChange)="value.set($event)"
      />
      <span hellControlGroupSuffix ui="font-semibold text-hell-primary">%</span>
      <button
        hellNumberStep="decrement"
        ui="text-hell-primary hover:bg-hell-primary/10"
        [hellNumberStepFor]="amountInput"
      >−</button>
      <button
        hellNumberStep="increment"
        ui="text-hell-primary hover:bg-hell-primary/10"
        [hellNumberStepFor]="amountInput"
      >+</button>
    </div>
  `,
})
export class NumberInputStylingExample {
  protected readonly value = signal<number | null>(40);
  protected readonly accessibleValue = computed(() => {
    const value = this.value();
    return value === null ? null : `${value} percent`;
  });
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent font-mono text-hell-primary shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
