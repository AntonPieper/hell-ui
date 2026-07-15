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
import { HellButton } from '@hell-ui/angular/button';
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
  imports: [HellButton, HellIcon, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-hell-3">
      <div hellToolbar label="Document actions" ui="flex-wrap">
        <button hellButton hellToolbarItem size="sm" type="button" (click)="run('new')">
          <hell-icon name="faSolidPlus" size="13px" />
          New
        </button>
        <button hellButton hellToolbarItem size="sm" type="button" (click)="run('edit')">
          <hell-icon name="faSolidPenToSquare" size="13px" />
          Edit
        </button>
        <button hellButton hellToolbarItem size="sm" type="button" (click)="run('duplicate')">
          <hell-icon name="faSolidCopy" size="13px" />
          Duplicate
        </button>
        <button hellButton hellToolbarItem size="sm" type="button" (click)="run('share')">
          <hell-icon name="faSolidShareNodes" size="13px" />
          Share
        </button>
        <button hellButton hellToolbarItem size="sm" type="button" (click)="run('download')">
          <hell-icon name="faSolidDownload" size="13px" />
          Download
        </button>
        <button
          hellButton
          hellToolbarItem
          size="sm"
          type="button"
          (click)="run('settings')"
        >
          <hell-icon name="faSolidGear" size="13px" />
          Settings
        </button>
      </div>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Last action: <strong>{{ lastAction() }}</strong>. The toolbar owns the role and roving focus;
        each real button, click handler, and wrapping layout stays consumer-owned.
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
