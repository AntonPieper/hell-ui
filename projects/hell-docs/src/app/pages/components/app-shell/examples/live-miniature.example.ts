import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon } from 'hell';

const HD_APP_SHELL_PAGE_ICONS = {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
};
@Component({
  selector: 'app-app-shell-live-miniature-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_PAGE_ICONS)],
  template: `
    <div hellAppShell class="h-96 overflow-hidden rounded-lg border border-hell-border">
      <header hellAppTopbar class="hd-surface-elevated">
        <button hellSidenavToggle appearance="shell" type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav class="hd-surface-elevated">
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

        <div hellNavSection>
          <button type="button" hellNavSectionToggle>Settings</button>
          <div hellNavSectionItems>
            <a hellNavItem href="#" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidGear" size="14px" />
              <span hellNavItemLabel>Preferences</span>
            </a>
            <a hellNavItem href="#" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidKey" size="14px" />
              <span hellNavItemLabel>API keys</span>
            </a>
          </div>
        </div>
      </nav>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Welcome back</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Sections in the sidenav (e.g. <em>Settings</em>) collapse on click. When the rail itself
          is collapsed, section toggles disappear and items remain reachable as icons.
        </p>
        <div class="mt-4 flex gap-2">
          <button hellButton variant="primary" size="sm" type="button">New project</button>
          <button hellButton variant="ghost" size="sm" type="button">Invite</button>
        </div>
      </main>

      <aside hellAppSecondary class="hd-surface-subtle">
        <button hellSecondaryToggle appearance="rail" type="button"></button>
        <div hellAppSecondaryBody>
          <button hellSecondaryToggle appearance="header" type="button">Activity</button>
          <ul class="m-0 list-none space-y-2 p-4 text-sm text-hell-foreground-muted">
            <li>You opened <strong>Project Atlas</strong></li>
            <li>3 deploys today</li>
            <li>2 unread comments</li>
          </ul>
        </div>
      </aside>
    </div>
  `,
})
export class AppShellLiveMiniatureExample {}
