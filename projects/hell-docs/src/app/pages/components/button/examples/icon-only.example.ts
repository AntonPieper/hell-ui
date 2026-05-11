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
import { HellButton, HellIcon } from 'hell/primitives';

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
  selector: 'app-button-icon-only-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon],
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  template: `
    @for (size of ['xs', 'sm', 'md', 'lg', 'xl']; track size) {
      <button hellButton iconOnly [size]="$any(size)" aria-label="Settings">
        <hell-icon name="faSolidGear" />
      </button>
    }
    <button hellButton iconOnly variant="primary" aria-label="Add">
      <hell-icon name="faSolidPlus" />
    </button>
    <button hellButton iconOnly variant="soft" aria-label="Edit">
      <hell-icon name="faSolidPenToSquare" />
    </button>
    <button hellButton iconOnly variant="ghost" aria-label="Delete">
      <hell-icon name="faSolidXmark" />
    </button>
    <button hellButton iconOnly variant="danger" aria-label="Delete">
      <hell-icon name="faSolidXmark" />
    </button>
  `,
})
export class ButtonIconOnlyExample {}
