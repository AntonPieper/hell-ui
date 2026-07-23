import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPaginationStrip } from 'hell-ui/pagination';

@Component({
  selector: 'app-pagination-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination [page]="page()" [pageCount]="pageCount" (pageChange)="page.set($event)" />
    <span class="whitespace-nowrap text-sm hd-muted">Page {{ page() }} of {{ pageCount }}</span>
  `,
})
export class PaginationBasicExample {
  protected readonly page = signal(3);
  protected readonly pageCount = 12;
}
