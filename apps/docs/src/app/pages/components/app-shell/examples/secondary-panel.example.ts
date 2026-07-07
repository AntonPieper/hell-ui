import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidGauge, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_APP_SHELL_SECONDARY_ICONS = {
  faSolidGauge,
  faSolidUsers,
};

@Component({
  selector: 'app-app-shell-secondary-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_DIRECTIVES, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_SECONDARY_ICONS)],
  template: `
    <div hellAppShell class="h-[26rem] overflow-hidden rounded-hell-lg border border-hell-border">
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
          <hell-icon hellNavItemIcon name="faSolidUsers" size="14px" />
          <span hellNavItemLabel>Team</span>
        </a>
      </nav>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Activity feed as a secondary panel</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Click the <em>Activity</em> header row (an <code>appearance="header"</code> toggle) to hide
          the panel. Once hidden, the whole collapsed rail becomes the
          <code>appearance="rail"</code> toggle that brings it back.
        </p>
      </main>

      <aside hellAppSecondary>
        <!-- Shown only while collapsed; fills the whole rail as one click target. -->
        <button hellSecondaryToggle appearance="rail" type="button"></button>
        <div hellAppSecondaryBody>
          <!-- The full header row doubles as the collapse affordance. -->
          <button hellSecondaryToggle appearance="header" type="button">Activity</button>
          <ul class="m-0 list-none space-y-2 p-hell-4 text-sm text-hell-foreground-muted">
            <li>You opened <strong>Project Atlas</strong></li>
            <li>3 deploys today</li>
            <li>2 unread comments</li>
          </ul>
        </div>
      </aside>
    </div>
  `,
})
export class AppShellSecondaryPanelExample {}
