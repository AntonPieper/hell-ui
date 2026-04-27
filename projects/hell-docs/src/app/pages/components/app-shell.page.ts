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
import { HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

const HD_APP_SHELL_PAGE_ICONS = {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
};

@Component({
  selector: 'hd-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_APP_SHELL_PAGE_ICONS)],
  imports: [ExampleTabs, ...HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon],
  template: `
    <article class="hd-prose">
      <h1>App shell</h1>
      <p>
        Three-zone application chrome: <strong>topbar</strong>, <strong>sidenav</strong>,
        <strong>content</strong>, plus an optional <strong>secondary</strong> column. The shell uses
        CSS grid and responds to <code>sidenavCollapsed</code> and <code>secondaryHidden</code> via
        data attributes — collapse and hide animate purely in CSS.
      </p>

      <h2>Live miniature</h2>
      <p class="hd-note">
        Click the bars button at the top-left to collapse the sidenav. Click the
        <em>Activity</em> header (the entire row is the toggle) to hide the secondary panel — click
        the rail to bring it back.
      </p>
      <hd-example-tabs [code]="exampleCodes[0]" flush>
        <div
          hellAppShell
          #shell="hellAppShell"
          class="h-96 overflow-hidden rounded-lg border border-hell-border"
        >
          <header hellAppTopbar class="hd-surface-elevated">
            <button
              hellSidenavToggle
              type="button"
              class="hell-shell-toggle"
              [attr.aria-label]="shell.isSidenavCollapsed() ? 'Expand sidenav' : 'Collapse sidenav'"
            ></button>
            <strong>Acme Console</strong>
          </header>

          <nav hellAppSidenav class="hd-surface-elevated">
            <a href="#" aria-current="page" (click)="$event.preventDefault()">
              <hell-icon name="faSolidGauge" size="14px" />
              <span class="hd-nav-label">Dashboard</span>
            </a>
            <a href="#" (click)="$event.preventDefault()">
              <hell-icon name="faSolidFolderOpen" size="14px" />
              <span class="hd-nav-label">Projects</span>
            </a>
            <a href="#" (click)="$event.preventDefault()">
              <hell-icon name="faSolidUsers" size="14px" />
              <span class="hd-nav-label">Team</span>
            </a>

            <div
              class="hell-nav-section"
              [attr.data-collapsed]="settingsCollapsed() ? 'true' : null"
            >
              <button
                type="button"
                class="hell-nav-section-toggle"
                (click)="settingsCollapsed.set(!settingsCollapsed())"
                [attr.aria-expanded]="!settingsCollapsed()"
              >
                Settings
              </button>
              <div class="hell-nav-section-items">
                <a href="#" (click)="$event.preventDefault()">
                  <hell-icon name="faSolidGear" size="14px" />
                  <span class="hd-nav-label">Preferences</span>
                </a>
                <a href="#" (click)="$event.preventDefault()">
                  <hell-icon name="faSolidKey" size="14px" />
                  <span class="hd-nav-label">API keys</span>
                </a>
              </div>
            </div>
          </nav>

          <main hellAppContent>
            <h3 class="m-0 text-base font-semibold">Welcome back</h3>
            <p class="mt-2 text-sm text-hell-foreground-muted">
              Sections in the sidenav (e.g. <em>Settings</em>) collapse on click. When the rail
              itself is collapsed, section toggles disappear and items remain reachable as icons.
            </p>
            <div class="mt-4 flex gap-2">
              <button hellButton variant="primary" size="sm" type="button">New project</button>
              <button hellButton variant="ghost" size="sm" type="button">Invite</button>
            </div>
          </main>

          <aside hellAppSecondary class="hd-surface-subtle">
            <button hellSecondaryToggle type="button" class="hell-secondary-rail"></button>
            <div hellAppSecondaryBody>
              <button hellSecondaryToggle type="button" class="hell-secondary-header">
                Activity
              </button>
              <ul class="m-0 list-none space-y-2 p-4 text-sm text-hell-foreground-muted">
                <li>You opened <strong>Project Atlas</strong></li>
                <li>3 deploys today</li>
                <li>2 unread comments</li>
              </ul>
            </div>
          </aside>
        </div>
      </hd-example-tabs>

      <h2>Markup skeleton</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="grid gap-2">
        <p class="m-0 text-sm text-hell-foreground-muted">
          Start every app shell with named slots: topbar, sidenav, content and optional secondary.
          Add the shell and secondary toggle classes when you want the built-in chrome affordances.
        </p>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellAppShell</code> — host directive, exposes <code>isSidenavCollapsed()</code> and
          <code>isSecondaryHidden()</code> signals; takes <code>[sidenavCollapsed]</code> /
          <code>[secondaryHidden]</code> for controlled mode.
        </li>
        <li>
          Slots: <code>hellAppTopbar</code>, <code>hellAppSidenav</code>,
          <code>hellAppContent</code>, <code>hellAppSecondary</code>,
          <code>hellAppSecondaryBody</code>.
        </li>
        <li>
          Toggles: <code>hellSidenavToggle</code>, <code>hellSecondaryToggle</code> — apply to any
          clickable element.
        </li>
        <li>
          Styled toggle classes (opt-in):
          <ul>
            <li>
              <code>hell-shell-toggle</code> — leading topbar slot whose footprint matches the
              collapsed sidenav width, so the icon lines up with collapsed nav items beneath it.
            </li>
            <li>
              <code>hell-secondary-header</code> — full-width header row that doubles as the
              collapse button (whole row clickable, with a chevron on the leading edge).
            </li>
            <li>
              <code>hell-secondary-rail</code> — auto-fills the collapsed aside; hidden when
              expanded.
            </li>
          </ul>
        </li>
        <li>
          Sidenav grouping: <code>hell-nav-section</code> + <code>hell-nav-section-toggle</code> +
          <code>hell-nav-section-items</code> for collapsible sections. Collapsed rail separators
          are automatic — each section draws its own thin rule in icon-only mode.
        </li>
        <li>Import the bundle via <code>HELL_APP_SHELL_DIRECTIVES</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Use <code>hell-shell-toggle</code> as the first child of the topbar — its width matches
          the collapsed sidenav, keeping the icon centred above the rail.
        </li>
        <li>
          Use <code>hell-secondary-header</code> instead of a separate header-toggle button so the
          entire heading row is the click target.
        </li>
      </ul>
      <h2>Don't</h2>
      <ul>
        <li>
          Don't show section headings inside the sidenav while in collapsed mode — the rail draws
          section separators automatically.
        </li>
      </ul>
    </article>
  `,
})
export class AppShellPage {
  protected readonly exampleCodes = [
    '<div hellAppShell #shell="hellAppShell" class="h-96 overflow-hidden rounded-lg border border-hell-border">\n  <header hellAppTopbar class="hd-surface-elevated">\n    <button\n      hellSidenavToggle\n      type="button"\n      class="hell-shell-toggle"\n      [attr.aria-label]="shell.isSidenavCollapsed() ? \'Expand sidenav\' : \'Collapse sidenav\'"\n    ></button>\n    <strong>Acme Console</strong>\n  </header>\n\n  <nav hellAppSidenav class="hd-surface-elevated">\n    <a href="#" aria-current="page" (click)="$event.preventDefault()">\n      <hell-icon name="faSolidGauge" size="14px" />\n      <span class="hd-nav-label">Dashboard</span>\n    </a>\n    <a href="#" (click)="$event.preventDefault()">\n      <hell-icon name="faSolidFolderOpen" size="14px" />\n      <span class="hd-nav-label">Projects</span>\n    </a>\n    <div class="hell-nav-section">\n      <button type="button" class="hell-nav-section-toggle" aria-expanded="true">\n        Settings\n      </button>\n      <div class="hell-nav-section-items">\n        <a href="#" (click)="$event.preventDefault()">\n          <hell-icon name="faSolidGear" size="14px" />\n          <span class="hd-nav-label">Preferences</span>\n        </a>\n      </div>\n    </div>\n  </nav>\n\n  <main hellAppContent>\n    <h3 class="m-0 text-base font-semibold">Welcome back</h3>\n    <p class="mt-2 text-sm text-hell-foreground-muted">\n      Main content stays independent from shell chrome.\n    </p>\n  </main>\n\n  <aside hellAppSecondary class="hd-surface-subtle">\n    <button hellSecondaryToggle type="button" class="hell-secondary-rail"></button>\n    <div hellAppSecondaryBody>\n      <button hellSecondaryToggle type="button" class="hell-secondary-header">\n        Activity\n      </button>\n    </div>\n  </aside>\n</div>\n',
    '<div hellAppShell #shell="hellAppShell">\n  <header hellAppTopbar>\n    <button hellSidenavToggle class="hell-shell-toggle"></button>\n  </header>\n\n  <nav hellAppSidenav>\n    <a routerLink="/dashboard">Dashboard</a>\n  </nav>\n\n  <main hellAppContent>Page content</main>\n\n  <aside hellAppSecondary>\n    <button hellSecondaryToggle class="hell-secondary-rail"></button>\n    <div hellAppSecondaryBody>\n      <button hellSecondaryToggle class="hell-secondary-header">Activity</button>\n    </div>\n  </aside>\n</div>\n',
  ] as const;
  readonly collapsed = signal(false);
  protected readonly settingsCollapsed = signal(false);
}
