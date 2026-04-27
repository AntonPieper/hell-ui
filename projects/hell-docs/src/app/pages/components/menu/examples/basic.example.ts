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
  selector: 'app-menu-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  providers: [provideIcons(HD_MENU_PAGE_ICONS)],
  template: `
    <button hellButton [hellMenuTrigger]="basic" placement="bottom-start">Actions</button>

    <ng-template #basic>
      <div hellMenu>
        <button hellMenuItem type="button" (click)="onAction('rename')">Rename</button>
        <button hellMenuItem type="button" (click)="onAction('duplicate')">Duplicate</button>
        <div hellMenuSeparator></div>
        <button hellMenuItem type="button" disabled>Move (disabled)</button>
        <button hellMenuItem type="button" (click)="onAction('archive')">Archive</button>
        <div hellMenuSeparator></div>
        <button hellMenuItem type="button" class="hd-danger-text" (click)="onAction('delete')">
          Delete
        </button>
      </div>
    </ng-template>
  `,
})
export class MenuBasicExample {
  protected onAction(name: string) {
    console.log('menu action:', name);
  }
}
