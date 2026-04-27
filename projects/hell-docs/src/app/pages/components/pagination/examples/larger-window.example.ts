import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellPaginationStrip } from 'hell';

@Component({
  selector: 'app-pagination-larger-window-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination
      [page]="page2()"
      [pageCount]="40"
      [siblingCount]="4"
      (pageChange)="page2.set($event)"
    />
  `,
})
export class PaginationLargerWindowExample {
  protected readonly page = signal(3);
  protected readonly page2 = signal(8);
  protected readonly pageCount = 12;
}
