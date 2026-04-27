import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HellButton, HellIcon, HELL_MENU_DIRECTIVES } from 'hell';

const HD_MENU_PAGE_ICONS = {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
};
@Component({
  selector: 'app-menu-with-icons-sections-submenus-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, ...HELL_MENU_DIRECTIVES],
  providers: [provideIcons(HD_MENU_PAGE_ICONS)],
  template: `
    <button hellButton [hellMenuTrigger]="rich" placement="bottom-start">File</button>

    <ng-template #rich>
      <div hellMenu>
        <div hellMenuSection>
          <div hellMenuLabel>Document</div>
          <button hellMenuItem type="button" (click)="onAction('new')">
            <hell-icon name="faSolidPenToSquare" />
            <span>New file</span>
            <span hellMenuItemTrailing>⌘N</span>
          </button>
          <button hellMenuItem type="button" (click)="onAction('open')">
            <hell-icon name="faSolidFolderOpen" />
            <span>Open…</span>
            <span hellMenuItemTrailing>⌘O</span>
          </button>
          <button hellMenuItem type="button" [hellSubmenuTrigger]="recent">
            <hell-icon name="faSolidClock" />
            <span>Open recent</span>
          </button>
        </div>

        <div hellMenuSeparator></div>

        <div hellMenuSection>
          <div hellMenuLabel>Share</div>
          <button hellMenuItem type="button" (click)="onAction('export')">
            <hell-icon name="faSolidShareNodes" />
            <span>Share link</span>
          </button>
          <button hellMenuItem type="button" (click)="onAction('download')">
            <hell-icon name="faSolidDownload" />
            <span>Download</span>
            <span hellMenuItemTrailing>⌘⇧D</span>
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template #recent>
      <div hellMenu>
        <button hellMenuItem type="button" (click)="onAction('recent:atlas')">Project Atlas</button>
        <button hellMenuItem type="button" (click)="onAction('recent:nova')">Nova roadmap</button>
        <button hellMenuItem type="button" (click)="onAction('recent:pulse')">Pulse weekly</button>
      </div>
    </ng-template>
  `,
})
export class MenuWithIconsSectionsSubmenusExample {
  protected onAction(name: string) {
    console.log('menu action:', name);
  }
}
