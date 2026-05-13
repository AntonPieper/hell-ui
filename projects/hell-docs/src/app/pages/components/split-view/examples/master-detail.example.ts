import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/composites';
import { HellButton } from '@hell-ui/angular/primitives';

interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly state: string;
}

const TICKETS: readonly Ticket[] = [
  { id: 'T-104', title: 'Approve invoice', owner: 'Ada', state: 'Open' },
  { id: 'T-109', title: 'Review rollout', owner: 'Grace', state: 'Waiting' },
  { id: 'T-118', title: 'Update access', owner: 'Katherine', state: 'Open' },
];

@Component({
  selector: 'app-split-view-master-detail-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_SPLIT_VIEW_DIRECTIVES],
  template: `
    <hell-split-view
      framed
      [height]="360"
      [detailOpen]="detailOpen()"
      (detailOpenChange)="detailOpen.set($event)"
      >
      <ng-template hellSplitPrimary>
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-3">
          <div class="flex items-center justify-between gap-2">
            <strong class="text-sm font-semibold text-hell-foreground">Tickets</strong>
            <span class="text-xs text-hell-foreground-muted">{{ tickets.length }} open</span>
          </div>

          <div class="grid gap-1">
            @for (ticket of tickets; track ticket.id) {
              <button
                hellButton
                variant="ghost"
                type="button"
                (click)="select(ticket.id)"
              >
                {{ ticket.id }} · {{ ticket.title }}
              </button>
            }
          </div>
        </div>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-3">
          @if (selected(); as ticket) {
            <div class="grid gap-0.5">
              <strong class="text-sm font-semibold text-hell-foreground">{{ ticket.title }}</strong>
              <span class="text-xs text-hell-foreground-muted">{{ ticket.id }} · {{ ticket.state }}</span>
            </div>
            <p class="m-0 text-sm text-hell-foreground-muted">
              {{ ticket.owner }} owns this ticket. On narrow containers the detail pane becomes a
              screen with a back button.
            </p>
          } @else {
            <div class="flex flex-1 items-center justify-center text-center text-sm text-hell-foreground-muted">
              Select a ticket
            </div>
          }
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewMasterDetailExample {
  protected readonly tickets = TICKETS;
  protected readonly selectedId = signal(TICKETS[0].id);
  protected readonly detailOpen = signal(false);
  protected readonly selected = computed(() =>
    TICKETS.find((ticket) => ticket.id === this.selectedId()) ?? null,
  );

  protected select(id: string): void {
    this.selectedId.set(id);
    this.detailOpen.set(true);
  }
}
