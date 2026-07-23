import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSlider } from 'hell-ui/slider';

@Component({
  selector: 'app-slider-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <hell-slider size="sm" [value]="40" aria-label="Small slider" />
    <hell-slider size="md" [value]="60" aria-label="Medium slider" />
    <hell-slider size="lg" [value]="80" aria-label="Large slider" />
  `,
})
export class SliderSizesExample {}
