import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <!-- Multi-part map: HellSliderPart is 'root' | 'track' | 'range' | 'thumb'. -->
    <hell-slider
      aria-label="Storage quota"
      [value]="quota()"
      (valueChange)="quota.set($event)"
      [min]="0"
      [max]="100"
      [ui]="{ range: 'bg-hell-success', thumb: 'border-hell-success' }"
    />
    <code class="w-12 text-end">{{ quota() }}%</code>
  `,
})
export class SliderStylingExample {
  protected readonly quota = signal(64);
}
