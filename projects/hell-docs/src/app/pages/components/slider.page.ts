import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellSlider } from 'hell';

@Component({
  selector: 'hd-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSlider],
  template: `
    <article class="hd-prose">
      <h1>Slider</h1>
      <p>Single-thumb range selector built on
        <code>ng-primitives/slider</code>. Drag the thumb, click on the
        track, or use arrow keys (Home/End jump to min/max).</p>

      <h2>Example</h2>
      <div class="hd-example">
        <div class="flex items-center gap-4 max-w-md">
          <hell-slider
            [value]="vol()"
            (valueChange)="vol.set($event)"
            [min]="0"
            [max]="100"
            [step]="1"
            aria-label="Volume"
          />
          <code class="w-12 text-end">{{ vol() }}%</code>
        </div>
      </div>

      <h2>Sizes</h2>
      <div class="hd-example flex flex-col gap-4 max-w-md">
        <hell-slider size="sm" [value]="40" />
        <hell-slider size="md" [value]="60" />
        <hell-slider size="lg" [value]="80" />
      </div>

      <h2>Disabled</h2>
      <div class="hd-example max-w-md">
        <hell-slider [value]="50" disabled />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>value</code>, <code>(valueChange)</code></li>
        <li><code>min</code>, <code>max</code>, <code>step</code></li>
        <li><code>orientation</code>: <code>'horizontal' | 'vertical'</code></li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code></li>
        <li><code>disabled</code></li>
      </ul>
    </article>
  `,
})
export class SliderPage {
  protected readonly vol = signal(50);
}
