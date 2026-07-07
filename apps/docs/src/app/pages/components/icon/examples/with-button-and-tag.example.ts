import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidCircleCheck,
  faSolidPhone,
  faSolidTriangleExclamation,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellTag } from '@hell-ui/angular/tag';

const WITH_BUTTON_AND_TAG_EXAMPLE_ICONS = {
  faSolidCircleCheck,
  faSolidPhone,
  faSolidTriangleExclamation,
};

@Component({
  selector: 'app-icon-with-button-and-tag-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellTag],
  providers: [provideIcons(WITH_BUTTON_AND_TAG_EXAMPLE_ICONS)],
  template: `
    <div class="flex items-center justify-between gap-hell-4 rounded-hell-md border border-hell-border p-hell-3">
      <div class="flex items-center gap-hell-2">
        <span hellTag variant="success">
          <hell-icon name="faSolidCircleCheck" />
          Online
        </span>
        <span class="text-sm text-hell-foreground">Trunk SIP-04</span>
      </div>
      <button hellButton variant="primary" size="sm" type="button">
        <hell-icon name="faSolidPhone" />
        Call
      </button>
    </div>

    <div class="flex items-center justify-between gap-hell-4 rounded-hell-md border border-hell-border p-hell-3">
      <div class="flex items-center gap-hell-2">
        <span hellTag variant="danger">
          <hell-icon name="faSolidTriangleExclamation" />
          Degraded
        </span>
        <span class="text-sm text-hell-foreground">Trunk SIP-07</span>
      </div>
      <button hellButton variant="ghost" size="sm" type="button" disabled>
        <hell-icon name="faSolidPhone" />
        Call
      </button>
    </div>
  `,
})
export class IconWithButtonAndTagExample {}
