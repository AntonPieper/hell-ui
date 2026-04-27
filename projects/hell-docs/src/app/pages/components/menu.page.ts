import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidClock,
  faSolidDownload,
  faSolidFolderOpen,
  faSolidPenToSquare,
  faSolidShareNodes,
} from '@ng-icons/font-awesome/solid';
import { HellButton, HellIcon, HELL_MENU_DIRECTIVES } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

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
  imports: [ExampleTabs, HellButton, HellIcon, ...HELL_MENU_DIRECTIVES],
  template: `
    <article class="hd-prose">
      <h1>Menu</h1>
      <p>
        A floating list of actions, anchored to a trigger. Use for overflow menus and contextual
        actions; use <code>tabs</code> for navigation between sibling views. Supports leading icons,
        sectioned groups with labels, trailing slots, and nested submenus.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="exampleCodes[0]">
        <button hellButton [hellMenuTrigger]="basic" placement="bottom-start">Actions</button>

        <ng-template #basic>
          <div hellMenu>
            <button hellMenuItem type="button" (click)="onAction('rename')">Rename</button>
            <button hellMenuItem type="button" (click)="onAction('duplicate')">Duplicate</button>
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button" disabled>Move (disabled)</button>
            <button hellMenuItem type="button" (click)="onAction('archive')">Archive</button>
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button" class="hd-danger-text" (click)="onAction('delete')">
              Delete
            </button>
          </div>
        </ng-template>
      </hd-example-tabs>

      <h2>With icons, sections &amp; submenus</h2>
      <hd-example-tabs [code]="exampleCodes[1]">
        <button hellButton [hellMenuTrigger]="rich" placement="bottom-start">File</button>

        <ng-template #rich>
          <div hellMenu>
            <div hellMenuSection>
              <div hellMenuLabel>Document</div>
              <button hellMenuItem type="button" (click)="onAction('new')">
                <hell-icon name="faSolidPenToSquare" />
                <span>New file</span>
                <span hellMenuItemTrailing>⌘N</span>
              </button>
              <button hellMenuItem type="button" (click)="onAction('open')">
                <hell-icon name="faSolidFolderOpen" />
                <span>Open…</span>
                <span hellMenuItemTrailing>⌘O</span>
              </button>
              <button hellMenuItem type="button" [hellSubmenuTrigger]="recent">
                <hell-icon name="faSolidClock" />
                <span>Open recent</span>
              </button>
            </div>

            <div hellMenuSeparator></div>

            <div hellMenuSection>
              <div hellMenuLabel>Share</div>
              <button hellMenuItem type="button" (click)="onAction('export')">
                <hell-icon name="faSolidShareNodes" />
                <span>Share link</span>
              </button>
              <button hellMenuItem type="button" (click)="onAction('download')">
                <hell-icon name="faSolidDownload" />
                <span>Download</span>
                <span hellMenuItemTrailing>⌘⇧D</span>
              </button>
            </div>
          </div>
        </ng-template>

        <ng-template #recent>
          <div hellMenu>
            <button hellMenuItem type="button" (click)="onAction('recent:atlas')">
              Project Atlas
            </button>
            <button hellMenuItem type="button" (click)="onAction('recent:nova')">
              Nova roadmap
            </button>
            <button hellMenuItem type="button" (click)="onAction('recent:pulse')">
              Pulse weekly
            </button>
          </div>
        </ng-template>
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
  protected readonly exampleCodes = [
    '<button hellButton [hellMenuTrigger]="basic" placement="bottom-start">\n  Actions\n</button>\n\n<ng-template #basic>\n  <div hellMenu>\n    <button hellMenuItem type="button">Rename</button>\n    <button hellMenuItem type="button">Duplicate</button>\n    <div hellMenuSeparator></div>\n    <button hellMenuItem type="button">Archive</button>\n  </div>\n</ng-template>\n',
    '<button hellButton [hellMenuTrigger]="rich" placement="bottom-start">\n  File\n</button>\n\n<ng-template #rich>\n  <div hellMenu>\n    <div hellMenuSection>\n      <div hellMenuLabel>Document</div>\n      <button hellMenuItem type="button">Open</button>\n      <button hellMenuItem type="button">Save as\u2026</button>\n    </div>\n    <div hellMenuSeparator></div>\n    <button hellMenuItem type="button">\n      <span hellMenuItemIcon>\u2318</span>\n      Export\n      <span hellMenuItemTrailing>PDF</span>\n    </button>\n  </div>\n</ng-template>\n',
  ] as const;
  protected onAction(name: string) {
    console.log('menu action:', name);
  }
}
