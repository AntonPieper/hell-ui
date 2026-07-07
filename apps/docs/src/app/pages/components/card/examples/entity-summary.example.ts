import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidEllipsisVertical } from '@ng-icons/font-awesome/solid';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_DIRECTIVES } from '@hell-ui/angular/card';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellTag } from '@hell-ui/angular/tag';

@Component({
  selector: 'app-card-entity-summary-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidEllipsisVertical })],
  imports: [...HELL_CARD_DIRECTIVES, HellAvatar, HellButton, HellIcon, HellTag],
  template: `
    <div hellCard class="max-w-95" [elevation]="2">
      <div hellCardHeader>
        <div class="flex items-center gap-3">
          <hell-avatar fallback="MK" />
          <div class="flex flex-col">
            <span>Mira Khatri</span>
            <span class="hd-muted text-xs font-normal">Account owner</span>
          </div>
        </div>
        <button hellButton iconOnly variant="ghost" size="sm" type="button" aria-label="More actions">
          <hell-icon name="faSolidEllipsisVertical" />
        </button>
      </div>
      <div hellCardBody class="flex flex-col gap-3">
        <p>Renewal due in 12 days. Usage is trending 18% above plan for the third month running.</p>
        <div class="flex flex-wrap gap-2">
          <span hellTag variant="warning">Renewal due</span>
          <span hellTag variant="info">Over plan</span>
        </div>
      </div>
      <div hellCardFooter>
        <button hellButton variant="ghost" type="button">View account</button>
        <button hellButton variant="primary" type="button">Start renewal</button>
      </div>
    </div>
  `,
})
export class CardEntitySummaryExample {}
