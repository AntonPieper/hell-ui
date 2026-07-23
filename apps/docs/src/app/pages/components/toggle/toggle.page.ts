import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ToggleBasicExample } from './examples/basic.example';
import toggleBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ToggleSizesExample } from './examples/sizes.example';
import toggleSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { ToggleGroupSingleExample } from './examples/group-single.example';
import toggleGroupSingleExampleCodeRaw from './examples/group-single.example.ts?raw' with {
  loader: 'text',
};
import { ToggleGroupMultipleExample } from './examples/group-multiple.example';
import toggleGroupMultipleExampleCodeRaw from './examples/group-multiple.example.ts?raw' with {
  loader: 'text',
};
import { ToggleWithTooltipExample } from './examples/with-tooltip.example';
import toggleWithTooltipExampleCodeRaw from './examples/with-tooltip.example.ts?raw' with {
  loader: 'text',
};
import { ToggleFormsExample } from './examples/forms.example';
import toggleFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { ToggleStylingExample } from './examples/styling.example';
import toggleStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ToggleBasicExample,
    ToggleSizesExample,
    ToggleGroupSingleExample,
    ToggleGroupMultipleExample,
    ToggleWithTooltipExample,
    ToggleFormsExample,
    ToggleStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Toggle"
        icon="faSolidToggleOn"
        category="Styled primitive"
        importPath="hell-ui/toggle"
        stylesPath="hell-ui/toggle/styles.css"
      >
        A pressed/unpressed button for a single binary choice, or a peer group of them for
        single- or multi-select tool rows.
      </hd-page-header>
      <p>
        <code>hellToggle</code> is a directive for a standalone press-toggle button, built on the
        <code>NgpToggle</code> primitive from <code>ng-primitives</code> for the
        <code>selected</code>/<code>aria-pressed</code> state machine. <code>hellToggleGroup</code>
        and <code>hellToggleGroupItem</code> build on the <code>ng-primitives</code> toggle-group
        primitive to turn a row of toggle buttons into one single- or multi-select control. The
        group's <code>value</code> is one Angular model with a mode-dependent canonical type —
        bind it directly (<code>[value]</code> plus <code>(valueChange)</code>), two-way
        (<code>[(value)]</code>), or through forms: it implements Signal Forms'
        <code>FormValueControl</code> contract for <code>[formField]</code>, and the same model
        drives <code>formControl</code> and <code>ngModel</code> through Angular's built-in
        interoperability.
      </p>
      <p>
        Reach for a standalone toggle for one binary setting rendered as a button, like a mute or
        favorite action. Reach for a toggle group when several mutually related options sit side
        by side as peers — text alignment, view density, or a formatting toolbar — instead of
        wiring up several independent toggles or a native radio/checkbox set that would need its
        own visual treatment.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="toggleBasicExampleCode" previewClass="flex gap-2">
        <app-toggle-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>hellToggle</code> and <code>hellToggleGroupItem</code> both take the shared
        <code>HellSize</code> scale. Standalone toggles default to <code>md</code>; group items
        default to <code>sm</code> since they usually sit dense inside a toolbar.
      </p>
      <hd-example-tabs
        [code]="toggleSizesExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-toggle-sizes-example />
      </hd-example-tabs>

      <h2>Toggle group: single-select</h2>
      <p>
        <code>type="single"</code> keeps at most one item selected at a time, and its canonical
        value is a plain string — or <code>null</code> once the selected item is deselected. Every
        binding style shares that same value: <code>[(value)]</code>, <code>[formField]</code>,
        <code>formControl</code>, and <code>ngModel</code>. Items render native radio semantics
        under the hood.
      </p>
      <hd-example-tabs [code]="toggleGroupSingleExampleCode">
        <app-toggle-group-single-example />
      </hd-example-tabs>

      <h2>Toggle group: multiple-select</h2>
      <p>
        <code>type="multiple"</code> allows any number of items selected at once, and its
        canonical value is a readonly string array (empty when nothing is selected). Items keep
        native toggle-button semantics (<code>aria-pressed</code>) instead of radio semantics,
        since none of them are mutually exclusive.
      </p>
      <hd-example-tabs [code]="toggleGroupMultipleExampleCode">
        <app-toggle-group-multiple-example />
      </hd-example-tabs>

      <h2>With tooltip</h2>
      <p>
        Icon-only toggle group items carry no visible label, so pair each one with a string
        <code>hellTooltip</code> from <code>hell-ui/tooltip</code> and an
        <code>aria-label</code> — a common shape for a compact formatting toolbar, with no
        template ceremony per item.
      </p>
      <hd-example-tabs [code]="toggleWithTooltipExampleCode">
        <app-toggle-with-tooltip-example />
      </hd-example-tabs>

      <h2>Forms</h2>
      <p>
        The <code>value</code> model is the group's single committed-value authority, so all
        binding styles observe the same mode-canonical value: <code>string | null</code> in
        <code>single</code> mode, a readonly string array in <code>multiple</code> mode. With
        Signal Forms, bind a field via <code>[formField]</code>: the field writes into
        <code>value</code>, one user toggle updates the field exactly once, focus leaving the
        group marks it touched, and the field's <code>disabled</code> rule flows into the group's
        <code>disabled</code> input. <code>formControl</code> and <code>[(ngModel)]</code> keep
        working against the same model through Angular's Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore.
      </p>
      <p>
        Non-canonical writes are normalized into the mode's shape and re-emitted through
        <code>(valueChange)</code>: in <code>single</code> mode an array keeps its first item, in
        <code>multiple</code> mode a string becomes a one-item array, and changing
        <code>type</code> re-normalizes the current value the same way. The <code>null</code>
        default reads as an empty selection in both modes, so bind the mode-appropriate type —
        <code>string | null</code> or <code>readonly string[]</code> — for a normalization-free
        contract.
      </p>
      <hd-example-tabs [code]="toggleFormsExampleCode">
        <app-toggle-forms-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        This entry point exports three directives, each with exactly one Public Part —
        <code>root</code>, the host button or group element itself. Pass <code>ui="..."</code> as
        shorthand to refine that part, or <code>[ui]="&#123; root: '...' &#125;"</code> for the
        equivalent explicit map. Both merge on top of the size/state recipe through Hell's
        Tailwind merge, so refinements win deterministically over the defaults they conflict with.
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
            <td><code>HellToggle</code></td>
            <td><code>root</code></td>
            <td>The standalone toggle button — background, border, text, radius, selected state.</td>
          </tr>
          <tr>
            <td><code>HellToggleGroup</code></td>
            <td><code>root</code></td>
            <td>The group container — background, border, radius, and gap around the items.</td>
          </tr>
          <tr>
            <td><code>HellToggleGroupItem</code></td>
            <td><code>root</code></td>
            <td>One item button inside a group — background, text, radius, selected state.</td>
          </tr>
        </tbody>
      </table>
      <p>
        Template <code>class</code> still works for layout hooks and non-conflicting utilities,
        but prefer <code>ui</code> whenever a refinement needs to win over a recipe class such as
        <code>bg-hell-primary</code> or <code>px-hell-5</code>.
      </p>
      <hd-example-tabs
        [code]="toggleStylingExampleCode"
        previewClass="flex flex-wrap items-center gap-2"
      >
        <app-toggle-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellToggle</code> (<code>button[hellToggle]</code>):
          <code>selected</code>: <code>boolean</code>, default <code>false</code>.
          <code>selectedChange</code>: <code>EventEmitter&lt;boolean&gt;</code>.
          <code>disabled</code>: <code>boolean</code>, default <code>false</code>.
          <code>size</code>: <code>HellSize</code> (<code>xs | sm | md | lg | xl</code>), default
          <code>md</code>.
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>hellToggleGroup</code> (any host, typically a <code>div</code>):
          <code>type</code>: <code>'single' | 'multiple'</code>, default <code>single</code>.
          <code>value</code>: model of <code>HellToggleGroupValue</code>
          (<code>string | null | readonly string[]</code>) — canonically a plain string or
          <code>null</code> in <code>single</code> mode and a readonly string array in
          <code>multiple</code> mode; supports <code>[(value)]</code> and defaults to
          <code>null</code> (empty selection). No static-attribute coercion — bind the exact
          typed value.
          <code>valueChange</code>: emits the mode-canonical value once per user commit or
          normalization.
          <code>disabled</code>: <code>boolean</code>, default <code>false</code>; also driven by
          bound forms.
          <code>touch</code>: emits when focus leaves the group entirely; Angular forms use it to
          mark the control touched.
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
          Implements Signal Forms' <code>FormValueControl&lt;HellToggleGroupValue&gt;</code>:
          bind <code>[formField]</code>, <code>formControl</code>, or <code>[(ngModel)]</code>
          with a plain string or <code>null</code> (<code>single</code>) or a string array
          (<code>multiple</code>) as the control's value type.
        </li>
        <li>
          <code>hellToggleGroupItem</code> (<code>button[hellToggleGroupItem]</code>, inside a
          <code>hellToggleGroup</code>):
          <code>value</code>: <code>string</code>, required.
          <code>disabled</code>: <code>boolean</code>, default <code>false</code>.
          <code>size</code>: <code>HellSize</code>, default <code>sm</code>.
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          Exported types: <code>HellToggleGroupValue</code>
          (<code>string | null | readonly string[]</code>).
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Standalone <code>hellToggle</code> buttons expose <code>aria-pressed</code>, reflecting
          <code>selected</code>.
        </li>
        <li>
          <code>hellToggleGroup</code> renders <code>role="group"</code> on its host and marks the
          group touched, for Angular Forms purposes, once focus leaves every item in the group.
        </li>
        <li>
          Items in a <code>type="single"</code> group get <code>role="radio"</code> and
          <code>aria-checked</code>. Items in a <code>type="multiple"</code> group instead keep
          native toggle-button semantics with <code>aria-pressed</code> and no <code>role</code>
          override — they are independent toggles, not mutually exclusive radios. Hell corrects
          this itself because upstream <code>ng-primitives</code> (&le; 0.124) hardcodes
          <code>role="radio"</code>/<code>aria-checked</code> regardless of group type; see
          <a href="https://github.com/ng-primitives/ng-primitives/issues/813" target="_blank" rel="noopener">ng-primitives#813</a>.
        </li>
        <li>Disabled toggles and group items get <code>data-disabled</code> and stop responding to press/keyboard activation.</li>
        <li>Icon-only toggles carry no accessible name from content, so they must set <code>aria-label</code> (or pair with a tooltip that also names the action).</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use a standalone toggle for one binary, persistent setting rendered as a button.</li>
        <li>Use a toggle group when several peer options share one row, like alignment or formatting tools.</li>
        <li>Choose <code>type="single"</code> when exactly zero-or-one option can be active, <code>type="multiple"</code> when several can.</li>
        <li>Always pair icon-only toggles and items with an <code>aria-label</code> or a tooltip.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a toggle for a one-shot, irreversible action — that's a button.</li>
        <li>Don't mix a standalone toggle into a row of group items — they have different keyboard and ARIA semantics.</li>
        <li>Don't rely on template <code>class</code> order to beat recipe utilities; use <code>ui</code> instead.</li>
      </ul>
    </article>
  `,
})
export class TogglePage {
  protected readonly toggleFormsExampleCode = toggleFormsExampleCodeRaw;
  protected readonly toggleBasicExampleCode = toggleBasicExampleCodeRaw;
  protected readonly toggleSizesExampleCode = toggleSizesExampleCodeRaw;
  protected readonly toggleGroupSingleExampleCode = toggleGroupSingleExampleCodeRaw;
  protected readonly toggleGroupMultipleExampleCode = toggleGroupMultipleExampleCodeRaw;
  protected readonly toggleWithTooltipExampleCode = toggleWithTooltipExampleCodeRaw;
  protected readonly toggleStylingExampleCode = toggleStylingExampleCodeRaw;
}
