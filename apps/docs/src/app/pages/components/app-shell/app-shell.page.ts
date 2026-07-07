import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChartLine,
  faSolidFileInvoice,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { AppShellBasicExample } from './examples/basic.example';
import appShellBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { AppShellSidenavExample } from './examples/sidenav.example';
import appShellSidenavExampleCodeRaw from './examples/sidenav.example.ts?raw' with {
  loader: 'text',
};
import { AppShellSecondaryPanelExample } from './examples/secondary-panel.example';
import appShellSecondaryPanelExampleCodeRaw from './examples/secondary-panel.example.ts?raw' with {
  loader: 'text',
};
import { AppShellWithOmnibarMenuAvatarExample } from './examples/with-omnibar-menu-avatar.example';
import appShellWithOmnibarMenuAvatarExampleCodeRaw from './examples/with-omnibar-menu-avatar.example.ts?raw' with {
  loader: 'text',
};
import { AppShellStylingExample } from './examples/styling.example';
import appShellStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

const HD_APP_SHELL_PAGE_ICONS = {
  faSolidChartLine,
  faSolidFileInvoice,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidGear,
  faSolidInbox,
  faSolidKey,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
};

@Component({
  selector: 'hd-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_APP_SHELL_PAGE_ICONS)],
  imports: [
    ExampleTabs,
    PageHeader,
    AppShellBasicExample,
    AppShellSidenavExample,
    AppShellSecondaryPanelExample,
    AppShellWithOmnibarMenuAvatarExample,
    AppShellStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="App shell"
        icon="faSolidWindowMaximize"
        category="Composite"
        importPath="@hell-ui/angular/app-shell"
        stylesPath="@hell-ui/angular/app-shell/styles.css"
      >
        The full application frame — topbar, collapsible sidenav, scrolling content, and an optional
        secondary panel — assembled from slot directives that share one CSS-grid layout.
      </hd-page-header>
      <p>
        <code>hellAppShell</code> is the outer chrome of a business app. It owns a single CSS grid
        with four regions —
        <strong>topbar</strong>, <strong>sidenav</strong>, <strong>content</strong>, and an optional
        <strong>secondary</strong> column — while you fill each region through slot directives. The
        shell tracks two pieces of state, sidenav-collapsed and secondary-hidden, and reflects them
        as <code>data-*</code> attributes so the column widths animate purely in CSS.
      </p>
      <p>
        Below the desktop breakpoint (768px) the rails become dismissable overlay drawers: opening a
        drawer traps focus inside it, closing it restores focus to the opener, and an outside press
        or <kbd>Escape</kbd> dismisses it. Use the shell whenever an app needs persistent global
        navigation around a routed content area; reach for a plain layout when the surface is a
        single focused page or a modal flow.
      </p>
      <p>
        State can be <em>uncontrolled</em> — leave the inputs unset and let the built-in
        <code>hellSidenavToggle</code> / <code>hellSecondaryToggle</code> buttons mutate shell-owned
        signals — or <em>controlled</em> by binding <code>[sidenavCollapsed]</code> /
        <code>[secondaryHidden]</code> and handling the paired <code>...Change</code> outputs.
      </p>

      <h2>Basic</h2>
      <p>
        The smallest useful shell: a topbar with the sidenav toggle, a <code>nav</code> rail of
        items, and a content region. Everything else is optional.
      </p>
      <hd-example-tabs [code]="basicExampleCode" flush>
        <app-app-shell-basic-example />
      </hd-example-tabs>

      <h2>Sidenav navigation</h2>
      <p>
        A <code>hellNavItem</code> composes a leading <code>hellNavItemIcon</code>, a
        <code>hellNavItemLabel</code>, and an optional <code>hellNavItemTrailing</code> slot for a
        count or badge. Mark the current route with <code>aria-current="page"</code>. Group related
        items with <code>hellNavSection</code> + <code>hellNavSectionToggle</code> +
        <code>hellNavSectionItems</code>; the toggle owns <code>aria-expanded</code> and the section
        owns collapse state. When the rail itself is collapsed, labels and section headings hide and
        items fall back to reachable icons.
      </p>
      <hd-example-tabs [code]="sidenavExampleCode" flush>
        <app-app-shell-sidenav-example />
      </hd-example-tabs>

      <h2>Secondary panel and toggle appearances</h2>
      <p>
        The optional <code>hellAppSecondary</code> column suits an activity feed, inspector, or help
        panel. Wrap its collapsible content in <code>hellAppSecondaryBody</code> so it goes inert
        while hidden. The toggle directives ship three opt-in <code>appearance</code> chrome styles:
      </p>
      <ul>
        <li>
          <code>appearance="shell"</code> (<code>hellSidenavToggle</code>) — the leading topbar slot,
          sized to the collapsed sidenav width so the bars icon lines up over the collapsed rail.
        </li>
        <li>
          <code>appearance="header"</code> (<code>hellSecondaryToggle</code>) — a full-width header
          row that is itself the collapse button, with a chevron on the leading edge.
        </li>
        <li>
          <code>appearance="rail"</code> (<code>hellSecondaryToggle</code>) — auto-fills the
          collapsed aside as one large click target and hides while the panel is open.
        </li>
      </ul>
      <p class="hd-note">
        Click the <em>Activity</em> header row to hide the panel, then click the collapsed rail to
        bring it back.
      </p>
      <hd-example-tabs [code]="secondaryPanelExampleCode" flush>
        <app-app-shell-secondary-panel-example />
      </hd-example-tabs>

      <h2>With omnibar, menu, and avatar</h2>
      <p>
        A realistic frame wires the shell to other Hell components: a
        <code>hell-omnibar</code> drives navigation from the topbar, an avatar-backed
        <code>hellMenuTrigger</code> opens an account menu, and the sidenav mirrors the active page
        through <code>aria-current</code>. Import each collaborator through its own narrow entry
        point.
      </p>
      <hd-example-tabs [code]="withOmnibarMenuAvatarExampleCode" flush>
        <app-app-shell-with-omnibar-menu-avatar-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every module in this entry point exposes a single <code>root</code> Public Part. Pass
        <code>ui="…"</code> to refine that default part with a shorthand class string, or the
        equivalent map form <code>[ui]="&#123; root: '…' &#125;"</code>. Each directive's
        <code>ui</code> styles only the DOM that directive owns, so a shell is themed by refining the
        individual slots — the topbar, sidenav, nav items, toggles, and secondary panel each carry
        their own recipe.
      </p>
      <p>Public parts by module (all single-part <code>root</code>):</p>
      <ul>
        <li><code>hellAppShell</code> → <code>root</code>: the grid container surface.</li>
        <li><code>hellAppTopbar</code> → <code>root</code>: the top bar row.</li>
        <li><code>hellAppSidenav</code> → <code>root</code>: the sidenav rail.</li>
        <li><code>hellNavItem</code> → <code>root</code>: a single nav entry.</li>
        <li><code>hellNavItemIcon</code> → <code>root</code>: a nav item's leading icon.</li>
        <li><code>hellNavItemLabel</code> → <code>root</code>: a nav item's text label.</li>
        <li>
          <code>hellNavItemTrailing</code> → <code>root</code>: a nav item's trailing slot (badge or
          count).
        </li>
        <li><code>hellNavSection</code> → <code>root</code>: a collapsible group wrapper.</li>
        <li>
          <code>hellNavSectionToggle</code> → <code>root</code>: the section heading toggle button.
        </li>
        <li>
          <code>hellNavSectionItems</code> → <code>root</code>: the collapsible items container.
        </li>
        <li><code>hellAppContent</code> → <code>root</code>: the scrolling content region.</li>
        <li><code>hellSidenavToggle</code> → <code>root</code>: the sidenav toggle button.</li>
        <li><code>hellSecondaryToggle</code> → <code>root</code>: the secondary toggle button.</li>
        <li><code>hellAppSecondary</code> → <code>root</code>: the secondary column.</li>
        <li>
          <code>hellAppSecondaryBody</code> → <code>root</code>: the collapsible secondary body.
        </li>
      </ul>
      <p>
        The example below refines every one of these parts with Hell design tokens
        (<code>bg-hell-*</code>, <code>text-hell-*</code>, <code>rounded-hell-*</code>, and spacing).
      </p>
      <hd-example-tabs [code]="stylingExampleCode" flush>
        <app-app-shell-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellAppShell</code> — the grid host. Inputs: <code>[sidenavCollapsed]</code> and
          <code>[secondaryHidden]</code> (<code>boolean | null</code>, default <code>null</code> =
          uncontrolled) with paired outputs <code>(sidenavCollapsedChange)</code> /
          <code>(secondaryHiddenChange)</code>, plus <code>[ui]</code>. Exposes signal getters
          <code>isSidenavCollapsed()</code>, <code>isSecondaryHidden()</code>,
          <code>isMobileLayout()</code>, and <code>mobileOpenPanel()</code>, and methods
          <code>toggleSidenav()</code>, <code>toggleSecondary()</code>, and
          <code>closeMobilePanels()</code>. Reference it as <code>#shell="hellAppShell"</code>.
        </li>
        <li>
          <code>hellAppTopbar</code> — top bar slot. Input: <code>[ui]</code>.
        </li>
        <li>
          <code>hellAppSidenav</code> — sidenav slot. Inputs: <code>[collapsed]</code>
          (<code>boolean | null</code>, default <code>null</code> = follow the shell),
          <code>[id]</code> (DOM id override, default shell-derived), and <code>[ui]</code>.
        </li>
        <li>
          <code>hellAppContent</code> — content slot. Inputs: <code>[maxWidth]</code>
          (<code>string | number | null</code>; bare numbers are pixels; the CSS default caps content
          at <code>1760px</code>) and <code>[ui]</code>. Direct children are centered; it also acts
          as a dialog scope root so scoped dialogs cover only the content area.
        </li>
        <li>
          <code>hellAppSecondary</code> — secondary slot. Inputs: <code>[hidden]</code>
          (<code>boolean | null</code>, default <code>null</code> = follow the shell),
          <code>[id]</code>, and <code>[ui]</code>. <code>hellAppSecondaryBody</code> wraps its
          collapsible content (input: <code>[ui]</code>) and goes inert while hidden.
        </li>
        <li>
          <code>hellSidenavToggle</code> — sidenav toggle button. Inputs:
          <code>[appearance]</code> (<code>plain | shell</code>, default <code>plain</code>) and
          <code>[ui]</code>.
        </li>
        <li>
          <code>hellSecondaryToggle</code> — secondary toggle button. Inputs:
          <code>[appearance]</code> (<code>plain | header | rail</code>, default <code>plain</code>)
          and <code>[ui]</code>.
        </li>
        <li>
          <code>hellNavItem</code> — nav entry. Inputs: <code>[active]</code> (boolean, default
          <code>false</code>) and <code>[ui]</code>. Slots: <code>hellNavItemIcon</code>,
          <code>hellNavItemLabel</code>, <code>hellNavItemTrailing</code> (each takes
          <code>[ui]</code>).
        </li>
        <li>
          <code>hellNavSection</code> — collapsible group. Inputs: <code>[collapsed]</code>
          (<code>boolean | null</code>, default <code>null</code> = uncontrolled), output
          <code>(collapsedChange)</code>, plus <code>[ui]</code>. Compose with
          <code>hellNavSectionToggle</code> (button; owns <code>aria-expanded</code>) and
          <code>hellNavSectionItems</code> (each takes <code>[ui]</code>).
        </li>
        <li>
          <code>ui</code> everywhere accepts a shorthand string or a <code>Hell*Ui</code> map keyed
          by the module's <code>Hell*Part</code> — here always <code>root</code>.
        </li>
        <li>
          Localize built-in toggle labels with <code>provideHellAppShellLabels(&#123; … &#125;)</code>
          from <code>@hell-ui/angular/app-shell</code>. Import the whole suite via
          <code>HELL_APP_SHELL_DIRECTIVES</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Toggle buttons must be native <code>&lt;button&gt;</code> elements. Each exposes
          <code>aria-expanded</code> (reflecting the panel's open state), <code>aria-controls</code>
          pointing at the panel's DOM id, and an <code>aria-label</code> from the Label Contract
          that flips between the expand/collapse strings.
        </li>
        <li>
          Give each navigation surface its own <code>aria-label</code> on the <code>nav</code>
          element, and mark the current route with <code>aria-current="page"</code> — the nav item
          styles the current page automatically.
        </li>
        <li>
          Collapsed sidenavs, hidden secondary bodies, and collapsed section items receive
          <code>aria-hidden</code> and <code>inert</code> so their controls leave the tab order.
        </li>
        <li>
          On the mobile overlay layout, opening a drawer traps focus inside it and restores focus to
          the opener on close; an outside pointer press or <kbd>Escape</kbd> dismisses open drawers.
        </li>
        <li>
          <code>hellNavSectionToggle</code> reflects its section's open state through
          <code>aria-expanded</code>.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Use <code>appearance="shell"</code> as the first child of the topbar so the toggle lines up
          over the collapsed sidenav rail.
        </li>
        <li>
          Use <code>appearance="header"</code> so the whole secondary-panel heading row is the
          collapse target, and always include the <code>appearance="rail"</code> toggle so a hidden
          panel can be reopened.
        </li>
        <li>
          Refine chrome with each slot's <code>ui</code> instead of conflicting <code>class</code>
          utilities, and label every <code>nav</code>.
        </li>
        <li>
          Reach for controlled <code>[sidenavCollapsed]</code> / <code>[secondaryHidden]</code> only
          when the collapse state must persist or sync across the app.
        </li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>
          Don't add free-text section headings inside the sidenav — the rail draws its own dividers
          in collapsed mode, so use <code>hellNavSection</code> instead.
        </li>
        <li>
          Don't apply the toggle directives to non-<code>button</code> elements; native
          <code>button</code> keeps keyboard and disabled semantics.
        </li>
        <li>
          Don't hardcode the toggle labels in markup — localize them through
          <code>provideHellAppShellLabels</code>.
        </li>
      </ul>
    </article>
  `,
})
export class AppShellPage {
  protected readonly basicExampleCode = appShellBasicExampleCodeRaw;
  protected readonly sidenavExampleCode = appShellSidenavExampleCodeRaw;
  protected readonly secondaryPanelExampleCode = appShellSecondaryPanelExampleCodeRaw;
  protected readonly withOmnibarMenuAvatarExampleCode = appShellWithOmnibarMenuAvatarExampleCodeRaw;
  protected readonly stylingExampleCode = appShellStylingExampleCodeRaw;
}
