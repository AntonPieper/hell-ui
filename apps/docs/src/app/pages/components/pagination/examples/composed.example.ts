import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPageLink, HellPagination } from 'hell-ui/pagination';

@Component({
  selector: 'app-pagination-composed-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPageLink, HellPagination],
  template: `
    <nav
      hellPagination
      class="inline-flex items-center gap-hell-2"
      aria-label="Pagination"
      [page]="page()"
      [pageCount]="pageCount"
      (pageChange)="page.set($event)"
    >
      <button hellPageLink="first" type="button" aria-label="First page">First</button>
      <button hellPageLink="previous" type="button" aria-label="Previous page">Prev</button>
      <span class="whitespace-nowrap px-hell-2 text-xs text-hell-foreground-muted">
        {{ page() }} / {{ pageCount }}
      </span>
      <button hellPageLink="next" type="button" aria-label="Next page">Next</button>
      <button hellPageLink="last" type="button" aria-label="Last page">Last</button>
    </nav>
  `,
})
export class PaginationComposedExample {
  protected readonly page = signal(4);
  protected readonly pageCount = 20;
}
