import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlock } from '../../../shared/code-block';
import { ExampleTabs } from '../../../shared/example-tabs';
import { OmnibarAsyncSearchExample } from './examples/async-search.example';
import omnibarAsyncSearchExampleCodeRaw from './examples/async-search.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-omnibar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlock, ExampleTabs, OmnibarAsyncSearchExample],
  template: `
    <article class="hd-prose">
      <h1>Omnibar</h1>
      <p>
        Command-palette searchbox built from the command palette service, search primitive, search
        service, and listbox wiring. It can call any async backend function; local object-search ranking
        and the default global hotkey behavior are intentionally starter/default only, with optional
        adapters for production-quality search and hotkey orchestration.
      </p>

      <h2>Async search</h2>
      <hd-example-tabs [code]="omnibarAsyncSearchExampleCode">
        <app-omnibar-async-search-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>searchItems</code>: starter local object collection ranked by <code>HellSearchService</code>; replace for production search quality.</li>
        <li><code>searchSource</code>: async backend-powered function. Receives <code>query</code>, <code>limit</code>, <code>params</code>, and <code>signal</code>.</li>
        <li><code>searchFields</code>: weighted attributes used for ranking returned items.</li>
        <li><code>provideHellSearchRanker</code>: replace local ranking with Fuse.js, MiniSearch, FlexSearch, or your own adapter.</li>
        <li><code>hotkey</code>: optional global shortcut to open the panel, e.g. <code>mod+k</code>; treat as starter convenience and swap for scoped open logic when needed.</li>
        <li><code>searchLimit</code>, <code>searchParams</code>, <code>searchDebounce</code>, <code>loadingRows</code>.</li>
        <li><code>loadingTemplate</code>: custom loading body; receives <code>{{ '{' }} rows, message {{ '}' }}</code> while the omnibar keeps the outer status wrapper.</li>
        <li><code>value</code>: model input for the draft query.</li>
        <li><code>submit</code>, <code>openChange</code>, <code>searchResultsChange</code>, <code>searchError</code>.</li>
        <li>Slots: <code>hellOmnibarLeading</code>, <code>hellOmnibarTrailing</code>, <code>hellOmnibarActions</code>, groups, items, chips, and footer content.</li>
        <li>
          Panel styling: use <code>data-slot="panel"</code> and theme via
          <code>--hell-omnibar-panel-bg</code>,
          <code>--hell-omnibar-panel-radius</code>,
          <code>--hell-omnibar-panel-shadow</code>, and
          <code>--hell-omnibar-panel-max-height</code>.
        </li>
      </ul>

      <h2>Ranker adapter examples</h2>
      <p>
        For local-only ranking, keep <code>HellSearchService</code> defaults. For richer ranking (typos,
        stemming, fuzzy matchers, or indexes), adapt an external engine in a ranker adapter.
      </p>
      <hd-code-block [code]="rankerAdapterCode" />

      <h2>Do</h2>
      <ul>
        <li>Debounce the search work, not opening and closing the panel.</li>
        <li>Return backend results generically; avoid coupling the component to a specific API shape.</li>
        <li>Use <code>searchSource</code> + <code>provideHellSearchRanker</code> for production scopes and scoped/search adapters that need domain-specific ranking, typo handling, indexing, or worker-backed search.</li>
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
  protected readonly rankerAdapterCode = `const searchFields = fields ?? [];

provideHellSearchRanker((items, request) => {
  // Pseudocode: shape for Fuse.js / MiniSearch / FlexSearch adapters.
  const keys = searchFields
    .map((field) => field.name)
    .filter((name): name is string => typeof name === 'string');

  const ranked = runExternalSearchEngine({
    items,
    query: request.query,
    keys,
    limit: request.limit,
  });

  return ranked.map((result) => ({ item: result.item, score: result.score }));
});`;
}
