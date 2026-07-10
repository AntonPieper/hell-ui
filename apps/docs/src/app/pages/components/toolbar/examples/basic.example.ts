import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidCopy,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-toolbar-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideIcons({
      faSolidPlus,
      faSolidPenToSquare,
      faSolidCopy,
      faSolidShareNodes,
      faSolidDownload,
      faSolidGear,
    }),
  ],
  imports: [HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-hell-3">
      <hell-toolbar label="Document actions">
        <ng-template hellToolbarAction label="New" priority="primary" (activated)="run('new')">
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Edit" (activated)="run('edit')">
          <hell-icon name="faSolidPenToSquare" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Duplicate" (activated)="run('duplicate')">
          <hell-icon name="faSolidCopy" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Share" (activated)="run('share')">
          <hell-icon name="faSolidShareNodes" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Download" (activated)="run('download')">
          <hell-icon name="faSolidDownload" size="13px" />
        </ng-template>
        <ng-template
          hellToolbarAction
          label="Settings"
          priority="overflowOnly"
          (activated)="run('settings')"
        >
          <hell-icon name="faSolidGear" size="13px" />
        </ng-template>
      </hell-toolbar>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Last action: <strong>{{ lastAction() }}</strong>. Narrow the preview to watch lower-priority
        actions collapse into the overflow menu; “New” always stays visible and “Settings” always
        lives in the menu.
      </p>
    </div>
  `,
})
export class ToolbarBasicExample {
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
