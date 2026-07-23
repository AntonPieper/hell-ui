import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleInfo } from '@ng-icons/font-awesome/solid';
import { HellIcon } from 'hell-ui/icon';

@Component({
  selector: 'app-icon-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons({ faSolidCircleInfo })],
  template: `<hell-icon name="faSolidCircleInfo" />`,
})
export class IconBasicExample {}
