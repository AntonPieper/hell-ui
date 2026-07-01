import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { SliderBasicExample } from './examples/basic.example';
import sliderBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SliderDisabledExample } from './examples/disabled.example';
import sliderDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { SliderHoverRevealedThumbExample } from './examples/hover-revealed-thumb.example';
import sliderHoverRevealedThumbExampleCodeRaw from './examples/hover-revealed-thumb.example.ts?raw' with {
  loader: 'text',
};
import { SliderSizesExample } from './examples/sizes.example';
import sliderSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { SliderVerticalExample } from './examples/vertical.example';
import sliderVerticalExampleCodeRaw from './examples/vertical.example.ts?raw' with {
  loader: 'text',
};
import { SliderStylingExample } from './examples/styling.example';
import sliderStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    SliderBasicExample,
    SliderSizesExample,
    SliderHoverRevealedThumbExample,
    SliderVerticalExample,
    SliderDisabledExample, SliderStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Slider</h1>
      <p>
        Single-thumb range selector built on <code>ng-primitives/slider</code>. Drag the thumb,
        click anywhere on the track (which then continues into a drag in one fluid motion), or use
        arrow keys (Home/End jump to min/max). Pair it with <code>hellField</code> labels or pass
        explicit ARIA idrefs so the focusable thumb has a stable accessible name.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="sliderBasicExampleCode" previewClass="max-w-md">
        <app-slider-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="sliderSizesExampleCode" previewClass="flex flex-col gap-4 max-w-md">
        <app-slider-sizes-example />
      </hd-example-tabs>

      <h2>Hover-revealed thumb</h2>
      <p>
        Set <code>thumb="hover"</code> to hide the thumb until the slider is hovered, focused or
        pressed. Combine with <code>grow</code> to get a media-player-style seek bar that feels
        tactile when the user engages with it but stays out of the way otherwise.
      </p>
      <hd-example-tabs
        [code]="sliderHoverRevealedThumbExampleCode"
        previewClass="flex flex-col gap-6 max-w-md"
      >
        <app-slider-hover-revealed-thumb-example />
      </hd-example-tabs>

      <h2>Vertical</h2>
      <hd-example-tabs
        [code]="sliderVerticalExampleCode"
        previewClass="flex h-40 items-center gap-6"
      >
        <app-slider-vertical-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <hd-example-tabs [code]="sliderDisabledExampleCode" previewClass="max-w-md">
        <app-slider-disabled-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        Slider is a multi-part component: <code>HellSliderPart</code> is <code>root | track | range | thumb</code>. The <code>[ui]</code> map targets each named Public Part; matching <code>data-slot</code> attributes mark them in the DOM.
      </p>
      <hd-example-tabs [code]="sliderStylingExampleCode" previewClass="flex max-w-md items-center gap-4">
        <app-slider-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>, <code>(valueChange)</code></li>
        <li><code>min</code>, <code>max</code>, <code>step</code></li>
        <li><code>orientation</code>: <code>'horizontal' | 'vertical'</code></li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code></li>
        <li>
          <code>aria-label</code>, <code>aria-labelledby</code>, <code>aria-describedby</code>:
          forwarded to the slider thumb; <code>hellField</code> labels and descriptions are
          inherited automatically.
        </li>
        <li>
          <code>thumb</code>: <code>'always' | 'hover'</code> — hide the thumb until interaction.
        </li>
        <li><code>grow</code>: track expands on hover/focus/press for a tactile media-bar feel.</li>
        <li><code>disabled</code></li>
        <li>
          <code>ui</code>: string shorthand targets <code>root</code>; <code>HellSliderUi</code>
          maps <code>root</code>, <code>track</code>, <code>range</code>, and
          <code>thumb</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use sliders for approximate values where dragging is faster than typing.</li>
        <li>
          Provide an accessible label through <code>hellFieldLabel</code>,
          <code>aria-labelledby</code>, or a concise <code>aria-label</code>.
        </li>
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
  protected readonly sliderBasicExampleCode = sliderBasicExampleCodeRaw;
  protected readonly sliderSizesExampleCode = sliderSizesExampleCodeRaw;
  protected readonly sliderHoverRevealedThumbExampleCode = sliderHoverRevealedThumbExampleCodeRaw;
  protected readonly sliderVerticalExampleCode = sliderVerticalExampleCodeRaw;
  protected readonly sliderDisabledExampleCode = sliderDisabledExampleCodeRaw;
  protected readonly sliderStylingExampleCode = sliderStylingExampleCodeRaw;
}
