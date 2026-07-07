import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidTriangleExclamation,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';

const ICON_COLORS_EXAMPLE_ICONS = {
  faSolidCircleCheck,
  faSolidCircleInfo,
  faSolidTriangleExclamation,
  faSolidXmark,
};

@Component({
  selector: 'app-icon-colors-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons(ICON_COLORS_EXAMPLE_ICONS)],
  template: `
    <span class="text-hell-success"><hell-icon name="faSolidCircleCheck" /></span>
    <span class="text-hell-info"><hell-icon name="faSolidCircleInfo" /></span>
    <span class="text-hell-warning"><hell-icon name="faSolidTriangleExclamation" /></span>
    <span class="text-hell-danger"><hell-icon name="faSolidXmark" /></span>
    <hell-icon name="faSolidCircleInfo" color="var(--color-hell-primary)" />
  `,
})
export class IconColorsExample {}
