import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { SearchBasicExample } from './examples/basic.example';
import searchBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, SearchBasicExample],
  template: `
    <article class="hd-prose">
      <h1>Search</h1>
      <p>
        Small wrapper directives around the ng-primitives search pattern. Use them when you need a
        plain search region with a clear control. For ranked command-palette search, use
        <code>hell-omnibar</code>.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="searchBasicExampleCode">
        <app-search-basic-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>hellSearch</code>: marks the search root.</li>
        <li><code>hellSearchClear</code>: native button clear control that composes with the search root.</li>
        <li><code>unstyled</code>: opt out of host styling.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use native <code>type="search"</code> inputs for simple local filtering.</li>
        <li>Keep clear buttons explicit when query state is controlled by a signal.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't rebuild omnibar keyboard navigation on top of this primitive.</li>
      </ul>
    </article>
  `,
})
export class SearchPage {
  protected readonly searchBasicExampleCode = searchBasicExampleCodeRaw;
}
