import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidEllipsisVertical } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_CARD_IMPORTS } from '@hell-ui/angular/card';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellSeparator } from '@hell-ui/angular/separator';

@Component({
  selector: 'app-separator-with-card-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidEllipsisVertical })],
  imports: [HellButton, ...HELL_CARD_IMPORTS, HellIcon, HellSeparator],
  template: `
    <div hellCard class="max-w-95">
      <div hellCardHeader>
        <strong>Notification settings</strong>
        <button hellButton iconOnly variant="ghost" size="sm" type="button" aria-label="More actions">
          <hell-icon name="faSolidEllipsisVertical" />
        </button>
      </div>
      <div hellCardBody class="flex flex-col">
        <p class="m-0">Email — weekly digest and account alerts</p>
        <div hellSeparator spacing="sm"></div>
        <p class="m-0">Push — mentions and direct messages only</p>
        <div hellSeparator spacing="sm"></div>
        <p class="m-0">SMS — critical alerts only</p>
      </div>
    </div>
  `,
})
export class SeparatorWithCardExample {}
