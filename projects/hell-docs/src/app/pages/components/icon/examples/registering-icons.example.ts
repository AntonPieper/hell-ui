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
import { HellIcon } from '@hell-ui/angular/icon';

const HD_ICON_PAGE_ICONS = {
  faSolidArrowDown,
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidPhone,
  faSolidTriangleExclamation,
  faSolidXmark,
};
@Component({
  selector: 'app-icon-registering-icons-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons(HD_ICON_PAGE_ICONS)],
  template: `
    <hell-icon name="faSolidCircleCheck" size="20px" />
    <span class="text-sm text-hell-foreground-muted">
      Register icons close to the component that renders them.
    </span>
  `,
})
export class IconRegisteringIconsExample {}
