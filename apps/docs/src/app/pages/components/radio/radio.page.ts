import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
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
import { RadioStylingExample } from './examples/styling.example';
import radioStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, RadioExampleExample, RadioHorizontalExample, RadioNativeExample, RadioStylingExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Radio"
        icon="faSolidCircleDot"
        category="Styled primitive"
        importPath="@hell-ui/angular/radio"
        stylesPath="@hell-ui/angular/radio/styles.css"
      >
        Exclusive choice within a group — styled controls with roving focus, or directives over native inputs.
      </hd-page-header>
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

      <h2>Styling</h2>
      <p>
        <code>HellRadioUi</code> refines each radio's <code>root</code> Public Part. State attributes such as <code>data-checked</code> let <code>ui</code> express selected styling without touching the indicator internals.
      </p>
      <hd-example-tabs [code]="radioStylingExampleCode">
        <app-radio-styling-example />
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
        <li>
          <code>ui</code>: string shorthand targets <code>root</code> on each directive; typed
          maps use <code>HellRadioGroupUi</code>, <code>HellRadioUi</code>,
          <code>HellNativeRadioGroupUi</code>, or <code>HellNativeRadioUi</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The group exposes <code>role="radiogroup"</code>; arrow keys move selection, Tab enters and leaves the group.</li>
        <li>Name the group with <code>aria-label</code> or a referenced heading; each option needs visible text.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use radio for one choice from a small set.</li>
        <li>Keep options visible and mutually exclusive.</li>
        <li>Use horizontal orientation only for short labels.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
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
  protected readonly radioStylingExampleCode = radioStylingExampleCodeRaw;
}
