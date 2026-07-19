import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { CodeBlock } from '../../../shared/code-block';
import { PageHeader } from '../../../shared/page-header';
import { SearchBasicExample } from './examples/basic.example';
import searchBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SearchEmptyStateExample } from './examples/empty-state.example';
import searchEmptyStateExampleCodeRaw from './examples/empty-state.example.ts?raw' with {
  loader: 'text',
};
import { SearchStylingExample } from './examples/styling.example';
import searchStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { SearchWithTableFilterToolbarExample } from './examples/with-table-filter-toolbar.example';
import searchWithTableFilterToolbarExampleCodeRaw from './examples/with-table-filter-toolbar.example.ts?raw' with {
  loader: 'text',
};

const SEARCH_RESOURCE_CODE = `import { signal } from '@angular/core';
import { hellSearchResource } from '@hell-ui/angular/core';

readonly query = signal('');
readonly countries = signal<readonly Country[]>(initialCountries);

// Local collections rerank when either signal changes.
readonly countrySearch = hellSearchResource({
  query: this.query,
  items: this.countries,
  fields: [
    { weight: 3, get: country => country.name },
    { weight: 1, get: country => country.code },
  ],
});

// Async sources receive an AbortSignal; newer queries supersede older work.
readonly peopleSearch = hellSearchResource<Person>({
  query: this.query,
  source: ({ query, signal }) => this.peopleApi.search({ query, signal }),
  debounce: 120,
});`;

@Component({
  selector: 'hd-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    CodeBlock,
    SearchBasicExample,
    SearchEmptyStateExample,
    SearchStylingExample,
    SearchWithTableFilterToolbarExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Search"
        icon="faSolidMagnifyingGlass"
        category="Styled primitive"
        importPath="@hell-ui/angular/input"
      >
        Wires a search input to a clear affordance and an empty-state signal — you own the input,
        the results, and the filtering logic.
      </hd-page-header>
      <p>
        <code>hellSearch</code> and <code>hellSearchClear</code> are a small directive pair built
        on <code>NgpSearch</code> / <code>NgpSearchClear</code> from ng-primitives.
        <code>hellSearch</code> marks the region and tracks whichever <code>hellInput</code> is
        registered inside it — automatically, through the same optional injection
        <code>HellInput</code> already uses for form-field wiring, no extra plumbing required.
        <code>hellSearchClear</code> is a plain button that resets that input's value and dispatches
        a native <code>input</code> event, so whatever you bound to <code>(input)</code> updates the
        same way a manual clear would.
      </p>
      <p>
        Use it for any local, client-side filter: a table toolbar, a list of already-loaded
        options, a settings search. It has no ranking, no keyboard navigation, and no result
        popover — it is exactly the input-plus-clear wiring, nothing more. For a ranked
        command-palette experience with its own overlay and keyboard model, use
        <code>hell-omnibar</code> instead.
      </p>

      <h2>Search Resource</h2>
      <p>
        When ranking or asynchronous retrieval should be reusable outside one renderer, create a
        UI-independent <code>hellSearchResource</code> from
        <code>&#64;hell-ui/angular/core</code>. It exposes the caller-owned <code>query</code> plus
        <code>items</code>, <code>status</code>, and <code>error</code> signals. Local resources use
        the configured <code>provideHellSearchRanker</code> strategy; asynchronous resources own
        debounce, cancellation, and stale-result protection while forwarding an
        <code>AbortSignal</code> to the source.
      </p>
      <hd-code-block [code]="searchResourceCode" />
      <ul>
        <li><code>refresh()</code> reruns the current query immediately.</li>
        <li>
          <code>cancel()</code> stops scheduled or active work while preserving the last settled
          items.
        </li>
        <li>
          <code>clearResults()</code> cancels work and empties items, status, and error while
          leaving the caller-owned query signal untouched. Local collection updates keep the
          resource cleared; a later query change or explicit <code>refresh()</code> reactivates
          either resource mode.
        </li>
        <li>
          <code>reset()</code> is <code>clearResults()</code> plus setting the caller-owned query
          signal to <code>''</code> — the only resource operation that writes the query — without
          dispatching an empty-query request.
        </li>
      </ul>
      <p>
        The resource owns data lifecycle only. Compose its signals with <code>hellSearch</code>,
        Select, Combobox, Omnibar, a table, or application-specific markup; each renderer keeps its
        own keyboard and accessibility semantics.
      </p>

      <h2>Basic</h2>
      <p>
        A search field wrapping a <code>hellInput</code> and a <code>hellSearchClear</code> button,
        filtering a plain in-memory list. The clear button works immediately — no wiring beyond
        placing it inside the same <code>hellSearch</code> region.
      </p>
      <hd-example-tabs [code]="searchBasicExampleCode">
        <app-search-basic-example />
      </hd-example-tabs>

      <h2>Empty state</h2>
      <p>
        Both <code>hellSearch</code> and <code>hellSearchClear</code> reflect the input's empty
        state through a <code>data-empty</code> attribute, so you can hide the clear affordance
        until there is something to clear — no derived signal needed. Pressing
        <kbd>Escape</kbd> inside the field clears it the same way the button does.
      </p>
      <hd-example-tabs [code]="searchEmptyStateExampleCode">
        <app-search-empty-state-example />
      </hd-example-tabs>

      <h2>With table filter toolbar</h2>
      <p>
        A realistic filter bar: <code>hellSearch</code> filters an invoice table by customer or
        invoice number, and a compact <code>hellListbox</code> filters the same rows by status.
        Both controls stay in sync through one <code>computed</code> — the table only ever renders
        the filtered result, and an empty match shows a message instead of an empty grid.
      </p>
      <hd-example-tabs [code]="searchWithTableFilterToolbarExampleCode">
        <app-search-with-table-filter-toolbar-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>HellSearch</code> and <code>HellSearchClear</code> are separate Part Style Map
        owners, each with exactly one Public Part, <code>root</code> — their own host element. Pass
        <code>ui="..."</code> as shorthand to refine either root, or
        <code>[ui]="&#123; root: '...' &#125;"</code> for the equivalent explicit map. A Part Style
        Map only reaches the DOM its own directive owns: the search wrapper's <code>ui</code> never
        reaches into the input or the clear button, and vice versa — style each part where it is
        declared.
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
            <td><code>HellSearch</code></td>
            <td><code>root</code></td>
            <td>The search region host — layout, spacing, background, border around the input and clear control.</td>
          </tr>
          <tr>
            <td><code>HellSearchClear</code></td>
            <td><code>root</code></td>
            <td>The clear <code>&lt;button&gt;</code> host — color, shape, and visibility (for example hiding it via <code>data-empty</code>).</td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines both roots plus the input it wraps: a bordered, padded
        <code>hellSearch</code> shell using <code>bg-hell-surface-subtle</code> and
        <code>rounded-hell-lg</code>, a pill-shaped <code>hellInput</code>, and a pill-shaped,
        danger-colored <code>hellSearchClear</code> button.
      </p>
      <hd-example-tabs [code]="searchStylingExampleCode">
        <app-search-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellSearch</code> (<code>HellSearch</code>): marks the search region root. Built on
          <code>NgpSearch</code>. Tracks the registered <code>hellInput</code> descendant and sets
          <code>data-empty</code> on itself when that input's value is empty. Listens for
          <code>Escape</code> inside the region and clears the input.
        </li>
        <li>
          <code>hellSearchClear</code> (<code>HellSearchClear</code>, selector
          <code>button[hellSearchClear]</code>): built on <code>NgpSearchClear</code>. Sets the
          registered input's value to <code>''</code> and dispatches a native
          <code>input</code> event on click. Hosts default to
          <code>type="button"</code> and <code>tabindex="-1"</code> (it is a pointer-only quick
          action; <code>Escape</code> already clears from the keyboard) and mirror the region's
          <code>data-empty</code> state.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> on
          <code>hellSearch</code>, <code>HellUiInput&lt;'root'&gt;</code> on
          <code>hellSearchClear</code> — a shorthand class string or a
          <code>&#123; root: string &#125;</code> map for each directive's own root.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Give the input inside <code>hellSearch</code> an accessible name — either
          <code>aria-label</code> or a visible <code>hellFieldLabel</code> — since
          <code>type="search"</code> alone does not guarantee one across assistive technologies.
        </li>
        <li>
          <code>hellSearchClear</code> renders with <code>tabindex="-1"</code> — it stays a
          pointer/mouse quick action outside the Tab order, since <kbd>Escape</kbd> already clears
          the field from the keyboard without a dedicated Tab stop. Always give it an
          <code>aria-label</code> such as "Clear search" since its content may be icon-only.
        </li>
        <li>
          Escape-to-clear only fires while focus is inside the <code>hellSearch</code> region, so
          it never intercepts <kbd>Escape</kbd> meant for an enclosing dialog or popover.
        </li>
        <li>
          For filtered results, announce the outcome in text near the list (a result count or an
          empty-state message) — <code>hellSearch</code> does not manage live-region announcements
          for you.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use native <code>type="search"</code> inputs for simple, local, client-side filtering.</li>
        <li>Place <code>hellSearchClear</code> inside the same <code>hellSearch</code> region as the input it clears.</li>
        <li>Give <code>hellSearchClear</code> an explicit <code>aria-label</code>.</li>
        <li>Pair it with a listbox, table, or other rendered list that reacts to the same query signal.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't rebuild omnibar-style keyboard navigation or ranking on top of this primitive — use <code>hell-omnibar</code> instead.</li>
        <li>Don't rely on <code>hellSearchClear</code> alone for keyboard users; <kbd>Escape</kbd> is the keyboard path.</li>
        <li>Don't put more than one <code>hellInput</code> inside a single <code>hellSearch</code> region — each registration replaces the previous one, so only the last-registered input is tracked.</li>
      </ul>
    </article>
  `,
})
export class SearchPage {
  protected readonly searchResourceCode = SEARCH_RESOURCE_CODE;
  protected readonly searchBasicExampleCode = searchBasicExampleCodeRaw;
  protected readonly searchEmptyStateExampleCode = searchEmptyStateExampleCodeRaw;
  protected readonly searchStylingExampleCode = searchStylingExampleCodeRaw;
  protected readonly searchWithTableFilterToolbarExampleCode =
    searchWithTableFilterToolbarExampleCodeRaw;
}
