import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellPaginationStrip } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-pagination-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination [page]="page()" [pageCount]="pageCount" (pageChange)="page.set($event)" />
    <span>Page {{ page() }} of {{ pageCount }}</span>
  `,
})
export class PaginationBasicExample {
  protected readonly page = signal(3);
  protected readonly page2 = signal(8);
  protected readonly pageCount = 12;
}
