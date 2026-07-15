import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SelectBasicExample } from './examples/basic.example';
import selectBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { SelectRichOptionsExample } from './examples/rich-options.example';
import selectRichOptionsExampleCodeRaw from './examples/rich-options.example.ts?raw' with {
  loader: 'text',
};
import { SelectMultipleExample } from './examples/multiple.example';
import selectMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { SelectPresetExample } from './examples/preset.example';
import selectPresetExampleCodeRaw from './examples/preset.example.ts?raw' with { loader: 'text' };
import { SelectWithFieldStatusExample } from './examples/with-field-status.example';
import selectWithFieldStatusExampleCodeRaw from './examples/with-field-status.example.ts?raw' with {
  loader: 'text',
};
import { SelectStylingExample } from './examples/styling.example';
import selectStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    SelectBasicExample,
    SelectRichOptionsExample,
    SelectMultipleExample,
    SelectPresetExample,
    SelectWithFieldStatusExample,
    SelectStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Select"
        icon="faSolidCaretDown"
        category="Styled primitive"
        importPath="@hell-ui/angular/select"
        stylesPath="@hell-ui/angular/select/styles.css"
      >
        A projection-first rich dropdown for choosing one domain value (or several) from a short,
        known list.
      </hd-page-header>

      <p>
        <code>[hellSelect]</code> is the single rich Select Interaction State Machine. Attach it
        to a native <code>&lt;button&gt;</code>, project the current domain value or a placeholder,
        and render the same domain objects as <code>[hellSelectOption]</code> rows inside a
        portaled dropdown. Hell owns value, forms, open state, keyboard behavior, focus,
        dismissal, and ARIA relationships; your template owns presentation.
      </p>
      <p>
        Use rich Select for a short-to-medium known list whose options benefit from custom markup.
        Use Combobox when filtering helps. Use <code>select[hellNativeSelect]</code> when native
        form submission, OS pickers, mobile ergonomics, or zero-JS behavior is the priority. Rich
        and Native Select remain separate products.
      </p>

      <h2>Basic</h2>
      <p>
        The root <code>&lt;button hellSelect&gt;</code> projects a
        <code>[hellSelectValue]</code> or <code>[hellSelectPlaceholder]</code>. A
        <code>*hellSelectPortal</code> renders the <code>[hellSelectDropdown]</code> only while
        open, and each projected <code>[hellSelectOption]</code> binds its domain value directly.
      </p>
      <hd-example-tabs [code]="selectBasicExampleCode">
        <app-select-basic-example />
      </hd-example-tabs>

      <h2>Rich domain options</h2>
      <p>
        Options are consumer markup, so rows can contain icons, descriptions, swatches, or status
        detail without translating the value into a Select-owned option schema. For object values,
        bind <code>compareWith</code> and render the selected object in the trigger.
      </p>
      <hd-example-tabs [code]="selectRichOptionsExampleCode" previewClass="min-h-[220px]">
        <app-select-rich-options-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <p>
        Add <code>multiple</code> to accumulate an array of domain values. The dropdown stays open
        while options toggle and selected rows expose <code>aria-selected="true"</code>. Summarize
        the array in the trigger and present the choices nearby when that helps scanning.
      </p>
      <hd-example-tabs [code]="selectMultipleExampleCode" previewClass="min-h-[220px]">
        <app-select-multiple-example />
      </hd-example-tabs>

      <h2>Field integration</h2>
      <p>
        Put the projected Select button directly inside <code>hellField</code>. The field's label
        and description are registered with the rich root automatically, while the consumer keeps
        its <code>Region</code> objects and their rendering in one template.
      </p>
      <hd-example-tabs [code]="selectPresetExampleCode">
        <app-select-preset-example />
      </hd-example-tabs>

      <h2>With field and status</h2>
      <p>
        This review form composes the same directive suite with a field, validation message,
        semantic chip, and submit button. The selection stays a plain domain value; the visible
        status and option rows are consumer-owned projections of it.
      </p>
      <hd-example-tabs [code]="selectWithFieldStatusExampleCode">
        <app-select-with-field-status-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every Select directive owns one <code>root</code> Public Part rendered as
        <code>data-slot="root"</code>. Give each projected directive its own <code>ui="..."</code>
        shorthand or <code>[ui]="&#123; root: '...' &#125;"</code> map. A parent Select map does not
        reach into projected children; there is no owned-anatomy <code>HellSelectUi</code> map.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Directive</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>[hellSelect]</code></td>
            <td><code>root</code></td>
            <td>The trigger button: size, border, background, focus ring, and chevron.</td>
          </tr>
          <tr>
            <td><code>[hellSelectValue]</code></td>
            <td><code>root</code></td>
            <td>The consumer-rendered selection content.</td>
          </tr>
          <tr>
            <td><code>[hellSelectPlaceholder]</code></td>
            <td><code>root</code></td>
            <td>The empty-state content projected into the trigger.</td>
          </tr>
          <tr>
            <td><code>[hellSelectDropdown]</code></td>
            <td><code>root</code></td>
            <td>The floating listbox surface, including radius, shadow, and scrolling.</td>
          </tr>
          <tr>
            <td><code>[hellSelectOption]</code></td>
            <td><code>root</code></td>
            <td>One projected option row and its active, selected, and disabled states.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="selectStylingExampleCode" previewClass="min-h-[240px]">
        <app-select-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>
        <code>[hellSelect]</code> / <code>HellSelect</code> — the rich trigger and state root.
        Attach it to a <code>&lt;button type="button"&gt;</code>.
      </p>
      <ul>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt;</code> — <code>T | null</code> in single mode, <code>readonly T[]</code> in multiple mode.</li>
        <li><code>multiple</code>: accumulates selected values into an array and keeps the list open.</li>
        <li><code>disabled</code>: disables interaction and form participation.</li>
        <li><code>compareWith</code>: <code>(a: T, b: T) =&gt; boolean</code> for domain identity; defaults to reference identity.</li>
        <li><code>placement</code>, <code>container</code>, and <code>flip</code>: forwarded floating-position inputs.</li>
        <li><code>options</code>: optional raw value order for virtualized lists; it does not render rows or labels.</li>
        <li>Outputs: <code>valueChange</code> and <code>openChange</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p>
        <code>[hellSelectValue]</code> and <code>[hellSelectPlaceholder]</code> style projected
        trigger content. <code>[hellSelectDropdown]</code> is paired with
        <code>*hellSelectPortal</code>. Each accepts <code>ui: HellUiInput&lt;'root'&gt;</code>.
      </p>
      <p><code>[hellSelectOption]</code> renders one consumer-owned option row.</p>
      <ul>
        <li><code>value</code>: the projected domain value.</li>
        <li><code>disabled</code>: skips selection and keyboard activation.</li>
        <li><code>index</code>: optional explicit index for virtualization.</li>
        <li><code>activated</code>: emitted when the option activates.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p>
        <code>select[hellNativeSelect]</code> / <code>HellNativeSelect</code> styles a real native
        <code>&lt;select&gt;</code>. It exposes <code>size</code>, <code>invalid</code>, and its own
        <code>root</code> Part Style Map; its platform-owned behavior is unchanged.
      </p>
      <p>
        Import <code>HELL_SELECT_DIRECTIVES</code> for the complete projected suite. Pick values
        use <code>HellPickSingleValue</code>, <code>HellPickMultipleValue</code>, and
        <code>HellPickValue</code> from <code>@hell-ui/angular/core</code>.
      </p>

      <h2>Migration from the owned renderer</h2>
      <ul>
        <li>Rename <code>hellSelectTrigger</code> to <code>hellSelect</code> and <code>HellSelectTrigger</code> to <code>HellSelect</code>.</li>
        <li>Replace <code>&lt;hell-select [options]="options"&gt;</code> with a button using <code>[hellSelect]</code> and an <code>&#64;for</code> loop of projected <code>[hellSelectOption]</code> rows.</li>
        <li>Render the selected domain value and placeholder in your trigger; remove renderer-only <code>HellOption</code>, <code>displayWith</code>, <code>HellSelectPart</code>, and <code>HellSelectUi</code> usage.</li>
        <li>Move each former multi-part <code>ui</code> entry onto the directive that owns that single <code>root</code> part.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The button has <code>role="combobox"</code>, reactive <code>aria-expanded</code>, and <code>aria-controls</code> linked to the open listbox.</li>
        <li>The dropdown has <code>role="listbox"</code>; options have <code>role="option"</code> and selected rows expose <code>aria-selected</code>.</li>
        <li>Focus stays on the trigger through the active-descendant pattern; disabled options are skipped.</li>
        <li><code>ArrowDown</code>/<code>ArrowUp</code>, <code>Home</code>/<code>End</code>, <code>Enter</code>, <code>Space</code>, and <code>Escape</code> preserve the delegated keyboard contract.</li>
        <li>Moving focus into the portaled dropdown does not mark a form touched; leaving the complete control does.</li>
        <li>A surrounding <code>hellField</code> supplies the trigger's label and description relationships automatically.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Project the domain values your application already owns.</li>
        <li>Use <code>compareWith</code> for object values with stable business identity.</li>
        <li>Keep a stable accessible name through <code>aria-label</code>, <code>aria-labelledby</code>, or <code>hellField</code>.</li>
        <li>Apply each <code>ui</code> refinement to the directive that owns that Public Part.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't map domain values into a Select-owned label/value renderer schema.</li>
        <li>Don't use rich Select for long or unbounded lists; use Combobox when filtering helps.</li>
        <li>Don't leave icon-only or empty trigger content unnamed.</li>
        <li>Don't fight recipe utilities with template <code>class</code>; use the directive's <code>ui</code> input.</li>
      </ul>
    </article>
  `,
})
export class SelectPage {
  protected readonly selectBasicExampleCode = selectBasicExampleCodeRaw;
  protected readonly selectRichOptionsExampleCode = selectRichOptionsExampleCodeRaw;
  protected readonly selectMultipleExampleCode = selectMultipleExampleCodeRaw;
  protected readonly selectPresetExampleCode = selectPresetExampleCodeRaw;
  protected readonly selectWithFieldStatusExampleCode = selectWithFieldStatusExampleCodeRaw;
  protected readonly selectStylingExampleCode = selectStylingExampleCodeRaw;
}
