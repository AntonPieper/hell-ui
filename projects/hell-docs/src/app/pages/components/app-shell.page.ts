import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_APP_SHELL_DIRECTIVES, HellButton } from 'hell';

@Component({
  selector: 'hd-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_APP_SHELL_DIRECTIVES, HellButton],
  template: `
    <article class="hd-prose">
      <h1>App shell</h1>
      <p>Three-zone application chrome: <strong>topbar</strong>,
        <strong>sidenav</strong>, <strong>content</strong>, plus an optional
        <strong>secondary</strong> column. The shell uses CSS grid and
        responds to <code>sidenavCollapsed</code> and
        <code>secondaryHidden</code> via data attributes.</p>

      <h2>Live miniature</h2>
      <div class="hd-example" style="padding:0">
        <div hellAppShell [sidenavCollapsed]="collapsed()" style="height:320px; border:1px solid var(--hell-color-border-subtle); border-radius:.5rem; overflow:hidden">
          <header hellAppTopbar style="background:var(--hell-color-bg-elevated)">
            <strong>Acme</strong>
            <span style="margin-left:auto"></span>
            <button hellButton variant="ghost" size="sm" (click)="collapsed.set(!collapsed())">
              {{ collapsed() ? 'Expand' : 'Collapse' }}
            </button>
          </header>
          <nav hellAppSidenav style="background:var(--hell-color-bg-elevated)">
            <a href="#">Dashboard</a>
            <a href="#" aria-current="page">Projects</a>
            <a href="#">Settings</a>
          </nav>
          <main hellAppContent>
            <p>Main content lives here. Resize the window or click the
              button to toggle the sidenav.</p>
          </main>
          <aside hellAppSecondary style="background:var(--hell-color-bg-subtle)">
            Secondary panel
          </aside>
        </div>
      </div>

      <h2>Markup</h2>
      <pre><code>&lt;div hellAppShell [sidenavCollapsed]="collapsed()" [secondaryHidden]="false"&gt;
  &lt;header hellAppTopbar&gt;…&lt;/header&gt;
  &lt;nav hellAppSidenav&gt;…&lt;/nav&gt;
  &lt;main hellAppContent&gt;…&lt;/main&gt;
  &lt;aside hellAppSecondary&gt;…&lt;/aside&gt;
&lt;/div&gt;</code></pre>

      <h2>API</h2>
      <ul>
        <li><code>hellAppShell</code>: <code>sidenavCollapsed</code>,
          <code>secondaryHidden</code> (boolean attributes / inputs)</li>
        <li>Slot directives: <code>hellAppTopbar</code>,
          <code>hellAppSidenav</code>, <code>hellAppContent</code>,
          <code>hellAppSecondary</code></li>
        <li>Import the bundle via
          <code>HELL_APP_SHELL_DIRECTIVES</code>.</li>
      </ul>
    </article>
  `,
})
export class AppShellPage {
  readonly collapsed = signal(false);
}
