import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SliderBasicExample } from './examples/basic.example';
import sliderBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SliderSizesExample } from './examples/sizes.example';
import sliderSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { SliderOrientationExample } from './examples/orientation.example';
import sliderOrientationExampleCodeRaw from './examples/orientation.example.ts?raw' with {
  loader: 'text',
};
import { SliderModesExample } from './examples/modes.example';
import sliderModesExampleCodeRaw from './examples/modes.example.ts?raw' with {
  loader: 'text',
};
import { SliderDisabledExample } from './examples/disabled.example';
import sliderDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { SliderFormsExample } from './examples/forms.example';
import sliderFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { SliderWithFieldInputExample } from './examples/with-field-input.example';
import sliderWithFieldInputExampleCodeRaw from './examples/with-field-input.example.ts?raw' with {
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
    SliderOrientationExample,
    SliderModesExample,
    SliderDisabledExample,
    SliderFormsExample,
    SliderWithFieldInputExample,
    SliderStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Slider"
        icon="faSolidSliders"
        category="Styled primitive"
        importPath="hell-ui/slider"
        stylesPath="hell-ui/slider/styles.css"
      >
        A draggable single-value control for approximate numeric input in a fixed range.
      </hd-page-header>
      <p>
        <code>hell-slider</code> is a styled wrapper around <code>ng-primitives/slider</code>. It
        renders a track, a filled range, and a draggable thumb. Its <code>value</code> is one
        Angular model — bind it directly (<code>[value]</code> plus <code>(valueChange)</code>),
        two-way (<code>[(value)]</code>), or through forms: it implements Signal Forms'
        <code>FormValueControl</code> contract for <code>[formField]</code>, and the same model
        drives <code>formControl</code> and <code>ngModel</code> through Angular's built-in
        interoperability. Users can drag the thumb, click anywhere on the track to jump and
        continue dragging in one motion, or use the keyboard.
      </p>
      <p>
        Reach for it wherever an approximate value in a known range is faster to set by dragging
        than by typing: volume and playback position, opacity or zoom controls, alert thresholds,
        or quota/capacity indicators. When the exact number matters more than the gesture, pair it
        with a numeric input instead of using it alone — see
        <a href="#with-field-and-input">With field and input</a> below.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="sliderBasicExampleCode" previewClass="max-w-md">
        <app-slider-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>size</code> takes <code>sm</code>, <code>md</code> (default), or <code>lg</code> —
        note this is a narrower scale than <code>HellSize</code>; there is no <code>xs</code> or
        <code>xl</code> slider. It scales the track thickness and thumb diameter together.
      </p>
      <hd-example-tabs [code]="sliderSizesExampleCode" previewClass="flex flex-col gap-4 max-w-md">
        <app-slider-sizes-example />
      </hd-example-tabs>

      <h2>Orientation</h2>
      <p>
        Set <code>orientation="vertical"</code> for a fader-style control such as a mixing-console
        level or a vertical capacity gauge. Vertical sliders need an explicit height from their
        container; Hell reserves a sensible minimum but does not impose a fixed one.
      </p>
      <hd-example-tabs
        [code]="sliderOrientationExampleCode"
        previewClass="flex h-40 items-center gap-6"
      >
        <app-slider-orientation-example />
      </hd-example-tabs>

      <h2>Thumb visibility and grow</h2>
      <p>
        Set <code>thumb="hover"</code> to hide the thumb until the slider is hovered, focused, or
        pressed — useful for media seek bars and other display-leaning sliders where the thumb
        would otherwise clutter the row. Add <code>grow</code> to also thicken the track on
        hover/focus/press for a tactile, media-player feel; the host height is reserved up front so
        neighboring content never shifts.
      </p>
      <hd-example-tabs [code]="sliderModesExampleCode" previewClass="flex flex-col gap-6 max-w-md">
        <app-slider-modes-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <p>
        <code>disabled</code> dims the control, blocks pointer and keyboard interaction, and is
        also driven automatically by Angular Forms (<code>FormControl.disable()</code>) or an
        ancestor <code>fieldset[disabled]</code>.
      </p>
      <hd-example-tabs [code]="sliderDisabledExampleCode" previewClass="max-w-md">
        <app-slider-disabled-example />
      </hd-example-tabs>

      <h2>Forms</h2>
      <p>
        The <code>value</code> model is the slider's single committed-value authority, so all
        binding styles observe the same number. With Signal Forms, bind a field via
        <code>[formField]</code>: the field writes into <code>value</code>, user commits update the
        field exactly once, focus leaving the slider (or starting a track drag) marks it touched,
        and the field's <code>disabled</code>, <code>min</code>, and <code>max</code> rules flow
        into the matching slider inputs. <code>formControl</code> and <code>[(ngModel)]</code> keep
        working against the same model through Angular's Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore.
      </p>
      <p>
        Because <code>value</code> is a model input, it no longer coerces static attribute strings:
        write <code>[value]="42"</code> (a number binding), not <code>value="42"</code>.
        Configuration inputs (<code>min</code>, <code>max</code>, <code>step</code>,
        <code>disabled</code>) keep their attribute coercion.
      </p>
      <hd-example-tabs [code]="sliderFormsExampleCode">
        <app-slider-forms-example />
      </hd-example-tabs>

      <h2 id="with-field-and-input">With field and input</h2>
      <p>
        Combine the slider with a narrow <code>hellInput</code> for a threshold control that reads
        equally well by dragging or by typing an exact number. Both controls stay in sync through
        one shared signal; the label uses <code>aria-labelledby</code> on the slider (via
        <code>id</code>) so the thumb keeps its own accessible name instead of inheriting the
        input's.
      </p>
      <hd-example-tabs [code]="sliderWithFieldInputExampleCode">
        <app-slider-with-field-input-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSliderPart</code> is <code>root | track | range | thumb</code>. Pass
        <code>ui="..."</code> as shorthand to refine the default <code>root</code> part, or
        <code>[ui]</code> with a <code>HellSliderUi</code> map to target each part by name.
        Matching <code>data-slot</code> attributes mark every part in the DOM. Refinements merge on
        top of the size/orientation recipe through Hell's Tailwind merge, so they win
        deterministically over conflicting recipe classes.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td>The host element — overall height/width, cursor, and disabled opacity.</td>
          </tr>
          <tr>
            <td><code>track</code></td>
            <td>
              The clickable rail the thumb travels along. The visible groove itself is drawn by a
              structural <code>::before</code> pseudo-element, not this part.
            </td>
          </tr>
          <tr>
            <td><code>range</code></td>
            <td>The filled portion of the track from the minimum up to the current value.</td>
          </tr>
          <tr>
            <td><code>thumb</code></td>
            <td>The draggable, focusable handle — size, shape, border, and shadow.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs
        [code]="sliderStylingExampleCode"
        previewClass="flex flex-col gap-4 max-w-md"
      >
        <app-slider-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code>: <code>ModelSignal&lt;number&gt;</code>. Default <code>0</code>.
          Supports <code>[value]</code>, <code>[(value)]</code>, and <code>(valueChange)</code>;
          requires a number binding (no static-attribute string coercion).
        </li>
        <li>
          <code>min</code> / <code>max</code>: <code>number | undefined</code>. Defaults
          <code>0</code> / <code>100</code> (<code>undefined</code> falls back to the default).
          Attribute coercion retained; also driven by a bound Signal Forms field's
          <code>min</code>/<code>max</code> validator metadata.
        </li>
        <li>
          <code>step</code>: <code>number</code>. Default <code>1</code>. Governs both keyboard
          increments and value rounding.
        </li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Default <code>false</code>. Also driven by
          bound forms.
        </li>
        <li>
          <code>(touch)</code>: emits when focus leaves the slider or a track drag starts; Angular
          forms use it to mark the control touched.
        </li>
        <li>
          <code>orientation</code>: <code>HellOrientation</code> —
          <code>'horizontal' | 'vertical'</code>. Default <code>'horizontal'</code>.
        </li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
        <li>
          <code>thumb</code>: <code>'always' | 'hover'</code>. Default <code>'always'</code>. Set
          <code>'hover'</code> to hide the thumb until hover, focus, or press.
        </li>
        <li>
          <code>grow</code>: <code>boolean</code>. Default <code>false</code>. Thickens the track
          on hover/focus/press without shifting layout.
        </li>
        <li>
          <code>aria-label</code>: <code>string | null</code>. Forwarded to the thumb; falls back
          to any <code>aria-label</code> set directly on the host element.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellSliderPart&gt;</code> — a shorthand class
          string refining <code>root</code>, or a <code>HellSliderUi</code> map refining
          <code>root</code>, <code>track</code>, <code>range</code>, and <code>thumb</code>
          individually.
        </li>
        <li>
          Exported types: <code>HellSliderPart</code>
          (<code>'root' | 'track' | 'range' | 'thumb'</code>), <code>HellSliderUi</code>
          (<code>HellUi&lt;HellSliderPart&gt;</code>).
        </li>
        <li>
          Implements Signal Forms' <code>FormValueControl&lt;number&gt;</code>, so
          <code>[formField]</code>, <code>formControl</code>, and <code>ngModel</code> all work
          against the one <code>value</code> model; <code>disabled</code> then follows the bound
          field or control's disabled state as well as the input.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The thumb carries <code>role="slider"</code> with live
          <code>aria-valuemin</code>/<code>aria-valuemax</code>/<code>aria-valuenow</code> and
          <code>aria-orientation</code>; the host itself is not part of the accessibility tree
          (<code>tabindex="-1"</code>) — focus and the ARIA role live on the thumb.
        </li>
        <li>
          Keyboard: <kbd>ArrowLeft</kbd>/<kbd>ArrowRight</kbd> and
          <kbd>ArrowDown</kbd>/<kbd>ArrowUp</kbd> step by <code>step</code> (Left/Right are
          direction-aware and flip in RTL); holding <kbd>Shift</kbd> multiplies the step by 10;
          <kbd>Home</kbd>/<kbd>End</kbd> jump to the minimum/maximum (also flipped in RTL). There is
          no dedicated Page Up/Page Down step.
        </li>
        <li>
          Name the control with an explicit label: an <code>aria-label</code>, an
          <code>aria-labelledby</code> pointing at visible text, or a wrapping
          <code>hellField</code> with <code>hellFieldLabel</code> — its label
          <code>id</code> and any <code>hellFieldDescription</code> are picked up automatically and
          merged onto the thumb's <code>aria-labelledby</code>/<code>aria-describedby</code>.
        </li>
        <li>
          When <code>disabled</code>, the thumb gets <code>aria-disabled="true"</code>,
          <code>tabindex="-1"</code>, and both pointer drag-continuation and keyboard steps are
          blocked.
        </li>
        <li>
          <code>data-hover</code>, <code>data-press</code>, and <code>data-focus-visible</code> on
          the thumb, and <code>data-active-drag</code> on the host, drive the visual interaction
          states used by <code>thumb="hover"</code> and <code>grow</code> — style off them instead
          of hover/focus pseudo-classes if you need to mirror the same states elsewhere.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use sliders for approximate values in a known range where dragging beats typing.</li>
        <li>
          Provide an accessible label through <code>hellFieldLabel</code>,
          <code>aria-labelledby</code>, or a concise <code>aria-label</code>.
        </li>
        <li>Pair with a numeric input when users need to enter an exact value.</li>
        <li>Use <code>grow</code> when the slider should feel tactile in toolbar-dense layouts.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a slider alone for exact currency amounts, IDs, or other precise entry.</li>
        <li>Don't hide the current value as text when precision matters to the user.</li>
        <li>Don't rely on <code>thumb="hover"</code> for controls users must discover by looking.</li>
      </ul>
    </article>
  `,
})
export class SliderPage {
  protected readonly sliderBasicExampleCode = sliderBasicExampleCodeRaw;
  protected readonly sliderSizesExampleCode = sliderSizesExampleCodeRaw;
  protected readonly sliderOrientationExampleCode = sliderOrientationExampleCodeRaw;
  protected readonly sliderModesExampleCode = sliderModesExampleCodeRaw;
  protected readonly sliderDisabledExampleCode = sliderDisabledExampleCodeRaw;
  protected readonly sliderFormsExampleCode = sliderFormsExampleCodeRaw;
  protected readonly sliderWithFieldInputExampleCode = sliderWithFieldInputExampleCodeRaw;
  protected readonly sliderStylingExampleCode = sliderStylingExampleCodeRaw;
}
