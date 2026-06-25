import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { RadioExampleExample } from './examples/example.example';
import radioExampleExampleCodeRaw from './examples/example.example.ts?raw' with {
  loader: 'text',
};
import { RadioHorizontalExample } from './examples/horizontal.example';
import radioHorizontalExampleCodeRaw from './examples/horizontal.example.ts?raw' with {
  loader: 'text',
};
import { RadioNativeExample } from './examples/native.example';
import radioNativeExampleCodeRaw from './examples/native.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, RadioExampleExample, RadioHorizontalExample, RadioNativeExample],
  template: `
    <article class="hd-prose">
      <h1>Radio</h1>
      <p>Pick one option from a small set. Use a select instead for &gt; 5 options.</p>
      <p>
        Prefer <code>hellNativeRadio</code> where native input semantics and browser form
        behavior are the priority. The rich button-based radio group keeps Angular forms
        compatible through a version-bound <code>ng-primitives</code> compatibility bridge
        until upstream public setters exist.
      </p>

      <h2>Example</h2>
      <hd-example-tabs [code]="radioExampleExampleCode" previewClass="grid gap-4">
        <app-radio-example-example />
      </hd-example-tabs>

      <h2>Horizontal</h2>
      <hd-example-tabs [code]="radioHorizontalExampleCode">
        <app-radio-horizontal-example />
      </hd-example-tabs>

      <h2>Native path</h2>
      <hd-example-tabs [code]="radioNativeExampleCode">
        <app-radio-native-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellRadioGroup</code>: <code>value</code>, <code>valueChange</code>,
          <code>orientation</code>, <code>disabled</code>, <code>required</code>
        </li>
        <li>
          Name every <code>hellRadioGroup</code> and <code>hellNativeRadioGroup</code> with a
          concise <code>aria-label</code> or visible text referenced by <code>aria-labelledby</code>.
        </li>
        <li><code>hellRadio</code>: <code>value</code>, <code>disabled</code></li>
        <li>
          <code>ngpRadioIndicator</code>: visual marker (re-exported as
          <code>HellRadioIndicator</code>)
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use radio for one choice from a small set.</li>
        <li>Keep options visible and mutually exclusive.</li>
        <li>Use horizontal orientation only for short labels.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use radio for independent toggles.</li>
        <li>Don't make users open a menu to understand all choices.</li>
      </ul>
    </article>
  `,
})
export class RadioPage {
  protected readonly radioExampleExampleCode = radioExampleExampleCodeRaw;
  protected readonly radioHorizontalExampleCode = radioHorizontalExampleCodeRaw;
  protected readonly radioNativeExampleCode = radioNativeExampleCodeRaw;
}
