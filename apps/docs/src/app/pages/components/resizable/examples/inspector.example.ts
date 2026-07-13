import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HELL_RESIZABLE_DIRECTIVES } from '@hell-ui/angular/resizable';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HellChip } from '@hell-ui/angular/chip';

interface Ticket {
  readonly id: string;
  readonly title: string;
  readonly owner: string;
  readonly status: 'Open' | 'Blocked' | 'Done';
}

const tickets: readonly Ticket[] = [
  { id: 'OPS-241', title: 'Rotate staging TLS certificate', owner: 'Mira K.', status: 'Open' },
  { id: 'OPS-238', title: 'Backfill invoice export queue', owner: 'Dan R.', status: 'Blocked' },
  { id: 'OPS-230', title: 'Archive Q1 audit logs', owner: 'Lea T.', status: 'Done' },
];

@Component({
  selector: 'app-resizable-inspector-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_RESIZABLE_DIRECTIVES,
    ...HELL_CARD_DIRECTIVES,
    ...HELL_TABLE_UTILITIES_DIRECTIVES,
    HellChip,
  ],
  template: `
    <!-- List / inspector split: a table of tickets on the left, a detail card -->
    <!-- on the right. aria-controls names the two panes the handle resizes. -->
    <div hellResizable class="h-[22rem]" ui="overflow-clip rounded-hell-lg border border-hell-border">
      <div id="ticket-list-pane" hellResizablePane [initialFlex]="3" [minSize]="260">
        <div hellTableContainer ui="rounded-none border-0">
          <table hellTableRoot>
            <thead hellTableHeader>
              <tr hellTableRow>
                <th hellTableHeaderCell>Ticket</th>
                <th hellTableHeaderCell>Title</th>
                <th hellTableHeaderCell>Status</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (ticket of tickets; track ticket.id) {
                <tr
                  hellTableRow
                  class="cursor-pointer"
                  [attr.aria-selected]="ticket.id === selected().id"
                  (click)="selected.set(ticket)"
                >
                  <td hellTableCell class="font-medium">{{ ticket.id }}</td>
                  <td hellTableCell>{{ ticket.title }}</td>
                  <td hellTableCell>
                    <span hellChip [variant]="statusVariant(ticket.status)">{{ ticket.status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div
        hellResizableHandle
        appearance="grip"
        [aria-controls]="['ticket-list-pane', 'ticket-detail-pane']"
      ></div>

      <div id="ticket-detail-pane" hellResizablePane [initialFlex]="2" [minSize]="220">
        <div hellCard [elevation]="0" ui="h-full rounded-none border-0">
          <div hellCardHeader>
            <strong>{{ selected().id }}</strong>
            <span hellChip [variant]="statusVariant(selected().status)">{{ selected().status }}</span>
          </div>
          <div hellCardBody class="flex flex-col gap-hell-2 text-sm">
            <p class="m-0 font-medium">{{ selected().title }}</p>
            <p class="m-0 text-hell-foreground-muted">Owner · {{ selected().owner }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResizableInspectorExample {
  protected readonly tickets = tickets;
  protected readonly selected = signal<Ticket>(tickets[0]);

  protected statusVariant(status: Ticket['status']): 'info' | 'warning' | 'success' {
    switch (status) {
      case 'Blocked':
        return 'warning';
      case 'Done':
        return 'success';
      default:
        return 'info';
    }
  }
}
