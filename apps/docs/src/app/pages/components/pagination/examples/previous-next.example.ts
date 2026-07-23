import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPageLink, HellPagination } from 'hell-ui/pagination';

@Component({
  selector: 'app-pagination-previous-next-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPagination, HellPageLink],
  template: `
    <nav
      hellPagination
      aria-label="Pagination"
      class="gap-hell-2"
      [page]="page()"
      [pageCount]="pageCount"
      (pageChange)="page.set($event)"
    >
      <button hellPageLink="previous" type="button" aria-label="Previous page">
        <span aria-hidden="true">&lsaquo;</span>
      </button>
      <span
        class="inline-flex min-h-hell-control-sm items-center text-xs text-hell-foreground-muted"
        aria-live="polite"
      >
        Page {{ page() }} of {{ pageCount }}
      </span>
      <button hellPageLink="next" type="button" aria-label="Next page">
        <span aria-hidden="true">&rsaquo;</span>
      </button>
    </nav>
  `,
})
export class PaginationPreviousNextExample {
  protected readonly page = signal(1);
  protected readonly pageCount = 9;
}
