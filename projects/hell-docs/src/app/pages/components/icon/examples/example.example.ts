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
  selector: 'app-icon-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons(HD_ICON_PAGE_ICONS)],
  template: `
    <span class="text-hell-success"><hell-icon name="faSolidCircleCheck" /></span>
    <span class="text-hell-info"><hell-icon name="faSolidCircleInfo" /></span>
    <span class="text-hell-warning"><hell-icon name="faSolidTriangleExclamation" /></span>
    <span class="text-hell-danger"><hell-icon name="faSolidXmark" /></span>
  `,
})
export class IconExampleExample {}
