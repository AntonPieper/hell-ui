import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { PaginationBasicExample } from './examples/basic.example';
import paginationBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { PaginationPreviousNextExample } from './examples/previous-next.example';
import paginationPreviousNextExampleCodeRaw from './examples/previous-next.example.ts?raw' with {
  loader: 'text',
};
import { PaginationJumpExample } from './examples/jump.example';
import paginationJumpExampleCodeRaw from './examples/jump.example.ts?raw' with {
  loader: 'text',
};
import { PaginationComposedExample } from './examples/composed.example';
import paginationComposedExampleCodeRaw from './examples/composed.example.ts?raw' with {
  loader: 'text',
};
import { PaginationWithTableExample } from './examples/with-table.example';
import paginationWithTableExampleCodeRaw from './examples/with-table.example.ts?raw' with {
  loader: 'text',
};
import { PaginationStylingExample } from './examples/styling.example';
import paginationStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PaginationBasicExample,
    PaginationPreviousNextExample,
    PaginationJumpExample,
    PaginationComposedExample,
    PaginationWithTableExample,
    PaginationStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Pagination"
        icon="faSolidAnglesRight"
        category="Mixed entry point"
        importPath="@hell-ui/angular/pagination"
        stylesPath="@hell-ui/angular/pagination/styles.css"
      >
        Page navigation as a composable button directive or a ready-made numbered strip, with
        compact previous/next and page-jump forms as documented recipes.
      </hd-page-header>
      <p>
        Pagination is a <code>ng-primitives/pagination</code>-backed entry point with two ways in.
        Compose the <code>[hellPagination]</code> directive with
        <code>hellPageLink</code> controls on your own <code>&lt;button&gt;</code> or
        <code>&lt;a&gt;</code> elements when you need custom markup or non-standard controls in
        between — each <code>hellPageLink</code> targets a boundary
        (<code>first</code>/<code>previous</code>/<code>next</code>/<code>last</code>) or a page
        number. Or drop in <code>&lt;hell-pagination&gt;</code>, a ready-made strip that renders
        the whole first / previous / numbered window / next / last sequence and emits
        <code>(pageChange)</code> with the new 1-based page number. Compact previous/next and
        page-jump layouts are recipes composed from the same primitives.
      </p>
      <p>
        Reach for pagination whenever a table, list, or search result set is too large to render
        at once and the total count is meaningful to the user. All labels — including the
        per-page accessible names — go through the <code>HellPaginationLabels</code> Label
        Contract, so a dense admin table and a public-facing results page can each localize
        pagination independently.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs
        [code]="paginationBasicExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-basic-example />
      </hd-example-tabs>

      <h2>Previous / next recipe</h2>
      <p>
        Compose previous/next controls around your own live status text when a numbered window
        would be noisy but users still need clear position and disabled boundary states. The
        recipe is <code>[hellPagination]</code> + two <code>hellPageLink</code> buttons + an
        <code>aria-live</code> span you own — no strip mode required.
      </p>
      <hd-example-tabs
        [code]="paginationPreviousNextExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-previous-next-example />
      </hd-example-tabs>

      <h2>Page-jump recipe</h2>
      <p>
        For large page sets where a numbered window doesn't scale, compose previous/next
        controls around a native <code>hellNativeSelect</code> you own, keeping the current page
        and total page count keyboard- and screen-reader-reachable in a compact footprint.
      </p>
      <hd-example-tabs
        [code]="paginationJumpExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-jump-example />
      </hd-example-tabs>

      <h2>Composing your own layout</h2>
      <p>
        Skip <code>&lt;hell-pagination&gt;</code> and compose the controls directly when you
        need custom markup — text labels instead of icons, a different control order, or extra
        elements interleaved with the controls. <code>[hellPagination]</code> provides the shared
        page/pageCount/disabled state; each <code>hellPageLink</code> reads it and
        exposes its own single <code>root</code> part.
      </p>
      <hd-example-tabs [code]="paginationComposedExampleCode">
        <app-pagination-composed-example />
      </hd-example-tabs>

      <h2>With table and page size</h2>
      <p>
        A common shape in dense business apps: a table body sliced to the active page, a
        <code>hellNativeSelect</code> for rows-per-page, and the compact previous/next recipe
        anchoring the row. Changing the page size resets to page one so the slice stays valid.
      </p>
      <hd-example-tabs [code]="paginationWithTableExampleCode">
        <app-pagination-with-table-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every module in this entry point takes a <code>ui</code> Part Style Map. Pass a plain
        string to refine the module's default part — <code>root</code> on every module except
        <code>HellPaginationStrip</code>, which owns more anatomy — or an explicit
        <code>HellUi&lt;Part&gt;</code> map to target named parts. Refinements merge on top of the
        default recipe through Hell's Tailwind merge, so they win deterministically over the
        classes they conflict with.
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
            <td><code>HellPagination</code></td>
            <td><code>root</code></td>
            <td>The <code>[hellPagination]</code> host — layout of composed controls.</td>
          </tr>
          <tr>
            <td><code>HellPageLink</code></td>
            <td><code>root</code></td>
            <td>Every first/previous/next/last/numbered button/anchor host.</td>
          </tr>
          <tr>
            <td rowspan="3"><code>HellPaginationStrip</code></td>
            <td><code>root</code></td>
            <td>The <code>&lt;hell-pagination&gt;</code> host — gap and wrapping of the whole strip.</td>
          </tr>
          <tr>
            <td><code>control</code></td>
            <td>Forwarded to every rendered first/prev/numbered/next/last control's <code>root</code>.</td>
          </tr>
          <tr>
            <td><code>controlGlyph</code></td>
            <td>The chevron glyph inside each control.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="paginationStylingExampleCode">
        <app-pagination-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>HellPagination</code> (<code>[hellPagination]</code>)</h3>
      <ul>
        <li><code>page</code>: <code>number</code>. 1-based current page, two-way bindable via <code>(pageChange)</code>.</li>
        <li><code>pageCount</code>: <code>number</code>. Total number of pages.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables every composed control's activation.</li>
        <li><code>pageChange</code>: <code>EventEmitter&lt;number&gt;</code>. Emits the new 1-based page.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — refines the single <code>root</code> part.</li>
      </ul>
      <h3><code>HellPageLink</code></h3>
      <ul>
        <li>Selectors: <code>button[hellPageLink]</code>, <code>a[hellPageLink]</code>.</li>
        <li>
          <code>hellPageLink</code>: <code>HellPageLinkTarget</code> —
          <code>'first' | 'previous' | 'next' | 'last' | number</code>. The navigation target:
          a boundary keyword or a 1-based page number. Boundary controls disable themselves at the
          matching range edge; numbered controls set <code>aria-current</code>/<code>data-selected</code>
          when they equal the current page.
        </li>
        <li><code>disabled</code>: <code>boolean</code>. Explicit disable in addition to the boundary state derived from <code>page</code>/<code>pageCount</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code> — refines the single <code>root</code> part.</li>
        <li>Exported type: <code>HellPageLinkTarget</code>.</li>
      </ul>
      <h3><code>HellPaginationStrip</code> (<code>&lt;hell-pagination&gt;</code>)</h3>
      <ul>
        <li><code>page</code>: <code>number</code>. 1-based current page, two-way bindable via <code>(pageChange)</code>.</li>
        <li><code>pageCount</code>: <code>number</code>. Total number of pages.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables every rendered control.</li>
        <li><code>siblingCount</code>: <code>number</code>. Numbered buttons rendered on each side of the current page. Default <code>2</code>.</li>
        <li><code>pageChange</code>: <code>EventEmitter&lt;number&gt;</code>. Emits the new 1-based page.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellPaginationStripPart&gt;</code> — a shorthand
          string refining <code>root</code>, or a map over <code>root</code>,
          <code>control</code>, and <code>controlGlyph</code>.
        </li>
        <li>Exported types: <code>HellPaginationStripPart</code>, <code>HellPaginationStripUi</code>.</li>
      </ul>
      <h3>Labels</h3>
      <ul>
        <li>
          <code>provideHellLabels(HELL_PAGINATION_LABELS, overrides)</code>:
          overrides any subset of <code>navigation</code>, <code>firstPage</code>,
          <code>previousPage</code>, <code>nextPage</code>, <code>lastPage</code>, and
          <code>page(page)</code> for an injector scope. Recipe copy — status text, jump label,
          totals — is consumer markup and localizes with your app strings.
        </li>
        <li><code>HELL_PAGINATION_LABELS</code>: the injection token resolving to the effective labels.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          <code>&lt;hell-pagination&gt;</code> carries <code>role="navigation"</code> and an
          <code>aria-label</code> from the <code>navigation</code> label. Composing
          <code>[hellPagination]</code> yourself on a native <code>&lt;nav&gt;</code> gets the same
          landmark semantics for free; put it on another element and add the role/label yourself.
        </li>
        <li>
          Every control has a per-instance accessible name: first/previous/next/last use their
          respective labels, and numbered buttons use <code>page(n)</code> (for example "Page 8").
        </li>
        <li>
          Controls render as real <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> elements.
          On a button host, <code>disabled</code> sets the native <code>disabled</code> attribute;
          on an anchor host it sets <code>aria-disabled="true"</code> and <code>tabindex="-1"</code>
          and blocks both <code>click</code> and keyboard activation, so a disabled link never
          navigates.
        </li>
        <li>
          Enter and Space activate every control, including anchor hosts, through an
          Angular-level keyboard handler kept in place as a workaround for an upstream
          <code>ng-primitives</code> regression (see the entry point's source comment).
        </li>
        <li>
          In the recipes, give the status text <code>aria-live="polite"</code> so screen reader
          users hear the new page after navigating, and give the page-jump
          <code>&lt;select&gt;</code> an <code>aria-label</code>; disable it whenever pagination
          is disabled or there is only one page.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use pagination when a result set is too large to render at once and the total is meaningful.</li>
        <li>Switch to the previous/next or page-jump recipe once the numbered window would need to scroll or wrap.</li>
        <li>Preserve filters, sorting, and page size when the page changes.</li>
        <li>Reset to page one when the page size or filters change so the current slice stays valid.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't paginate a list short enough to show in full.</li>
        <li>Don't hide the total page count when it informs the task — prefer the page-jump recipe over hiding it.</li>
        <li>Don't reach for a custom composed layout unless the ready-made strip's markup genuinely doesn't fit.</li>
      </ul>
    </article>
  `,
})
export class PaginationPage {
  protected readonly paginationBasicExampleCode = paginationBasicExampleCodeRaw;
  protected readonly paginationPreviousNextExampleCode = paginationPreviousNextExampleCodeRaw;
  protected readonly paginationJumpExampleCode = paginationJumpExampleCodeRaw;
  protected readonly paginationComposedExampleCode = paginationComposedExampleCodeRaw;
  protected readonly paginationWithTableExampleCode = paginationWithTableExampleCodeRaw;
  protected readonly paginationStylingExampleCode = paginationStylingExampleCodeRaw;
}
