import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  HellControlGroup,
  HellControlGroupSuffix,
} from 'hell-ui/control-group';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';

@Component({
  selector: 'app-number-input-duration-seconds-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellControlGroup,
    HellControlGroupSuffix,
    ...HELL_NUMBER_INPUT_IMPORTS,
  ],
  template: `
    <div class="max-w-72" hellControlGroup aria-label="Announce interval controls">
      <input
        #intervalInput="hellNumberInput"
        id="announce-interval"
        hellNumberInput
        aria-label="Announce interval"
        integer
        [attr.aria-valuetext]="accessibleValue()"
        [min]="0"
        [max]="600"
        [step]="5"
        [value]="interval()"
        [ui]="controlUi"
        (valueChange)="interval.set($event)"
      />
      <span hellControlGroupSuffix>seconds</span>
      <button
        hellNumberStep="decrement"
        [hellNumberStepFor]="intervalInput"
      >−</button>
      <button
        hellNumberStep="increment"
        [hellNumberStepFor]="intervalInput"
      >+</button>
    </div>
    <p class="hd-note">
      The projected unit and authored <code>aria-valuetext</code> describe one plain numeric value.
    </p>
  `,
})
export class NumberInputDurationSecondsExample {
  protected readonly interval = signal<number | null>(30);
  protected readonly accessibleValue = computed(() => {
    const value = this.interval();
    return value === null ? null : `${value} seconds`;
  });
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
