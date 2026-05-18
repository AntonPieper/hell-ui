import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <hell-slider size="sm" [value]="40" />
    <hell-slider size="md" [value]="60" />
    <hell-slider size="lg" [value]="80" />
  `,
})
export class SliderSizesExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
