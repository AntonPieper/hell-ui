import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidBell } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';

@Component({
  selector: 'app-icon-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon],
  providers: [provideIcons({ faSolidBell })],
  template: `
    <!-- ui string shorthand refines the icon's only public part, root. -->
    <hell-icon name="faSolidBell" ui="text-[28px] text-hell-primary" />
    <!-- The map form is equivalent for the single root part. -->
    <hell-icon name="faSolidBell" [ui]="rootUi" />
  `,
})
export class IconStylingExample {
  protected readonly rootUi = {
    root: 'rounded-hell-sm bg-hell-primary-soft p-hell-1 text-[20px] text-hell-primary',
  };
}
