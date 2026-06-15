import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { TimeInputExamplesExample } from './examples/examples.example';
import timeInputExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputPlaceholderAndLabelsExample } from './examples/placeholder-and-labels.example';
import timeInputPlaceholderAndLabelsExampleCodeRaw from './examples/placeholder-and-labels.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputSizesExample } from './examples/sizes.example';
import timeInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputReactiveFormsExample } from './examples/reactive-forms.example';
import timeInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TimeInputExamplesExample,
    TimeInputReactiveFormsExample,
    TimeInputPlaceholderAndLabelsExample,
    TimeInputSizesExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Time input</h1>
      <p>
        A native-backed time field that keeps the colon visible, selects the current value on focus,
        and lets the browser reject illegal time strings. The default editor commits
        <code>HH:mm</code>; <code>seconds</code> mode switches the native step to
        <code>HH:mm:ss</code>. Click or keyboard-activate the clock icon to open a compact segmented
        picker with hour, minute, and optional second controls plus common minute presets.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="timeInputExamplesExampleCode" previewClass="grid gap-4 max-w-md">
        <app-time-input-examples-example />
      </hd-example-tabs>

      <h2>Reactive forms</h2>
      <hd-example-tabs
        [code]="timeInputReactiveFormsExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-time-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>Placeholder and labels</h2>
      <hd-example-tabs
        [code]="timeInputPlaceholderAndLabelsExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-time-input-placeholder-and-labels-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="timeInputSizesExampleCode" previewClass="grid gap-3 max-w-md">
        <app-time-input-sizes-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code>: structured <code>HellTimeValue | null</code> with <code>hour</code>,
          <code>minute</code>, and <code>second</code> (two-way via <code>(valueChange)</code>).
        </li>
        <li>
          Implements <code>ControlValueAccessor</code> for Angular forms. Reactive and
          template-driven forms read/write <code>HellTimeValue | null</code>; native HTML form
          submission is not provided.
        </li>
        <li>
          Validator error: <code>invalidTimeInputDraft</code> for uncommittable typed text when a
          custom text adapter is provided.
        </li>
        <li><code>seconds</code>: include a seconds control + readout.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>, <code>disabled</code></li>
        <li><code>placeholder</code>, <code>aria-label</code></li>
        <li>
          <code>provideHellTimeInputAdapter</code>: replace the default native-compatible
          parse/format policy. Custom adapters keep the field in text mode so product-specific
          shortcuts and locale masks can own their draft behavior.
        </li>
        <li><code>unstyled</code></li>
      </ul>

      <h2>Adapter contract</h2>
      <p>
        The built-in adapter emits a structured 24-hour <code>HellTimeValue</code> and formats
        native-compatible <code>HH:mm</code> / <code>HH:mm:ss</code> strings. The exported parser
        still accepts common text forms for adapter reuse, but the default field uses
        <code>input[type=time]</code> so illegal values never become visible drafts. Product teams
        that need localized parsing, named shortcuts, or a different display policy should provide
        <code>HELL_TIME_INPUT_ADAPTER</code>; custom adapters use the text-backed editing path.
      </p>

      <h2>Do</h2>
      <ul>
        <li>Use <code>seconds</code> only when users really need second precision.</li>
        <li>Pair with field labels and help for timezone expectations.</li>
        <li>Format the structured value at your form or transport seam.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't force time input for broad periods like morning or afternoon.</li>
        <li>Don't omit timezone context in scheduling flows.</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly timeInputExamplesExampleCode = timeInputExamplesExampleCodeRaw;
  protected readonly timeInputReactiveFormsExampleCode = timeInputReactiveFormsExampleCodeRaw;
  protected readonly timeInputPlaceholderAndLabelsExampleCode =
    timeInputPlaceholderAndLabelsExampleCodeRaw;
  protected readonly timeInputSizesExampleCode = timeInputSizesExampleCodeRaw;
}
