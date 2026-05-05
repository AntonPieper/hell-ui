import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidBars,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidKey,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../../shared/example-tabs';
import { AppShellLiveMiniatureExample } from './examples/live-miniature.example';
import appShellLiveMiniatureExampleCodeRaw from './examples/live-miniature.example.ts?raw' with {
  loader: 'text',
};
import { AppShellMarkupSkeletonExample } from './examples/markup-skeleton.example';
import appShellMarkupSkeletonExampleCodeRaw from './examples/markup-skeleton.example.ts?raw' with {
  loader: 'text',
};

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
  imports: [
    ExampleTabs,
    ...HELL_APP_SHELL_DIRECTIVES,
    AppShellLiveMiniatureExample,
    AppShellMarkupSkeletonExample,
  ],
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
      <hd-example-tabs [code]="appShellLiveMiniatureExampleCode" flush>
        <app-app-shell-live-miniature-example />
      </hd-example-tabs>

      <h2>Markup skeleton</h2>
      <hd-example-tabs [code]="appShellMarkupSkeletonExampleCode" previewClass="grid gap-2">
        <app-app-shell-markup-skeleton-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellAppShell</code> — host directive, exposes <code>isSidenavCollapsed()</code> and
          <code>isSecondaryHidden()</code> signals; takes <code>[sidenavCollapsed]</code> /
          <code>(sidenavCollapsedChange)</code> and <code>[secondaryHidden]</code> /
          <code>(secondaryHiddenChange)</code> for controlled mode.
        </li>
        <li>
          Slots: <code>hellAppTopbar</code>, <code>hellAppSidenav</code>,
          <code>hellAppContent</code>, <code>hellAppSecondary</code>,
          <code>hellAppSecondaryBody</code>. <code>hellAppContent</code> centers direct content,
          defaults to a wide <code>1760px</code> content cap, and accepts <code>[maxWidth]</code> as
          a number in pixels or any CSS length.
        </li>
        <li>
          Toggles: <code>hellSidenavToggle</code>, <code>hellSecondaryToggle</code> — apply to
          native <code>button</code> elements so keyboard and disabled semantics stay native.
        </li>
        <li>
          Sidenav items: <code>hellNavItem</code>, <code>hellNavItemIcon</code>,
          <code>hellNavItemLabel</code>, and <code>hellNavItemTrailing</code>. Use these instead of
          relying on raw anchor styling inside the sidenav.
        </li>
        <li>
          Styled toggle appearances (opt-in):
          <ul>
            <li>
              <code>appearance="shell"</code> — leading topbar slot whose footprint matches the
              collapsed sidenav width, so the icon lines up with collapsed nav items beneath it.
            </li>
            <li>
              <code>appearance="header"</code> — full-width header row that doubles as the
              collapse button (whole row clickable, with a chevron on the leading edge).
            </li>
            <li>
              <code>appearance="rail"</code> — auto-fills the collapsed aside; hidden when
              expanded.
            </li>
          </ul>
        </li>
        <li>
          Sidenav grouping: <code>hellNavSection</code> + <code>hellNavSectionToggle</code> +
          <code>hellNavSectionItems</code> for collapsible sections. The section owns classes,
          collapse attributes, toggle state, and <code>aria-expanded</code>; bind
          <code>[collapsed]</code> / <code>(collapsedChange)</code> only when parent state must persist.
        </li>
        <li>Import the bundle via <code>HELL_APP_SHELL_DIRECTIVES</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>
          Use <code>appearance="shell"</code> as the first child of the topbar — its width matches
          the collapsed sidenav, keeping the icon centred above the rail.
        </li>
        <li>
          Use <code>appearance="header"</code> instead of a separate header-toggle button so the
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
  protected readonly appShellLiveMiniatureExampleCode = appShellLiveMiniatureExampleCodeRaw;
  protected readonly appShellMarkupSkeletonExampleCode = appShellMarkupSkeletonExampleCodeRaw;
}
