import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellPagination,
  HellPaginationButton,
  HellPaginationFirst,
  HellPaginationLast,
  HellPaginationNext,
  HellPaginationPrev,
  HellPaginationStrip,
  type HellPaginationButtonUi,
  type HellPaginationFirstUi,
  type HellPaginationLastUi,
  type HellPaginationNextUi,
  type HellPaginationPrevUi,
  type HellPaginationStripUi,
} from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellPagination,
    HellPaginationFirst,
    HellPaginationPrev,
    HellPaginationButton,
    HellPaginationNext,
    HellPaginationLast,
    HellPaginationStrip,
  ],
  template: `
    <div class="flex flex-col gap-hell-4">
      <!-- Composed directives: each [hellPagination*] control owns a single "root" part. -->
      <nav
        hellPagination
        ui="gap-hell-3 rounded-hell-lg bg-hell-surface-muted p-hell-2"
        [page]="composedPage()"
        [pageCount]="8"
        (pageChange)="composedPage.set($event)"
      >
        <button hellPaginationFirst type="button" [ui]="firstUi" aria-label="First page">
          First
        </button>
        <button hellPaginationPrev type="button" [ui]="prevUi" aria-label="Previous page">
          Prev
        </button>
        <button
          hellPaginationButton
          [page]="composedPage()"
          type="button"
          [ui]="buttonUi"
          [attr.aria-label]="'Page ' + composedPage()"
        >
          {{ composedPage() }}
        </button>
        <button hellPaginationNext type="button" [ui]="nextUi" aria-label="Next page">
          Next
        </button>
        <button hellPaginationLast type="button" [ui]="lastUi" aria-label="Last page">
          Last
        </button>
      </nav>

      <!-- HellPaginationStrip in "jump" mode: root, control, controlGlyph, jump, jumpLabel, jumpSelect, jumpTotal. -->
      <hell-pagination
        mode="jump"
        [page]="jumpPage()"
        [pageCount]="24"
        [ui]="jumpStripUi"
        (pageChange)="jumpPage.set($event)"
      />

      <!-- HellPaginationStrip in "previous-next" mode: covers the "status" part. -->
      <hell-pagination
        mode="previous-next"
        [page]="statusPage()"
        [pageCount]="9"
        [ui]="statusStripUi"
        (pageChange)="statusPage.set($event)"
      />
    </div>
  `,
})
export class PaginationStylingExample {
  protected readonly composedPage = signal(3);
  protected readonly jumpPage = signal(6);
  protected readonly statusPage = signal(2);

  protected readonly firstUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  } satisfies HellPaginationFirstUi;
  protected readonly prevUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  } satisfies HellPaginationPrevUi;
  protected readonly buttonUi = {
    root: 'rounded-hell-pill bg-hell-primary text-hell-primary-foreground',
  } satisfies HellPaginationButtonUi;
  protected readonly nextUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  } satisfies HellPaginationNextUi;
  protected readonly lastUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  } satisfies HellPaginationLastUi;

  protected readonly jumpStripUi = {
    root: 'rounded-hell-lg bg-hell-surface-muted p-hell-2',
    control: 'rounded-hell-pill',
    controlGlyph: 'text-hell-primary',
    jump: 'rounded-hell-md bg-hell-surface-elevated px-hell-3 py-hell-1',
    jumpLabel: 'font-semibold text-hell-primary',
    jumpSelect: 'rounded-hell-md border-hell-primary',
    jumpTotal: 'text-hell-foreground-subtle',
  } satisfies HellPaginationStripUi;

  protected readonly statusStripUi = {
    root: 'rounded-hell-lg bg-hell-surface-muted p-hell-2',
    status: 'font-semibold text-hell-primary',
  } satisfies HellPaginationStripUi;
}
