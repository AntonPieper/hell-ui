import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES, type HellSplitViewUi } from '@hell-ui/angular/split-view';

@Component({
  selector: 'app-split-view-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <!-- One map refines every public part; compact-only parts (screen, -->
    <!-- compactHeader, backButton) apply below compactBelow, the rest above it. -->
    <hell-split-view
      framed
      [height]="300"
      [ui]="ui"
      [detailOpen]="detailOpen()"
      itemNavigation
      itemNavigationLabel="Record navigation"
      [previousItemDisabled]="false"
      [nextItemDisabled]="false"
      (detailOpenChange)="detailOpen.set($event)"
    >
      <ng-template hellSplitPrimary>
        <div class="flex flex-1 flex-col gap-hell-2 p-hell-4">
          <strong class="text-sm font-semibold text-hell-primary">Records</strong>
          <button
            class="self-start text-sm text-hell-primary underline"
            type="button"
            (click)="detailOpen.set(true)"
          >
            Open record
          </button>
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex flex-1 flex-col gap-hell-2 p-hell-4">
          <strong class="text-sm font-semibold text-hell-primary">Record detail</strong>
          <p class="m-0 text-xs text-hell-foreground-muted">
            Resize the container to see the compact header and back button pick up the same
            refinements.
          </p>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewAllPartsStylingExample {
  protected readonly detailOpen = signal(false);
  protected readonly ui: HellSplitViewUi = {
    root: 'rounded-hell-xl border-hell-primary bg-hell-primary-soft',
    resizable: 'p-hell-2',
    screen: 'bg-hell-primary-soft',
    pane: 'rounded-hell-lg bg-hell-surface-elevated',
    compactHeader: 'bg-hell-primary text-hell-primary-foreground',
    backButton: 'text-hell-primary-foreground',
    detailHeader: 'bg-hell-primary-soft',
    itemNavigation: 'rounded-hell-pill bg-hell-surface-elevated p-hell-1',
  };
}
