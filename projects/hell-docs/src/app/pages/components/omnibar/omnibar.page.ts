import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { OmnibarAsyncSearchExample } from './examples/async-search.example';
import omnibarAsyncSearchExampleCodeRaw from './examples/async-search.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-omnibar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, OmnibarAsyncSearchExample],
  template: `
    <article class="hd-prose">
      <h1>Omnibar</h1>
      <p>
        Command-palette searchbox built from the command palette service, search primitive, search
        service, and listbox wiring. It can rank local items or call any async backend function.
      </p>

      <h2>Async search</h2>
      <hd-example-tabs [code]="omnibarAsyncSearchExampleCode">
        <app-omnibar-async-search-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>searchItems</code>: local collection ranked by <code>HellSearchService</code>.</li>
        <li><code>searchSource</code>: async backend-powered function. Receives <code>query</code>, <code>limit</code>, <code>params</code>, and <code>signal</code>.</li>
        <li><code>searchFields</code>: weighted attributes used for ranking returned items.</li>
        <li><code>searchLimit</code>, <code>searchParams</code>, <code>searchDebounce</code>, <code>loadingRows</code>.</li>
        <li><code>value</code>: model input for the draft query.</li>
        <li><code>submit</code>, <code>openChange</code>, <code>searchResultsChange</code>, <code>searchError</code>.</li>
        <li>Slots: <code>hellOmnibarLeading</code>, <code>hellOmnibarTrailing</code>, <code>hellOmnibarActions</code>, groups, items, chips, and footer content.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Debounce the search work, not opening and closing the panel.</li>
        <li>Return backend results generically; avoid coupling the component to a specific API shape.</li>
        <li>Use projected item templates so results can match the domain.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't encode filter syntax in the text input; commit filters as structured state.</li>
      </ul>
    </article>
  `,
})
export class OmnibarPage {
  protected readonly omnibarAsyncSearchExampleCode = omnibarAsyncSearchExampleCodeRaw;
}
