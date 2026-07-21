import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidGauge,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from '@hell-ui/angular/app-shell';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_APP_SHELL_STYLING_ICONS = {
  faSolidGauge,
  faSolidUsers,
};

/**
 * Because nav items are consumer-owned markup, theming them needs no Part
 * Style Map: the recipe classes are the styling surface. This variant swaps
 * the neutral tokens for primary-tinted ones.
 */
const NAV_ITEM =
  'flex cursor-pointer items-center gap-hell-3 rounded-hell-lg px-3 py-2 text-[13px] font-semibold text-hell-foreground-muted no-underline hover:bg-hell-surface-subtle hover:text-hell-foreground aria-[current=page]:bg-hell-primary aria-[current=page]:text-white in-data-[collapsed=true]:justify-center in-data-[collapsed=true]:px-0';
const NAV_ICON = 'inline-flex w-4 shrink-0 items-center justify-center text-hell-primary';
const NAV_LABEL = 'flex-1 truncate in-data-[collapsed=true]:hidden';
const NAV_TRAILING = 'font-bold text-hell-primary in-data-[collapsed=true]:hidden';

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
        <button hellSidenavToggle type="button" ui="text-hell-primary"></button>
        <strong class="text-hell-primary">Aurora</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary" ui="bg-hell-surface-subtle gap-hell-1">
        <a
          [class]="navItem"
          href="#"
          aria-label="Dashboard"
          aria-current="page"
          (click)="$event.preventDefault()"
        >
          <hell-icon [class]="navIcon" name="faSolidGauge" size="14px" />
          <span [class]="navLabel">Dashboard</span>
        </a>
        <a [class]="navItem" href="#" aria-label="Team" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidUsers" size="14px" />
          <span [class]="navLabel">Team</span>
          <span [class]="navTrailing">3</span>
        </a>
      </nav>

      <main hellAppContent tabindex="0" ui="bg-hell-surface p-hell-8">
        <h3 class="m-0 text-base font-semibold text-hell-primary">Themed shell</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Each slot's <code>ui</code> shorthand refines only that directive's <code>root</code> part;
          Hell's Tailwind merge keeps the recipe's behavior classes while your utilities win the
          conflicts. The nav items are consumer-owned anchors, so their classes are edited directly.
        </p>
      </main>

      <aside hellAppSecondary ui="bg-hell-surface-subtle border-l-hell-primary">
        <button hellSecondaryToggle type="button" ui="text-hell-primary"></button>
        <div hellAppSecondaryBody ui="opacity-100">
          <button hellSecondaryToggle type="button" ui="text-hell-primary">
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
export class AppShellStylingExample {
  protected readonly navItem = NAV_ITEM;
  protected readonly navIcon = NAV_ICON;
  protected readonly navLabel = NAV_LABEL;
  protected readonly navTrailing = NAV_TRAILING;
}
