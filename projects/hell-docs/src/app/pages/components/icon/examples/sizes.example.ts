import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from 'hell';

const HD_ICON_PAGE_ICONS = {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
};
@Component({
  selector: 'app-icon-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons(HD_ICON_PAGE_ICONS)],
  template: `
    <span class="text-[14px]"><hell-icon name="faSolidPhone" /></span>
    <span class="text-[20px]"><hell-icon name="faSolidPhone" /></span>
    <span class="text-[32px]"><hell-icon name="faSolidPhone" /></span>
    <span class="text-[48px]"><hell-icon name="faSolidPhone" /></span>
  `,
})
export class IconSizesExample {}
