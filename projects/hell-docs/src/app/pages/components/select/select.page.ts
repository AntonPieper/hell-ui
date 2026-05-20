import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_SELECT_BASIC_DIRECTIVES, HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';
import { ExampleTabs } from '../../../shared/example-tabs';
import { SelectBasicExample } from './examples/basic.example';
import selectBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { SelectBasicPresetExample } from './examples/basic-preset.example';
import selectBasicPresetExampleCodeRaw from './examples/basic-preset.example.ts?raw' with { loader: 'text' };

@Component({
  selector: 'hd-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ...HELL_SELECT_DIRECTIVES, ...HELL_SELECT_BASIC_DIRECTIVES, SelectBasicExample, SelectBasicPresetExample],
  template: `
    <article class="hd-prose">
      <h1>Select</h1>
      <p>
        Headless rich select built on <code>ng-primitives/select</code>. Unlike a native
        <code>&lt;select&gt;</code> (use <code>hellNativeSelect</code> for that) the rich
        select renders selected content via projection, supports arbitrary markup in options,
        and floats its dropdown in a portal — giving full control over alignment, scroll
        behaviour, and styling.
      </p>
      <p>
        Prefer native controls where browser/mobile semantics are the priority. The rich
        headless select keeps Angular forms compatible through a version-bound
        <code>ng-primitives</code> compatibility bridge until upstream public setters exist.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="selectBasicExampleCode">
        <app-select-basic-example />
      </hd-example-tabs>

      <h2>Preset</h2>
      <hd-example-tabs [code]="selectBasicPresetExampleCode">
        <app-select-basic-preset-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-select-basic&gt;</code>: compact preset composing the select pieces and a single
          option contract for quick adoption. Bind <code>aria-label</code> or
          <code>aria-labelledby</code> plus <code>aria-describedby</code> to keep the trigger name stable
          after a value is selected.
        </li>
        <li>
          <code>[hellSelect]</code>: trigger and state container. Inputs <code>value</code>,
          <code>multiple</code>, <code>disabled</code>, <code>compareWith</code>,
          <code>placement</code>, <code>container</code>, <code>flip</code>,
          <code>options</code>. Outputs <code>valueChange</code>, <code>openChange</code>.
        </li>
        <li><code>[hellSelectValue]</code>: slot for the rendered selection.</li>
        <li><code>[hellSelectPlaceholder]</code>: slot shown when nothing is selected.</li>
        <li>
          <code>[hellSelectDropdown]</code>: option container; pair with
          <code>*hellSelectPortal</code> so it only renders while open and floats over
          surrounding content.
        </li>
        <li>
          <code>[hellSelectOption]</code>: individual option. Required <code>[value]</code>;
          supports <code>disabled</code>; emits <code>activated</code>.
        </li>
      </ul>

      <h2>When to choose what</h2>
      <ul>
        <li>
          <strong>Combobox</strong> (<code>hellCombobox</code>): typing filters the list. Use
          for medium-to-large datasets where users will know part of the value.
        </li>
        <li>
          <strong>Select</strong> (<code>hellSelect</code>): no filtering, custom option
          markup (icons, descriptions, swatches). Use when you want full visual control
          over each row and the list is short to medium.
        </li>
        <li>
          <strong>Native select</strong> (<code>hellNativeSelect</code>): minimal, OS-rendered
          dropdown. Use for forms with simple string lists where mobile system pickers are
          preferable.
        </li>
      </ul>
    </article>
  `,
})
export class SelectPage {
  protected readonly selectBasicExampleCode = selectBasicExampleCodeRaw;
  protected readonly selectBasicPresetExampleCode = selectBasicPresetExampleCodeRaw;
}
