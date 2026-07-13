import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MultiSelectMenuButtonBasicExample } from './examples/basic.example';
import multiSelectMenuButtonBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { MultiSelectMenuButtonTanStackExample } from './examples/tanstack-columns.example';
import multiSelectMenuButtonTanStackExampleCodeRaw from './examples/tanstack-columns.example.ts?raw' with {
  loader: 'text',
};
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';

@Component({
  selector: 'hd-multi-select-menu-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlock,
    ExampleTabs,
    PageHeader,
    MultiSelectMenuButtonBasicExample,
    MultiSelectMenuButtonTanStackExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Multi-select menu button"
        icon="faSolidListCheck"
        category="Composite"
        importPath="@hell-ui/angular/multi-select-menu-button"
        stylesPath="@hell-ui/angular/multi-select-menu-button/styles.css"
      >
        A button that opens a menu of checkable options and reflects the selected count on its
        trigger. It is the general answer to "let people choose a subset" — of which toggling a
        table's columns is one recipe.
      </hd-page-header>
      <p>
        <code>hell-multi-select-menu-button</code> composes the button and the menu's checkbox
        items into one owned control. Selection is <strong>controlled</strong>: you bind
        <code>options</code> and <code>selected</code> and own the array. Toggling an option keeps
        the menu open — adjusting several options is one visit, not five — and emits the whole next
        selection through <code>selectedChange</code>. The composite never mutates your array and
        emits nothing on first render, so it drops cleanly onto a signal, an
        <code>NgModel</code>, or any store as the single source of truth.
      </p>

      <h2>Controlled options and count</h2>
      <p>
        Declare options as data (<code>value</code>, <code>label</code>, and an optional
        <code>disabled</code>) and bind <code>selected</code> to the values you own. The trigger
        shows a count badge while anything is selected and reflects
        <code>data-selection-count</code> and <code>data-has-selection</code> for styling.
        <code>minSelected</code> is a deselection floor: at the floor the still-selected options
        disable themselves, so the selection can never drop below it. An opt-in
        <code>resettable</code> item emits a distinct <code>reset</code> event — you restore your
        own defaults; the composite holds no notion of a default.
      </p>
      <hd-example-tabs [code]="basicExampleCode">
        <app-multi-select-menu-button-basic-example />
      </hd-example-tabs>
      <p>The whole control is one binding on each side:</p>
      <hd-code-block [code]="bindingRecipe" />

      <h2>Recipe: TanStack column visibility</h2>
      <p>
        Because selection is a plain controlled array, it binds directly to a caller-owned TanStack
        table's <code>columnVisibility</code> state. The options are the columns TanStack reports as
        hideable via <code>column.getCanHide()</code>, so a column marked
        <code>enableHiding: false</code> — the identity column here — never appears in the menu.
        <code>minSelected="1"</code> keeps at least one toggleable column on, and the reset item
        restores every column. This is the blessed path for column toggling: it keeps the table
        boundary intact — TanStack still owns the state, and Hell UI owns none of it.
      </p>
      <hd-example-tabs [code]="tanStackExampleCode">
        <app-multi-select-menu-button-tanstack-example />
      </hd-example-tabs>
      <p>
        Persistence is a caller concern, not a feature of the control. The example writes the whole
        visibility map to <code>localStorage</code> on every change through the table's
        <code>onColumnVisibilityChange</code> and reads it back on init — the app owns the storage
        key and its version, exactly as it owns page size. Drop the same
        <code>hellTableShellToolbar</code>-projected control into any TanStack Table Shell toolbar
        alongside filter and pagination controls.
      </p>

      <h2>Styling</h2>
      <p>
        <code>hell-multi-select-menu-button</code> owns three Public Parts. Its <code>ui</code>
        input takes either a shorthand class string (applied to <code>root</code>) or a map keyed by
        the part names below; refinements merge deterministically through Hell's Tailwind merge. The
        trigger renders on the button primitive, so <code>trigger</code> refinements merge into the
        button's own recipe, and the menu, its items, and the check indicator keep the menu entry
        point's parts and styling.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th><code>data-slot</code></th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td><code>root</code></td>
            <td>The composite host wrapping the trigger.</td>
          </tr>
          <tr>
            <td><code>trigger</code></td>
            <td><code>trigger</code></td>
            <td>The menu-opening button; merges into the button primitive's recipe.</td>
          </tr>
          <tr>
            <td><code>count</code></td>
            <td><code>count</code></td>
            <td>The selection-count badge, shown while the count is above zero.</td>
          </tr>
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li>
          <code>&lt;hell-multi-select-menu-button&gt;</code> — the owned-anatomy Composite.
          <ul>
            <li>
              <code>options</code>: <code>HellMultiSelectOption&lt;T&gt;[]</code> —
              <code>{{ '{' }} value, label, disabled? {{ '}' }}</code> in display order (required).
            </li>
            <li>
              <code>selected</code>: <code>T[]</code>. The controlled selection you own. Default
              <code>[]</code>.
            </li>
            <li>
              <code>minSelected</code>: <code>number</code>. Deselection floor. Default
              <code>0</code>.
            </li>
            <li>
              <code>resettable</code>: <code>boolean</code>. Renders the opt-in reset item. Default
              <code>false</code>.
            </li>
            <li>
              <code>label</code>: <code>string</code>. Trigger text, the trigger's accessible name,
              and the menu's label.
            </li>
            <li>
              <code>variant</code>, <code>size</code>, <code>disabled</code>,
              <code>placement</code>: forwarded to the trigger button and the menu.
            </li>
            <li>
              <code>ui</code>: <code>HellUiInput&lt;HellMultiSelectMenuButtonPart&gt;</code> where
              <code
                >HellMultiSelectMenuButtonPart = 'root' | 'trigger' | 'count'</code
              >. Exports <code>HellMultiSelectMenuButtonUi</code>.
            </li>
            <li>
              <code>(selectedChange)</code>: emits the whole next <code>T[]</code> on every toggle.
              Nothing is emitted on first render.
            </li>
            <li>
              <code>(reset)</code>: emitted when the reset item is activated. No
              <code>selectedChange</code> accompanies it — you restore your own defaults.
            </li>
          </ul>
        </li>
        <li>
          <code>provideHellLabels(HELL_MULTI_SELECT_MENU_BUTTON_LABELS, overrides)</code> — override the reset item
          label (<code>HellMultiSelectMenuButtonLabels</code>) for an injector scope. Exposed token:
          <code>HELL_MULTI_SELECT_MENU_BUTTON_LABELS</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Each option is a <code>menuitemcheckbox</code> with its <code>aria-checked</code> state,
          so current choices are perceivable to screen readers; the menu carries the trigger label
          as its accessible name.
        </li>
        <li>
          Full menu-pattern keyboard support comes from the composed menu — arrow-key roving,
          Home/End, typeahead, and Escape to close — while toggling a checkbox keeps the menu open.
        </li>
        <li>
          The count badge is decorative (<code>aria-hidden</code>); the trigger's accessible name is
          its <code>label</code>, and the checked state on each item is the authoritative signal.
        </li>
        <li>Options held at the <code>minSelected</code> floor use native <code>disabled</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Own the <code>selected</code> array and set it from <code>(selectedChange)</code>.</li>
        <li>Use <code>minSelected</code> when an empty selection would be a broken state.</li>
        <li>Bind it to TanStack <code>columnVisibility</code> and persist the map in your own storage.</li>
        <li>Give the trigger a clear <code>label</code> — it is the accessible name.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mutate the array you passed to <code>selected</code>; treat every emission as a new array.</li>
        <li>Don't reach into the menu to force it closed on toggle — staying open is the point.</li>
        <li>Don't expect a <code>selectedChange</code> from the reset item; handle <code>(reset)</code> yourself.</li>
      </ul>
    </article>
  `,
})
export class MultiSelectMenuButtonPage {
  protected readonly basicExampleCode = multiSelectMenuButtonBasicExampleCodeRaw;
  protected readonly tanStackExampleCode = multiSelectMenuButtonTanStackExampleCodeRaw;

  protected readonly bindingRecipe = `<hell-multi-select-menu-button
  label="Columns"
  [options]="columnOptions()"
  [selected]="visibleColumns()"
  [minSelected]="1"
  resettable
  (selectedChange)="visibleColumns.set($event)"
  (reset)="visibleColumns.set(defaultColumns)"
/>`;
}
