import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';

const MENU_SECTIONS_ICONS = {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
};

@Component({
  selector: 'app-menu-sections-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, ...HELL_MENU_IMPORTS],
  providers: [provideIcons(MENU_SECTIONS_ICONS)],
  template: `
    <button hellButton [hellMenuTrigger]="file" type="button">File</button>

    <ng-template #file>
      <div hellMenu>
        <div hellMenuSection>
          <div hellMenuLabel>Document</div>
          <button hellMenuItem type="button" (click)="run('new')">
            <hell-icon hellMenuItemIcon name="faSolidPenToSquare" size="14px" />
            <span>New file</span>
            <span hellMenuItemTrailing>⌘N</span>
          </button>
          <button hellMenuItem type="button" (click)="run('open')">
            <hell-icon hellMenuItemIcon name="faSolidFolderOpen" size="14px" />
            <span>Open…</span>
            <span hellMenuItemTrailing>⌘O</span>
          </button>
          <button hellMenuItem type="button" [hellSubmenuTrigger]="recent">
            <hell-icon hellMenuItemIcon name="faSolidClock" size="14px" />
            <span>Open recent</span>
          </button>
        </div>

        <div hellMenuSeparator></div>

        <div hellMenuSection>
          <div hellMenuLabel>Share</div>
          <button hellMenuItem type="button" (click)="run('share')">
            <hell-icon hellMenuItemIcon name="faSolidShareNodes" size="14px" />
            <span>Share link</span>
          </button>
          <button hellMenuItem type="button" (click)="run('download')">
            <hell-icon hellMenuItemIcon name="faSolidDownload" size="14px" />
            <span>Download</span>
            <span hellMenuItemTrailing>⌘⇧D</span>
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template #recent>
      <div hellMenu>
        <button hellMenuItem type="button" (click)="run('recent:atlas')">Project Atlas</button>
        <button hellMenuItem type="button" (click)="run('recent:nova')">Nova roadmap</button>
        <button hellMenuItem type="button" (click)="run('recent:pulse')">Pulse weekly</button>
      </div>
    </ng-template>
  `,
})
export class MenuSectionsExample {
  protected run(action: string): void {
    console.log('menu action:', action);
  }
}
