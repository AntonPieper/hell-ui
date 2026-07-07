import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-menu-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  template: `
    <button hellButton [hellMenuTrigger]="actions" type="button">Actions</button>

    <ng-template #actions>
      <div hellMenu>
        <button hellMenuItem type="button" (click)="run('rename')">Rename</button>
        <button hellMenuItem type="button" (click)="run('duplicate')">Duplicate</button>
        <button hellMenuItem type="button" disabled>Move</button>
        <div hellMenuSeparator></div>
        <button hellMenuItem type="button" class="hd-danger-text" (click)="run('delete')">
          Delete
        </button>
      </div>
    </ng-template>
  `,
})
export class MenuBasicExample {
  protected run(action: string): void {
    console.log('menu action:', action);
  }
}
