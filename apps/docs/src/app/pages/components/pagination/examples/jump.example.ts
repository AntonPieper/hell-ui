import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellPageLink, HellPagination } from 'hell-ui/pagination';
import { HellNativeSelect } from 'hell-ui/select';

@Component({
  selector: 'app-pagination-jump-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPagination, HellPageLink, HellNativeSelect],
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
      <label
        class="inline-flex min-h-hell-control-sm items-center gap-hell-2 text-xs text-hell-foreground-muted"
      >
        Page
        <select
          hellNativeSelect
          size="sm"
          aria-label="Page"
          class="min-w-[calc(var(--spacing)*18)]"
          [value]="page()"
          (change)="jumpTo($event)"
        >
          @for (p of pageOptions(); track p) {
            <option [value]="p" [selected]="p === page()">{{ p }}</option>
          }
        </select>
        of {{ pageCount }}
      </label>
      <button hellPageLink="next" type="button" aria-label="Next page">
        <span aria-hidden="true">&rsaquo;</span>
      </button>
    </nav>
  `,
})
export class PaginationJumpExample {
  protected readonly page = signal(6);
  protected readonly pageCount = 40;
  protected readonly pageOptions = computed(() =>
    Array.from({ length: this.pageCount }, (_, i) => i + 1),
  );

  protected jumpTo(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const page = Number.parseInt(target.value, 10);
    if (Number.isFinite(page)) this.page.set(page);
  }
}
