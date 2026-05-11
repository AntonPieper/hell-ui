import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell/composites';
import { HellButton, HellIcon } from 'hell/primitives';

const HD_APP_SHELL_PAGE_ICONS = {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
};
@Component({
  selector: 'app-app-shell-markup-skeleton-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  providers: [provideIcons(HD_APP_SHELL_PAGE_ICONS)],
  template: `
    <p class="m-0 text-sm text-hell-foreground-muted">
      Start every app shell with named slots: topbar, sidenav, content and optional secondary. Add
      the shell and secondary toggle classes when you want the built-in chrome affordances.
    </p>
  `,
})
export class AppShellMarkupSkeletonExample {
  readonly collapsed = signal(false);
  protected readonly settingsCollapsed = signal(false);
}
