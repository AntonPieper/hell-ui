import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGauge, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_APP_SHELL_BASIC_ICONS = {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidUsers,
};

@Component({
  selector: 'app-app-shell-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_DIRECTIVES, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_BASIC_ICONS)],
  template: `
    <!-- The shell fills its container; the docs give it a fixed height + border. -->
    <div hellAppShell class="h-96 overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle appearance="shell" type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        <a hellNavItem href="#" aria-current="page" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidGauge" size="14px" />
          <span hellNavItemLabel>Dashboard</span>
        </a>
        <a hellNavItem href="#" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidFolderOpen" size="14px" />
          <span hellNavItemLabel>Projects</span>
        </a>
        <a hellNavItem href="#" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidUsers" size="14px" />
          <span hellNavItemLabel>Team</span>
        </a>
      </nav>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Dashboard</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Click the bars button to collapse the sidenav to an icon rail. The grid columns animate
          purely in CSS.
        </p>
      </main>
    </div>
  `,
})
export class AppShellBasicExample {}
