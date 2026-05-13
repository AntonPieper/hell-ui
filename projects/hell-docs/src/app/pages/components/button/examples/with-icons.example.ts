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
  selector: 'app-button-with-icons-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon],
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  template: `
    <button hellButton variant="primary">
      <hell-icon name="faSolidUpload" />
      Upload
    </button>
    <button hellButton>
      <hell-icon name="faSolidDownload" />
      Download
    </button>
    <button hellButton variant="ghost">
      More
      <hell-icon name="faSolidChevronDown" />
    </button>
  `,
})
export class ButtonWithIconsExample {}
