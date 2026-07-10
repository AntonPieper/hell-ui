import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidDownload,
  faSolidFilter,
  faSolidPlus,
  faSolidTableColumns,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

interface Member {
  readonly name: string;
  readonly role: string;
  readonly status: string;
}

const MEMBERS: readonly Member[] = [
  { name: 'Ada Lovelace', role: 'Owner', status: 'Active' },
  { name: 'Grace Hopper', role: 'Admin', status: 'Active' },
  { name: 'Katherine Johnson', role: 'Member', status: 'Invited' },
  { name: 'Dorothy Vaughan', role: 'Member', status: 'Active' },
];

@Component({
  selector: 'app-toolbar-table-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidPlus,
      faSolidFilter,
      faSolidDownload,
      faSolidTableColumns,
      faSolidXmark,
    }),
  ],
  imports: [HellIcon, ...HELL_TOOLBAR_DIRECTIVES, ...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-hell-3">
      <hell-toolbar
        label="Team members"
        class="rounded-hell-md border border-hell-border bg-hell-surface-subtle p-hell-2"
      >
        <ng-template
          hellToolbarAction
          label="Invite member"
          priority="primary"
          variant="primary"
          (activated)="run('invite')"
        >
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Filter" (activated)="run('filter')">
          <hell-icon name="faSolidFilter" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Export" (activated)="run('export')">
          <hell-icon name="faSolidDownload" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Columns" (activated)="run('columns')">
          <hell-icon name="faSolidTableColumns" size="13px" />
        </ng-template>
        <ng-template
          hellToolbarAction
          label="Remove selected"
          priority="overflowOnly"
          (activated)="run('remove')"
        >
          <hell-icon name="faSolidXmark" size="13px" />
        </ng-template>
      </hell-toolbar>

      <div hellTableContainer>
        <table hellTableRoot>
          <thead hellTableHeader>
            <tr hellTableRow>
              <th hellTableHeaderCell>Name</th>
              <th hellTableHeaderCell>Role</th>
              <th hellTableHeaderCell>Status</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (member of members; track member.name) {
              <tr hellTableRow>
                <td hellTableCell>{{ member.name }}</td>
                <td hellTableCell>{{ member.role }}</td>
                <td hellTableCell>{{ member.status }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="m-0 text-sm text-hell-foreground-muted">Last action: <strong>{{ lastAction() }}</strong></p>
    </div>
  `,
})
export class ToolbarTableExample {
  protected readonly members = MEMBERS;
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
