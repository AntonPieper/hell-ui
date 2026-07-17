import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_APP_SHELL_STYLING_ICONS = {
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
};

@Component({
  selector: 'app-app-shell-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_IMPORTS, HellIcon],
  providers: [provideIcons(HD_APP_SHELL_STYLING_ICONS)],
  template: `
    <!-- Every directive's ui refines its own root part; each is independent. -->
    <div
      hellAppShell
      ui="rounded-hell-lg border border-hell-border"
      class="h-[28rem] overflow-hidden"
    >
      <header hellAppTopbar ui="bg-hell-primary-soft border-b-hell-primary">
        <button hellSidenavToggle appearance="shell" type="button" ui="text-hell-primary"></button>
        <strong class="text-hell-primary">Aurora</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary" ui="bg-hell-surface-subtle gap-hell-1">
        <a
          hellNavItem
          href="#"
          aria-current="page"
          ui="rounded-hell-lg aria-[current=page]:bg-hell-primary aria-[current=page]:text-white"
          (click)="$event.preventDefault()"
        >
          <hell-icon hellNavItemIcon name="faSolidGauge" size="14px" ui="text-hell-primary" />
          <span hellNavItemLabel ui="font-semibold">Dashboard</span>
        </a>
        <a
          hellNavItem
          href="#"
          ui="rounded-hell-lg"
          (click)="$event.preventDefault()"
        >
          <hell-icon hellNavItemIcon name="faSolidUsers" size="14px" ui="text-hell-primary" />
          <span hellNavItemLabel ui="font-semibold">Team</span>
          <span hellNavItemTrailing ui="text-hell-primary font-bold">3</span>
        </a>

        <div hellNavSection ui="mt-hell-2 rounded-hell-md bg-hell-surface p-hell-1">
          <button type="button" hellNavSectionToggle ui="text-hell-primary rounded-hell-md">
            Admin
          </button>
          <div hellNavSectionItems ui="gap-hell-1">
            <a hellNavItem href="#" ui="rounded-hell-lg" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidGear" size="14px" ui="text-hell-primary" />
              <span hellNavItemLabel ui="font-semibold">Preferences</span>
            </a>
            <a hellNavItem href="#" ui="rounded-hell-lg" (click)="$event.preventDefault()">
              <hell-icon hellNavItemIcon name="faSolidKey" size="14px" ui="text-hell-primary" />
              <span hellNavItemLabel ui="font-semibold">API keys</span>
            </a>
          </div>
        </div>
      </nav>

      <main hellAppContent ui="bg-hell-surface p-hell-8">
        <h3 class="m-0 text-base font-semibold text-hell-primary">Themed shell</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Each slot's <code>ui</code> shorthand refines only that directive's <code>root</code> part;
          Hell's Tailwind merge keeps the recipe's behavior classes while your utilities win the
          conflicts.
        </p>
      </main>

      <aside hellAppSecondary ui="bg-hell-surface-subtle border-l-hell-primary">
        <button hellSecondaryToggle appearance="rail" type="button" ui="text-hell-primary"></button>
        <div hellAppSecondaryBody ui="opacity-100">
          <button
            hellSecondaryToggle
            appearance="header"
            type="button"
            ui="text-hell-primary"
          >
            Activity
          </button>
          <ul class="m-0 list-none space-y-2 p-hell-4 text-sm text-hell-foreground-muted">
            <li>2 deploys today</li>
            <li>1 open review</li>
          </ul>
        </div>
      </aside>
    </div>
  `,
})
export class AppShellStylingExample {}
