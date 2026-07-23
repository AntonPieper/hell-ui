import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_MASTER_DETAIL_IMPORTS } from 'hell-ui/master-detail';

@Component({
  selector: 'app-master-detail-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MASTER_DETAIL_IMPORTS],
  template: `
    <div
      hellMasterDetail
      data-testid="master-detail-basic"
      [compactBelow]="560"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      ui="grid h-[280px] min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] overflow-hidden rounded-hell-lg border border-hell-border bg-hell-surface data-[compact=true]:grid-cols-1"
    >
      <section
        hellMasterPane="primary"
        ui="min-w-0 overflow-auto border-e border-hell-border p-hell-4"
      >
        <div class="grid gap-hell-2">
          <strong class="text-sm font-semibold text-hell-foreground">Projects</strong>
          <p class="m-0 text-sm text-hell-foreground-muted">
            Consumer markup owns this list and the two-column presentation.
          </p>
          <button
            hellButton
            data-testid="master-detail-basic-open"
            class="justify-self-start"
            size="sm"
            type="button"
            (click)="detailOpen.set(true)"
          >
            Open Atlas
          </button>
        </div>
      </section>

      <section hellMasterPane="detail" ui="min-w-0 overflow-auto p-hell-4">
        <div class="grid gap-hell-3">
          <button
            hellMasterDetailBack
            hellButton
            data-testid="master-detail-basic-back"
            class="justify-self-start"
            variant="ghost"
            size="sm"
            type="button"
          >
            Back to projects
          </button>
          <strong class="text-sm font-semibold text-hell-foreground">Atlas rollout</strong>
          <p class="m-0 text-sm text-hell-foreground-muted">
            Both panes stay in the DOM. Compact mode makes only the active pane available.
          </p>
          <label class="grid gap-hell-1 text-xs font-semibold text-hell-foreground">
            Review note
            <input
              data-testid="master-detail-basic-draft"
              class="rounded-hell-sm border border-hell-border bg-hell-surface px-hell-2 py-hell-1 text-sm"
              value="Preserved consumer state"
            />
          </label>
        </div>
      </section>
    </div>
  `,
})
export class MasterDetailBasicExample {
  protected readonly detailOpen = signal(false);
}
