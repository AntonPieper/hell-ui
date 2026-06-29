import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PaginationBasicExample } from './examples/basic.example';
import paginationBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { PaginationLargerWindowExample } from './examples/larger-window.example';
import paginationLargerWindowExampleCodeRaw from './examples/larger-window.example.ts?raw' with {
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

@Component({
  selector: 'hd-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PaginationBasicExample,
    PaginationLargerWindowExample,
    PaginationPreviousNextExample,
    PaginationJumpExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Pagination</h1>
      <p>
        Navigate between pages. Built on the
        <code>ng-primitives/pagination</code> primitives. Renders first / previous / numbered window
        / next / last buttons with chevron icons, and emits <code>(pageChange)</code> with the new
        1-based page number.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs
        [code]="paginationBasicExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-basic-example />
      </hd-example-tabs>

      <h2>Larger window</h2>
      <p>
        Use <code>siblingCount</code> to show more numbered buttons around the current page (default
        2).
      </p>
      <hd-example-tabs [code]="paginationLargerWindowExampleCode">
        <app-pagination-larger-window-example />
      </hd-example-tabs>

      <h2>Previous / next only</h2>
      <p>
        Use <code>mode="previous-next"</code> when page numbers would be noisy but users still need
        clear position and disabled boundary states. For custom markup, compose
        <code>[hellPagination]</code> with only <code>hellPaginationPrev</code> and
        <code>hellPaginationNext</code>.
      </p>
      <hd-example-tabs
        [code]="paginationPreviousNextExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-previous-next-example />
      </hd-example-tabs>

      <h2>Page jump</h2>
      <p>
        Use <code>mode="jump"</code> for large page sets. The native select is keyboard and screen
        reader reachable while keeping the current page and page count compact.
      </p>
      <hd-example-tabs
        [code]="paginationJumpExampleCode"
        previewClass="flex flex-wrap items-center gap-3"
      >
        <app-pagination-jump-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>page</code>: 1-based current page (two-way bindable via <code>(pageChange)</code>).
        </li>
        <li><code>pageCount</code>: total number of pages.</li>
        <li>
          <code>mode</code>: <code>pages</code> (default), <code>previous-next</code>, or
          <code>jump</code>.
        </li>
        <li><code>siblingCount</code>: numbered buttons shown either side of current.</li>
        <li><code>disabled</code>: disable all controls.</li>
        <li>
          <code>ui</code>: customize the ready-made strip parts
          <code>root</code>, <code>controlGlyph</code>, <code>status</code>, <code>jump</code>,
          <code>jumpLabel</code>, <code>jumpSelect</code>, and <code>jumpTotal</code>. Composed
          <code>[hellPagination*]</code> controls each expose a local <code>root</code> part.
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use pagination when users need stable pages and totals.</li>
        <li>Keep <code>siblingCount</code> lower on narrow layouts.</li>
        <li>Preserve filters and sorting when page changes.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't paginate tiny lists.</li>
        <li>Don't hide total count when it informs the task.</li>
      </ul>
    </article>
  `,
})
export class PaginationPage {
  protected readonly paginationBasicExampleCode = paginationBasicExampleCodeRaw;
  protected readonly paginationLargerWindowExampleCode = paginationLargerWindowExampleCodeRaw;
  protected readonly paginationPreviousNextExampleCode = paginationPreviousNextExampleCodeRaw;
  protected readonly paginationJumpExampleCode = paginationJumpExampleCodeRaw;
}
