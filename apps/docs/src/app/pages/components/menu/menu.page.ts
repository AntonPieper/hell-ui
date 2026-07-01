import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { ExampleTabs } from '../../../shared/example-tabs';
import { MenuBasicExample } from './examples/basic.example';
import menuBasicExampleCodeRaw from './examples/basic.example.ts?raw' with { loader: 'text' };
import { MenuWithIconsSectionsSubmenusExample } from './examples/with-icons-sections-submenus.example';
import menuWithIconsSectionsSubmenusExampleCodeRaw from './examples/with-icons-sections-submenus.example.ts?raw' with {
  loader: 'text',
};
import { MenuStylingExample } from './examples/styling.example';
import menuStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

const HD_MENU_PAGE_ICONS = {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
};

@Component({
  selector: 'hd-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HD_MENU_PAGE_ICONS)],
  imports: [
    ExampleTabs,
    ...HELL_MENU_DIRECTIVES,
    MenuBasicExample,
    MenuWithIconsSectionsSubmenusExample, MenuStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Menu</h1>
      <p>
        A floating list of actions, anchored to a trigger. Use for overflow menus and contextual
        actions; use <code>tabs</code> for navigation between sibling views. Supports leading icons,
        sectioned groups with labels, trailing slots, nested submenus, and checkable multi-select
        menu items.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="menuBasicExampleCode">
        <app-menu-basic-example />
      </hd-example-tabs>

      <h2>With icons, sections &amp; submenus</h2>
      <hd-example-tabs [code]="menuWithIconsSectionsSubmenusExampleCode">
        <app-menu-with-icons-sections-submenus-example />
      </hd-example-tabs>

      <h2>Part style map</h2>
      <p>
        The menu panel and each item expose their own <code>root</code> Public Part (<code>HellMenuUi</code>, <code>HellMenuItemUi</code>). Use state attributes such as <code>data-active</code> for highlight styling instead of hover-only CSS.
      </p>
      <hd-example-tabs [code]="menuStylingExampleCode">
        <app-menu-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>hellMenuTrigger</code>: bind to a <code>&lt;ng-template&gt;</code></li>
        <li><code>placement</code>, <code>offset</code>, <code>disabled</code></li>
        <li>
          <code>hellMenuItem</code>: <code>disabled</code>; accepts an inline icon (<code
            >&lt;hell-icon&gt;</code
          >
          or <code>[hellMenuItemIcon]</code>) and a trailing slot
          (<code>[hellMenuItemTrailing]</code>).
        </li>
        <li>
          <code>hellMenuItemCheckbox</code> + <code>hellMenuItemIndicator</code>: multi-select menu
          rows that stay open on toggle; works in root menus and submenus.
        </li>
        <li>
          <code>hellMenuSection</code> + <code>hellMenuLabel</code>: grouped items with a header.
        </li>
        <li><code>hellSubmenuTrigger</code>: nested menus on a <code>hellMenuItem</code>.</li>
        <li><code>hellMenuSeparator</code></li>
        <li><code>ui</code>: Part Style Map for each styled directive's local <code>root</code> part. Portaled menu surfaces render <code>data-slot="root"</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use menus for compact action lists tied to a trigger.</li>
        <li>Group destructive or secondary actions with separators and labels.</li>
        <li>Use submenu only when it reduces scanning cost.</li>
        <li>
          Use checkbox menu items for compact preference toggles that belong in the menu model.
        </li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put form fields inside a menu.</li>
        <li>Don't use menus for primary navigation when tabs or links fit better.</li>
      </ul>
    </article>
  `,
})
export class MenuPage {
  protected readonly menuBasicExampleCode = menuBasicExampleCodeRaw;
  protected readonly menuWithIconsSectionsSubmenusExampleCode =
    menuWithIconsSectionsSubmenusExampleCodeRaw;
  protected readonly menuStylingExampleCode = menuStylingExampleCodeRaw;
}
