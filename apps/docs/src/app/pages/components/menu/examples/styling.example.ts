import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-menu-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  template: `
    <button hellButton [hellMenuTrigger]="styled" placement="bottom-start">Bulk actions</button>

    <ng-template #styled>
      <!-- Menu panel and each item expose their own root Public Part. -->
      <div hellMenu ui="min-w-[220px] border-hell-primary">
        <button hellMenuItem type="button" ui="data-active:bg-hell-primary-soft">Approve</button>
        <button hellMenuItem type="button" ui="data-active:bg-hell-primary-soft">Reassign</button>
        <div hellMenuSeparator></div>
        <button hellMenuItem type="button" [ui]="{ root: 'text-hell-danger' }">Reject</button>
      </div>
    </ng-template>
  `,
})
export class MenuStylingExample {}
