import { ChangeDetectionStrategy, Component } from '@angular/core';
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
import { HellButton } from 'hell-ui/button';
import { HellIcon } from 'hell-ui/icon';

const BUTTON_ICONS_EXAMPLE_ICONS = {
  faSolidChevronDown,
  faSolidDownload,
  faSolidGear,
  faSolidPenToSquare,
  faSolidPlus,
  faSolidUpload,
  faSolidXmark,
};

@Component({
  selector: 'app-button-icons-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon],
  providers: [provideIcons(BUTTON_ICONS_EXAMPLE_ICONS)],
  template: `
    <button hellButton variant="primary" type="button">
      <hell-icon name="faSolidUpload" />
      Upload
    </button>
    <button hellButton type="button">
      <hell-icon name="faSolidDownload" />
      Download
    </button>
    <button hellButton variant="ghost" type="button">
      More
      <hell-icon name="faSolidChevronDown" />
    </button>

    <button hellButton iconOnly variant="soft" type="button" aria-label="Edit">
      <hell-icon name="faSolidPenToSquare" />
    </button>
    <button hellButton iconOnly variant="ghost" type="button" aria-label="Settings">
      <hell-icon name="faSolidGear" />
    </button>
    <button hellButton iconOnly variant="primary" type="button" aria-label="Add">
      <hell-icon name="faSolidPlus" />
    </button>
    <button hellButton iconOnly variant="danger" type="button" aria-label="Remove">
      <hell-icon name="faSolidXmark" />
    </button>
  `,
})
export class ButtonIconsExample {}
