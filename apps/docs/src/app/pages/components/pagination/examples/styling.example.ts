import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPageLink, HellPagination, HellPaginationStrip, type HellPaginationStripUi } from 'hell-ui/pagination';

@Component({
  selector: 'app-pagination-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPageLink, HellPagination, HellPaginationStrip],
  template: `
    <div class="flex flex-col gap-hell-4">
      <!-- Composed controls: each hellPageLink owns a single "root" part. -->
      <nav
        hellPagination
        ui="gap-hell-3 rounded-hell-lg bg-hell-surface-muted p-hell-2"
        [page]="composedPage()"
        [pageCount]="8"
        (pageChange)="composedPage.set($event)"
      >
        <button hellPageLink="first" type="button" [ui]="firstUi" aria-label="First page">
          First
        </button>
        <button hellPageLink="previous" type="button" [ui]="prevUi" aria-label="Previous page">
          Prev
        </button>
        <button
          [hellPageLink]="composedPage()"
          type="button"
          [ui]="buttonUi"
          [attr.aria-label]="'Page ' + composedPage()"
        >
          {{ composedPage() }}
        </button>
        <button hellPageLink="next" type="button" [ui]="nextUi" aria-label="Next page">
          Next
        </button>
        <button hellPageLink="last" type="button" [ui]="lastUi" aria-label="Last page">
          Last
        </button>
      </nav>

      <!-- HellPaginationStrip: root, control, controlGlyph. -->
      <hell-pagination
        [page]="stripPage()"
        [pageCount]="24"
        [ui]="stripUi"
        (pageChange)="stripPage.set($event)"
      />
    </div>
  `,
})
export class PaginationStylingExample {
  protected readonly composedPage = signal(3);
  protected readonly stripPage = signal(6);

  protected readonly firstUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  };
  protected readonly prevUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  };
  protected readonly buttonUi = {
    root: 'rounded-hell-pill bg-hell-primary text-hell-primary-foreground',
  };
  protected readonly nextUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  };
  protected readonly lastUi = {
    root: 'rounded-hell-pill bg-hell-surface-elevated',
  };

  protected readonly stripUi = {
    root: 'rounded-hell-lg bg-hell-surface-muted p-hell-2',
    control: 'rounded-hell-pill',
    controlGlyph: 'text-hell-primary',
  } satisfies HellPaginationStripUi;
}
