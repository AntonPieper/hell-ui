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
import { HellButton, HellIcon } from 'hell';

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
  selector: 'app-button-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  providers: [provideIcons(HD_BUTTON_PAGE_ICONS)],
  template: `
    <button hellButton size="xs">XS</button>
    <button hellButton size="sm">Small</button>
    <button hellButton size="md">Medium</button>
    <button hellButton size="lg">Large</button>
    <button hellButton size="xl">XL</button>
  `,
})
export class ButtonSizesExample {}
