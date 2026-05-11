import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from 'hell/primitives';

@Component({
  selector: 'app-slider-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: ` <hell-slider [value]="50" disabled /> `,
})
export class SliderDisabledExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
