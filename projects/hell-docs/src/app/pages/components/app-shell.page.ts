import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon } from 'hell';

@Component({
  selector: 'hd-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_DIRECTIVES, HellButton, HellIcon],
  template: `
    <article class="hd-prose">
      <h1>App shell</h1>
      <p>Three-zone application chrome: <strong>topbar</strong>,
        <strong>sidenav</strong>, <strong>content</strong>, plus an optional
        <strong>secondary</strong> column. The shell uses CSS grid and
        responds to <code>sidenavCollapsed</code> and
        <code>secondaryHidden</code> via data attributes — collapse and hide
        animate purely in CSS.</p>

      <h2>Live miniature</h2>
      <div class="hd-example hd-example-flush">
        <div
          hellAppShell
          #shell="hellAppShell"
          class="h-96 overflow-hidden rounded-lg border border-hell-border"
        >
          <header hellAppTopbar class="hd-surface-elevated">
            <button
              hellSidenavToggle
              hellButton
              variant="ghost"
              size="sm"
              iconOnly
              type="button"
              [attr.aria-label]="shell.isSidenavCollapsed() ? 'Expand sidenav' : 'Collapse sidenav'"
            >
              <hell-icon name="faSolidBars" size="14px" />
            </button>
            <strong>Acme Console</strong>
          </header>

          <nav hellAppSidenav class="hd-surface-elevated">
            <div class="hd-nav-heading">Workspace</div>
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
            <div class="hd-nav-heading">Settings</div>
            <a href="#" (click)="$event.preventDefault()">
              <hell-icon name="faSolidGear" size="14px" />
              <span class="hd-nav-label">Preferences</span>
            </a>
            <a href="#" (click)="$event.preventDefault()">
              <hell-icon name="faSolidKey" size="14px" />
              <span class="hd-nav-label">API keys</span>
            </a>
          </nav>

          <main hellAppContent>
            <h3 class="m-0 text-base font-semibold">Welcome back</h3>
            <p class="mt-2 text-sm text-hell-foreground-muted">
              Click the button on the left of the topbar to collapse the
              sidenav, the chevron next to “Activity” to hide the
              secondary panel. When hidden, click the rail to bring it
              back.
            </p>
            <div class="mt-4 flex gap-2">
              <button
                hellButton
                variant="primary"
                size="sm"
                type="button"
              >New project</button>
              <button
                hellButton
                variant="ghost"
                size="sm"
                type="button"
              >Invite</button>
            </div>
          </main>

          <aside hellAppSecondary class="hd-surface-subtle">
            <button
              hellSecondaryToggle
              type="button"
              class="hell-secondary-rail"
            ></button>
            <div hellAppSecondaryBody class="p-4">
              <h4 class="m-0 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hell-foreground-subtle">
                <button
                  hellSecondaryToggle
                  type="button"
                  class="hell-secondary-header-toggle"
                ></button>
                Activity
              </h4>
              <ul class="mt-3 space-y-2 text-sm text-hell-foreground-muted">
                <li>You opened <strong>Project Atlas</strong></li>
                <li>3 deploys today</li>
                <li>2 unread comments</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <h2>Markup</h2>
      <pre><code>&lt;div hellAppShell #shell="hellAppShell"&gt;
  &lt;header hellAppTopbar&gt;
    &lt;button hellSidenavToggle&gt;…&lt;/button&gt;
    …
  &lt;/header&gt;
  &lt;nav hellAppSidenav&gt;…&lt;/nav&gt;
  &lt;main hellAppContent&gt;…&lt;/main&gt;
  &lt;aside hellAppSecondary&gt;
    &lt;button hellSecondaryToggle class="hell-secondary-rail"&gt;&lt;/button&gt;
    &lt;div hellAppSecondaryBody&gt;
      &lt;header&gt;
        &lt;button hellSecondaryToggle class="hell-secondary-header-toggle"&gt;&lt;/button&gt;
        Title
      &lt;/header&gt;
      …
    &lt;/div&gt;
  &lt;/aside&gt;
&lt;/div&gt;</code></pre>

      <h2>API</h2>
      <ul>
        <li><code>hellAppShell</code> — host directive, exposes
          <code>isSidenavCollapsed()</code> and
          <code>isSecondaryHidden()</code> signals; takes
          <code>[sidenavCollapsed]</code> /
          <code>[secondaryHidden]</code> for controlled mode.</li>
        <li>Slots: <code>hellAppTopbar</code>, <code>hellAppSidenav</code>,
          <code>hellAppContent</code>, <code>hellAppSecondary</code>,
          <code>hellAppSecondaryBody</code>.</li>
        <li>Toggles: <code>hellSidenavToggle</code>,
          <code>hellSecondaryToggle</code> — apply to any clickable
          element. The library provides two opt-in styled buttons for
          the secondary panel: <code>hell-secondary-header-toggle</code>
          (an inline chevron sized for a heading row) and
          <code>hell-secondary-rail</code> (auto-fills the collapsed
          aside; hidden when expanded).</li>
        <li>Import the bundle via
          <code>HELL_APP_SHELL_DIRECTIVES</code>.</li>
      </ul>
    </article>
  `,
})
export class AppShellPage {
  readonly collapsed = signal(false);
}
