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
    MenuWithIconsSectionsSubmenusExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Menu</h1>
      <p>
        A floating list of actions, anchored to a trigger. Use for overflow menus and contextual
        actions; use <code>tabs</code> for navigation between sibling views. Supports leading icons,
        sectioned groups with labels, trailing slots, and nested submenus.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="menuBasicExampleCode">
        <app-menu-basic-example />
      </hd-example-tabs>

      <h2>With icons, sections &amp; submenus</h2>
      <hd-example-tabs [code]="menuWithIconsSectionsSubmenusExampleCode">
        <app-menu-with-icons-sections-submenus-example />
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
          <code>hellMenuSection</code> + <code>hellMenuLabel</code>: grouped items with a header.
        </li>
        <li><code>hellSubmenuTrigger</code>: nested menus on a <code>hellMenuItem</code>.</li>
        <li><code>hellMenuSeparator</code></li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use menus for compact action lists tied to a trigger.</li>
        <li>Group destructive or secondary actions with separators and labels.</li>
        <li>Use submenu only when it reduces scanning cost.</li>
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
}
