import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_COMBOBOX_BASIC_DIRECTIVES, HELL_COMBOBOX_DIRECTIVES } from '@hell-ui/angular/combobox';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ComboboxBasicExample } from './examples/basic.example';
import comboboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { ComboboxMultipleExample } from './examples/multiple.example';
import comboboxMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxBasicPresetExample } from './examples/basic-preset.example';
import comboboxBasicPresetExampleCodeRaw from './examples/basic-preset.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxStylingExample } from './examples/styling.example';
import comboboxStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ...HELL_COMBOBOX_DIRECTIVES,
    ...HELL_COMBOBOX_BASIC_DIRECTIVES,
    ComboboxBasicExample,
    ComboboxBasicPresetExample,
    ComboboxMultipleExample, ComboboxStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Combobox</h1>
      <p>
        An accessible select with optional filter input. Built on
        <code>ng-primitives/combobox</code>: input + button + dropdown of options. Supports
        single and multiple selection, keyboard navigation (Arrow/Home/End/Enter/Escape) and
        active-descendant focus per WAI-ARIA combobox pattern.
      </p>
      <p>
        Prefer native controls where native form/mobile semantics matter most. This rich
        headless combobox keeps Angular forms compatible through a version-bound
        <code>ng-primitives</code> compatibility bridge until upstream public setters exist.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="comboboxBasicExampleCode">
        <app-combobox-basic-example />
      </hd-example-tabs>

      <h2>Preset</h2>
      <hd-example-tabs [code]="comboboxBasicPresetExampleCode">
        <app-combobox-basic-preset-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <hd-example-tabs [code]="comboboxMultipleExampleCode">
        <app-combobox-multiple-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        <code>HellComboboxBasicUi</code> is a flat Part Style Map over the preset's owned anatomy: <code>control</code>, <code>input</code>, <code>button</code>, <code>dropdown</code>, <code>option</code>, and <code>empty</code>. When you compose the raw directives instead, each one exposes its own <code>ui</code>.
      </p>
      <hd-example-tabs [code]="comboboxStylingExampleCode" previewClass="min-h-[220px]">
        <app-combobox-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-combobox-basic&gt;</code>: compact preset that composes input+button+
          portal+options and applies common display filtering. Accepts <code>ui</code> for flat
          owned parts: <code>root</code>, <code>control</code>, <code>input</code>,
          <code>button</code>, <code>dropdown</code>, <code>option</code>, and
          <code>empty</code>.
        </li>
        <li>
          <code>[hellCombobox]</code>: container.
          Inputs <code>value</code>, <code>multiple</code>, <code>disabled</code>,
          <code>allowDeselect</code>, <code>compareWith</code>, <code>placement</code>,
          <code>container</code>, <code>flip</code>, <code>options</code>.
          Outputs <code>valueChange</code>, <code>openChange</code>.
        </li>
        <li>
          <code>input[hellComboboxInput]</code>: editable filter input.
        </li>
        <li>
          <code>button[hellComboboxButton]</code>: dropdown toggle. Renders the chevron via
          <code>::after</code> mask; keep it empty.
        </li>
        <li>
          <code>[hellComboboxDropdown]</code>: option container. Pair with the
          <code>*hellComboboxPortal</code> structural directive so the dropdown is rendered
          in a floating overlay only while open: <code>&lt;div *hellComboboxPortal hellComboboxDropdown&gt;…&lt;/div&gt;</code>.
        </li>
        <li>
          <code>[hellComboboxOption]</code>: option row. <code>[value]</code> required;
          <code>disabled</code> supported. Emits <code>activated</code>.
        </li>
        <li>
          <code>[hellComboboxEmpty]</code>: placeholder slot for the no-results state.
        </li>
        <li><code>ui</code>: Part Style Map for each styled directive's local <code>root</code> part. Rendered directive parts expose <code>data-slot="root"</code>; <code>&lt;hell-combobox-basic&gt;</code> exposes its owned parts by name.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use combobox when the option list is medium-to-large and benefits from filtering.</li>
        <li>Show selected chips above the input in multiple mode for scannability.</li>
        <li>Reuse the input value as the value for type-to-create patterns.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use a combobox for less than ~5 options &mdash; a <code>radio</code> or plain
          <code>select</code> is faster.</li>
        <li>Don't hide the dropdown trigger; users need a visible affordance to open without typing.</li>
      </ul>
    </article>
  `,
})
export class ComboboxPage {
  protected readonly comboboxBasicExampleCode = comboboxBasicExampleCodeRaw;
  protected readonly comboboxBasicPresetExampleCode = comboboxBasicPresetExampleCodeRaw;
  protected readonly comboboxMultipleExampleCode = comboboxMultipleExampleCodeRaw;
  protected readonly comboboxStylingExampleCode = comboboxStylingExampleCodeRaw;
}
