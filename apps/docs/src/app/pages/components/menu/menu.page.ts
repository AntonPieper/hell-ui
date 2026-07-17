import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { MenuBasicExample } from './examples/basic.example';
import menuBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { MenuSectionsExample } from './examples/sections.example';
import menuSectionsExampleCodeRaw from './examples/sections.example.ts?raw' with {
  loader: 'text',
};
import { MenuCheckableExample } from './examples/checkable.example';
import menuCheckableExampleCodeRaw from './examples/checkable.example.ts?raw' with {
  loader: 'text',
};
import { MenuOptionsExample } from './examples/options.example';
import menuOptionsExampleCodeRaw from './examples/options.example.ts?raw' with { loader: 'text' };
import { MenuProfileMenuExample } from './examples/profile-menu.example';
import menuProfileMenuExampleCodeRaw from './examples/profile-menu.example.ts?raw' with {
  loader: 'text',
};
import { MenuStylingExample } from './examples/styling.example';
import menuStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    MenuBasicExample,
    MenuSectionsExample,
    MenuCheckableExample,
    MenuOptionsExample,
    MenuProfileMenuExample,
    MenuStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Menu"
        icon="faSolidEllipsisVertical"
        category="Styled primitive"
        importPath="@hell-ui/angular/menu"
        stylesPath="@hell-ui/angular/menu/styles.css"
      >
        A floating list of actions anchored to a button or anchor trigger, with sections, checkable
        items, radio groups, icons, and submenus.
      </hd-page-header>
      <p>
        The menu entry point is a suite of directives built on the <code>NgpMenu</code> family from
        <code>ng-primitives</code>, which owns the ARIA menu pattern, floating position, and
        dismissal. Hell layers a default panel recipe, item/section/label styling, and a Part Style
        Map on each directive, so you compose the menu from plain <code>&lt;button&gt;</code>,
        <code>&lt;a&gt;</code>, and <code>&lt;div&gt;</code> hosts inside an
        <code>&lt;ng-template&gt;</code>.
      </p>
      <p>
        Reach for a menu for overflow and contextual actions in a dense app — row actions, toolbar
        overflow, account menus, and compact preference toggles. Use <code>tabs</code> or nav links
        for navigation between sibling views, and a dialog or popover when the interaction needs
        form fields rather than a list of commands.
      </p>

      <h2>Basic</h2>
      <p>
        A trigger and a menu template. Attach <code>[hellMenuTrigger]</code> to a native button (or
        anchor) and point it at an <code>&lt;ng-template&gt;</code> that renders a
        <code>[hellMenu]</code> panel of <code>[hellMenuItem]</code> buttons. The menu opens on
        click, closes on select, and returns focus to the trigger on <kbd>Escape</kbd>.
      </p>
      <hd-example-tabs [code]="menuBasicExampleCode">
        <app-menu-basic-example />
      </hd-example-tabs>

      <h2>Icons, sections &amp; submenus</h2>
      <p>
        Group related commands with <code>[hellMenuSection]</code> and a
        <code>[hellMenuLabel]</code> header, project a leading <code>[hellMenuItemIcon]</code> and a
        trailing <code>[hellMenuItemTrailing]</code> slot (for a shortcut hint or badge), and nest a
        child menu by pointing <code>[hellSubmenuTrigger]</code> at another template. The submenu
        chevron is drawn automatically on submenu-trigger items.
      </p>
      <hd-example-tabs [code]="menuSectionsExampleCode">
        <app-menu-sections-example />
      </hd-example-tabs>

      <h2>Checkable items</h2>
      <p>
        <code>[hellMenuItemCheckbox]</code> toggles independently and keeps the menu open on
        select, so it fits compact preference toggles that live in the menu model. For a
        single-choice group, wrap <code>[hellMenuItemRadio]</code> buttons in a
        <code>[hellMenuItemRadioGroup]</code> bound to <code>value</code>/<code>valueChange</code>.
        Both render an <code>[hellMenuItemIndicator]</code> that reflects the checked state.
      </p>
      <hd-example-tabs [code]="menuCheckableExampleCode">
        <app-menu-checkable-example />
      </hd-example-tabs>

      <h2>Consumer-owned options</h2>
      <p>
        Iterate your domain objects directly and render one
        <code>button[hellMenuItemCheckbox]</code> per row. Bind <code>checked</code>,
        <code>disabled</code>, and <code>(checkedChange)</code> to your own collection state, then
        project an ordinary <code>[hellMenuItemIndicator]</code> and label. This example keeps real
        column objects as its selected values and disables only the last visible column, so the
        collection can never become empty. Menu still owns roving focus, checkbox semantics,
        typeahead, and dismissal; the caller owns data, policy, and rendering.
      </p>
      <hd-example-tabs [code]="menuOptionsExampleCode">
        <app-menu-options-example />
      </hd-example-tabs>

      <h2>With avatar (account menu)</h2>
      <p>
        A trigger does not have to be a <code>hellButton</code>. Here a bare focusable button hosts
        a <code>hell-avatar</code> and opens a <code>placement="bottom-end"</code> account menu with
        a non-interactive header row, icon commands, and a destructive sign-out action separated
        from the rest.
      </p>
      <hd-example-tabs [code]="menuProfileMenuExampleCode">
        <app-menu-profile-menu-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every module in this entry point follows Hell's Part Style Map contract. Each styled
        directive owns a single <code>root</code> Public Part rendered with
        <code>data-slot="root"</code>: pass <code>ui="…"</code> as shorthand to refine that part, or
        the equivalent <code>[ui]="&#123; root: '…' &#125;"</code> map. Refinements merge on top of
        the recipe through Hell's Tailwind merge, so a conflicting utility such as
        <code>rounded-hell-lg</code> wins over the default <code>rounded-hell-md</code>. Because the
        panel is a directive suite, style each part from its own <code>ui</code> input rather than
        reaching into descendants of <code>[hellMenu]</code>.
      </p>
      <p>
        There is no shared multi-part map: <code>HellMenuTrigger</code> is behavior-only and exposes
        no <code>ui</code>, and <code>HellMenuItemRadioGroup</code> is a plain wrapper. Use item
        state attributes for highlight styling — the highlighted row is marked with
        <code>data-hover</code> and <code>data-focus-visible</code>, not a
        <code>data-active</code> attribute.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>hellMenu</code></td>
            <td><code>root</code></td>
            <td>The floating panel — surface, border, radius, shadow, min-width, padding.</td>
          </tr>
          <tr>
            <td><code>hellMenuItem</code></td>
            <td><code>root</code></td>
            <td>A selectable row (button/anchor/div) — text, padding, hover/focus highlight.</td>
          </tr>
          <tr>
            <td><code>hellMenuItemCheckbox</code></td>
            <td><code>root</code></td>
            <td>A checkbox row that stays open on toggle; same row surface as an item.</td>
          </tr>
          <tr>
            <td><code>hellMenuItemRadio</code></td>
            <td><code>root</code></td>
            <td>A single-choice row inside a radio group; same row surface as an item.</td>
          </tr>
          <tr>
            <td><code>hellMenuItemIndicator</code></td>
            <td><code>root</code></td>
            <td>The check/dot glyph inside a checkbox or radio row; reflects checked state.</td>
          </tr>
          <tr>
            <td><code>hellMenuItemIcon</code></td>
            <td><code>root</code></td>
            <td>The leading-icon slot in a row — width and muted icon color.</td>
          </tr>
          <tr>
            <td><code>hellMenuItemTrailing</code></td>
            <td><code>root</code></td>
            <td>The trailing slot — shortcut hint, chevron, or badge pushed to the row end.</td>
          </tr>
          <tr>
            <td><code>hellMenuSection</code></td>
            <td><code>root</code></td>
            <td>A grouping wrapper (<code>role="group"</code>) with spacing between sections.</td>
          </tr>
          <tr>
            <td><code>hellMenuLabel</code></td>
            <td><code>root</code></td>
            <td>The uppercase section header rendered above a section's items.</td>
          </tr>
          <tr>
            <td><code>hellMenuSeparator</code></td>
            <td><code>root</code></td>
            <td>The horizontal divider (<code>role="separator"</code>) between groups.</td>
          </tr>
          <tr>
            <td><code>hellSubmenuTrigger</code></td>
            <td><code>root</code></td>
            <td>The submenu-opening item host; carries the generated chevron glyph.</td>
          </tr>
        </tbody>
      </table>
      <p>
        This example refines every public part of the entry point in one menu — panel, section,
        label, item, icon slot, trailing slot, checkbox, indicator, radio group, separator, and a
        submenu trigger.
      </p>
      <hd-example-tabs [code]="menuStylingExampleCode">
        <app-menu-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p><strong><code>hellMenuTrigger</code></strong> — on a <code>&lt;button&gt;</code> or <code>&lt;a&gt;</code> host:</p>
      <ul>
        <li>
          <code>hellMenuTrigger</code>: the menu content — a <code>&lt;ng-template&gt;</code> ref (or
          component type) to open.
        </li>
        <li>
          <code>placement</code>: <code>NgpMenuPlacement</code> —
          <code>top | right | bottom | left</code> plus <code>-start</code>/<code>-end</code>
          variants. Default <code>bottom-start</code>.
        </li>
        <li><code>offset</code>: <code>number</code> or an axis object. Default <code>4</code>.</li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Default <code>false</code>. On a
          <code>&lt;button&gt;</code> uses native <code>disabled</code>; on an <code>&lt;a&gt;</code>
          sets <code>aria-disabled</code>/<code>tabindex="-1"</code> and blocks activation.
        </li>
        <li>
          <code>openTriggers</code>: <code>NgpMenuTriggerType[]</code> —
          <code>'click' | 'hover' | 'focus' | 'enter' | 'arrowkey'</code>. Default
          <code>['click']</code>.
        </li>
        <li><code>flip</code>: <code>boolean</code> or options object. Default <code>true</code>.</li>
        <li><code>shift</code>: <code>boolean</code> or options object. Default enabled.</li>
        <li>
          <code>container</code>: <code>string | HTMLElement | null</code> — attach target. Default
          <code>document.body</code>.
        </li>
        <li>
          <code>scrollBehavior</code>: <code>'reposition' | 'block' | 'close'</code>. Default
          <code>'block'</code>.
        </li>
        <li><code>cooldown</code>, <code>showDelay</code>, <code>hideDelay</code>: <code>number</code> (ms). Default <code>0</code>.</li>
        <li><code>context</code>: value passed to the menu content.</li>
        <li><code>(openChange)</code>: <code>OutputEmitterRef&lt;boolean&gt;</code> — emits the new open state.</li>
        <li>
          Exported as <code>hellMenuTrigger</code> with the Anchored Surface Contract state: a
          reactive <code>open()</code> signal plus <code>show()</code>. Closing stays engine-owned
          (item select, outside click, Escape).
        </li>
      </ul>
      <p><strong><code>hellSubmenuTrigger</code></strong> — on a <code>[hellMenuItem]</code> host:</p>
      <ul>
        <li><code>hellSubmenuTrigger</code>: the child menu content to open.</li>
        <li><code>placement</code>: <code>NgpMenuPlacement</code>. Default <code>right-start</code>.</li>
        <li><code>offset</code>: <code>number</code> or axis object. Default <code>0</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Default <code>false</code>.</li>
        <li><code>flip</code>: <code>boolean</code> or options object. Default <code>true</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.</li>
      </ul>
      <p><strong>Items and content</strong>:</p>
      <ul>
        <li>
          <code>hellMenuItem</code> (button/anchor/div): <code>disabled</code>: <code>boolean</code>;
          <code>closeOnSelect</code>: <code>boolean</code> (default <code>true</code>);
          <code>ui</code>: <code>HellUiInput&lt;'root'&gt;</code>.
        </li>
        <li>
          <code>hellMenuItemCheckbox</code> (button): <code>checked</code>: <code>boolean</code>;
          <code>(checkedChange)</code>: <code>boolean</code>; <code>disabled</code>:
          <code>boolean</code>; <code>ui</code>. Stays open on toggle.
        </li>
        <li>
          <code>hellMenuItemRadioGroup</code>: <code>value</code>: <code>string | null</code>;
          <code>(valueChange)</code>: <code>string</code>. No <code>ui</code> (plain wrapper).
        </li>
        <li>
          <code>hellMenuItemRadio</code> (button): <code>value</code>: <code>string</code>
          (required); <code>disabled</code>: <code>boolean</code>; <code>ui</code>.
        </li>
        <li>
          <code>hellMenu</code>, <code>hellMenuItemIndicator</code>, <code>hellMenuSeparator</code>,
          <code>hellMenuSection</code>, <code>hellMenuLabel</code>, <code>hellMenuItemIcon</code>,
          <code>hellMenuItemTrailing</code>: each accepts a <code>ui</code>
          (<code>HellUiInput&lt;…&gt;</code>) that refines its <code>root</code> part.
        </li>
      </ul>
      <p>
        Exported types: <code>Hell&lt;Module&gt;Part</code> (always <code>'root'</code>) and
        <code>Hell&lt;Module&gt;Ui</code> (<code>HellUi&lt;…Part&gt;</code>) for
        <code>HellMenu</code>, <code>HellSubmenuTrigger</code>, <code>HellMenuItem</code>,
        <code>HellMenuItemCheckbox</code>, <code>HellMenuItemRadio</code>,
        <code>HellMenuItemIndicator</code>, <code>HellMenuSeparator</code>,
        <code>HellMenuSection</code>, <code>HellMenuLabel</code>, <code>HellMenuItemIcon</code>, and
        <code>HellMenuItemTrailing</code>. <code>HELL_MENU_IMPORTS</code> re-exports every
        directive for bulk <code>imports</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The panel is <code>role="menu"</code>; rows are <code>role="menuitem"</code>,
          <code>role="menuitemcheckbox"</code>, or <code>role="menuitemradio"</code>, and checkable
          rows expose <code>aria-checked</code>. The separator is <code>role="separator"</code> and
          a section is <code>role="group"</code>.
        </li>
        <li>
          Keyboard follows the ARIA menu pattern: arrow keys move between items with focus wrap,
          <kbd>Home</kbd>/<kbd>End</kbd> jump to the ends, typeahead matches by first letter, and
          <kbd>Escape</kbd> closes the menu and restores focus to the trigger.
        </li>
        <li>
          A submenu-trigger item carries <code>aria-haspopup="true"</code>; the arrow key toward the
          submenu opens it, and the opposite arrow returns to the parent.
        </li>
        <li>
          Triggers only bind to native <code>&lt;button&gt;</code> and <code>&lt;a&gt;</code> hosts,
          so activation semantics stay native. A disabled anchor trigger gets
          <code>aria-disabled="true"</code>, <code>tabindex="-1"</code>, and blocked
          click/<kbd>Enter</kbd> activation; a disabled non-native item
          (<code>&lt;a&gt;</code>/<code>&lt;div&gt;</code>) gets <code>aria-disabled="true"</code>
          with blocked activation, and disabled items stay perceivable.
        </li>
        <li>
          Give the panel an <code>aria-label</code> when its purpose is not obvious from the trigger
          text, and set an <code>aria-label</code> on an icon-only trigger such as the avatar
          account button.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use menus for compact action lists and overflow tied to a trigger.</li>
        <li>Group destructive or secondary actions with a separator and, when helpful, a section label.</li>
        <li>Add a submenu only when it genuinely reduces scanning cost.</li>
        <li>Use checkbox/radio items for preference toggles that belong in the menu model.</li>
        <li>Refine each part through its own <code>ui</code>; target the highlight with <code>data-hover</code>/<code>data-focus-visible</code>.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put form fields inside a menu — use a dialog or popover instead.</li>
        <li>Don't use menus for primary navigation when tabs or nav links fit better.</li>
        <li>Don't style menu rows from <code>[hellMenu]</code>'s <code>ui</code>; each row and slot owns its own part.</li>
        <li>Don't rely on a <code>data-active</code> attribute for highlight styling — it isn't emitted.</li>
      </ul>
    </article>
  `,
})
export class MenuPage {
  protected readonly menuBasicExampleCode = menuBasicExampleCodeRaw;
  protected readonly menuSectionsExampleCode = menuSectionsExampleCodeRaw;
  protected readonly menuCheckableExampleCode = menuCheckableExampleCodeRaw;
  protected readonly menuOptionsExampleCode = menuOptionsExampleCodeRaw;
  protected readonly menuProfileMenuExampleCode = menuProfileMenuExampleCodeRaw;
  protected readonly menuStylingExampleCode = menuStylingExampleCodeRaw;
}
