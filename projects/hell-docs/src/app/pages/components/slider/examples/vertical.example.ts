import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-slider-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <hell-slider orientation="vertical" [value]="30" aria-label="Vertical low" />
    <hell-slider orientation="vertical" [value]="70" aria-label="Vertical high" />
  `,
})
export class SliderVerticalExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
