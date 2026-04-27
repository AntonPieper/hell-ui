import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellPaginationStrip } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellPaginationStrip],
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
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex items-center gap-4">
        <hell-pagination [page]="page()" [pageCount]="pageCount" (pageChange)="page.set($event)" />
        <span>Page {{ page() }} of {{ pageCount }}</span>
      </hd-example-tabs>

      <h2>Larger window</h2>
      <p>
        Use <code>siblingCount</code> to show more numbered buttons around the current page (default
        2).
      </p>
      <hd-example-tabs [code]="exampleCodes[1]">
        <hell-pagination
          [page]="page2()"
          [pageCount]="40"
          [siblingCount]="4"
          (pageChange)="page2.set($event)"
        />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>page</code>: 1-based current page (two-way bindable via <code>(pageChange)</code>).
        </li>
        <li><code>pageCount</code>: total number of pages.</li>
        <li><code>siblingCount</code>: numbered buttons shown either side of current.</li>
        <li><code>disabled</code>: disable all controls.</li>
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
  protected readonly exampleCodes = [
    '<hell-pagination [page]="1" [pageCount]="10" />\n<span>Page 1 of 10</span>\n',
    '<hell-pagination [page]="8" [pageCount]="40" [siblingCount]="4" />\n',
  ] as const;
  protected readonly page = signal(3);
  protected readonly page2 = signal(8);
  protected readonly pageCount = 12;
}
