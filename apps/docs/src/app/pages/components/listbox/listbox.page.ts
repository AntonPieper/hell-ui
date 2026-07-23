import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { ListboxAssignmentPickerExample } from './examples/assignment-picker.example';
import listboxAssignmentPickerExampleCodeRaw from './examples/assignment-picker.example.ts?raw' with {
  loader: 'text',
};
import { ListboxBasicExample } from './examples/basic.example';
import listboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { ListboxMultipleExample } from './examples/multiple.example';
import listboxMultipleExampleCodeRaw from './examples/multiple.example.ts?raw' with {
  loader: 'text',
};
import { ListboxSectionsExample } from './examples/sections.example';
import listboxSectionsExampleCodeRaw from './examples/sections.example.ts?raw' with {
  loader: 'text',
};
import { ListboxStylingExample } from './examples/styling.example';
import listboxStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-listbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ListboxAssignmentPickerExample,
    ListboxBasicExample,
    ListboxMultipleExample,
    ListboxSectionsExample,
    ListboxStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Listbox"
        icon="faSolidListUl"
        category="Styled primitive"
        importPath="hell-ui/listbox"
        stylesPath="hell-ui/listbox/styles.css"
      >
        An ARIA listbox for choosing from options that are already on screen — single or
        multiple, with sections, disabled rows, and typeahead built in.
      </hd-page-header>
      <p>
        <code>hellListbox</code> is a directive suite over <code>NgpListbox</code> from
        ng-primitives, which owns the WAI-ARIA listbox pattern: roving
        <code>aria-activedescendant</code> focus, Home/End navigation, and type-ahead-by-label.
        Hell adds the default Tailwind recipe, Part Style Maps, and data-attribute hooks for
        active/selected/disabled state on top; markup and DOM structure stay yours — options are
        plain elements you render with <code>&#64;for</code>.
      </p>
      <p>
        Selection is always array-shaped: <code>[value]</code> / <code>(valueChange)</code> carry
        the current selection as an array even in <code>single</code> mode, so switching
        <code>mode</code> between <code>single</code> and <code>multiple</code> never changes the
        binding's shape. Reach for listbox when every option is already visible and the user is
        picking from a short, static list — reviewer assignment, environment selection, launch
        checklists. For a searchable list backed by a text input, pair it with
        <code>hellSearch</code> as shown below; for a typed filter with its own dropdown
        overlay, use Combobox instead.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="listboxBasicExampleCode">
        <app-listbox-basic-example />
      </hd-example-tabs>

      <h2>Multiple selection</h2>
      <p>
        Set <code>mode="multiple"</code> to allow more than one selected option. Disabled options
        set <code>disabled</code> on the individual <code>hellListboxOption</code> — they stay
        visible, are skipped by type-ahead selection, and cannot be toggled.
      </p>
      <hd-example-tabs [code]="listboxMultipleExampleCode">
        <app-listbox-multiple-example />
      </hd-example-tabs>

      <h2>Sections</h2>
      <p>
        Group related options with <code>hellListboxSection</code> and label the group with a
        <code>hellListboxHeader</code> inside it. The section exposes <code>role="group"</code>
        and wires <code>aria-labelledby</code> to the header automatically — sections and headers
        are structural grouping only and never affect keyboard navigation, which still moves
        through every enabled option in document order.
      </p>
      <hd-example-tabs [code]="listboxSectionsExampleCode">
        <app-listbox-sections-example />
      </hd-example-tabs>

      <h2>With search and card</h2>
      <p>
        A realistic assignment picker: a <code>hellCard</code> hosts a <code>hellSearch</code>
        input that filters the listbox options client-side, with <code>hell-avatar</code> giving
        each row a face. This is the pattern to reach for once a listbox's option count grows past
        what fits comfortably on screen, without upgrading to a full combobox overlay.
      </p>
      <hd-example-tabs [code]="listboxAssignmentPickerExampleCode">
        <app-listbox-assignment-picker-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every directive in this entry point exposes exactly one Public Part, <code>root</code> —
        its own host element. Pass <code>ui="..."</code> as shorthand to refine that element, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit map. Each
        directive's Part Style Map only ever touches the element it is attached to; refining an
        option's <code>root</code> never reaches into the listbox or section around it.
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
            <td><code>HellListbox</code></td>
            <td><code>root</code></td>
            <td>The listbox container — border, background, padding, focus ring.</td>
          </tr>
          <tr>
            <td><code>HellListboxOption</code></td>
            <td><code>root</code></td>
            <td>
              One option row — background/text for hover, <code>data-active</code>,
              <code>data-selected</code>, and <code>data-disabled</code> states.
            </td>
          </tr>
          <tr>
            <td><code>HellListboxSection</code></td>
            <td><code>root</code></td>
            <td>The grouping wrapper around a header and its options — layout only.</td>
          </tr>
          <tr>
            <td><code>HellListboxHeader</code></td>
            <td><code>root</code></td>
            <td>The section's label text — color, weight, spacing.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>hellListboxTrigger</code> is behavior-only and renders no owned styling, so it has
        no Part Style Map. The example below refines every styled part at once, including nested
        section and header parts, using hell design tokens.
      </p>
      <hd-example-tabs [code]="listboxStylingExampleCode">
        <app-listbox-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellListbox</code>: root directive. Inputs — <code>id</code>,
          <code>mode</code>: <code>'single' | 'multiple'</code> (default <code>'single'</code>);
          <code>value</code>: <code>T[]</code> (default <code>[]</code>), the current selection as
          an array regardless of mode; <code>disabled</code>: <code>boolean</code> (default
          <code>false</code>), disables the whole listbox; <code>compareWith</code>:
          <code>(a: T, b: T) => boolean</code> (default strict <code>===</code>), for object-typed
          values. Output — <code>valueChange</code>: <code>T[]</code>.
        </li>
        <li>
          <code>hellListboxOption</code>: selectable row. Inputs — <code>id</code>,
          <code>value</code>: <code>T</code> (required); <code>disabled</code>:
          <code>boolean</code> (default <code>false</code>).
        </li>
        <li>
          <code>hellListboxSection</code>: groups options and picks up a descendant
          <code>hellListboxHeader</code> for its accessible name. No inputs beyond
          <code>ui</code>.
        </li>
        <li>
          <code>hellListboxHeader</code>: non-selectable label for a section. Input —
          <code>id</code>.
        </li>
        <li>
          <code>hellListboxTrigger</code>: behavior-only directive for composites that open a
          listbox from a trigger element alongside a popover trigger directive; it has no inputs,
          outputs, or <code>ui</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;Part&gt;</code> on every styled directive above
          (all except <code>hellListboxTrigger</code>) — a shorthand class string or a
          <code>&#123; root: string &#125;</code> map.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The listbox root carries <code>role="listbox"</code>,
          <code>aria-multiselectable</code> reflecting <code>mode</code>, and
          <code>aria-activedescendant</code> pointing at the active option — focus stays on the
          listbox itself while the active option is announced through the descendant reference.
        </li>
        <li>
          Each option carries <code>role="option"</code>, an always-present
          <code>aria-selected="true"</code> / <code>"false"</code>, and
          <code>aria-disabled</code> when disabled; Hell also mirrors selection and activity as
          <code>data-selected</code>, <code>data-active</code>, and <code>data-disabled</code>
          attributes for styling.
        </li>
        <li>
          Keyboard: Arrow Up/Down move the active option, Home/End jump to the first/last enabled
          option, typing jumps to the next option whose text starts with the typed characters, and
          Enter or Space selects the active option.
        </li>
        <li>
          Sections carry <code>role="group"</code> with <code>aria-labelledby</code> wired to
          their header automatically; headers carry <code>role="presentation"</code> and are never
          focusable or selectable.
        </li>
        <li>
          Give every listbox an accessible name — either <code>aria-label</code> or
          <code>aria-labelledby</code> pointing at a visible heading, as shown in the examples
          above.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use listbox when the full set of options is already visible and static.</li>
        <li>Keep option <code>value</code> a stable id; render display text and metadata separately.</li>
        <li>Pair with <code>hellSearch</code> once the option count grows past a quick scan.</li>
        <li>Give every listbox an accessible name and every section a <code>hellListboxHeader</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use listbox for command execution — reach for Menu or Omnibar items instead.</li>
        <li>Don't rebuild typed filtering on top of listbox — use Combobox when typing should narrow an overlay.</li>
        <li>Don't assume <code>value</code> is a scalar in single mode — it is always an array.</li>
      </ul>
    </article>
  `,
})
export class ListboxPage {
  protected readonly listboxAssignmentPickerExampleCode = listboxAssignmentPickerExampleCodeRaw;
  protected readonly listboxBasicExampleCode = listboxBasicExampleCodeRaw;
  protected readonly listboxMultipleExampleCode = listboxMultipleExampleCodeRaw;
  protected readonly listboxSectionsExampleCode = listboxSectionsExampleCodeRaw;
  protected readonly listboxStylingExampleCode = listboxStylingExampleCodeRaw;
}
