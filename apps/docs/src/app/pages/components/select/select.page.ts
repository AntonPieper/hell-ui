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
        category="Mixed entry point"
        importPath="@hell-ui/angular/select"
        stylesPath="@hell-ui/angular/select/styles.css"
      >
        A rich, custom-rendered dropdown for choosing one option (or several) from a short,
        known list.
      </hd-page-header>
      <p>
        <code>[hellSelectTrigger]</code> is a directive suite built on the <code>NgpSelect</code> primitive
        from <code>ng-primitives</code>. You attach it to a native <code>&lt;button&gt;</code>
        trigger, render the selected value or a placeholder inside it, and float a listbox of
        <code>[hellSelectOption]</code> rows in a portal. Because options are plain projected
        markup, each row can carry icons, descriptions, or swatches — the differentiator over a
        native <code>&lt;select&gt;</code>.
      </p>
      <p>
        Reach for it in a dense business app when the list is short-to-medium and users pick from
        known values rather than free text: a status, a priority, a region, a role. For
        medium-to-large lists where users know part of the value, use the
        <code>combobox</code> (typeahead filtering). Where OS-native pickers and mobile ergonomics
        matter most, use <code>hellNativeSelect</code> instead. For the common single-field form
        case, the <code>&lt;hell-select&gt;</code> preset composes the whole suite around a
        string option list so you bind one <code>[options]</code> array and go.
      </p>
      <p>
        The select is Angular-forms compatible: both <code>[hellSelectTrigger]</code> and
        <code>&lt;hell-select&gt;</code> are <code>ControlValueAccessor</code>s, so
        <code>ngModel</code> and reactive form controls bind directly, and dropped inside a
        <code>hellField</code> the trigger inherits the field's label and description for
        accessibility.
      </p>

      <h2>Basic</h2>
      <p>
        The smallest realistic usage: a <code>&lt;button hellSelectTrigger&gt;</code> trigger holding a
        <code>[hellSelectValue]</code> / <code>[hellSelectPlaceholder]</code> pair, plus a
        <code>*hellSelectPortal</code> wrapping the <code>[hellSelectDropdown]</code> of options.
        Read the selection from <code>valueChange</code>; individual options can be
        <code>disabled</code>.
      </p>
      <hd-example-tabs [code]="selectBasicExampleCode">
        <app-select-basic-example />
      </hd-example-tabs>

      <h2>Rich options</h2>
      <p>
        Options are projected markup, so a row can hold anything — here an icon plus a secondary
        description line. When option values are objects rather than strings, pass
        <code>compareWith</code> so the trigger can match the current value against the option
        list by identity, and render the trigger label yourself from the selected object.
      </p>
      <hd-example-tabs [code]="selectRichOptionsExampleCode" previewClass="min-h-[220px]">
        <app-select-rich-options-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <p>
        Add <code>multiple</code> to let the list accumulate selections. The value becomes an
        array, the dropdown stays open as you toggle rows, and selected options carry
        <code>aria-selected="true"</code>. Summarize the selection in the trigger (a count works
        well) and reflect the choices elsewhere — here as <code>hellChip</code> chips.
      </p>
      <hd-example-tabs [code]="selectMultipleExampleCode" previewClass="min-h-[220px]">
        <app-select-multiple-example />
      </hd-example-tabs>

      <h2>Preset</h2>
      <p>
        <code>&lt;hell-select&gt;</code> composes the whole suite for the common single-field
        case. Bind an <code>[options]</code> array, a <code>[value]</code>, and a
        <code>placeholder</code>; supply a <code>displayWith</code> when options are objects.
        Placed inside a <code>hellField</code> it automatically inherits the field label and
        description as its trigger's <code>aria-labelledby</code> / <code>aria-describedby</code>.
      </p>
      <hd-example-tabs [code]="selectPresetExampleCode">
        <app-select-preset-example />
      </hd-example-tabs>

      <h2>With field and tag</h2>
      <p>
        A realistic review-decision row: a <code>hellField</code> supplies the label, description,
        and a submit-time <code>hellFieldError</code>, the <code>&lt;hell-select&gt;</code>
        preset owns the choice, and a <code>hellChip</code> next to the label mirrors the decision
        with a matching semantic variant. No manual <code>aria</code> wiring — the field state
        connects label and description to the trigger.
      </p>
      <hd-example-tabs [code]="selectWithFieldStatusExampleCode">
        <app-select-with-field-status-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every module in this entry point follows the Part Style Map contract. A shorthand
        <code>ui="..."</code> string refines a module's default part; a <code>[ui]</code> map
        refines parts by name. The single directives — <code>[hellSelectTrigger]</code>,
        <code>[hellSelectValue]</code>, <code>[hellSelectPlaceholder]</code>,
        <code>[hellSelectDropdown]</code>, <code>[hellSelectOption]</code> — each expose one
        <code>root</code> part (rendered as <code>data-slot="root"</code>), so their shorthand and
        <code>&#123; root: '...' &#125;</code> map are equivalent. The
        <code>&lt;hell-select&gt;</code> preset is owned anatomy, so
        <code>HellSelectUi</code> is a flat multi-part map covering the pieces it renders. All
        refinements merge over the recipe through Hell's Tailwind merge, so they win
        deterministically over the defaults they conflict with.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>[hellSelectTrigger]</code></td>
            <td><code>root</code></td>
            <td>The button trigger — border, background, height, focus ring, and the chevron affordance.</td>
          </tr>
          <tr>
            <td><code>[hellSelectValue]</code></td>
            <td><code>root</code></td>
            <td>The rendered selection text; truncates with an ellipsis by default.</td>
          </tr>
          <tr>
            <td><code>[hellSelectPlaceholder]</code></td>
            <td><code>root</code></td>
            <td>The muted text shown while nothing is selected.</td>
          </tr>
          <tr>
            <td><code>[hellSelectDropdown]</code></td>
            <td><code>root</code></td>
            <td>The floating listbox panel — surface, border, radius, shadow, max-height, scroll.</td>
          </tr>
          <tr>
            <td><code>[hellSelectOption]</code></td>
            <td><code>root</code></td>
            <td>A single option row — padding, radius, and the active / selected / disabled states.</td>
          </tr>
          <tr>
            <td rowspan="6"><code>&lt;hell-select&gt;</code></td>
            <td><code>root</code></td>
            <td>The preset host element wrapping the composed control.</td>
          </tr>
          <tr>
            <td><code>trigger</code></td>
            <td>The composed <code>[hellSelectTrigger]</code> button inside the preset.</td>
          </tr>
          <tr>
            <td><code>value</code></td>
            <td>The composed <code>[hellSelectValue]</code> text inside the preset.</td>
          </tr>
          <tr>
            <td><code>placeholder</code></td>
            <td>The composed <code>[hellSelectPlaceholder]</code> text inside the preset.</td>
          </tr>
          <tr>
            <td><code>dropdown</code></td>
            <td>The composed <code>[hellSelectDropdown]</code> panel inside the preset.</td>
          </tr>
          <tr>
            <td><code>option</code></td>
            <td>Each composed <code>[hellSelectOption]</code> row inside the preset.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines every part of the <code>&lt;hell-select&gt;</code> map —
        <code>root</code>, <code>trigger</code>, <code>value</code>, <code>placeholder</code>,
        <code>dropdown</code>, and <code>option</code> — using Hell design tokens. Open it to see
        the styled panel and options.
      </p>
      <hd-example-tabs [code]="selectStylingExampleCode" previewClass="min-h-[240px]">
        <app-select-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>[hellSelectTrigger]</code> — trigger host and state container. Attach to a <code>&lt;button&gt;</code>.</p>
      <ul>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt;</code> — <code>T | null</code> in single mode, <code>readonly T[]</code> in multiple mode. Default <code>null</code>.</li>
        <li><code>multiple</code>: <code>boolean</code>. Accumulates selections into an array and keeps the list open. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables the trigger. Default <code>false</code>.</li>
        <li><code>compareWith</code>: <code>HellOptionCompareWith&lt;T&gt;</code> (from core) — <code>(a, b) =&gt; boolean</code> for matching values by identity. Default reference equality.</li>
        <li><code>placement</code>, <code>container</code>, <code>flip</code>: floating-panel positioning, forwarded to the primitive.</li>
        <li><code>options</code>: optional value list forwarded to the primitive (used for virtualization scenarios).</li>
        <li>Outputs: <code>valueChange: EventEmitter&lt;HellPickValue&lt;T&gt;&gt;</code>, <code>openChange: EventEmitter&lt;boolean&gt;</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — shorthand string or <code>&#123; root?: string &#125;</code> map refining <code>root</code>.</li>
      </ul>
      <p><code>[hellSelectValue]</code> / <code>[hellSelectPlaceholder]</code> — the selection and empty-state slots inside the trigger. Each takes <code>ui</code> (<code>HellUiInput&lt;'root'&gt;</code> / <code>HellUiInput&lt;'root'&gt;</code>).</p>
      <p><code>[hellSelectDropdown]</code> — the floating listbox panel; pair with <code>*hellSelectPortal</code> so it renders only while open and floats over surrounding content. Takes <code>ui</code> (<code>HellUiInput&lt;'root'&gt;</code>).</p>
      <p><code>[hellSelectOption]</code> — one option row.</p>
      <ul>
        <li><code>value</code>: the option's value. Required.</li>
        <li><code>disabled</code>: <code>boolean</code>. Skips the row for selection and keyboard activation.</li>
        <li><code>index</code>: optional explicit index (virtualization).</li>
        <li>Output: <code>activated</code> — emitted when the row is activated.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p>
        <code>select[hellNativeSelect]</code> — the styled native <code>&lt;select&gt;</code>
        (moved here from the input entry point): host directive <code>NgpInput</code> (forwards
        <code>disabled</code>, <code>id</code>), <code>size</code> (<code>'sm' | 'md' | 'lg'</code>),
        <code>invalid</code>, and <code>ui: HellUiInput&lt;'root'&gt;</code>. Reach for it when OS
        pickers and mobile ergonomics matter more than custom rendering.
      </p>
      <p><code>&lt;hell-select&gt;</code> — the preset composing all of the above.</p>
      <ul>
        <li><code>options</code>: <code>readonly HellOption&lt;T&gt;[]</code> (from core) — <code>&#123; value, label, disabled? &#125;</code> entries. Default <code>[]</code>.</li>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt; | null</code>. Default <code>null</code>.</li>
        <li><code>multiple</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>placeholder</code>: <code>string</code>. Default <code>'Select'</code>.</li>
        <li><code>displayWith</code>: <code>HellOptionDisplayWith&lt;T&gt; | null</code> — overrides option labels (and labels selected values missing from <code>options</code>). Default <code>null</code>: the matching option's <code>label</code> renders.</li>
        <li><code>compareWith</code>: <code>HellOptionCompareWith&lt;T&gt;</code>. Default reference equality.</li>
        <li><code>aria-label</code> / <code>aria-labelledby</code> / <code>aria-describedby</code>: forwarded to the trigger; inside a <code>hellField</code> these are inherited automatically.</li>
        <li>Outputs: <code>valueChange</code>, <code>openChange</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellSelectPart&gt;</code> — a <code>HellSelectUi</code> map over <code>root | trigger | value | placeholder | dropdown | option</code>.</li>
      </ul>
      <p>Related types:</p>
      <ul>
        <li>Values (from <code>&#64;hell-ui/angular/core</code>): <code>HellPickSingleValue&lt;T&gt;</code> (<code>T | null</code>), <code>HellPickMultipleValue&lt;T&gt;</code> (<code>readonly T[]</code>), <code>HellPickValue&lt;T&gt;</code> (their union).</li>
        <li>Option contract (from <code>&#64;hell-ui/angular/core</code>): <code>HellOption&lt;T&gt;</code>, <code>HellOptionDisplayWith&lt;T&gt;</code>, <code>HellOptionCompareWith&lt;T&gt;</code>.</li>
        <li>Parts / maps: <code>HellSelectPart</code> &amp; <code>HellSelectUi</code>; each composable directive exposes a single <code>root</code> part (<code>ui: HellUiInput&lt;'root'&gt;</code>).</li>
        <li>Directive bundles: <code>HELL_SELECT_DIRECTIVES</code> (the composable suite), <code>HellSelect</code> (the preset).</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The trigger is a native <code>&lt;button&gt;</code> with <code>role="combobox"</code>, <code>aria-expanded</code> reflecting the open state, and <code>aria-controls</code> pointing at the listbox while open.</li>
        <li>The dropdown has <code>role="listbox"</code>; each option has <code>role="option"</code>, and selected options carry <code>aria-selected="true"</code>.</li>
        <li>Navigation uses the active-descendant pattern: focus stays on the trigger, which points at the active option via <code>aria-activedescendant</code>; options are not tab stops (<code>tabindex="-1"</code>).</li>
        <li>Keyboard: <code>ArrowDown</code> / <code>ArrowUp</code> open the list and move the active option; <code>Home</code> / <code>End</code> jump to the first / last option; <code>Enter</code> opens or selects the active option; <code>Space</code> toggles the list open or closed; <code>Escape</code> or an outside click dismisses it. Because focus never leaves the trigger, closing the list leaves focus on the trigger.</li>
        <li>The preset keeps a stable accessible name after selection: bind <code>aria-label</code> or <code>aria-labelledby</code> (and <code>aria-describedby</code>), or nest it in a <code>hellField</code> so the label and description are wired for you.</li>
        <li>This is a custom-rendered listbox, not a native <code>&lt;select&gt;</code>; where OS pickers and mobile ergonomics are the priority, use <code>hellNativeSelect</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use it for short-to-medium lists of known values; reach for the combobox once filtering helps.</li>
        <li>Keep a stable accessible name via <code>aria-label</code>, <code>aria-labelledby</code>, or a wrapping <code>hellField</code>.</li>
        <li>Pass <code>compareWith</code> whenever option values are objects so the current value matches by identity.</li>
        <li>In <code>multiple</code> mode, summarize the selection in the trigger and surface the choices nearby (tags, a count).</li>
        <li>Use <code>ui</code> to refine parts; on the preset, target parts by name (<code>trigger</code>, <code>dropdown</code>, <code>option</code>, …).</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use it for long or unbounded lists — scanning a listbox by keyboard is slow; use the combobox.</li>
        <li>Don't rely on typeahead-to-search — this select navigates by arrow keys, not by typing a query.</li>
        <li>Don't leave an icon-only or value-less trigger unnamed; it needs an accessible name.</li>
        <li>Don't fight recipe utilities with template <code>class</code>; use <code>ui</code> so refinements win deterministically.</li>
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
