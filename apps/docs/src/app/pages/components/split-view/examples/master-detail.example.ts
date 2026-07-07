import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellTag } from '@hell-ui/angular/tag';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HELL_SPLIT_VIEW_DIRECTIVES } from '@hell-ui/angular/split-view';

interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly state: 'Open' | 'Waiting' | 'Resolved';
}

const TICKETS: readonly Ticket[] = [
  { id: 'T-104', title: 'Approve vendor invoice', owner: 'Ada Lovelace', state: 'Open' },
  { id: 'T-109', title: 'Review staged rollout', owner: 'Grace Hopper', state: 'Waiting' },
  { id: 'T-118', title: 'Update role access', owner: 'Katherine Johnson', state: 'Open' },
  { id: 'T-126', title: 'Close billing dispute', owner: 'Radia Perlman', state: 'Resolved' },
];

const STATE_VARIANT = {
  Open: 'primary',
  Waiting: 'warning',
  Resolved: 'success',
} as const;

@Component({
  selector: 'app-split-view-master-detail-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellTag,
    ...HELL_CARD_DIRECTIVES,
    ...HELL_TABLE_UTILITIES_DIRECTIVES,
    ...HELL_SPLIT_VIEW_DIRECTIVES,
  ],
  template: `
    <hell-split-view
      framed
      [height]="380"
      [primaryFlex]="3"
      [detailFlex]="2"
      [detailOpen]="detailOpen()"
      itemNavigation
      itemNavigationLabel="Ticket navigation"
      previousItemLabel="Previous ticket"
      nextItemLabel="Next ticket"
      [previousItemDisabled]="index() === 0"
      [nextItemDisabled]="index() === tickets.length - 1"
      (detailOpenChange)="detailOpen.set($event)"
      (previousItem)="move(-1)"
      (nextItem)="move(1)"
    >
      <ng-template hellSplitPrimary>
        <table hellTableRoot>
          <thead hellTableHeader>
            <tr hellTableRow>
              <th hellTableHeaderCell class="w-24">Ticket</th>
              <th hellTableHeaderCell>Title</th>
              <th hellTableHeaderCell class="w-28">State</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (ticket of tickets; track ticket.id; let i = $index) {
              <tr hellTableRow [active]="i === index()">
                <td hellTableCell>
                  <button
                    hellTableRowAction
                    (click)="open(i)"
                    [attr.aria-current]="i === index() ? 'true' : null"
                  >
                    {{ ticket.id }}
                  </button>
                </td>
                <td hellTableCell>{{ ticket.title }}</td>
                <td hellTableCell>
                  <span hellTag [variant]="stateVariant(ticket.state)">{{ ticket.state }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </ng-template>

      <ng-template hellSplitDetail>
        <div class="flex flex-1 flex-col p-hell-3">
          <div hellCard class="flex-1" [elevation]="0">
            <div hellCardHeader>
              <div class="flex flex-col gap-hell-1">
                <strong class="text-sm font-semibold text-hell-foreground">
                  {{ current().title }}
                </strong>
                <span class="text-xs font-normal text-hell-foreground-muted">
                  {{ current().id }} · assigned to {{ current().owner }}
                </span>
              </div>
              <span hellTag [variant]="stateVariant(current().state)">{{ current().state }}</span>
            </div>
            <div hellCardBody class="text-sm text-hell-foreground-muted">
              Ticket {{ index() + 1 }} of {{ tickets.length }}. Selecting a row in the table opens
              this detail card; on a narrow container the card fills a stacked screen with a back
              button and the same prev/next ticket navigation.
            </div>
          </div>
        </div>
      </ng-template>
    </hell-split-view>
  `,
})
export class SplitViewMasterDetailExample {
  protected readonly tickets = TICKETS;
  protected readonly index = signal(0);
  protected readonly detailOpen = signal(false);
  protected readonly current = computed(() => TICKETS[this.index()]);

  protected stateVariant(state: Ticket['state']): 'primary' | 'warning' | 'success' {
    return STATE_VARIANT[state];
  }

  protected open(index: number): void {
    this.index.set(index);
    this.detailOpen.set(true);
  }

  protected move(delta: -1 | 1): void {
    const next = Math.min(Math.max(this.index() + delta, 0), TICKETS.length - 1);
    this.open(next);
  }
}
