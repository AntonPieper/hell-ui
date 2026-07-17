import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellControlGroup } from '@hell-ui/angular/control-group';
import { HELL_NUMBER_INPUT_IMPORTS } from '@hell-ui/angular/number-input';

@Component({
  selector: 'app-number-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellControlGroup, ...HELL_NUMBER_INPUT_IMPORTS],
  template: `
    <div hellControlGroup size="sm">
      <input
        #smallInput="hellNumberInput"
        hellNumberInput
        size="sm"
        aria-label="Small quantity"
        [value]="small()"
        [ui]="controlUi"
        (valueChange)="small.set($event)"
      />
      <button hellNumberStep="decrement" [hellNumberStepFor]="smallInput">−</button>
      <button hellNumberStep="increment" [hellNumberStepFor]="smallInput">+</button>
    </div>

    <div hellControlGroup size="md">
      <input
        #mediumInput="hellNumberInput"
        hellNumberInput
        size="md"
        aria-label="Medium quantity"
        [value]="medium()"
        [ui]="controlUi"
        (valueChange)="medium.set($event)"
      />
      <button hellNumberStep="decrement" [hellNumberStepFor]="mediumInput">−</button>
      <button hellNumberStep="increment" [hellNumberStepFor]="mediumInput">+</button>
    </div>

    <div hellControlGroup size="lg">
      <input
        #largeInput="hellNumberInput"
        hellNumberInput
        size="lg"
        aria-label="Large quantity"
        [value]="large()"
        [ui]="controlUi"
        (valueChange)="large.set($event)"
      />
      <button hellNumberStep="decrement" [hellNumberStepFor]="largeInput">−</button>
      <button hellNumberStep="increment" [hellNumberStepFor]="largeInput">+</button>
    </div>
  `,
})
export class NumberInputSizesExample {
  protected readonly small = signal<number | null>(2);
  protected readonly medium = signal<number | null>(8);
  protected readonly large = signal<number | null>(16);
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
