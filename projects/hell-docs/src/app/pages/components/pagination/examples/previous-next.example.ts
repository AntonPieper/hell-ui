import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-previous-next-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination
      mode="previous-next"
      [page]="page()"
      [pageCount]="pageCount"
      (pageChange)="page.set($event)"
    />
  `,
})
export class PaginationPreviousNextExample {
  protected readonly page = signal(1);
  protected readonly pageCount = 9;
}
