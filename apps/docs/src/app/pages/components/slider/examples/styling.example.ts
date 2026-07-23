import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSlider, type HellSliderUi } from 'hell-ui/slider';

@Component({
  selector: 'app-slider-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <!-- ui string shorthand refines only the default 'root' part. -->
    <hell-slider
      aria-label="Shorthand-styled slider"
      ui="rounded-hell-none"
      [value]="30"
    />

    <!-- [ui] map refines every named public part: root, track, range, thumb. -->
    <hell-slider
      aria-label="Storage quota"
      [value]="quota()"
      (valueChange)="quota.set($event)"
      [min]="0"
      [max]="100"
      [ui]="quotaUi"
    />
    <code class="w-12 text-end">{{ quota() }}%</code>
  `,
})
export class SliderStylingExample {
  protected readonly quota = signal(64);

  protected readonly quotaUi: HellSliderUi = {
    root: 'h-hell-7',
    track: 'rounded-hell-sm bg-hell-surface-subtle',
    range: 'bg-hell-success rounded-hell-sm',
    thumb: 'size-hell-6 rounded-hell-sm border-hell-success bg-hell-surface-elevated',
  };
}
