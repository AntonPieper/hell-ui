import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <!-- The strip exposes multi-part anatomy: root, status, jump controls, … -->
    <hell-pagination
      mode="previous-next"
      [page]="page()"
      [pageCount]="pageCount"
      [ui]="{ root: 'gap-hell-3', status: 'font-semibold text-hell-primary' }"
      (pageChange)="page.set($event)"
    />
  `,
})
export class PaginationStylingExample {
  protected readonly page = signal(2);
  protected readonly pageCount = 9;
}
