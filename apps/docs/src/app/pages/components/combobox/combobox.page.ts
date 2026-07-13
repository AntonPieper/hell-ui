import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ComboboxBasicExample } from './examples/basic.example';
import comboboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { ComboboxPresetExample } from './examples/preset.example';
import comboboxPresetExampleCodeRaw from './examples/preset.example.ts?raw' with { loader: 'text' };
import { ComboboxMultipleExample } from './examples/multiple.example';
import comboboxMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxChipsExample } from './examples/chips.example';
import comboboxChipsExampleCodeRaw from './examples/chips.example.ts?raw' with {
  loader: 'text',
};
import { ComboboxWithFieldTagExample } from './examples/with-field-tag.example';
import comboboxWithFieldTagExampleCodeRaw from './examples/with-field-tag.example.ts?raw' with {
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
    ComboboxBasicExample,
    ComboboxPresetExample,
    ComboboxMultipleExample,
    ComboboxChipsExample,
    ComboboxWithFieldTagExample,
    ComboboxStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Combobox"
        icon="faSolidKeyboard"
        category="Mixed entry point"
        importPath="@hell-ui/angular/combobox"
        stylesPath="@hell-ui/angular/combobox/styles.css"
      >
        A text input paired with a filterable, keyboard-navigable option list for single or
        multiple selection.
      </hd-page-header>
      <p>
        The combobox entry point ships a suite of directives —
        <code>hellCombobox</code>, <code>hellComboboxInput</code>,
        <code>hellComboboxButton</code>, <code>hellComboboxDropdown</code>,
        <code>hellComboboxOption</code>, and <code>hellComboboxEmpty</code> — that you compose over
        native elements, plus the <code>*hellComboboxPortal</code> structural directive that renders
        the dropdown as a floating overlay only while open. It builds on the
        <code>NgpCombobox</code> primitive from <code>ng-primitives</code>, which owns the WAI-ARIA
        combobox pattern, active-descendant focus, and dropdown positioning; Hell adds the default
        Tailwind recipe, Part Style Maps, and an Angular forms bridge on top.
      </p>
      <p>
        Reach for it when a list is large enough that free typing beats scanning — currency pickers,
        assignee and label selectors, warehouse or account lookups — where a plain
        <code>&lt;select&gt;</code> or a <code>radio</code> group would be slower. In multiple mode
        the value follows the primitive's array contract, which pairs naturally with
        <code>hellChip</code> chips for a token filter. When wiring the full directive set is more
        boilerplate than the screen deserves, the <code>&lt;hell-combobox&gt;</code>
        convenience component composes the whole anatomy and handles display filtering for you.
      </p>

      <h2>Basic</h2>
      <p>
        The smallest realistic composition: an input, a toggle button, and a portalled dropdown of
        options. You own the filtering — bind the input value and filter the list yourself so the
        example works for any data source.
      </p>
      <hd-example-tabs [code]="comboboxBasicExampleCode">
        <app-combobox-basic-example />
      </hd-example-tabs>

      <h2>Preset</h2>
      <p>
        <code>&lt;hell-combobox&gt;</code> composes the input, button, portal, dropdown, and
        options into one component and filters by <code>displayWith</code> internally. Pass
        <code>[options]</code>, bind <code>[value]</code>/<code>(valueChange)</code>, and set
        <code>allowDeselect</code> to let users clear a single selection by re-picking it.
      </p>
      <hd-example-tabs [code]="comboboxPresetExampleCode">
        <app-combobox-preset-example />
      </hd-example-tabs>

      <h2>Multiple</h2>
      <p>
        Add <code>multiple</code> to <code>hellCombobox</code> and the value becomes a read-only
        array; selecting an option toggles its membership and the dropdown stays open for the next
        pick. Render the current selection as <code>hellChip</code> chips below the control so the
        applied tokens stay scannable.
      </p>
      <hd-example-tabs [code]="comboboxMultipleExampleCode">
        <app-combobox-multiple-example />
      </hd-example-tabs>

      <h2>Chips presentation</h2>
      <p>
        Drop a <code>hellComboboxChips</code> directive inside the control, before the
        <code>hellComboboxInput</code>, and each selected value renders as a removable chip built on
        the <code>@hell-ui/angular/chip</code> primitive — the multi-select assign-groups pattern.
        Removal via a chip's remove button or Backspace in the empty field routes through the
        combobox's selection state, so the emitted form value, the options'
        <code>aria-selected</code> state, and the rendered chips never diverge; a disabled combobox
        disables every chip's remove button. The presentation composes <code>HellChipSet</code>, so
        its chips form one roving tab stop: use Arrow Left/Right or Home/End to move, then Delete or
        Backspace to remove the focused chip. Pass <code>[displayWith]</code> to label chips when a
        value's string form is not the label you want, and relax the control's fixed height (as
        below via <code>[ui]</code>) so chips wrap.
      </p>
      <hd-example-tabs [code]="comboboxChipsExampleCode">
        <app-combobox-chips-example />
      </hd-example-tabs>

      <h2>With field and tag</h2>
      <p>
        A realistic reviewer picker: <code>hellField</code> wires a <code>hellFieldLabel</code> and
        <code>hellFieldDescription</code> to the combobox for accessible naming, while each selected
        teammate renders as a dismissible <code>hellChip</code> chip with a
        <code>hellButton iconOnly</code> remove control. Every piece imports from its own narrow
        entry point.
      </p>
      <hd-example-tabs [code]="comboboxWithFieldTagExampleCode">
        <app-combobox-with-field-tag-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every module in this entry point follows Hell's Part Style Map contract. Pass
        <code>ui="…"</code> as a shorthand class string to refine a directive's default part, or
        <code>[ui]="&#123; … &#125;"</code> as a map keyed by named public parts. Refinements merge
        on top of each part's default recipe through Hell's Tailwind merge, so a conflicting utility
        wins deterministically over the default it replaces.
      </p>
      <p>
        The single-host directives each expose one <code>root</code> part (their host element).
        <code>&lt;hell-combobox&gt;</code> owns the full anatomy, so its <code>ui</code> map
        keys the named parts of every element it renders:
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
            <td><code>hellCombobox</code></td>
            <td><code>root</code></td>
            <td>The control shell — border, background, radius, height, focus ring, disabled and invalid states.</td>
          </tr>
          <tr>
            <td><code>hellComboboxInput</code></td>
            <td><code>root</code></td>
            <td>The editable filter input — text color, placeholder color, transparent background.</td>
          </tr>
          <tr>
            <td><code>hellComboboxButton</code></td>
            <td><code>root</code></td>
            <td>The toggle button hosting the chevron glyph — width, color, hover state.</td>
          </tr>
          <tr>
            <td><code>hellComboboxDropdown</code></td>
            <td><code>root</code></td>
            <td>The floating listbox surface — width, max-height, border, elevation, scroll, pop-in.</td>
          </tr>
          <tr>
            <td><code>hellComboboxOption</code></td>
            <td><code>root</code></td>
            <td>An option row — padding, radius, and active/selected/disabled states.</td>
          </tr>
          <tr>
            <td><code>hellComboboxEmpty</code></td>
            <td><code>root</code></td>
            <td>The no-results placeholder — muted text and padding.</td>
          </tr>
          <tr>
            <td><code>&lt;hell-combobox&gt;</code></td>
            <td><code>root</code></td>
            <td>The component host wrapping the control.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>control</code></td>
            <td>The inner <code>hellCombobox</code> shell.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>input</code></td>
            <td>The projected <code>hellComboboxInput</code>.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>button</code></td>
            <td>The projected <code>hellComboboxButton</code>.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>dropdown</code></td>
            <td>The projected <code>hellComboboxDropdown</code>.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>option</code></td>
            <td>Each rendered <code>hellComboboxOption</code>.</td>
          </tr>
          <tr>
            <td></td>
            <td><code>empty</code></td>
            <td>The <code>hellComboboxEmpty</code> placeholder.</td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines every <code>&lt;hell-combobox&gt;</code> part — and through
        it every underlying module — with Hell design tokens. Open the dropdown to see the styled
        surface and options.
      </p>
      <hd-example-tabs [code]="comboboxStylingExampleCode" previewClass="min-h-[220px]">
        <app-combobox-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><code>[hellCombobox]</code> — the control container (host of <code>NgpCombobox</code>).</p>
      <ul>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt;</code> — <code>T | null</code> in single mode, <code>readonly T[]</code> in multiple mode.</li>
        <li><code>multiple</code>: <code>boolean</code>. Switches to array-valued multi-select. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>allowDeselect</code>: <code>boolean</code>. Lets a single selection be cleared by re-picking it. Default <code>false</code>.</li>
        <li><code>compareWith</code>: <code>HellOptionCompareWith&lt;T&gt;</code> (from core) — <code>(a, b) =&gt; boolean</code> for non-reference option identity.</li>
        <li><code>placement</code>: <code>NgpComboboxPlacement</code> — dropdown side/alignment. Default <code>bottom</code>.</li>
        <li><code>container</code>: <code>string | HTMLElement | null</code> — overlay mount target. Default <code>body</code>.</li>
        <li><code>flip</code>: <code>NgpFlipInput</code> — flip on overflow. Default <code>true</code>.</li>
        <li><code>options</code>: <code>readonly T[]</code> — full option registry for virtualized/manually ordered lists (aliases <code>ngpComboboxOptions</code>).</li>
        <li><code>wrapNavigation</code>: <code>boolean</code> — lets Arrow Up/Down wrap between boundaries. Default <code>true</code>; set <code>false</code> for clamped composite flows.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — refines the <code>root</code> part.</li>
        <li>Outputs: <code>valueChange: HellPickValue&lt;T&gt;</code>, <code>openChange: boolean</code>.</li>
        <li>Implements <code>ControlValueAccessor</code>, so it works with <code>ngModel</code> and reactive forms.</li>
      </ul>
      <p><code>input[hellComboboxInput]</code> — the editable filter input; drives typing and keyboard focus. Exposes <code>ui</code>.</p>
      <p><code>button[hellComboboxButton]</code> — the dropdown toggle. Renders the chevron via a <code>::after</code> mask, so keep the element empty. Exposes <code>ui</code>.</p>
      <p><code>[hellComboboxDropdown]</code> — the floating option surface. Pair with the <code>*hellComboboxPortal</code> structural directive so it renders in an overlay only while open: <code>&lt;div *hellComboboxPortal hellComboboxDropdown&gt;…&lt;/div&gt;</code>. Exposes <code>ui</code>.</p>
      <p><code>[hellComboboxOption]</code> — an option row.</p>
      <ul>
        <li><code>value</code>: the payload emitted on selection (aliases <code>ngpComboboxOptionValue</code>).</li>
        <li><code>disabled</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>index</code>: <code>number</code> — explicit ordering for virtualized lists.</li>
        <li><code>activated</code>: output emitted on click/keyboard activation (for value-less options).</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> (<code>'root'</code>).</li>
      </ul>
      <p><code>[hellComboboxEmpty]</code> — the no-results placeholder slot. Exposes <code>ui</code>.</p>
      <p><code>[hellComboboxChips]</code> — the multiple-mode chips presentation. Place it inside the control, before the input; it renders each selected value as a removable chip and routes removal (chip button or Backspace-on-empty) through the combobox selection state.</p>
      <ul>
        <li><code>displayWith</code>: <code>HellOptionDisplayWith&lt;T&gt;</code> — <code>(value) =&gt; string</code> label for each chip. Default <code>String</code>.</li>
        <li><code>size</code>: <code>HellSize</code> — chip size. Default <code>'sm'</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellComboboxChipsPart&gt;</code> — map of <code>root | chip</code> (the remove button styles through the chip entry point).</li>
      </ul>
      <p><code>[hellComboboxPortal]</code> — structural directive that renders the dropdown as a floating overlay while open. No inputs.</p>
      <p><code>&lt;hell-combobox&gt;</code> — the convenience component composing the whole anatomy.</p>
      <ul>
        <li><code>options</code>: <code>readonly HellOption&lt;T&gt;[]</code> (from core) — <code>&#123; value, label, disabled? &#125;</code> entries. Default <code>[]</code>.</li>
        <li><code>value</code>: <code>HellPickValue&lt;T&gt; | null</code>. Default <code>null</code>.</li>
        <li><code>multiple</code> / <code>allowDeselect</code> / <code>disabled</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>placeholder</code>: <code>string</code>. Default <code>'Search'</code>.</li>
        <li><code>toggleLabel</code>: <code>string</code> — button aria-label. Default <code>'Toggle options'</code>.</li>
        <li><code>emptyLabel</code>: <code>string</code>. Default <code>'No matches'</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code> — accessible name for the input. Default <code>null</code>.</li>
        <li><code>compareWith</code>: <code>HellOptionCompareWith&lt;T&gt;</code>. Default reference equality.</li>
        <li><code>displayWith</code>: <code>HellOptionDisplayWith&lt;T&gt; | null</code> — overrides option labels (and labels selected values missing from <code>options</code>). Default <code>null</code>: the matching option's <code>label</code> renders. Filtering also matches against the rendered label.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellComboboxPart&gt;</code> — map of <code>root | control | input | button | dropdown | option | empty</code>.</li>
        <li>Outputs: <code>valueChange</code>, <code>openChange</code>. Implements <code>ControlValueAccessor</code>.</li>
      </ul>
      <p>
        Value and option types come from <code>&#64;hell-ui/angular/core</code>:
        <code>HellPickValue&lt;T&gt;</code>, <code>HellPickSingleValue&lt;T&gt;</code>,
        <code>HellPickMultipleValue&lt;T&gt;</code>, and the option contract
        <code>HellOption&lt;T&gt;</code> / <code>HellOptionDisplayWith&lt;T&gt;</code> / <code>HellOptionCompareWith&lt;T&gt;</code>.
        This entry point exports per-module <code>Hell*Part</code> / <code>Hell*Ui</code> pairs for
        <code>Combobox</code>, <code>ComboboxInput</code>, <code>ComboboxButton</code>,
        <code>ComboboxDropdown</code>, <code>ComboboxOption</code>, <code>ComboboxEmpty</code>,
        <code>ComboboxChips</code>, and the owned-anatomy <code>hell-combobox</code>. The
        <code>HELL_COMBOBOX_DIRECTIVES</code> bundle (which includes
        <code>hellComboboxChips</code>) eases <code>imports</code>; the
        <code>hell-combobox</code> component imports directly as <code>HellCombobox</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>The input carries <code>role="combobox"</code>, <code>aria-autocomplete="list"</code>, <code>aria-haspopup="listbox"</code>, and <code>autocomplete="off"</code>, with <code>aria-expanded</code>, <code>aria-controls</code>, and <code>aria-activedescendant</code> tracking the open state and highlighted option.</li>
        <li>The dropdown is a <code>role="listbox"</code>; each option is a <code>role="option"</code> that reflects <code>aria-selected</code> and <code>data-selected</code> / <code>data-active</code> / <code>data-disabled</code> state.</li>
        <li>Keyboard: Arrow Down/Up open and move the active option, Home/End jump to first/last, Enter selects the active option, and Escape closes the dropdown.</li>
        <li>With <code>hellComboboxChips</code>, the selected chips form one roving tab stop. Arrow Left/Right and Home/End move chip focus; Delete/Backspace removes the focused chip and keeps focus in the collection. Backspace in the empty input removes the last selection.</li>
        <li>The toggle button is <code>tabindex="-1"</code> with <code>aria-haspopup="listbox"</code>, so the input stays the single keyboard entry point while the button remains a pointer affordance.</li>
        <li>Give the input an accessible name via a <code>&lt;label&gt;</code> (for example inside <code>hellField</code>), <code>aria-label</code>, or <code>aria-labelledby</code>. On <code>&lt;hell-combobox&gt;</code> pass <code>aria-label</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use combobox when a list is large enough that typing to filter beats scanning.</li>
        <li>Use <code>hellComboboxChips</code> for editable multiple selections; keep <code>hellChip</code> for static or read-only summaries.</li>
        <li>Leave <code>hellComboboxButton</code> empty — its chevron is drawn by the stylesheet.</li>
        <li>Provide an accessible name via a label, <code>aria-label</code>, or <code>aria-labelledby</code>.</li>
        <li>Reach for <code>&lt;hell-combobox&gt;</code> when composing the directives is just boilerplate.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use a combobox for fewer than ~5 options — a <code>radio</code> group or plain <code>select</code> is faster.</li>
        <li>Don't hide the toggle button; users need a visible affordance to open the list without typing.</li>
        <li>Don't render <code>hellComboboxDropdown</code> without <code>*hellComboboxPortal</code>, or it stays inline and always visible.</li>
        <li>Don't target private descendants — refine each module through its documented Part Style Map (<code>root</code>, plus <code>chip</code> on <code>hellComboboxChips</code>).</li>
      </ul>
    </article>
  `,
})
export class ComboboxPage {
  protected readonly comboboxBasicExampleCode = comboboxBasicExampleCodeRaw;
  protected readonly comboboxPresetExampleCode = comboboxPresetExampleCodeRaw;
  protected readonly comboboxMultipleExampleCode = comboboxMultipleExampleCodeRaw;
  protected readonly comboboxChipsExampleCode = comboboxChipsExampleCodeRaw;
  protected readonly comboboxWithFieldTagExampleCode = comboboxWithFieldTagExampleCodeRaw;
  protected readonly comboboxStylingExampleCode = comboboxStylingExampleCodeRaw;
}
