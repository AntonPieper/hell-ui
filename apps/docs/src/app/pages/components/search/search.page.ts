import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { SearchBasicExample } from './examples/basic.example';
import searchBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { SearchStylingExample } from './examples/styling.example';
import searchStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, SearchBasicExample, SearchStylingExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Search"
        icon="faSolidMagnifyingGlass"
        category="Styled primitive"
        importPath="@hell-ui/angular/search"
        stylesPath="@hell-ui/angular/search/styles.css"
      >
        A small search pattern: input wiring, a clear affordance, and result-region hooks — bring your own ranking.
      </hd-page-header>
      <p>
        Small wrapper directives around the ng-primitives search pattern. Use them when you need a
        plain search region with a clear control. For ranked command-palette search, use
        <code>hell-omnibar</code>.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="searchBasicExampleCode">
        <app-search-basic-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        The search wrapper, input, and clear affordance each keep their own narrow <code>ui</code> contract. Refine the part you own instead of styling through descendant selectors.
      </p>
      <hd-example-tabs [code]="searchStylingExampleCode">
        <app-search-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>hellSearch</code>: marks the search root.</li>
        <li><code>hellSearchClear</code>: native button clear control that composes with the search root.</li>
        <li><code>ui</code>: string or <code>{{ '{' }} root: string {{ '}' }}</code> map.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Use <code>type="search"</code> with an accessible name; the clear button is labeled and keyboard-reachable.</li>
        <li>Announce result counts in text near the list.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use native <code>type="search"</code> inputs for simple local filtering.</li>
        <li>Keep clear buttons explicit when query state is controlled by a signal.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't rebuild omnibar keyboard navigation on top of this primitive.</li>
      </ul>
    </article>
  `,
})
export class SearchPage {
  protected readonly searchBasicExampleCode = searchBasicExampleCodeRaw;
  protected readonly searchStylingExampleCode = searchStylingExampleCodeRaw;
}
