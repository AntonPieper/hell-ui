import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellPagination,
  HellPaginationFirst,
  HellPaginationLast,
  HellPaginationNext,
  HellPaginationPrev,
} from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-composed-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellPagination,
    HellPaginationFirst,
    HellPaginationPrev,
    HellPaginationNext,
    HellPaginationLast,
  ],
  template: `
    <nav
      hellPagination
      class="inline-flex items-center gap-hell-2"
      aria-label="Pagination"
      [page]="page()"
      [pageCount]="pageCount"
      (pageChange)="page.set($event)"
    >
      <button hellPaginationFirst type="button" aria-label="First page">First</button>
      <button hellPaginationPrev type="button" aria-label="Previous page">Prev</button>
      <span class="whitespace-nowrap px-hell-2 text-xs text-hell-foreground-muted">
        {{ page() }} / {{ pageCount }}
      </span>
      <button hellPaginationNext type="button" aria-label="Next page">Next</button>
      <button hellPaginationLast type="button" aria-label="Last page">Last</button>
    </nav>
  `,
})
export class PaginationComposedExample {
  protected readonly page = signal(4);
  protected readonly pageCount = 20;
}
