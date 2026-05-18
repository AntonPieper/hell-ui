import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSlider } from '@hell-ui/angular/slider';

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
