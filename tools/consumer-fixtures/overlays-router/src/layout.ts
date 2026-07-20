import { Component, signal } from '@angular/core';
import { HELL_MASTER_DETAIL_IMPORTS } from '@hell-ui/angular/master-detail';
import { HellPageLink, HellPagination } from '@hell-ui/angular/pagination';
import { HELL_RESIZABLE_IMPORTS, type HellResizableHandleUi } from '@hell-ui/angular/resizable';
import { HellToolbar, HellToolbarItem } from '@hell-ui/angular/toolbar';

// Projection-first Master Detail controller composing external Resizable,
// Toolbar, and Pagination entries from the packed tarball.
@Component({
  selector: 'app-composite-layout',
  imports: [
    HellPageLink,
    HellPagination,
    HellToolbar,
    HellToolbarItem,
    ...HELL_MASTER_DETAIL_IMPORTS,
    ...HELL_RESIZABLE_IMPORTS,
  ],
  template: `
    <div
      hellMasterDetail
      #masterDetail="hellMasterDetail"
      [compactBelow]="0"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      ui="h-[320px]"
    >
      <div hellResizable orientation="horizontal" ui="h-full">
        <section hellResizablePane hellMasterPane="primary" [initialFlex]="2" [ui]="paneUi">
          <button type="button" (click)="detailOpen.set(true)">Open detail</button>
        </section>
        <div
          hellResizableHandle
          appearance="grip"
          [ui]="handleUi"
          [hidden]="masterDetail.compact()"
        ></div>
        <section hellResizablePane hellMasterPane="detail" [initialFlex]="3">
          <button hellMasterDetailBack type="button">Back</button>
          <div hellToolbar label="Detail actions">
            <button hellToolbarItem type="button">Archive</button>
          </div>
          <nav hellPagination aria-label="Item navigation" [page]="1" [pageCount]="3">
            <button hellPageLink="previous" type="button">Previous</button>
            <button hellPageLink="next" type="button">Next</button>
          </nav>
        </section>
      </div>
    </div>
  `,
})
export class CompositeLayout {
  protected readonly detailOpen = signal(false);
  protected readonly paneUi = { root: 'p-4 overflow-hidden' };
  protected readonly handleUi = {
    root: 'bg-hell-surface-muted',
    grip: 'bg-hell-primary',
  } satisfies HellResizableHandleUi;
}
