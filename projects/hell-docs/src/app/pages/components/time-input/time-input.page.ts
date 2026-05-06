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

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TimeInputExamplesExample,
    TimeInputPlaceholderAndLabelsExample,
    TimeInputSizesExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Time input</h1>
      <p>
        A text-first time field that accepts <code>HH:mm</code>, <code>HH:mm:ss</code> and common
        12-hour spellings (<code>9:00 am</code>, <code>1:30PM</code>). Click or keyboard-activate the clock icon to open
        a compact dial: hour and minute grids you can click directly, with ±5 minute nudges for
        fine-tuning.
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="timeInputExamplesExampleCode" previewClass="grid gap-4 max-w-md">
        <app-time-input-examples-example />
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
          <code>value</code>: structured <code>HellTimeValue | null</code>
          with <code>hour</code>, <code>minute</code>, and <code>second</code>
          (two-way via <code>(valueChange)</code>).
        </li>
        <li><code>seconds</code>: include a seconds grid + readout.</li>
        <li><code>size</code>: <code>sm | md | lg</code></li>
        <li><code>invalid</code>, <code>disabled</code></li>
        <li><code>placeholder</code>, <code>aria-label</code></li>
        <li><code>unstyled</code></li>
      </ul>

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
  protected readonly timeInputPlaceholderAndLabelsExampleCode =
    timeInputPlaceholderAndLabelsExampleCodeRaw;
  protected readonly timeInputSizesExampleCode = timeInputSizesExampleCodeRaw;
}
