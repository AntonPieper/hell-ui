import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellPaginationStrip } from 'hell';

@Component({
  selector: 'hd-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <article class="hd-prose">
      <h1>Pagination</h1>
      <p>
        Navigate between pages. Built on the
        <code>ng-primitives/pagination</code> primitives. Renders first /
        previous / numbered window / next / last buttons with chevron icons,
        and emits <code>(pageChange)</code> with the new 1-based page number.
      </p>

      <h2>Basic</h2>
      <div class="hd-example flex items-center gap-4">
        <hell-pagination
          [page]="page()"
          [pageCount]="pageCount"
          (pageChange)="page.set($event)"
        />
        <span>Page {{ page() }} of {{ pageCount }}</span>
      </div>

      <h2>Larger window</h2>
      <p>
        Use <code>siblingCount</code> to show more numbered buttons around the
        current page (default 2).
      </p>
      <div class="hd-example">
        <hell-pagination
          [page]="page2()"
          [pageCount]="40"
          [siblingCount]="4"
          (pageChange)="page2.set($event)"
        />
      </div>

      <h2>API</h2>
      <ul>
        <li><code>page</code>: 1-based current page (two-way bindable via <code>(pageChange)</code>).</li>
        <li><code>pageCount</code>: total number of pages.</li>
        <li><code>siblingCount</code>: numbered buttons shown either side of current.</li>
        <li><code>disabled</code>: disable all controls.</li>
      </ul>
    </article>
  `,
})
export class PaginationPage {
  protected readonly page = signal(3);
  protected readonly page2 = signal(8);
  protected readonly pageCount = 12;
}
