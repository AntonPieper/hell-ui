import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidDownload,
  faSolidFilter,
  faSolidMagnifyingGlass,
  faSolidPlus,
  faSolidTableColumns,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TABLE_UTILITIES_IMPORTS } from '@hell-ui/angular/table';
import { HELL_TOOLBAR_IMPORTS } from '@hell-ui/angular/toolbar';

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
      faSolidMagnifyingGlass,
      faSolidXmark,
    }),
  ],
  imports: [HellIcon, ...HELL_TOOLBAR_IMPORTS, ...HELL_TABLE_UTILITIES_IMPORTS],
  template: `
    <div class="flex flex-col gap-hell-3">
      <hell-overflow-toolbar
        label="Team members"
        class="rounded-hell-md border border-hell-border bg-hell-surface-subtle p-hell-2"
      >
        <ng-template
          hellToolbarAction
          label="Invite member"
          overflow="never"
          variant="primary"
          (activated)="run('invite')"
        >
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>

        <ng-template hellToolbarSeparator />

        <ng-template hellToolbarAction label="Filter" iconOnly (activated)="run('filter')">
          <hell-icon name="faSolidFilter" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Export" iconOnly (activated)="run('export')">
          <hell-icon name="faSolidDownload" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Columns" iconOnly (activated)="run('columns')">
          <hell-icon name="faSolidTableColumns" size="13px" />
        </ng-template>

        <ng-template hellToolbarWidget>
          <label
            class="flex items-center gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface px-hell-2 py-hell-1 text-hell-foreground-muted focus-within:border-hell-border-strong"
          >
            <hell-icon name="faSolidMagnifyingGlass" size="12px" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search members"
              placeholder="Search members"
              class="w-36 border-0 bg-transparent text-sm text-hell-foreground outline-none placeholder:text-hell-foreground-subtle"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </label>
        </ng-template>

        <ng-template
          hellToolbarAction
          label="Remove selected"
          overflow="always"
          (activated)="run('remove')"
        >
          <hell-icon name="faSolidXmark" size="13px" />
        </ng-template>
      </hell-overflow-toolbar>

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
            @for (member of visibleMembers(); track member.name) {
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
  protected readonly query = signal('');
  protected readonly lastAction = signal('none yet');

  protected readonly visibleMembers = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle) return MEMBERS;
    return MEMBERS.filter((member) => member.name.toLowerCase().includes(needle));
  });

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
