import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';

@Component({
  selector: 'app-split-view-sizing-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view
      framed
      [height]="260"
      [compactBelow]="480"
      [primaryFlex]="2"
      [detailFlex]="3"
      [primaryMinSize]="200"
      [detailMinSize]="240"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
    >
      <ng-template hellSplitPrimary>
        <div class="flex flex-1 flex-col gap-hell-1 p-hell-4">
          <strong class="text-sm font-semibold text-hell-foreground">Filters</strong>
          <p class="m-0 text-xs text-hell-foreground-muted">
            Starts at flex <code>2</code>, will not shrink below <code>200px</code>.
          </p>
          <button
            class="mt-hell-1 self-start text-sm text-hell-primary underline"
            type="button"
            (click)="detailOpen.set(true)"
          >
            Open results
          </button>
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex flex-1 flex-col gap-hell-1 p-hell-4">
          <strong class="text-sm font-semibold text-hell-foreground">Results</strong>
          <p class="m-0 text-xs text-hell-foreground-muted">
            Weighted heavier at flex <code>3</code> with a <code>240px</code> minimum. Below
            <code>480px</code> the view collapses to a single stacked screen.
          </p>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewSizingExample {
  protected readonly detailOpen = signal(false);
}
