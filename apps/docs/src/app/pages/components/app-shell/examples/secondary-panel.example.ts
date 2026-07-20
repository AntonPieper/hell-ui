import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidGauge, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_APP_SHELL_SECONDARY_ICONS = {
  faSolidGauge,
  faSolidUsers,
};

/** Nav item recipe over the sidenav's `data-collapsed` shell state attribute. */
const NAV_ITEM =
  'flex cursor-pointer items-center gap-hell-3 rounded-md px-3 py-2 text-[13px] font-medium text-hell-foreground-muted no-underline hover:bg-hell-surface-subtle hover:text-hell-foreground aria-[current=page]:bg-hell-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-hell-primary in-data-[collapsed=true]:justify-center in-data-[collapsed=true]:px-0';
const NAV_ICON =
  'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle';
const NAV_LABEL = 'flex-1 truncate in-data-[collapsed=true]:hidden';

@Component({
  selector: 'app-app-shell-secondary-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_IMPORTS, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_SECONDARY_ICONS)],
  template: `
    <div hellAppShell class="h-[26rem] overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        <a [class]="navItem" href="#" aria-label="Dashboard" aria-current="page" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidGauge" size="14px" />
          <span [class]="navLabel">Dashboard</span>
        </a>
        <a [class]="navItem" href="#" aria-label="Team" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidUsers" size="14px" />
          <span [class]="navLabel">Team</span>
        </a>
      </nav>

      <main hellAppContent tabindex="0">
        <h3 class="m-0 text-base font-semibold">Activity feed as a secondary panel</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Click the <em>Activity</em> header row to hide the panel. Once hidden, the whole collapsed
          rail becomes the toggle that brings it back. The shipped stylesheet derives both visual
          treatments from where each button is projected.
        </p>
      </main>

      <aside hellAppSecondary>
        <!-- A direct toggle child becomes the collapsed rail's full-size click target. -->
        <button hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>
          <!-- A direct body child becomes the full-width header collapse affordance. -->
          <button hellSecondaryToggle type="button">Activity</button>
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
export class AppShellSecondaryPanelExample {
  protected readonly navItem = NAV_ITEM;
  protected readonly navIcon = NAV_ICON;
  protected readonly navLabel = NAV_LABEL;
}
