import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TimePickerBasicExample } from './examples/basic.example';
import timePickerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TimePickerSecondsAndDisabledExample } from './examples/seconds-and-disabled.example';
import timePickerSecondsAndDisabledExampleCodeRaw from './examples/seconds-and-disabled.example.ts?raw' with {
  loader: 'text',
};
import { TimePickerStylingExample } from './examples/styling.example';
import timePickerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    TimePickerBasicExample,
    TimePickerSecondsAndDisabledExample,
    TimePickerStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Time picker"
        icon="faSolidClock"
        category="Composite"
        importPath="@hell-ui/angular/time-picker"
        stylesPath="@hell-ui/angular/time-picker/styles.css"
      >
        A compact segmented picker for structured hour, minute, and optional second selection.
      </hd-page-header>

      <p>
        <code>hell-time-picker</code> owns the selection controls, fixed bounds, keyboard
        navigation, and accessibility labels for one structured <code>HellTimeValue</code>. It
        renders inline and deliberately has no text field, parser, forms adapter, trigger, or
        Popover API. Put it directly in a workflow panel, or compose it inside
        <code>hell-popover</code> when the surrounding experience needs a floating picker.
      </p>
      <p>
        Use <code>hell-time-input</code> when users should also type a time or bind the control to
        Angular forms. Time Input composes this picker while keeping its field, adapter, CVA,
        validation, dismissal, and focus-restoration contracts.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[(value)]</code> to a writable signal. A <code>null</code> value displays the
        existing midnight fallback without emitting; the first user step or preset commits a
        structured value.
      </p>
      <hd-example-tabs [code]="basicExampleCode">
        <app-time-picker-basic-example />
      </hd-example-tabs>

      <h2>Seconds and disabled state</h2>
      <p>
        Add <code>seconds</code> to show the third spinbutton. <code>second</code> remains required
        in <code>HellTimeValue</code>; commits made while seconds are hidden normalize it to
        <code>0</code>. <code>disabled</code> removes every spinbutton and button from interaction
        while retaining the selected readout.
      </p>
      <hd-example-tabs
        [code]="secondsAndDisabledExampleCode"
        previewClass="grid gap-6 items-start"
      >
        <app-time-picker-seconds-and-disabled-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Pass a class string to refine the default <code>root</code> part, or a
        <code>HellTimePickerUi</code> map to refine the flat picker-owned anatomy. All refinements
        merge through the shared Part-Class Pipeline.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr><th>Part</th><th>Styles</th></tr>
        </thead>
        <tbody>
          <tr><td><code>root</code></td><td>The complete picker surface.</td></tr>
          <tr><td><code>header</code></td><td>The readout row.</td></tr>
          <tr><td><code>readout</code></td><td>The formatted selected time.</td></tr>
          <tr><td><code>units</code></td><td>The responsive unit grid.</td></tr>
          <tr><td><code>unit</code></td><td>One label-and-control unit group.</td></tr>
          <tr><td><code>unitLabel</code></td><td>The Hours, Minutes, or Seconds caption.</td></tr>
          <tr><td><code>unitControl</code></td><td>The grouped value and step controls.</td></tr>
          <tr><td><code>unitValue</code></td><td>The focusable spinbutton value.</td></tr>
          <tr><td><code>unitStep</code></td><td>Each decrement and increment button.</td></tr>
          <tr><td><code>minutePresets</code></td><td>The fixed minute-preset group.</td></tr>
          <tr><td><code>minutePreset</code></td><td>One 00, 15, 30, or 45 preset button.</td></tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="stylingExampleCode">
        <app-time-picker-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code> / <code>(valueChange)</code>:
          <code>HellTimeValue | null</code>. <code>HellTimeValue</code> contains required
          <code>hour</code>, <code>minute</code>, and <code>second</code> fields.
        </li>
        <li>
          <code>seconds</code>: <code>boolean</code>. Shows the seconds unit. Default
          <code>false</code>.
        </li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Disables every interaction. Default
          <code>false</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellTimePickerPart&gt;</code>. String shorthand
          refines <code>root</code>; object form covers the eleven parts above.
        </li>
        <li>
          Exported types: <code>HellTimeValue</code>, <code>HellTimePickerLabels</code>,
          <code>HellTimePickerPart</code>, and <code>HellTimePickerUi</code>.
        </li>
      </ul>

      <h3>Labels</h3>
      <p>
        Override built-in labels per injector scope with
        <code class="break-all whitespace-normal"
          >provideHellLabels(HELL_TIME_PICKER_LABELS, overrides)</code
        > from
        <code>&#64;hell-ui/angular/core</code>. The fields are <code>hours</code>,
        <code>minutes</code>, <code>seconds</code>, <code>selectedTime</code>,
        <code>decreaseUnit</code>, <code>increaseUnit</code>, <code>minutePresets</code>, and
        <code>minutePreset</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Unit values use <code>role="spinbutton"</code> with labelled fixed bounds and current
          numeric/value text.
        </li>
        <li>
          Arrow Up/Right increments, Arrow Down/Left decrements, Page Up/Down moves by five, and
          Home/End moves to the fixed minimum/maximum without wrapping.
        </li>
        <li>
          Minute presets form a labelled group; each button exposes <code>aria-pressed</code> and
          <code>data-selected</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use the picker when structured visual selection is the whole interaction.</li>
        <li>Compose it with Popover when a separate trigger should own floating behavior.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't expect parsing, text entry, CVA, field association, or adornments here.</li>
        <li>Don't use it for ranges outside the fixed clock bounds.</li>
      </ul>
    </article>
  `,
})
export class TimePickerPage {
  protected readonly basicExampleCode = timePickerBasicExampleCodeRaw;
  protected readonly secondsAndDisabledExampleCode = timePickerSecondsAndDisabledExampleCodeRaw;
  protected readonly stylingExampleCode = timePickerStylingExampleCodeRaw;
}
