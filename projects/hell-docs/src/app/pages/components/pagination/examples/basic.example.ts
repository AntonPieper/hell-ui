import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellPaginationStrip } from '@hell-ui/angular/pagination';

@Component({
  selector: 'app-pagination-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPaginationStrip],
  template: `
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <hell-pagination
          [page]="page()"
          [pageCount]="pageCount"
          pagePicker="select"
          [showStatus]="true"
          (pageChange)="page.set($event)"
        />
      </div>

      <hell-pagination
        mode="previous-next"
        [showStatus]="true"
        [page]="simplePage()"
        [pageCount]="pageCount"
        (pageChange)="simplePage.set($event)"
      />
    </div>
  `,
})
export class PaginationBasicExample {
  protected readonly page = signal(3);
  protected readonly simplePage = signal(3);
  protected readonly pageCount = 12;
}
