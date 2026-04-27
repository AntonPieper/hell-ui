import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { InputSelectExample } from './examples/select.example';
import inputSelectExampleCodeRaw from './examples/select.example.ts?raw' with {
  loader: 'text',
};
import { InputSizesExample } from './examples/sizes.example';
import inputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { InputStatesExample } from './examples/states.example';
import inputStatesExampleCodeRaw from './examples/states.example.ts?raw' with {
  loader: 'text',
};
import { InputTextareaExample } from './examples/textarea.example';
import inputTextareaExampleCodeRaw from './examples/textarea.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    InputSizesExample,
    InputStatesExample,
    InputSelectExample,
    InputTextareaExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Input, Select &amp; Textarea</h1>
      <p>
        Single-line inputs, native selects and multi-line textareas. Apply the
        <code>hellInput</code> directive to a native <code>&lt;input&gt;</code>,
        <code>hellSelect</code> to a <code>&lt;select&gt;</code>, and <code>hellTextarea</code> to a
        <code>&lt;textarea&gt;</code>.
      </p>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="inputSizesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-input-sizes-example />
      </hd-example-tabs>

      <h2>States</h2>
      <hd-example-tabs [code]="inputStatesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-input-states-example />
      </hd-example-tabs>

      <h2>Select</h2>
      <hd-example-tabs [code]="inputSelectExampleCode" previewClass="grid max-w-md gap-2">
        <app-input-select-example />
      </hd-example-tabs>

      <h2>Textarea</h2>
      <hd-example-tabs [code]="inputTextareaExampleCode" previewClass="grid gap-2">
        <app-input-textarea-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellInput</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
        <li>
          <code>hellSelect</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
        <li>
          <code>hellTextarea</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>hellField</code> around inputs for labels, help and errors.</li>
        <li>Choose <code>sm</code>, <code>md</code> or <code>lg</code> based on density.</li>
        <li>Use <code>invalid</code> only when error copy is present.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't rely on placeholder text as the only label.</li>
        <li>Don't mark a field invalid before the user can act.</li>
      </ul>
    </article>
  `,
})
export class InputPage {
  protected readonly inputSizesExampleCode = inputSizesExampleCodeRaw;
  protected readonly inputStatesExampleCode = inputStatesExampleCodeRaw;
  protected readonly inputSelectExampleCode = inputSelectExampleCodeRaw;
  protected readonly inputTextareaExampleCode = inputTextareaExampleCodeRaw;
}
