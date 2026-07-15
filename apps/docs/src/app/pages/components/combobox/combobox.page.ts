import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ComboboxAsyncSourceExample } from './examples/async-source.example';
import comboboxAsyncSourceExampleCodeRaw from './examples/async-source.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxBasicExample } from './examples/basic.example';
import comboboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { ComboboxChipsExample } from './examples/chips.example';
import comboboxChipsExampleCodeRaw from './examples/chips.example.ts?raw' with { loader: 'text' };
import { ComboboxMultipleExample } from './examples/multiple.example';
import comboboxMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxRankedFilteringExample } from './examples/ranked-filtering.example';
import comboboxRankedFilteringExampleCodeRaw from './examples/ranked-filtering.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxStylingExample } from './examples/styling.example';
import comboboxStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxWithFieldTagExample } from './examples/with-field-tag.example';
import comboboxWithFieldTagExampleCodeRaw from './examples/with-field-tag.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ComboboxBasicExample,
    ComboboxMultipleExample,
    ComboboxChipsExample,
    ComboboxWithFieldTagExample,
    ComboboxStylingExample,
    ComboboxRankedFilteringExample,
    ComboboxAsyncSourceExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Combobox"
        icon="faSolidKeyboard"
        category="Styled primitive"
        importPath="@hell-ui/angular/combobox"
        stylesPath="@hell-ui/angular/combobox/styles.css"
      >
        One projection-first interaction state machine for an editable input and a
        keyboard-navigable option list.
      </hd-page-header>

      <p>
        Combobox is a directive suite over consumer-owned markup:
        <code>hellCombobox</code>, <code>hellComboboxInput</code>,
        <code>hellComboboxButton</code>, <code>hellComboboxDropdown</code>,
        <code>hellComboboxOption</code>, <code>hellComboboxEmpty</code>, and the structural
        <code>*hellComboboxPortal</code>. Project your domain objects directly into option rows;
        ng-primitives owns selection, active-descendant focus, keyboard navigation, and floating
        positioning while Hell adds styling, forms integration, and containment-safe dismissal.
      </p>
      <p>
        The consumer owns search data and presentation. Compose
        <code>hellSearchResource</code> for local ranking or abort-aware async retrieval,
        <code>hellControlGroup</code> when several controls share one visual frame, and public
        <code>hellChipSet</code>/<code>hellChipInput</code> directives for editable multiple
        values. This keeps one Combobox state machine without a second renderer-specific value,
        search, status, or chip model.
      </p>

      <h2>Basic</h2>
      <p>
        A local Search Resource ranks currency domain objects. The same objects feed
        <code>[options]</code> and render inside <code>hellComboboxOption</code>, including a
        disabled item and custom comparison by stable identifier. Control Group owns the shared
        visual frame; root Part refinements remove its duplicate border and background while
        keeping the Combobox host measurable for floating positioning.
      </p>
      <hd-example-tabs [code]="comboboxBasicExampleCode">
        <app-combobox-basic-example />
      </hd-example-tabs>

      <h2>Filtering and ranking</h2>
      <p>
        Local <code>hellSearchResource</code> instances use the configured
        <code>HELL_SEARCH_RANKER</code>. Scope <code>provideHellSearchRanker</code> to replace that
        policy without coupling it to Combobox: this example promotes the most recently dispatched
        station while preserving text relevance for the rest.
      </p>
      <hd-example-tabs [code]="comboboxRankedFilteringExampleCode">
        <app-combobox-ranked-filtering-example />
      </hd-example-tabs>

      <h2>Async source</h2>
      <p>
        An async Search Resource owns debounce, cancellation, and stale-result protection. Its
        source receives an <code>AbortSignal</code>; its <code>items</code>, <code>status</code>, and
        <code>error</code> signals drive consumer-owned option, loading, empty, and error markup.
        Type <code>fail</code> to see the error state, or type quickly to supersede an in-flight
        request.
      </p>
      <hd-example-tabs [code]="comboboxAsyncSourceExampleCode">
        <app-combobox-async-source-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <p>
        Add <code>multiple</code> and the value becomes a read-only array. Selecting an option
        toggles its domain object while the dropdown stays open; the public Chip Set below renders
        a read-only summary of the same objects.
      </p>
      <hd-example-tabs [code]="comboboxMultipleExampleCode">
        <app-combobox-multiple-example />
      </hd-example-tabs>

      <h2>Chip Input composition</h2>
      <p>
        For editable multiple values, place a public <code>hellChipSet</code> inside Combobox and
        apply both <code>hellComboboxInput</code> and <code>hellChipInput</code> to its input. Chips
        emit removal requests to consumer state; Combobox remains the only selection state machine.
        On an empty input, the first Backspace focuses the last removable chip and the second
        removes it. Arrow keys, Home, End, Delete, and each remove button follow the Chip Set
        contract.
      </p>
      <hd-example-tabs [code]="comboboxChipsExampleCode">
        <app-combobox-chips-example />
      </hd-example-tabs>

      <h2>With field and chips</h2>
      <p>
        Field supplies the input label and description relationships; the option rows project
        reviewer name and team directly. A separate public Chip Set presents selected reviewers
        with removable chips, keeping every module on its narrow import path.
      </p>
      <hd-example-tabs [code]="comboboxWithFieldTagExampleCode">
        <app-combobox-with-field-tag-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Each directive owns one public <code>root</code> part. Pass <code>ui="…"</code> on the
        element you are refining; a Combobox root style never reaches into the projected input,
        button, dropdown, option, or empty state. Conflicting Tailwind utilities merge
        deterministically over each directive's default recipe.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr><th>Directive</th><th>Root surface</th></tr>
        </thead>
        <tbody>
          <tr><td><code>hellCombobox</code></td><td>Control shell and focus/disabled state.</td></tr>
          <tr><td><code>hellComboboxInput</code></td><td>Editable text input.</td></tr>
          <tr><td><code>hellComboboxButton</code></td><td>Toggle and chevron.</td></tr>
          <tr><td><code>hellComboboxDropdown</code></td><td>Floating listbox surface.</td></tr>
          <tr><td><code>hellComboboxOption</code></td><td>Active, selected, and disabled option row.</td></tr>
          <tr><td><code>hellComboboxEmpty</code></td><td>Consumer-authored no-results state.</td></tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="comboboxStylingExampleCode" previewClass="min-h-[220px]">
        <app-combobox-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>HellCombobox</code> / <code>[hellCombobox]</code> is the state-machine root.</p>
      <ul>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt;</code> — <code>T | null</code> in single mode or <code>readonly T[]</code> in multiple mode.</li>
        <li><code>multiple</code>, <code>disabled</code>, <code>allowDeselect</code>: boolean primitive inputs.</li>
        <li><code>compareWith</code>: <code>(left: T, right: T) =&gt; boolean</code> for domain identity.</li>
        <li><code>options</code>: <code>readonly T[]</code>, the ordered domain-object registry used by keyboard navigation.</li>
        <li><code>placement</code>, <code>container</code>, and <code>flip</code>: floating-dropdown inputs.</li>
        <li><code>wrapNavigation</code>: wraps Arrow Up/Down at list boundaries by default; set <code>false</code> to clamp.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
        <li>Outputs: <code>valueChange</code> and <code>openChange</code>.</li>
        <li>Implements <code>ControlValueAccessor</code> for reactive forms and <code>ngModel</code>.</li>
      </ul>
      <p>
        <code>HellComboboxInput</code>, <code>HellComboboxButton</code>,
        <code>HellComboboxDropdown</code>, and <code>HellComboboxEmpty</code> each expose
        <code>ui</code>. <code>HellComboboxOption</code> adds <code>value</code>,
        <code>disabled</code>, <code>index</code>, and <code>activated</code>.
        <code>HellComboboxPortal</code> has no input and renders its template only while open.
        <code>HELL_COMBOBOX_DIRECTIVES</code> bundles the complete seven-directive suite.
      </p>
      <p>
        Search Resource and <code>HellPickValue</code> live in
        <code>&#64;hell-ui/angular/core</code>. Control Group, Chip Set, and Chip Input keep their own
        public contracts and stylesheets; import them only when the composition needs them.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>The input owns <code>role="combobox"</code>, <code>aria-autocomplete="list"</code>, <code>aria-haspopup="listbox"</code>, and the open-state, controls, and active-descendant relationships.</li>
        <li>The dropdown is a <code>listbox</code>; projected options expose selected, active, and disabled state without moving DOM focus away from the input.</li>
        <li>Arrow Down/Up open and move, Home/End jump, Enter selects, and Escape closes and restores input focus. Disabled options are skipped.</li>
        <li>The toggle is outside the tab order so the input remains the single Combobox entry point.</li>
        <li>Give the input an accessible name with a label, <code>aria-label</code>, or <code>aria-labelledby</code>.</li>
        <li>Chip Input keyboard behavior comes from the public Chip Set and remains separate from Combobox selection.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Project domain objects and author their visible option markup where the data is known.</li>
        <li>Use Search Resource for reusable local ranking or async lifecycle state.</li>
        <li>Bind the same ordered result objects to <code>[options]</code> and render them as options.</li>
        <li>Leave <code>hellComboboxButton</code> empty; its stylesheet draws the chevron.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't create a second renderer-owned option, search, status, or chip state model.</li>
        <li>Don't render <code>hellComboboxDropdown</code> without <code>*hellComboboxPortal</code>.</li>
        <li>Don't target projected descendants from the root Part Style Map; refine each directive at its host.</li>
        <li>Don't use Combobox for a small fixed choice where native select or radio is clearer.</li>
      </ul>
    </article>
  `,
})
export class ComboboxPage {
  protected readonly comboboxBasicExampleCode = comboboxBasicExampleCodeRaw;
  protected readonly comboboxMultipleExampleCode = comboboxMultipleExampleCodeRaw;
  protected readonly comboboxChipsExampleCode = comboboxChipsExampleCodeRaw;
  protected readonly comboboxWithFieldTagExampleCode = comboboxWithFieldTagExampleCodeRaw;
  protected readonly comboboxStylingExampleCode = comboboxStylingExampleCodeRaw;
  protected readonly comboboxRankedFilteringExampleCode = comboboxRankedFilteringExampleCodeRaw;
  protected readonly comboboxAsyncSourceExampleCode = comboboxAsyncSourceExampleCodeRaw;
}
