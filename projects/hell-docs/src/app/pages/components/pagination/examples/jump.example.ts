import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-jump-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination
      mode="jump"
      [page]="page()"
      [pageCount]="pageCount"
      (pageChange)="page.set($event)"
    />
  `,
})
export class PaginationJumpExample {
  protected readonly page = signal(6);
  protected readonly pageCount = 40;
}
