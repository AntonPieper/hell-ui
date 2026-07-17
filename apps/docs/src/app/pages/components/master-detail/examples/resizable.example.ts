import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MASTER_DETAIL_IMPORTS } from '@hell-ui/angular/master-detail';
import { HELL_RESIZABLE_IMPORTS } from '@hell-ui/angular/resizable';

@Component({
  selector: 'app-master-detail-resizable-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MASTER_DETAIL_IMPORTS, ...HELL_RESIZABLE_IMPORTS],
  template: `
    <div
      hellMasterDetail
      #masterDetail="hellMasterDetail"
      data-testid="master-detail-resizable"
      [compactBelow]="640"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      ui="block h-[360px] min-w-0 overflow-hidden rounded-hell-lg border border-hell-border bg-hell-surface"
    >
      <div hellResizable orientation="horizontal" ui="h-full">
        <section
          id="master-detail-resizable-primary"
          hellResizablePane
          hellMasterPane="primary"
          [initialFlex]="3"
          [minSize]="220"
        >
          <div class="grid gap-hell-2 p-hell-4">
            <strong class="text-sm font-semibold text-hell-foreground">Review queue</strong>
            <p class="m-0 text-sm text-hell-foreground-muted">
              Resizable owns the pane sizing; Master Detail owns only responsive visibility.
            </p>
            <button
              hellButton
              data-testid="master-detail-resizable-open"
              class="justify-self-start"
              size="sm"
              type="button"
              (click)="detailOpen.set(true)"
            >
              Review invoice
            </button>
          </div>
        </section>

        <div
          hellResizableHandle
          data-testid="master-detail-resizable-handle"
          appearance="grip"
          aria-controls="master-detail-resizable-primary master-detail-resizable-detail"
          [hidden]="masterDetail.compact()"
        ></div>

        <section
          id="master-detail-resizable-detail"
          hellResizablePane
          hellMasterPane="detail"
          [initialFlex]="2"
          [minSize]="260"
        >
          <div class="grid gap-hell-3 p-hell-4">
            <button
              hellMasterDetailBack
              hellButton
              data-testid="master-detail-resizable-back"
              class="justify-self-start"
              variant="ghost"
              size="sm"
              type="button"
            >
              Back to queue
            </button>
            <strong class="text-sm font-semibold text-hell-foreground">INV-2041</strong>
            <p class="m-0 text-sm text-hell-foreground-muted">
              Drag or keyboard-resize the external separator in wide mode. The handle is hidden by
              this consumer when the controller reports compact mode.
            </p>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class MasterDetailResizableExample {
  protected readonly detailOpen = signal(false);
}
