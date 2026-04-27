import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from 'hell';

@Component({
  selector: 'hd-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <article class="hd-prose">
      <h1>Slider</h1>
      <p>Single-thumb range selector built on
        <code>ng-primitives/slider</code>. Drag the thumb, click anywhere on
        the track (which then continues into a drag in one fluid motion), or
        use arrow keys (Home/End jump to min/max).</p>

      <h2>Basic</h2>
      <div class="hd-example max-w-md">
        <div hellField>
          <label hellFieldLabel>Volume</label>
          <div class="flex items-center gap-4">
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
      </div>

      <h2>Sizes</h2>
      <div class="hd-example flex flex-col gap-4 max-w-md">
        <hell-slider size="sm" [value]="40" />
        <hell-slider size="md" [value]="60" />
        <hell-slider size="lg" [value]="80" />
      </div>

      <h2>Hover-revealed thumb</h2>
      <p>
        Set <code>thumb="hover"</code> to hide the thumb until the slider
        is hovered, focused or pressed. Combine with <code>grow</code> to
        get a media-player-style seek bar that feels tactile when the user
        engages with it but stays out of the way otherwise.
      </p>
      <div class="hd-example flex flex-col gap-6 max-w-md">
        <div hellField>
          <label hellFieldLabel>Hover thumb</label>
          <hell-slider thumb="hover" [value]="seek()" (valueChange)="seek.set($event)" />
        </div>
        <div hellField>
          <label hellFieldLabel>Hover thumb + grow on engage</label>
          <hell-slider thumb="hover" grow [value]="seek()" (valueChange)="seek.set($event)" />
        </div>
      </div>

      <h2>Vertical</h2>
      <div class="hd-example flex h-40 items-center gap-6">
        <hell-slider orientation="vertical" [value]="30" aria-label="Vertical low" />
        <hell-slider orientation="vertical" [value]="70" aria-label="Vertical high" />
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
        <li><code>thumb</code>: <code>'always' | 'hover'</code> — hide the thumb until interaction.</li>
        <li><code>grow</code>: track expands on hover/focus/press for a tactile media-bar feel.</li>
        <li><code>disabled</code></li>
      </ul>
    </article>
  `,
})
export class SliderPage {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
