import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidPhone } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';

@Component({
  selector: 'app-icon-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons({ faSolidPhone })],
  template: `
    <hell-icon name="faSolidPhone" size="14px" />
    <hell-icon name="faSolidPhone" size="20px" />
    <hell-icon name="faSolidPhone" size="32px" />
    <hell-icon name="faSolidPhone" size="48px" />
  `,
})
export class IconSizesExample {}
