import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  viewChild,
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
 * click anywhere on the track (which then continues into a drag), or use
 * arrow keys (Home/End jump to min/max). Emits via `(valueChange)`.
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
    <div
      ngpSliderTrack
      class="hell-slider-track"
      (pointerdown)="continueAsDrag($event)"
    >
      <div ngpSliderRange class="hell-slider-range"></div>
    </div>
    <div
      #thumb
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

  private readonly thumbRef = viewChild.required<ElementRef<HTMLElement>>('thumb');

  /**
   * ng-primitives' track only sets the value on click; it doesn't initiate
   * a drag. Re-dispatch the pointerdown on the thumb so the user can
   * click-and-drag from anywhere on the track in one fluid motion.
   */
  protected continueAsDrag(e: PointerEvent) {
    this.thumbRef().nativeElement.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        clientX: e.clientX,
        clientY: e.clientY,
        button: e.button,
        buttons: e.buttons,
      }),
    );
  }
}
