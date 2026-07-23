import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGauge, faSolidUsers } from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HellIcon } from 'hell-ui/icon';

const HD_APP_SHELL_BASIC_ICONS = {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidUsers,
};

/**
 * Nav item recipe — plain anchors styled over the shell's stable state
 * attributes. `in-data-[collapsed=true]:*` keys off the sidenav's
 * `data-collapsed` attribute, so labels hide and icons center in rail mode.
 */
const NAV_ITEM =
  'flex cursor-pointer items-center gap-hell-3 rounded-md px-3 py-2 text-[13px] font-medium text-hell-foreground-muted no-underline hover:bg-hell-surface-subtle hover:text-hell-foreground aria-[current=page]:bg-hell-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-hell-primary in-data-[collapsed=true]:justify-center in-data-[collapsed=true]:px-0';
const NAV_ICON =
  'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle';
const NAV_LABEL = 'flex-1 truncate in-data-[collapsed=true]:hidden';

@Component({
  selector: 'app-app-shell-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_IMPORTS, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_BASIC_ICONS)],
  template: `
    <!-- The shell fills its container; the docs give it a fixed height + border. -->
    <div hellAppShell class="h-96 overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        <a [class]="navItem" href="#" aria-label="Dashboard" aria-current="page" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidGauge" size="14px" />
          <span [class]="navLabel">Dashboard</span>
        </a>
        <a [class]="navItem" href="#" aria-label="Projects" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidFolderOpen" size="14px" />
          <span [class]="navLabel">Projects</span>
        </a>
        <a [class]="navItem" href="#" aria-label="Team" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidUsers" size="14px" />
          <span [class]="navLabel">Team</span>
        </a>
      </nav>

      <main hellAppContent tabindex="0">
        <h3 class="m-0 text-base font-semibold">Dashboard</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Click the bars button to collapse the sidenav to an icon rail. The grid columns animate
          purely in CSS, and the nav items are plain anchors styled by the recipe classes above.
        </p>
      </main>
    </div>
  `,
})
export class AppShellBasicExample {
  protected readonly navItem = NAV_ITEM;
  protected readonly navIcon = NAV_ICON;
  protected readonly navLabel = NAV_LABEL;
}
