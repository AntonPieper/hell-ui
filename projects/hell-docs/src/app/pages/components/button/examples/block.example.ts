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
import { HellButton, HellIcon } from '@hell-ui/angular/primitives';

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
  selector: 'app-button-block-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  template: ` <button hellButton variant="primary" block>Continue</button> `,
})
export class ButtonBlockExample {}
