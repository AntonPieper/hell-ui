import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { CheckboxExamplesExample } from './examples/examples.example';
import checkboxExamplesExampleCodeRaw from './examples/examples.example.ts?raw' with {
  loader: 'text',
};
import { CheckboxNativeExample } from './examples/native.example';
import checkboxNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, CheckboxExamplesExample, CheckboxNativeExample],
  template: `
    <article class="hd-prose">
      <h1>Checkbox</h1>
      <p>
        Two- or three-state checkbox API with an Angular Forms-ready facade. Bind
        <code>checked</code> and listen for <code>checkedChange</code>; <code>indeterminate</code>
        is also supported for parent/child group patterns.
      </p>

      <h2>Examples</h2>
      <p>
        <code>button[hellCheckbox]</code> is a compact custom ARIA checkbox control and is useful
        when you need a styled, button-like primitive. If your form requires native checkbox
        semantics (for example, built-in constraint behavior and native form tooling), prefer
        <code>input[hellNativeCheckbox]</code>.
      </p>
      <hd-example-tabs [code]="checkboxExamplesExampleCode" previewClass="grid gap-2 max-w-md">
        <app-checkbox-examples-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <p>
        Use this path for full native checkbox behavior and form semantics.
      </p>
      <hd-example-tabs [code]="checkboxNativeExampleCode" previewClass="grid gap-2 max-w-md">
        <app-checkbox-native-example />
      </hd-example-tabs>

      <h2>Tradeoff</h2>
      <p>
        <code>button[hellCheckbox]</code> is intentionally opinionated for custom styling and
        behavior, but it is not a drop-in native checkbox control.
      </p>
      <h2>API</h2>
      <ul>
        <li><code>checked</code>, <code>checkedChange</code></li>
        <li><code>indeterminate</code>, <code>indeterminateChange</code></li>
        <li><code>disabled</code>, <code>required</code></li>
        <li>
          <code>ui</code>: string shorthand targets <code>root</code>; typed maps use
          <code>HellCheckboxUi</code> or <code>HellNativeCheckboxUi</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use checkboxes for independent boolean choices.</li>
        <li>Write labels that still make sense when checked.</li>
        <li>Use the indeterminate state for partially selected groups.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use checkboxes for mutually exclusive choices; use Radio.</li>
        <li>Don't omit visible labels unless there is an accessible name.</li>
      </ul>
    </article>
  `,
})
export class CheckboxPage {
  protected readonly checkboxExamplesExampleCode = checkboxExamplesExampleCodeRaw;
  protected readonly checkboxNativeExampleCode = checkboxNativeExampleCodeRaw;
}
