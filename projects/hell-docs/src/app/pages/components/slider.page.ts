import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <article class="hd-prose">
      <h1>Slider</h1>
      <p>
        Single-thumb range selector built on <code>ng-primitives/slider</code>. Drag the thumb,
        click anywhere on the track (which then continues into a drag in one fluid motion), or use
        arrow keys (Home/End jump to min/max).
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="max-w-md">
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
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex flex-col gap-4 max-w-md">
        <hell-slider size="sm" [value]="40" />
        <hell-slider size="md" [value]="60" />
        <hell-slider size="lg" [value]="80" />
      </hd-example-tabs>

      <h2>Hover-revealed thumb</h2>
      <p>
        Set <code>thumb="hover"</code> to hide the thumb until the slider is hovered, focused or
        pressed. Combine with <code>grow</code> to get a media-player-style seek bar that feels
        tactile when the user engages with it but stays out of the way otherwise.
      </p>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="flex flex-col gap-6 max-w-md">
        <div hellField>
          <label hellFieldLabel>Hover thumb</label>
          <hell-slider thumb="hover" [value]="seek()" (valueChange)="seek.set($event)" />
        </div>
        <div hellField>
          <label hellFieldLabel>Hover thumb + grow on engage</label>
          <hell-slider thumb="hover" grow [value]="seek()" (valueChange)="seek.set($event)" />
        </div>
      </hd-example-tabs>

      <h2>Vertical</h2>
      <hd-example-tabs [code]="exampleCodes[3]" previewClass="flex h-40 items-center gap-6">
        <hell-slider orientation="vertical" [value]="30" aria-label="Vertical low" />
        <hell-slider orientation="vertical" [value]="70" aria-label="Vertical high" />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="exampleCodes[4]" previewClass="max-w-md">
        <hell-slider [value]="50" disabled />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>, <code>(valueChange)</code></li>
        <li><code>min</code>, <code>max</code>, <code>step</code></li>
        <li><code>orientation</code>: <code>'horizontal' | 'vertical'</code></li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code></li>
        <li>
          <code>thumb</code>: <code>'always' | 'hover'</code> — hide the thumb until interaction.
        </li>
        <li><code>grow</code>: track expands on hover/focus/press for a tactile media-bar feel.</li>
        <li><code>disabled</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use sliders for approximate values where dragging is faster than typing.</li>
        <li>Provide an accessible label through <code>aria-label</code> or visible field text.</li>
        <li>Use <code>grow</code> when the slider should fill toolbar space.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use sliders for exact currency or IDs.</li>
        <li>Don't hide the current value when precision matters.</li>
      </ul>
    </article>
  `,
})
export class SliderPage {
  protected readonly exampleCodes = [
    '<div hellField>\n  <label hellFieldLabel>Volume</label>\n  <div class="flex items-center gap-4">\n    <hell-slider [value]="72" [min]="0" [max]="100" [step]="1" aria-label="Volume" />\n    <span class="hd-muted">72%</span>\n  </div>\n</div>\n',
    '<hell-slider size="sm" [value]="40" />\n<hell-slider size="md" [value]="60" />\n<hell-slider size="lg" [value]="80" />\n',
    '<div hellField>\n  <label hellFieldLabel>Hover thumb</label>\n  <hell-slider thumb="hover" [value]="35" />\n</div>\n<div hellField>\n  <label hellFieldLabel>Hover thumb + grow on engage</label>\n  <hell-slider thumb="hover" grow [value]="65" />\n</div>\n',
    '<hell-slider orientation="vertical" [value]="30" aria-label="Vertical low" />\n<hell-slider orientation="vertical" [value]="70" aria-label="Vertical high" />\n',
    '<hell-slider [value]="50" disabled />\n',
  ] as const;
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
