import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { FilterBarServerDispatchExample } from './examples/server-dispatch.example';
import { FilterBarTanStackExample } from './examples/tanstack.example';
import filterBarServerDispatchExampleCodeRaw from './examples/server-dispatch.example.ts?raw' with {
  loader: 'text',
};
import filterBarTanStackExampleCodeRaw from './examples/tanstack.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CodeBlock,
    ExampleTabs,
    PageHeader,
    FilterBarServerDispatchExample,
    FilterBarTanStackExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Filter Bar"
        icon="faSolidFilter"
        category="Composite"
        importPath="@hell-ui/angular/filter-bar"
        stylesPath="@hell-ui/angular/filter-bar/styles.css"
      >
        A keyboard-first controlled filter surface: declare fields, compose typed tokens, and bind
        the complete serializable value to a table, URL, store, or server request.
      </hd-page-header>

      <p>
        <code>hell-filter-bar</code> supports arbitrary <code>text</code>, fixed
        <code>options</code>, async <code>entity</code>, and structured <code>dateRange</code>
        fields, plus unstructured search through the reserved <code>$text</code> key. It owns only
        the interaction — the app owns the token array and round-trips
        <code>(valueChange)</code>. Every token has the stable shape
        <code>{{ '{' }} key, operator: 'eq', value {{ '}' }}</code>, so persistence and request
        dispatch need no UI-specific translation layer.
      </p>

      <h2>TanStack Filter Controls recipe</h2>
      <p>
        This example places the Filter Bar in a real Table Shell toolbar. Free text maps to
        TanStack's global filter; declared field tokens are grouped by key into one
        <code>columnFilters</code> entry per column. Values within a multiple field use OR semantics,
        while TanStack combines different columns with AND semantics. The bar does not import
        TanStack or own its state — this small adapter remains in application code, preserving
        TanStack ownership.
      </p>
      <hd-example-tabs [code]="exampleCode">
        <app-filter-bar-tanstack-example />
      </hd-example-tabs>

      <h2>Server-dispatch recipe</h2>
      <p>
        Entity lookup and result fetching are separate application concerns. This example gives
        the Owner field an abortable <code>HellSearchSource</code>, then sends the complete
        controlled token array — including the structured Created range — as one simulated API
        request. Type <code>error</code> in the Owner editor to exercise
        <code>(searchError)</code>.
      </p>
      <hd-example-tabs [code]="serverDispatchExampleCode">
        <app-filter-bar-server-dispatch-example />
      </hd-example-tabs>

      <h2>Field and value contracts</h2>
      <hd-code-block [code]="bindingCode" />
      <ul>
        <li>
          <code>kind: 'text'</code> accepts a non-empty string. <code>kind: 'options'</code>
          commits only a declared <code>{{ '{' }} value, label, disabled? {{ '}' }}</code> option.
        </li>
        <li>
          <code>kind: 'entity'</code> accepts a <code>HellSearchSource</code> returning stable
          <code>{{ '{' }} id, label, disabled? {{ '}' }}</code> options. Its committed value keeps
          both the backend id and human-readable label so rehydrated tokens need no follow-up lookup.
          Free-typed drafts never commit as entities. Set per-field <code>debounceMs</code> and
          <code>limit</code> for the source; the editor owns loading, empty, and error status rows.
        </li>
        <li>
          <code>kind: 'dateRange'</code> commits
          <code>{{ '{' }} kind: 'dateRange', from, to {{ '}' }}</code> with nullable ISO dates.
          Open-ended ranges are valid; optional field <code>min</code>/<code>max</code> bounds apply
          to both date inputs. These are local calendar-date strings (<code>YYYY-MM-DD</code>), not
          UTC timestamps; translate them only at your server boundary if that API requires it.
        </li>
        <li>
          Fields are single-use by default. Set <code>multiple: true</code> to keep the field
          available and, for options and entity fields, keep its create editor open for successive
          tokens.
        </li>
        <li>
          The reserved <code>$text</code> token is always a singleton. Committing or live-updating
          new free text replaces the existing <code>$text</code> value instead of appending another
          token.
        </li>
        <li>
          <code>freeTextDebounceMs</code> opts into debounced live free text; each emission still
          contains the whole controlled value. The bar owns no backend or persistence; entity
          editors only invoke the consumer-owned <code>search</code> seam.
        </li>
      </ul>

      <h2>Keyboard model</h2>
      <ul>
        <li>
          Typing opens field suggestions. A visible “Search for …” row is always present and one
          row is always highlighted, so Enter's result is visible before it happens.
        </li>
        <li>
          A highlighted field opens its editor; a highlighted free-text row creates a
          <code>$text</code> token. Typing <code>status:</code> is an accelerator into the same
          Status editor — not a second parser or state machine.
        </li>
        <li>
          Escape consumes one layer: editor, then suggestions, then input text. It never removes
          filters. Backspace in an empty picker removes only the last token; inside an editor it
          edits the draft.
        </li>
        <li>
          Chips use the Chip Set's roving arrows and Delete/Backspace removal. Enter or Space edits
          a token in the same per-kind editor used for creation; Escape discards the edit and
          restores focus.
        </li>
      </ul>

      <h2>Styling</h2>
      <p>
        Refine the flat Public Parts through <code>ui</code>; composed button, chip, combobox, and
        popover, Date Input, and Date Picker defaults ship through
        <code>@hell-ui/angular/filter-bar/styles.css</code>.
      </p>
      <table class="hd-doc-table">
        <thead><tr><th>Part</th><th>Purpose</th></tr></thead>
        <tbody>
          @for (part of parts; track part.name) {
            <tr><td><code>{{ part.name }}</code></td><td>{{ part.purpose }}</td></tr>
          }
        </tbody>
      </table>

      <h2>API</h2>
      <ul>
        <li><code>fields</code>: required <code>HellFilterField[]</code>.</li>
        <li><code>value</code>: controlled <code>HellFilterToken[]</code>; default <code>[]</code>.</li>
        <li><code>(valueChange)</code>: the complete next token array; never emitted on first render.</li>
        <li>
          <code>(searchError)</code>: the failed entity field, query, and original error. Aborted
          superseded searches do not emit.
        </li>
        <li>
          <code>entityDebounceMs</code>: default entity search delay; default <code>200</code>.
          Override it per entity field with <code>debounceMs</code>.
        </li>
        <li><code>disabled</code>, <code>placeholder</code>, <code>aria-label</code>, and <code>ui</code>.</li>
        <li>
          <code>provideHellLabels(HELL_FILTER_BAR_LABELS, overrides)</code> localizes the input label; clear-all
          and apply actions; entity loading, empty, and error states; range input names and display;
          free-text field, suggestion, and token copy; token edit labels; and added, updated, removed,
          and cleared live announcements.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The field, options, and entity pickers delegate the WAI-ARIA combobox/listbox pattern,
          including <code>aria-expanded</code>, <code>aria-controls</code>, and active-descendant
          focus. Loading, empty, and failed entity searches remain announced status states.
        </li>
        <li>
          Tokens form one Chip Set tab stop. Arrow Left/Right and Home/End move between tokens;
          Enter/Space edits; Delete/Backspace removes; Arrow Right past the final token returns to
          the picker.
        </li>
        <li>
          Add, update, remove, and clear operations are announced through a polite live region.
          Localize those messages with <code>HELL_FILTER_BAR_LABELS</code> together with the
          visible built-in copy.
        </li>
        <li>
          Give every bar an app-specific accessible name with <code>aria-label</code> when the
          default “Filters” label is not sufficiently descriptive.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Keep the complete token array controlled and replace it from <code>(valueChange)</code>.</li>
        <li>Use stable, unique field keys that also map cleanly to your table or request schema.</li>
        <li>Use <code>multiple: true</code> only when values within that field have a clear OR meaning.</li>
        <li>Keep URL, storage, TanStack, and server adapters outside the component.</li>
        <li>Return stable entity ids and labels, and honor the source's abort signal.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't mutate the supplied token array in place; emit and store the complete next value.</li>
        <li>Don't declare a field with the reserved <code>$text</code> key.</li>
        <li>Don't use free text when the value must be one of a fixed set; declare an options field.</li>
        <li>Don't serialize date ranges through <code>Date.toISOString()</code>; preserve local dates.</li>
        <li>Don't target portalled descendants with private selectors; refine the documented parts.</li>
      </ul>
    </article>
  `,
})
export class FilterBarPage {
  protected readonly exampleCode = filterBarTanStackExampleCodeRaw;
  protected readonly serverDispatchExampleCode = filterBarServerDispatchExampleCodeRaw;
  protected readonly bindingCode = `readonly fields: readonly HellFilterField[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  {
    key: 'status',
    label: 'Status',
    kind: 'options',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Invited', label: 'Invited' },
    ],
  },
];

<hell-filter-bar
  aria-label="People filters"
  [fields]="fields"
  [value]="filters()"
  (valueChange)="filters.set($event)"
/>`;

  protected readonly parts = [
    { name: 'root', purpose: 'Composite host around the token and editor zones.' },
    { name: 'tokens', purpose: 'Chip Set containing the controlled tokens.' },
    { name: 'token', purpose: 'One editable/removable chip.' },
    { name: 'tokenLabel', purpose: 'The token edit trigger and visible label.' },
    { name: 'control', purpose: 'Field picker or create-editor control.' },
    { name: 'prefix', purpose: 'The active field label inside an editor.' },
    { name: 'input', purpose: 'Picker or shared editor input.' },
    { name: 'panel', purpose: 'Combobox suggestion or options surface.' },
    { name: 'option', purpose: 'One field, free-text, or value row.' },
    { name: 'editor', purpose: 'Shared per-kind editor mounted for create or edit.' },
    { name: 'status', purpose: 'Entity loading, empty, or error status row.' },
    { name: 'dateRange', purpose: 'From/to Date Input pair inside the range editor.' },
    { name: 'dateRangeActions', purpose: 'Commit actions for the date-range editor.' },
    { name: 'clear', purpose: 'Clear-all action, shown when tokens exist.' },
    { name: 'live', purpose: 'Polite add/update/remove/clear announcement region.' },
  ] as const;
}
