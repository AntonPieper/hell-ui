import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-vertical-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <div class="flex h-52 items-center gap-8 overflow-visible px-4 py-3">
      <hell-slider orientation="vertical" [value]="30" aria-label="Vertical low" />
      <hell-slider orientation="vertical" [value]="70" aria-label="Vertical high" />
    </div>
  `,
})
export class SliderVerticalExample {}
