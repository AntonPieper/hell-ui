import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBoxOpen,
  faSolidCopy,
  faSolidDownload,
  faSolidFilter,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-toolbar-overflow-policies-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidPlus,
      faSolidPenToSquare,
      faSolidFilter,
      faSolidCopy,
      faSolidDownload,
      faSolidGear,
      faSolidBoxOpen,
    }),
  ],
  imports: [HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-hell-3">
      <div class="max-w-[360px] rounded-hell-md border border-hell-border bg-hell-surface p-hell-3">
        <hell-overflow-toolbar label="Record actions">
          <ng-template hellToolbarAction label="New" overflow="never" (activated)="run('new')">
            <hell-icon name="faSolidPlus" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Edit" (activated)="run('edit')">
            <hell-icon name="faSolidPenToSquare" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Filter" (activated)="run('filter')">
            <hell-icon name="faSolidFilter" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Duplicate" (activated)="run('duplicate')">
            <hell-icon name="faSolidCopy" size="13px" />
          </ng-template>
          <ng-template hellToolbarAction label="Export" (activated)="run('export')">
            <hell-icon name="faSolidDownload" size="13px" />
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Settings"
            overflow="always"
            (activated)="run('settings')"
          >
            <hell-icon name="faSolidGear" size="13px" />
          </ng-template>
          <ng-template
            hellToolbarAction
            label="Archive"
            overflow="always"
            (activated)="run('archive')"
          >
            <hell-icon name="faSolidBoxOpen" size="13px" />
          </ng-template>
        </hell-overflow-toolbar>
      </div>

      <p class="m-0 text-sm text-hell-foreground-muted">
        A deliberately narrow container: “New” uses <code>never</code>, the middle actions use the
        default <code>auto</code> policy, and “Settings” and “Archive” use <code>always</code>. Last
        action: <strong>{{ lastAction() }}</strong>.
      </p>
    </div>
  `,
})
export class ToolbarOverflowPoliciesExample {
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
