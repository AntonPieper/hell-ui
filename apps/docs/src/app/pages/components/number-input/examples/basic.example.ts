import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellControlGroup } from 'hell-ui/control-group';
import { HELL_NUMBER_INPUT_IMPORTS } from 'hell-ui/number-input';

@Component({
  selector: 'app-number-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellControlGroup, ...HELL_NUMBER_INPUT_IMPORTS],
  template: `
    <div
      class="max-w-64"
      hellControlGroup
      aria-label="Listen port controls"
      [invalid]="port() !== null && (port()! < 1 || port()! > 65535)"
    >
      <input
        #portInput="hellNumberInput"
        id="basic-port"
        hellNumberInput
        aria-label="Listen port"
        integer
        [min]="1"
        [max]="65535"
        [value]="port()"
        [ui]="controlUi"
        (valueChange)="port.set($event)"
      />
      <button
        hellNumberStep="decrement"
        [hellNumberStepFor]="portInput"
      >−</button>
      <button
        hellNumberStep="increment"
        [hellNumberStepFor]="portInput"
      >+</button>
    </div>
    <p class="hd-note">Ports are integers from 1 to 65535.</p>
  `,
})
export class NumberInputBasicExample {
  protected readonly port = signal<number | null>(8080);
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';
}
