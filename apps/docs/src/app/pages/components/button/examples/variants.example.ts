import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChevronDown,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidUpload,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_BUTTON_PAGE_ICONS = {
  faSolidChevronDown,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidUpload,
  faSolidXmark,
};
@Component({
  selector: 'app-button-variants-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  template: `
    <button hellButton variant="primary">Primary</button>
    <button hellButton variant="default">Default</button>
    <button hellButton variant="soft">Soft</button>
    <button hellButton variant="ghost">Ghost</button>
    <a hellButton variant="link" href="#" (click)="$event.preventDefault()">Link</a>
    <button hellButton variant="danger">Danger</button>
    <button hellButton variant="success">Success</button>
    <button hellButton variant="primary" disabled>Disabled</button>
  `,
})
export class ButtonVariantsExample {}
