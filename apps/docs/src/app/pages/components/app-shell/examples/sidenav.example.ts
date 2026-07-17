import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellChip } from '@hell-ui/angular/chip';

const HD_APP_SHELL_SIDENAV_ICONS = {
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidUsers,
};

@Component({
  selector: 'app-app-shell-sidenav-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_IMPORTS, HellIcon, HellChip],
  providers: [provideIcons(HD_APP_SHELL_SIDENAV_ICONS)],
  template: `
    <div hellAppShell class="h-[28rem] overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        <a hellNavItem href="#" aria-label="Dashboard" aria-current="page" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidGauge" size="14px" />
          <span hellNavItemLabel>Dashboard</span>
        </a>
        <a hellNavItem href="#" aria-label="Inbox" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidInbox" size="14px" />
          <span hellNavItemLabel>Inbox</span>
          <span hellNavItemTrailing hellChip variant="primary">12</span>
        </a>
        <a hellNavItem href="#" aria-label="Team" (click)="$event.preventDefault()">
          <hell-icon hellNavItemIcon name="faSolidUsers" size="14px" />
          <span hellNavItemLabel>Team</span>
        </a>

        <!-- A collapsible group. The toggle owns aria-expanded and collapse state. -->
        <div hellNavSection>
          <button type="button" hellNavSectionToggle>Settings</button>
          <div hellNavSectionItems>
            <a hellNavItem href="#" aria-label="Preferences" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidGear" size="14px" />
              <span hellNavItemLabel>Preferences</span>
            </a>
            <a hellNavItem href="#" aria-label="API keys" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidKey" size="14px" />
              <span hellNavItemLabel>API keys</span>
            </a>
          </div>
        </div>
      </nav>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Navigation anatomy</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          <code>hellNavItem</code> composes an icon, label, and trailing slot. Click
          <em>Settings</em> to collapse its section; collapse the whole rail to see items fall back
          to icon-only mode with an automatic divider.
        </p>
      </main>
    </div>
  `,
})
export class AppShellSidenavExample {}
