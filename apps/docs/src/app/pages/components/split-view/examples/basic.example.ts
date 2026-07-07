import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';

@Component({
  selector: 'app-split-view-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view
      framed
      [height]="260"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
    >
      <ng-template hellSplitPrimary>
        <div class="flex flex-1 flex-col gap-hell-2 p-hell-4">
          <strong class="text-sm font-semibold text-hell-foreground">Primary</strong>
          <p class="m-0 text-sm text-hell-foreground-muted">
            The list, browser, or navigation side of a master/detail layout.
          </p>
          <button
            class="self-start text-sm text-hell-primary underline"
            type="button"
            (click)="detailOpen.set(true)"
          >
            Open detail
          </button>
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex flex-1 flex-col gap-hell-2 p-hell-4">
          <strong class="text-sm font-semibold text-hell-foreground">Detail</strong>
          <p class="m-0 text-sm text-hell-foreground-muted">
            The selected record. Drag the handle to resize when there is room for both panes;
            shrink the container to see the compact back-button flow.
          </p>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewBasicExample {
  protected readonly detailOpen = signal(false);
}
