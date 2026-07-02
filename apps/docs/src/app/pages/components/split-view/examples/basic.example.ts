import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';

@Component({
  selector: 'app-split-view-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view framed [height]="240" [detailOpen]="detailOpen()" (detailOpenChange)="detailOpen.set($event)">
      <ng-template hellSplitPrimary>
        <div class="p-3">
          <p class="m-0 text-sm">Primary pane</p>
          <button class="mt-2 text-sm underline" type="button" (click)="detailOpen.set(true)">
            Open detail
          </button>
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="p-3">
          <p class="m-0 text-sm">Detail pane</p>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewBasicExample {
  protected readonly detailOpen = signal(false);
}
