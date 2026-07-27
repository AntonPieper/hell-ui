import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HellIcon } from 'hell-ui/icon';
import { HellChip } from 'hell-ui/chip';

const HD_APP_SHELL_SIDENAV_ICONS = {
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidUsers,
};

/**
 * Nav item recipe over the sidenav's `data-collapsed` shell state attribute.
 * Rows take the sidenav's resting content width rather than the box the shell
 * is interpolating, so rail mode is pure motion: labels fade and icons slide to
 * the rail's center instead of the row re-laying-out on every frame.
 */
const NAV_ITEM =
  'flex w-[var(--hell-app-sidenav-content-width)] cursor-pointer items-center gap-hell-3 rounded-md px-3 py-2 text-[13px] font-medium text-hell-foreground-muted no-underline hover:bg-hell-surface-subtle hover:text-hell-foreground aria-[current=page]:bg-hell-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-hell-primary transition-[border-radius] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] in-data-[collapsed=true]:rounded-none';
const NAV_ICON =
  'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle transition-[translate] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] in-data-[collapsed=true]:translate-x-[calc((var(--hell-app-sidenav-collapsed-content-width)_-_100%)/2_-_calc(var(--spacing)_*_3))]';
const NAV_LABEL = 'flex-1 truncate transition-[opacity,visibility] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] in-data-[collapsed=true]:invisible in-data-[collapsed=true]:opacity-0';
const NAV_TRAILING = 'transition-[opacity,visibility] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] in-data-[collapsed=true]:invisible in-data-[collapsed=true]:opacity-0';

@Component({
  selector: 'app-app-shell-sidenav-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_IMPORTS, HellIcon, HellChip],
  providers: [provideIcons(HD_APP_SHELL_SIDENAV_ICONS)],
  // Collapsible group recipe: the app owns the expanded state and
  // `aria-expanded`, collapsed items leave the accessibility tree and tab
  // order through `visibility: hidden`, and the shell's stable
  // `[hellAppSidenav][data-collapsed='true']` attribute fades the heading out
  // behind a divider and force-expands the group so every item stays reachable
  // while the rail is icon-only. Rail mode animates the heading's height into
  // the divider's, so the items below glide instead of jumping a row.
  styles: `
    .nav-section {
      display: flex;
      width: var(--hell-app-sidenav-content-width);
      flex-direction: column;
    }

    .nav-section::before {
      content: '';
      display: block;
      flex: none;
      height: 0;
      margin-block: 0;
      margin-inline: calc(var(--spacing) * 2);
      opacity: 0;
      background-color: var(--color-hell-border);
      transition:
        height var(--hell-duration-base) var(--ease-hell-out),
        margin-block var(--hell-duration-base) var(--ease-hell-out),
        opacity var(--hell-duration-base) var(--ease-hell-out);
    }

    .nav-section-toggle {
      display: flex;
      width: 100%;
      /* An explicit line box gives the heading a real height to animate to
         zero, and stops it re-wrapping while the rail is narrow. */
      height: calc(14px + 2 * calc(var(--spacing) * 1.5));
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-hell-2);
      cursor: pointer;
      border: 0;
      background: transparent;
      margin: calc(var(--spacing) * 3) 0 0;
      padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 3);
      font: inherit;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      line-height: 14px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      color: var(--color-hell-foreground-subtle);
      border-radius: var(--radius-hell-sm);
      transition:
        height var(--hell-duration-base) var(--ease-hell-out),
        margin-top var(--hell-duration-base) var(--ease-hell-out),
        padding-block var(--hell-duration-base) var(--ease-hell-out),
        opacity var(--hell-duration-base) var(--ease-hell-out),
        visibility var(--hell-duration-base) var(--ease-hell-out);
    }

    .nav-section-toggle::after {
      content: '';
      height: 10px;
      width: 10px;
      background-color: currentcolor;
      -webkit-mask: var(--hell-icon-chevron-down) center / contain no-repeat;
      mask: var(--hell-icon-chevron-down) center / contain no-repeat;
      transition: transform var(--hell-duration-fast) var(--ease-hell-out);
    }

    .nav-section-toggle:hover {
      background: var(--color-hell-surface-subtle);
      color: var(--color-hell-foreground);
    }

    .nav-section-toggle:focus-visible {
      outline: 2px solid var(--color-hell-focus-ring);
      outline-offset: 1px;
    }

    .nav-section[data-expanded='false'] > .nav-section-toggle::after {
      transform: rotate(-90deg);
    }

    .nav-section-items {
      display: flex;
      flex-direction: column;
      gap: calc(var(--spacing) * 0.5);
      overflow: hidden;
      max-height: 2000px;
      transition:
        max-height var(--hell-duration-base) var(--ease-hell-out),
        opacity var(--hell-duration-fast) var(--ease-hell-out),
        visibility var(--hell-duration-fast) var(--ease-hell-out);
    }

    .nav-section[data-expanded='false'] > .nav-section-items {
      max-height: 0;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
    }

    [hellAppSidenav][data-collapsed='true'] .nav-section-toggle {
      height: 0;
      margin-top: 0;
      padding-block: 0;
      visibility: hidden;
      opacity: 0;
    }

    [hellAppSidenav][data-collapsed='true'] .nav-section::before {
      height: 1px;
      margin-block: calc(var(--spacing) * 2);
      opacity: 1;
    }

    [hellAppSidenav][data-collapsed='true'] .nav-section-items {
      max-height: 2000px;
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }
  `,
  template: `
    <div hellAppShell class="h-[28rem] overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
        <strong>Acme Console</strong>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        <a [class]="navItem" href="#" aria-label="Dashboard" aria-current="page" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidGauge" size="14px" />
          <span [class]="navLabel">Dashboard</span>
        </a>
        <a [class]="navItem" href="#" aria-label="Inbox" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidInbox" size="14px" />
          <span [class]="navLabel">Inbox</span>
          <span [class]="navTrailing"><span hellChip variant="primary">12</span></span>
        </a>
        <a [class]="navItem" href="#" aria-label="Team" (click)="$event.preventDefault()">
          <hell-icon [class]="navIcon" name="faSolidUsers" size="14px" />
          <span [class]="navLabel">Team</span>
        </a>

        <!-- A collapsible group. The app owns the expanded state and aria-expanded. -->
        <div class="nav-section" [attr.data-expanded]="settingsExpanded()">
          <button
            type="button"
            class="nav-section-toggle"
            [attr.aria-expanded]="settingsExpanded()"
            (click)="settingsExpanded.set(!settingsExpanded())"
          >
            Settings
          </button>
          <div class="nav-section-items">
            <a [class]="navItem" href="#" aria-label="Preferences" (click)="$event.preventDefault()">
              <hell-icon [class]="navIcon" name="faSolidGear" size="14px" />
              <span [class]="navLabel">Preferences</span>
            </a>
            <a [class]="navItem" href="#" aria-label="API keys" (click)="$event.preventDefault()">
              <hell-icon [class]="navIcon" name="faSolidKey" size="14px" />
              <span [class]="navLabel">API keys</span>
            </a>
          </div>
        </div>
      </nav>

      <main hellAppContent tabindex="0">
        <h3 class="m-0 text-base font-semibold">Navigation recipe anatomy</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          Each nav entry is a plain anchor composing an icon, a label, and an optional trailing
          chip. Click <em>Settings</em> to collapse its group; collapse the whole rail to see items
          fall back to icon-only mode with an automatic divider.
        </p>
      </main>
    </div>
  `,
})
export class AppShellSidenavExample {
  protected readonly navItem = NAV_ITEM;
  protected readonly navIcon = NAV_ICON;
  protected readonly navLabel = NAV_LABEL;
  protected readonly navTrailing = NAV_TRAILING;
  protected readonly settingsExpanded = signal(true);
}
