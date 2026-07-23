import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidChartLine, faSolidFileInvoice, faSolidFolderOpen, faSolidGauge, faSolidGear, faSolidInbox, faSolidKey, faSolidRightFromBracket, faSolidUser, faSolidUsers } from '@ng-icons/font-awesome/solid';
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
        importPath="hell-ui/app-shell"
        stylesPath="hell-ui/app-shell/styles.css"
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

      <h2>Sidenav navigation recipe</h2>
      <p>
        Navigation is consumer-owned markup, not an app-shell API: each entry is a plain
        <code>&lt;a&gt;</code> composing a <code>hell-icon</code>, a label
        <code>&lt;span&gt;</code>, and optional trailing content such as a
        <code>hellChip</code> count. Mark the current route with
        <code>aria-current="page"</code> and style it through an
        <code>aria-[current=page]:*</code> variant. The shell reflects its responsive state as
        stable attributes — <code>data-collapsed</code> on the sidenav plus
        <code>data-sidenav-collapsed</code>, <code>data-mobile-layout</code>, and friends on the
        shell root — so rail mode is pure CSS: <code>in-data-[collapsed=true]:*</code> variants
        hide labels and center icons when the rail collapses.
      </p>
      <p>
        A collapsible group is a small disclosure recipe: the app owns the expanded state, binds
        <code>aria-expanded</code> on a heading <code>&lt;button&gt;</code>, and hides collapsed
        items with <code>visibility: hidden</code> so they leave the accessibility tree and tab
        order. Keying the same rules off <code>[hellAppSidenav][data-collapsed='true']</code>
        hides the heading, draws a divider, and force-expands the group so every item stays
        reachable while the rail is icon-only.
      </p>
      <hd-example-tabs [code]="sidenavExampleCode" flush>
        <app-app-shell-sidenav-example />
      </hd-example-tabs>

      <h2>Secondary panel placement recipe</h2>
      <p>
        The optional <code>hellAppSecondary</code> column suits an activity feed, inspector, or help
        panel. Wrap its collapsible content in <code>hellAppSecondaryBody</code> so it goes inert
        while hidden. The shipped stylesheet derives three deliberate toggle treatments from
        placement, without a visual mode input:
      </p>
      <ul>
        <li>
          A direct <code>hellSidenavToggle</code> child of <code>hellAppTopbar</code> becomes the
          leading topbar action, sized to the collapsed sidenav width so its icon lines up over the
          collapsed rail.
        </li>
        <li>
          A direct <code>hellSecondaryToggle</code> child of <code>hellAppSecondaryBody</code> becomes
          a full-width header row that is itself the collapse button, with a chevron on the leading
          edge.
        </li>
        <li>
          A direct <code>hellSecondaryToggle</code> child of <code>hellAppSecondary</code> auto-fills
          the collapsed aside as one large click target and hides while the panel is open.
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
        individual slots — the topbar, sidenav, content, toggles, and secondary panel each carry
        their own recipe. Navigation markup is consumer-owned, so it has no Part Style Map: edit
        its recipe classes directly.
      </p>
      <p>Public parts by module (all single-part <code>root</code>):</p>
      <ul>
        <li><code>hellAppShell</code> → <code>root</code>: the grid container surface.</li>
        <li><code>hellAppTopbar</code> → <code>root</code>: the top bar row.</li>
        <li><code>hellAppSidenav</code> → <code>root</code>: the sidenav rail.</li>
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
          <code>(secondaryHiddenChange)</code>, plus <code>[ui]</code>. Its three deliberate actions
          are <code>toggleSidenav()</code>, <code>toggleSecondary()</code>, and
          <code>closeMobilePanels()</code>. Reference it as <code>#shell="hellAppShell"</code> when
          consumer actions need to invoke them; bind the controlled pairs when application code
          needs to read or persist panel state.
        </li>
        <li>
          <code>hellAppTopbar</code> — top bar slot. Input: <code>[ui]</code>.
        </li>
        <li>
          <code>hellAppSidenav</code> — sidenav slot. Input: <code>[ui]</code>. Its collapsed and
          mobile visibility state always follows the enclosing shell.
        </li>
        <li>
          <code>hellAppContent</code> — content slot. Input: <code>[ui]</code>. Its public
          <code>--hell-app-content-max-width</code> CSS variable defaults to <code>1760px</code>; set
          it through the local Part Style Map, for example
          <code>ui="[--hell-app-content-max-width:960px]"</code>. Direct children are centered; it
          also acts as a dialog scope root so scoped dialogs cover only the content area.
        </li>
        <li>
          <code>hellAppSecondary</code> — secondary slot. Input: <code>[ui]</code>. Its hidden and
          mobile visibility state always follows the enclosing shell.
          <code>hellAppSecondaryBody</code> wraps its collapsible content (input:
          <code>[ui]</code>) and goes inert while hidden.
        </li>
        <li>
          <code>hellSidenavToggle</code> — sidenav toggle button. Input: <code>[ui]</code>. Its direct
          placement in <code>hellAppTopbar</code> supplies the shipped leading-action recipe.
        </li>
        <li>
          <code>hellSecondaryToggle</code> — secondary toggle button. Input: <code>[ui]</code>. Place
          it directly in <code>hellAppSecondary</code> for the collapsed rail action or directly in
          <code>hellAppSecondaryBody</code> for the header action.
        </li>
        <li>
          Navigation items, labels, icons, trailing content, and collapsible groups are recipes
          over existing primitives (<code>&lt;a&gt;</code>, <code>&lt;button&gt;</code>,
          <code>hell-icon</code>, <code>hellChip</code>) styled through the shell's stable state
          attributes — see the sidenav navigation recipe above.
        </li>
        <li>
          <code>ui</code> everywhere accepts a shorthand string or a <code>Hell*Ui</code> map keyed
          by the module's <code>Hell*Part</code> — here always <code>root</code>.
        </li>
        <li>
          Localize built-in toggle labels with <code>provideHellLabels(HELL_APP_SHELL_LABELS, &#123; … &#125;)</code>
          from <code>hell-ui/app-shell</code>. Import the whole suite via
          <code>HELL_APP_SHELL_IMPORTS</code>.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          Toggle buttons must be native <code>&lt;button&gt;</code> elements. Each exposes
          <code>aria-expanded</code> (reflecting the panel's open state), <code>aria-controls</code>
          pointing at the internally registered panel, and an <code>aria-label</code> from the Label
          Contract that flips between the expand/collapse strings. The shell generates panel ids
          for this relationship; consumers do not coordinate renderer ids.
        </li>
        <li>
          Give each navigation surface its own <code>aria-label</code> on the <code>nav</code>
          element, and mark the current route with <code>aria-current="page"</code> so the recipe's
          <code>aria-[current=page]:*</code> classes style the current page.
        </li>
        <li>
          Collapsed sidenavs and hidden secondary bodies receive <code>aria-hidden</code> and
          <code>inert</code> so their controls leave the tab order. In the collapsible group
          recipe, collapsed items get <code>visibility: hidden</code>, which removes them from the
          accessibility tree and tab order the same way.
        </li>
        <li>
          On the mobile overlay layout, opening a drawer traps focus inside it and restores focus to
          the opener on close; an outside pointer press or <kbd>Escape</kbd> dismisses open drawers.
        </li>
        <li>
          Give each collapsible-group heading button an <code>aria-expanded</code> binding that
          reflects the app-owned expanded state.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>
          Place <code>hellSidenavToggle</code> directly in the topbar so the shipped placement recipe
          lines it up over the collapsed sidenav rail.
        </li>
        <li>
          Place one <code>hellSecondaryToggle</code> directly in the secondary body so the whole
          heading row is the collapse target, and one directly in the secondary panel so a hidden
          panel can be reopened from its rail.
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
          Don't add free-text section headings inside the sidenav — they have no rail-mode
          treatment. Use the collapsible group recipe, whose heading hides behind a divider when
          the rail collapses.
        </li>
        <li>
          Don't apply the toggle directives to non-<code>button</code> elements; native
          <code>button</code> keeps keyboard and disabled semantics.
        </li>
        <li>
          Don't hardcode the toggle labels in markup — localize them through
          <code>HELL_APP_SHELL_LABELS</code>.
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
