import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { InputCustomizationExample } from './examples/customization.example';
import inputCustomizationExampleCodeRaw from './examples/customization.example.ts?raw' with {
  loader: 'text',
};
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
    InputCustomizationExample,
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
        <code>hellNativeSelect</code> to a <code>&lt;select&gt;</code>, and
        <code>hellTextarea</code> to a <code>&lt;textarea&gt;</code>.
      </p>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="inputSizesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-input-sizes-example />
      </hd-example-tabs>

      <h2>States</h2>
      <hd-example-tabs [code]="inputStatesExampleCode" previewClass="flex flex-wrap gap-2">
        <app-input-states-example />
      </hd-example-tabs>

      <h2>Customization</h2>
      <hd-example-tabs [code]="inputCustomizationExampleCode" previewClass="grid max-w-lg gap-2">
        <app-input-customization-example />
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
          <code>invalid</code>, <code>disabled</code>, <code>ui</code> shorthand or map keyed by
          <code>HellInputPart</code>
        </li>
        <li>
          <code>hellNativeSelect</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>ui</code> shorthand or map keyed by
          <code>HellNativeSelectPart</code>
        </li>
        <li>
          <code>hellTextarea</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>ui</code> shorthand or map keyed by
          <code>HellTextareaPart</code>
        </li>
      </ul>

      <h2>Parts</h2>
      <p>
        Each directive exposes one public part named <code>root</code> on the native control. The
        rendered element carries <code>data-slot="root"</code>. Use <code>ui="..."</code> for
        root-part shorthand or <code>[ui]="&#123; root: '...' &#125;"</code> when an explicit map is
        clearer. Template <code>class</code> stays additive for layout hooks, not for deterministic
        Tailwind conflicts.
      </p>

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
  protected readonly inputCustomizationExampleCode = inputCustomizationExampleCodeRaw;
  protected readonly inputSelectExampleCode = inputSelectExampleCodeRaw;
  protected readonly inputTextareaExampleCode = inputTextareaExampleCodeRaw;
}
