import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
  numberAttribute,
} from '@angular/core';
import {
  NgpSlider,
  NgpSliderRange,
  NgpSliderThumb,
  NgpSliderTrack,
} from 'ng-primitives/slider';
import { HellSize } from '../../core/types';

/**
 * Single-value slider built on `ng-primitives/slider`. Drag the thumb,
 * click anywhere on the track, or use arrow keys (Home/End jump to
 * min/max). Emits via `(valueChange)`.
 *
 * Use `<hell-slider [value]="vol()" (valueChange)="vol.set($event)" />`.
 */
@Component({
  selector: 'hell-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgpSliderTrack, NgpSliderRange, NgpSliderThumb],
  hostDirectives: [
    {
      directive: NgpSlider,
      inputs: [
        'ngpSliderValue:value',
        'ngpSliderMin:min',
        'ngpSliderMax:max',
        'ngpSliderStep:step',
        'ngpSliderDisabled:disabled',
        'ngpSliderOrientation:orientation',
      ],
      outputs: ['ngpSliderValueChange:valueChange'],
    },
  ],
  host: {
    '[class.hell-slider]': '!unstyled()',
    '[attr.data-size]': 'size()',
  },
  template: `
    <div ngpSliderTrack class="hell-slider-track">
      <div ngpSliderRange class="hell-slider-range"></div>
    </div>
    <div
      ngpSliderThumb
      class="hell-slider-thumb"
      [attr.aria-label]="ariaLabel()"
    ></div>
  `,
})
export class HellSlider {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
}
